'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext({});

const ToastTypes = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

const toastStyles = {
  [ToastTypes.SUCCESS]: {
    bg: 'bg-green-500',
    icon: CheckCircle,
    iconColor: 'text-white'
  },
  [ToastTypes.ERROR]: {
    bg: 'bg-red-500',
    icon: AlertCircle,
    iconColor: 'text-white'
  },
  [ToastTypes.WARNING]: {
    bg: 'bg-yellow-500',
    icon: AlertCircle,
    iconColor: 'text-white'
  },
  [ToastTypes.INFO]: {
    bg: 'bg-blue-500',
    icon: Info,
    iconColor: 'text-white'
  }
};

function Toast({ id, message, type, duration, onRemove }) {
  const style = toastStyles[type];
  const Icon = style.icon;

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onRemove(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onRemove]);

  return (
    <div className={`${style.bg} text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 min-w-[300px] max-w-[500px] transform transition-all duration-300 ease-in-out`}>
      <Icon className={`h-5 w-5 ${style.iconColor} flex-shrink-0`} />
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button
        onClick={() => onRemove(id)}
        className="flex-shrink-0 ml-2 opacity-70 hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const addToast = useCallback((message, type = ToastTypes.INFO, duration = 5000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);
    
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showConfirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setConfirmDialog({
        message,
        title: options.title || 'Confirm Action',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        variant: options.variant || 'default', // 'default', 'danger'
        onConfirm: () => {
          setConfirmDialog(null);
          resolve(true);
        },
        onCancel: () => {
          setConfirmDialog(null);
          resolve(false);
        }
      });
    });
  }, []);

  // Convenience methods
  const success = useCallback((message, duration = 5000) => {
    return addToast(message, ToastTypes.SUCCESS, duration);
  }, [addToast]);

  const error = useCallback((message, duration = 7000) => {
    return addToast(message, ToastTypes.ERROR, duration);
  }, [addToast]);

  const warning = useCallback((message, duration = 6000) => {
    return addToast(message, ToastTypes.WARNING, duration);
  }, [addToast]);

  const info = useCallback((message, duration = 5000) => {
    return addToast(message, ToastTypes.INFO, duration);
  }, [addToast]);

  const value = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info,
    showConfirm
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              id={toast.id}
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onRemove={removeToast}
            />
          </div>
        ))}
      </div>
      
      {/* Confirmation Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          message={confirmDialog.message}
          title={confirmDialog.title}
          confirmText={confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
          variant={confirmDialog.variant}
          onConfirm={confirmDialog.onConfirm}
          onCancel={confirmDialog.onCancel}
        />
      )}
    </ToastContext.Provider>
  );
}

function ConfirmDialog({ message, title, confirmText, cancelText, variant, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onCancel}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {title}
          </h3>
          <p className="text-gray-600 whitespace-pre-line mb-6">
            {message}
          </p>
          
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                variant === 'danger' 
                  ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export { ToastTypes };
