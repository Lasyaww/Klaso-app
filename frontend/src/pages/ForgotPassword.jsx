import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { KeyRound, ArrowRight, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [regNo, setRegNo] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    api.post('/auth/forgot-password', {
      email,
      reg_no: regNo,
      new_password: newPassword
    })
      .then((res) => {
        setSuccess('Password updated successfully! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      })
      .catch((err) => {
        setError(err.message || 'Password reset failed. Verify your email and registration number.');
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
      <div className="card glass-dark" style={{ width: '100%', maxWidth: '440px', padding: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Logo size="large" showTagline={true} />
        </div>

        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px', textAlign: 'center' }}>Reset Password</h3>
        <p style={{ fontSize: '0.88rem', color: '#cbd5e1', textAlign: 'center', marginBottom: '20px' }}>
          Verify your registered email and registration number / faculty ID to set a new password.
        </p>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', padding: '10px', borderRadius: '8px', color: '#fca5a5', fontSize: '0.88rem', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', padding: '10px', borderRadius: '8px', color: '#a7f3d0', fontSize: '0.88rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} color="#10b981" /> {success}
          </div>
        )}

        <form onSubmit={handleResetPassword}>
          <div className="form-group">
            <label style={{ color: '#cbd5e1' }}>College Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="user@klaso.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ background: 'rgba(15, 23, 42, 0.7)', color: 'white', borderColor: 'rgba(255, 255, 255, 0.2)' }}
            />
          </div>

          <div className="form-group">
            <label style={{ color: '#cbd5e1' }}>Registration Number / Faculty ID</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. 22ABC123 or FAC001"
              value={regNo}
              onChange={(e) => setRegNo(e.target.value)}
              required
              style={{ background: 'rgba(15, 23, 42, 0.7)', color: 'white', borderColor: 'rgba(255, 255, 255, 0.2)' }}
            />
          </div>

          <div className="form-group">
            <label style={{ color: '#cbd5e1' }}>New Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
            {loading ? 'Resetting Password...' : 'Reset Password'} <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.88rem', color: '#cbd5e1' }}>
          Remembered your password?{' '}
          <Link to="/login" style={{ color: '#38bdf8', fontWeight: 600, textDecoration: 'none' }}>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};
