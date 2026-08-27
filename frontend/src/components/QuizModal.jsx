import React, { useState } from 'react';
import { Award, CheckCircle2, XCircle, HelpCircle, X, ArrowRight } from 'lucide-react';
import api from '../services/api';

export const QuizModal = ({ quiz, onClose, onCompleted }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const questions = quiz.questions || [];
  const currentQ = questions[currentStep];

  const handleSelectOption = (optIndex) => {
    setSelectedAnswers(prev => ({ ...prev, [currentStep]: optIndex }));
  };

  const handleSubmitQuiz = () => {
    setSubmitting(true);
    // If quiz has an ID in backend submit via API, otherwise calculate locally
    if (quiz.id) {
      api.post('/quizzes/submit', { quiz_id: quiz.id, answers: selectedAnswers })
        .then((res) => {
          setResult(res);
          if (onCompleted) onCompleted(res);
        })
        .catch(() => {
          calculateLocalResult();
        })
        .finally(() => setSubmitting(false));
    } else {
      const resObj = calculateLocalResult();
      
      // Submit AI quiz results to weakness tracker
      if (quiz.subject && quiz.topic) {
        api.post('/ai/quiz-result', {
          subject_name: quiz.subject,
          topic: quiz.topic,
          score: resObj.score,
          total_questions: resObj.total_questions,
          incorrect_answers: resObj.total_questions - resObj.score
        }).catch(err => console.error("Error updating weakness score:", err));
      }
      
      setSubmitting(false);
    }
  };

  const calculateLocalResult = () => {
    let score = 0;
    const results = questions.map((q, idx) => {
      const uChoice = selectedAnswers[idx];
      const isCorrect = uChoice !== undefined && Number(uChoice) === Number(q.correct_option);
      if (isCorrect) score += 1;
      return {
        question: q.question,
        options: q.options,
        user_choice: uChoice,
        correct_option: q.correct_option,
        is_correct: isCorrect,
        explanation: q.explanation
      };
    });

    const resObj = {
      score,
      total_questions: questions.length,
      percentage: Math.round((score / questions.length) * 100),
      results
    };
    setResult(resObj);
    if (onCompleted) onCompleted(resObj);
    return resObj;
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', color: '#06B6D4' }}>
            <Award size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{quiz.title}</h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Subject: {quiz.subject_name || quiz.subject} | Difficulty: {quiz.difficulty || 'Medium'}
            </span>
          </div>
        </div>

        {!result ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b', marginBottom: '12px' }}>
              <span>Question {currentStep + 1} of {questions.length}</span>
              <span>{Math.round(((currentStep + 1) / questions.length) * 100)}% Progress</span>
            </div>

            <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', marginBottom: '20px' }}>
              <div style={{
                width: `${((currentStep + 1) / questions.length) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--primary) 0%, var(--ai-cyan) 100%)',
                borderRadius: '3px',
                transition: 'width 0.3s ease'
              }} />
            </div>

            {currentQ && (
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>
                  {currentQ.question}
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                  {currentQ.options.map((opt, oIdx) => {
                    const isSelected = selectedAnswers[currentStep] === oIdx;
                    return (
                      <div
                        key={oIdx}
                        onClick={() => handleSelectOption(oIdx)}
                        style={{
                          padding: '14px 18px',
                          borderRadius: 'var(--radius-md)',
                          border: isSelected ? '2px solid var(--primary)' : '1.5px solid var(--border-light)',
                          background: isSelected ? 'var(--primary-light)' : 'white',
                          color: isSelected ? 'var(--primary)' : '#334155',
                          fontWeight: isSelected ? 600 : 400,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          border: isSelected ? '6px solid var(--primary)' : '2px solid #cbd5e1',
                          background: 'white'
                        }} />
                        <span>{opt}</span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                    disabled={currentStep === 0}
                  >
                    Previous
                  </button>

                  {currentStep < questions.length - 1 ? (
                    <button
                      className="btn btn-primary"
                      onClick={() => setCurrentStep(prev => prev + 1)}
                      disabled={selectedAnswers[currentStep] === undefined}
                    >
                      Next Question <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button
                      className="btn btn-ai"
                      onClick={handleSubmitQuiz}
                      disabled={selectedAnswers[currentStep] === undefined || submitting}
                    >
                      {submitting ? 'Submitting...' : 'Submit Quiz 🎉'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Quiz Results View */
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: result.percentage >= 70 ? '#d1fae5' : '#fef3c7',
              color: result.percentage >= 70 ? '#10b981' : '#f59e0b',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Award size={48} />
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Your Score: {result.score}/{result.total_questions} 🎉</h3>
            <p style={{ fontSize: '1rem', color: '#64748b', marginTop: '4px', marginBottom: '20px' }}>
              Overall Accuracy: <strong>{result.percentage}%</strong>
            </p>

            {/* Answer Breakdown */}
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Review Answers & Explanations:</h4>
              {result.results.map((res, i) => (
                <div key={i} style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  background: res.is_correct ? '#f0fdf4' : '#fef2f2',
                  borderLeft: res.is_correct ? '4px solid #10b981' : '4px solid #ef4444'
                }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {res.is_correct ? <CheckCircle2 size={16} color="#10b981" /> : <XCircle size={16} color="#ef4444" />}
                    Q{i + 1}: {res.question}
                  </div>
                  <div style={{ fontSize: '0.82rem', marginTop: '6px', color: '#475569' }}>
                    Your answer: <strong>{res.options[res.user_choice] || 'Not answered'}</strong>
                  </div>
                  {!res.is_correct && (
                    <div style={{ fontSize: '0.82rem', color: '#065f46', marginTop: '2px' }}>
                      Correct answer: <strong>{res.options[res.correct_option]}</strong>
                    </div>
                  )}
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '6px', fontStyle: 'italic' }}>
                    💡 {res.explanation}
                  </div>
                </div>
              ))}
            </div>

            <button className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>
              Done / Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
