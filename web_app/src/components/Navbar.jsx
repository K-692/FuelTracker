import React from 'react';
import { 
  Sun, 
  Moon, 
  LogIn, 
  LogOut, 
  Gauge, 
  Car, 
  Clock, 
  LineChart as ChartIcon, 
  Settings as SettingsIcon,
  Sparkles
} from 'lucide-react';

export function Navbar({ 
  activeTab, 
  setActiveTab, 
  theme, 
  toggleTheme, 
  user, 
  onGoogleSignIn, 
  onSignOut
}) {
  return (
    <>
      <header className="navbar">
        <div className="navbar-inner">
          {/* Brand Logo with App_icon/icon.png */}
          <div 
            className="brand-logo" 
            onClick={() => setActiveTab(user ? 'track' : 'landing')}
            title="FuelTracker Home"
          >
            <img src="./icon.png" alt="FuelTracker" className="brand-icon-img" />
            <div>
              Fuel<span className="brand-highlight">Tracker</span>
            </div>
          </div>

          {/* Navigation Links: ONLY show Overview if NOT signed in. Show all tabs ONLY when signed in */}
          <nav className="nav-links desktop-only">
            {user ? (
              <>
                <button 
                  className={`nav-item ${activeTab === 'landing' ? 'active' : ''}`}
                  onClick={() => setActiveTab('landing')}
                >
                  <Sparkles size={16} />
                  Overview
                </button>
                <button 
                  className={`nav-item ${activeTab === 'track' ? 'active' : ''}`}
                  onClick={() => setActiveTab('track')}
                >
                  <Gauge size={16} />
                  Track
                </button>
                <button 
                  className={`nav-item ${activeTab === 'garage' ? 'active' : ''}`}
                  onClick={() => setActiveTab('garage')}
                >
                  <Car size={16} />
                  Garage
                </button>
                <button 
                  className={`nav-item ${activeTab === 'refills' ? 'active' : ''}`}
                  onClick={() => setActiveTab('refills')}
                >
                  <Clock size={16} />
                  Refills
                </button>
                <button 
                  className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
                  onClick={() => setActiveTab('analytics')}
                >
                  <ChartIcon size={16} />
                  Analytics
                </button>
                <button 
                  className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                  onClick={() => setActiveTab('settings')}
                >
                  <SettingsIcon size={16} />
                  Settings
                </button>
              </>
            ) : (
              <button 
                className="nav-item active"
                onClick={() => setActiveTab('landing')}
              >
                <Sparkles size={16} />
                Overview
              </button>
            )}
          </nav>

          {/* Action controls (Theme switch + Google Auth) */}
          <div className="nav-actions">
            {/* Theme Toggle Button */}
            <button 
              className="btn-icon-only" 
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={18} color="#fadb14" /> : <Moon size={18} color="#52c41a" />}
            </button>

            {/* Auth Action */}
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--color-green)' }}
                    title={user.email}
                  />
                ) : (
                  <div 
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--color-green)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.82rem'
                    }}
                    title={user.email}
                  >
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <button 
                  className="btn btn-secondary" 
                  onClick={onSignOut}
                  style={{ padding: '7px 11px', fontSize: '0.82rem' }}
                  title="Sign Out"
                >
                  <LogOut size={14} />
                  <span className="desktop-only">Sign Out</span>
                </button>
              </div>
            ) : (
              <button 
                className="btn btn-primary" 
                onClick={onGoogleSignIn}
                style={{ padding: '7px 14px', fontSize: '0.85rem' }}
              >
                <LogIn size={15} />
                <span>Google Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar: ONLY show when user has signed in */}
      {user && (
        <nav className="mobile-bottom-nav">
          <button 
            className={`mobile-nav-item ${activeTab === 'track' ? 'active' : ''}`}
            onClick={() => setActiveTab('track')}
          >
            <Gauge size={19} />
            <span>Track</span>
          </button>
          <button 
            className={`mobile-nav-item ${activeTab === 'garage' ? 'active' : ''}`}
            onClick={() => setActiveTab('garage')}
          >
            <Car size={19} />
            <span>Garage</span>
          </button>
          <button 
            className={`mobile-nav-item ${activeTab === 'refills' ? 'active' : ''}`}
            onClick={() => setActiveTab('refills')}
          >
            <Clock size={19} />
            <span>Refills</span>
          </button>
          <button 
            className={`mobile-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <ChartIcon size={19} />
            <span>Analytics</span>
          </button>
          <button 
            className={`mobile-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <SettingsIcon size={19} />
            <span>Settings</span>
          </button>
        </nav>
      )}
    </>
  );
}
