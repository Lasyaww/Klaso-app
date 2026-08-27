import os
import sys
import re
from datetime import datetime, timedelta
import random

# Add current dir to python path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.database.models import User, Attendance, ClassSession, Subject, StudentEnrollment, Classroom

def get_ordinal(n):
    if 11 <= (n % 100) <= 13: return str(n) + 'th'
    return str(n) + {1: 'st', 2: 'nd', 3: 'rd'}.get(n % 10, 'th')

def run_reseed():
    db = SessionLocal()
    try:
        print("Clearing old attendance records...")
        db.query(Attendance).delete()
        db.commit()

        students = db.query(User).filter_by(role="student").all()
        faculties = db.query(User).filter_by(role="faculty").all()
        classrooms = db.query(Classroom).all()

        if not faculties:
            print("No faculty found! Cannot reseed.")
            return
        if not classrooms:
            print("No classrooms found! Cannot reseed.")
            return

        today = datetime.now()

        for student in students:
            # Determine student's semester based on year
            year_str = str(student.year or "3")
            match = re.search(r'\d', year_str)
            year_num = int(match.group()) if match else 3
            sem_num = (year_num * 2) - 1
            target_sem_str = f"{get_ordinal(sem_num)} Semester"
            
            # Use default section if missing
            student_section = student.section or "Section A"

            subjects = db.query(Subject).filter_by(semester_number=sem_num).all()

            for subj in subjects:
                # 1. Ensure a ClassSession exists for this subject, semester, and section
                session = db.query(ClassSession).filter_by(
                    subject_id=subj.id,
                    semester=target_sem_str,
                    section=student_section
                ).first()

                if not session:
                    faculty = random.choice(faculties)
                    room = random.choice(classrooms)
                    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
                    
                    session = ClassSession(
                        subject_id=subj.id,
                        faculty_id=faculty.id,
                        classroom_id=room.id,
                        day_of_week=random.choice(days),
                        start_time="10:00 AM",
                        end_time="11:00 AM",
                        semester=target_sem_str,
                        section=student_section
                    )
                    db.add(session)
                    db.commit()
                    db.refresh(session)

                # 2. Ensure the student is enrolled in this ClassSession
                enroll = db.query(StudentEnrollment).filter_by(
                    student_id=student.id, class_session_id=session.id
                ).first()
                if not enroll:
                    db.add(StudentEnrollment(student_id=student.id, class_session_id=session.id))
                    db.commit()

                # 3. Generate Attendance Records for this subject
                # Seed random generator deterministically for consistency
                random.seed(student.id + subj.id)
                total_classes = random.randint(10, 15)
                
                # Assign logic for demo accounts, random for others
                if student.email == "lasya@klaso.edu":
                    presents = int(total_classes * random.uniform(0.55, 0.65)) # Critical
                elif student.email == "rahul@klaso.edu":
                    presents = int(total_classes * random.uniform(0.85, 0.95)) # Good
                elif student.email == "sneha@klaso.edu":
                    presents = int(total_classes * random.uniform(0.70, 0.80)) # Warning
                else:
                    # For other users like Thrisha, randomize between 50% and 100%
                    presents = random.randint(int(total_classes * 0.5), total_classes)

                absents = total_classes - presents
                
                statuses = ["present"] * presents + ["absent"] * absents
                # Shuffle with different seed so sequence is random
                random.seed(student.id + session.id)
                random.shuffle(statuses)

                for i, status in enumerate(statuses):
                    # Space classes out over the last `total_classes` days
                    date_str = (today - timedelta(days=total_classes - i)).strftime("%Y-%m-%d")
                    db.add(Attendance(
                        student_id=student.id,
                        class_session_id=session.id,
                        date=date_str,
                        status=status,
                        marked_by=session.faculty_id
                    ))

        db.commit()
        print("Reseed complete! Attendance and class sessions dynamically generated for all students across all semesters.")

    finally:
        db.close()

if __name__ == "__main__":
    run_reseed()
