from datetime import date
from pydantic import BaseModel, EmailStr, Field

class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=8)
    role: str = "client"

class LoginIn(BaseModel):
    email: str = Field(min_length=1, max_length=254)
    password: str

class AccountUpdateIn(BaseModel):
    username: str | None = Field(default=None, min_length=2, max_length=160)
    email: EmailStr
    current_password: str = Field(min_length=1, max_length=256)
    new_password: str | None = Field(default=None, min_length=8, max_length=256)

class ProjectStepIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: str = ""

class ProjectIn(BaseModel):
    name: str
    description: str = ""
    client_id: int
    owner_id: int
    target_date: date | None = None
    steps: list[ProjectStepIn] = Field(default_factory=list)

class ProjectRequestIn(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    description: str = Field(default="", max_length=10000)
    requested_owner_id: int | None = None
    target_date: date | None = None
    steps: list[ProjectStepIn] = Field(default_factory=list)
    message: str = Field(default="", max_length=5000)

class ProjectRequestCommentIn(BaseModel):
    body: str = Field(min_length=1, max_length=5000)

class PortfolioItemIn(BaseModel):
    title: str = Field(min_length=2, max_length=160)
    service: str = Field(default="", max_length=160)
    description: str = Field(default="", max_length=4000)
    image_urls: list[str] = Field(default_factory=list, max_length=10)
    external_urls: list[str] = Field(default_factory=list, max_length=10)

class EmployeeProfileIn(BaseModel):
    services: list[str] = Field(default_factory=list, max_length=20)
    portfolio: list[PortfolioItemIn | str] = Field(default_factory=list, max_length=30)
    profile_photo_url: str | None = Field(default=None, max_length=1000)

class EmployeeReviewIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    service: str = Field(default="Overall", min_length=1, max_length=160)
    comment: str = Field(default="", max_length=2000)
    project_id: int

class TeamIn(BaseModel):
    name: str
    discipline: str
    scrum_master_id: int
    member_ids: list[int] = []

class TeamBatchIn(BaseModel):
    teams: list[TeamIn] = Field(min_length=1, max_length=12)

class TeamReviewIn(BaseModel):
    accept: bool
    member_ids: list[int] = Field(default_factory=list)

class SprintIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    start_date: date
    end_date: date

class TaskSprintIn(BaseModel):
    sprint_id: int | None = None

class TaskIn(BaseModel):
    title: str
    description: str = ""
    team_id: int | None = None
    priority: str = "medium"
    complexity: str = "standard"
    story_points: int = 1
    assignee_id: int | None = None
    due_date: date | None = None
    sprint_id: int | None = None
    ai_generated: bool = False

class DecisionIn(BaseModel):
    accept: bool

class ContractReviewIn(BaseModel):
    approved: bool

class CancelIn(BaseModel):
    reason: str = Field(min_length=5)

class ConversationIn(BaseModel):
    recipient_id: int | None = None
    subject: str = ""
    first_message: str = Field(default="", max_length=10000)
    support: bool = False

class MessageIn(BaseModel):
    body: str = Field(min_length=1, max_length=10000)

class NotificationReadIn(BaseModel):
    all: bool = False
    ids: list[int] = Field(default_factory=list)

class UserStatusIn(BaseModel):
    active: bool

class UserRoleIn(BaseModel):
    role: str

class UserTagIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)

class EmployeeReviewUpdateIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    service: str = Field(default="Overall", min_length=1, max_length=160)
    comment: str = Field(default="", max_length=2000)
