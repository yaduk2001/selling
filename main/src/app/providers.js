// FILE: src/app/providers.js
'use client';

import { ThemeProvider } from 'next-themes';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { TimezoneProvider } from './context/TimezoneContext';

export function Providers({ children }) {
  return (
    <AuthProvider>
      <TimezoneProvider>
        <ToastProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            storageKey="sellinginfinity-theme"
            themes={["dark"]}
            forcedTheme="dark"
          >
            {children}
          </ThemeProvider>
        </ToastProvider>
      </TimezoneProvider>
    </AuthProvider>
  );
}
