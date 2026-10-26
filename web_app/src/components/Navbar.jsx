import React from 'react';
import { 
  Sun, 
  Moon, 
  LogIn, 
  LogOut, 
  Gauge, 
  Car, 
  Clock, 
  Wrench,
  LineChart as ChartIcon, 
  Settings as SettingsIcon
} from 'lucide-react';

import { formatDate } from '../utils/dateFormatter';

export function Navbar({ 
  activeTab, 
  setActiveTab, 
  theme, 
  toggleTheme, 
  user, 
  onGoogleSignIn, 
  onSignOut,
  oilStatus = null,
  unit = 'km'
}) {
  const getOilChipText = () => {
    if (!oilStatus) return '';

    const formatTime = () => {
      if (oilStatus.remainingDays === null || oilStatus.remainingDays === undefined) return '';
      if (oilStatus.remainingDays <= 0) {
        return `${Math.abs(oilStatus.remainingDays)}d past`;
      }
      if (oilStatus.remainingDays <= 45) {
        return `${oilStatus.remainingDays}d left`;
      }
      return `${oilStatus.remainingMonths}m left`;
    };

    if (oilStatus.status === 'overdue') {
      if (oilStatus.primaryTrigger === 'both') {
        return `Oil Overdue: ${Math.abs(oilStatus.remainingKm).toLocaleString()} ${unit} & ${Math.abs(oilStatus.remainingDays)}d`;
      }
      if (oilStatus.primaryTrigger === 'time') {
        return `Oil Overdue: ${Math.abs(oilStatus.remainingDays)}d`;
      }
      return `Oil Overdue: ${Math.abs(oilStatus.remainingKm).toLocaleString()} ${unit}`;
    }

    if (oilStatus.status === 'warning') {
      const kmStr = oilStatus.remainingKm > 0 ? `${oilStatus.remainingKm.toLocaleString()} ${unit}` : `0 ${unit}`;
      const timeStr = formatTime();
      return timeStr ? `Oil: ${kmStr} • ${timeStr}` : `Oil: ${kmStr} left`;
    }

    if (oilStatus.status === 'ok') {
      const kmStr = `${oilStatus.remainingKm.toLocaleString()} ${unit}`;
      const timeStr = formatTime();
      return timeStr ? `Oil: ${kmStr} • ${timeStr}` : `Oil: ${kmStr} left`;
    }

    // No service recorded yet
    return `Oil: ${oilStatus.intervalKm.toLocaleString()} ${unit} / ${oilStatus.intervalMonths}m`;
  };

  const getOilChipTooltip = () => {
    if (!oilStatus) return '';
    if (oilStatus.hasHistory) {
      const kmText = oilStatus.remainingKm > 0 
        ? `${oilStatus.remainingKm.toLocaleString()} ${unit} remaining`
        : `Overdue by ${Math.abs(oilStatus.remainingKm).toLocaleString()} ${unit}`;
      const timeText = oilStatus.remainingDays !== null && oilStatus.remainingDays !== undefined
        ? (oilStatus.remainingDays > 0 
            ? `${oilStatus.remainingDays} days (~${oilStatus.remainingMonths} mos) remaining`
            : `Overdue by ${Math.abs(oilStatus.remainingDays)} days`)
        : '';
      const targetDateStr = oilStatus.nextDueDate ? ` or ${formatDate(oilStatus.nextDueDate)}` : '';
      return `Engine Oil Telemetry: ${kmText}${timeText ? ` & ${timeText}` : ''} (Target: ${oilStatus.nextDueOdometer.toLocaleString()} ${unit}${targetDateStr}, whichever comes first). Last serviced on ${formatDate(oilStatus.lastOilDate)} at ${oilStatus.lastOilOdometer.toLocaleString()} ${unit}. Click to manage Services.`;
    }
    return `Engine Oil Telemetry: Configured interval is ${oilStatus.intervalKm.toLocaleString()} ${unit} or ${oilStatus.intervalMonths} months (Whichever comes first). Click to manage Services.`;
  };

  return (
    <>
      <header className="navbar">
        <div className="navbar-inner">
          {/* Brand Logo */}
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

          {/* Navigation Links: ONLY shown when user is signed in */}
          {user ? (
            <nav className="nav-links desktop-only">
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
                className={`nav-item ${activeTab === 'services' ? 'active' : ''}`}
                onClick={() => setActiveTab('services')}
              >
                <Wrench size={16} />
                Services
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
            </nav>
          ) : (
            <div className="nav-spacer desktop-only" />
          )}

          {/* Action controls (Engine Oil Alert + Theme switch + Google Auth) */}
          <div className="nav-actions">
            {/* Engine Oil Status Alert Chip in the Navigation Bar */}
            {user && oilStatus && (
              <button
                type="button"
                className={`nav-oil-chip nav-oil-${oilStatus.status}`}
                onClick={() => setActiveTab('services')}
                title={getOilChipTooltip()}
              >
                <span className="oil-icon-dot">
                  {oilStatus.status === 'overdue' ? '🚨' : oilStatus.status === 'warning' ? '⚠️' : '🛢️'}
                </span>
                <span className="oil-text-display">
                  {getOilChipText()}
                </span>
              </button>
            )}

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
              <div className="nav-user-group">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    className="nav-user-avatar"
                    title={user.email}
                  />
                ) : (
                  <div 
                    className="nav-user-avatar-placeholder"
                    title={user.email}
                  >
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <button 
                  className="btn btn-secondary btn-nav-auth" 
                  onClick={onSignOut}
                  title="Sign Out"
                >
                  <LogOut size={14} />
                  <span className="desktop-only">Sign Out</span>
                </button>
              </div>
            ) : (
              <button 
                className="btn btn-primary btn-nav-auth" 
                onClick={onGoogleSignIn}
              >
                <LogIn size={15} />
                <span>Google Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
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
            className={`mobile-nav-item ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveTab('services')}
          >
            <Wrench size={19} />
            <span>Services</span>
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
