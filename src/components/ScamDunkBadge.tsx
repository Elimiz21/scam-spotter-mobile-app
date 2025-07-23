import React from 'react';

interface ScamDunkBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon-only';
}

export const ScamDunkBadge: React.FC<ScamDunkBadgeProps> = ({ 
  size = 'md', 
  variant = 'full' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5', 
    lg: 'h-6 w-6'
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
          src="/lovable-uploads/5bf11401-0fb6-490a-8997-44ae038d51cd.png" 
          alt="Scam Dunk"
          className={`${sizeClasses[size]} object-contain rounded-lg`}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <img 
        src="/lovable-uploads/5bf11401-0fb6-490a-8997-44ae038d51cd.png" 
        alt="Scam Dunk"
        className={`${sizeClasses[size]} object-contain rounded-lg`}
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