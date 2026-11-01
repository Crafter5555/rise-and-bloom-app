import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ErrorBoundary } from './components/mobile/ErrorBoundary'
import { errorReporter } from './utils/sentry'

// Initialize error reporting
errorReporter.initialize({
  environment: import.meta.env.MODE || 'development'
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);