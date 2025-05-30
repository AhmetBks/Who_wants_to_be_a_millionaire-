import React, { useEffect, useState } from 'react';

interface AlertProps {
  message: string;
  type: 'alert' | 'correct' | 'wrong' | 'joker' | 'win' | 'info';
  show: boolean;
  onClose?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
  showReconnect?: boolean;
  onReconnect?: () => void;
  reconnecting?: boolean;
}

const Alert: React.FC<AlertProps> = ({
  message,
  type,
  show,
  onClose,
  autoHide = true,
  autoHideDelay = 3000,
  showReconnect = false,
  onReconnect,
  reconnecting = false
}) => {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    setVisible(show);
    
    if (show && autoHide && !showReconnect) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, autoHideDelay);
      
      return () => clearTimeout(timer);
    }
  }, [show, autoHide, autoHideDelay, showReconnect, onClose]);

  if (!visible) return null;
  
  // Determine icon and style based on alert type
  let icon = '⚠️';
  let bgColor = 'bg-red-600';
  let textColor = 'text-white';
  
  switch (type) {
    case 'correct':
      icon = '✓';
      bgColor = 'bg-green-600';
      break;
    case 'win':
      icon = '🏆';
      bgColor = 'bg-yellow-500';
      break;
    case 'joker':
      icon = '🔍';
      bgColor = 'bg-purple-600';
      break;
    case 'wrong':
      icon = '✗';
      bgColor = 'bg-red-600';
      break;
    case 'info':
      icon = 'ℹ️';
      bgColor = 'bg-blue-600';
      break;
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className={`p-6 rounded-lg shadow-xl max-w-md w-full ${bgColor} ${textColor}`}>
        <div className="flex items-start">
          <div className="text-2xl mr-4">{icon}</div>
          <div className="flex-1">
            <p className="text-lg font-medium">{message}</p>
            
            {/* Reconnect button */}
            {showReconnect && onReconnect && (
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={onReconnect}
                  disabled={reconnecting}
                  className="bg-white text-gray-800 hover:bg-gray-100 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 text-black"
                >
                  {reconnecting ? 'Reconnecting...' : 'Reconnect'}
                </button>
              </div>
            )}
            
            {/* Close button - Fixed text color to be visible */}
            {!showReconnect && onClose && (
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={onClose}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 font-medium py-1 px-3 rounded text-black"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alert;