import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  showText?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showTagline = true,
  showText = true,
  className = '',
  onClick,
}) => {
  // Dimension scales
  const dimensions = {
    sm: { iconWidth: 32, iconHeight: 28, text: 'text-base', subtext: 'text-[9px]' },
    md: { iconWidth: 44, iconHeight: 38, text: 'text-xl', subtext: 'text-[11px]' },
    lg: { iconWidth: 64, iconHeight: 56, text: 'text-2xl', subtext: 'text-xs' },
    xl: { iconWidth: 84, iconHeight: 74, text: 'text-3xl', subtext: 'text-sm' },
  }[size];

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-3 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* High-Fidelity Vector Reproduction of Front-Page Flip Emblem */}
      <svg
        width={dimensions.iconWidth}
        height={dimensions.iconHeight}
        viewBox="0 0 200 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 hover:scale-105"
      >
        <defs>
          <linearGradient id="bluePageGrad" x1="40" y1="90" x2="100" y2="70" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0B57D0" />
            <stop offset="1" stopColor="#1677FF" />
          </linearGradient>
          <linearGradient id="tealPageGrad" x1="100" y1="70" x2="160" y2="90" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0DB7A5" />
            <stop offset="1" stopColor="#00D2B4" />
          </linearGradient>
          <linearGradient id="fStemGrad" x1="90" y1="10" x2="115" y2="80" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00C9B1" />
            <stop offset="1" stopColor="#0DB7A5" />
          </linearGradient>
        </defs>

        {/* Outer Dark Navy Book Spine Foundation */}
        <path
          d="M20 95 C 45 80, 85 95, 100 102 C 115 95, 155 80, 180 95 C 175 105, 140 92, 100 110 C 60 92, 25 105, 20 95 Z"
          fill="#102A56"
        />

        {/* Left Open Page Base (Navy border) */}
        <path
          d="M22 93 C 45 78, 85 92, 98 98 L 98 62 C 85 55, 45 42, 28 65 Z"
          fill="#102A56"
        />

        {/* Left Open Page Fill (Vibrant Blue #1677FF) */}
        <path
          d="M32 87 C 50 72, 85 85, 96 90 L 96 64 C 84 57, 50 48, 35 68 Z"
          fill="url(#bluePageGrad)"
        />

        {/* Right Open Page Base (Navy border) */}
        <path
          d="M178 93 C 155 78, 115 92, 102 98 L 102 62 C 115 55, 155 42, 172 65 Z"
          fill="#102A56"
        />

        {/* Right Open Page Fill (Vibrant Teal #0DB7A5) */}
        <path
          d="M168 87 C 150 72, 115 85, 104 90 L 104 64 C 116 57, 150 48, 165 68 Z"
          fill="url(#tealPageGrad)"
        />

        {/* Stylized 'F' rising from spine */}
        {/* 'F' Main Arch Stem (Teal) */}
        <path
          d="M98 92 C 92 68, 88 40, 95 24 C 100 12, 115 6, 128 10 C 130 11, 118 20, 110 32 C 104 42, 104 62, 101 92 Z"
          fill="url(#fStemGrad)"
        />

        {/* 'F' Middle Crossbar Wing (Blue) */}
        <path
          d="M100 48 C 108 42, 120 40, 126 44 C 120 54, 108 58, 100 60 Z"
          fill="#1677FF"
        />
      </svg>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col">
          <div className={`font-extrabold tracking-tight leading-none ${dimensions.text} flex items-center`}>
            <span className="text-[#102A56]">Front-Page</span>
            <span className="text-[#0DB7A5] ml-1.5">Flip</span>
          </div>
          {showTagline && (
            <div
              className={`font-semibold tracking-wider text-[#64748B] flex items-center gap-1.5 mt-1 ${dimensions.subtext}`}
            >
              <span>Notes</span>
              <span className="text-[#0DB7A5] font-bold">•</span>
              <span>Solutions</span>
              <span className="text-[#0DB7A5] font-bold">•</span>
              <span>Learn</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
