import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
        
        // Log error to console for debugging
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        
        // You could also log to an error reporting service here
        // logErrorToService(error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                    <h3 className="text-lg font-semibold text-red-800 mb-2">
                        Something went wrong
                    </h3>
                    <p className="text-red-600 text-center mb-4 max-w-md">
                        {this.props.fallbackMessage || 
                         'An error occurred while rendering this component. Please try refreshing or contact support if the problem persists.'}
                    </p>
                    
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <details className="mb-4 p-3 bg-red-100 rounded border text-sm text-red-800 max-w-full overflow-auto">
                            <summary className="cursor-pointer font-medium">Error Details</summary>
                            <pre className="mt-2 whitespace-pre-wrap">
                                {this.state.error.toString()}
                                {this.state.errorInfo.componentStack}
                            </pre>
                        </details>
                    )}
                    
                    <div className="flex space-x-3">
                        <button
                            onClick={this.handleRetry}
                            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try Again
                        </button>
                        
                        {this.props.onReset && (
                            <button
                                onClick={this.props.onReset}
                                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary; 