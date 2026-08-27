from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile
import os
import shutil
import uuid
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database.connection import get_db
from app.database.models import (
    User, ClassSession, StudentEnrollment, Attendance, Note, LectureRecording, Subject
)
from app.schemas.schemas import MarkAttendanceRequest, NoteCreate, RecordingCreate
from app.auth.security import require_role
from app.services.rag.rag_pipeline import ingest_document

try:
    import PyPDF2
except ImportError:
    PyPDF2 = None

router = APIRouter(prefix="/api/faculty", tags=["Faculty Features"])

@router.get("/classes")
def get_faculty_classes(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["faculty"]))
):
    sessions = db.query(ClassSession).filter(ClassSession.faculty_id == current_user.id).all()
    result = []
    for s in sessions:
        classroom = s.classroom
        building = classroom.building if classroom else None
        student_count = db.query(StudentEnrollment).filter(StudentEnrollment.class_session_id == s.id).count()

        result.append({
            "id": s.id,
            "subject_id": s.subject_id,
            "subject_code": s.subject.code,
            "subject_name": s.subject.name,
            "day_of_week": s.day_of_week,
            "start_time": s.start_time,
            "end_time": s.end_time,
            "building_name": building.name if building else "Block B",
            "room_number": classroom.room_number if classroom else "204",
            "section": s.section,
            "semester": s.semester,
            "total_students": student_count
        })

    return result


@router.get("/classes/{class_id}/students")
def get_class_students(
    class_id: int,
    date: str = datetime.now().strftime("%Y-%m-%d"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["faculty"]))
):
    session = db.query(ClassSession).filter(ClassSession.id == class_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Class session not found.")

    enrollments = db.query(StudentEnrollment).filter(StudentEnrollment.class_session_id == class_id).all()
    student_ids = [e.student_id for e in enrollments]

    students = db.query(User).filter(User.id.in_(student_ids)).all() if student_ids else []

    # Get attendance status for the specified date if already marked
    attendance_records = db.query(Attendance).filter(
        Attendance.class_session_id == class_id,
        Attendance.date == date
    ).all()
    attendance_map = {a.student_id: a.status for a in attendance_records}

    result = []
    for st in students:
        # Calculate overall attendance % in this class
        all_logs = db.query(Attendance).filter(
            Attendance.student_id == st.id,
            Attendance.class_session_id == class_id
        ).all()
        tot = len(all_logs)
        att = len([l for l in all_logs if l.status in ["present", "late"]])
        pct = round((att / tot * 100), 1) if tot > 0 else 0.0

        result.append({
            "student_id": st.id,
            "full_name": st.full_name,
            "reg_no": st.reg_no,
            "email": st.email,
            "profile_pic": st.profile_pic,
            "current_status": attendance_map.get(st.id, "present"),
            "attendance_percentage": pct,
            "is_low_attendance": pct < 75.0
        })

    return {
        "class_id": class_id,
        "subject_name": session.subject.name,
        "date": date,
        "students": result
    }


@router.post("/attendance")
def mark_attendance(
    req: MarkAttendanceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["faculty"]))
):
    session = db.query(ClassSession).filter(ClassSession.id == req.class_session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Class session not found.")

    for rec in req.records:
        st_id = rec.get("student_id")
        st_status = rec.get("status", "present")

        existing = db.query(Attendance).filter(
            Attendance.student_id == st_id,
            Attendance.class_session_id == req.class_session_id,
            Attendance.date == req.date
        ).first()

        if existing:
            existing.status = st_status
            existing.marked_by = current_user.id
        else:
            new_att = Attendance(
                student_id=st_id,
                class_session_id=req.class_session_id,
                date=req.date,
                status=st_status,
                marked_by=current_user.id
            )
            db.add(new_att)

    db.commit()
    return {"message": "Attendance successfully recorded!", "count": len(req.records)}


@router.get("/low-attendance-alerts")
def get_low_attendance_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["faculty"]))
):
    # Find all sessions taught by faculty
    sessions = db.query(ClassSession).filter(ClassSession.faculty_id == current_user.id).all()
    session_ids = [s.id for s in sessions]

    alerts = []
    for session in sessions:
        enrollments = db.query(StudentEnrollment).filter(StudentEnrollment.class_session_id == session.id).all()
        for e in enrollments:
            st = e.student
            logs = db.query(Attendance).filter(
                Attendance.student_id == st.id,
                Attendance.class_session_id == session.id
            ).all()
            tot = len(logs)
            att = len([l for l in logs if l.status in ["present", "late"]])
            pct = round((att / tot * 100), 1) if tot > 0 else 0.0

            if pct < 75.0 and tot > 0:
                alerts.append({
                    "student_id": st.id,
                    "student_name": st.full_name,
                    "reg_no": st.reg_no,
                    "subject_code": session.subject.code,
                    "subject_name": session.subject.name,
                    "attendance_percentage": pct,
                    "attended": att,
                    "total_classes": tot,
                    "severity": "Critical" if pct < 65.0 else "Warning"
                })

    return alerts


@router.post("/notes")
def upload_note(
    title: str = Form(...),
    description: str = Form(""),
    subject_id: int = Form(...),
    class_session_id: int = Form(None),
    content_text: str = Form(""),
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["faculty"]))
):
    file_url = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    
    if file and file.filename:
        # Create uploads dir if it doesn't exist (failsafe)
        os.makedirs("uploads", exist_ok=True)
        # Generate safe unique filename
        ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join("uploads", unique_filename)
        
        # Read the file for both saving and parsing
        file_content = file.file.read()
        
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)
            
        file_url = f"http://localhost:8000/uploads/{unique_filename}"
        
        # Extract text for RAG
        extracted_text = ""
        if file.filename.endswith(".pdf") and PyPDF2:
            try:
                import io
                pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
                for page in pdf_reader.pages:
                    text = page.extract_text()
                    if text: extracted_text += text + "\n"
            except Exception as e:
                print(f"Error parsing PDF for RAG: {e}")
                
        if extracted_text:
            subject = db.query(Subject).filter(Subject.id == subject_id).first()
            subject_name = subject.name if subject else "General"
            ingest_document(extracted_text, source=file.filename, subject=subject_name)

    note = Note(
        title=title,
        description=description,
        content_text=content_text or f"Comprehensive class notes on '{title}' covering core definitions and exam tips.",
        file_url=file_url,
        subject_id=subject_id,
        class_session_id=class_session_id,
        faculty_id=current_user.id
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return {"message": "Study note uploaded successfully!", "note_id": note.id}


@router.post("/recordings")
def upload_recording(
    req: RecordingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["faculty"]))
):
    rec = LectureRecording(
        title=req.title,
        recording_url=req.recording_url,
        subject_id=req.subject_id,
        class_session_id=req.class_session_id,
        faculty_id=current_user.id
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return {"message": "Lecture recording added successfully!", "recording_id": rec.id}
