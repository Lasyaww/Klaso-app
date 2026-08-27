import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserCheck, BookOpen, Upload, AlertTriangle, Users, Plus, CheckCircle } from 'lucide-react';
import api from '../services/api';

export const FacultyDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Note Upload Modal
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteDesc, setNoteDesc] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [noteFile, setNoteFile] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/faculty/classes'),
      api.get('/faculty/low-attendance-alerts')
    ])
      .then(([cls, alrts]) => {
        setClasses(cls);
        setAlerts(alrts);
        if (cls.length > 0) {
          setSelectedClassId(cls[0].id);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleUploadNote = (e) => {
    e.preventDefault();
    
    const selectedClass = classes.find(c => c.id === selectedClassId);
    if (!selectedClass) return;

    const formData = new FormData();
    formData.append('title', noteTitle);
    formData.append('description', noteDesc);
    formData.append('subject_id', selectedClass.subject_id);
    formData.append('class_session_id', selectedClassId);
    formData.append('content_text', noteDesc);
    if (noteFile) {
      formData.append('file', noteFile);
    }

    api.post('/faculty/notes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
      .then(() => {
        alert("Note uploaded successfully! Students can now access and summarize it.");
        setShowNoteModal(false);
        setNoteTitle('');
        setNoteDesc('');
        setNoteFile(null);
      })
      .catch((err) => alert(err.message));
  };

  if (loading) return <div style={{ padding: '40px', color: '#64748b' }}>Loading Faculty Console...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Welcome Header */}
      <div className="card glass-panel" style={{
        background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
        color: 'white',
        padding: '24px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <span style={{ fontSize: '0.85rem', color: '#fef3c7', textTransform: 'uppercase', fontWeight: 700 }}>
            Faculty Control Center
          </span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '2px' }}>
            Welcome, {user?.full_name} 🎓
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#fffbeb', marginTop: '2px' }}>
            Department: {user?.department || 'Computer Science'} | Designation: {user?.designation || 'Professor'}
          </p>
        </div>

        <button className="btn" onClick={() => setShowNoteModal(true)} style={{ background: 'white', color: '#b45309' }}>
          <Upload size={18} /> Upload Study Material
        </button>
      </div>

      {/* Today's Teaching Sessions */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px' }}>Your Classes & Attendance Marking</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {classes.map(c => (
            <div key={c.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="badge" style={{ background: '#fef3c7', color: '#92400e' }}>{c.subject_code}</span>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '4px' }}>{c.subject_name}</h4>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>{c.semester} — {c.section}</p>
                </div>
                <span className="badge" style={{ background: '#f1f5f9', color: '#334155' }}>
                  {c.start_time} - {c.end_time}
                </span>
              </div>

              <div style={{ margin: '14px 0', fontSize: '0.85rem', color: '#475569' }}>
                📍 Room: <strong>{c.room_number} ({c.building_name})</strong> | Enrolled Students: <strong>{c.total_students}</strong>
              </div>

              <button
                className="btn btn-primary"
                onClick={() => navigate(`/faculty/attendance/${c.id}`)}
                style={{ width: '100%', fontSize: '0.88rem' }}
              >
                <UserCheck size={16} /> Mark / Edit Attendance
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Low Attendance Student Alerts */}
      {alerts.length > 0 && (
        <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#ef4444' }}>
            <AlertTriangle size={20} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Low Attendance Warning Roster ({alerts.length} Students)</h3>
          </div>
          <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '14px' }}>
            Students falling below the mandatory 75% attendance threshold in your subjects:
          </p>

          <div className="table-responsive">
            <table className="klaso-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Reg Number</th>
                  <th>Subject</th>
                  <th>Attendance %</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((al, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{al.student_name}</td>
                    <td>{al.reg_no}</td>
                    <td>{al.subject_code} - {al.subject_name}</td>
                    <td style={{ fontWeight: 700, color: al.severity === 'Critical' ? '#ef4444' : '#f59e0b' }}>
                      {al.attendance_percentage}% ({al.attended}/{al.total_classes} classes)
                    </td>
                    <td>
                      <span className={`badge ${al.severity === 'Critical' ? 'badge-critical' : 'badge-warning'}`}>
                        {al.severity === 'Critical' ? '🔴 Critical (<65%)' : '🟡 Warning (<75%)'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Note Modal */}
      {showNoteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Upload Course Material / Note</h3>
            <form onSubmit={handleUploadNote}>
              <div className="form-group">
                <label>Select Subject</label>
                <select className="form-control" value={selectedClassId} onChange={(e) => setSelectedClassId(Number(e.target.value))}>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.subject_code} - {c.subject_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Note Title</label>
                <input type="text" className="form-control" placeholder="e.g. Chapter 4 - Tree Rotations" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Note Content / Summary Description</label>
                <textarea className="form-control" rows={4} placeholder="Key concepts taught..." value={noteDesc} onChange={(e) => setNoteDesc(e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginTop: '12px' }}>
                <label>Upload PDF File</label>
                <input type="file" accept="application/pdf" className="form-control" onChange={(e) => setNoteFile(e.target.files[0])} style={{ padding: '8px' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowNoteModal(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Upload Note</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
