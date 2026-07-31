import { Component } from 'react';
import { Link } from 'react-router-dom';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Something went wrong' };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error('[GemSpot ErrorBoundary]', error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '60vh',
            display: 'grid',
            placeItems: 'center',
            padding: '48px 20px',
            textAlign: 'center',
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                letterSpacing: '-0.04em',
                marginBottom: 8,
              }}
            >
              We hit a snag
            </h1>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 20 }}>
              {this.state.message}
            </p>
            <Link
              to="/explore"
              style={{
                display: 'inline-flex',
                padding: '12px 18px',
                borderRadius: 999,
                background: 'var(--color-text)',
                color: 'var(--color-text-inverse)',
                fontWeight: 700,
                textDecoration: 'none',
              }}
              onClick={() => this.setState({ hasError: false, message: '' })}
            >
              Back to explore
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
