import React from 'react';

interface DashboardHeroIllustrationProps {
  className?: string;
}

export const DashboardHeroIllustration: React.FC<DashboardHeroIllustrationProps> = ({
  className = '',
}) => {
  return (
    <svg
      viewBox="0 0 540 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full select-none ${className}`}
      role="img"
      aria-label="Illustration of 3D stacked books, stationery pencil stand, and decorative study foliage"
    >
      <defs>
        {/* Soft ground ambient shadow */}
        <radialGradient id="groundShadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0F3875" stopOpacity="0.22" />
          <stop offset="55%" stopColor="#3B82F6" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </radialGradient>

        {/* Ambient background aura */}
        <radialGradient id="ambientAura" cx="60%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#A5E7DC" stopOpacity="0.45" />
          <stop offset="60%" stopColor="#BAE6FD" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#E0F2FE" stopOpacity="0" />
        </radialGradient>

        {/* Foliage Gradients */}
        <linearGradient id="leafTeal1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2DD4BF" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>
        <linearGradient id="leafTeal2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5EEAD4" />
          <stop offset="100%" stopColor="#14B8A6" />
        </linearGradient>
        <linearGradient id="leafAqua" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>

        {/* Book 1 (Bottom): Deep Sapphire / Navy */}
        <linearGradient id="book1Top" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2A52BE" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>
        <linearGradient id="book1Spine" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="50%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#172554" />
        </linearGradient>
        <linearGradient id="book1Pages" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="85%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>

        {/* Book 2 (Middle): Royal Electric Blue */}
        <linearGradient id="book2Top" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="book2Spine" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="50%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1E40AF" />
        </linearGradient>
        <linearGradient id="book2Pages" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="85%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>

        {/* Book 3 (Top): Mint Teal Brand */}
        <linearGradient id="book3Top" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2DD4BF" />
          <stop offset="60%" stopColor="#14B8A6" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>
        <linearGradient id="book3Spine" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#5EEAD4" />
          <stop offset="50%" stopColor="#14B8A6" />
          <stop offset="100%" stopColor="#0F766E" />
        </linearGradient>
        <linearGradient id="book3Pages" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="85%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#CCFBF1" />
        </linearGradient>

        {/* Book Inter-layer Shadows */}
        <linearGradient id="dropShadowDark" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#091E42" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#091E42" stopOpacity="0" />
        </linearGradient>

        {/* Pencil Stand Cup */}
        <linearGradient id="pencilCupBody" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="35%" stopColor="#2563EB" />
          <stop offset="70%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>
        <linearGradient id="pencilCupRim" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="50%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>

        {/* Pencils */}
        <linearGradient id="pencilYellow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="pencilPurple" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="50%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#7E22CE" />
        </linearGradient>
        <linearGradient id="pencilOrange" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FB923C" />
          <stop offset="50%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
        <linearGradient id="pencilTeal" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2DD4BF" />
          <stop offset="50%" stopColor="#0D9488" />
          <stop offset="100%" stopColor="#115E59" />
        </linearGradient>
        <linearGradient id="pencilNavy" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id="woodTip" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="100%" stopColor="#FDE68A" />
        </linearGradient>

        {/* Crisp Shadow Filter */}
        <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0F2B5C" floodOpacity="0.12" />
        </filter>
      </defs>

      {/* ================= 1. BACKGROUND AMBIENT GLOW & FOLIAGE ================= */}
      {/* Soft background aura */}
      <circle cx="380" cy="180" r="140" fill="url(#ambientAura)" />
      <circle cx="460" cy="150" r="90" fill="url(#ambientAura)" />

      {/* Background Decorative Tropical / Educational Foliage */}
      <g opacity="0.95">
        {/* Far Right Aqua Leaf */}
        <path
          d="M485 240 C525 180 540 100 488 45 C442 85 450 170 485 240 Z"
          fill="url(#leafAqua)"
          opacity="0.85"
        />
        {/* Central Upright Teal Leaf */}
        <path
          d="M430 250 C465 170 475 75 425 25 C378 70 388 165 430 250 Z"
          fill="url(#leafTeal1)"
        />
        <path
          d="M430 250 C445 160 448 90 425 25"
          stroke="#5EEAD4"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.6"
        />
        {/* Left Spreading Mint Leaf */}
        <path
          d="M380 255 C345 190 320 120 365 75 C405 110 398 185 380 255 Z"
          fill="url(#leafTeal2)"
          opacity="0.9"
        />
        <path
          d="M380 255 C370 185 360 135 365 75"
          stroke="#99F6E4"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        />
        {/* Decorative Floating Aqua Leaflet */}
        <path
          d="M335 155 C310 135 305 110 325 95 C345 105 350 135 335 155 Z"
          fill="#38BDF8"
          opacity="0.65"
        />
      </g>

      {/* ================= 2. GROUND CONTACT SHADOWS ================= */}
      <ellipse cx="280" cy="312" rx="210" ry="24" fill="url(#groundShadow)" />
      <ellipse cx="440" cy="305" rx="55" ry="14" fill="url(#groundShadow)" />

      {/* ================= 3. 3D STACKED BOOKS ================= */}
      {/* ----------------- BOOK 1 (BOTTOM - DEEP NAVY / SAPPHIRE) ----------------- */}
      <g id="bottom-book" filter="url(#softGlow)">
        {/* Spine & Front Cover Thickness */}
        <path
          d="M75 255 C75 250 80 248 88 248 L320 248 C328 248 335 252 338 258 L338 296 C335 302 328 306 320 306 L88 306 C78 306 75 302 75 296 Z"
          fill="url(#book1Spine)"
        />
        {/* Subtle Spine Embossed Grooves */}
        <line x1="112" y1="250" x2="112" y2="304" stroke="#3B82F6" strokeWidth="2.5" opacity="0.6" />
        <line x1="118" y1="250" x2="118" y2="304" stroke="#1E3A8A" strokeWidth="1.5" opacity="0.8" />
        <line x1="300" y1="250" x2="300" y2="304" stroke="#3B82F6" strokeWidth="2.5" opacity="0.6" />
        <line x1="306" y1="250" x2="306" y2="304" stroke="#1E3A8A" strokeWidth="1.5" opacity="0.8" />
        {/* Front Cover Sheen Highlight */}
        <path
          d="M85 250 L325 250 L325 253 L85 253 Z"
          fill="#60A5FA"
          opacity="0.4"
        />

        {/* Right Page Block (Thickness) */}
        <path
          d="M338 258 L415 220 L415 258 L338 296 Z"
          fill="url(#book1Pages)"
        />
        {/* Book 1 Fine Page Texture Lines */}
        <line x1="344" y1="264" x2="410" y2="231" stroke="#E2E8F0" strokeWidth="1" />
        <line x1="344" y1="272" x2="410" y2="239" stroke="#E2E8F0" strokeWidth="1" />
        <line x1="344" y1="280" x2="410" y2="247" stroke="#E2E8F0" strokeWidth="1" />
        <line x1="344" y1="288" x2="410" y2="255" stroke="#E2E8F0" strokeWidth="1" />

        {/* Top Cover (Perspective Face) */}
        <path
          d="M88 248 L170 210 L415 220 L338 258 Z"
          fill="url(#book1Top)"
        />
        {/* Top Face Edge Bevel */}
        <path
          d="M88 248 L170 210 L174 211 L92 249 Z"
          fill="#60A5FA"
          opacity="0.5"
        />
      </g>

      {/* Shadow cast by Middle Book onto Bottom Book */}
      <path
        d="M92 248 L175 210 L370 217 L305 248 Z"
        fill="url(#dropShadowDark)"
        opacity="0.45"
      />

      {/* ----------------- BOOK 2 (MIDDLE - VIBRANT ROYAL BLUE) ----------------- */}
      <g id="middle-book" filter="url(#softGlow)">
        {/* Spine & Front Cover Thickness */}
        <path
          d="M82 205 C82 200 87 198 95 198 L315 198 C323 198 330 202 333 208 L333 245 C330 251 323 255 315 255 L95 255 C85 255 82 251 82 245 Z"
          fill="url(#book2Spine)"
        />
        {/* Spine Embossed Grooves */}
        <line x1="120" y1="200" x2="120" y2="253" stroke="#93C5FD" strokeWidth="2.5" opacity="0.6" />
        <line x1="126" y1="200" x2="126" y2="253" stroke="#1D4ED8" strokeWidth="1.5" opacity="0.8" />
        <line x1="292" y1="200" x2="292" y2="253" stroke="#93C5FD" strokeWidth="2.5" opacity="0.6" />
        <line x1="298" y1="200" x2="298" y2="253" stroke="#1D4ED8" strokeWidth="1.5" opacity="0.8" />
        {/* Front Cover Sheen Highlight */}
        <path
          d="M90 200 L322 200 L322 203 L90 203 Z"
          fill="#BFDBFE"
          opacity="0.5"
        />

        {/* Right Page Block */}
        <path
          d="M333 208 L405 174 L405 211 L333 245 Z"
          fill="url(#book2Pages)"
        />
        {/* Book 2 Fine Page Texture Lines */}
        <line x1="339" y1="214" x2="400" y2="184" stroke="#CBD5E1" strokeWidth="1" />
        <line x1="339" y1="222" x2="400" y2="192" stroke="#CBD5E1" strokeWidth="1" />
        <line x1="339" y1="230" x2="400" y2="200" stroke="#CBD5E1" strokeWidth="1" />
        <line x1="339" y1="238" x2="400" y2="208" stroke="#CBD5E1" strokeWidth="1" />

        {/* Top Cover (Perspective Face) */}
        <path
          d="M95 198 L172 162 L405 174 L333 208 Z"
          fill="url(#book2Top)"
        />
        {/* Top Face Edge Bevel */}
        <path
          d="M95 198 L172 162 L176 163 L99 199 Z"
          fill="#93C5FD"
          opacity="0.6"
        />
      </g>

      {/* Shadow cast by Top Book onto Middle Book */}
      <path
        d="M130 198 L195 165 L360 172 L300 198 Z"
        fill="url(#dropShadowDark)"
        opacity="0.5"
      />

      {/* ----------------- BOOK 3 (TOP - MINT TEAL BRAND) ----------------- */}
      <g id="top-book" filter="url(#softGlow)">
        {/* Spine & Front Cover Thickness */}
        <path
          d="M125 155 C125 150 130 148 138 148 L305 148 C313 148 320 152 323 158 L323 192 C320 198 313 202 305 202 L138 202 C128 202 125 198 125 192 Z"
          fill="url(#book3Spine)"
        />
        {/* Spine Embossed Grooves */}
        <line x1="158" y1="150" x2="158" y2="200" stroke="#99F6E4" strokeWidth="2.5" opacity="0.7" />
        <line x1="164" y1="150" x2="164" y2="200" stroke="#0F766E" strokeWidth="1.5" opacity="0.8" />
        <line x1="280" y1="150" x2="280" y2="200" stroke="#99F6E4" strokeWidth="2.5" opacity="0.7" />
        <line x1="286" y1="150" x2="286" y2="200" stroke="#0F766E" strokeWidth="1.5" opacity="0.8" />
        {/* Front Cover Sheen Highlight */}
        <path
          d="M132 150 L312 150 L312 153 L132 153 Z"
          fill="#CCFBF1"
          opacity="0.6"
        />

        {/* Right Page Block */}
        <path
          d="M323 158 L385 128 L385 162 L323 192 Z"
          fill="url(#book3Pages)"
        />
        {/* Book 3 Fine Page Texture Lines */}
        <line x1="329" y1="164" x2="380" y2="139" stroke="#99F6E4" strokeWidth="1" />
        <line x1="329" y1="172" x2="380" y2="147" stroke="#99F6E4" strokeWidth="1" />
        <line x1="329" y1="180" x2="380" y2="155" stroke="#99F6E4" strokeWidth="1" />

        {/* Top Cover (Perspective Face) */}
        <path
          d="M138 148 L205 116 L385 128 L323 158 Z"
          fill="url(#book3Top)"
        />
        {/* Top Face Edge Bevel */}
        <path
          d="M138 148 L205 116 L209 117 L142 149 Z"
          fill="#A7F3D0"
          opacity="0.75"
        />
      </g>

      {/* ================= 4. PENCIL CUP & COLORFUL STATIONERY ================= */}
      <g id="stationery-stand" filter="url(#softGlow)">
        {/* ---------------- PENCILS (REAR TO FRONT) ---------------- */}
        {/* 1. Deep Navy Pencil (Tilted Far Right) */}
        <g transform="rotate(18 450 160)">
          <rect x="444" y="90" width="12" height="110" rx="2" fill="url(#pencilNavy)" />
          {/* Wood Tip */}
          <polygon points="444,90 450,68 456,90" fill="url(#woodTip)" />
          {/* Graphite Lead Point */}
          <polygon points="447,78 450,68 453,78" fill="#0F172A" />
        </g>

        {/* 2. Teal / Cyan Pencil (Tilted Left) */}
        <g transform="rotate(-14 430 160)">
          <rect x="424" y="105" width="11" height="95" rx="2" fill="url(#pencilTeal)" />
          {/* Wood Tip */}
          <polygon points="424,105 429.5,84 435,105" fill="url(#woodTip)" />
          {/* Teal Lead Point */}
          <polygon points="427,93 429.5,84 432,93" fill="#042F2E" />
        </g>

        {/* 3. Purple Stylus / Pencil (Slight Left) */}
        <g transform="rotate(-4 436 150)">
          <rect x="431" y="95" width="12" height="105" rx="2" fill="url(#pencilPurple)" />
          {/* Wood Tip */}
          <polygon points="431,95 437,72 443,95" fill="url(#woodTip)" />
          {/* Purple Lead Point */}
          <polygon points="434,83 437,72 440,83" fill="#3B0764" />
        </g>

        {/* 4. Vivid Golden Yellow Pencil (Center Upright) */}
        <g transform="rotate(3 448 140)">
          <rect x="442" y="80" width="13" height="120" rx="2" fill="url(#pencilYellow)" />
          {/* Pencil Hexagon Facet Line */}
          <line x1="448.5" y1="80" x2="448.5" y2="200" stroke="#FDE68A" strokeWidth="1.5" opacity="0.6" />
          {/* Wood Tip */}
          <polygon points="442,80 448.5,55 455,80" fill="url(#woodTip)" />
          {/* Dark Graphite Lead Point */}
          <polygon points="445.5,66 448.5,55 451.5,66" fill="#18181B" />
        </g>

        {/* 5. Orange-Red Pencil (Slight Right) */}
        <g transform="rotate(11 454 150)">
          <rect x="448" y="92" width="12" height="110" rx="2" fill="url(#pencilOrange)" />
          {/* Wood Tip */}
          <polygon points="448,92 454,70 460,92" fill="url(#woodTip)" />
          {/* Orange Lead Point */}
          <polygon points="451,80 454,70 457,80" fill="#7C2D12" />
        </g>

        {/* ---------------- PENCIL CUP BODY ---------------- */}
        {/* Cup Inner Depth Ellipse */}
        <ellipse cx="445" cy="180" rx="36" ry="11" fill="#0F2448" />

        {/* Cup Outer Tapered Body */}
        <path
          d="M409 180 L418 290 C420 297 428 302 445 302 C462 302 470 297 472 290 L481 180 Z"
          fill="url(#pencilCupBody)"
        />
        {/* Cup Highlights & Reflections */}
        <path
          d="M418 184 L424 288 C426 292 431 294 438 294 L435 184 Z"
          fill="#60A5FA"
          opacity="0.3"
        />
        <line x1="422" y1="184" x2="428" y2="288" stroke="#93C5FD" strokeWidth="2.5" opacity="0.4" />

        {/* Cup Outer Rim Bevel */}
        <ellipse cx="445" cy="180" rx="36" ry="10.5" fill="none" stroke="url(#pencilCupRim)" strokeWidth="3" />
        <ellipse cx="445" cy="180" rx="36" ry="10" fill="none" stroke="#93C5FD" strokeWidth="1" opacity="0.6" />
      </g>
    </svg>
  );
};
