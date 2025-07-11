import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<{}, ErrorBoundaryState> {
  constructor(props: {}) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ hasError: true, error, errorInfo });
    // Optionally log error to an external service here
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fff" }}>
          <h1 style={{ color: "#d32f2f" }}>Something went wrong.</h1>
          <p>We're sorry, but an unexpected error occurred.</p>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <pre style={{ color: "#b71c1c", background: "#f8d7da", padding: 16, borderRadius: 8, maxWidth: 600, overflow: "auto" }}>
              {this.state.error.toString()}
              {this.state.errorInfo && <div>{this.state.errorInfo.componentStack}</div>}
            </pre>
          )}
          <button onClick={this.handleReload} style={{ marginTop: 24, padding: "8px 24px", fontSize: 16, background: "#1976d2", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
} 