import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initSentry } from './utils/sentry'
import { ErrorBoundary } from './components/mobile/ErrorBoundary'

// Initialize Sentry for crash reporting
initSentry();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);