import React from 'react';

export const Logo = ({ size = 'medium', showTagline = false, variant = 'default' }) => {
  const sizeMap = {
    small: { icon: 32, text: '1.25rem', sub: '0.65rem' },
    medium: { icon: 42, text: '1.65rem', sub: '0.75rem' },
    large: { icon: 64, text: '2.5rem', sub: '0.9rem' },
  };

  const currentSize = sizeMap[size] || sizeMap.medium;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', userSelect: 'none' }}>
      <img
        src="/logo.jpg"
        alt="Klaso Logo"
        width={currentSize.icon}
        height={currentSize.icon}
        style={{
          borderRadius: '16px',
          objectFit: 'cover',
          filter: 'drop-shadow(0 4px 12px rgba(79, 70, 229, 0.25))'
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span
          className="brand-font"
          style={{
            fontSize: currentSize.text,
            fontWeight: 800,
            letterSpacing: '0.04em',
            color: variant === 'light' ? '#FFFFFF' : '#0F172A',
            lineHeight: 1,
            background: variant === 'light' ? 'none' : 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
            WebkitBackgroundClip: variant === 'light' ? 'none' : 'text',
            WebkitTextFillColor: variant === 'light' ? 'white' : 'transparent',
          }}
        >
          KLASO
        </span>
        {showTagline && (
          <span
            style={{
              fontSize: currentSize.sub,
              fontWeight: 600,
              color: variant === 'light' ? '#93C5FD' : '#64748B',
              letterSpacing: '0.03em',
              marginTop: '3px',
            }}
          >
            Smart Attendance. Smarter Learning.
          </span>
        )}
      </div>
    </div>
  );
};
