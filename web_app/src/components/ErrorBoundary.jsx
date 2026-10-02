import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('FuelTracker Error Boundary Caught:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.removeItem('fueltracker_active_vehicle_id');
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0d1117',
          color: '#f0f6fc',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '460px',
            background: '#161b22',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '32px 24px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)'
          }}>
            <img 
              src="./icon.png" 
              alt="FuelTracker" 
              style={{ width: '64px', height: '64px', borderRadius: '14px', marginBottom: '16px' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px 0', color: '#52c41a' }}>
              FuelTracker
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#8b949e', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Something unexpected happened while initializing the application interface.
            </p>
            <div style={{
              background: 'rgba(255, 77, 79, 0.1)',
              border: '1px solid rgba(255, 77, 79, 0.3)',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '0.8rem',
              color: '#ff7875',
              fontFamily: 'monospace',
              textAlign: 'left',
              marginBottom: '20px',
              overflowX: 'auto'
            }}>
              {this.state.error?.message || 'Unknown runtime error'}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button 
                onClick={this.handleReload}
                style={{
                  background: '#52c41a',
                  color: '#0d1117',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 18px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Reload App
              </button>
              <button 
                onClick={this.handleReset}
                style={{
                  background: 'transparent',
                  color: '#c9d1d9',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  padding: '10px 18px',
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Reset Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
