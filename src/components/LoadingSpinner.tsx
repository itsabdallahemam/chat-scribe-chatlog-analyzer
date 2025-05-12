import React from 'react';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 12, className = '' }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div 
        className={`animate-spin rounded-full border-t-2 border-b-2 border-app-blue`}
        style={{ height: `${size}px`, width: `${size}px` }}
      ></div>
    </div>
  );
};

export default LoadingSpinner;
