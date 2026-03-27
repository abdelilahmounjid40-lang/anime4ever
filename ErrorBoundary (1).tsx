import React, { ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  public render() {
    if (this.state.hasError) {
      let parsedError: any = null;
      try {
        if (this.state.error?.message) {
          parsedError = JSON.parse(this.state.error.message);
        }
      } catch (e) {
        // Not a JSON error message
      }

      return (
        <div className="min-h-screen bg-[#0f0f0f] text-white flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-red-500/30 p-8 rounded-xl max-w-2xl w-full shadow-2xl">
            <div className="flex items-center gap-4 mb-6 text-red-500">
              <AlertCircle className="w-10 h-10" />
              <h1 className="text-2xl font-bold">Something went wrong</h1>
            </div>
            
            <div className="bg-black/50 p-4 rounded-lg mb-6 overflow-x-auto">
              {parsedError ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-gray-400 text-sm block mb-1">Error Message:</span>
                    <p className="text-red-400 font-mono text-sm">{parsedError.error}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-400 text-sm block mb-1">Operation:</span>
                      <p className="text-white font-mono text-sm">{parsedError.operationType}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm block mb-1">Path:</span>
                      <p className="text-white font-mono text-sm">{parsedError.path || 'N/A'}</p>
                    </div>
                  </div>
                  {parsedError.authInfo && (
                    <div>
                      <span className="text-gray-400 text-sm block mb-1">User Info:</span>
                      <p className="text-white font-mono text-sm">
                        {parsedError.authInfo.email || 'Not logged in'} 
                        {parsedError.authInfo.userId ? ` (${parsedError.authInfo.userId})` : ''}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-red-400 font-mono text-sm">
                  {this.state.error?.message || 'An unexpected error occurred.'}
                </p>
              )}
            </div>

            <button
              className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-md font-medium transition-colors"
              onClick={() => window.location.href = '/'}
            >
              Return to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
