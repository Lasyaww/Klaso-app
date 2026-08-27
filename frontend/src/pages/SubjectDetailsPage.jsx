import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, BookOpen, Clock, MapPin, Video, Award, Calendar, FileText, CheckCircle2, AlertCircle, AlertTriangle, Bot, Download, ExternalLink, CalendarDays } from 'lucide-react';

export const SubjectDetailsPage = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  
  const [subject, setSubject] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [notes, setNotes] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [missedClasses, setMissedClasses] = useState([]);
  const [schedule, setSchedule] = useState([]);
  
  const [activeTab, setActiveTab] = useState('overview'); // overview, notes, lectures, attendance, schedule
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/students/subjects/${subjectId}`),
      api.get(`/students/subjects/${subjectId}/attendance`),
      api.get(`/students/subjects/${subjectId}/notes`),
      api.get(`/students/subjects/${subjectId}/lectures`),
      api.get(`/students/subjects/${subjectId}/missed-classes`),
      api.get(`/students/subjects/${subjectId}/schedule`)
    ])
      .then(([subRes, attRes, notesRes, lectRes, missedRes, schedRes]) => {
        setSubject(subRes);
        setAttendanceHistory(attRes);
        setNotes(notesRes);
        setLectures(lectRes);
        setMissedClasses(missedRes);
        setSchedule(schedRes);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [subjectId]);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading subject details...</div>;
  }

  if (!subject) return <div style={{ padding: '40px', textAlign: 'center' }}>Subject not found.</div>;

  const attPct = subject.attendance.percentage;
  const attStatus = subject.attendance.status; // Good, Warning, Critical

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ background: 'white', border: '1px solid var(--border-light)', padding: '10px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748b', boxShadow: 'var(--shadow-sm)' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', padding: '4px 12px', borderRadius: '20px' }}>
              {subject.subject_code}
            </span>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Semester {subject.semester_number}</span>
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', lineHeight: 1.2 }}>
            {subject.subject_name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', color: '#475569', fontSize: '0.95rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <img src={subject.faculty_profile_pic} alt={subject.faculty_name} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
              <strong>{subject.faculty_name}</strong>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Award size={16}/> {subject.credits} Credits</span>
          </div>
        </div>

        {/* AI Buddy Button Prominent */}
        <button 
          className="btn btn-ai"
          onClick={() => navigate('/ai-study-buddy', { state: { subjectContext: subject } })}
          style={{ padding: '14px 24px', fontSize: '1.05rem', borderRadius: 'var(--radius-lg)' }}
        >
          <Bot size={24} /> Ask AI Study Buddy
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '1px' }}>
        {[
          { id: 'overview', label: 'Overview', icon: BookOpen },
          { id: 'attendance', label: 'Attendance', icon: CheckCircle2 },
          { id: 'notes', label: 'Notes', icon: FileText },
          { id: 'lectures', label: 'Lectures', icon: Video },
          { id: 'schedule', label: 'Schedule', icon: CalendarDays }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 20px',
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                color: isActive ? 'var(--primary)' : '#64748b',
                fontWeight: isActive ? 700 : 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Icon size={18} /> {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div style={{ minHeight: '400px' }}>
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
            
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="card">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px' }}>Description</h3>
                <p style={{ color: '#475569', lineHeight: 1.6 }}>{subject.description}</p>
              </div>

              {missedClasses.length > 0 && (
                <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertCircle size={20} /> Recent Missed Classes
                    </h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {missedClasses.slice(0, 3).map(mc => (
                      <div key={mc.attendance_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#334155' }}>{new Date(mc.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{mc.time} | {mc.room_number}</div>
                        </div>
                        <button 
                          className="btn" 
                          onClick={() => navigate('/ai-study-buddy', { state: { subjectContext: subject, missedClass: mc } })}
                          style={{ background: '#e0f2fe', color: '#0284c7', fontSize: '0.85rem', padding: '6px 12px' }}
                        >
                          <Bot size={14} /> Study with AI
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column (Sidebar metrics) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="card" style={{ background: attStatus === 'Good' ? '#f0fdf4' : attStatus === 'Warning' ? '#fffbeb' : '#fef2f2', borderColor: attStatus === 'Good' ? '#bbf7d0' : attStatus === 'Warning' ? '#fde68a' : '#fecaca' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                  📊 Attendance
                  <span className={`badge ${attStatus === 'Good' ? 'badge-good' : attStatus === 'Warning' ? 'badge-warning' : 'badge-critical'}`}>
                    {attPct}%
                  </span>
                </h3>
                
                {/* Progress Bar */}
                <div style={{ width: '100%', background: '#e2e8f0', borderRadius: '10px', height: '12px', marginBottom: '16px', overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    background: attPct >= 75 ? '#10b981' : attPct >= 65 ? '#f59e0b' : '#ef4444',
                    width: `${attPct}%`,
                    borderRadius: '10px'
                  }}></div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'center' }}>
                  <div style={{ background: 'white', padding: '10px', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Attended</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981' }}>{subject.attendance.attended}</div>
                  </div>
                  <div style={{ background: 'white', padding: '10px', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Absent</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ef4444' }}>{subject.attendance.missed}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.8rem', color: '#64748b' }}>
                  Required: {subject.attendance.required_percentage}%
                </div>
              </div>

              <div className="card" style={{ background: '#f8fafc' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', marginBottom: '12px' }}>Next Class</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ background: 'white', pading: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', boxShadow: 'var(--shadow-sm)' }}>
                    <Clock size={24} color="var(--primary)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{subject.next_class}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Today</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#475569', background: 'white', padding: '10px', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
                  <MapPin size={18} color="#ef4444" />
                  <span>{subject.location}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NOTES TAB */}
        {activeTab === 'notes' && (
          <div className="card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={24} color="var(--primary)"/> Subject Notes & Materials
            </h3>
            {notes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No notes uploaded yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {notes.map(note => (
                  <div key={note.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                      <div style={{ background: '#e0e7ff', color: '#4338ca', padding: '12px', borderRadius: '12px' }}>
                        <FileText size={24} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{note.unit_title}</h4>
                        <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '4px' }}>{note.description}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a href={note.file_url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '8px 16px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ExternalLink size={16} /> View
                      </a>
                      <a href={note.file_url} download target="_blank" rel="noreferrer" className="btn btn-primary" style={{ padding: '8px 16px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Download size={16} /> Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LECTURES TAB */}
        {activeTab === 'lectures' && (
          <div className="card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Video size={24} color="#ef4444"/> Lecture Recordings
            </h3>
            {lectures.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No lecture recordings available.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                {lectures.map(lec => (
                  <div key={lec.id} style={{ background: 'white', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ height: '160px', background: '#1e293b', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Video size={48} color="rgba(255,255,255,0.2)" />
                      <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {lec.duration_minutes} min
                      </div>
                    </div>
                    <div style={{ padding: '16px' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px', lineHeight: 1.4 }}>{lec.title}</h4>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '16px' }}>
                        {new Date(lec.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                      <button className="btn btn-outline" style={{ width: '100%' }}>
                        ▶ Watch Lecture
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === 'attendance' && (
          <div className="card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={24} color="var(--success)"/> Attendance History
            </h3>
            
            <div className="table-responsive">
              <table className="klaso-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Marked By</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceHistory.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', color: '#64748b' }}>No attendance records found.</td></tr>
                  ) : (
                    attendanceHistory.map(record => (
                      <tr key={record.id}>
                        <td style={{ fontWeight: 600 }}>{new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        <td style={{ color: '#475569' }}>{record.time}</td>
                        <td>
                          <span className={`badge ${record.status === 'Present' ? 'badge-good' : 'badge-critical'}`}>
                            {record.status}
                          </span>
                        </td>
                        <td style={{ color: '#64748b', fontSize: '0.9rem' }}>{record.marked_by}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SCHEDULE TAB */}
        {activeTab === 'schedule' && (
          <div className="card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarDays size={24} color="var(--primary)"/> Weekly Schedule
            </h3>
            
            {schedule.length === 0 ? (
               <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No schedule available for this subject.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                {schedule.map(sess => (
                  <div key={sess.id} style={{ padding: '16px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '8px' }}>
                      {sess.day_of_week}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontWeight: 600, marginBottom: '8px' }}>
                      <Clock size={16} /> {sess.start_time} - {sess.end_time}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.9rem' }}>
                      <MapPin size={16} /> {sess.block} — {sess.room_number}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
