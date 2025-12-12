import React from 'react';

export const AetherLogo: React.FC<{ size?: number; className?: string }> = ({ size = 32, className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 40 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="20" cy="20" r="18" stroke="url(#paint0_linear)" strokeWidth="1.5" strokeOpacity="0.5"/>
      <path d="M20 4V36" stroke="url(#paint1_linear)" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.3"/>
      <path d="M4 20H36" stroke="url(#paint2_linear)" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.3"/>
      <circle cx="20" cy="20" r="8" fill="url(#paint3_radial)"/>
      <circle cx="20" cy="20" r="12" stroke="url(#paint4_linear)" strokeWidth="1.5"/>
      <path d="M20 12L24 20L20 28L16 20L20 12Z" fill="white"/>
      <defs>
        <linearGradient id="paint0_linear" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22D3EE"/>
          <stop offset="1" stopColor="#A855F7"/>
        </linearGradient>
        <linearGradient id="paint1_linear" x1="20" y1="4" x2="20" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22D3EE" stopOpacity="0"/>
          <stop offset="0.5" stopColor="#22D3EE"/>
          <stop offset="1" stopColor="#22D3EE" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="paint2_linear" x1="4" y1="20" x2="36" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22D3EE" stopOpacity="0"/>
          <stop offset="0.5" stopColor="#22D3EE"/>
          <stop offset="1" stopColor="#22D3EE" stopOpacity="0"/>
        </linearGradient>
        <radialGradient id="paint3_radial" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(20 20) rotate(90) scale(8)">
          <stop stopColor="#06B6D4"/>
          <stop offset="1" stopColor="#3B82F6" stopOpacity="0.5"/>
        </radialGradient>
        <linearGradient id="paint4_linear" x1="8" y1="8" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" stopOpacity="0.5"/>
          <stop offset="1" stopColor="white" stopOpacity="0"/>
        </linearGradient>
      </defs>
    </svg>
  );
};