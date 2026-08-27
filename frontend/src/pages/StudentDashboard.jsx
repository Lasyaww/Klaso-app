import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LowAttendanceBanner } from '../components/LowAttendanceBanner';
import { MissedClassCard } from '../components/MissedClassCard';
import {
  Calendar, Clock, MapPin, Bot, BookOpen, Award, UserCheck,
  Sparkles, CheckCircle2, ArrowRight, AlertCircle, Layers, Library
} from 'lucide-react';
import api from '../services/api';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [attendanceData, setAttendanceData] = useState(null);
  const [todayClasses, setTodayClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const getOrdinalSuffix = (d) => {
    if (d > 3 && d < 21) return 'th';
    switch (d % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  };
  const dayName = today.toLocaleDateString('en-GB', { weekday: 'long' });
  const day = today.getDate();
  const monthName = today.toLocaleDateString('en-GB', { month: 'short' });
  const year = today.getFullYear();
  const todayFormatted = `${dayName}, ${day}${getOrdinalSuffix(day)} ${monthName} ${year}`;

  useEffect(() => {
    Promise.all([
      api.get('/students/attendance'),
      api.get('/students/today-classes')
    ])
      .then(([attendanceRes, todayRes]) => {
        setAttendanceData(attendanceRes);
        setTodayClasses(todayRes || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
        Loading Klaso Student Workspace...
      </div>
    );
  }

  const overallPct = attendanceData?.overall_percentage ?? 0;
  const status = attendanceData?.status || 'No Data';
  const missedClasses = attendanceData?.missed_records || [];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Welcome Banner */}
      <div className="card glass-panel" style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)',
        color: 'white',
        padding: '28px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#a5b4fc', marginBottom: '6px' }}>
            <Calendar size={16} /> {todayFormatted}
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
            {getGreeting()}, {user?.full_name?.split(' ')[0] || 'Student'} 👋
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#e0e7ff', marginTop: '4px' }}>
            Ready to learn today? Let's check your schedules and study goals.
          </p>
        </div>

        <button
          className="btn btn-ai"
          onClick={() => navigate('/ai-study-buddy')}
          style={{ padding: '12px 24px', fontSize: '0.95rem' }}
        >
          <Bot size={20} /> Open AI Study Buddy
        </button>
      </div>

      {/* Quick Action Shortcuts */}
      <div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#334155', marginBottom: '12px' }}>
          Quick Actions
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          <div
            className="card"
            onClick={() => navigate('/semesters')}
            style={{ padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', borderColor: '#cbd5e1' }}
          >
            <Library size={24} color="#0f172a" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>Current Semester</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Subjects & Notes</div>
            </div>
          </div>

          <div
            className="card"
            onClick={() => navigate('/attendance')}
            style={{ padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', background: '#e0e7ff', borderColor: '#c7d2fe' }}
          >
            <UserCheck size={24} color="#3730a3" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#3730a3' }}>Check Attendance</div>
              <div style={{ fontSize: '0.75rem', color: '#4338ca' }}>Subject breakdown</div>
            </div>
          </div>

          <div
            className="card"
            onClick={() => navigate('/ai-study-buddy')}
            style={{ padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(6, 182, 212, 0.12)', borderColor: '#a5f3fc' }}
          >
            <Bot size={24} color="#0284c7" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0369a1' }}>Ask AI Buddy</div>
              <div style={{ fontSize: '0.75rem', color: '#0284c7' }}>Academic doubt solver</div>
            </div>
          </div>

          <div
            className="card"
            onClick={() => navigate('/notes')}
            style={{ padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', background: '#fef3c7', borderColor: '#fde68a' }}
          >
            <BookOpen size={24} color="#92400e" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#92400e' }}>Revise Notes</div>
              <div style={{ fontSize: '0.75rem', color: '#b45309' }}>Summaries & PDFs</div>
            </div>
          </div>

          <div
            className="card"
            onClick={() => navigate('/quizzes')}
            style={{ padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', background: '#d1fae5', borderColor: '#a7f3d0' }}
          >
            <Award size={24} color="#065f46" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#065f46' }}>Take Quiz</div>
              <div style={{ fontSize: '0.75rem', color: '#047857' }}>MCQs & Revision</div>
            </div>
          </div>

          <div
            className="card"
            onClick={() => navigate('/timetable')}
            style={{ padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', background: '#f1f5f9', borderColor: '#cbd5e1' }}
          >
            <Clock size={24} color="#334155" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155' }}>Today's Classes</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Room & Schedule</div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Overview Card */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Attendance Overview</h3>
            <span className={`badge ${status === 'Good' ? 'badge-good' : status === 'Warning' ? 'badge-warning' : status === 'No Data' ? 'badge-neutral' : 'badge-critical'}`}>
              {status === 'Good' ? '🟢 Good' : status === 'Warning' ? '🟡 Low' : status === 'No Data' ? '⚪ No Data' : '🔴 Critical'}
            </span>
          </div>

          {/* Progress Circular Display */}
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <div style={{
              width: '130px',
              height: '130px',
              borderRadius: '50%',
              background: `conic-gradient(${overallPct >= 75 ? '#10b981' : overallPct >= 65 ? '#f59e0b' : '#ef4444'} ${overallPct * 3.6}deg, #e2e8f0 0deg)`,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                width: '106px',
                height: '106px',
                borderRadius: '50%',
                background: 'white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0f172a' }}>
                  {status === 'No Data' ? 'N/A' : `${overallPct}%`}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Overall</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem', textAlign: 'center' }}>
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
              <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Attended</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#10b981' }}>{attendanceData?.total_attended || 0}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
              <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Missed</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#ef4444' }}>{attendanceData?.total_missed || 0}</div>
            </div>
          </div>
        </div>

        {/* Low Attendance Warning System Banner & Breakdown */}
        <LowAttendanceBanner
          overallPercentage={overallPct}
          lowSubjects={attendanceData?.low_subjects || []}
          status={status}
        />
      </div>

      {/* Class Location / Today's Classes */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Today's Classes & Locations 📍</h3>
          <button className="btn btn-outline" onClick={() => navigate('/timetable')} style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
            View Full Timetable
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {todayClasses.map(c => (
            <div key={c.id} className="card" style={{ borderLeft: '4px solid var(--primary)', background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>{c.subject_code}</span>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '2px' }}>{c.subject_name}</h4>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Faculty: {c.faculty_name}</p>
                </div>
                <span className="badge" style={{ background: '#f1f5f9', color: '#334155' }}>
                  {c.start_time} - {c.end_time}
                </span>
              </div>

              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontWeight: 600, fontSize: '0.9rem' }}>
                <MapPin size={18} color="#ef4444" />
                <span>📍 {c.block} — {c.room_number}</span>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 400 }}>({c.building_name})</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Missed Class Cards Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: missedClasses.length > 0 ? '#ef4444' : '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {missedClasses.length > 0 ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />} Missed Classes ({missedClasses.length})
          </h3>
          {missedClasses.length > 0 && (
            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Click any missed class to launch AI Study Buddy for lecture recap!
            </span>
          )}
        </div>

        {missedClasses.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {missedClasses.map(mc => (
              <MissedClassCard key={mc.attendance_id} missedClass={mc} />
            ))}
          </div>
        ) : (
          <div className="card" style={{ background: '#ecfdf5', borderColor: '#a7f3d0', textAlign: 'center', padding: '32px' }}>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#065f46', marginBottom: '8px' }}>🎉 Great job!</h4>
            <p style={{ color: '#047857' }}>You haven't missed any classes.<br/>Keep up your attendance!</p>
          </div>
        )}
      </div>
    </div>
  );
};
