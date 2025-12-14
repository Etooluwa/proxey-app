import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-10 text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong.</h1>
                    <p className="mb-4 text-gray-600">Please try refreshing the page.</p>
                    <details className="text-left bg-gray-100 p-4 rounded text-xs font-mono overflow-auto max-w-2xl mx-auto">
                        <summary className="cursor-pointer font-bold mb-2">Error Details</summary>
                        {this.state.error && this.state.error.toString()}
                        <br />
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </details>
                    <button
                        onClick={() => {
                            localStorage.clear();
                            window.location.href = '/';
                        }}
                        className="mt-6 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
                    >
                        Clear Cache & Restart
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
