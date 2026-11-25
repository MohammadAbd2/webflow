import os
import re
import json
from datetime import datetime
from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select, func, inspect, text, or_
from .db import Base, engine, get_db
from .models import User, UserTag, Project, ProjectStep, Team, TeamMember, Sprint, Task, Contract, ContractSignature, CancellationRequest, ProjectRequest, ProjectRequestComment, EmployeeReview, Notification, Conversation, ConversationMember, Message
from .schemas import RegisterIn, LoginIn, AccountUpdateIn, ProjectIn, ProjectStepIn, ProjectRequestIn, ProjectRequestCommentIn, EmployeeProfileIn, EmployeeReviewIn, EmployeeReviewUpdateIn, UserTagIn, UserRoleIn, TeamIn, TeamBatchIn, TeamReviewIn, TaskIn, SprintIn, TaskSprintIn, DecisionIn, ContractReviewIn, CancelIn, ConversationIn, MessageIn, NotificationReadIn, UserStatusIn
from .security import hash_password, verify_password, issue_token, current_user, require_roles

app = FastAPI(title="Webflow Project Hub API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","), allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "/data/contracts"))

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    # create_all handles new tables but does not add columns to volumes created by older app builds.
    user_columns = {column["name"] for column in inspect(engine).get_columns("users")}
    if "experience_points" not in user_columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE users ADD COLUMN experience_points INTEGER NOT NULL DEFAULT 0"))
    user_columns = {column["name"] for column in inspect(engine).get_columns("users")}
    with engine.begin() as connection:
        if "username" not in user_columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN username VARCHAR(160) NULL"))
            connection.execute(text("CREATE UNIQUE INDEX ix_users_username ON users (username)"))
        if "services_json" not in user_columns: connection.execute(text("ALTER TABLE users ADD COLUMN services_json TEXT NULL"))
        if "portfolio_json" not in user_columns: connection.execute(text("ALTER TABLE users ADD COLUMN portfolio_json TEXT NULL"))
        if "profile_photo_url" not in user_columns: connection.execute(text("ALTER TABLE users ADD COLUMN profile_photo_url VARCHAR(1000) NULL"))
    review_columns = {column["name"] for column in inspect(engine).get_columns("employee_reviews")}
    if "service" not in review_columns:
        with engine.begin() as connection: connection.execute(text("ALTER TABLE employee_reviews ADD COLUMN service VARCHAR(160) NOT NULL DEFAULT 'Overall'"))
    task_columns = {column["name"] for column in inspect(engine).get_columns("tasks")}
    if "sprint_id" not in task_columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE tasks ADD COLUMN sprint_id INTEGER NULL"))
    team_columns = {column["name"] for column in inspect(engine).get_columns("teams")}
    if "review_status" not in team_columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE teams ADD COLUMN review_status VARCHAR(30) NOT NULL DEFAULT 'pending'"))
    admin_email = os.getenv("BOOTSTRAP_ADMIN_EMAIL")
    admin_password = os.getenv("BOOTSTRAP_ADMIN_PASSWORD")
    if admin_email and admin_password:
        from .db import SessionLocal
        with SessionLocal() as db:
            if not db.scalar(select(User).where(User.email == admin_email)):
                db.add(User(name="Workspace Admin", email=admin_email, password_hash=hash_password(admin_password), role="admin"))
                db.commit()
    from .db import SessionLocal
    with SessionLocal() as db:
        if not db.scalar(select(UserTag.id).limit(1)):
            db.add_all([UserTag(key=key,name=name) for key,name in [("product_owner","Product owner"),("scrum_master","Scrum master"),("developer","Developer"),("designer","Designer"),("content","Content specialist"),("qa","Quality assurance")]])
            db.commit()

def user_json(u):
    return {"id":u.id,"name":u.name,"username":u.username,"email":u.email,"role":u.role,"active":u.active,"tags":u.tags.split(",") if u.tags else [],"level":u.level,"experience_points":u.experience_points,"services":json.loads(u.services_json or "[]"),"portfolio":json.loads(u.portfolio_json or "[]"),"profile_photo_url":u.profile_photo_url}

def project_json(p, db=None):
    client = db.get(User, p.client_id) if db else None
    owner = db.get(User, p.owner_id) if db else None
    return {"id":p.id,"name":p.name,"description":p.description,"client_id":p.client_id,"client_name":client.name if client else None,"owner_id":p.owner_id,"owner_name":owner.name if owner else None,"stage":p.stage,"progress":p.progress,"target_date":p.target_date,"setup_status":p.setup_status,"cancellation_status":p.cancellation_status}

def task_json(t):
    return {"id":t.id,"project_id":t.project_id,"team_id":t.team_id,"title":t.title,"description":t.description,"status":t.status,"priority":t.priority,"complexity":t.complexity,"story_points":t.story_points,"assignee_id":t.assignee_id,"sprint_id":t.sprint_id,"ai_generated":t.ai_generated,"due_date":t.due_date}

def add_notification(db:Session,user_id:int,kind:str,title:str,body:str="",target:str=""):
    db.add(Notification(user_id=user_id,kind=kind,title=title,body=body,target=target))

def notification_json(n:Notification):
    return {"id":n.id,"kind":n.kind,"title":n.title,"body":n.body,"target":n.target,"read":n.read_at is not None,"created_at":n.created_at}

def message_json(m:Message,user_id:int):
    state="read" if m.read_at else "delivered" if m.delivered_at else "sent"
    return {"id":m.id,"sender_id":m.sender_id,"body":m.body,"status":state if m.sender_id==user_id else None,"created_at":m.created_at}

@app.get("/health")
def health(): return {"status":"ok"}

@app.post("/auth/register", status_code=201)
def register(data: RegisterIn, db: Session=Depends(get_db)):
    if data.role not in ("client", "employee"):
        raise HTTPException(400, "Public registration is for clients and employees; admins are provisioned by the workspace.")
    if db.scalar(select(User).where(func.lower(User.email) == str(data.email).lower())):
        raise HTTPException(409, "An account with this email already exists")
    user=User(name=data.name,email=str(data.email).lower(),password_hash=hash_password(data.password),role=data.role)
    db.add(user); db.commit(); db.refresh(user)
    return {"access_token":issue_token(user),"token_type":"bearer","user":user_json(user)}

@app.post("/auth/login")
def login(data: LoginIn, db: Session=Depends(get_db)):
    identity = data.email.strip().lower()
    field = User.email if "@" in identity else User.username
    user = db.scalar(select(User).where(func.lower(field) == identity))
    if not user or not verify_password(data.password,user.password_hash):
        if user:
            add_notification(db,user.id,"security","Unsuccessful sign-in attempt","A login attempt with incorrect credentials was blocked.")
            db.commit()
        raise HTTPException(401,"Incorrect username, email, or password")
    if not user.active:
        raise HTTPException(403,"This account is suspended. Contact workspace support.")
    add_notification(db,user.id,"security","New sign-in","A new sign-in to your Webflow account was successful.")
    db.commit()
    return {"access_token":issue_token(user),"token_type":"bearer","user":user_json(user)}

@app.get("/auth/me")
def me(user: User=Depends(current_user)): return user_json(user)

@app.patch("/auth/me")
def update_account(data: AccountUpdateIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    if not verify_password(data.current_password, user.password_hash):
        raise HTTPException(403, "Current password is incorrect")
    username = data.username.strip().lower() if data.username else user.username
    if username is not None and not re.fullmatch(r"[a-z0-9_.-]{2,160}", username):
        raise HTTPException(422, "Use 2–160 letters, numbers, periods, underscores, or hyphens for your username")
    email = str(data.email).lower()
    if db.scalar(select(User.id).where(User.id != user.id, func.lower(User.email) == email)):
        raise HTTPException(409, "An account with this email already exists")
    updates = {"username": username, "email": email}
    if data.new_password:
        updates["password_hash"] = hash_password(data.new_password)
    # Prevent a concurrent suspension or password change from authorizing a stale update.
    try:
        updated = db.query(User).filter(
            User.id == user.id, User.active.is_(True), User.password_hash == user.password_hash
        ).update(updates)
        if not updated:
            raise HTTPException(409, "Account access changed. Sign in again before updating your settings.")
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "That username or email is already in use")
    return user_json(user)

@app.get("/users")
def users(q:str="",role:str="",limit:int=30,offset:int=0,db: Session=Depends(get_db), user: User=Depends(current_user)):
    query=select(User).where(User.active.is_(True))
    if role in {"admin","employee","client"}: query=query.where(User.role==role)
    if q.strip():
        term=q.strip()
        query=query.where(or_(func.lower(User.name).contains(term.lower()),func.lower(User.email).contains(term.lower()),User.id==int(term) if term.isdigit() else text("0=1")))
    return [user_json(u) for u in db.scalars(query.order_by(User.name).offset(max(offset,0)).limit(min(max(limit,1),50))).all()]

@app.get("/employees")
def employee_directory(q:str="",tag:str="",team_id:int=0,limit:int=30,offset:int=0,db:Session=Depends(get_db),viewer:User=Depends(current_user)):
    query=select(User).where(User.role=="employee",User.active.is_(True))
    if tag in {"product_owner","scrum_master"}: query=query.where(User.tags.contains(tag))
    if team_id:
        team=db.get(Team,team_id)
        project=db.get(Project,team.project_id) if team else None
        if not team or not project or not can_view_project(db,project,viewer): raise HTTPException(404,"Project team not found")
        member_ids=select(TeamMember.user_id).where(TeamMember.team_id==team_id,TeamMember.invitation_status=="accepted")
        query=query.where(User.id.in_(member_ids))
    if q.strip():
        term=q.strip()
        query=query.where(or_(func.lower(User.name).contains(term.lower()),User.id==int(term) if term.isdigit() else text("0=1")))
    users=db.scalars(query.order_by(User.level.desc(),User.name).offset(max(offset,0)).limit(min(max(limit,1),50))).all()
    rows=[]
    for employee in users:
        tags=employee.tags.split(",") if employee.tags else []
        if tag=="member" and "product_owner" in tags: continue
        if tag and tag!="member" and tag not in tags: continue
        average=db.scalar(select(func.avg(EmployeeReview.rating)).where(EmployeeReview.employee_id==employee.id))
        rows.append({"id":employee.id,"name":employee.name,"role":"employee","primary_tag":tags[0].replace("_"," ").title() if tags else "Employee","tags":tags,"level":employee.level,"rating":round(float(average),1) if average is not None else None,"services":json.loads(employee.services_json or "[]"),"portfolio":json.loads(employee.portfolio_json or "[]"),"profile_photo_url":employee.profile_photo_url})
    return rows

@app.patch("/employees/me/profile")
def update_employee_profile(data:EmployeeProfileIn,db:Session=Depends(get_db),employee:User=Depends(require_roles("employee"))):
    def clean(values):
        result=list(dict.fromkeys(value.strip() for value in values if value.strip()))
        if any(len(value)>160 for value in result): raise HTTPException(400,"Profile entries must be 160 characters or less")
        return result
    employee.services_json=json.dumps(clean(data.services))
    portfolio=[]
    for item in data.portfolio:
        if isinstance(item,str):
            title=item.strip()
            if title: portfolio.append({"title":title,"service":"","description":"","image_urls":[],"external_urls":[]})
        else:
            value=item.model_dump()
            value["title"]=value["title"].strip()
            value["service"]=value["service"].strip()
            value["description"]=value["description"].strip()
            value["image_urls"]=[url.strip() for url in value["image_urls"] if url.strip()]
            value["external_urls"]=[url.strip() for url in value["external_urls"] if url.strip()]
            if any(not url.startswith(("https://","http://")) and not (url.startswith("/portfolio/") and ".." not in url) for url in value["image_urls"]): raise HTTPException(400,"Portfolio images must use http(s) or a /portfolio/ asset path")
            if any(not url.startswith(("https://","http://")) for url in value["external_urls"]): raise HTTPException(400,"External project links must use http:// or https://")
            portfolio.append(value)
    employee.portfolio_json=json.dumps(portfolio)
    employee.profile_photo_url=data.profile_photo_url.strip() if data.profile_photo_url else None
    db.commit();db.refresh(employee)
    return user_json(employee)

@app.post("/employees/{employee_id}/reviews",status_code=201)
def review_employee(employee_id:int,data:EmployeeReviewIn,db:Session=Depends(get_db),client:User=Depends(require_roles("client"))):
    employee=db.get(User,employee_id)
    if not employee or employee.role!="employee" or not employee.active: raise HTTPException(404,"Employee not found")
    project=db.get(Project,data.project_id)
    if not project or project.client_id!=client.id: raise HTTPException(404,"Project not found")
    if project.progress < 100: raise HTTPException(409,"Service reviews open after the project is complete")
    service_name=data.service.strip()
    services=json.loads(employee.services_json or "[]")
    if service_name!="Overall" and service_name not in services: raise HTTPException(400,"Choose a service listed on this employee's profile")
    assigned=project.owner_id==employee.id or db.scalar(select(TeamMember.id).join(Team).where(Team.project_id==project.id,TeamMember.user_id==employee.id,TeamMember.invitation_status=="accepted")) is not None
    if not assigned: raise HTTPException(403,"You can only review a member of your project")
    review=db.scalar(select(EmployeeReview).where(EmployeeReview.employee_id==employee.id,EmployeeReview.client_id==client.id,EmployeeReview.project_id==project.id,EmployeeReview.service==service_name))
    if review:
        review.rating=data.rating;review.service=service_name;review.comment=data.comment.strip()
    else:
        review=EmployeeReview(employee_id=employee.id,client_id=client.id,project_id=project.id,rating=data.rating,service=service_name,comment=data.comment.strip());db.add(review)
    db.commit();db.refresh(review)
    return {"id":review.id,"rating":review.rating,"service":review.service,"comment":review.comment,"created_at":review.created_at}

@app.get("/employees/{employee_id}/reviews")
def employee_reviews(employee_id:int,db:Session=Depends(get_db),viewer:User=Depends(current_user)):
    employee=db.get(User,employee_id)
    if not employee or employee.role!="employee": raise HTTPException(404,"Employee not found")
    rows=db.scalars(select(EmployeeReview).where(EmployeeReview.employee_id==employee_id).order_by(EmployeeReview.created_at.desc())).all()
    return [{"id":row.id,"rating":row.rating,"service":row.service,"comment":row.comment,"client_name":db.get(User,row.client_id).name,"project_name":db.get(Project,row.project_id).name,"project_id":row.project_id,"created_at":row.created_at} for row in rows]

@app.patch("/admin/reviews/{review_id}")
def update_employee_review(review_id:int,data:EmployeeReviewUpdateIn,db:Session=Depends(get_db),admin:User=Depends(require_roles("admin"))):
    review=db.get(EmployeeReview,review_id)
    if not review: raise HTTPException(404,"Review not found")
    review.rating=data.rating;review.service=data.service.strip();review.comment=data.comment.strip();db.commit()
    return {"id":review.id,"rating":review.rating,"service":review.service,"comment":review.comment}

@app.delete("/admin/reviews/{review_id}")
def delete_employee_review(review_id:int,db:Session=Depends(get_db),admin:User=Depends(require_roles("admin"))):
    review=db.get(EmployeeReview,review_id)
    if not review: raise HTTPException(404,"Review not found")
    db.delete(review);db.commit();return {"deleted":True,"id":review_id}

@app.get("/admin/reviews")
def admin_employee_reviews(db:Session=Depends(get_db),admin:User=Depends(require_roles("admin"))):
    rows=db.scalars(select(EmployeeReview).order_by(EmployeeReview.created_at.desc()).limit(200)).all()
    return [{"id":row.id,"employee_id":row.employee_id,"employee_name":db.get(User,row.employee_id).name,"client_id":row.client_id,"client_name":db.get(User,row.client_id).name,"project_id":row.project_id,"project_name":db.get(Project,row.project_id).name,"service":row.service,"rating":row.rating,"comment":row.comment,"created_at":row.created_at} for row in rows]

@app.patch("/users/{user_id}/tags")
def set_tags(user_id: int, tags: list[str], db: Session=Depends(get_db), admin: User=Depends(require_roles("admin"))):
    user=db.get(User,user_id)
    if not user: raise HTTPException(404,"User not found")
    selected=list(dict.fromkeys(t.strip() for t in tags if t.strip()))
    known=set(db.scalars(select(UserTag.key)).all())
    if any(tag not in known for tag in selected): raise HTTPException(400,"Choose tags from the workspace tag list")
    user.tags=",".join(selected); db.commit()
    return user_json(user)

@app.get("/projects")
def list_projects(db: Session=Depends(get_db), user: User=Depends(current_user)):
    stmt=select(Project)
    if user.role=="client": stmt=stmt.where(Project.client_id==user.id)
    elif user.role=="employee":
        team_ids=select(TeamMember.team_id).where(TeamMember.user_id==user.id,TeamMember.invitation_status=="accepted")
        stmt=stmt.where((Project.owner_id==user.id)|(Project.id.in_(select(Team.project_id).where(Team.id.in_(team_ids)))))
    return [project_json(p,db) for p in db.scalars(stmt.order_by(Project.created_at.desc())).all()]

@app.post("/projects",status_code=201)
def create_project(data: ProjectIn, db: Session=Depends(get_db), user: User=Depends(require_roles("admin","client","employee"))):
    if user.role=="client" and data.client_id!=user.id: raise HTTPException(403,"Clients can create projects only for their own account")
    if user.role=="employee" and (data.owner_id!=user.id or "product_owner" not in (user.tags or "").split(",")): raise HTTPException(403,"Only a tagged product owner can create a project")
    client=db.get(User,data.client_id); owner=db.get(User,data.owner_id)
    if not client or not owner: raise HTTPException(404,"Client or project owner not found")
    if user.role=="client" and (owner.role!="employee" or "product_owner" not in (owner.tags or "").split(",")): raise HTTPException(400,"Choose an employee tagged as a product owner")
    if len(data.steps)>20: raise HTTPException(400,"A project can have up to 20 delivery steps")
    project=Project(name=data.name,description=data.description,client_id=data.client_id,owner_id=data.owner_id,target_date=data.target_date,setup_status="draft")
    db.add(project); db.flush()
    project_steps=data.steps or [ProjectStepIn(name="Design"),ProjectStepIn(name="Development"),ProjectStepIn(name="Optimisation & launch")]
    for position,step in enumerate(project_steps):
        db.add(ProjectStep(project_id=project.id,name=step.name.strip(),description=step.description,position=position))
    add_notification(db,project.owner_id,"project","New project setup request",f"{project.name} needs a delivery plan and team proposal.",f"/projects/{project.id}")
    db.commit(); db.refresh(project)
    return project_json(project,db)


def request_json(db:Session,row:ProjectRequest):
    client=db.get(User,row.client_id)
    owner=db.get(User,row.requested_owner_id) if row.requested_owner_id else None
    comments=db.scalars(select(ProjectRequestComment).where(ProjectRequestComment.request_id==row.id).order_by(ProjectRequestComment.created_at)).all()
    return {"id":row.id,"client_id":row.client_id,"client_name":client.name if client else "Client","requested_owner_id":row.requested_owner_id,"requested_owner_name":owner.name if owner else None,"project_id":row.project_id,"name":row.name,"description":row.description,"steps":json.loads(row.steps_json or "[]"),"target_date":row.target_date,"status":row.status,"created_at":row.created_at,"comments":[{"id":c.id,"sender_id":c.sender_id,"sender_name":db.get(User,c.sender_id).name,"body":c.body,"created_at":c.created_at} for c in comments]}

@app.get("/project-requests")
def list_project_requests(db:Session=Depends(get_db),user:User=Depends(current_user)):
    stmt=select(ProjectRequest).order_by(ProjectRequest.created_at.desc())
    if user.role=="client": stmt=stmt.where(ProjectRequest.client_id==user.id)
    elif user.role=="employee":
        if "product_owner" not in (user.tags or "").split(","): raise HTTPException(403,"Only tagged product owners can view client requests")
        stmt=stmt.where((ProjectRequest.requested_owner_id.is_(None))|(ProjectRequest.requested_owner_id==user.id))
    return [request_json(db,row) for row in db.scalars(stmt).all()]

@app.post("/project-requests",status_code=201)
def create_project_request(data:ProjectRequestIn,db:Session=Depends(get_db),client:User=Depends(require_roles("client"))):
    if len(data.steps)>20: raise HTTPException(400,"A request can have at most 20 delivery steps")
    names=[step.name.strip().casefold() for step in data.steps]
    if any(not name for name in names) or len(names)!=len(set(names)): raise HTTPException(400,"Step names must be unique and non-empty")
    owner=None
    if data.requested_owner_id is not None:
        owner=db.get(User,data.requested_owner_id)
        if not owner or owner.role!="employee" or not owner.active or "product_owner" not in (owner.tags or "").split(","):
            raise HTTPException(400,"Choose an active employee tagged as a product owner")
    row=ProjectRequest(client_id=client.id,requested_owner_id=owner.id if owner else None,name=data.name.strip(),description=data.description.strip(),steps_json=json.dumps([step.model_dump() for step in data.steps]),target_date=data.target_date,status="open")
    db.add(row);db.flush()
    if data.message.strip(): db.add(ProjectRequestComment(request_id=row.id,sender_id=client.id,body=data.message.strip()))
    recipients=[owner] if owner else db.scalars(select(User).where(User.role=="employee",User.active.is_(True))).all()
    for recipient in recipients:
        if "product_owner" in (recipient.tags or "").split(","):
            add_notification(db,recipient.id,"project","New client project request",row.name,"/project-requests")
    db.commit();db.refresh(row)
    return request_json(db,row)

@app.post("/project-requests/{request_id}/comments",status_code=201)
def add_project_request_comment(request_id:int,data:ProjectRequestCommentIn,db:Session=Depends(get_db),user:User=Depends(current_user)):
    row=db.get(ProjectRequest,request_id)
    if not row: raise HTTPException(404,"Project request not found")
    if user.role=="client" and row.client_id!=user.id: raise HTTPException(403,"This is not your request")
    if user.role=="employee":
        if "product_owner" not in (user.tags or "").split(","): raise HTTPException(403,"Only tagged product owners can reply to client requests")
        if row.requested_owner_id and row.requested_owner_id!=user.id: raise HTTPException(403,"This request was assigned to another product owner")
    if user.role not in ("client","employee","admin"): raise HTTPException(403,"Not allowed to comment on this request")
    comment=ProjectRequestComment(request_id=row.id,sender_id=user.id,body=data.body.strip());db.add(comment)
    recipient=row.client_id if user.role=="employee" else row.requested_owner_id
    if recipient and recipient!=user.id: add_notification(db,recipient,"project","New project request comment",row.name,"/project-requests")
    db.commit();db.refresh(comment)
    return {"id":comment.id,"sender_id":user.id,"sender_name":user.name,"body":comment.body,"created_at":comment.created_at}

@app.post("/project-requests/{request_id}/accept")
def accept_project_request(request_id:int,db:Session=Depends(get_db),owner:User=Depends(require_roles("employee"))):
    row=db.get(ProjectRequest,request_id)
    if not row: raise HTTPException(404,"Project request not found")
    if "product_owner" not in (owner.tags or "").split(","): raise HTTPException(403,"Only tagged product owners can accept client requests")
    if row.requested_owner_id and row.requested_owner_id!=owner.id: raise HTTPException(403,"This request is assigned to another product owner")
    if row.status!="open": raise HTTPException(409,"This request has already been accepted")
    project=Project(name=row.name,description=row.description,client_id=row.client_id,owner_id=owner.id,target_date=row.target_date,setup_status="draft")
    db.add(project);db.flush()
    steps=json.loads(row.steps_json or "[]") or [{"name":"Design","description":""},{"name":"Development","description":""},{"name":"Optimisation & launch","description":""}]
    for position,step in enumerate(steps): db.add(ProjectStep(project_id=project.id,name=step["name"].strip(),description=step.get("description", ""),position=position))
    row.requested_owner_id=owner.id;row.project_id=project.id;row.status="owner_selected"
    add_notification(db,row.client_id,"project","Product owner accepted your request",f"{project.name} · {owner.name} will prepare the team plan.",f"/projects/{project.id}")
    db.commit();db.refresh(row)
    return {"request":request_json(db,row),"project":project_json(project,db)}

def can_view_project(db:Session,project:Project,user:User)->bool:
    if user.role=="admin" or user.id in (project.client_id,project.owner_id): return True
    return db.scalar(select(TeamMember.id).join(Team).where(Team.project_id==project.id,TeamMember.user_id==user.id,TeamMember.invitation_status=="accepted")) is not None

def step_json(step:ProjectStep):
    return {"id":step.id,"name":step.name,"description":step.description,"position":step.position,"progress":step.progress,"status":"done" if step.progress==100 else "in_progress" if step.progress>0 else "todo"}

@app.get("/projects/{project_id}/steps")
def list_project_steps(project_id:int,db:Session=Depends(get_db),user:User=Depends(current_user)):
    project=db.get(Project,project_id)
    if not project: raise HTTPException(404,"Project not found")
    if not can_view_project(db,project,user): raise HTTPException(403,"Not a member of this project")
    return [step_json(s) for s in db.scalars(select(ProjectStep).where(ProjectStep.project_id==project_id).order_by(ProjectStep.position)).all()]

@app.put("/projects/{project_id}/steps")
def update_project_steps(project_id:int,steps:list[ProjectStepIn],db:Session=Depends(get_db),user:User=Depends(require_roles("admin","employee"))):
    project=db.get(Project,project_id)
    if not project: raise HTTPException(404,"Project not found")
    if user.role=="employee" and (user.id!=project.owner_id or "product_owner" not in (user.tags or "").split(",")): raise HTTPException(403,"Only the tagged project owner can edit delivery steps")
    if not steps: raise HTTPException(400,"A project must keep at least one delivery step")
    if len(steps)>20: raise HTTPException(400,"A project can have up to 20 delivery steps")
    names=[s.name.strip().casefold() for s in steps]
    if any(not name for name in names) or len(names)!=len(set(names)): raise HTTPException(400,"Step names must be unique and non-empty")
    old=db.scalars(select(ProjectStep).where(ProjectStep.project_id==project_id).order_by(ProjectStep.position)).all()
    progress_by_name={s.name.casefold():s.progress for s in old}
    for s in old: db.delete(s)
    db.flush()
    for position,step in enumerate(steps):
        name=step.name.strip()
        db.add(ProjectStep(project_id=project_id,name=name,description=step.description.strip(),position=position,progress=progress_by_name.get(name.casefold(),0)))
    total=len(steps)
    project.progress=round(sum(progress_by_name.get(name,0) for name in names)/total)
    project.stage=next((step.name.strip() for step in steps if progress_by_name.get(step.name.strip().casefold(),0)<100),steps[-1].name.strip())
    db.commit()
    return [step_json(s) for s in db.scalars(select(ProjectStep).where(ProjectStep.project_id==project_id).order_by(ProjectStep.position)).all()]

@app.patch("/projects/{project_id}/steps/{step_id}")
def update_step_progress(project_id:int,step_id:int,progress:int,db:Session=Depends(get_db),user:User=Depends(require_roles("admin","employee"))):
    project=db.get(Project,project_id); step=db.get(ProjectStep,step_id)
    if not project or not step or step.project_id!=project_id: raise HTTPException(404,"Project step not found")
    if user.role=="employee" and (user.id!=project.owner_id or "product_owner" not in (user.tags or "").split(",")): raise HTTPException(403,"Only the tagged project owner can update step progress")
    if not 0<=progress<=100: raise HTTPException(400,"Progress must be between 0 and 100")
    step.progress=progress
    rows=db.scalars(select(ProjectStep).where(ProjectStep.project_id==project_id).order_by(ProjectStep.position)).all()
    project.progress=round(sum(s.progress for s in rows)/len(rows))
    project.stage=next((s.name for s in rows if s.progress<100),rows[-1].name)
    db.commit(); return step_json(step)

@app.get("/notifications")
def list_notifications(limit:int=30,db:Session=Depends(get_db),user:User=Depends(current_user)):
    rows=db.scalars(select(Notification).where(Notification.user_id==user.id).order_by(Notification.created_at.desc()).limit(min(max(limit,1),100))).all()
    return [notification_json(n) for n in rows]

@app.patch("/notifications/read")
def mark_notifications_read(data:NotificationReadIn,db:Session=Depends(get_db),user:User=Depends(current_user)):
    stmt=select(Notification).where(Notification.user_id==user.id,Notification.read_at.is_(None))
    if not data.all:
        if not data.ids: return {"marked_read":0}
        stmt=stmt.where(Notification.id.in_(data.ids))
    rows=db.scalars(stmt).all()
    now=datetime.utcnow()
    for row in rows: row.read_at=now
    db.commit(); return {"marked_read":len(rows)}

@app.patch("/admin/users/{user_id}/status")
def update_user_status(user_id:int,data:UserStatusIn,db:Session=Depends(get_db),admin:User=Depends(require_roles("admin"))):
    target=db.get(User,user_id)
    if not target: raise HTTPException(404,"User not found")
    if target.id==admin.id and not data.active: raise HTTPException(400,"You cannot suspend your own admin account")
    target.active=data.active
    add_notification(db,target.id,"security","Account reactivated" if data.active else "Account suspended","An administrator changed the status of your account.")
    db.commit(); return {"id":target.id,"active":target.active}

@app.get("/admin/users")
def admin_users(q:str="",role:str="",limit:int=50,offset:int=0,db:Session=Depends(get_db),admin:User=Depends(require_roles("admin"))):
    query=select(User)
    if role in {"admin","employee","client"}: query=query.where(User.role==role)
    if q.strip():
        term=q.strip();query=query.where(or_(func.lower(User.name).contains(term.lower()),func.lower(User.email).contains(term.lower()),User.id==int(term) if term.isdigit() else text("0=1")))
    return [user_json(row) for row in db.scalars(query.order_by(User.name).offset(max(offset,0)).limit(min(max(limit,1),100))).all()]

@app.patch("/admin/users/{user_id}/role")
def update_user_role(user_id:int,data:UserRoleIn,db:Session=Depends(get_db),admin:User=Depends(require_roles("admin"))):
    if data.role not in {"admin","employee","client"}: raise HTTPException(400,"Role must be admin, employee, or client")
    target=db.get(User,user_id)
    if not target: raise HTTPException(404,"User not found")
    if target.id==admin.id and data.role!="admin": raise HTTPException(400,"You cannot change your own administrator role")
    if target.role=="admin" and data.role!="admin" and db.scalar(select(func.count(User.id)).where(User.role=="admin",User.active.is_(True)))<=1: raise HTTPException(409,"Keep at least one active administrator")
    target.role=data.role
    if data.role!="employee": target.tags=""
    db.commit();return user_json(target)

@app.get("/admin/tags")
def list_workspace_tags(db:Session=Depends(get_db),admin:User=Depends(require_roles("admin"))):
    return [{"id":tag.id,"key":tag.key,"name":tag.name,"user_count":db.scalar(select(func.count(User.id)).where(User.tags.contains(tag.key))) or 0} for tag in db.scalars(select(UserTag).order_by(UserTag.name)).all()]

@app.post("/admin/tags",status_code=201)
def create_workspace_tag(data:UserTagIn,db:Session=Depends(get_db),admin:User=Depends(require_roles("admin"))):
    key=re.sub(r"[^a-z0-9]+","_",data.name.strip().lower()).strip("_")
    if not key: raise HTTPException(400,"Tag name needs letters or numbers")
    if len(key)>80: raise HTTPException(400,"Tag key must be 80 characters or shorter")
    existing=db.scalar(select(UserTag).where(UserTag.key==key))
    if existing: raise HTTPException(409,"That tag already exists")
    tag=UserTag(key=key,name=data.name.strip());db.add(tag);db.commit();db.refresh(tag)
    return {"id":tag.id,"key":tag.key,"name":tag.name,"user_count":0}

@app.patch("/admin/tags/{tag_id}")
def rename_workspace_tag(tag_id:int,data:UserTagIn,db:Session=Depends(get_db),admin:User=Depends(require_roles("admin"))):
    tag=db.get(UserTag,tag_id)
    if not tag: raise HTTPException(404,"Tag not found")
    key=re.sub(r"[^a-z0-9]+","_",data.name.strip().lower()).strip("_")
    if not key: raise HTTPException(400,"Tag name needs letters or numbers")
    if len(key)>80: raise HTTPException(400,"Tag key must be 80 characters or shorter")
    duplicate=db.scalar(select(UserTag).where(UserTag.key==key,UserTag.id!=tag_id))
    if duplicate: raise HTTPException(409,"That tag already exists")
    old=tag.key;tag.key=key;tag.name=data.name.strip()
    for user in db.scalars(select(User).where(User.tags.contains(old))).all():
        values=[key if value==old else value for value in user.tags.split(",") if value]
        user.tags=",".join(dict.fromkeys(values))
    db.commit();return {"id":tag.id,"key":tag.key,"name":tag.name}

@app.delete("/admin/tags/{tag_id}")
def delete_workspace_tag(tag_id:int,db:Session=Depends(get_db),admin:User=Depends(require_roles("admin"))):
    tag=db.get(UserTag,tag_id)
    if not tag: raise HTTPException(404,"Tag not found")
    for user in db.scalars(select(User).where(User.tags.contains(tag.key))).all(): user.tags=",".join(value for value in user.tags.split(",") if value and value!=tag.key)
    db.delete(tag);db.commit();return {"deleted":True,"id":tag_id}

def conversation_member(db:Session,conversation_id:int,user_id:int):
    return db.scalar(select(ConversationMember).where(ConversationMember.conversation_id==conversation_id,ConversationMember.user_id==user_id))

@app.get("/messages/people")
def message_people(q:str="",limit:int=30,offset:int=0,db:Session=Depends(get_db),user:User=Depends(current_user)):
    query=select(User).where(User.active.is_(True),User.id!=user.id)
    if q.strip():
        term=q.strip()
        query=query.where(or_(func.lower(User.name).contains(term.lower()),func.lower(User.email).contains(term.lower()),User.id==int(term) if term.isdigit() else text("0=1")))
    rows=db.scalars(query.order_by(User.name).offset(max(offset,0)).limit(min(max(limit,1),50))).all()
    return [{"id":u.id,"name":u.name,"email":u.email,"role":u.role,"tags":u.tags.split(",") if u.tags else [],"level":u.level,"profile_photo_url":u.profile_photo_url} for u in rows]

@app.get("/messages/conversations")
def list_conversations(q:str="",db:Session=Depends(get_db),user:User=Depends(current_user)):
    memberships=db.scalars(select(ConversationMember).where(ConversationMember.user_id==user.id)).all()
    result=[]
    for membership in memberships:
        conversation=db.get(Conversation,membership.conversation_id)
        participants=db.scalars(select(ConversationMember).where(ConversationMember.conversation_id==conversation.id)).all()
        others=[db.get(User,m.user_id) for m in participants if m.user_id!=user.id]
        other=others[0] if others else None
        last=db.scalar(select(Message).where(Message.conversation_id==conversation.id).order_by(Message.created_at.desc()).limit(1))
        if q and q.casefold() not in (conversation.subject+" "+(other.name if other else "")).casefold(): continue
        unread=db.scalar(select(func.count(Message.id)).where(Message.conversation_id==conversation.id,Message.sender_id!=user.id,Message.read_at.is_(None))) or 0
        result.append({"id":conversation.id,"kind":conversation.kind,"subject":conversation.subject,"person":{"id":other.id,"name":other.name,"role":other.role,"profile_photo_url":other.profile_photo_url} if other else None,"last_message":last.body if last else "","last_message_at":last.created_at if last else conversation.created_at,"unread_count":unread,"last_message_status":message_json(last,user.id)["status"] if last and last.sender_id==user.id else None})
    return sorted(result,key=lambda row:row["last_message_at"],reverse=True)

@app.post("/messages/conversations",status_code=201)
def create_conversation(data:ConversationIn,db:Session=Depends(get_db),user:User=Depends(current_user)):
    if data.support:
        recipient=db.scalar(select(User).where(User.role=="admin", User.active.is_(True), User.id != user.id).order_by(User.id).limit(1))
        if not recipient: raise HTTPException(503,"Support is unavailable right now")
        kind="support"; subject=data.subject.strip() or "Webflow Support"
    else:
        if not data.recipient_id or data.recipient_id==user.id: raise HTTPException(400,"Choose another person to message")
        recipient=db.get(User,data.recipient_id)
        if not recipient or not recipient.active: raise HTTPException(404,"Recipient not found")
        kind="direct"; subject=data.subject.strip()
    # Reuse a thread of the same kind between the same participants.
    existing=None
    if kind in {"direct", "support"}:
        memberships=db.scalars(select(ConversationMember).where(ConversationMember.user_id==user.id)).all()
        for membership in memberships:
            candidate=db.get(Conversation,membership.conversation_id)
            if candidate.kind!=kind: continue
            ids=set(db.scalars(select(ConversationMember.user_id).where(ConversationMember.conversation_id==candidate.id)).all())
            if ids=={user.id,recipient.id}: existing=candidate; break
    conversation=existing or Conversation(kind=kind,subject=subject,created_by=user.id)
    if not existing:
        db.add(conversation); db.flush()
        db.add_all([ConversationMember(conversation_id=conversation.id,user_id=user.id),ConversationMember(conversation_id=conversation.id,user_id=recipient.id)])
    if data.first_message.strip():
        message=Message(conversation_id=conversation.id,sender_id=user.id,body=data.first_message.strip())
        db.add(message)
        add_notification(db,recipient.id,"message",f"New message from {user.name}",data.first_message[:200],f"/messages/{conversation.id}")
    db.commit()
    return {"id":conversation.id,"kind":conversation.kind,"subject":conversation.subject,"messages":[]}

@app.get("/messages/conversations/{conversation_id}")
def get_conversation(conversation_id:int,db:Session=Depends(get_db),user:User=Depends(current_user)):
    conversation=db.get(Conversation,conversation_id)
    member=conversation_member(db,conversation_id,user.id)
    if not conversation or not member: raise HTTPException(404,"Conversation not found")
    now=datetime.utcnow()
    rows=db.scalars(select(Message).where(Message.conversation_id==conversation_id).order_by(Message.created_at)).all()
    for message in rows:
        if message.sender_id!=user.id:
            message.delivered_at=message.delivered_at or now
            message.read_at=message.read_at or now
    member.last_read_at=now
    db.commit()
    participants=db.scalars(select(ConversationMember).where(ConversationMember.conversation_id==conversation_id)).all()
    people=[user_json(db.get(User,p.user_id)) for p in participants]
    return {"id":conversation.id,"kind":conversation.kind,"subject":conversation.subject,"participants":people,"messages":[message_json(m,user.id) for m in rows]}

@app.post("/messages/conversations/{conversation_id}/messages",status_code=201)
def send_message(conversation_id:int,data:MessageIn,db:Session=Depends(get_db),user:User=Depends(current_user)):
    conversation=db.get(Conversation,conversation_id)
    if not conversation or not conversation_member(db,conversation_id,user.id): raise HTTPException(404,"Conversation not found")
    if not data.body.strip():
        raise HTTPException(422, "Enter a message before sending")
    message=Message(conversation_id=conversation_id,sender_id=user.id,body=data.body.strip())
    db.add(message)
    recipients=db.scalars(select(ConversationMember).where(ConversationMember.conversation_id==conversation_id,ConversationMember.user_id!=user.id)).all()
    for recipient in recipients:
        add_notification(db,recipient.user_id,"message",f"New message from {user.name}",data.body[:200],f"/messages/{conversation_id}")
    db.commit(); db.refresh(message)
    return message_json(message,user.id)

@app.post("/projects/{project_id}/teams/batch",status_code=201)
def add_project_teams(project_id:int,data:TeamBatchIn,db:Session=Depends(get_db),user:User=Depends(require_roles("admin","employee"))):
    project=db.get(Project,project_id)
    if not project: raise HTTPException(404,"Project not found")
    if user.role=="employee" and (project.owner_id!=user.id or "product_owner" not in (user.tags or "").split(",")): raise HTTPException(403,"Only the tagged project owner can propose teams")
    names=[item.name.strip().casefold() for item in data.teams]
    if any(not name for name in names) or len(names)!=len(set(names)): raise HTTPException(400,"Team names must be unique and non-empty")
    prepared=[]
    for item in data.teams:
        lead=db.get(User,item.scrum_master_id)
        if not lead or lead.role!="employee" or not lead.active or "scrum_master" not in (lead.tags or "").split(","): raise HTTPException(400,"Each team needs an active employee tagged as its scrum master")
        members=set(item.member_ids+[lead.id]);users={member_id:db.get(User,member_id) for member_id in members}
        if any(not member or member.role!="employee" or not member.active for member in users.values()): raise HTTPException(400,"Team members must be active employee accounts")
        prepared.append((item,lead,members))
    created=[]
    for item,lead,members in prepared:
        team=Team(project_id=project.id,name=item.name.strip(),discipline=item.discipline.strip(),scrum_master_id=lead.id,review_status="pending")
        db.add(team);db.flush()
        for member_id in members: db.add(TeamMember(team_id=team.id,user_id=member_id,invitation_status="pending",is_scrum_master=member_id==lead.id))
        add_notification(db,lead.id,"project","Review your proposed team",f"{team.name} · {project.name}",f"/teams/{team.id}/review")
        created.append(team)
    project.setup_status="pending_team_review"
    for admin in db.scalars(select(User).where(User.role=="admin",User.active.is_(True))).all(): add_notification(db,admin.id,"project","Project team proposal created",f"{project.name} is awaiting scrum master review.","/admin/projects/pending")
    db.commit()
    return [{"id":team.id,"project_id":project.id,"name":team.name,"discipline":team.discipline,"scrum_master_id":team.scrum_master_id,"review_status":team.review_status} for team in created]

@app.post("/projects/{project_id}/teams",status_code=201)
def add_team(project_id: int,data: TeamIn,db: Session=Depends(get_db),user: User=Depends(require_roles("admin","employee"))):
    project=db.get(Project,project_id)
    if not project: raise HTTPException(404,"Project not found")
    if user.role=="employee" and (project.owner_id!=user.id or "product_owner" not in (user.tags or "").split(",")): raise HTTPException(403,"Only the tagged project owner can propose teams")
    scrum_master=db.get(User,data.scrum_master_id)
    if not scrum_master: raise HTTPException(404,"Scrum master not found")
    if scrum_master.role!="employee" or "scrum_master" not in (scrum_master.tags or "").split(","): raise HTTPException(400,"Select an employee tagged as a scrum master")
    team=Team(project_id=project_id,name=data.name,discipline=data.discipline,scrum_master_id=data.scrum_master_id)
    db.add(team); db.flush()
    members=set(data.member_ids+[data.scrum_master_id])
    for member_id in members:
        member=db.get(User,member_id)
        if not member: raise HTTPException(404,f"Team member {member_id} not found")
        if member.role!="employee" or not member.active: raise HTTPException(400,"Team members must be active employees")
        db.add(TeamMember(team_id=team.id,user_id=member_id,invitation_status="pending",is_scrum_master=member_id==data.scrum_master_id))
    project.setup_status="pending_team_review"; db.commit(); db.refresh(team)
    add_notification(db,team.scrum_master_id,"project","Review your proposed team",f"{team.name} · {project.name}",f"/teams/{team.id}/review"); db.commit()
    for admin in db.scalars(select(User).where(User.role=="admin",User.active.is_(True))).all():
        add_notification(db,admin.id,"project","Project team proposal created",f"{project.name} · {team.name} is awaiting scrum master review.",f"/admin/projects/pending")
    db.commit()
    return {"id":team.id,"project_id":project_id,"name":team.name,"discipline":team.discipline,"scrum_master_id":team.scrum_master_id,"invitations":"pending"}

@app.post("/teams/{team_id}/review")
def review_team(team_id:int,data:TeamReviewIn,db:Session=Depends(get_db),user:User=Depends(require_roles("employee"))):
    team=db.get(Team,team_id)
    if not team: raise HTTPException(404,"Team not found")
    if team.scrum_master_id!=user.id or "scrum_master" not in (user.tags or "").split(","): raise HTTPException(403,"Only this team's tagged scrum master can review it")
    project=db.get(Project,team.project_id)
    if data.accept:
        team.review_status="approved"
    else:
        if not data.member_ids: raise HTTPException(400,"Include at least one proposed team member")
        ids=set(data.member_ids+[team.scrum_master_id])
        for member_id in ids:
            member=db.get(User,member_id)
            if not member or member.role!="employee": raise HTTPException(400,"Team members must be active employee accounts")
        existing=db.scalars(select(TeamMember).where(TeamMember.team_id==team.id)).all()
        by_user={member.user_id:member for member in existing}
        for member in existing:
            if member.user_id not in ids and not member.is_scrum_master: db.delete(member)
        for member_id in ids:
            if member_id not in by_user: db.add(TeamMember(team_id=team.id,user_id=member_id,invitation_status="pending",is_scrum_master=member_id==team.scrum_master_id))
        team.review_status="owner_review"
        add_notification(db,project.owner_id,"project","Team member changes need your approval",f"{team.name} · {project.name}",f"/projects/{project.id}/teams")
    teams=db.scalars(select(Team).where(Team.project_id==project.id)).all()
    if teams and all(t.review_status=="approved" for t in teams): project.setup_status="pending_admin_review"
    db.commit()
    return {"team_id":team.id,"review_status":team.review_status,"project_status":project.setup_status}

@app.post("/teams/{team_id}/review/owner")
def approve_team_edits(team_id:int,db:Session=Depends(get_db),user:User=Depends(require_roles("employee"))):
    team=db.get(Team,team_id)
    if not team: raise HTTPException(404,"Team not found")
    project=db.get(Project,team.project_id)
    if project.owner_id!=user.id or "product_owner" not in (user.tags or "").split(","): raise HTTPException(403,"Only the tagged project owner can approve team edits")
    if team.review_status!="owner_review": raise HTTPException(409,"This team has no changes waiting for owner review")
    team.review_status="approved"
    teams=db.scalars(select(Team).where(Team.project_id==project.id)).all()
    if teams and all(t.review_status=="approved" for t in teams): project.setup_status="pending_admin_review"
    db.commit()
    return {"team_id":team.id,"review_status":team.review_status,"project_status":project.setup_status}

@app.get("/projects/{project_id}/teams")
def list_teams(project_id:int,db:Session=Depends(get_db),user:User=Depends(current_user)):
    project=db.get(Project,project_id)
    if not project: raise HTTPException(404,"Project not found")
    if not can_view_project(db,project,user): raise HTTPException(403,"Not a member of this project")
    teams=db.scalars(select(Team).where(Team.project_id==project_id)).all()
    return [{"id":t.id,"name":t.name,"discipline":t.discipline,"scrum_master_id":t.scrum_master_id,"review_status":t.review_status,"members":[{"user_id":m.user_id,"status":m.invitation_status,"is_scrum_master":m.is_scrum_master} for m in db.scalars(select(TeamMember).where(TeamMember.team_id==t.id)).all()]} for t in teams]

@app.post("/admin/projects/{project_id}/approve")
def approve_setup(project_id:int,db:Session=Depends(get_db),admin:User=Depends(require_roles("admin"))):
    project=db.get(Project,project_id)
    if not project: raise HTTPException(404,"Project not found")
    teams=db.scalars(select(Team).where(Team.project_id==project_id)).all()
    if not teams: raise HTTPException(400,"Add at least one team before approval")
    if any(team.review_status!="approved" for team in teams): raise HTTPException(409,"Every team must be reviewed by its scrum master and project owner first")
    project.setup_status="approved"
    memberships=db.scalars(select(TeamMember).join(Team).where(Team.project_id==project_id,TeamMember.invitation_status=="pending")).all()
    for member in memberships:
        add_notification(db,member.user_id,"project","Project invitation",f"You have been invited to {project.name}.","/invitations")
    db.commit()
    return project_json(project,db)

@app.get("/admin/projects/pending")
def pending_project_setups(db:Session=Depends(get_db),admin:User=Depends(require_roles("admin"))):
    rows=db.scalars(select(Project).where(Project.setup_status=="pending_admin_review")).all()
    return [project_json(p,db) for p in rows]

@app.get("/invitations")
def invitations(db:Session=Depends(get_db),user:User=Depends(require_roles("employee"))):
    rows=db.execute(select(TeamMember,Team,Project).join(Team,Team.id==TeamMember.team_id).join(Project,Project.id==Team.project_id).where(TeamMember.user_id==user.id,TeamMember.invitation_status=="pending")).all()
    return [{"id":m.id,"team_id":t.id,"team":t.name,"project_id":p.id,"project":p.name,"is_scrum_master":m.is_scrum_master} for m,t,p in rows]

@app.post("/invitations/{membership_id}/respond")
def respond_invitation(membership_id:int,data:DecisionIn,db:Session=Depends(get_db),user:User=Depends(require_roles("employee"))):
    membership=db.get(TeamMember,membership_id)
    if not membership or membership.user_id!=user.id: raise HTTPException(404,"Invitation not found")
    membership.invitation_status="accepted" if data.accept else "rejected"; db.commit()
    team=db.get(Team,membership.team_id); project=db.get(Project,team.project_id)
    add_notification(db,project.owner_id,"project","Team invitation response",f"A team member {membership.invitation_status} the {team.name} invitation.",f"/projects/{project.id}")
    db.commit()
    return {"id":membership.id,"status":membership.invitation_status}

def has_active_task(db:Session,assignee_id:int,exclude_id:int|None=None):
    stmt=select(Task).where(Task.assignee_id==assignee_id,Task.status=="in_progress")
    if exclude_id: stmt=stmt.where(Task.id!=exclude_id)
    return db.scalar(stmt) is not None

def sync_project_progress(db:Session,project_id:int):
    project=db.get(Project,project_id)
    tasks=db.scalars(select(Task).where(Task.project_id==project_id)).all()
    if not project or not tasks: return
    total=sum(max(t.story_points,1) for t in tasks)
    complete=sum(max(t.story_points,1) for t in tasks if t.status=="done")
    project.progress=round(100*complete/total)
    phase_for={"design":"Design","product design":"Design","frontend":"Development","backend":"Development","development":"Development","content":"Optimisation & launch","seo":"Optimisation & launch","optimisation":"Optimisation & launch","optimization":"Optimisation & launch"}
    phase_order=["Design","Development","Optimisation & launch"]
    pending_phases=[]
    for task in tasks:
        if task.status=="done" or not task.team_id: continue
        team=db.get(Team,task.team_id)
        if team:
            for key,phase in phase_for.items():
                if key in team.discipline.lower(): pending_phases.append(phase); break
    project.stage=next((phase for phase in phase_order if phase in pending_phases),"Optimisation & launch" if complete==total else "Development")

def assignment_candidate(db:Session,team_id:int,complexity:str):
    memberships=db.scalars(select(TeamMember).where(TeamMember.team_id==team_id,TeamMember.invitation_status=="accepted")).all()
    candidates=[db.get(User,m.user_id) for m in memberships]
    candidates=[u for u in candidates if u and not has_active_task(db,u.id)]
    if not candidates: return None
    candidates.sort(key=lambda u:u.level,reverse=True)
    return candidates[0] if complexity=="complex" else candidates[-1]

@app.get("/projects/{project_id}/sprints")
def list_sprints(project_id:int,db:Session=Depends(get_db),user:User=Depends(current_user)):
    project=db.get(Project,project_id)
    if not project: raise HTTPException(404,"Project not found")
    if not can_view_project(db,project,user): raise HTTPException(403,"Not a member of this project")
    rows=db.scalars(select(Sprint).where(Sprint.project_id==project_id).order_by(Sprint.start_date)).all()
    return [{"id":s.id,"project_id":s.project_id,"name":s.name,"start_date":s.start_date,"end_date":s.end_date,"status":s.status} for s in rows]

@app.post("/projects/{project_id}/sprints",status_code=201)
def create_sprint(project_id:int,data:SprintIn,db:Session=Depends(get_db),user:User=Depends(require_roles("admin","employee"))):
    project=db.get(Project,project_id)
    if not project: raise HTTPException(404,"Project not found")
    if user.role=="employee" and (project.owner_id!=user.id or "product_owner" not in (user.tags or "").split(",")): raise HTTPException(403,"Only the tagged project owner can plan sprints")
    if data.end_date<data.start_date: raise HTTPException(400,"Sprint end date must be on or after its start date")
    if db.scalar(select(Sprint).where(Sprint.project_id==project_id,Sprint.name==data.name.strip())): raise HTTPException(409,"A sprint with this name already exists")
    sprint=Sprint(project_id=project_id,name=data.name.strip(),start_date=data.start_date,end_date=data.end_date);db.add(sprint);db.commit();db.refresh(sprint)
    return {"id":sprint.id,"project_id":sprint.project_id,"name":sprint.name,"start_date":sprint.start_date,"end_date":sprint.end_date,"status":sprint.status}

@app.patch("/tasks/{task_id}/sprint")
def assign_task_sprint(task_id:int,data:TaskSprintIn,db:Session=Depends(get_db),user:User=Depends(require_roles("admin","employee"))):
    task=db.get(Task,task_id)
    if not task: raise HTTPException(404,"Task not found")
    project=db.get(Project,task.project_id)
    if user.role=="employee":
        is_owner=project.owner_id==user.id and "product_owner" in (user.tags or "").split(",")
        is_lead=task.team_id is not None and db.scalar(select(Team.id).where(Team.id==task.team_id,Team.scrum_master_id==user.id)) is not None and "scrum_master" in (user.tags or "").split(",")
        if not is_owner and not is_lead: raise HTTPException(403,"Only the project owner or team scrum master can plan this task")
    sprint=db.get(Sprint,data.sprint_id) if data.sprint_id is not None else None
    if data.sprint_id is not None and (not sprint or sprint.project_id!=task.project_id): raise HTTPException(400,"Sprint must belong to this task's project")
    task.sprint_id=sprint.id if sprint else None;db.commit()
    return task_json(task)

@app.post("/projects/{project_id}/tasks",status_code=201)
def create_task(project_id:int,data:TaskIn,db:Session=Depends(get_db),user:User=Depends(require_roles("admin","employee"))):
    project=db.get(Project,project_id)
    if not project: raise HTTPException(404,"Project not found")
    if project.setup_status!="approved": raise HTTPException(409,"Admin must approve the project setup before tasks can be assigned")
    signed_contract=db.scalar(select(Contract).where(Contract.project_id==project_id,Contract.status=="signed"))
    if not signed_contract: raise HTTPException(409,"The project contract must be approved and signed by the client and project owner before work starts")
    if user.role=="employee":
        is_owner=project.owner_id==user.id
        is_member=db.scalar(select(TeamMember.id).join(Team).where(Team.project_id==project_id,TeamMember.user_id==user.id,TeamMember.invitation_status=="accepted")) is not None
        if not is_owner and not is_member: raise HTTPException(403,"Only project employees can add tasks to this project")
    assignee_id=data.assignee_id
    status="waiting"
    if data.team_id:
        team=db.get(Team,data.team_id)
        if not team or team.project_id!=project_id: raise HTTPException(404,"Team is not part of this project")
    if assignee_id:
        if not data.team_id: raise HTTPException(400,"Choose a team before assigning a member")
        membership=db.scalar(select(TeamMember).where(TeamMember.team_id==data.team_id,TeamMember.user_id==assignee_id,TeamMember.invitation_status=="accepted"))
        if not membership: raise HTTPException(400,"Assignee must accept an invitation to this team")
        if has_active_task(db,assignee_id): raise HTTPException(409,"This teammate already has an active task")
        status="in_progress"
    elif data.team_id:
        candidate=assignment_candidate(db,data.team_id,data.complexity)
        if candidate:
            assignee_id=candidate.id; status="in_progress"
    if data.sprint_id is not None:
        sprint=db.get(Sprint,data.sprint_id)
        if not sprint or sprint.project_id!=project_id: raise HTTPException(400,"Sprint must belong to this project")
    task=Task(project_id=project_id,team_id=data.team_id,title=data.title,description=data.description,priority=data.priority,complexity=data.complexity,story_points=data.story_points,assignee_id=assignee_id,status=status,due_date=data.due_date,sprint_id=data.sprint_id,ai_generated=data.ai_generated)
    db.add(task); db.flush(); sync_project_progress(db,project_id); db.commit(); db.refresh(task)
    return task_json(task)

@app.get("/projects/{project_id}/tasks")
def list_tasks(project_id:int,db:Session=Depends(get_db),user:User=Depends(require_roles("admin","employee"))):
    project=db.get(Project,project_id)
    if not project: raise HTTPException(404,"Project not found")
    if user.role=="employee" and not can_view_project(db,project,user): raise HTTPException(403,"Not a member of this project")
    return [task_json(t) for t in db.scalars(select(Task).where(Task.project_id==project_id).order_by(Task.created_at.desc())).all()]

@app.patch("/tasks/{task_id}/status")
def update_task_status(task_id:int,status:str,db:Session=Depends(get_db),user:User=Depends(current_user)):
    task=db.get(Task,task_id)
    if not task: raise HTTPException(404,"Task not found")
    if user.role=="employee" and task.assignee_id!=user.id: raise HTTPException(403,"Only the assignee can update this task")
    if status=="in_progress" and task.assignee_id and has_active_task(db,task.assignee_id,task.id): raise HTTPException(409,"One active task per teammate")
    if status not in {"waiting","in_progress","in_review","done"}:
        raise HTTPException(400,"Status must be waiting, in_progress, in_review, or done")
    if status=="done" and task.status!="done" and task.assignee_id:
        assignee=db.get(User,task.assignee_id)
        if assignee:
            reward={"simple":10,"standard":20,"complex":35}.get(task.complexity,15)
            assignee.experience_points+=reward
            assignee.level=1+assignee.experience_points//100
    task.status=status; sync_project_progress(db,task.project_id); db.commit(); return task_json(task)

@app.post("/projects/{project_id}/tasks/generate")
def generate_tasks(project_id:int,scope:str,db:Session=Depends(get_db),user:User=Depends(require_roles("admin","employee"))):
    project=db.get(Project,project_id)
    if not project: raise HTTPException(404,"Project not found")
    if project.setup_status!="approved": raise HTTPException(409,"Project setup must be approved first")
    if not db.scalar(select(Contract).where(Contract.project_id==project_id,Contract.status=="signed")):
        raise HTTPException(409,"The project contract must be signed before generating project tasks")
    # Conservative proposal extraction; generated rows stay unassigned in the waiting list for owner review.
    if len(scope)>12000: raise HTTPException(413,"Task generation scope must be 12,000 characters or less")
    chunks=[x.strip(" -*•\t") for x in re.split(r"[\n.;]",scope) if len(x.strip())>2]
    suggestions=[c[:235] for c in chunks[:12]]
    return {"drafts":[{"title":s,"description":"AI-proposed from project scope. Please review and refine.","status":"waiting","ai_generated":True} for s in suggestions],"needs_review":True}

@app.post("/projects/{project_id}/contracts",status_code=201)
async def upload_contract(project_id:int,file:UploadFile=File(...),db:Session=Depends(get_db),user:User=Depends(current_user)):
    project=db.get(Project,project_id)
    if not project: raise HTTPException(404,"Project not found")
    if user.role=="client" and project.client_id!=user.id: raise HTTPException(403,"Not your project")
    if user.role=="employee" and user.id!=project.owner_id and not db.scalar(select(TeamMember).join(Team).where(Team.project_id==project_id,TeamMember.user_id==user.id,TeamMember.invitation_status=="accepted")):
        raise HTTPException(403,"You are not on this project")
    if file.content_type!="application/pdf" and not (file.filename or "").lower().endswith(".pdf"): raise HTTPException(415,"Upload a PDF contract")
    raw=await file.read(20*1024*1024+1)
    if len(raw)>20*1024*1024: raise HTTPException(413,"PDF exceeds 20 MB")
    UPLOAD_DIR.mkdir(parents=True,exist_ok=True)
    safe_name=re.sub(r"[^a-zA-Z0-9._-]","_",file.filename or "contract.pdf")
    path=UPLOAD_DIR/f"p{project_id}_{os.urandom(6).hex()}_{safe_name}"
    path.write_bytes(raw)
    version=(db.scalar(select(Contract).where(Contract.project_id==project_id).order_by(Contract.version.desc())) or None)
    record=Contract(project_id=project_id,uploaded_by=user.id,filename=safe_name,storage_path=str(path),version=(version.version+1 if version else 1),status="pending_admin_review")
    db.add(record); db.commit(); db.refresh(record)
    return {"id":record.id,"filename":record.filename,"version":record.version,"status":record.status}

@app.get("/projects/{project_id}/contracts")
def list_contracts(project_id:int,db:Session=Depends(get_db),user:User=Depends(current_user)):
    project=db.get(Project,project_id)
    if not project: raise HTTPException(404,"Project not found")
    if user.role=="client" and project.client_id!=user.id: raise HTTPException(403,"Not your project")
    member=user.role=="employee" and db.scalar(select(TeamMember.id).join(Team).where(Team.project_id==project_id,TeamMember.user_id==user.id,TeamMember.invitation_status=="accepted")) is not None
    if user.role=="employee" and user.id!=project.owner_id and not member: raise HTTPException(403,"You are not a member of this project")
    rows=db.scalars(select(Contract).where(Contract.project_id==project_id).order_by(Contract.version.desc())).all()
    return [{"id":c.id,"filename":c.filename,"version":c.version,"status":c.status,"uploaded_by":c.uploaded_by,"created_at":c.created_at,"signatures":[{"user_id":s.user_id,"signed_at":s.signed_at} for s in db.scalars(select(ContractSignature).where(ContractSignature.contract_id==c.id)).all()]} for c in rows]

@app.get("/contracts/{contract_id}/file")
def contract_file(contract_id:int,db:Session=Depends(get_db),user:User=Depends(current_user)):
    c=db.get(Contract,contract_id)
    if not c: raise HTTPException(404,"Contract not found")
    project=db.get(Project,c.project_id)
    member=db.scalar(select(TeamMember).join(Team).where(Team.project_id==project.id,TeamMember.user_id==user.id,TeamMember.invitation_status=="accepted"))
    if user.role!="admin" and user.id not in (project.client_id,project.owner_id) and not member:
        raise HTTPException(403,"You are not a member of this project")
    path=Path(c.storage_path)
    if not path.is_file(): raise HTTPException(404,"Contract file not available")
    return FileResponse(path,media_type="application/pdf",filename=c.filename)

@app.post("/contracts/{contract_id}/sign")
def sign_contract(contract_id:int,db:Session=Depends(get_db),user:User=Depends(require_roles("client","employee"))):
    c=db.get(Contract,contract_id)
    if not c: raise HTTPException(404,"Contract not found")
    if c.status!="approved_pending_signatures": raise HTTPException(409,"This contract is not approved and ready for signatures")
    project=db.get(Project,c.project_id)
    is_party=(user.role=="client" and user.id==project.client_id) or (user.role=="employee" and user.id==project.owner_id)
    if not is_party: raise HTTPException(403,"Only the project client and owner can sign")
    signature=db.scalar(select(ContractSignature).where(ContractSignature.contract_id==c.id,ContractSignature.user_id==user.id))
    if not signature:
        db.add(ContractSignature(contract_id=c.id,user_id=user.id)); db.flush()
    signed_users=set(db.scalars(select(ContractSignature.user_id).where(ContractSignature.contract_id==c.id)).all())
    if {project.client_id,project.owner_id}.issubset(signed_users):
        c.status="signed"
        project.stage="Planning"
    db.commit()
    return {"contract_id":c.id,"status":c.status,"signed_by":sorted(signed_users)}

@app.post("/contracts/{contract_id}/request-amendment")
def request_amendment(contract_id:int,db:Session=Depends(get_db),user:User=Depends(current_user)):
    c=db.get(Contract,contract_id)
    if not c: raise HTTPException(404,"Contract not found")
    project=db.get(Project,c.project_id)
    if user.id not in (project.client_id,project.owner_id): raise HTTPException(403,"Only the project client or owner may request an amendment")
    c.status="amendment_requested"; c.amendment_requested_by=user.id
    for admin in db.scalars(select(User).where(User.role=="admin",User.active.is_(True))).all():
        add_notification(db,admin.id,"contract","Contract amendment requested",f"{project.name}: a project party requested a contract amendment.",f"/admin/contracts/{c.id}")
    db.commit()
    return {"id":c.id,"status":c.status}

@app.patch("/admin/contracts/{contract_id}/review")
def review_contract(contract_id:int,data:ContractReviewIn,db:Session=Depends(get_db),admin:User=Depends(require_roles("admin"))):
    c=db.get(Contract,contract_id)
    if not c: raise HTTPException(404,"Contract not found")
    if data.approved:
        for signature in db.scalars(select(ContractSignature).where(ContractSignature.contract_id==c.id)).all():
            db.delete(signature)
        c.status="approved_pending_signatures"
    else:
        c.status="changes_requested"
    project=db.get(Project,c.project_id)
    title="Contract approved for signatures" if data.approved else "Contract changes requested"
    body=f"{project.name}: contract version {c.version} {('is ready for signatures' if data.approved else 'needs updates')}."
    add_notification(db,project.client_id,"contract",title,body,f"/projects/{project.id}/contracts")
    add_notification(db,project.owner_id,"contract",title,body,f"/projects/{project.id}/contracts")
    db.commit()
    return {"id":c.id,"status":c.status}

@app.post("/projects/{project_id}/cancellation-requests",status_code=201)
def request_cancellation(project_id:int,data:CancelIn,db:Session=Depends(get_db),user:User=Depends(require_roles("client"))):
    project=db.get(Project,project_id)
    if not project or project.client_id!=user.id: raise HTTPException(404,"Project not found")
    if project.cancellation_status=="pending_admin_review": raise HTTPException(409,"A cancellation request is already pending")
    project.cancellation_status="pending_admin_review"
    req=CancellationRequest(project_id=project_id,requested_by=user.id,reason=data.reason)
    db.add(req)
    for admin in db.scalars(select(User).where(User.role=="admin",User.active.is_(True))).all():
        add_notification(db,admin.id,"project","Project cancellation requested",f"{project.name}: {data.reason[:180]}",f"/admin/cancellation-requests/{req.id}")
    db.commit(); db.refresh(req)
    return {"id":req.id,"status":req.status,"message":"The project remains active until an admin reviews this request."}

@app.get("/admin/cancellation-requests")
def pending_cancellations(db:Session=Depends(get_db),admin:User=Depends(require_roles("admin"))):
    rows=db.scalars(select(CancellationRequest).where(CancellationRequest.status=="pending_admin_review")).all()
    return [{"id":r.id,"project_id":r.project_id,"reason":r.reason,"requested_by":r.requested_by,"created_at":r.created_at} for r in rows]

@app.patch("/admin/cancellation-requests/{request_id}")
def review_cancellation(request_id:int,approved:bool,db:Session=Depends(get_db),admin:User=Depends(require_roles("admin"))):
    req=db.get(CancellationRequest,request_id)
    if not req: raise HTTPException(404,"Request not found")
    req.status="approved" if approved else "declined"
    project=db.get(Project,req.project_id); project.cancellation_status=req.status
    add_notification(db,req.requested_by,"project","Cancellation request reviewed",f"Your request for {project.name} was {'approved' if approved else 'declined'} by an administrator.",f"/projects/{project.id}")
    db.commit(); return {"id":req.id,"status":req.status}
