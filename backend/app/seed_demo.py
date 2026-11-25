"""Add idempotent local demo accounts and project data for manual testing.

Run explicitly with: python -m app.seed_demo
Never run this seeder automatically in production.
"""
import argparse
import json
import os
from datetime import date, datetime, timedelta

from sqlalchemy import select

from .db import Base, SessionLocal, engine
from .models import (
    Contract, Conversation, ConversationMember, Message, Notification,
    Project, ProjectStep, Sprint, Task, Team, TeamMember, User,
)
from .security import hash_password, verify_password


PASSWORD = os.getenv("WEBFLOW_DEMO_PASSWORD", "WebflowDemo123!")


def create_local_admin():
    with SessionLocal() as db:
        existing = db.scalar(select(User).where(User.username == "admin"))
        if existing:
            if existing.role == "admin" and existing.active and verify_password("admin", existing.password_hash):
                print("Local demo administrator already exists.")
                return
            raise SystemExit("The username admin is already assigned. Existing account preserved.")
        email = "local-demo-admin@example.com"
        if db.scalar(select(User).where(User.email == email)):
            raise SystemExit("The local demo administrator email is already assigned. Existing account preserved.")
        db.add(User(name="Local Demo Admin", username="admin", email=email,
                    password_hash=hash_password("admin"), role="admin"))
        db.commit()
        print("Created local demo administrator.")


