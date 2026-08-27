from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List
import os
import shutil
import uuid

from app.database.connection import get_db
from app.database.models import User, AuthorizedDomain, ApprovedRoster, Notification
from app.schemas.schemas import (
    LoginRequest, Token, StudentSignupRequest, FacultySignupRequest,
    ForgotPasswordRequest, UserProfile, ChangePasswordRequest
)
from app.auth.security import (
    verify_password, get_password_hash, create_access_token, get_current_user
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

DEFAULT_PROFILE_PIC = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"

def is_domain_authorized(email: str, db: Session) -> bool:
    if "@" not in email:
        return False
    domain_part = email.split("@")[1].lower()
    
    allowed_domain = db.query(AuthorizedDomain).filter(
        AuthorizedDomain.domain == domain_part,
        AuthorizedDomain.is_active == True
    ).first()
    
    if allowed_domain or domain_part in ["klaso.edu", "college-domain.com", "college.edu"]:
        return True
    return False

@router.post("/login", response_model=Token)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    email = req.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The email, registration number, or password is incorrect."
        )

    if user.role != req.role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Account found, but role selection is invalid. Please select '{user.role.title()}' role."
        )

    if req.role in ["student", "faculty"] and req.reg_no and user.reg_no:
        if user.reg_no.upper().strip() != req.reg_no.upper().strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The registration number / faculty ID does not match our campus records."
            )

    if not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The email, registration number, or password is incorrect."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is deactivated. Please contact campus administration."
        )

    access_token = create_access_token(data={"sub": user.email, "role": user.role, "user_id": user.id})

    user_dict = {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "reg_no": user.reg_no,
        "department": user.department,
        "year": user.year,
        "section": user.section,
        "designation": user.designation,
        "profile_pic": user.profile_pic
    }

    return {"access_token": access_token, "token_type": "bearer", "user": user_dict}


@router.post("/student-signup", response_model=Token)
def student_signup(req: StudentSignupRequest, db: Session = Depends(get_db)):
    email = req.email.lower().strip()
    reg_no = req.reg_no.upper().strip()

    if not is_domain_authorized(email, db):
        raise HTTPException(
            status_code=400,
            detail="Please use an authorized college email address (e.g. user@klaso.edu)."
        )

    # 1. Check if Admin has pre-authorized this student in ApprovedRoster
    roster_entry = db.query(ApprovedRoster).filter(
        ApprovedRoster.email == email,
        ApprovedRoster.reg_no == reg_no,
        ApprovedRoster.role == "student"
    ).first()

    if not roster_entry:
        raise HTTPException(
            status_code=400,
            detail="Registration failed. Your email and registration number have not been pre-authorized by campus administration. Please contact your admin."
        )

    # 2. Check if account already registered
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="An account with this college email is already registered. Please log in."
        )

    # 3. Create student User
    student = User(
        email=email,
        password_hash=get_password_hash(req.password),
        role="student",
        full_name=req.full_name.strip() or roster_entry.full_name,
        reg_no=reg_no,
        phone=req.phone,
        department=req.department or roster_entry.department,
        year=req.year or roster_entry.year or "3rd Year",
        section=req.section or roster_entry.section or "Section A",
        profile_pic=req.profile_pic or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        is_active=True
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    # Update roster status
    roster_entry.is_registered = True

    # Auto-enroll student into subjects/classes based on their year and section
    year_to_sem = {
        "1st Year": "1st Semester",
        "2nd Year": "3rd Semester",
        "3rd Year": "5th Semester",
        "4th Year": "7th Semester"
    }
    target_semester = year_to_sem.get(student.year, "5th Semester")
    
    # Import ClassSession and StudentEnrollment locally to avoid circular import if needed
    from app.database.models import ClassSession, StudentEnrollment
    sessions_to_enroll = db.query(ClassSession).filter(
        ClassSession.semester == target_semester,
        ClassSession.section == student.section
    ).all()
    
    for sess in sessions_to_enroll:
        enroll = StudentEnrollment(student_id=student.id, class_session_id=sess.id)
        db.add(enroll)
        
    db.commit()

    # Welcome notification
    notif = Notification(
        user_id=student.id,
        title="Welcome to Klaso! 🎉",
        message="Your student account has been activated. Check your dashboard for attendance and class schedules.",
        type="info"
    )
    db.add(notif)
    db.commit()

    access_token = create_access_token(data={"sub": student.email, "role": "student", "user_id": student.id})
    user_dict = {
        "id": student.id,
        "email": student.email,
        "full_name": student.full_name,
        "role": student.role,
        "reg_no": student.reg_no,
        "department": student.department,
        "year": student.year,
        "section": student.section,
        "profile_pic": student.profile_pic
    }
    return {"access_token": access_token, "token_type": "bearer", "user": user_dict}


@router.post("/faculty-signup", response_model=Token)
def faculty_signup(req: FacultySignupRequest, db: Session = Depends(get_db)):
    email = req.email.lower().strip()
    reg_no = req.reg_no.upper().strip()

    if not is_domain_authorized(email, db):
        raise HTTPException(
            status_code=400,
            detail="Please use an authorized college email address (e.g. user@klaso.edu)."
        )

    # 1. Check if Admin has pre-authorized this faculty in ApprovedRoster
    roster_entry = db.query(ApprovedRoster).filter(
        ApprovedRoster.email == email,
        ApprovedRoster.reg_no == reg_no,
        ApprovedRoster.role == "faculty"
    ).first()

    if not roster_entry:
        raise HTTPException(
            status_code=400,
            detail="Registration failed. Your email and faculty ID have not been pre-authorized by campus administration. Please contact your admin."
        )

    # 2. Check if account already registered
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="An account with this faculty email is already registered. Please log in."
        )

    # 3. Create faculty User
    faculty = User(
        email=email,
        password_hash=get_password_hash(req.password),
        role="faculty",
        full_name=req.full_name.strip() or roster_entry.full_name,
        reg_no=reg_no,
        phone=req.phone,
        department=req.department or roster_entry.department,
        designation=req.designation or roster_entry.designation or "Assistant Professor",
        profile_pic="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
        is_active=True
    )
    db.add(faculty)
    db.commit()
    db.refresh(faculty)

    # Update roster status
    roster_entry.is_registered = True
    db.commit()

    access_token = create_access_token(data={"sub": faculty.email, "role": "faculty", "user_id": faculty.id})
    user_dict = {
        "id": faculty.id,
        "email": faculty.email,
        "full_name": faculty.full_name,
        "role": faculty.role,
        "reg_no": faculty.reg_no,
        "department": faculty.department,
        "designation": faculty.designation,
        "profile_pic": faculty.profile_pic
    }
    return {"access_token": access_token, "token_type": "bearer", "user": user_dict}


