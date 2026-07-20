import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-brand-bg text-brand-dark">
          <div className="premium-card p-12 max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-2xl font-black uppercase tracking-tighter">System Disruption</h2>
              <p className="text-xs text-brand-muted font-medium uppercase tracking-widest leading-relaxed">
                The artisan operations framework encountered an unexpected state. This has been logged for review.
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-brand-dark text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <RefreshCw className="w-4 h-4" />
              Re-initialize Studio
            </button>
            <div className="pt-4 border-t border-brand-border">
              <p className="text-[10px] font-mono text-brand-muted truncate opacity-60">
                {this.state.error?.message}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
