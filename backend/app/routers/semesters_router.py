from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database.connection import get_db
from app.database.models import (
    User, Subject, ClassSession, StudentEnrollment, Attendance, Note, LectureRecording, Classroom, Building, Quiz
)
from app.auth.security import require_role, get_current_user

router = APIRouter(prefix="/api/students", tags=["Semester & Subjects Management"])

@router.get("/semesters")
def get_student_semesters(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["student"]))
):
    student_id = current_user.id
    
    import re
    year_str = str(current_user.year or "3")
    match = re.search(r'\d', year_str)
    year_num = int(match.group()) if match else 3
    current_sem_num = (year_num * 2) - 1

    # Get student's enrollments
    enrollments = db.query(StudentEnrollment).filter(StudentEnrollment.student_id == student_id).all()
    session_ids = [e.class_session_id for e in enrollments]

    # Calculate Current Semester Progress Stats
    sem_subjects = db.query(Subject).filter(Subject.semester_number == current_sem_num).all()
    
    good_cnt = 0
    low_cnt = 0
    crit_cnt = 0
    tot_attended = 0
    tot_classes = 0

    for subj in sem_subjects:
        sessions = db.query(ClassSession).filter(ClassSession.subject_id == subj.id).all()
        sess_ids = [s.id for s in sessions]
        
        logs = db.query(Attendance).filter(
            Attendance.student_id == student_id,
            Attendance.class_session_id.in_(sess_ids)
        ).all() if sess_ids else []

        tot = len(logs)
        att = len([l for l in logs if l.status in ["present", "late"]])
        pct = round((att / tot * 100), 1) if tot > 0 else 100.0

        tot_classes += tot
        tot_attended += att

        if pct >= 75.0:
            good_cnt += 1
        elif pct >= 65.0:
            low_cnt += 1
        else:
            crit_cnt += 1

    overall_sem_pct = round((tot_attended / tot_classes * 100), 1) if tot_classes > 0 else 78.0

    # Build 8 Semesters List
    semesters = []
    for sem in range(1, 9):
        subj_count = db.query(Subject).filter(Subject.semester_number == sem).count()
        if subj_count == 0:
            subj_count = 6

        if sem < current_sem_num:
            status = "Completed"
        elif sem == current_sem_num:
            status = "Current"
        else:
            status = "Upcoming"

        semesters.append({
            "semester_number": sem,
            "title": f"Semester {sem}",
            "subject_count": subj_count,
            "status": status,
            "is_current": sem == current_sem_num
        })

    return {
        "current_semester": current_sem_num,
        "progress": {
            "semester_number": current_sem_num,
            "total_subjects": len(sem_subjects) if sem_subjects else 6,
            "good_attendance_count": good_cnt,
            "low_attendance_count": low_cnt,
            "critical_attendance_count": crit_cnt,
            "overall_attendance_percentage": overall_sem_pct
        },
        "semesters": semesters
    }


