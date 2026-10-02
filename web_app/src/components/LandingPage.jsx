import React from 'react';
import { 
  Gauge, 
  Layers, 
  TrendingUp, 
  ArrowRight, 
  Sparkles, 
  Smartphone,
  Database,
  LogIn
} from 'lucide-react';

export function LandingPage({ onOpenTrack, onGoogleSignIn, user }) {
  return (
    <div className="landing-page-container">
      {/* Hero Section */}
      <section className="landing-hero">
        {/* App Icon Branding */}
        <img 
          src="./icon.png" 
          alt="FuelTracker Icon" 
          className="hero-logo-large" 
        />

        <div className="hero-pill">
          <Sparkles size={14} />
          Precision Telemetry
        </div>

        <h1 className="hero-title">
          The Ultimate <span className="gradient-text">Fuel Tracker</span>
        </h1>

        <p className="hero-subtitle">
          Track your vehicle fleet with authentic <strong>Previous Fill-Up</strong> physics. 
          Real-time mileage, cost analysis, and cross-device Google Cloud synchronization.
        </p>

        {/* CTA Group: Only show 'Open Track' when signed in */}
        <div className="hero-cta-group">
          {user ? (
            <button 
              className="btn btn-primary" 
              onClick={onOpenTrack} 
              style={{ padding: '12px 28px', fontSize: '1rem' }}
            >
              <span>Open Track</span>
              <ArrowRight size={18} />
            </button>
          ) : (
            <button 
              className="btn btn-primary" 
              onClick={onGoogleSignIn} 
              style={{ padding: '12px 28px', fontSize: '1rem' }}
            >
              <LogIn size={18} />
              <span>Sign in with Google to Start</span>
            </button>
          )}
        </div>
      </section>

      {/* Simplified Core Feature Cards */}
      <section style={{ marginBottom: '60px' }}>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper" style={{ background: 'linear-gradient(135deg, #52c41a, #389e0d)' }}>
              <Gauge size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '6px' }}>Previous Fill-Up Method</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.5' }}>
              Calculates trip mileage by dividing distance traveled by the fuel volume consumed from the preceding refill.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper" style={{ background: 'linear-gradient(135deg, #faad14, #d48806)' }}>
              <Layers size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '6px' }}>Multi-Vehicle Garage</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.5' }}>
              Isolate timelines for motorcycles, scooters, passenger cars, and commercial vehicles with instant active switching.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper" style={{ background: 'linear-gradient(135deg, #fa8c16, #d4380d)' }}>
              <TrendingUp size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '6px' }}>Visual Telemetry & Trends</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.5' }}>
              High-contrast SVG charts tracking mileage curves, refill expenses, and pump price evolution over time.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper" style={{ background: 'linear-gradient(135deg, #1890ff, #096dd9)' }}>
              <Database size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '6px' }}>Google Auth & Cloud Firestore</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.5' }}>
              Authenticate with Google for instant cloud sync across desktop, tablet, and mobile, backed by Cloud Firestore.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper" style={{ background: 'linear-gradient(135deg, #722ed1, #531dab)' }}>
              <Smartphone size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '6px' }}>Android App Interoperability</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.5' }}>
              Export and import JSON backup files (<code>FuelTracker_AutoBackup.json</code>) directly compatible with the Android app.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
