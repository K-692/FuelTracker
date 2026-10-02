import React from 'react';
import { 
  Sparkles, 
  LogIn
} from 'lucide-react';

export function LandingPage({ onGoogleSignIn, user, onOpenTrack }) {
  return (
    <div className="landing-page-container">
      {/* Hero Section */}
      <section className="landing-hero">
        {/* App Icon Branding - Centered */}
        <div className="hero-logo-wrapper">
          <img 
            src="./icon.png" 
            alt="FuelTracker Icon" 
            className="hero-logo-large" 
          />
        </div>

        <div className="hero-pill">
          <Sparkles size={14} />
          <span>PRECISION TELEMETRY</span>
        </div>

        <h1 className="hero-title">
          The Ultimate <span className="gradient-text">Fuel Tracker</span>
        </h1>

        <p className="hero-subtitle">
          Track your vehicle fleet with authentic <strong>Previous Fill-Up</strong> physics. 
          Real-time mileage, cost analysis, and cross-device Google Cloud synchronization.
        </p>

        {/* Call to action */}
        <div className="hero-cta-group">
          {user ? (
            <button 
              className="btn btn-primary" 
              onClick={onOpenTrack} 
              style={{ padding: '14px 32px', fontSize: '1.05rem' }}
            >
              <span>Open Track</span>
            </button>
          ) : (
            <button 
              className="btn btn-primary" 
              onClick={onGoogleSignIn} 
              style={{ padding: '14px 32px', fontSize: '1.05rem' }}
            >
              <LogIn size={18} />
              <span>Sign in with Google to Start</span>
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
