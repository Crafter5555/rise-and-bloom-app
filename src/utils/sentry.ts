import * as Sentry from '@sentry/react';
import { Capacitor } from '@capacitor/core';

// Initialize Sentry for crash reporting and performance monitoring
export const initSentry = () => {
  const isNative = Capacitor.isNativePlatform();
  const environment = process.env.NODE_ENV || 'development';
  
  Sentry.init({
    dsn: 'https://a19aed3b8a857cd63a3fd072e780e1b9@o4509622135685120.ingest.de.sentry.io/4509622152986704', // Replace with actual DSN
    environment,
    enabled: environment === 'production',
    
    // Performance monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    
    // Filter out non-critical errors
    beforeSend(event, hint) {
      // Don't send events in development unless explicitly enabled
      if (environment === 'development') {
        console.warn('Sentry event (dev mode):', event, hint);
        return null;
      }
      
      // Filter out known non-critical errors
      const error = hint.originalException;
      if (error && typeof error === 'object' && 'message' in error) {
        const message = error.message as string;
        
        // Skip network-related errors that are expected
        if (message.includes('NetworkError') || message.includes('Failed to fetch')) {
          return null;
        }
        
        // Skip React dev tools related errors
        if (message.includes('__REACT_DEVTOOLS_GLOBAL_HOOK__')) {
          return null;
        }
      }
      
      return event;
    },
    
    // Add user context (non-PII)
    initialScope: {
      tags: {
        platform: isNative ? Capacitor.getPlatform() : 'web',
        component: 'rise-and-bloom-app'
      }
    }
  });
};

// Helper function to add user context after authentication
export const setSentryUser = (userId: string, email?: string) => {
  Sentry.setUser({
    id: userId,
    email: email ? email.split('@')[0] + '@***' : undefined, // Obfuscate email for privacy
  });
};

// Helper function to add breadcrumbs for user actions
export const addSentryBreadcrumb = (message: string, category: string, data?: any) => {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
    timestamp: Date.now() / 1000,
  });
};

// Helper function to capture custom errors with context
export const captureException = (error: Error, context?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    if (context) {
      Object.keys(context).forEach(key => {
        scope.setExtra(key, context[key]);
      });
    }
    Sentry.captureException(error);
  });
};

// Performance monitoring helpers - simplified for compatibility
export const startTransaction = (name: string, operation: string) => {
  // Simplified transaction tracking
  console.log(`Starting transaction: ${name} (${operation})`);
  return {
    name,
    operation,
    setData: (key: string, value: any) => {
      console.log(`Transaction data: ${key}=`, value);
    },
    finish: () => {
      console.log(`Finished transaction: ${name}`);
    }
  };
};

export const setTransactionData = (transaction: any, data: Record<string, any>) => {
  Object.keys(data).forEach(key => {
    transaction.setData(key, data[key]);
  });
};