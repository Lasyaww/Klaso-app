import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';
import { UserCheck, GraduationCap, ShieldAlert, LogIn, ArrowRight, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

export const Login = () => {
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('student'); // 'student', 'faculty', 'admin'
  const [email, setEmail] = useState('lasya@klaso.edu');
  const [regNo, setRegNo] = useState('22ABC123');
  const [password, setPassword] = useState('Student@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleSwitch = (newRole) => {
    setRole(newRole);
    setError('');
    if (newRole === 'student') {
      setEmail('lasya@klaso.edu');
      setRegNo('22ABC123');
      setPassword('Student@123');
    } else if (newRole === 'faculty') {
      setEmail('dr.kumar@klaso.edu');
      setRegNo('FAC001');
      setPassword('Faculty@123');
    } else {
      setEmail('admin@klaso.edu');
      setRegNo('');
      setPassword('Admin@123');
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    api.post('/auth/login', {
      email,
      password,
      role,
      reg_no: role !== 'admin' ? regNo : undefined
    })
      .then((data) => {
        loginUser(data);
        navigate('/dashboard');
      })
      .catch((err) => {
        setError(err.message || 'Login failed. Please verify your credentials.');
      })
      .finally(() => setLoading(false));
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      color: 'white'
    }}>
      <div className="card glass-dark" style={{ width: '100%', maxWidth: '460px', padding: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Logo size="large" showTagline={true} />
        </div>

        {/* Role Selector Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '6px',
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '6px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px'
        }}>
          <button
            type="button"
            onClick={() => handleRoleSwitch('student')}
            style={{
              padding: '10px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              background: role === 'student' ? 'var(--primary)' : 'transparent',
              color: 'white',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <GraduationCap size={16} /> Student
          </button>

          <button
            type="button"
            onClick={() => handleRoleSwitch('faculty')}
            style={{
              padding: '10px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              background: role === 'faculty' ? '#d97706' : 'transparent',
              color: 'white',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <UserCheck size={16} /> Faculty
          </button>

          <button
            type="button"
            onClick={() => handleRoleSwitch('admin')}
            style={{
              padding: '10px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              background: role === 'admin' ? '#dc2626' : 'transparent',
              color: 'white',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <ShieldAlert size={16} /> Admin
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            padding: '12px',
            color: '#fca5a5',
            fontSize: '0.88rem',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label style={{ color: '#cbd5e1' }}>College Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder={role === 'student' ? 'student@klaso.edu' : role === 'faculty' ? 'faculty@klaso.edu' : 'admin@klaso.edu'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ background: 'rgba(15, 23, 42, 0.7)', color: 'white', borderColor: 'rgba(255, 255, 255, 0.2)' }}
            />
          </div>

          {role !== 'admin' && (
            <div className="form-group">
              <label style={{ color: '#cbd5e1' }}>
                {role === 'student' ? 'Registration Number' : 'Faculty / Employee ID'}
              </label>
              <input
                type="text"
                className="form-control"
                placeholder={role === 'student' ? '22ABC123' : 'FAC001'}
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                required
                style={{ background: 'rgba(15, 23, 42, 0.7)', color: 'white', borderColor: 'rgba(255, 255, 255, 0.2)' }}
              />
            </div>
          )}

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ color: '#cbd5e1' }}>Password</label>
              <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: '#38bdf8', textDecoration: 'none' }}>
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              className="form-control"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ background: 'rgba(15, 23, 42, 0.7)', color: 'white', borderColor: 'rgba(255, 255, 255, 0.2)' }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '12px', padding: '12px' }}
          >
            {loading ? 'Authenticating...' : `Log In as ${role.toUpperCase()}`} <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ margin: '20px 0', textAlign: 'center', position: 'relative' }}>
          <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', position: 'absolute', top: '50%', width: '100%' }}></div>
          <span style={{ background: '#1e293b', padding: '0 12px', position: 'relative', fontSize: '0.8rem', color: '#94a3b8' }}>
            OR
          </span>
        </div>

        <button
          type="button"
          onClick={() => alert("Google SSO Demo: Pre-authenticated with College G-Suite Domain @klaso.edu")}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'white',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Continue with Google
        </button>


      </div>
    </div>
  );
};
