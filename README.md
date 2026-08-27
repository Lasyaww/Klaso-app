# KLASO — Student Attendance Management System with AI Study Buddy 🤖

> **Tagline:** "Smart Attendance. Smarter Learning."

Klaso is a complete, modern, student-friendly **Student Attendance Management Web Application** featuring dynamic attendance calculation, automatic low-attendance warning systems, classroom location locator, faculty management, master admin control, and an integrated academic **AI Study Buddy**.

---

## Key Features

1. **Brand Identity & Splash Screen**:
   - Original Klaso Academic Cap + AI Sparkle Logo.
   - Branded loading splash screen on app startup.

2. **Role-Based Authentication & Verification**:
   - Separate login & signup flows for **Student**, **Faculty**, and **Admin**.
   - Authorized college email domain validation (`@klaso.edu`).
   - 6-digit OTP verification flow for signup and password reset.

3. **Student Dashboard & Attendance Engine**:
   - Real-time overall & subject-wise attendance calculation.
   - **Low Attendance Warning System**:
     - 🟢 Good (≥75%)
     - 🟡 Low Warning (65% - 74%)
     - 🔴 Critical Alert (<65%) with breakdown table of low-attendance subjects.
   - **Today's Classes & Location**: Displays exact Building, Block, and Room Number (e.g. `📍 Block B — Room 204`).
   - **Missed Class Cards**: Generates cards when marked absent. Clicking launches AI Study Buddy pre-loaded with that missed class recap!

4. **AI Study Buddy 🤖**:
   - **Strict Academic Guardrails**: Rejects non-academic prompts (jokes, movies, sports) with friendly academic redirects.
   - **Context-Aware Academic Chat**: Doubts clarification in student subjects.
   - **Note Summarizer & Exam Revision Mode**: Generates Quick Summaries, Key Concepts, Definitions, Exam Points, and Last-minute Revisions.
   - **AI Quiz Generator**: Generates 5 dynamic MCQs with score reports and detailed explanations.
   - **Missed Class AI Assistant**: Provides recap, lecture notes link, and missed lecture quizzes.

5. **Faculty Workspace**:
   - View assigned classes and mark attendance (individual & bulk checkboxes).
   - Low attendance warning roster for students.
   - Upload PDF/text notes and lecture materials.

6. **Admin Control Panel**:
   - Campus overview analytics (Total Students, Faculty, Subjects, Classes, Attendance %).
   - Manage authorized college email domains (`@klaso.edu`).
   - User account management (Activate/Deactivate).

---

## Tech Stack

- **Frontend**: React.js 18, Vite, React Router v6, CSS3 Glassmorphism design system, Lucide Icons.
- **Backend**: Python 3.10+, FastAPI, SQLAlchemy ORM, Pydantic v2, `python-jose` (JWT), `passlib` (`bcrypt`).
- **Database**: SQLite (`klaso.db`) out of the box with full support for PostgreSQL.
- **AI Engine**: Integrated Google Gemini API (`GEMINI_API_KEY`) with intelligent internal offline fallback engine.

---

## Demo Test Accounts & Credentials

| Role | College Email | ID / Reg No | Password | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | `lasya@klaso.edu` | `22ABC123` | `Student@123` | Has low attendance in DS (60%) & DBMS (70%) to test warnings & missed class cards |
| **Student** | `rahul@klaso.edu` | `22ABC124` | `Student@123` | Good attendance (88%) |
| **Faculty** | `dr.kumar@klaso.edu` | `FAC001` | `Faculty@123` | Teaches Data Structures |
| **Faculty** | `prof.priya@klaso.edu` | `FAC002` | `Faculty@123` | Teaches DBMS & Computer Networks |
| **Admin** | `admin@klaso.edu` | `ADM001` | `Admin@123` | Master System Administrator |

---

## How to Run Locally

### 1. Start the FastAPI Backend
```bash
cd backend
python -m venv venv
# Activate virtual environment:
# Windows: venv\Scripts\activate
# Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
Backend API docs available at: `http://127.0.0.1:8000/docs`

### 2. Start the React Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend application opens at: `http://localhost:5173`
