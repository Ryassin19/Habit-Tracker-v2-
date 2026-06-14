````markdown id="kq9m21"
# 🚀 AI-Powered Habit Tracker Backend

A robust, high-performance REST API built with FastAPI that helps users track their daily habits and leverages AI to provide personalized insights and motivation.

## ✨ Features
* **User Authentication:** Secure password hashing and JWT token-based authentication.
* **Habit Management:** Full CRUD operations (Create, Read, Update, Delete) for habits.
* **AI Motivation Engine:** Integration with the Groq API to generate personalized coaching insights.
* **Cloud Database:** PostgreSQL for scalable and reliable data storage.

## 🛠️ Tech Stack
* **Framework:** FastAPI (Python)
* **Database:** PostgreSQL
* **ORM:** SQLModel
* **AI Engine:** Groq SDK (LLaMA inference)
* **Security:** Passlib (bcrypt) & JWT (PyJWT)

## 📁 Project Structure
```text
├── main.py              # Main FastAPI application
├── database.py          # Database models & session management
├── security.py          # Password hashing utilities
├── requirements.txt     # Dependencies
└── .env                 # Environment variables (not committed)
````

## 🚀 Local Installation & Setup

```bash id="setup2"
# 1. Clone the repository
git clone https://github.com/Ryassin19/Habit-Tracker-v2-.git
cd Habit-Tracker-v2-

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set up environment variables
# Create a .env file in the root directory and add:
DATABASE_URL=your_postgresql_connection_string
SECRET_KEY=your_jwt_secret_key
GROQ_API_KEY=your_groq_api_key

# 4. Run the server
uvicorn main:app --reload

# API will be available at:
http://127.0.0.1:8000
# Docs:
http://127.0.0.1:8000/docs
```

```
```
