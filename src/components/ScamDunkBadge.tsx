import React from 'react';
import shieldLogo from '../assets/scam-dunk-shield.png';

interface ScamDunkBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon-only';
}

export const ScamDunkBadge: React.FC<ScamDunkBadgeProps> = ({ 
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
          alt="Scam Dunk Shield"
          className={`${sizeClasses[size]} object-contain`}
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center ${containerSizes[size]}`}>
      <img 
        src={shieldLogo} 
        alt="Scam Dunk Shield"
        className={`${sizeClasses[size]} object-contain`}
      />
      {variant === 'full' && (
        <div className="flex flex-col leading-tight">
          <span className={`font-bold text-foreground ${textSizes[size]}`}>
            Scam Dunk
          </span>
          {size !== 'sm' && (
            <span className="text-xs text-muted-foreground leading-none">
              Investment Protection
            </span>
          )}
        </div>
      )}
    </div>
  );
};