@router.post("/forgot-password")
def reset_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = req.email.lower().strip()
    reg_no = req.reg_no.upper().strip()

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this college email.")

    if user.reg_no and user.reg_no.upper().strip() != reg_no:
        raise HTTPException(status_code=400, detail="Registration number / faculty ID does not match our records.")

    user.password_hash = get_password_hash(req.new_password)
    db.commit()

    return {"message": "Password reset successful! You can now log in with your new password."}


@router.put("/change-password")
def change_password(
    req: ChangePasswordRequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if not verify_password(req.old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password."
        )

    current_user.password_hash = get_password_hash(req.new_password)
    db.commit()

    return {"message": "Password updated successfully!"}


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "reg_no": current_user.reg_no,
        "phone": current_user.phone,
        "department": current_user.department,
        "year": current_user.year,
        "section": current_user.section,
        "designation": current_user.designation,
        "profile_pic": current_user.profile_pic,
        "profile_picture_update_used": current_user.profile_picture_update_used
    }


@router.post("/profile/upload-picture")
async def upload_profile_picture(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.profile_picture_update_used:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Profile picture can only be updated once."
        )

    # Validate Extension
    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload JPG, PNG, or WEBP."
        )

    # Validate Size (Max 5MB)
    MAX_SIZE = 5 * 1024 * 1024
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 5MB limit."
        )

    # Simulated AI check for professional photo
    filename_lower = file.filename.lower()
    if any(word in filename_lower for word in ["meme", "casual", "selfie", "funny", "cartoon", "group", "landscape"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload a clear, professional photo showing only your face. Try using a well-lit headshot with a simple background."
        )

    os.makedirs("uploads/profiles", exist_ok=True)
    unique_filename = f"{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join("uploads", "profiles", unique_filename)

    with open(file_path, "wb") as f:
        f.write(content)

    file_url = f"/uploads/profiles/{unique_filename}"
    
    current_user.profile_pic = file_url
    current_user.profile_picture_update_used = True
    db.commit()

    return {"message": "Profile picture updated successfully!", "profile_pic": file_url}
