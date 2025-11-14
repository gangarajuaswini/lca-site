'use client';
import { Toaster } from 'react-hot-toast';

export default function ToasterClient() {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        className: '',
        duration: 6000,
        style: {
          background: '#363636',
          color: '#fff',
          fontSize: '16px',
          fontWeight: '500',
          padding: '16px',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
          maxWidth: '500px',
        },
        success: {
          duration: 8000,
          style: { background: '#10B981', color: 'white' },
          iconTheme: { primary: 'white', secondary: '#10B981' },
        },
        error: {
          duration: 6000,
          style: { background: '#EF4444', color: 'white' },
          iconTheme: { primary: 'white', secondary: '#EF4444' },
        },
      }}
    />
  );
}
