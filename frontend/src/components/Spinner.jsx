import React from 'react';

const Spinner = ({ size = 'md', text = 'Loading...', fullScreen = false }) => {
  const sizes = {
    sm: { ring: '20px', thickness: '2px', font: '12px' },
    md: { ring: '40px', thickness: '3px', font: '14px' },
    lg: { ring: '64px', thickness: '4px', font: '16px' },
  };
  const s = sizes[size] || sizes.md;

  const spinner = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <div
        style={{
          width: s.ring,
          height: s.ring,
          border: `${s.thickness} solid rgba(99,102,241,0.15)`,
          borderTopColor: '#6366f1',
          borderRadius: '50%',
          animation: 'spinnerRotate 0.7s linear infinite',
        }}
      />
      {text && (
        <span style={{ color: '#a0aec0', fontSize: s.font, fontWeight: 500 }}>{text}</span>
      )}
      <style>{`
        @keyframes spinnerRotate {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  if (fullScreen) {
    return (
      <div style={{
        position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(10,10,20,0.7)', backdropFilter: 'blur(4px)', zIndex: 9999,
      }}>
        {spinner}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      {spinner}
    </div>
  );
};

// Inline button spinner
export const ButtonSpinner = () => (
  <span style={{
    display: 'inline-block', width: '16px', height: '16px',
    border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
    borderRadius: '50%', animation: 'spinnerRotate 0.7s linear infinite', marginRight: '8px', verticalAlign: 'middle',
  }}>
    <style>{`@keyframes spinnerRotate { to { transform: rotate(360deg); }}`}</style>
  </span>
);

export default Spinner;
