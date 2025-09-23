import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import './NotificationToast.css';

interface NotificationToastProps {
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
  onClose?: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ 
  message, 
  type, 
  duration = 5000, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    if (isClosing) return; 
    
    setIsClosing(true);
    setIsVisible(false);
    
    setTimeout(() => {
      onClose?.();
    }, 300); 
  };

  return (
    <div className={`notification-toast notification-toast-${type} ${isVisible ? 'show' : 'hide'}`}>
      <div className="notification-toast-content">
        <span className="notification-toast-message">{message}</span>
        <button 
          className="notification-toast-close" 
          onClick={handleClose}
          aria-label={t('notifications.close')}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default NotificationToast;
