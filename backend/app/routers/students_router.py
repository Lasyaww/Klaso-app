from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database.connection import get_db
from app.database.models import User, Attendance, ClassSession, Subject, Classroom, Building, StudentEnrollment
from app.auth.security import require_role

router = APIRouter(prefix="/api/students", tags=["Student Features"])

@router.get("/attendance")
def get_student_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["student"]))
):
    student_id = current_user.id
    
    import re
    year_str = str(current_user.year or "3")
    match = re.search(r'\d', year_str)
    year_num = int(match.group()) if match else 3
    sem_num = (year_num * 2) - 1
    
    def get_ordinal(n):
        if 11 <= (n % 100) <= 13: return str(n) + 'th'
        return str(n) + {1: 'st', 2: 'nd', 3: 'rd'}.get(n % 10, 'th')
        
    target_sem_str = f"{get_ordinal(sem_num)} Semester"

    subjects = db.query(Subject).filter(Subject.semester_number == sem_num).all()

    subjects_summary = []
    total_all_classes = 0
    total_all_attended = 0
    missed_records = []

    for subj in subjects:
        session = db.query(ClassSession).join(StudentEnrollment).filter(
            ClassSession.subject_id == subj.id,
            StudentEnrollment.student_id == student_id
        ).first()

        if not session:
            session = db.query(ClassSession).filter(
                ClassSession.subject_id == subj.id,
                ClassSession.semester == target_sem_str,
                ClassSession.section == (current_user.section or "Section A")
            ).first()

        fac_name = session.faculty.full_name if session and session.faculty else "Faculty"
        
        records = []
        if session:
            records = db.query(Attendance).filter(
                Attendance.student_id == student_id,
                Attendance.class_session_id == session.id
            ).all()

        total = len(records)
        attended = len([r for r in records if r.status in ["present", "late"]])
        missed = len([r for r in records if r.status == "absent"])
        percentage = round((attended / total * 100), 1) if total > 0 else 0.0

        total_all_classes += total
        total_all_attended += attended

        if percentage >= 75.0:
            status = "Good"
        elif percentage >= 65.0:
            status = "Warning"
        else:
            status = "Critical"

        subjects_summary.append({
            "subject_id": subj.id,
            "subject_code": subj.code,
            "subject_name": subj.name,
            "faculty_name": fac_name,
            "total_classes": total,
            "attended": attended,
            "missed": missed,
            "percentage": percentage,
            "status": status
        })

        if session:
            classroom = session.classroom
            building = classroom.building if classroom else None
            for r in [rec for rec in records if rec.status == "absent"]:
                missed_records.append({
                    "missed_class_id": r.id,
                    "attendance_id": r.id,
                    "student_id": student_id,
                    "class_session_id": session.id,
                    "subject_id": subj.id,
                    "subject_code": subj.code,
                    "subject_name": subj.name,
                    "faculty_name": fac_name,
                    "date": r.date,
                    "time": f"{session.start_time} – {session.end_time}",
                    "building_name": building.name if building else "Academic Block B",
                    "block": building.block if building else "Block B",
                    "room_number": classroom.room_number if classroom else "Room 204",
                    "status": "Absent"
                })
            
    # Sort missed records by date descending
    missed_records.sort(key=lambda x: x["date"], reverse=True)

    overall_percentage = round((total_all_attended / total_all_classes * 100), 1) if total_all_classes > 0 else 0.0
    
    if total_all_classes == 0:
        overall_status = "No Data"
    elif overall_percentage >= 75.0:
        overall_status = "Good"
    elif overall_percentage >= 65.0:
        overall_status = "Warning"
    else:
        overall_status = "Critical"

    low_subjects = [s for s in subjects_summary if s["percentage"] < 75.0 and s["total_classes"] > 0]

    return {
        "overall_percentage": overall_percentage,
        "total_classes": total_all_classes,
        "total_attended": total_all_attended,
        "total_missed": total_all_classes - total_all_attended,
        "required_percentage": 75.0,
        "status": overall_status,
        "low_subjects": low_subjects,
        "subjects": subjects_summary,
        "missed_records": missed_records
    }


