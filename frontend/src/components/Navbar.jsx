import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';
import { Bell, Search, LogOut, User, Sparkles, AlertTriangle, BookOpen } from 'lucide-react';
import api from '../services/api';

export const Navbar = ({ onSearch, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      api.get('/notifications')
        .then((res) => setNotifications(res))
        .catch(() => {});
    }
  }, [user]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllRead = (id) => {
    api.put(`/notifications/${id}/read`).then(() => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    }).catch(() => {});
  };

  return (
    <header className="glass-panel" style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid var(--border-light)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Logo size="small" />
        <span className="badge" style={{
          background: user?.role === 'admin' ? '#fee2e2' : user?.role === 'faculty' ? '#fef3c7' : '#e0e7ff',
          color: user?.role === 'admin' ? '#991b1b' : user?.role === 'faculty' ? '#92400e' : '#3730a3',
          textTransform: 'uppercase',
          fontSize: '0.72rem',
          letterSpacing: '0.05em'
        }}>
          {user?.role || 'Guest'}
        </span>
      </div>

      {/* Global Search */}
      <div style={{ position: 'relative', width: '320px', display: 'flex', alignItems: 'center' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
        <input
          type="text"
          className="form-control"
          placeholder="Search subjects, notes, faculty, AI..."
          value={searchQuery}
          onChange={handleSearchChange}
          style={{
            paddingLeft: '38px',
            paddingTop: '8px',
            paddingBottom: '8px',
            fontSize: '0.88rem',
            borderRadius: '20px',
            background: '#f8fafc'
          }}
        />
      </div>

      {/* Action Items & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Notifications Icon */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#334155',
              position: 'relative'
            }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                background: '#ef4444',
                color: 'white',
                fontSize: '0.65rem',
                fontWeight: 'bold',
                borderRadius: '10px',
                padding: '2px 6px'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifs && (
            <div className="card" style={{
              position: 'absolute',
              right: 0,
              top: '50px',
              width: '340px',
              maxHeight: '400px',
              overflowY: 'auto',
              zIndex: 200,
              padding: '16px',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Notifications</h4>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{notifications.length} total</span>
              </div>
              {notifications.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center', padding: '12px' }}>
                  No new notifications.
                </p>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => markAllRead(n.id)}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      background: n.is_read ? '#f8fafc' : '#eff6ff',
                      borderLeft: n.type === 'attendance_warning' ? '4px solid #ef4444' : '4px solid #4f46e5',
                      marginBottom: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {n.type === 'attendance_warning' ? <AlertTriangle size={14} color="#ef4444" /> : <BookOpen size={14} color="#4f46e5" />}
                      {n.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#475569' }}>{n.message}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* User Profile Badge & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src={user?.profile_pic || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
            alt="Profile"
            style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{user?.full_name}</span>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{user?.reg_no || user?.email}</span>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              marginLeft: '6px'
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};
