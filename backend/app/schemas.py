from datetime import date
from pydantic import BaseModel, EmailStr, Field

class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=8)
    role: str = "client"

class LoginIn(BaseModel):
    email: EmailStr
    password: str

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

class TeamIn(BaseModel):
    name: str
    discipline: str
    scrum_master_id: int
    member_ids: list[int] = []

class TaskIn(BaseModel):
    title: str
    description: str = ""
    team_id: int | None = None
    priority: str = "medium"
    complexity: str = "standard"
    story_points: int = 1
    assignee_id: int | None = None
    due_date: date | None = None

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
