import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';

import { AppRouter } from './routes';

import QueryProvider from './providers/QueryProvider';
import { AuthProvider } from './providers/AuthProvider';
import ThemeProvider from './providers/ThemeProvider';

import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <QueryProvider>
          <AppRouter />
          <Toaster position="top-right" />
        </QueryProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);