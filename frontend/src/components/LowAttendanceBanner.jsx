import React from 'react';
import { AlertTriangle, AlertOctagon, CheckCircle, Bot, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LowAttendanceBanner = ({ overallPercentage, lowSubjects = [], status }) => {
  const navigate = useNavigate();

  if (status === 'No Data' || (overallPercentage === 0 && lowSubjects.length === 0)) {
    return (
      <div className="card" style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        borderColor: '#e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <CheckCircle size={36} color="#64748b" />
        <div>
          <h3 style={{ color: '#475569', fontSize: '1.1rem', fontWeight: 700 }}>No Attendance Records</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '2px' }}>
            No attendance has been recorded for you yet.
          </p>
        </div>
      </div>
    );
  }

  if (overallPercentage >= 75 && lowSubjects.length === 0) {
    return (
      <div className="card" style={{
        background: 'linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%)',
        borderColor: '#a7f3d0',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <CheckCircle size={36} color="#10b981" />
        <div>
          <h3 style={{ color: '#065f46', fontSize: '1.1rem', fontWeight: 700 }}>✅ Attendance Looking Good</h3>
          <p style={{ color: '#047857', fontSize: '0.9rem', marginTop: '2px' }}>
            Overall: {overallPercentage}%<br/>You're maintaining healthy attendance.
          </p>
        </div>
      </div>
    );
  }

  const isCritical = overallPercentage < 65 || lowSubjects.some(s => s.percentage < 65);

  return (
    <div className="card" style={{
      background: isCritical
        ? 'linear-gradient(135deg, #fee2e2 0%, #fff1f1 100%)'
        : 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)',
      borderColor: isCritical ? '#fca5a5' : '#fde68a',
      marginBottom: '24px'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: lowSubjects.length > 0 ? '16px' : 0 }}>
        {isCritical ? <AlertOctagon size={36} color="#ef4444" /> : <AlertTriangle size={36} color="#f59e0b" />}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: isCritical ? '#991b1b' : '#92400e', fontSize: '1.1rem', fontWeight: 700 }}>
              {isCritical
                ? '🚨 Critical Attendance Warning'
                : '⚠️ Attendance Warning'}
            </h3>
            <span className="badge" style={{
              background: isCritical ? '#ef4444' : '#f59e0b',
              color: 'white',
              fontSize: '0.85rem'
            }}>
              Overall: {overallPercentage}%
            </span>
          </div>
          <p style={{ color: isCritical ? '#7f1d1d' : '#78350f', fontSize: '0.9rem', marginTop: '4px' }}>
            {isCritical
              ? 'Your attendance has dropped below 65%.'
              : 'Try to attend upcoming classes regularly.'}
          </p>
        </div>
      </div>

      {lowSubjects.length > 0 && (
        <div style={{ background: 'white', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>Low Attendance Subjects</h4>
            <button
              className="btn btn-ai"
              onClick={() => navigate('/ai-study-buddy')}
              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
            >
              <Bot size={14} /> Catch up with AI Study Buddy
            </button>
          </div>

          <div className="table-responsive">
            <table className="klaso-table" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Attendance %</th>
                  <th>Faculty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowSubjects.map(sub => (
                  <tr key={sub.subject_id}>
                    <td style={{ fontWeight: 600 }}>{sub.subject_code} - {sub.subject_name}</td>
                    <td style={{ fontWeight: 700, color: sub.percentage < 65 ? '#ef4444' : '#f59e0b' }}>
                      {sub.percentage}% ({sub.attended}/{sub.total_classes} classes)
                    </td>
                    <td>{sub.faculty_name}</td>
                    <td>
                      <span className={`badge ${sub.percentage < 65 ? 'badge-critical' : 'badge-warning'}`}>
                        {sub.percentage < 65 ? '🔴 Critical' : '🟡 Low'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
