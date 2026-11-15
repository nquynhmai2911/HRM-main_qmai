import React from 'react';

interface DiamondLogoProps {
  size?: number;
  showText?: boolean;
  textColor?: string;
  subtextColor?: string;
}

export const DiamondLogo: React.FC<DiamondLogoProps> = ({
  size = 36,
  showText = false,
  textColor = '#0f172a',
  subtextColor = '#64748b',
}) => {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, userSelect: 'none' }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: Math.max(8, Math.round(size * 0.25)),
          background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #4f46e5 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.4)',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {/* Subtle background ambient sheen */}
        <div
          style={{
            position: 'absolute',
            top: -size * 0.5,
            left: -size * 0.5,
            width: size * 2,
            height: size * 2,
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.45) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />

        {/* Diamond SVG Icon */}
        <svg
          width={Math.round(size * 0.72)}
          height={Math.round(size * 0.72)}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="dia-top" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="dia-left" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7dd3fc" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
            <linearGradient id="dia-right" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <linearGradient id="dia-center-pav" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e0f2fe" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
            <linearGradient id="dia-left-pav" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
            <linearGradient id="dia-right-pav" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0369a1" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>
          </defs>

          {/* Crown Left */}
          <polygon points="6,18 16,8 11,18" fill="url(#dia-left)" />
          {/* Crown Center-Left */}
          <polygon points="16,8 24,8 24,18 11,18" fill="url(#dia-top)" />
          {/* Crown Center-Right */}
          <polygon points="24,8 32,8 37,18 24,18" fill="url(#dia-top)" />
          {/* Crown Right */}
          <polygon points="32,8 42,18 37,18" fill="url(#dia-right)" />

          {/* Table facet shine */}
          <polygon points="19,10 29,10 32,15 16,15" fill="#ffffff" fillOpacity="0.8" />

          {/* Pavilion Center Triangle */}
          <polygon points="11,18 37,18 24,42" fill="url(#dia-center-pav)" />
          {/* Pavilion Inner Reflection */}
          <polygon points="17,18 31,18 24,36" fill="#ffffff" fillOpacity="0.4" />
          {/* Pavilion Left */}
          <polygon points="6,18 11,18 24,42" fill="url(#dia-left-pav)" />
          {/* Pavilion Right */}
          <polygon points="37,18 42,18 24,42" fill="url(#dia-right-pav)" />

          {/* Sparkling glint */}
          <path
            d="M36,9 L37,12 L40,13 L37,14 L36,17 L35,14 L32,13 L35,12 Z"
            fill="#ffffff"
          />
        </svg>
      </div>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
          <span
            style={{
              fontSize: Math.round(size * 0.44),
              fontWeight: 700,
              color: textColor,
              letterSpacing: '-0.2px',
              fontFamily: "'Inter', -apple-system, sans-serif",
            }}
          >
            Công ty HRM
          </span>
          <span
            style={{
              fontSize: Math.max(10, Math.round(size * 0.3)),
              color: subtextColor,
              fontWeight: 500,
              letterSpacing: '0.1px',
            }}
          >
            Phần mềm quản lý nhân sự
          </span>
        </div>
      )}
    </div>
  );
};

export default DiamondLogo;

