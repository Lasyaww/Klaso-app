from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.connection import get_db
from app.database.models import (
    User, Subject, ClassSession, Building, Classroom, AuthorizedDomain, Attendance,
    StudentEnrollment, ApprovedRoster
)
from app.schemas.schemas import RosterCreate
from app.auth.security import require_role, get_password_hash

router = APIRouter(prefix="/api/admin", tags=["Admin Control Panel"])

@router.get("/dashboard-stats")
def get_admin_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    total_students = db.query(User).filter(User.role == "student").count()
    total_faculty = db.query(User).filter(User.role == "faculty").count()
    total_subjects = db.query(Subject).count()
    total_classes = db.query(ClassSession).count()

    all_attendance = db.query(Attendance).all()
    tot_logs = len(all_attendance)
    tot_present = len([a for a in all_attendance if a.status in ["present", "late"]])
    system_attendance_pct = round((tot_present / tot_logs * 100), 1) if tot_logs > 0 else 85.0

    students = db.query(User).filter(User.role == "student").all()
    low_count = 0
    for st in students:
        st_logs = [a for a in all_attendance if a.student_id == st.id]
        if st_logs:
            st_att = len([a for a in st_logs if a.status in ["present", "late"]])
            if (st_att / len(st_logs) * 100) < 75.0:
                low_count += 1

    return {
        "total_students": total_students,
        "total_faculty": total_faculty,
        "total_subjects": total_subjects,
        "total_classes": total_classes,
        "overall_attendance_pct": system_attendance_pct,
        "low_attendance_students": low_count
    }


# Approved Roster Management (Pre-authorizing Students & Faculty for Signup)
@router.get("/roster")
def get_approved_roster(
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    query = db.query(ApprovedRoster)
    if role:
        query = query.filter(ApprovedRoster.role == role)
    return query.order_by(ApprovedRoster.id.desc()).all()


@router.post("/roster")
def add_to_approved_roster(
    req: RosterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    email = req.email.lower().strip()
    reg_no = req.reg_no.upper().strip()

    # Check if already exists in roster
    existing = db.query(ApprovedRoster).filter(
        (ApprovedRoster.email == email) | (ApprovedRoster.reg_no == reg_no)
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Pre-authorized roster entry for email '{email}' or ID '{reg_no}' already exists."
        )

    roster_entry = ApprovedRoster(
        email=email,
        reg_no=reg_no,
        full_name=req.full_name,
        role=req.role,
        department=req.department or "Computer Science",
        year=req.year or "3rd Year",
        section=req.section or "Section A",
        designation=req.designation or "Assistant Professor",
        is_registered=True  # Auto-registered
    )
    db.add(roster_entry)

    # Auto-create the User account so they are saved immediately
    default_password = "Klaso123"
    profile_pic = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" if req.role == "student" else "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"
    
    new_user = User(
        email=email,
        password_hash=get_password_hash(default_password),
        role=req.role,
        full_name=req.full_name,
        reg_no=reg_no,
        department=req.department or "Computer Science",
        year=req.year or "3rd Year",
        section=req.section or "Section A",
        designation=req.designation or "Assistant Professor",
        profile_pic=profile_pic,
        is_active=True
    )
    db.add(new_user)
    
    db.commit()
    db.refresh(roster_entry)
    db.refresh(new_user)
    
    # Auto-enroll new student in all available class sessions so their dashboard is populated
    if new_user.role == "student":
        sessions = db.query(ClassSession).all()
        for sess in sessions:
            db.add(StudentEnrollment(student_id=new_user.id, class_session_id=sess.id))
        db.commit()
    
    # Return roster entry along with new user ID so frontend can update lists
    roster_dict = {
        "id": roster_entry.id,
        "email": roster_entry.email,
        "reg_no": roster_entry.reg_no,
        "full_name": roster_entry.full_name,
        "role": roster_entry.role,
        "department": roster_entry.department,
        "is_registered": roster_entry.is_registered,
        "created_at": roster_entry.created_at,
        "user_obj": {
            "id": new_user.id,
            "email": new_user.email,
            "role": new_user.role,
            "full_name": new_user.full_name,
            "reg_no": new_user.reg_no,
            "department": new_user.department,
            "year": new_user.year,
            "section": new_user.section,
            "designation": new_user.designation,
            "is_active": new_user.is_active,
            "created_at": new_user.created_at
        }
    }
    return roster_dict


# Email Domain Management
@router.get("/domains")
def get_authorized_domains(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    return db.query(AuthorizedDomain).all()


@router.post("/domains")
def add_authorized_domain(
    domain_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    dom_str = domain_data.get("domain", "").lower().strip()
    if not dom_str:
        raise HTTPException(status_code=400, detail="Domain string is required.")

    existing = db.query(AuthorizedDomain).filter(AuthorizedDomain.domain == dom_str).first()
    if existing:
        return existing

    new_dom = AuthorizedDomain(domain=dom_str, is_active=True)
    db.add(new_dom)
    db.commit()
    db.refresh(new_dom)
    return new_dom


# User Management (CRUD)
@router.get("/users")
def get_all_users(
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    users = query.order_by(User.id.desc()).all()

    return [{
        "id": u.id,
        "email": u.email,
        "role": u.role,
        "full_name": u.full_name,
        "reg_no": u.reg_no,
        "department": u.department,
        "year": u.year,
        "section": u.section,
        "designation": u.designation,
        "is_active": u.is_active,
        "created_at": u.created_at
    } for u in users]


@router.post("/users")
def create_user_admin(
    user_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    email = user_data.get("email", "").lower().strip()
    reg_no = user_data.get("reg_no", "").upper().strip()

    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already exists.")

    # Also add to ApprovedRoster
    roster_entry = db.query(ApprovedRoster).filter(ApprovedRoster.email == email).first()
    if not roster_entry:
        roster_entry = ApprovedRoster(
            email=email,
            reg_no=reg_no,
            full_name=user_data.get("full_name", "New User"),
            role=user_data.get("role", "student"),
            department=user_data.get("department", "CSE"),
            is_registered=True
        )
        db.add(roster_entry)

    new_user = User(
        email=email,
        password_hash=get_password_hash(user_data.get("password", "Klaso123")),
        role=user_data.get("role", "student"),
        full_name=user_data.get("full_name", "New User"),
        reg_no=reg_no,
        department=user_data.get("department", "CSE"),
        year=user_data.get("year", "3rd Year"),
        section=user_data.get("section", "Section A"),
        designation=user_data.get("designation"),
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Auto-enroll new student in all available class sessions so their dashboard is populated
    if new_user.role == "student":
        sessions = db.query(ClassSession).all()
        for sess in sessions:
            db.add(StudentEnrollment(student_id=new_user.id, class_session_id=sess.id))
        db.commit()

    return {"message": f"User '{new_user.full_name}' created successfully!", "user_id": new_user.id}


@router.put("/users/{user_id}/status")
def toggle_user_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found.")
    u.is_active = not u.is_active
    db.commit()
    return {"message": f"User status set to {'Active' if u.is_active else 'Deactivated'}"}


@router.delete("/roster/{roster_id}")
def delete_approved_roster(
    roster_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    roster_entry = db.query(ApprovedRoster).filter(ApprovedRoster.id == roster_id).first()
    if not roster_entry:
        raise HTTPException(status_code=404, detail="Roster entry not found.")
    
    db.delete(roster_entry)
    db.commit()
    return {"message": "Roster entry deleted successfully."}
