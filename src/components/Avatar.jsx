import React from 'react';
import './Avatar.css';

// Same avatar gradient palette as the app (AV_GRADS in the app's mock data).
export const AV_GRADS = {
  A: ['#FF8A65', '#FF5277'], B: ['#5C6BFF', '#23B5FF'], C: ['#21C463', '#0EA5A5'],
  D: ['#FFB300', '#FF6F43'], E: ['#B66BFF', '#7C5CFF'], F: ['#FF5FA2', '#FF8C42'],
  G: ['#2DD4BF', '#3B82F6'], H: ['#F472B6', '#A855F7'], I: ['#60A5FA', '#6366F1'],
  J: ['#34D399', '#10B981'], K: ['#FB7185', '#E11D48'], L: ['#22D3EE', '#0891B2'],
};

export default function Avatar({ person, size = 54, fontSize = 16, online = false, ring = false }) {
  const grad = AV_GRADS[person?.g] || AV_GRADS.A;
  const gradient = `linear-gradient(135deg, ${grad[0]} 0%, ${grad[1]} 100%)`;

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
