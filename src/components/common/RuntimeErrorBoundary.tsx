import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  enableReporting?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  isExpanded: boolean;
}

class RuntimeErrorBoundary extends Component<Props, State> {
  private errorCount: number = 0;
  private errorHistory: Array<{ error: Error; timestamp: number }> = [];

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorId: '',
    isExpanded: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.errorCount++;
    this.errorHistory.push({ error, timestamp: Date.now() });

    // Keep only last 10 errors to prevent memory issues
    if (this.errorHistory.length > 10) {
      this.errorHistory = this.errorHistory.slice(-10);
    }

    this.setState({
      error,
      errorInfo,
    });

    // Log error to console for development
    console.error('🚨 Runtime Error Caught:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorBoundary: 'RuntimeErrorBoundary',
      count: this.errorCount,
      timestamp: new Date().toISOString(),
    });

    // Report error if enabled
    if (this.props.enableReporting) {
      this.reportError(error, errorInfo);
    }
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Create error report
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        errorId: this.state.errorId,
        errorCount: this.errorCount,
        userId: this.getUserId(),
        sessionId: this.getSessionId(),
        deviceInfo: this.getDeviceInfo(),
      };

      // Store error locally for later reporting
      const errors = JSON.parse(localStorage.getItem('runtime_errors') || '[]');
      errors.push(errorReport);
      
      // Keep only last 50 errors
      if (errors.length > 50) {
        errors.splice(0, errors.length - 50);
      }
      
      localStorage.setItem('runtime_errors', JSON.stringify(errors));

      // Try to send error report to backend (optional)
      // await this.sendErrorReport(errorReport);
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  };

  private getUserId = (): string => {
    // Get user ID from auth context or localStorage
    try {
      const authData = JSON.parse(localStorage.getItem('auth_data') || '{}');
      return authData.user?.id || 'anonymous';
    } catch {
      return 'anonymous';
    }
  };

  private getSessionId = (): string => {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  };

  private getDeviceInfo = () => {
    return {
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      windowSize: `${window.innerWidth}x${window.innerHeight}`,
      devicePixelRatio: window.devicePixelRatio,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onlineStatus: navigator.onLine,
    };
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      isExpanded: false,
    });
  };

  private handleRefreshPage = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private toggleExpanded = () => {
    this.setState(prev => ({ isExpanded: !prev.isExpanded }));
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, errorId, isExpanded } = this.state;
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl mx-auto shadow-xl border-red-200 dark:border-red-800">
            <CardContent className="p-8">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Oops! Something went wrong
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  We encountered an unexpected error. Don't worry, we're tracking this issue.
                </p>
                <div className="text-sm text-gray-500 dark:text-gray-500 font-mono bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full inline-block">
                  Error ID: {errorId}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <Button
                  onClick={this.handleRetry}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleRefreshPage}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Page
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
              </div>

              {/* Error Details (Development/Debug Mode) */}
              {(isDevelopment || isExpanded) && (
                <Collapsible>
                  <CollapsibleTrigger
                    className="flex w-full items-center justify-between rounded-md bg-gray-100 dark:bg-gray-800 px-4 py-2 text-left hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    onClick={this.toggleExpanded}
                  >
                    <div className="flex items-center">
                      <Bug className="mr-2 h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        Technical Details
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 rounded-md bg-gray-900 dark:bg-gray-950 p-4">
                    <div className="space-y-4">
                      {error && (
                        <div>
                          <h4 className="text-red-400 font-semibold mb-2">Error Message:</h4>
                          <div className="text-red-300 font-mono text-sm bg-red-900/20 p-2 rounded">
                            {error.message}
                          </div>
                        </div>
                      )}

                      {error?.stack && (
                        <div>
                          <h4 className="text-yellow-400 font-semibold mb-2">Stack Trace:</h4>
                          <pre className="text-yellow-300 font-mono text-xs bg-yellow-900/20 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                            {error.stack}
                          </pre>
                        </div>
                      )}

                      {errorInfo?.componentStack && (
                        <div>
                          <h4 className="text-blue-400 font-semibold mb-2">Component Stack:</h4>
                          <pre className="text-blue-300 font-mono text-xs bg-blue-900/20 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                            {errorInfo.componentStack}
                          </pre>
                        </div>
                      )}

                      <div>
                        <h4 className="text-gray-400 font-semibold mb-2">Error Count:</h4>
                        <div className="text-gray-300 text-sm">
                          This session: {this.errorCount} errors
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Error Reporting Notice */}
              {this.props.enableReporting && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <Bug className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Error Reported
                      </h3>
                      <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                        <p>
                          This error has been automatically reported to our development team.
                          We'll work on fixing it as soon as possible.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Help Text */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  If this problem persists, please contact support with the error ID above.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  enableReporting: boolean = false
) {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <RuntimeErrorBoundary enableReporting={enableReporting}>
        <Component {...props} />
      </RuntimeErrorBoundary>
    );
  };
}

// Hook to get error history for debugging
export function useErrorHistory() {
  const getErrorHistory = () => {
    try {
      return JSON.parse(localStorage.getItem('runtime_errors') || '[]');
    } catch {
      return [];
    }
  };

  const clearErrorHistory = () => {
    localStorage.removeItem('runtime_errors');
  };

  return { getErrorHistory, clearErrorHistory };
}

// Component for displaying error history in development
export function ErrorHistoryDebugger() {
  const { getErrorHistory, clearErrorHistory } = useErrorHistory();
  const [errors, setErrors] = React.useState([]);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    setErrors(getErrorHistory());
  }, []);

  if (process.env.NODE_ENV !== 'development' || errors.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size="sm"
        className="bg-red-100 border-red-300 text-red-800 hover:bg-red-200"
      >
        <Bug className="mr-1 h-3 w-3" />
        {errors.length} Errors
      </Button>
      
      {isOpen && (
        <Card className="absolute bottom-full right-0 mb-2 w-96 max-h-80 overflow-y-auto">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-sm">Error History</h3>
              <Button
                onClick={() => {
                  clearErrorHistory();
                  setErrors([]);
                  setIsOpen(false);
                }}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                Clear
              </Button>
            </div>
            <div className="space-y-2">
              {errors.slice(-5).map((error: any, index: number) => (
                <div key={index} className="text-xs p-2 bg-red-50 rounded border">
                  <div className="font-mono text-red-800">{error.message}</div>
                  <div className="text-gray-600 mt-1">
                    {new Date(error.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default RuntimeErrorBoundary;
