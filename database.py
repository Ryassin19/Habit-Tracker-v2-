from typing import Annotated, Optional
from datetime import datetime, timezone

from fastapi import Depends
from sqlmodel import Field, Session, SQLModel, create_engine

class Habit(SQLModel, table = True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(index=True)
    description: Optional[str] = Field(default = None)
    created_at: datetime = Field(default_factory= lambda: datetime.now(timezone.utc))
    times_per_week: int

postgres_url = "postgresql://myuser:mypassword@localhost:5432/habit_db"
engine = create_engine(postgres_url)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

SessionDep = Annotated[Session, Depends(get_session)]