@router.get("/today-classes")
def get_today_classes(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["student"]))
):
    student_id = current_user.id
    enrollments = db.query(StudentEnrollment).filter(StudentEnrollment.student_id == student_id).all()
    session_ids = [e.class_session_id for e in enrollments]

    # Map today's day of week
    today_name = datetime.now().strftime("%A")
    # For demo fallback if weekend, show Monday's schedule
    if today_name in ["Saturday", "Sunday"]:
        today_name = "Monday"

    if session_ids:
        sessions = db.query(ClassSession).filter(
            ClassSession.id.in_(session_ids),
            ClassSession.day_of_week == today_name
        ).all()
    else:
        import re
        year_str = str(current_user.year or "3")
        match = re.search(r'\d', year_str)
        year_num = int(match.group()) if match else 3
        sem_num = (year_num * 2) - 1
        
        def get_ordinal(n):
            if 11 <= (n % 100) <= 13: return str(n) + 'th'
            return str(n) + {1: 'st', 2: 'nd', 3: 'rd'}.get(n % 10, 'th')
            
        target_sem_str = f"{get_ordinal(sem_num)} Semester"
        sessions = db.query(ClassSession).filter(
            ClassSession.semester == target_sem_str,
            ClassSession.section == (current_user.section or "Section A"),
            ClassSession.day_of_week == today_name
        ).all()

    today_classes = []
    for s in sessions:
        classroom = s.classroom
        building = classroom.building if classroom else None
        today_classes.append({
            "id": s.id,
            "subject_code": s.subject.code,
            "subject_name": s.subject.name,
            "faculty_name": s.faculty.full_name if s.faculty else "Faculty",
            "start_time": s.start_time,
            "end_time": s.end_time,
            "building_name": building.name if building else "Academic Block B",
            "block": building.block if building else "Block B",
            "room_number": classroom.room_number if classroom else "Room 204",
            "floor": classroom.floor if classroom else "2nd Floor"
        })

    return today_classes


@router.get("/timetable")
def get_timetable(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["student"]))
):
    student_id = current_user.id
    enrollments = db.query(StudentEnrollment).filter(StudentEnrollment.student_id == student_id).all()
    session_ids = [e.class_session_id for e in enrollments]

    if session_ids:
        sessions = db.query(ClassSession).filter(ClassSession.id.in_(session_ids)).all()
    else:
        import re
        year_str = str(current_user.year or "3")
        match = re.search(r'\d', year_str)
        year_num = int(match.group()) if match else 3
        sem_num = (year_num * 2) - 1
        
        def get_ordinal(n):
            if 11 <= (n % 100) <= 13: return str(n) + 'th'
            return str(n) + {1: 'st', 2: 'nd', 3: 'rd'}.get(n % 10, 'th')
            
        target_sem_str = f"{get_ordinal(sem_num)} Semester"
        sessions = db.query(ClassSession).filter(
            ClassSession.semester == target_sem_str,
            ClassSession.section == (current_user.section or "Section A")
        ).all()

    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    timetable_by_day = {day: [] for day in days}

    for s in sessions:
        classroom = s.classroom
        building = classroom.building if classroom else None
        item = {
            "id": s.id,
            "subject_code": s.subject.code,
            "subject_name": s.subject.name,
            "faculty_name": s.faculty.full_name if s.faculty else "Faculty",
            "day_of_week": s.day_of_week,
            "start_time": s.start_time,
            "end_time": s.end_time,
            "building": building.name if building else "Block B",
            "room": classroom.room_number if classroom else "Room 204"
        }
        if s.day_of_week in timetable_by_day:
            timetable_by_day[s.day_of_week].append(item)

    return timetable_by_day



