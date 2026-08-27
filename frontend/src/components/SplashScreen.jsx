import React, { useEffect, useState } from 'react';
import { Logo } from './Logo';

export const SplashScreen = ({ onFinish }) => {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setFade(true), 2000);
    const timer2 = setTimeout(() => onFinish(), 2400);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onFinish]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fade ? 0 : 1,
        transition: 'opacity 0.4s ease-out',
        color: 'white',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          transform: 'scale(1.15)',
          animation: 'pulseGlow 2s infinite alternate',
        }}
      >
        <Logo size="large" showTagline={true} variant="light" />

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <div className="dot-pulse" style={{ animationDelay: '0s' }}></div>
          <div className="dot-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="dot-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>

      <style>{`
        @keyframes pulseGlow {
          0% { filter: drop-shadow(0 0 15px rgba(79, 70, 229, 0.4)); }
          100% { filter: drop-shadow(0 0 35px rgba(6, 182, 212, 0.7)); }
        }
        .dot-pulse {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #06B6D4;
          animation: dotBounce 1.2s infinite ease-in-out;
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1.3); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
