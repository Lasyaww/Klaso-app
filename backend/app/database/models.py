from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.connection import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False) # 'student', 'faculty', 'admin'
    full_name = Column(String, nullable=False)
    reg_no = Column(String, unique=True, index=True, nullable=True) # Reg No for student / Faculty ID for faculty
    phone = Column(String, nullable=True)
    department = Column(String, nullable=True)
    year = Column(String, nullable=True)
    section = Column(String, nullable=True)
    designation = Column(String, nullable=True)
    profile_pic = Column(String, nullable=True)
    profile_picture_update_used = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    attendances = relationship("Attendance", back_populates="student", foreign_keys="[Attendance.student_id]")
    enrollments = relationship("StudentEnrollment", back_populates="student")
    notes_created = relationship("Note", back_populates="faculty")
    quizzes_created = relationship("Quiz", back_populates="creator")
    quiz_attempts = relationship("QuizAttempt", back_populates="student")
    notifications = relationship("Notification", back_populates="user")
    ai_conversations = relationship("AIConversation", back_populates="student")

class ApprovedRoster(Base):
    """Admin-managed pre-authorized roster of students & faculty eligible for account signup"""
    __tablename__ = "approved_roster"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    reg_no = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False) # 'student' or 'faculty'
    department = Column(String, nullable=False, default="Computer Science")
    year = Column(String, nullable=True)
    section = Column(String, nullable=True)
    designation = Column(String, nullable=True)
    is_registered = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuthorizedDomain(Base):
    __tablename__ = "authorized_domains"

    id = Column(Integer, primary_key=True, index=True)
    domain = Column(String, unique=True, index=True, nullable=False)
    is_active = Column(Boolean, default=True)

class Building(Base):
    __tablename__ = "buildings"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    block = Column(String, nullable=False)
    floor = Column(String, nullable=True)

    classrooms = relationship("Classroom", back_populates="building")

class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String, nullable=False)
    building_id = Column(Integer, ForeignKey("buildings.id"), nullable=False)
    floor = Column(String, nullable=True)
    capacity = Column(Integer, default=60)

    building = relationship("Building", back_populates="classrooms")
    class_sessions = relationship("ClassSession", back_populates="classroom")

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False) # CS301
    name = Column(String, nullable=False) # Data Structures
    department = Column(String, nullable=False)
    semester_number = Column(Integer, default=5, nullable=False) # 1 to 8
    credits = Column(Integer, default=4)
    description = Column(Text, nullable=True)
    syllabus_text = Column(Text, nullable=True)

    class_sessions = relationship("ClassSession", back_populates="subject")
    notes = relationship("Note", back_populates="subject")
    recordings = relationship("LectureRecording", back_populates="subject")
    quizzes = relationship("Quiz", back_populates="subject")

class ClassSession(Base):
    __tablename__ = "class_sessions"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    faculty_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=False)
    day_of_week = Column(String, nullable=False)
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)
    semester = Column(String, nullable=False)
    section = Column(String, nullable=False)

    subject = relationship("Subject", back_populates="class_sessions")
    faculty = relationship("User", foreign_keys="[ClassSession.faculty_id]")
    classroom = relationship("Classroom", back_populates="class_sessions")
    enrollments = relationship("StudentEnrollment", back_populates="class_session")
    attendances = relationship("Attendance", back_populates="class_session")

class StudentEnrollment(Base):
    __tablename__ = "student_enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    class_session_id = Column(Integer, ForeignKey("class_sessions.id"), nullable=False)

    student = relationship("User", back_populates="enrollments")
    class_session = relationship("ClassSession", back_populates="enrollments")

class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    class_session_id = Column(Integer, ForeignKey("class_sessions.id"), nullable=False)
    date = Column(String, nullable=False)
    status = Column(String, nullable=False) # 'present', 'absent', 'late'
    marked_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("User", back_populates="attendances", foreign_keys="[Attendance.student_id]")
    class_session = relationship("ClassSession", back_populates="attendances")

class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    file_url = Column(String, nullable=True)
    content_text = Column(Text, nullable=True)
    unit_number = Column(Integer, default=1) # Unit 1, Unit 2, etc.
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    class_session_id = Column(Integer, ForeignKey("class_sessions.id"), nullable=True)
    faculty_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    subject = relationship("Subject", back_populates="notes")
    faculty = relationship("User", back_populates="notes_created")

class LectureRecording(Base):
    __tablename__ = "lecture_recordings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    recording_url = Column(String, nullable=False)
    duration_minutes = Column(Integer, default=45)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    class_session_id = Column(Integer, ForeignKey("class_sessions.id"), nullable=True)
    faculty_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    subject = relationship("Subject", back_populates="recordings")

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    class_session_id = Column(Integer, ForeignKey("class_sessions.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    difficulty = Column(String, default="Medium")
    questions_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    subject = relationship("Subject", back_populates="quizzes")
    creator = relationship("User", back_populates="quizzes_created")
    attempts = relationship("QuizAttempt", back_populates="quiz")

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    score = Column(Integer, nullable=False)
    total_questions = Column(Integer, nullable=False)
    attempted_at = Column(DateTime, default=datetime.utcnow)

    quiz = relationship("Quiz", back_populates="attempts")
    student = relationship("User", back_populates="quiz_attempts")

class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    title = Column(String, default="Academic Discussion")
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("User", back_populates="ai_conversations")
    messages = relationship("AIMessage", back_populates="conversation")

class AIMessage(Base):
    __tablename__ = "ai_messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("ai_conversations.id"), nullable=False)
    sender = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    is_missed_class_context = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("AIConversation", back_populates="messages")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, default="info")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")

class TopicProgress(Base):
    __tablename__ = "topic_progress"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_name = Column(String, nullable=False)
    topic_name = Column(String, nullable=False)
    weakness_score = Column(Integer, default=0) # 0 (Strong) to 100 (Weak)
    questions_asked = Column(Integer, default=0)
    quiz_attempts = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    incorrect_answers = Column(Integer, default=0)
    last_studied = Column(DateTime, default=datetime.utcnow)

    student = relationship("User")
