import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Search, Filter, ArrowLeft, BookOpen, Clock, MapPin, User, ChevronRight, AlertCircle, Video } from 'lucide-react';

export const SemesterSubjectsPage = () => {
  const { semId } = useParams();
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(''); // '', 'good', 'low', 'critical', 'notes', 'lectures'

  const fetchSubjects = () => {
    setLoading(true);
    let url = `/students/semesters/${semId}/subjects`;
    const params = new URLSearchParams();
    if (search) params.append('q', search);
    if (filter) params.append('filter_type', filter);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    api.get(url)
      .then(res => setData(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semId, filter]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSubjects();
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button 
          onClick={() => navigate('/semesters')}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748b' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '4px' }}>Semester {semId}</h2>
          <p style={{ color: '#64748b' }}>Your Subjects</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="card" style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: '250px', background: '#f8fafc', padding: '10px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <Search size={18} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Search subjects or faculty..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', marginLeft: '10px', width: '100%', fontSize: '0.95rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={18} color="#64748b" />
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="form-control"
            style={{ width: 'auto', padding: '10px 16px', marginBottom: 0 }}
          >
            <option value="">All Subjects</option>
            <option value="good">Good Attendance (≥ 75%)</option>
            <option value="low">Low Attendance (65-74%)</option>
            <option value="critical">Critical Attendance (&lt; 65%)</option>
            <option value="notes">Notes Available</option>
            <option value="lectures">Lectures Available</option>
          </select>
        </div>
      </div>

      {/* Subject Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading subjects...</div>
      ) : !data || data.subjects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
          <BookOpen size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
          <h3>No subjects found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {data.subjects.map(subj => (
            <div key={subj.subject_id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>{subj.subject_code}</span>
                  <span className={`badge ${subj.attendance_status === 'Good' ? 'badge-good' : subj.attendance_status === 'Warning' ? 'badge-warning' : 'badge-critical'}`}>
                    {subj.attendance_percentage}%
                  </span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>{subj.subject_name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.9rem' }}>
                  <User size={16} /> {subj.faculty_name}
                </div>
              </div>

              {/* Body Details */}
              <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#f8fafc', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#475569' }}>
                  <Clock size={16} color="#64748b" /> Next Class: <strong style={{ color: '#0f172a' }}>{subj.next_class}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#475569' }}>
                  <MapPin size={16} color="#ef4444" /> Location: <strong style={{ color: '#0f172a' }}>{subj.classroom}</strong>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  {subj.notes_count > 0 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                      <BookOpen size={12} /> {subj.notes_count} Notes
                    </span>
                  )}
                  {subj.lectures_count > 0 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', background: '#e0f2fe', color: '#0284c7', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                      <Video size={12} /> {subj.lectures_count} Lectures
                    </span>
                  )}
                  {subj.attendance_status === 'Critical' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', background: 'var(--danger-bg)', color: 'var(--danger)', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                      <AlertCircle size={12} /> Low Attendance
                    </span>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid var(--border-light)' }}>
                <button 
                  onClick={() => navigate(`/subjects/${subj.subject_id}`)}
                  style={{ padding: '16px', background: 'white', border: 'none', borderRight: '1px solid var(--border-light)', cursor: 'pointer', fontWeight: 600, color: 'var(--primary)', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.target.style.background = 'white'}
                >
                  View Subject
                </button>
                <button 
                  onClick={() => navigate(`/subjects/${subj.subject_id}`)}
                  style={{ padding: '16px', background: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, color: '#334155', transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.target.style.background = 'white'}
                >
                  Notes <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
