import React, { useState, useEffect } from 'react';
import { UserCheck, Calendar, AlertTriangle, CheckCircle2, Bot, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export const AttendancePage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/students/attendance')
      .then((res) => setData(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '40px', color: '#64748b' }}>Loading Attendance Records...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Subject-Wise Attendance</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Detailed breakdown of your attended and missed classes. College threshold is <strong>75%</strong>.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Overall Attendance</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: data?.status === 'No Data' ? '#64748b' : ((data?.overall_percentage ?? 0) >= 75 ? '#10b981' : '#ef4444') }}>
            {data?.status === 'No Data' ? 'N/A' : `${data?.overall_percentage ?? 0}%`}
          </div>
        </div>
      </div>

      {/* Subject Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {data?.subjects.map(subj => (
          <div key={subj.subject_id} className="card" style={{
            borderTop: `5px solid ${subj.percentage >= 75 ? '#10b981' : subj.percentage >= 65 ? '#f59e0b' : '#ef4444'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>{subj.subject_code}</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{subj.subject_name}</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>Prof: {subj.faculty_name}</p>
              </div>
              <span className={`badge ${subj.percentage >= 75 ? 'badge-good' : subj.percentage >= 65 ? 'badge-warning' : 'badge-critical'}`}>
                {subj.percentage >= 75 ? '🟢 Good' : subj.percentage >= 65 ? '🟡 Low' : '🔴 Critical'}
              </span>
            </div>

            <div style={{ margin: '16px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>
                <span>Attendance Score</span>
                <span style={{ color: subj.percentage >= 75 ? '#10b981' : '#ef4444' }}>{subj.percentage}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px' }}>
                <div style={{
                  width: `${subj.percentage}%`,
                  height: '100%',
                  background: subj.percentage >= 75 ? '#10b981' : subj.percentage >= 65 ? '#f59e0b' : '#ef4444',
                  borderRadius: '4px'
                }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center', fontSize: '0.82rem', background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
              <div>
                <div style={{ color: '#64748b' }}>Total</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>{subj.total_classes}</div>
              </div>
              <div>
                <div style={{ color: '#64748b' }}>Attended</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#10b981' }}>{subj.attended}</div>
              </div>
              <div>
                <div style={{ color: '#64748b' }}>Missed</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#ef4444' }}>{subj.missed}</div>
              </div>
            </div>

            {subj.percentage < 75 && subj.total_classes > 0 && (
              <button
                className="btn btn-ai"
                onClick={() => navigate('/ai-study-buddy')}
                style={{ width: '100%', marginTop: '14px', fontSize: '0.82rem', padding: '8px' }}
              >
                <Bot size={14} /> Remediate {subj.subject_code} with AI Buddy
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
