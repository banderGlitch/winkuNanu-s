'use client';

import { useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';

export const showToast = (message, type = 'error') => {
  if (type === 'success') {
    toast.success(message);
  } else if (type === 'error') {
    toast.error(message);
  } else {
    toast(message);
  }
};

export const ToastProvider = ({ children }) => {
  return (
    <>
      {children}
      <Toaster 
        position="top-right"
        toastOptions={{
          success: {
            duration: 3000,
            style: {
              background: '#4caf50',
              color: '#fff',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#f44336',
              color: '#fff',
            },
          },
        }}
      />
    </>
  );
};

// Hook for handling form errors
export const useFormErrors = (errors) => {
  useEffect(() => {
    // Only show error messages that are actual validation errors (not initial/default values)
    const errorMessages = Object.entries(errors)
      .filter(([key, value]) => Boolean(value) && value !== key) // Exclude cases where value equals key name
      .map(([_, value]) => value);
    
    if (errorMessages.length > 0) {
      showToast(errorMessages[0], 'error');
    }
  }, [errors]);
}; 