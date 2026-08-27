from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.database.models import User, Note, LectureRecording, Subject, StudentEnrollment, ClassSession
from app.auth.security import get_current_user

router = APIRouter(prefix="/api/notes", tags=["Notes & Materials"])

@router.get("/")
def get_all_notes(
    subject_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Note)
    
    if current_user.role == "student":
        enrollments = db.query(StudentEnrollment).filter(StudentEnrollment.student_id == current_user.id).all()
        session_ids = [e.class_session_id for e in enrollments]
        sessions = db.query(ClassSession).filter(ClassSession.id.in_(session_ids)).all()
        enrolled_subject_ids = [s.subject_id for s in sessions]
        query = query.filter(Note.subject_id.in_(enrolled_subject_ids))
        
    if subject_id:
        query = query.filter(Note.subject_id == subject_id)
        
    notes = query.order_by(Note.created_at.desc()).all()

    return [{
        "id": n.id,
        "title": n.title,
        "description": n.description,
        "content_text": n.content_text,
        "file_url": n.file_url,
        "subject_id": n.subject_id,
        "subject_code": n.subject.code if n.subject else "SUBJ",
        "subject_name": n.subject.name if n.subject else "Subject",
        "faculty_name": n.faculty.full_name if n.faculty else "Faculty",
        "created_at": n.created_at
    } for n in notes]


@router.get("/recordings")
def get_all_recordings(
    subject_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(LectureRecording)
    if subject_id:
        query = query.filter(LectureRecording.subject_id == subject_id)
    recs = query.order_by(LectureRecording.created_at.desc()).all()

    return [{
        "id": r.id,
        "title": r.title,
        "recording_url": r.recording_url,
        "subject_id": r.subject_id,
        "subject_name": r.subject.name if r.subject else "Subject",
        "created_at": r.created_at
    } for r in recs]
