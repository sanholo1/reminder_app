import React from 'react';
import './LoadingOverlay.css';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  transparent?: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  isVisible, 
  message = "Ładowanie...", 
  transparent = false 
}) => {
  React.useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className={`loading-overlay ${transparent ? 'transparent' : ''}`}>
      <div className="loading-overlay-content">
        <div className="loading-overlay-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <p className="loading-overlay-message">{message}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
