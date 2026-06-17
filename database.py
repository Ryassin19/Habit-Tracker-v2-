import os
from typing import Annotated, Optional
from datetime import datetime, timezone
from pydantic import BaseModel
from fastapi import Depends
from sqlmodel import Field, Session, SQLModel, create_engine
from dotenv import load_dotenv

load_dotenv()

class Habit(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(index=True, min_length=1)
    description: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    times_per_week: int = Field(ge=1, le=7)
    user_id: int = Field(foreign_key="user.id")

class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    hashed_password: str 

DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://myuser:mypassword@localhost:5432/habit_db"
)

connect_args = {"sslmode": "require"} if DATABASE_URL and "localhost" not in DATABASE_URL else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

SessionDep = Annotated[Session, Depends(get_session)]