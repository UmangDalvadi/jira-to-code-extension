import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, FileText } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        
        this.setState({
            error,
            errorInfo
        });

        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // Send error to VS Code extension for logging
        const vscode = (window as any).vscode;
        if (vscode) {
            vscode.postMessage({
                type: 'error',
                data: {
                    message: error.message,
                    stack: error.stack,
                    componentStack: errorInfo.componentStack,
                    timestamp: new Date().toISOString()
                }
            });
        }
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    };

    private handleReload = () => {
        window.location.reload();
    };

    private copyErrorDetails = () => {
        const errorDetails = {
            message: this.state.error?.message,
            stack: this.state.error?.stack,
            componentStack: this.state.errorInfo?.componentStack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
            .then(() => {
                // Could show a toast here if available
                console.log('Error details copied to clipboard');
            })
            .catch(err => {
                console.error('Failed to copy error details:', err);
            });
    };

    public render() {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-gray-800 rounded-lg border border-red-700/50 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className="text-red-400" size={24} />
                            <h2 className="text-lg font-semibold text-white">Something went wrong</h2>
                        </div>
                        
                        <p className="text-gray-300 mb-4">
                            An unexpected error occurred. This error has been logged and will be investigated.
                        </p>

                        {import.meta.env.DEV && this.state.error && (
                            <details className="mb-4">
                                <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300">
                                    Error Details
                                </summary>
                                <div className="mt-2 p-3 bg-gray-900 rounded border text-xs text-red-300 overflow-auto max-h-32">
                                    <div className="font-mono">
                                        <strong>Error:</strong> {this.state.error.message}
                                    </div>
                                    {this.state.error.stack && (
                                        <div className="mt-2 font-mono">
                                            <strong>Stack:</strong>
                                            <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                                        </div>
                                    )}
                                </div>
                            </details>
                        )}

                        <div className="flex flex-col sm:flex-row gap-2">
                            <button
                                onClick={this.handleRetry}
                                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                            >
                                <RefreshCw size={16} />
                                Try Again
                            </button>
                            
                            <button
                                onClick={this.handleReload}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded transition-colors"
                            >
                                Reload Page
                            </button>
                        </div>

                        {import.meta.env.DEV && (
                            <button
                                onClick={this.copyErrorDetails}
                                className="w-full mt-2 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded transition-colors text-sm"
                            >
                                <FileText size={14} />
                                Copy Error Details
                            </button>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<T extends {}>(
    Component: React.ComponentType<T>,
    fallback?: ReactNode,
    onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
    const WrappedComponent = (props: T) => (
        <ErrorBoundary fallback={fallback} onError={onError}>
            <Component {...props} />
        </ErrorBoundary>
    );
    
    WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
    
    return WrappedComponent;
}
