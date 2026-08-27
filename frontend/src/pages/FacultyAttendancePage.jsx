import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserCheck, Check, X, Save, ArrowLeft } from 'lucide-react';
import api from '../services/api';

export const FacultyAttendancePage = () => {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [classData, setClassData] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClassStudents();
  }, [classId, attendanceDate]);

  const fetchClassStudents = () => {
    setLoading(true);
    api.get(`/faculty/classes/${classId || 1}/students?date=${attendanceDate}`)
      .then((res) => {
        setClassData(res);
        setStudents(res.students);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleToggleStatus = (stId, status) => {
    setStudents(prev => prev.map(st => st.student_id === stId ? { ...st, current_status: status } : st));
  };

  const handleMarkAll = (status) => {
    setStudents(prev => prev.map(st => ({ ...st, current_status: status })));
  };

  const handleSaveAttendance = () => {
    setSaving(true);
    const records = students.map(st => ({
      student_id: st.student_id,
      status: st.current_status
    }));

    api.post('/faculty/attendance', {
      class_session_id: Number(classId || 1),
      date: attendanceDate,
      records
    })
      .then(() => {
        alert("Attendance successfully saved!");
        navigate('/dashboard');
      })
      .catch((err) => alert(err.message))
      .finally(() => setSaving(false));
  };

  if (loading) return <div style={{ padding: '40px', color: '#64748b' }}>Loading Student Register...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard')} style={{ marginBottom: '8px', padding: '4px 12px', fontSize: '0.8rem' }}>
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Mark Attendance: {classData?.subject_name}</h2>
        </div>
        <button className="btn btn-primary" onClick={handleSaveAttendance} disabled={saving}>
          <Save size={18} /> {saving ? 'Saving...' : 'Save Attendance Log'}
        </button>
      </div>

      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Select Date</label>
          <input
            type="date"
            className="form-control"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
          />
        </div>

        {/* Bulk Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => handleMarkAll('present')}>
            <Check size={16} color="#10b981" /> Mark All Present
          </button>
          <button className="btn btn-secondary" onClick={() => handleMarkAll('absent')}>
            <X size={16} color="#ef4444" /> Mark All Absent
          </button>
        </div>
      </div>

      {/* Student Roster Table */}
      <div className="card">
        <div className="table-responsive">
          <table className="klaso-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Reg Number</th>
                <th>Overall %</th>
                <th>Today's Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map(st => (
                <tr key={st.student_id}>
                  <td style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600 }}>
                    <img src={st.profile_pic} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                    {st.full_name}
                  </td>
                  <td>{st.reg_no}</td>
                  <td style={{ fontWeight: 700, color: st.attendance_percentage < 75 ? '#ef4444' : '#10b981' }}>
                    {st.attendance_percentage}%
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleToggleStatus(st.student_id, 'present')}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '16px',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          background: st.current_status === 'present' ? '#10b981' : '#f1f5f9',
                          color: st.current_status === 'present' ? 'white' : '#475569'
                        }}
                      >
                        Present
                      </button>
                      <button
                        onClick={() => handleToggleStatus(st.student_id, 'absent')}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '16px',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          background: st.current_status === 'absent' ? '#ef4444' : '#f1f5f9',
                          color: st.current_status === 'absent' ? 'white' : '#475569'
                        }}
                      >
                        Absent
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
