import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by Admin ErrorBoundary:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center bg-card rounded-2xl border border-border shadow-premium my-6">
          <div className="h-12 w-12 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Something Went Wrong</h2>
          <p className="text-sm text-muted-foreground max-w-md mt-2">
            An unexpected rendering exception occurred inside this admin dashboard module.
          </p>
          {this.state.error && (
            <pre className="mt-4 p-4 bg-accent/40 rounded-xl border border-border text-left font-mono text-xs text-destructive max-w-md overflow-x-auto max-h-32">
              {this.state.error.message || String(this.state.error)}
            </pre>
          )}
          <Button 
            className="mt-6 bg-primary hover:bg-primary/95 text-white flex gap-2"
            onClick={() => window.location.reload()}
          >
            Reload Admin Portal
          </Button>
        </div>
      );
    }

    return this.state.children;
  }
}
