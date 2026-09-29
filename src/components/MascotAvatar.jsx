import React from 'react';
import './MascotAvatar.css';

export default function MascotAvatar({ isPasswordFocused, isShowPassword, emailLength = 0, isSubmitting = false }) {
  // Calculate eye position based on email length (range from -8px to +8px)
  const eyeOffset = Math.min(Math.max((emailLength - 10) * 0.7, -7), 7);

  return (
    <div className="mascot-wrapper">
      <div className={`mascot-avatar ${isPasswordFocused ? 'covering' : ''} ${isShowPassword ? 'peeking' : ''} ${isSubmitting ? 'submitting' : ''}`}>
        <svg viewBox="0 0 160 140" className="mascot-svg">
          {/* Shadow */}
          <ellipse cx="80" cy="132" rx="55" ry="8" fill="rgba(0, 0, 0, 0.07)" />

          {/* Bear Ears */}
          <circle cx="34" cy="38" r="18" fill="#4d0e0e" />
          <circle cx="34" cy="38" r="10" fill="#7B1C1C" />
          <circle cx="126" cy="38" r="18" fill="#4d0e0e" />
          <circle cx="126" cy="38" r="10" fill="#7B1C1C" />

          {/* Head */}
          <ellipse cx="80" cy="72" rx="56" ry="48" fill="#7B1C1C" />
          
          {/* Face Cream Patch */}
          <ellipse cx="80" cy="76" rx="44" ry="36" fill="#FFF8F5" />

          {/* Muzzle */}
          <ellipse cx="80" cy="85" rx="16" ry="12" fill="#FFEAE0" />
          {/* Nose */}
          <path d="M 73 80 Q 80 76 87 80 Q 80 87 73 80 Z" fill="#360a0a" />
          {/* Smile */}
          <path d="M 74 89 Q 80 94 86 89" fill="none" stroke="#360a0a" strokeWidth="2.5" strokeLinecap="round" />

          {/* Cheeks */}
          <ellipse cx="50" cy="85" rx="7" ry="4" fill="#FFAAAA" opacity="0.6" />
          <ellipse cx="110" cy="85" rx="7" ry="4" fill="#FFAAAA" opacity="0.6" />

          {/* Eyes Group (Follows email input) */}
          <g className="mascot-eyes" style={{ transform: `translateX(${isPasswordFocused ? 0 : eyeOffset}px)` }}>
            {/* Left Eye */}
            <circle cx="56" cy="65" r="7.5" fill="#250505" />
            <circle cx="54" cy="62" r="2.8" fill="#FFFFFF" />
            <circle cx="58" cy="66" r="1.3" fill="#FFFFFF" />

            {/* Right Eye */}
            <circle cx="104" cy="65" r="7.5" fill="#250505" />
            <circle cx="102" cy="62" r="2.8" fill="#FFFFFF" />
            <circle cx="106" cy="66" r="1.3" fill="#FFFFFF" />
          </g>

          {/* Hands / Paws covering eyes */}
          <g className="mascot-paws">
            {/* Left Paw */}
            <g className="paw left-paw">
              <ellipse cx="44" cy="116" rx="17" ry="15" fill="#5c1212" stroke="#3d0b0b" strokeWidth="1" />
              <ellipse cx="44" cy="114" rx="10" ry="8" fill="#FFEAE0" />
            </g>

            {/* Right Paw */}
            <g className="paw right-paw">
              <ellipse cx="116" cy="116" rx="17" ry="15" fill="#5c1212" stroke="#3d0b0b" strokeWidth="1" />
              <ellipse cx="116" cy="114" rx="10" ry="8" fill="#FFEAE0" />
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}