def main():
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        specs = [
            ("demo.admin@example.com", "Demo Admin", "admin", "", 8, ["Workspace administration"], ["Studio operations dashboard"]),
            ("demo.owner@example.com", "Avery Owner", "employee", "product_owner", 7, ["Product ownership", "Web strategy"], ["Northstar client portal", "Lumen commerce site"]),
            ("demo.scrum@example.com", "Morgan Scrum", "employee", "scrum_master", 6, ["Agile delivery", "Team facilitation"], ["Northstar client portal"]),
            ("demo.frontend@example.com", "Riley Frontend", "employee", "", 5, ["React", "Accessibility"], ["Northstar client portal"]),
            ("demo.backend@example.com", "Casey Backend", "employee", "", 5, ["Python", "APIs", "MySQL"], ["Northstar client portal"]),
            ("demo.design@example.com", "Jamie Designer", "employee", "scrum_master", 4, ["UI design", "Prototyping"], ["Northstar client portal"]),
            ("demo.client@example.com", "Taylor Client", "client", "", 1, ["Client"], ["Northstar client portal"]),
            ("demo.client2@example.com", "Jordan Client", "client", "", 1, ["Client"], ["Lumen commerce site"]),
        ]
        users = {}
        for email, name, role, tags, level, services, portfolio in specs:
            legacy_email = email.replace("@example.com", "@webflow.local")
            user = db.scalar(select(User).where(User.email.in_([email, legacy_email])))
            if not user:
                user = User(name=name, email=email, password_hash=hash_password(PASSWORD), role=role)
                db.add(user)
            else:
                # Keep reruns usable when WEBFLOW_DEMO_PASSWORD is changed.
                user.password_hash = hash_password(PASSWORD)
                user.email = email
            user.name = name
            user.role = role
            user.tags = tags
            user.level = level
            user.services_json = json.dumps(services)
            case_studies = []
            for item in portfolio:
                title = item.get("title", "") if isinstance(item, dict) else item
                lower_title = title.lower()
                if "portal" in lower_title:
                    images = ["/portfolio/client-portal.svg", "/portfolio/design-system.svg"]
                elif "commerce" in lower_title or "lumen" in lower_title:
                    images = ["/portfolio/commerce-dashboard.svg", "/portfolio/client-portal.svg"]
                else:
                    images = ["/portfolio/design-system.svg", "/portfolio/commerce-dashboard.svg"]
                case_studies.append({"title": title, "service": services[0] if services else "Delivery", "description": f"Contributed to {title} with a focus on {services[0].lower() if services else 'product delivery'}. This case study shows the project outcome and how the work fits into the wider product experience.", "image_urls": images, "external_urls": []})
            user.portfolio_json = json.dumps(case_studies)
            user.active = True
            users[email] = user
        db.flush()

        def project_for(name, client, owner):
            project = db.scalar(select(Project).where(Project.name == name, Project.client_id == client.id))
            if not project:
                project = Project(name=name, client_id=client.id, owner_id=owner.id)
                db.add(project)
            project.owner_id = owner.id
            project.description = f"Demo delivery workspace for {name}."
            project.target_date = date.today() + timedelta(days=45)
            project.stage = "Development"
            project.progress = 45 if name.startswith("Northstar") else 15
            project.setup_status = "approved"
            db.flush()
            if not db.scalar(select(ProjectStep).where(ProjectStep.project_id == project.id)):
                for position, (step, description, progress) in enumerate([
                    ("Discovery & design", "Plan the experience and approve the interface.", 100),
                    ("Development", "Build the application and connect its services.", 45),
                    ("Quality & launch", "Test, optimise, and prepare deployment.", 0),
                ]):
                    db.add(ProjectStep(project_id=project.id, name=step, description=description, position=position, progress=progress))
            return project

        owner = users["demo.owner@example.com"]
        scrum = users["demo.scrum@example.com"]
        frontend = users["demo.frontend@example.com"]
        backend = users["demo.backend@example.com"]
        designer = users["demo.design@example.com"]
        client = users["demo.client@example.com"]
        client2 = users["demo.client2@example.com"]
        first = project_for("Northstar client portal", client, owner)
        second = project_for("Lumen commerce site", client2, owner)

        team_specs = [
            (first, "Product design", designer, [designer, scrum, owner]),
            (first, "Frontend", scrum, [frontend, scrum, owner]),
            (first, "Backend", scrum, [backend, scrum, owner]),
            (second, "Frontend", scrum, [frontend, scrum, owner]),
            (second, "Content & SEO", scrum, [scrum, designer]),
        ]
        teams = {}
        for project, name, lead, members in team_specs:
            team = db.scalar(select(Team).where(Team.project_id == project.id, Team.name == name))
            if not team:
                team = Team(project_id=project.id, name=name, scrum_master_id=lead.id, discipline=name)
                db.add(team)
            team.scrum_master_id = lead.id
            team.discipline = name
            team.review_status = "approved"
            db.flush()
            teams[(project.id, name)] = team
            for member in members:
                membership = db.scalar(select(TeamMember).where(TeamMember.team_id == team.id, TeamMember.user_id == member.id))
                if not membership:
                    membership = TeamMember(team_id=team.id, user_id=member.id, is_scrum_master=member.id == lead.id)
                    db.add(membership)
                membership.invitation_status = "pending" if project.id == second.id and name == "Content & SEO" and member.id != lead.id else "accepted"
                membership.is_scrum_master = member.id == lead.id

        db.flush()
        for project in (first, second):
            sprint = db.scalar(select(Sprint).where(Sprint.project_id == project.id))
            if not sprint:
                sprint = Sprint(project_id=project.id, name="Sprint 01 · Delivery", start_date=date.today(), end_date=date.today() + timedelta(days=13))
                db.add(sprint)
                db.flush()
            if not db.scalar(select(Task).where(Task.project_id == project.id)):
                team = teams[(project.id, "Frontend")]
                db.add_all([
                    Task(project_id=project.id, team_id=team.id, sprint_id=sprint.id, title="Build responsive navigation", description="Implement and verify the shared responsive navigation.", status="in_progress", priority="high", complexity="standard", story_points=5, assignee_id=frontend.id),
                    Task(project_id=project.id, team_id=team.id, sprint_id=None, title="Review accessibility states", description="Check keyboard, focus, and screen reader behaviour.", status="waiting", priority="medium", complexity="complex", story_points=8, assignee_id=None, ai_generated=True),
                ])

        if not db.scalar(select(Contract).where(Contract.project_id == first.id)):
            contract_path = "/data/contracts/northstar-demo-agreement.pdf"
            os.makedirs(os.path.dirname(contract_path), exist_ok=True)
            if not os.path.exists(contract_path):
                pdf = b"%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 0/Kids[]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n"
                with open(contract_path, "wb") as contract_file:
                    contract_file.write(pdf)
            db.add(Contract(project_id=first.id, uploaded_by=owner.id, filename="northstar-demo-agreement.pdf", storage_path=contract_path, version=1, status="signed"))

        if not db.scalar(select(Conversation).join(ConversationMember).where(ConversationMember.user_id == client.id, Conversation.subject == "Northstar project updates")):
            conversation = Conversation(kind="direct", subject="Northstar project updates", created_by=client.id)
            db.add(conversation)
            db.flush()
            db.add_all([ConversationMember(conversation_id=conversation.id, user_id=client.id), ConversationMember(conversation_id=conversation.id, user_id=owner.id)])
            db.add(Message(conversation_id=conversation.id, sender_id=owner.id, body="Welcome to the Northstar project workspace. The delivery plan and first sprint are ready to review."))

        if not db.scalar(select(Notification).where(Notification.user_id == client.id, Notification.title == "Your project workspace is ready")):
            db.add(Notification(user_id=client.id, kind="project", title="Your project workspace is ready", body="Northstar client portal is active. Open the project to follow delivery progress.", target=f"/projects/{first.id}"))
        db.commit()
        print("Demo records are ready.")
        print(f"Shared local password: {PASSWORD}")
        for email, *_ in specs:
            print(email)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--local-admin", action="store_true", help="Create the local admin/admin account")
    if parser.parse_args().local_admin:
        create_local_admin()
    else:
        main()