@router.get("/semesters/{sem_number}/subjects")
def get_semester_subjects(
    sem_number: int,
    q: Optional[str] = None,
    filter_type: Optional[str] = None, # 'good', 'low', 'critical', 'notes', 'lectures'
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["student"]))
):
    student_id = current_user.id
    
    subjects_query = db.query(Subject).filter(Subject.semester_number == sem_number)
    subjects = subjects_query.all()

    result = []
    for subj in subjects:
        # Find session & faculty
        session = db.query(ClassSession).filter(ClassSession.subject_id == subj.id).first()
        faculty = session.faculty if session else None
        classroom = session.classroom if session else None
        building = classroom.building if classroom else None

        # Attendance calculation
        sessions = db.query(ClassSession).filter(ClassSession.subject_id == subj.id).all()
        sess_ids = [s.id for s in sessions]
        logs = db.query(Attendance).filter(
            Attendance.student_id == student_id,
            Attendance.class_session_id.in_(sess_ids)
        ).all() if sess_ids else []

        tot = len(logs)
        att = len([l for l in logs if l.status in ["present", "late"]])
        missed = len([l for l in logs if l.status == "absent"])
        pct = round((att / tot * 100), 1) if tot > 0 else 80.0

        if pct >= 75.0:
            att_status = "Good"
        elif pct >= 65.0:
            att_status = "Warning"
        else:
            att_status = "Critical"

        notes_count = db.query(Note).filter(Note.subject_id == subj.id).count()
        lectures_count = db.query(LectureRecording).filter(LectureRecording.subject_id == subj.id).count()

        item = {
            "subject_id": subj.id,
            "subject_code": subj.code,
            "subject_name": subj.name,
            "faculty_name": faculty.full_name if faculty else "Dr. Kumar",
            "faculty_designation": faculty.designation if faculty else "Professor",
            "semester_number": subj.semester_number,
            "credits": subj.credits,
            "attendance_percentage": pct,
            "total_classes": tot,
            "attended": att,
            "missed": missed,
            "attendance_status": att_status,
            "next_class": f"{session.start_time} - {session.end_time}" if session else "10:00 AM",
            "classroom": f"{building.block if building else 'Block B'} — {classroom.room_number if classroom else 'Room 204'}",
            "building_name": building.name if building else "Academic Block B",
            "notes_count": notes_count,
            "lectures_count": lectures_count
        }

        # Apply search filter
        if q:
            term = q.lower().strip()
            if term not in item["subject_name"].lower() and term not in item["faculty_name"].lower() and term not in item["subject_code"].lower():
                continue

        # Apply status filter
        if filter_type:
            ft = filter_type.lower()
            if ft == "good" and pct < 75.0:
                continue
            elif ft == "low" and (pct < 65.0 or pct >= 75.0):
                continue
            elif ft == "critical" and pct >= 65.0:
                continue
            elif ft == "notes" and notes_count == 0:
                continue
            elif ft == "lectures" and lectures_count == 0:
                continue

        result.append(item)

    return {
        "semester_number": sem_number,
        "total_subjects": len(result),
        "subjects": result
    }


@router.get("/subjects/{subject_id}")
def get_subject_detail(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["student"]))
):
    student_id = current_user.id
    subj = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subj:
        raise HTTPException(status_code=404, detail="Subject not found.")

    session = db.query(ClassSession).filter(ClassSession.subject_id == subj.id).first()
    faculty = session.faculty if session else None
    classroom = session.classroom if session else None
    building = classroom.building if classroom else None

    # Attendance logs
    sessions = db.query(ClassSession).filter(ClassSession.subject_id == subj.id).all()
    sess_ids = [s.id for s in sessions]
    logs = db.query(Attendance).filter(
        Attendance.student_id == student_id,
        Attendance.class_session_id.in_(sess_ids)
    ).all() if sess_ids else []

    tot = len(logs)
    att = len([l for l in logs if l.status in ["present", "late"]])
    missed = len([l for l in logs if l.status == "absent"])
    pct = round((att / tot * 100), 1) if tot > 0 else 82.0

    if pct >= 75.0:
        att_status = "Good"
    elif pct >= 65.0:
        att_status = "Warning"
    else:
        att_status = "Critical"

    return {
        "subject_id": subj.id,
        "subject_code": subj.code,
        "subject_name": subj.name,
        "faculty_name": faculty.full_name if faculty else "Dr. Kumar",
        "faculty_email": faculty.email if faculty else "dr.kumar@klaso.edu",
        "faculty_profile_pic": faculty.profile_pic if faculty else "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        "semester_number": subj.semester_number,
        "credits": subj.credits,
        "description": subj.description or f"Core departmental course covering fundamental principles of {subj.name}.",
        "attendance": {
            "percentage": pct,
            "attended": att,
            "missed": missed,
            "total": tot,
            "required_percentage": 75.0,
            "status": att_status
        },
        "next_class": f"{session.start_time} - {session.end_time}" if session else "10:00 AM",
        "location": f"{building.block if building else 'Block B'} — {classroom.room_number if classroom else 'Room 204'}",
        "building_name": building.name if building else "Academic Block B"
    }


