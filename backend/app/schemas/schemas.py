from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str
    role: str # 'student', 'faculty', 'admin'
    reg_no: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: str
    reg_no: str # Student Reg No or Faculty ID
    new_password: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class StudentSignupRequest(BaseModel):
    full_name: str
    reg_no: str
    email: str
    phone: str
    department: str
    year: str
    section: str
    password: str
    profile_pic: Optional[str] = None

class FacultySignupRequest(BaseModel):
    full_name: str
    reg_no: str # Employee ID
    email: str
    department: str
    designation: str
    phone: str
    password: str

# Roster Schema
class RosterCreate(BaseModel):
    email: str
    reg_no: str
    full_name: str
    role: str # 'student' or 'faculty'
    department: Optional[str] = "Computer Science"
    year: Optional[str] = "3rd Year"
    section: Optional[str] = "Section A"
    designation: Optional[str] = "Assistant Professor"

class RosterResponse(BaseModel):
    id: int
    email: str
    reg_no: str
    full_name: str
    role: str
    department: str
    is_registered: bool
    created_at: datetime

# Domain Schema
class DomainCreate(BaseModel):
    domain: str

class DomainResponse(BaseModel):
    id: int
    domain: str
    is_active: bool

# Profile Schema
class UserProfile(BaseModel):
    id: int
    email: str
    role: str
    full_name: str
    reg_no: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    year: Optional[str] = None
    section: Optional[str] = None
    designation: Optional[str] = None
    profile_pic: Optional[str] = None
    profile_picture_update_used: bool = False
    is_active: bool

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    year: Optional[str] = None
    section: Optional[str] = None
    designation: Optional[str] = None
    profile_pic: Optional[str] = None

# Attendance Schemas
class SubjectAttendanceSummary(BaseModel):
    subject_id: int
    subject_code: str
    subject_name: str
    faculty_name: str
    total_classes: int
    attended: int
    missed: int
    percentage: float
    status: str

class OverallAttendanceSummary(BaseModel):
    overall_percentage: float
    total_classes: int
    total_attended: int
    total_missed: int
    required_percentage: float = 75.0
    status: str
    low_subjects: List[SubjectAttendanceSummary]
    subjects: List[SubjectAttendanceSummary]

class MarkAttendanceRequest(BaseModel):
    class_session_id: int
    date: str
    records: List[dict]

# Timetable & Classes
class ClassSessionResponse(BaseModel):
    id: int
    subject_code: str
    subject_name: str
    faculty_name: str
    day_of_week: str
    start_time: str
    end_time: str
    building_name: str
    block: str
    room_number: str
    floor: Optional[str] = None
    section: str
    semester: str

class MissedClassResponse(BaseModel):
    attendance_id: int
    class_session_id: int
    subject_code: str
    subject_name: str
    faculty_name: str
    date: str
    time: str
    building_name: str
    block: str
    room_number: str
    status: str

# Notes & Recordings
class NoteCreate(BaseModel):
    title: str
    description: Optional[str] = None
    content_text: Optional[str] = None
    subject_id: int
    class_session_id: Optional[int] = None
    file_url: Optional[str] = None

class RecordingCreate(BaseModel):
    title: str
    recording_url: str
    subject_id: int
    class_session_id: Optional[int] = None

# AI Study Buddy Schemas
class AIChatRequest(BaseModel):
    message: str
    subject_id: Optional[int] = None
    conversation_id: Optional[int] = None
    is_missed_class_context: bool = False
    missed_class_details: Optional[dict] = None

class AISummarizeRequest(BaseModel):
    note_id: Optional[int] = None
    content_text: Optional[str] = None
    subject_name: Optional[str] = None

class AIQuizGenerateRequest(BaseModel):
    subject_id: int
    topic: str
    difficulty: str = "Medium"
    num_questions: int = 5
    note_id: Optional[int] = None

class QuizSubmitRequest(BaseModel):
    quiz_id: int
    answers: dict

class AIQuizResultRequest(BaseModel):
    subject_name: str
    topic: str
    score: int
    total_questions: int
    incorrect_answers: int

class TopicProgressResponse(BaseModel):
    subject_name: str
    topic_name: str
    weakness_score: int
    status: str

class SubjectProgressResponse(BaseModel):
    subject_name: str
    progress_percentage: int

class AIPulseResponse(BaseModel):
    subjects: List[SubjectProgressResponse]
    topics_to_review: List[TopicProgressResponse]

class AIQuickRevisionRequest(BaseModel):
    mode: str # '2-min', '5-min', '10-min'

# Notification
class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime
