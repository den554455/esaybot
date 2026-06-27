import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import * as Sentry from '@sentry/react';

const SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN || 'https://73a65d37db3ad1af4ff3ec6157a53966@o4511633106927616.ingest.de.sentry.io/4511633130520656';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </HelmetProvider>
  </React.StrictMode>
);

// Временно отключаем Service Worker
serviceWorkerRegistration.unregister();