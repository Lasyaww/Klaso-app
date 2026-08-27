from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from contextlib import asynccontextmanager

from app.database.connection import Base, engine
from app.database.seed_data import init_db_and_seed
from app.routers import (
    auth_router, students_router, faculty_router, admin_router,
    ai_router, notes_router, quizzes_router, notifications_router, semesters_router
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database schemas and seed default demo accounts on startup
    init_db_and_seed()
    yield

app = FastAPI(
    title="Klaso — Student Attendance & AI Learning Platform API",
    description="Backend API powering Klaso attendance tracking, room locator, role control, and AI Study Buddy.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploads
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Register API Routers
app.include_router(auth_router.router)
app.include_router(students_router.router)
app.include_router(semesters_router.router)
app.include_router(faculty_router.router)
app.include_router(admin_router.router)
app.include_router(ai_router.router)
app.include_router(notes_router.router)
app.include_router(quizzes_router.router)
app.include_router(notifications_router.router)

@app.get("/")
def root():
    return {
        "app": "Klaso - Student Attendance Management System with AI Study Buddy",
        "status": "online",
        "tagline": "Smart Attendance. Smarter Learning."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
