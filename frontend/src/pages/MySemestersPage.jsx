import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { BookOpen, AlertCircle, CheckCircle2, AlertTriangle, Layers, ChevronRight } from 'lucide-react';

export const MySemestersPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/students/semesters')
      .then(res => setData(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading your academic journey...</div>;
  }

  if (!data) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>📚 My Semesters</h2>
        <p style={{ color: '#64748b' }}>View and manage your academic journey, subjects, and attendance.</p>
      </div>

      {/* Progress Section */}
      <div className="card glass-panel" style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        color: 'white',
        border: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e0e7ff' }}>
              Semester {data.progress.semester_number} Progress
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#a5b4fc', marginTop: '4px' }}>Current Academic Term</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: data.progress.overall_attendance_percentage >= 75 ? '#34d399' : data.progress.overall_attendance_percentage >= 65 ? '#fbbf24' : '#f87171' }}>
              {data.progress.overall_attendance_percentage}%
            </div>
            <div style={{ fontSize: '0.8rem', color: '#c7d2fe', textTransform: 'uppercase' }}>Overall Attendance</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Layers size={24} color="#a5b4fc" />
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{data.progress.total_subjects}</div>
              <div style={{ fontSize: '0.75rem', color: '#a5b4fc' }}>Total Subjects</div>
            </div>
          </div>
          <div style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.2)', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircle2 size={24} color="#34d399" />
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#34d399' }}>{data.progress.good_attendance_count}</div>
              <div style={{ fontSize: '0.75rem', color: '#a5b4fc' }}>Good Attendance</div>
            </div>
          </div>
          <div style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={24} color="#fbbf24" />
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fbbf24' }}>{data.progress.low_attendance_count}</div>
              <div style={{ fontSize: '0.75rem', color: '#a5b4fc' }}>Low Attendance</div>
            </div>
          </div>
          <div style={{ background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.2)', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertCircle size={24} color="#f87171" />
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f87171' }}>{data.progress.critical_attendance_count}</div>
              <div style={{ fontSize: '0.75rem', color: '#a5b4fc' }}>Critical Attendance</div>
            </div>
          </div>
        </div>
      </div>

      {/* Semesters Grid */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>My Academic Journey</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {data.semesters.map(sem => (
            <div
              key={sem.semester_number}
              onClick={() => navigate(`/semesters/${sem.semester_number}`)}
              className="card"
              style={{
                cursor: 'pointer',
                border: sem.is_current ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                background: sem.is_current ? '#f8fafc' : 'white',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
            >
              {sem.is_current && (
                <div style={{ position: 'absolute', top: '-10px', right: '16px', background: 'var(--primary)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, boxShadow: 'var(--shadow-sm)' }}>
                  Current Semester
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: sem.is_current ? 'var(--primary)' : 'var(--text-main)' }}>
                  {sem.title}
                </h4>
                <div style={{ 
                  background: sem.status === 'Completed' ? 'var(--success-bg)' : sem.status === 'Upcoming' ? '#f1f5f9' : 'var(--primary-light)',
                  color: sem.status === 'Completed' ? 'var(--success)' : sem.status === 'Upcoming' ? '#64748b' : 'var(--primary)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>
                  {sem.status}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.9rem' }}>
                <BookOpen size={16} />
                <span>{sem.subject_count} Subjects</span>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>
                  View Subjects <ChevronRight size={16} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
