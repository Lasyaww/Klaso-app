from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
import io
try:
    import PyPDF2
except ImportError:
    PyPDF2 = None
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from datetime import datetime

from app.database.connection import get_db
from app.database.models import User, Subject, Note, AIConversation, AIMessage, Attendance, ClassSession, TopicProgress
from app.schemas.schemas import AIChatRequest, AISummarizeRequest, AIQuizGenerateRequest, AIQuizResultRequest, AIQuickRevisionRequest
from app.auth.security import get_current_user
from app.services.ai_service import (
    generate_ai_chat_response, summarize_notes_ai, generate_ai_quiz, ACADEMIC_REFUSAL_RESPONSE, generate_quick_revision_cards
)

router = APIRouter(prefix="/api/ai", tags=["AI Study Buddy"])

@router.post("/chat")
def ai_chat(
    message: str = Form(...),
    subject_id: Optional[int] = Form(None),
    conversation_id: Optional[int] = Form(None),
    is_missed_class_context: Optional[bool] = Form(False),
    file: UploadFile = File(None),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student_id = current_user.id
    
    # Resolve or create conversation
    conv = None
    if conversation_id:
        conv = db.query(AIConversation).filter(
            AIConversation.id == conversation_id,
            AIConversation.student_id == student_id
        ).first()

    if not conv:
        conv = AIConversation(
            student_id=student_id,
            subject_id=subject_id,
            title=f"Study Session - {datetime.now().strftime('%b %d')}"
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)

    # Save user message
    user_msg = AIMessage(
        conversation_id=conv.id,
        sender="user",
        content=message,
        is_missed_class_context=is_missed_class_context
    )
    db.add(user_msg)
    db.commit()

    # Get subject context
    subject_context = None
    notes_context = None
    if subject_id:
        subj = db.query(Subject).filter(Subject.id == subject_id).first()
        if subj:
            subject_context = f"{subj.code}: {subj.name}"
            # Fetch latest notes
            note = db.query(Note).filter(Note.subject_id == subj.id).order_by(Note.created_at.desc()).first()
            if note:
                notes_context = f"Title: {note.title}\n{note.content_text}"

    # Extract text from uploaded file if present
    uploaded_text = None
    if file:
        if file.filename.endswith(".pdf") and PyPDF2:
            try:
                pdf_reader = PyPDF2.PdfReader(file.file)
                uploaded_text = ""
                for page in pdf_reader.pages:
                    text = page.extract_text()
                    if text:
                        uploaded_text += text + "\n"
            except Exception as e:
                print(f"Error parsing PDF in chat: {e}")
        else:
            try:
                uploaded_text = file.file.read().decode('utf-8', errors='ignore')
            except Exception as e:
                print(f"Error parsing file in chat: {e}")
                
    # Extract image bytes if present
    uploaded_image_bytes = None
    uploaded_image_mime = None
    if image:
        try:
            uploaded_image_bytes = image.file.read()
            uploaded_image_mime = image.content_type
        except Exception as e:
            print(f"Error reading image in chat: {e}")

    # Generate response
    ai_reply_text = generate_ai_chat_response(
        message=message,
        subject_context=subject_context,
        notes_context=notes_context,
        missed_class_context=None,
        uploaded_text=uploaded_text,
        uploaded_image_bytes=uploaded_image_bytes,
        uploaded_image_mime=uploaded_image_mime
    )

    # Save AI message
    ai_msg = AIMessage(
        conversation_id=conv.id,
        sender="ai",
        content=ai_reply_text,
        is_missed_class_context=is_missed_class_context
    )
    db.add(ai_msg)
    db.commit()

    return {
        "conversation_id": conv.id,
        "reply": ai_reply_text,
        "is_refusal": ai_reply_text == ACADEMIC_REFUSAL_RESPONSE
    }


@router.post("/summarize")
def summarize_notes(
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    note_title = "Class Notes"
    content_text = ""
    subject_name = "Computer Science"

    if file:
        note_title = file.filename
        if file.filename.endswith(".pdf") and PyPDF2:
            try:
                pdf_reader = PyPDF2.PdfReader(file.file)
                for page in pdf_reader.pages:
                    text = page.extract_text()
                    if text:
                        content_text += text + "\n"
            except Exception as e:
                print(f"Error parsing PDF: {e}")
        else:
            content_text = file.file.read().decode('utf-8', errors='ignore')

    summary_data = summarize_notes_ai(
        note_title=note_title,
        content_text=content_text,
        subject_name=subject_name
    )

    return summary_data


@router.post("/generate-quiz")
def generate_quiz_endpoint(
    req: AIQuizGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subj = db.query(Subject).filter(Subject.id == req.subject_id).first()
    subject_name = subj.name if subj else "Computer Science"

    quiz_data = generate_ai_quiz(
        subject_name=subject_name,
        topic=req.topic or "Key Lecture Concepts",
        difficulty=req.difficulty,
        num_questions=req.num_questions
    )

    return quiz_data


@router.post("/missed-class")
def get_missed_class_ai_help(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attendance_id = payload.get("attendance_id")
    att = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not att or not att.class_session:
        raise HTTPException(status_code=404, detail="Missed class attendance record not found.")

    session = att.class_session
    subj = session.subject
    fac = session.faculty

    missed_context = {
        "subject_name": subj.name if subj else "Subject",
        "faculty_name": fac.full_name if fac else "Dr. Kumar",
        "date": att.date,
        "time": f"{session.start_time} – {session.end_time}"
    }

    ai_reply = generate_ai_chat_response(
        message="Explain what I missed in this lecture and provide key learning points.",
        subject_context=subj.name if subj else None,
        missed_class_context=missed_context
    )

    # Fetch notes for this subject
    notes = db.query(Note).filter(Note.subject_id == subj.id).all()
    notes_list = [{
        "id": n.id,
        "title": n.title,
        "file_url": n.file_url,
        "description": n.description
    } for n in notes]

    # Generate quick 3-question quiz for missed lecture
    quiz = generate_ai_quiz(subject_name=subj.name, topic="Missed Lecture Concepts", difficulty="Medium", num_questions=3)

    return {
        "missed_class": missed_context,
        "ai_recap": ai_reply,
        "notes": notes_list,
        "quiz": quiz
    }

@router.post("/quiz-result")
def submit_ai_quiz_result(
    req: AIQuizResultRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student_id = current_user.id
    
    tp = db.query(TopicProgress).filter(
        TopicProgress.student_id == student_id,
        TopicProgress.subject_name == req.subject_name,
        TopicProgress.topic_name == req.topic
    ).first()
    
    if not tp:
        tp = TopicProgress(
            student_id=student_id,
            subject_name=req.subject_name,
            topic_name=req.topic,
            weakness_score=0
        )
        db.add(tp)
        
    tp.quiz_attempts += 1
    tp.correct_answers += (req.total_questions - req.incorrect_answers)
    tp.incorrect_answers += req.incorrect_answers
    tp.last_studied = datetime.utcnow()
    
    # Calculate weakness score logic:
    # Base starts at current score
    # Wrong answer adds 20, correct answer subtracts 15
    score_change = (req.incorrect_answers * 20) - ((req.total_questions - req.incorrect_answers) * 15)
    
    new_score = tp.weakness_score + score_change
    new_score = max(0, min(100, new_score)) # Clamp between 0 and 100
    tp.weakness_score = new_score
    
    db.commit()
    return {"status": "success", "new_weakness_score": tp.weakness_score}


@router.get("/pulse")
def get_learning_pulse(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student_id = current_user.id
    
    progress = db.query(TopicProgress).filter(TopicProgress.student_id == student_id).all()
    
    # Aggregate subject progress
    subject_stats = {}
    for p in progress:
        if p.subject_name not in subject_stats:
            subject_stats[p.subject_name] = {"total": 0, "weakness": 0, "count": 0}
        subject_stats[p.subject_name]["weakness"] += p.weakness_score
        subject_stats[p.subject_name]["count"] += 1
        
    subjects_res = []
    for subj_name, stats in subject_stats.items():
        avg_weakness = stats["weakness"] / stats["count"]
        # Progress is inverse of weakness
        prog_percent = 100 - int(avg_weakness)
        subjects_res.append({
            "subject_name": subj_name,
            "progress_percentage": prog_percent
        })
        
    # Get top 3 weak topics
    weak_topics = []
    for p in sorted(progress, key=lambda x: x.weakness_score, reverse=True)[:3]:
        if p.weakness_score <= 25:
            status = "🟢 Strong"
        elif p.weakness_score <= 50:
            status = "🟡 Improving"
        elif p.weakness_score <= 75:
            status = "🟠 Needs Practice"
        else:
            status = "🔴 Needs Attention"
            
        weak_topics.append({
            "subject_name": p.subject_name,
            "topic_name": p.topic_name,
            "weakness_score": p.weakness_score,
            "status": status
        })
        
    return {
        "subjects": subjects_res,
        "topics_to_review": weak_topics
    }

@router.post("/quick-revision")
def generate_quick_revision(
    req: AIQuickRevisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student_id = current_user.id
    
    # Identify topics based on mode
    num_topics = 5
    if req.mode == "2-min":
        num_topics = 2
    elif req.mode == "10-min":
        num_topics = 8
        
    # Get top weak topics, or recent topics if not enough weak ones
    progress = db.query(TopicProgress).filter(
        TopicProgress.student_id == student_id
    ).order_by(TopicProgress.weakness_score.desc(), TopicProgress.last_studied.desc()).limit(num_topics).all()
    
    topics = [f"{p.subject_name} - {p.topic_name}" for p in progress]
    
    if not topics:
        topics = ["General Computer Science Concepts"]
        
    cards = generate_quick_revision_cards(topics)
    return {"cards": cards, "topics": [p.topic_name for p in progress]}
