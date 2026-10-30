import React from 'react';

export const LoginIllustration: React.FC<{ className?: string }> = ({ className = 'max-w-[320px] h-[175px]' }) => {
  return (
    <div className={`relative w-full select-none ${className}`}>
      {/* Soft Ambient Shadow and Radial Glow */}
      <div className="absolute inset-x-8 bottom-2 h-14 bg-blue-300/25 blur-2xl rounded-full" />

      <svg
        viewBox="0 0 420 250"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        <defs>
          <linearGradient id="bookNavy" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#193B73" />
            <stop offset="1" stopColor="#0F2448" />
          </linearGradient>
          <linearGradient id="bookBlue" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#2582FF" />
            <stop offset="1" stopColor="#1677FF" />
          </linearGradient>
          <linearGradient id="bookTeal" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#14D1BE" />
            <stop offset="1" stopColor="#0DB7A5" />
          </linearGradient>
          <linearGradient id="tabletBezel" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#2A3852" />
            <stop offset="1" stopColor="#152238" />
          </linearGradient>
          <linearGradient id="plantLeafGrad" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#10B981" />
            <stop offset="1" stopColor="#059669" />
          </linearGradient>
          <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#0F2448" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Desk Surface Shadow Base */}
        <ellipse cx="210" cy="225" rx="170" ry="16" fill="#E2E8F0" opacity="0.7" />

        {/* --- BOOK STACK (LEFT) --- */}
        {/* Book 1 (Bottom Dark Navy) */}
        <g filter="url(#softShadow)">
          {/* Base Spine */}
          <rect x="40" y="195" width="130" height="22" rx="3" fill="url(#bookNavy)" />
          {/* Page edges */}
          <rect x="46" y="198" width="120" height="16" rx="2" fill="#F8FAFC" />
          <line x1="48" y1="202" x2="164" y2="202" stroke="#E2E8F0" strokeWidth="1" />
          <line x1="48" y1="206" x2="164" y2="206" stroke="#E2E8F0" strokeWidth="1" />
          <line x1="48" y1="210" x2="164" y2="210" stroke="#E2E8F0" strokeWidth="1" />
          {/* Cover edge */}
          <path d="M38 193 H170 V197 H38 Z" fill="#0D1E3A" />
        </g>

        {/* Book 2 (Middle Blue) */}
        <g filter="url(#softShadow)">
          <rect x="52" y="172" width="122" height="20" rx="3" fill="url(#bookBlue)" />
          <rect x="58" y="175" width="112" height="14" rx="2" fill="#FFFFFF" />
          <line x1="60" y1="179" x2="168" y2="179" stroke="#E2E8F0" strokeWidth="1" />
          <line x1="60" y1="183" x2="168" y2="183" stroke="#E2E8F0" strokeWidth="1" />
          <path d="M50 170 H174 V174 H50 Z" fill="#0B57D0" />
        </g>

        {/* Book 3 (Top Angled Notebook / Stand Cover) */}
        <g filter="url(#softShadow)">
          <path d="M72 152 L178 150 L174 168 L68 170 Z" fill="#3B5998" />
          <path d="M85 105 L165 145 L155 152 L75 112 Z" fill="#2E4878" opacity="0.8" />
        </g>

        {/* --- TABLET WITH NOTES & PDF BADGE (CENTER) --- */}
        <g filter="url(#softShadow)">
          {/* Tablet Stand / Back */}
          <rect x="145" y="130" width="70" height="70" rx="6" fill="#64748B" opacity="0.3" transform="skewX(-8)" />

          {/* Tablet Frame */}
          <rect
            x="125"
            y="70"
            width="125"
            height="140"
            rx="12"
            fill="url(#tabletBezel)"
            stroke="#475569"
            strokeWidth="3"
            transform="rotate(-4 187 140)"
          />

          {/* Tablet Screen */}
          <rect
            x="133"
            y="78"
            width="109"
            height="124"
            rx="8"
            fill="#FFFFFF"
            transform="rotate(-4 187 140)"
          />

          {/* Document Content on Tablet */}
          <g transform="rotate(-4 187 140)">
            {/* Header / Title line */}
            <rect x="142" y="88" width="55" height="6" rx="3" fill="#102A56" />
            <rect x="142" y="98" width="80" height="3" rx="1.5" fill="#94A3B8" />

            {/* Paragraph lines */}
            <rect x="142" y="108" width="90" height="3" rx="1.5" fill="#CBD5E1" />
            <rect x="142" y="115" width="85" height="3" rx="1.5" fill="#CBD5E1" />
            <rect x="142" y="122" width="78" height="3" rx="1.5" fill="#CBD5E1" />
            <rect x="142" y="129" width="88" height="3" rx="1.5" fill="#CBD5E1" />

            {/* Diagram / Code Block snippet */}
            <rect x="142" y="138" width="90" height="26" rx="4" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="1" />
            <line x1="148" y1="145" x2="200" y2="145" stroke="#0DB7A5" strokeWidth="2" strokeLinecap="round" />
            <line x1="148" y1="152" x2="185" y2="152" stroke="#1677FF" strokeWidth="2" strokeLinecap="round" />
            <line x1="148" y1="158" x2="215" y2="158" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />

            {/* Bottom mini notes */}
            <rect x="142" y="172" width="82" height="3" rx="1.5" fill="#CBD5E1" />
            <rect x="142" y="179" width="60" height="3" rx="1.5" fill="#CBD5E1" />
          </g>

          {/* RED "PDF" BADGE TAG ATTACHED */}
          <g transform="translate(130, 175) rotate(-6)">
            <rect x="0" y="0" width="38" height="26" rx="5" fill="#EF4444" />
            <path d="M0 0 H38 V4 H0 Z" fill="#DC2626" />
            <text x="7" y="18" fill="#FFFFFF" fontSize="13" fontWeight="800" fontFamily="sans-serif">
              PDF
            </text>
          </g>
        </g>

        {/* --- POTTED PLANT (RIGHT) --- */}
        <g filter="url(#softShadow)">
          {/* Ceramic Pot */}
          <path d="M305 178 L311 215 C312 218 314 220 318 220 H342 C346 220 348 218 349 215 L355 178 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
          <ellipse cx="330" cy="178" rx="25" ry="5" fill="#E2E8F0" />
          <ellipse cx="330" cy="178" rx="23" ry="4" fill="#78350F" opacity="0.6" />

          {/* Plant Leaves */}
          <path d="M330 176 C318 150 295 145 285 152 C295 168 316 174 330 176 Z" fill="url(#plantLeafGrad)" />
          <path d="M330 176 C326 142 334 122 346 115 C349 135 342 165 330 176 Z" fill="#10B981" />
          <path d="M330 176 C342 152 368 142 380 150 C372 168 350 174 330 176 Z" fill="#059669" />
          <path d="M330 176 C338 160 358 162 365 170 C356 176 342 176 330 176 Z" fill="#34D399" />
        </g>
      </svg>
    </div>
  );
};