@router.get("/subjects/{subject_id}/attendance")
def get_subject_attendance_history(
    subject_id: int,
    status_filter: Optional[str] = None, # 'all', 'present', 'absent'
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["student"]))
):
    student_id = current_user.id
    sessions = db.query(ClassSession).filter(ClassSession.subject_id == subject_id).all()
    sess_ids = [s.id for s in sessions]

    query = db.query(Attendance).filter(
        Attendance.student_id == student_id,
        Attendance.class_session_id.in_(sess_ids)
    )

    if status_filter and status_filter.lower() != 'all':
        query = query.filter(Attendance.status == status_filter.lower())

    records = query.order_by(Attendance.date.desc()).all() if sess_ids else []

    history = []
    for r in records:
        sess = r.class_session
        history.append({
            "id": r.id,
            "date": r.date,
            "time": f"{sess.start_time} - {sess.end_time}" if sess else "10:00 AM",
            "status": r.status.title(),
            "marked_by": "Faculty Instructor"
        })

    return history


@router.get("/subjects/{subject_id}/notes")
def get_subject_notes(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["student"]))
):
    notes = db.query(Note).filter(Note.subject_id == subject_id).order_by(Note.unit_number.asc()).all()
    return [{
        "id": n.id,
        "unit_number": n.unit_number,
        "unit_title": f"Unit {n.unit_number} — {n.title}",
        "title": n.title,
        "description": n.description,
        "content_text": n.content_text,
        "file_url": n.file_url or "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        "created_at": n.created_at
    } for n in notes]


@router.get("/subjects/{subject_id}/lectures")
def get_subject_lectures(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["student"]))
):
    recs = db.query(LectureRecording).filter(LectureRecording.subject_id == subject_id).order_by(LectureRecording.created_at.desc()).all()
    return [{
        "id": r.id,
        "title": r.title,
        "recording_url": r.recording_url,
        "duration_minutes": r.duration_minutes,
        "created_at": r.created_at
    } for r in recs]


@router.get("/subjects/{subject_id}/missed-classes")
def get_subject_missed_classes(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["student"]))
):
    student_id = current_user.id
    sessions = db.query(ClassSession).filter(ClassSession.subject_id == subject_id).all()
    sess_ids = [s.id for s in sessions]

    absent_records = db.query(Attendance).filter(
        Attendance.student_id == student_id,
        Attendance.class_session_id.in_(sess_ids),
        Attendance.status == "absent"
    ).order_by(Attendance.date.desc()).all() if sess_ids else []

    missed_list = []
    for r in absent_records:
        sess = r.class_session
        subj = sess.subject if sess else None
        fac = sess.faculty if sess else None
        classroom = sess.classroom if sess else None
        building = classroom.building if classroom else None

        missed_list.append({
            "attendance_id": r.id,
            "class_session_id": sess.id if sess else 0,
            "subject_id": subj.id if subj else subject_id,
            "subject_code": subj.code if subj else "CS301",
            "subject_name": subj.name if subj else "Subject",
            "faculty_name": fac.full_name if fac else "Dr. Kumar",
            "date": r.date,
            "time": f"{sess.start_time} - {sess.end_time}" if sess else "10:00 AM",
            "building_name": building.name if building else "Block B",
            "room_number": classroom.room_number if classroom else "Room 204",
            "status": "Absent"
        })

    return missed_list


@router.get("/subjects/{subject_id}/quizzes")
def get_subject_quizzes(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["student"]))
):
    quizzes = db.query(Quiz).filter(Quiz.subject_id == subject_id).order_by(Quiz.created_at.desc()).all()
    return [{
        "id": q.id,
        "title": q.title,
        "difficulty": q.difficulty,
        "created_at": q.created_at
    } for q in quizzes]


@router.get("/subjects/{subject_id}/schedule")
def get_subject_schedule(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["student"]))
):
    sessions = db.query(ClassSession).filter(ClassSession.subject_id == subject_id).all()
    
    schedule = []
    for s in sessions:
        classroom = s.classroom if s else None
        building = classroom.building if classroom else None
        schedule.append({
            "id": s.id,
            "day_of_week": s.day_of_week,
            "start_time": s.start_time,
            "end_time": s.end_time,
            "room_number": classroom.room_number if classroom else "Unknown",
            "building_name": building.name if building else "Unknown",
            "block": building.block if building else "Unknown"
        })
    return schedule
