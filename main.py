from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from database import Habit, create_db_and_tables, SessionDep
from sqlmodel import select, SQLModel
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware

class HabitCreate(SQLModel):
    title: str
    description: str
    times_per_week: int

class HabitUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    times_per_week: Optional[int] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/habits/")
def read_habits(
    session: SessionDep,
    offset = 0,
    limit = 100
    ) -> list[Habit]:
    habits = session.exec(select(Habit).offset(offset).limit(limit)).all()
    return habits

@app.get("/habits/{habit_id}")
def read_single_habit(habit_id: int, session: SessionDep) -> Habit:
    habit = session.get(Habit, habit_id)
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    return habit

@app.delete("/habits/{habit_id}")
def delete_habit(habit_id: int, session: SessionDep):
    habit = session.get(Habit, habit_id)
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    session.delete(habit)
    session.commit()
    return {"ok": True} 

@app.post("/habits/post")
def create_habit(
    new_habit: HabitCreate,
    session: SessionDep
    ):
    
    habit = Habit(
        title = new_habit.title, 
        description=new_habit.description, 
        times_per_week=new_habit.times_per_week
        )
    session.add(habit)
    session.commit()
    return {"habit": habit} 

@app.patch("/habits/{habit_id}")
def update_habit(
    habit_id: int, 
    habit_data: HabitUpdate,
    session: SessionDep = None): 
    habit = session.get(Habit, habit_id)
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    if habit_data.title is not None:
        habit.title = habit_data.title

    if habit_data.description is not None:
        habit.description = habit_data.description

    if habit_data.times_per_week is not None:
        habit.times_per_week = habit_data.times_per_week
    session.add(habit)
    session.commit()
    session.refresh(habit)
    return habit

    
    
    

