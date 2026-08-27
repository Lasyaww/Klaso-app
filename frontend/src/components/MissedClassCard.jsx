import React from 'react';
import { Calendar, Clock, MapPin, Bot, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MissedClassCard = ({ missedClass }) => {
  const navigate = useNavigate();

  const handleOpenAIHelp = () => {
    // Navigate to AI Study Buddy page with missed class context state
    navigate('/ai-study-buddy', { state: { missedClass } });
  };

  return (
    <div className="card" style={{
      borderLeft: '4px solid #ef4444',
      background: 'white',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertCircle size={14} /> 🔴 Missed Class
          </span>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '4px', color: '#0f172a' }}>
            {missedClass.subject_name} ({missedClass.subject_code})
          </h4>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Prof: {missedClass.faculty_name}</p>
        </div>
        <span className="badge badge-critical">Absent</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.84rem', color: '#334155' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={15} color="#64748b" />
          <span>{missedClass.date}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={15} color="#64748b" />
          <span>{missedClass.time}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={15} color="#64748b" />
          <span style={{ fontWeight: 600 }}>{missedClass.block} — {missedClass.room_number}</span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>({missedClass.building_name})</span>
        </div>
      </div>

      <button
        className="btn btn-ai"
        onClick={handleOpenAIHelp}
        style={{ width: '100%', marginTop: '6px', fontSize: '0.85rem', padding: '8px 12px' }}
      >
        <Bot size={16} /> Catch up with AI Study Buddy 🤖
      </button>
    </div>
  );
};
