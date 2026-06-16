import os
import jwt
import json
from typing import Optional
from datetime import datetime, timedelta, timezone
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import select, SQLModel, Session
from groq import Groq
from dotenv import load_dotenv

from database import Habit, create_db_and_tables, SessionDep, User, get_session, UserCreate, UserLogin
from security import hash_password, verify_password

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "fallback_temporary_development_key")
ALGORITHM = "HS256"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

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
    "http://127.0.0.1:5173",
    os.getenv("FRONTEND_URL", "*")  
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if "*" in origins else origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user_id(token: str = Depends(oauth2_scheme)) -> int:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Could not validate credentials")
        return int(user_id) 
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Habit Tracker API! Head to /docs for the interactive documentation."}

@app.get("/habits/")
def read_habits(
    session: SessionDep,
    current_user_id: int = Depends(get_current_user_id),
    offset: int = 0,
    limit: int = 100
) -> list[Habit]:
    habits = session.exec(select(Habit).where(Habit.user_id == current_user_id).offset(offset).limit(limit)).all()
    return habits

@app.get("/habits/{habit_id}")
def read_single_habit(
    habit_id: int, 
    session: SessionDep,
    current_user_id: int = Depends(get_current_user_id) 
) -> Habit:
    habit = session.get(Habit, habit_id)
    if not habit or habit.user_id != current_user_id:
        raise HTTPException(status_code=404, detail="Habit not found")
    return habit

@app.delete("/habits/{habit_id}")
def delete_habit(
    habit_id: int, 
    session: SessionDep,
    current_user_id: int = Depends(get_current_user_id) 
):
    habit = session.get(Habit, habit_id)
    if not habit or habit.user_id != current_user_id:
        raise HTTPException(status_code=404, detail="Habit not found")
    session.delete(habit)
    session.commit()
    return {"ok": True}

@app.post("/habits/post")
def create_habit(
    new_habit: HabitCreate,
    session: SessionDep,
    current_user_id: int = Depends(get_current_user_id) 
):
    habit = Habit(
        title=new_habit.title, 
        description=new_habit.description, 
        times_per_week=new_habit.times_per_week,
        user_id=current_user_id 
    )
    session.add(habit)
    session.commit()
    return {"habit": habit}

@app.patch("/habits/{habit_id}")
def update_habit(
    habit_id: int, 
    habit_data: HabitUpdate,
    session: SessionDep, 
    current_user_id: int = Depends(get_current_user_id) 
): 
    habit = session.get(Habit, habit_id)
    if not habit or habit.user_id != current_user_id:
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

@app.post("/signup")
def signup(user_data: UserCreate, session: Session = Depends(get_session)):
    existing_user = session.exec(select(User).where(User.username == user_data.username)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    secured_hash = hash_password(user_data.password)
    new_user = User(
        username=user_data.username,
        hashed_password=secured_hash
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return {"message": "User created successfully", "user_id": new_user.id}

@app.post("/login")
def login(user_data: UserLogin, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == user_data.username)).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid username or password")
    
    expire = datetime.now(timezone.utc) + timedelta(minutes=30)
    token_payload = {
        "sub": str(user.id),
        "exp": expire
    }
    encoded_jwt = jwt.encode(token_payload, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": encoded_jwt, "token_type": "bearer"}

@app.post("/habits/ai-coach")
def get_ai_coaching(
    session: SessionDep,
    current_user_id: int = Depends(get_current_user_id)
):
    habits = session.exec(select(Habit).where(Habit.user_id == current_user_id)).all()
    if not habits:
        return {
            "headline": "Welcome to your AI Coach!",
            "challenges": [
                "Add your very first habit above.",
                "Set a weekly target for that habit.",
                "Click this button again for custom missions!"
            ]
        }
        
    habit_list_text = "".join([f"- {h.title}: {h.description} ({h.times_per_week}x/week)\n" for h in habits])
    
    client = Groq(api_key=GROQ_API_KEY)
    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "system", 
                "content": (
                    "You are an expert habit gamification coach. Analyze the user's habits and return a JSON object. "
                    "The JSON object MUST have exactly two keys:\n"
                    "1. 'headline': A short, encouraging 1-sentence summary statement.\n"
                    "2. 'challenges': An array of exactly 3 distinct, highly actionable mini-missions for this week. "
                    "Make them specific to their tracked habits. Do not return any text outside of the raw JSON code block."
                )
            },
            {
                "role": "user", 
                "content": f"Here are my current habits:\n{habit_list_text}"
            }
        ],
        temperature=0.7,
        response_format={"type": "json_object"} 
    )
    
    raw_json_string = completion.choices[0].message.content
    return json.loads(raw_json_string)