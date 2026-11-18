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

  const getOilChipShortText = () => {
    if (!oilStatus) return '';
    if (oilStatus.status === 'overdue') return 'Oil due';
    if (oilStatus.status === 'warning' || oilStatus.status === 'ok') {
      const km = Math.max(0, oilStatus.remainingKm || 0);
      return km >= 1000 ? `${(km / 1000).toFixed(km >= 10000 ? 0 : 1)}k ${unit}` : `${km} ${unit}`;
    }
    return 'Oil';
  };

  const navItems = [
    { id: 'track', label: 'Track', Icon: Gauge },
    { id: 'garage', label: 'Garage', Icon: Car },
    { id: 'refills', label: 'Refills', Icon: Clock },
    { id: 'services', label: 'Services', Icon: Wrench },
    { id: 'analytics', label: 'Analytics', Icon: ChartIcon },
    { id: 'settings', label: 'Settings', Icon: SettingsIcon },
  ];

  const handleNavigate = (tabId) => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  };

  return (
    <>
      <header className={`navbar ${user ? 'navbar--authed' : ''}`}>
        <div className="navbar-inner">
          {/* Brand Logo */}
          <button
            type="button"
            className="brand-logo"
            onClick={() => handleNavigate(user ? 'track' : 'landing')}
            title="FuelTracker Home"
            aria-label="FuelTracker home"
          >
            <img src="./icon.png" alt="" className="brand-icon-img" width="34" height="34" />
            <span className="brand-text">
              Fuel<span className="brand-highlight">Tracker</span>
            </span>
          </button>

          {/* Navigation Links: ONLY shown when user is signed in */}
          {user ? (
            <nav className="nav-links desktop-only" aria-label="Primary">
              {navItems.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={`nav-item ${activeTab === id ? 'active' : ''}`}
                  aria-current={activeTab === id ? 'page' : undefined}
                  onClick={() => handleNavigate(id)}
                >
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </button>
              ))}
            </nav>
          ) : (
            <div className="nav-spacer desktop-only" />
          )}

          {/* Action controls (Engine Oil Alert + Theme switch + Google Auth) */}
          <div className="nav-actions">
            {user && oilStatus && (
              <button
                type="button"
                className={`nav-oil-chip nav-oil-${oilStatus.status}`}
                onClick={() => handleNavigate('services')}
                title={getOilChipTooltip()}
                aria-label={getOilChipTooltip()}
              >
                <span className="oil-icon-dot" aria-hidden="true">
                  {oilStatus.status === 'overdue' ? '🚨' : oilStatus.status === 'warning' ? '⚠️' : '🛢️'}
                </span>
                <span className="oil-text-display oil-text-full">{getOilChipText()}</span>
                <span className="oil-text-display oil-text-short">{getOilChipShortText()}</span>
              </button>
            )}

            <button
              type="button"
              className="btn-icon-only"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={18} color="#fadb14" /> : <Moon size={18} color="#52c41a" />}
            </button>

            {user ? (
              <div className="nav-user-group">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="nav-user-avatar"
                    title={user.email}
                    referrerPolicy="no-referrer"
                    width="34"
                    height="34"
                  />
                ) : (
                  <div className="nav-user-avatar-placeholder" title={user.email} aria-hidden="true">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <button
                  type="button"
                  className="btn btn-secondary btn-nav-auth"
                  onClick={onSignOut}
                  title="Sign Out"
                  aria-label="Sign out"
                >
                  <LogOut size={14} aria-hidden="true" />
                  <span className="desktop-only">Sign Out</span>
                </button>
              </div>
            ) : (
              <button type="button" className="btn btn-primary btn-nav-auth" onClick={onGoogleSignIn}>
                <LogIn size={15} aria-hidden="true" />
                <span className="nav-signin-label">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      {user && (
        <nav className="mobile-bottom-nav" aria-label="Primary mobile">
          {navItems.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={`mobile-nav-item ${activeTab === id ? 'active' : ''}`}
              aria-current={activeTab === id ? 'page' : undefined}
              onClick={() => handleNavigate(id)}
            >
              <Icon size={20} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      )}
    </>
  );
}
