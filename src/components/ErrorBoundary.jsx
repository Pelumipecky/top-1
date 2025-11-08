import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });

        // Log error to your preferred error tracking service
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    maxWidth: '600px',
                    margin: '40px auto'
                }}>
                    <h2 style={{ color: '#e74c3c' }}>Something went wrong</h2>
                    <p>We&apos;re sorry for the inconvenience. Please try refreshing the page.</p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            background: '#3498db',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginTop: '20px'
                        }}
                    >
                        Refresh Page
                    </button>
                    {process.env.NODE_ENV === 'development' && (
                        <details style={{ 
                            marginTop: '20px',
                            textAlign: 'left',
                            whiteSpace: 'pre-wrap'
                        }}>
                            <summary>Error Details</summary>
                            <p style={{ color: '#e74c3c' }}>
                                {this.state.error && this.state.error.toString()}
                            </p>
                            <p style={{ color: '#666' }}>
                                Component Stack:
                                {this.state.errorInfo && this.state.errorInfo.componentStack}
                            </p>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}