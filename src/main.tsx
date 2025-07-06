import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initSentry } from './utils/sentry'

// Initialize Sentry for crash reporting
initSentry();

createRoot(document.getElementById("root")!).render(<App />);