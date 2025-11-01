import { useEffect } from 'react';

export interface ToastProps {
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

export default function Toast({
  type,
  message,
  onClose,
  autoClose = true,
  duration = 2500,
}: ToastProps) {
  useEffect(() => {
    if (autoClose && type === 'success') {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, type, duration, onClose]);

  const bgColor = type === 'success'
    ? 'bg-green-500 dark:bg-green-600'
    : 'bg-red-500 dark:bg-red-600';

  const icon = type === 'success' ? (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ) : (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-4 min-w-[300px] max-w-md`}>
        <div className="flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1">
          <p className="font-medium">{message}</p>
        </div>
        {type === 'error' && (
          <button
            onClick={onClose}
            className="flex-shrink-0 ml-2 p-2 hover:bg-red-600 dark:hover:bg-red-700 rounded-full transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
