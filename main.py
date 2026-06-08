from typing import Optional
from fastapi import Depends, FastAPI, HTTPException, Query
from database import Habit, get_session, create_db_and_tables, SessionDep
from sqlmodel import select
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(lifespan=lifespan)

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
    habit_title: str, 
    habit_description: str,
    times_per_week: int,
    session: SessionDep
    ):
    
    habit = Habit(title = habit_title, description=habit_description, times_per_week=times_per_week)
    session.add(habit)
    session.commit()
    return {"ok": True} 

@app.patch("/habits/{habit_id}")
def update_habit(
    habit_id: int, 
    habit_title: Optional[str] = None, 
    habit_description: Optional[str]= None,
    times_per_week: Optional[int] = None,
    session: SessionDep = None): 
    habit = session.get(Habit, habit_id)
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    if habit_title is not None:
        habit.title = habit_title

    if habit_description is not None:
        habit.description = habit_description

    if times_per_week is not None:
        habit.times_per_week = times_per_week
    session.add(habit)
    session.commit()
    session.refresh(habit)
    return habit

    
    
    

