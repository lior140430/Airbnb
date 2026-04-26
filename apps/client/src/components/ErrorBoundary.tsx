import React, { Component, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div style={{ padding: '2rem', textAlign: 'center', direction: 'rtl' }}>
                    <h2>משהו השתבש</h2>
                    <p style={{ color: 'var(--text-muted)' }}>אנא נסו לרענן את הדף.</p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '1rem',
                            padding: '0.75rem 1.5rem',
                            background: 'var(--brand-joy)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: '1rem',
                        }}
                    >
                        רענון
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
