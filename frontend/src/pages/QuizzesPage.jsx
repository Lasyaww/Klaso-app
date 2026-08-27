import React, { useState, useEffect } from 'react';
import { Award, Play, CheckCircle2, Bot } from 'lucide-react';
import { QuizModal } from '../components/QuizModal';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export const QuizzesPage = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/quizzes')
      .then((res) => setQuizzes(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '40px', color: '#64748b' }}>Loading Quizzes...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Quizzes & Revision Assessments 🧠</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Test your lecture understanding with faculty quizzes and AI-generated MCQs.
          </p>
        </div>
        <button className="btn btn-ai" onClick={() => navigate('/ai-study-buddy')}>
          <Bot size={18} /> Generate New AI Quiz
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {quizzes.map(q => (
          <div key={q.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span className="badge" style={{ background: '#fef3c7', color: '#92400e' }}>
                  {q.difficulty} Difficulty
                </span>
                {q.attempted && (
                  <span className="badge badge-good" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={12} /> Score: {q.last_score}/{q.total_questions}
                  </span>
                )}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{q.title}</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>Course: {q.subject_name}</p>
              <p style={{ fontSize: '0.88rem', color: '#334155', marginTop: '8px' }}>
                Total Questions: <strong>{q.total_questions} MCQs</strong>
              </p>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => setActiveQuiz(q)}
              style={{ marginTop: '16px', width: '100%', fontSize: '0.88rem' }}
            >
              <Play size={16} /> {q.attempted ? 'Re-attempt Quiz' : 'Start Quiz Now'}
            </button>
          </div>
        ))}
      </div>

      {activeQuiz && (
        <QuizModal
          quiz={activeQuiz}
          onClose={() => setActiveQuiz(null)}
          onCompleted={() => {
            api.get('/quizzes').then(res => setQuizzes(res));
          }}
        />
      )}
    </div>
  );
};
