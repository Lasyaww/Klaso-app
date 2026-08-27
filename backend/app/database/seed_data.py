import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database.connection import Base, engine, SessionLocal
from app.database.models import (
    User, AuthorizedDomain, ApprovedRoster, Building, Classroom, Subject, ClassSession,
    StudentEnrollment, Attendance, Note, LectureRecording, Quiz, Notification
)
from app.auth.security import get_password_hash

def init_db_and_seed():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if db.query(User).first():
            print("Database already contains records. Skipping seed.")
            return

        print("Seeding Klaso database with 8 Semesters x 6 Subjects structure & records...")

        # 1. Authorized Email Domains
        db.add(AuthorizedDomain(domain="klaso.edu", is_active=True))
        db.add(AuthorizedDomain(domain="college-domain.com", is_active=True))
        db.commit()

        # 2. Approved Pre-Authorized Roster
        r_lasya = ApprovedRoster(email="lasya@klaso.edu", reg_no="22ABC123", full_name="Lasya", role="student", department="Computer Science", year="3rd Year", section="Section A", is_registered=True)
        r_rahul = ApprovedRoster(email="rahul@klaso.edu", reg_no="22ABC124", full_name="Rahul Sharma", role="student", department="Computer Science", year="3rd Year", section="Section A", is_registered=True)
        r_sneha = ApprovedRoster(email="sneha@klaso.edu", reg_no="22ABC125", full_name="Sneha Reddy", role="student", department="Computer Science", year="3rd Year", section="Section A", is_registered=False)

        r_kumar = ApprovedRoster(email="dr.kumar@klaso.edu", reg_no="FAC001", full_name="Dr. Kumar", role="faculty", department="Computer Science", designation="Professor & Head", is_registered=True)
        r_priya = ApprovedRoster(email="prof.priya@klaso.edu", reg_no="FAC002", full_name="Prof. Priya", role="faculty", department="Computer Science", designation="Associate Professor", is_registered=True)
        r_sharma = ApprovedRoster(email="dr.sharma@klaso.edu", reg_no="FAC003", full_name="Dr. Sharma", role="faculty", department="Computer Science", designation="Assistant Professor", is_registered=False)

        db.add_all([r_lasya, r_rahul, r_sneha, r_kumar, r_priya, r_sharma])
        db.commit()

        # 3. Buildings & Classrooms
        b_block_b = Building(name="Academic Block B", block="Block B", floor="2nd Floor")
        b_block_c = Building(name="Technology Block C", block="Block C", floor="1st Floor")
        db.add_all([b_block_b, b_block_c])
        db.commit()

        room_204 = Classroom(room_number="Room 204", building_id=b_block_b.id, floor="2nd Floor", capacity=60)
        room_102 = Classroom(room_number="Room 102", building_id=b_block_c.id, floor="1st Floor", capacity=75)
        db.add_all([room_204, room_102])
        db.commit()

        # 4. Registered Users
        admin = User(email="admin@klaso.edu", password_hash=get_password_hash("Admin@123"), role="admin", full_name="System Administrator", reg_no="ADM001", phone="9876543210", department="Administration", designation="Chief Administrator", is_active=True)
        dr_kumar = User(email="dr.kumar@klaso.edu", password_hash=get_password_hash("Faculty@123"), role="faculty", full_name="Dr. Kumar", reg_no="FAC001", phone="9876543211", department="Computer Science", designation="Professor & Head", profile_pic="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150", is_active=True)
        prof_priya = User(email="prof.priya@klaso.edu", password_hash=get_password_hash("Faculty@123"), role="faculty", full_name="Prof. Priya", reg_no="FAC002", phone="9876543212", department="Computer Science", designation="Associate Professor", profile_pic="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150", is_active=True)

        student_lasya = User(email="lasya@klaso.edu", password_hash=get_password_hash("Student@123"), role="student", full_name="Lasya", reg_no="22ABC123", phone="9876543213", department="Computer Science", year="3rd Year", section="Section A", profile_pic="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150", is_active=True)
        student_rahul = User(email="rahul@klaso.edu", password_hash=get_password_hash("Student@123"), role="student", full_name="Rahul Sharma", reg_no="22ABC124", phone="9876543214", department="Computer Science", year="3rd Year", section="Section A", profile_pic="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", is_active=True)

        db.add_all([admin, dr_kumar, prof_priya, student_lasya, student_rahul])
        db.commit()

        # 5. Populate 8 Semesters x 6 Subjects = 48 Subjects Total
        subject_data = [
            # Semester 1
            (1, "MA101", "Engineering Mathematics I", 4), (1, "PH101", "Applied Physics", 4),
            (1, "EN101", "Technical English", 3), (1, "EE101", "Basic Electrical Engineering", 4),
            (1, "CS101", "C Programming & Problem Solving", 4), (1, "ME101", "Engineering Graphics", 3),

            # Semester 2
            (2, "MA102", "Engineering Mathematics II", 4), (2, "CH101", "Applied Chemistry", 4),
            (2, "EV101", "Environmental Science", 3), (2, "EC101", "Basic Electronics Engineering", 4),
            (2, "CS102", "Data Structures in C", 4), (2, "CS103", "Digital Logic Design", 4),

            # Semester 3
            (3, "MA201", "Discrete Mathematics", 4), (3, "CS201", "Object Oriented Programming in Java", 4),
            (3, "CS202", "Computer Organization & Architecture", 4), (3, "CS203", "Discrete Structures", 3),
            (3, "MS201", "Principles of Management", 3), (3, "EC201", "Data Communication", 4),

            # Semester 4
            (4, "CS204", "Formal Languages & Automata", 4), (4, "CS205", "Theory of Computation", 4),
            (4, "MA202", "Probability & Random Processes", 4), (4, "EC202", "Microprocessors & Controllers", 4),
            (4, "CS206", "Design & Analysis of Algorithms", 4), (4, "CS207", "Database Systems Lab", 2),

            # Semester 5 (CURRENT SEMESTER)
            (5, "CS301", "Data Structures", 4), (5, "CS302", "Database Management Systems", 4),
            (5, "CS303", "Computer Networks", 4), (5, "CS304", "Operating Systems", 3),
            (5, "CS305", "Artificial Intelligence", 3), (5, "CS306", "Software Engineering", 3),

            # Semester 6
            (6, "CS307", "Cloud Computing & DevOps", 4), (6, "CS308", "Compiler Design", 4),
            (6, "CS309", "Machine Learning Techniques", 4), (6, "CS310", "Information & Cyber Security", 3),
            (6, "CS311", "Web Technologies & Frameworks", 4), (6, "CS312", "Mobile Application Development", 3),

            # Semester 7
            (7, "CS401", "Big Data Analytics", 4), (7, "CS402", "Internet of Things (IoT)", 4),
            (7, "CS403", "Deep Learning & Neural Networks", 4), (7, "CS404", "Blockchain Technology", 3),
            (7, "CS405", "Distributed Systems", 4), (7, "CS406", "Major Project Phase I", 3),

            # Semester 8
            (8, "CS407", "Natural Language Processing", 4), (8, "CS408", "High Performance Computing", 4),
            (8, "CS409", "Quantum Computing Basics", 3), (8, "CS410", "Ethics in Artificial Intelligence", 3),
            (8, "CS411", "Seminar & Industry Internship", 4), (8, "CS412", "Major Project Phase II", 6)
        ]

        subject_objs = {}
        for sem, code, name, credits in subject_data:
            s_obj = Subject(
                code=code,
                name=name,
                department="Computer Science",
                semester_number=sem,
                credits=credits,
                description=f"Standard curriculum course for Semester {sem} covering foundational principles of {name}."
            )
            db.add(s_obj)
            db.commit()
            db.refresh(s_obj)
            subject_objs[code] = s_obj

        # 6. Class Sessions & Schedules for Current Semester (Sem 5)
        sub_ds = subject_objs["CS301"]
        sub_dbms = subject_objs["CS302"]
        sub_cn = subject_objs["CS303"]
        sub_os = subject_objs["CS304"]
        sub_ai = subject_objs["CS305"]
        sub_se = subject_objs["CS306"]

        sess_ds = ClassSession(subject_id=sub_ds.id, faculty_id=dr_kumar.id, classroom_id=room_204.id, day_of_week="Monday", start_time="10:00 AM", end_time="11:00 AM", semester="5th Semester", section="Section A")
        sess_dbms = ClassSession(subject_id=sub_dbms.id, faculty_id=prof_priya.id, classroom_id=room_102.id, day_of_week="Monday", start_time="11:15 AM", end_time="12:15 PM", semester="5th Semester", section="Section A")
        sess_cn = ClassSession(subject_id=sub_cn.id, faculty_id=prof_priya.id, classroom_id=room_102.id, day_of_week="Tuesday", start_time="09:00 AM", end_time="10:00 AM", semester="5th Semester", section="Section A")
        sess_os = ClassSession(subject_id=sub_os.id, faculty_id=dr_kumar.id, classroom_id=room_204.id, day_of_week="Wednesday", start_time="01:00 PM", end_time="02:00 PM", semester="5th Semester", section="Section A")
        sess_ai = ClassSession(subject_id=sub_ai.id, faculty_id=dr_kumar.id, classroom_id=room_204.id, day_of_week="Thursday", start_time="10:00 AM", end_time="11:00 AM", semester="5th Semester", section="Section A")
        sess_se = ClassSession(subject_id=sub_se.id, faculty_id=prof_priya.id, classroom_id=room_102.id, day_of_week="Friday", start_time="02:00 PM", end_time="03:00 PM", semester="5th Semester", section="Section A")

        db.add_all([sess_ds, sess_dbms, sess_cn, sess_os, sess_ai, sess_se])
        db.commit()

        # 7. Student Enrollments
        for sess in [sess_ds, sess_dbms, sess_cn, sess_os, sess_ai, sess_se]:
            db.add(StudentEnrollment(student_id=student_lasya.id, class_session_id=sess.id))
            db.add(StudentEnrollment(student_id=student_rahul.id, class_session_id=sess.id))
        db.commit()

        # 8. Attendance Records for All Students in Semester 5 (Critical in Everything)
        today = datetime.now()
        for student in [student_lasya, student_rahul]:
            for i in range(10):
                date_str = (today - timedelta(days=15-i)).strftime("%Y-%m-%d")

                # Make all subjects critical (60% attendance)
                status = "absent" if i in [2, 4, 6, 8] else "present"
                
                db.add(Attendance(student_id=student.id, class_session_id=sess_ds.id, date=date_str, status=status, marked_by=dr_kumar.id))
                db.add(Attendance(student_id=student.id, class_session_id=sess_dbms.id, date=date_str, status=status, marked_by=prof_priya.id))
                db.add(Attendance(student_id=student.id, class_session_id=sess_os.id, date=date_str, status=status, marked_by=dr_kumar.id))
                db.add(Attendance(student_id=student.id, class_session_id=sess_cn.id, date=date_str, status=status, marked_by=prof_priya.id))
                db.add(Attendance(student_id=student.id, class_session_id=sess_ai.id, date=date_str, status=status, marked_by=dr_kumar.id))
                db.add(Attendance(student_id=student.id, class_session_id=sess_se.id, date=date_str, status=status, marked_by=prof_priya.id))

        db.commit()

        # 9. Unit Notes (Unit 1 to Unit 5 for Data Structures and DBMS)
        for u in range(1, 6):
            db.add(Note(
                title=f"Unit {u} — Core Data Structures & Algorithm Design",
                description=f"Unit {u} comprehensive lecture reference notes covering definitions, diagrams, and code snippets.",
                content_text=f"Unit {u} theoretical notes and practical exercises for exam preparation...",
                file_url="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                unit_number=u,
                subject_id=sub_ds.id,
                class_session_id=sess_ds.id,
                faculty_id=dr_kumar.id
            ))
            db.add(Note(
                title=f"Unit {u} — Database Systems & Relational Schema Design",
                description=f"Unit {u} reference guide covering normalization 1NF to BCNF and transaction processing.",
                content_text=f"Unit {u} relational model definitions and SQL queries...",
                file_url="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                unit_number=u,
                subject_id=sub_dbms.id,
                class_session_id=sess_dbms.id,
                faculty_id=prof_priya.id
            ))

        db.commit()

        # 10. Lecture Video Recordings
        rec1 = LectureRecording(title="Introduction to B-Trees & AVL Tree Rotations", recording_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration_minutes=45, subject_id=sub_ds.id, class_session_id=sess_ds.id, faculty_id=dr_kumar.id)
        rec2 = LectureRecording(title="Relational Normalization 1NF to 3NF Masterclass", recording_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration_minutes=50, subject_id=sub_dbms.id, class_session_id=sess_dbms.id, faculty_id=prof_priya.id)
        db.add_all([rec1, rec2])
        db.commit()

        # 11. Initial Notifications
        for student in [student_lasya, student_rahul]:
            db.add(Notification(user_id=student.id, title="🚨 Critical Attendance Warning", message="Your attendance across all subjects is critically low (60%). Please improve your attendance immediately.", type="attendance_warning"))
        db.commit()

        print("Klaso database successfully seeded with 8 Semesters & 48 Subjects!")

    finally:
        db.close()
