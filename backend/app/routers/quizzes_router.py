from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json

from app.database.connection import get_db
from app.database.models import User, Quiz, QuizAttempt, Subject
from app.schemas.schemas import QuizSubmitRequest
from app.auth.security import get_current_user

router = APIRouter(prefix="/api/quizzes", tags=["Quizzes & Assessment"])

@router.get("/")
def get_quizzes(
    subject_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Quiz)
    if subject_id:
        query = query.filter(Quiz.subject_id == subject_id)
    quizzes = query.order_by(Quiz.created_at.desc()).all()

    result = []
    for q in quizzes:
        questions = json.loads(q.questions_json) if q.questions_json else []
        # Check student previous attempt
        attempt = db.query(QuizAttempt).filter(
            QuizAttempt.quiz_id == q.id,
            QuizAttempt.student_id == current_user.id
        ).order_by(QuizAttempt.attempted_at.desc()).first()

        result.append({
            "id": q.id,
            "title": q.title,
            "subject_id": q.subject_id,
            "subject_name": q.subject.name if q.subject else "Computer Science",
            "difficulty": q.difficulty,
            "total_questions": len(questions),
            "questions": questions,
            "last_score": attempt.score if attempt else None,
            "attempted": attempt is not None
        })

    return result


@router.post("/submit")
def submit_quiz_answers(
    req: QuizSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quiz = db.query(Quiz).filter(Quiz.id == req.quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found.")

    questions = json.loads(quiz.questions_json) if quiz.questions_json else []
    correct_count = 0
    detailed_results = []

    for idx, q in enumerate(questions):
        user_choice = req.answers.get(str(idx)) or req.answers.get(idx)
        is_correct = False
        if user_choice is not None and int(user_choice) == int(q.get("correct_option")):
            correct_count += 1
            is_correct = True

        detailed_results.append({
            "question_index": idx,
            "question": q.get("question"),
            "options": q.get("options"),
            "user_choice": user_choice,
            "correct_option": q.get("correct_option"),
            "is_correct": is_correct,
            "explanation": q.get("explanation")
        })

    attempt = QuizAttempt(
        quiz_id=quiz.id,
        student_id=current_user.id,
        score=correct_count,
        total_questions=len(questions)
    )
    db.add(attempt)
    db.commit()

    return {
        "quiz_id": quiz.id,
        "score": correct_count,
        "total_questions": len(questions),
        "percentage": round((correct_count / len(questions) * 100), 1) if questions else 0,
        "results": detailed_results
    }
