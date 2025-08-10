import React from 'react';
import shieldLogo from '../assets/scamshield-logo.png';

interface ScamShieldBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon-only';
}

export const ScamShieldBadge: React.FC<ScamShieldBadgeProps> = ({ 
  size = 'md', 
  variant = 'full' 
}) => {
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl'
  };

  const containerSizes = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4'
  };

  if (variant === 'icon-only') {
    return (
      <div className="flex items-center justify-center">
        <img 
          src={shieldLogo} 
          alt="ScamShield Logo"
          className={`${sizeClasses[size]} object-contain`}
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center ${containerSizes[size]}`}>
      <img 
        src={shieldLogo} 
        alt="ScamShield Logo"
        className={`${sizeClasses[size]} object-contain`}
      />
      {variant === 'full' && (
        <span className={`font-bold text-foreground ${textSizes[size]} whitespace-nowrap`}>
          ScamShield Protection
        </span>
      )}
    </div>
  );
};