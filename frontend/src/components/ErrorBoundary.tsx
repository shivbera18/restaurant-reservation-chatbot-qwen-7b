import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen neo-grid-bg flex items-center justify-center p-4 text-black dark:text-gray-100 font-sans">
          <div className="bg-white dark:bg-neo-surface border-3 border-black dark:border-gray-600 rounded-neo p-6 shadow-neo-lg dark:shadow-neo-dark max-w-md w-full text-left space-y-4">
            <div className="flex items-center gap-2 bg-red-100 border-2 border-red-500 p-2.5 text-red-800 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Rendering Encountered an Error</span>
            </div>

            <p className="text-xs text-black dark:text-gray-300 font-mono break-words bg-neo-canvas dark:bg-neo-surface-alt p-2.5 border border-black dark:border-gray-600/30">
              {this.state.error?.message || 'Unknown UI runtime error'}
            </p>

            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="btn-neo bg-neo-yellow px-4 py-2 text-xs font-black uppercase w-full flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
