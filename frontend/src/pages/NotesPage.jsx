import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, Download, Sparkles, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export const NotesPage = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notes')
      .then((res) => setNotes(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '40px', color: '#64748b' }}>Loading Course Notes & Materials...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Course Notes & Study Materials 📚</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Faculty-uploaded lecture PDFs, reference notes, and AI-generated revision summaries.
          </p>
        </div>
        <button className="btn btn-ai" onClick={() => navigate('/ai-study-buddy')}>
          <Bot size={18} /> Summarize All with AI Buddy
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {notes.map(n => (
          <div key={n.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                  {n.subject_code}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {new Date(n.created_at).toLocaleDateString()}
                </span>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{n.title}</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>Prof: {n.faculty_name}</p>
              <p style={{ fontSize: '0.88rem', color: '#334155', marginTop: '10px' }}>{n.description}</p>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <a
                href={n.file_url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: '0.82rem', textDecoration: 'none' }}
              >
                <Download size={14} /> PDF Material
              </a>
              <button
                className="btn btn-ai"
                onClick={() => navigate('/ai-study-buddy')}
                style={{ flex: 1, fontSize: '0.82rem' }}
              >
                <Sparkles size={14} /> AI Summary
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
