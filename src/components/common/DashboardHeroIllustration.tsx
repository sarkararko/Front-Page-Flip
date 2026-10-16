import React from 'react';

export const DashboardHeroIllustration: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative w-[280px] h-[190px] select-none ${className}`}>
      <svg
        viewBox="0 0 340 230"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        <defs>
          <linearGradient id="heroNavyBook" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#1C3F7A" />
            <stop offset="1" stopColor="#102A56" />
          </linearGradient>
          <linearGradient id="heroBlueBook" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#2582FF" />
            <stop offset="1" stopColor="#1677FF" />
          </linearGradient>
          <linearGradient id="heroTealBook" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#1CD7C3" />
            <stop offset="1" stopColor="#0DB7A5" />
          </linearGradient>
          <linearGradient id="penCupGrad" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#1A3B72" />
            <stop offset="1" stopColor="#102A56" />
          </linearGradient>
          <filter id="heroDropShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#102A56" floodOpacity="0.14" />
          </filter>
        </defs>

        {/* Soft background ambient glow */}
        <ellipse cx="170" cy="200" rx="140" ry="18" fill="#BAE6FD" opacity="0.4" />

        {/* Tropical / study foliage leaves in background */}
        <g opacity="0.85">
          <path d="M290 140 C310 90 320 60 300 40 C280 60 270 100 290 140 Z" fill="#34D399" />
          <path d="M285 145 C265 105 245 80 235 65 C250 85 270 120 285 145 Z" fill="#10B981" />
          <path d="M295 150 C315 125 330 110 338 102 C325 120 308 140 295 150 Z" fill="#059669" />
        </g>

        {/* --- 3D BOOK STACK --- */}
        {/* Book 1 (Bottom - Navy) */}
        <g filter="url(#heroDropShadow)">
          {/* Top face */}
          <path d="M35 185 L185 155 L215 170 L65 200 Z" fill="#24488A" />
          {/* Spine / Front */}
          <path d="M35 185 L65 200 L65 224 L35 209 Z" fill="url(#heroNavyBook)" />
          {/* Page edge */}
          <path d="M65 200 L215 170 L215 194 L65 224 Z" fill="#F8FAFC" />
          <line x1="70" y1="206" x2="210" y2="178" stroke="#E2E8F0" strokeWidth="1" />
          <line x1="70" y1="212" x2="210" y2="184" stroke="#E2E8F0" strokeWidth="1" />
          <line x1="70" y1="218" x2="210" y2="190" stroke="#E2E8F0" strokeWidth="1" />
        </g>

        {/* Book 2 (Middle - Vibrant Blue) */}
        <g filter="url(#heroDropShadow)">
          <path d="M42 162 L180 134 L208 148 L70 176 Z" fill="#3B82F6" />
          <path d="M42 162 L70 176 L70 196 L42 182 Z" fill="url(#heroBlueBook)" />
          <path d="M70 176 L208 148 L208 168 L70 196 Z" fill="#FFFFFF" />
          <line x1="74" y1="181" x2="204" y2="155" stroke="#E2E8F0" strokeWidth="1" />
          <line x1="74" y1="187" x2="204" y2="161" stroke="#E2E8F0" strokeWidth="1" />
        </g>

        {/* Book 3 (Top - Teal) */}
        <g filter="url(#heroDropShadow)">
          <path d="M52 140 L174 116 L198 128 L76 152 Z" fill="#2DD4BF" />
          <path d="M52 140 L76 152 L76 170 L52 158 Z" fill="url(#heroTealBook)" />
          <path d="M76 152 L198 128 L198 146 L76 170 Z" fill="#F8FAFC" />
          <line x1="80" y1="157" x2="194" y2="134" stroke="#E2E8F0" strokeWidth="1" />
          <line x1="80" y1="163" x2="194" y2="140" stroke="#E2E8F0" strokeWidth="1" />
        </g>

        {/* --- PENCIL HOLDER CUP & STATIONERY (RIGHT) --- */}
        <g filter="url(#heroDropShadow)">
          {/* Pencils protruding out */}
          {/* Yellow Pencil */}
          <rect x="238" y="70" width="8" height="65" rx="1.5" fill="#F59E0B" transform="rotate(-12 238 70)" />
          <polygon points="238,70 242,58 246,70" fill="#FDE68A" transform="rotate(-12 238 70)" />
          <polygon points="240,62 242,58 244,62" fill="#1E293B" transform="rotate(-12 238 70)" />

          {/* Red Pen */}
          <rect x="252" y="65" width="7" height="70" rx="1.5" fill="#EF4444" transform="rotate(4 252 65)" />
          <rect x="252" y="62" width="7" height="6" rx="1" fill="#DC2626" transform="rotate(4 252 65)" />

          {/* Cyan/Teal Stylus */}
          <rect x="264" y="72" width="7" height="60" rx="1.5" fill="#0DB7A5" transform="rotate(15 264 72)" />
          <circle cx="270" cy="73" r="3" fill="#00D2B4" transform="rotate(15 264 72)" />

          {/* Ruler */}
          <rect x="246" y="80" width="10" height="55" rx="1" fill="#93C5FD" opacity="0.8" transform="rotate(-5 246 80)" />

          {/* Pencil Cup Body */}
          <ellipse cx="258" cy="135" rx="26" ry="7" fill="#1C3F7A" />
          <path d="M232 135 L238 198 C238 202 242 205 258 205 C274 205 278 202 278 198 L284 135 Z" fill="url(#penCupGrad)" />
          <ellipse cx="258" cy="135" rx="25" ry="6" fill="#0F2448" />
        </g>
      </svg>
    </div>
  );
};
