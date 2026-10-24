import React from 'react';

export const STATIC_FPF_LOGO_URL = 'https://res.cloudinary.com/fi4r80wz/image/upload/v1792743191/fpf_logo_ckadeh.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  showText?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  className = '',
  onClick,
}) => {
  const heightClass = {
    sm: 'h-10 sm:h-11',
    md: 'h-12 sm:h-14',
    lg: 'h-16 sm:h-20',
    xl: 'h-22 sm:h-28',
  }[size];

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <img
        src={STATIC_FPF_LOGO_URL}
        alt="Front-Page Flip"
        className={`${heightClass} w-auto object-contain transition-transform duration-200 hover:scale-105`}
        loading="eager"
      />
    </div>
  );
};
