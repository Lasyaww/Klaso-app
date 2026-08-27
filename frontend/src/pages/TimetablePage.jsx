import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Calendar, User } from 'lucide-react';
import api from '../services/api';

export const TimetablePage = () => {
  const [timetable, setTimetable] = useState({});
  const [activeDay, setActiveDay] = useState('Monday');
  const [loading, setLoading] = useState(true);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    api.get('/students/timetable')
      .then((res) => setTimetable(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '40px', color: '#64748b' }}>Loading Timetable...</div>;

  const activeClasses = timetable[activeDay] || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Class Timetable & Room Guide 📍</h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Weekly schedule showing lecture timings, faculty instructors, and classroom block locations.
        </p>
      </div>

      {/* Day Selector Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {days.map(day => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className="btn"
            style={{
              background: activeDay === day ? 'var(--primary)' : 'white',
              color: activeDay === day ? 'white' : '#475569',
              border: '1px solid var(--border-light)',
              borderRadius: '20px',
              padding: '8px 20px',
              fontSize: '0.9rem'
            }}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Class Schedule Cards for Selected Day */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {activeClasses.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
            No scheduled lectures on {activeDay}. Enjoy your revision time! 📚
          </div>
        ) : (
          activeClasses.map(c => (
            <div key={c.id} className="card" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderLeft: '5px solid var(--primary)'
            }}>
              <div>
                <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', marginBottom: '4px' }}>
                  {c.subject_code}
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '2px' }}>{c.subject_name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.88rem', color: '#64748b', marginTop: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User size={15} /> Prof. {c.faculty_name}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={15} /> {c.start_time} - {c.end_time}
                  </span>
                </div>
              </div>

              <div style={{
                background: '#f8fafc',
                padding: '12px 20px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                textAlign: 'right'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Classroom Location</div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '2px' }}>
                  <MapPin size={16} /> {c.room}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>{c.building}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
