import React from 'react';
import './Avatar.css';

export default function Avatar({ person, size = 54, fontSize = 16, online = false, ring = false }) {
  const colors = {
    A: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    B: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    C: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    D: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    E: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  };

  const gradient = colors[person?.g] || colors.A;

  return (
    <div className="avatar-container" style={{ position: 'relative', width: size, height: size }}>
      <div
        className={`avatar ${ring ? 'avatar-ring' : ''}`}
        style={{
          width: size,
          height: size,
          background: gradient,
          fontSize,
        }}
      >
        {person?.initials || '?'}
      </div>
      {online && (
        <div
          className="avatar-online"
          style={{
            width: size * 0.25,
            height: size * 0.25,
            right: size * 0.02,
            bottom: size * 0.02,
          }}
        />
      )}
    </div>
  );
}
