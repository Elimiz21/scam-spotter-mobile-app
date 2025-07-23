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
    sm: 'h-3 w-3',
    md: 'h-4 w-4', 
    lg: 'h-5 w-5'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
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
    <div className="flex items-center gap-2">
      <img 
        src={shieldLogo} 
        alt="Scam Dunk Shield"
        className={`${sizeClasses[size]} object-contain`}
      />
      {variant === 'full' && (
        <div className="flex flex-col">
          <span className={`font-bold text-foreground ${textSizes[size]}`}>
            Scam Dunk
          </span>
          {size !== 'sm' && (
            <span className="text-xs text-muted-foreground">
              Investment Protection
            </span>
          )}
        </div>
      )}
    </div>
  );
};