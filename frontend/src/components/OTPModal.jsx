import React, { useState } from 'react';
import { Mail, CheckCircle, RefreshCw, X } from 'lucide-react';
import api from '../services/api';

export const OTPModal = ({ email, purpose, demoOtp, onVerified, onClose }) => {
  const [otp, setOtp] = useState(demoOtp || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  const handleVerify = (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Please enter a 6-digit OTP code.');
      return;
    }
    setError('');
    setLoading(true);

    api.post('/auth/verify-otp', { email, otp_code: otp, purpose })
      .then((res) => {
        onVerified(otp);
      })
      .catch((err) => {
        setError(err.message || 'OTP verification failed.');
      })
      .finally(() => setLoading(false));
  };

  const handleResend = () => {
    setResendMsg('Sending new OTP...');
    api.post('/auth/send-otp', { email, purpose })
      .then((res) => {
        setResendMsg(`New OTP sent! (Demo Code: ${res.demo_otp})`);
        if (res.demo_otp) setOtp(res.demo_otp);
      })
      .catch((err) => setResendMsg(err.message));
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', position: 'relative' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'var(--primary-light)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            marginBottom: '12px'
          }}>
            <Mail size={28} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>OTP Verification</h3>
          <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '4px' }}>
            We've sent a 6-digit code to <strong>{email}</strong>
          </p>
        </div>

        {demoOtp && (
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', color: '#065f46', textAlign: 'center' }}>
            💡 Demo Quick Fill OTP: <strong>{demoOtp}</strong>
          </div>
        )}

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', padding: '10px', borderRadius: '8px', color: '#991b1b', fontSize: '0.85rem', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleVerify}>
          <div className="form-group">
            <label style={{ textAlign: 'center' }}>Enter 6-Digit OTP Code</label>
            <input
              type="text"
              className="form-control"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              style={{ textAlign: 'center', letterSpacing: '6px', fontSize: '1.4rem', fontWeight: 700, padding: '10px' }}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '0.85rem' }}>
          <span style={{ color: '#64748b' }}>Didn't receive code?</span>
          <button
            onClick={handleResend}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <RefreshCw size={14} /> Resend OTP
          </button>
        </div>

        {resendMsg && (
          <p style={{ fontSize: '0.8rem', color: '#475569', marginTop: '8px', textAlign: 'center' }}>{resendMsg}</p>
        )}
      </div>
    </div>
  );
};
