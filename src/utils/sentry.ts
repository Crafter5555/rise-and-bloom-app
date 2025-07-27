// Production-grade error reporting and monitoring
// This replaces the basic ErrorReporter with a more robust solution

interface ErrorContext {
  user?: {
    id: string;
    email?: string;
  };
  extra?: Record<string, any>;
  tags?: Record<string, string>;
  level?: 'error' | 'warning' | 'info' | 'debug';
}

interface CrashReport {
  id: string;
  timestamp: number;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  context?: ErrorContext;
  userAgent: string;
  url: string;
  userId?: string;
}

class ProductionErrorReporter {
  private static instance: ProductionErrorReporter;
  private reports: CrashReport[] = [];
  private maxReports = 100;
  private isInitialized = false;

  static getInstance(): ProductionErrorReporter {
    if (!ProductionErrorReporter.instance) {
      ProductionErrorReporter.instance = new ProductionErrorReporter();
    }
    return ProductionErrorReporter.instance;
  }

  initialize(config?: { userId?: string; environment?: string }) {
    if (this.isInitialized) return;

    // Set up global error handlers
    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message), {
        extra: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        { level: 'error' }
      );
    });

    this.isInitialized = true;
    console.log('Production Error Reporter initialized');
  }

  captureError(error: Error, context?: ErrorContext) {
    const report: CrashReport = {
      id: this.generateId(),
      timestamp: Date.now(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: context?.user?.id,
    };

    this.reports.push(report);
    
    // Keep only the most recent reports
    if (this.reports.length > this.maxReports) {
      this.reports = this.reports.slice(-this.maxReports);
    }

    // Store in localStorage for persistence
    this.persistReports();

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error captured:', report);
    }

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(report);
    }
  }

  captureMessage(message: string, level: 'error' | 'warning' | 'info' | 'debug' = 'info', context?: ErrorContext) {
    this.captureError(new Error(message), { ...context, level });
  }

  setUser(user: { id: string; email?: string }) {
    // Store user context for future error reports
    localStorage.setItem('error_reporter_user', JSON.stringify(user));
  }

  clearUser() {
    localStorage.removeItem('error_reporter_user');
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private persistReports() {
    try {
      const recentReports = this.reports.slice(-20); // Keep last 20 reports
      localStorage.setItem('error_reports', JSON.stringify(recentReports));
    } catch (error) {
      console.error('Failed to persist error reports:', error);
    }
  }

  private async sendToMonitoringService(report: CrashReport) {
    try {
      // In a real implementation, this would send to your monitoring service
      // For now, we'll use a simple endpoint or service
      
      // Example: Send to a simple logging endpoint
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
      }).catch(() => {
        // Silently fail if endpoint is not available
        console.warn('Failed to send error report to monitoring service');
      });
    } catch (error) {
      console.error('Error sending crash report:', error);
    }
  }

  getRecentReports(): CrashReport[] {
    return this.reports.slice(-10);
  }

  getReportCount(): number {
    return this.reports.length;
  }

  exportReports(): string {
    return JSON.stringify(this.reports, null, 2);
  }

  clearReports() {
    this.reports = [];
    localStorage.removeItem('error_reports');
  }
}

// Export singleton instance
export const errorReporter = ProductionErrorReporter.getInstance();

// Convenience functions
export const captureError = (error: Error, context?: ErrorContext) => {
  errorReporter.captureError(error, context);
};

export const captureMessage = (message: string, level?: 'error' | 'warning' | 'info' | 'debug', context?: ErrorContext) => {
  errorReporter.captureMessage(message, level, context);
};

export const setUser = (user: { id: string; email?: string }) => {
  errorReporter.setUser(user);
};

export const clearUser = () => {
  errorReporter.clearUser();
};

// Initialize on import
errorReporter.initialize();