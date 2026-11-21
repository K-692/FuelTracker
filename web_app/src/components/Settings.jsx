import React from 'react';
import { 
  Sun, 
  Moon, 
  Database, 
  Key, 
  LogIn, 
  LogOut, 
  Sliders, 
  CheckCircle2,
  Wrench
} from 'lucide-react';
import { isFirebaseConfigured } from '../services/firebase';

export function Settings({ 
  theme, 
  toggleTheme, 
  currency, 
  setCurrency, 
  unit, 
  setUnit, 
  engineOilInterval = 5000,
  setEngineOilInterval,
  engineOilMonthsInterval = 6,
  setEngineOilMonthsInterval,
  user, 
  onGoogleSignIn, 
  onSignOut,
  onOpenFirebaseModal
}) {
  const fbReady = isFirebaseConfigured();

  return (
    <div className="settings-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="dashboard-header" style={{ marginBottom: '28px' }}>
        <div>
          <h1 className="page-title">
            System Settings & Preferences
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Customize your visual theme, vehicle service intervals, and cloud database connectivity.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Appearance & Theme Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Sun size={20} color="var(--color-primary)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Appearance & Theme</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontWeight: 700 }}>Color Mode</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Currently using <strong>{theme === 'dark' ? 'Obsidian Dark' : 'Crisp Light'}</strong> mode.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px 16px', fontSize: '0.88rem' }}
                onClick={() => theme !== 'light' && toggleTheme()}
              >
                <Sun size={15} />
                <span>Light</span>
              </button>
              <button 
                className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px 16px', fontSize: '0.88rem' }}
                onClick={() => theme !== 'dark' && toggleTheme()}
              >
                <Moon size={15} />
                <span>Dark</span>
              </button>
            </div>
          </div>
        </div>

        {/* Currency, Measurement Units & Servicing Preferences */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Sliders size={20} color="var(--color-orange)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Units, Localization & Service Thresholds</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '16px', marginBottom: '18px' }}>
            <div className="form-group">
              <label className="form-label">Currency Symbol</label>
              <select 
                className="form-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="₹">₹ (INR - Indian Rupee)</option>
                <option value="$">$ (USD - US Dollar)</option>
                <option value="€">€ (EUR - Euro)</option>
                <option value="£">£ (GBP - British Pound)</option>
                <option value="A$">A$ (AUD - Australian Dollar)</option>
                <option value="C$">C$ (CAD - Canadian Dollar)</option>
                <option value="¥">¥ (JPY - Japanese Yen)</option>
                <option value="AED">AED (Emirati Dirham)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Distance Unit</label>
              <select 
                className="form-select"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              >
                <option value="km">Kilometers (km) • Liters</option>
                <option value="mi">Miles (mi) • Gallons</option>
              </select>
            </div>
          </div>

          {/* Engine Oil Change Dual-Threshold Intervals Setting */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label className="form-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Wrench size={14} color="var(--color-primary)" />
                  Engine Oil Replacement Thresholds (Distance & Time Duration)
                </label>
                <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                  Dual Alert Trigger
                </span>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: '1.5' }}>
                Vehicle engine oil degrades both mechanically from distance driven and chemically over calendar time. Following automotive best practices, service is prompted every <strong>{engineOilInterval.toLocaleString()} {unit}</strong> or <strong>{engineOilMonthsInterval} months</strong> from your last oil change, <em>whichever comes first</em>. The navigation bar and service hub will dynamically alert you according to both criteria.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '16px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Distance Interval ({unit})
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input 
                      type="number"
                      min="500"
                      step="100"
                      className="form-input"
                      style={{ fontWeight: 700, fontSize: '1rem' }}
                      value={engineOilInterval}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setEngineOilInterval(isNaN(val) || val <= 0 ? 5000 : val);
                      }}
                    />
                    <span style={{ fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{unit}</span>
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Time Duration Interval (Months)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input 
                      type="number"
                      min="1"
                      max="60"
                      step="1"
                      className="form-input"
                      style={{ fontWeight: 700, fontSize: '1rem' }}
                      value={engineOilMonthsInterval}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setEngineOilMonthsInterval(isNaN(val) || val <= 0 ? 6 : val);
                      }}
                    />
                    <span style={{ fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Months</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cloud Firestore & Google Auth Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Database size={20} color="var(--color-primary)" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Cloud Sync & Google Auth</h2>
            </div>

            {fbReady ? (
              <span className="badge badge-primary">
                <CheckCircle2 size={12} />
                <span>Firebase Connected</span>
              </span>
            ) : (
              <span className="badge badge-amber">
                Demo / Local Mode
              </span>
            )}
          </div>

          <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '18px', lineHeight: '1.6' }}>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ color: 'var(--text-main)', fontWeight: 700 }}>
                    Signed in as {user.displayName || user.email}
                  </div>
                  <div style={{ fontSize: '0.78rem' }}>UID: {user.uid}</div>
                </div>
                <button className="btn btn-secondary" onClick={onSignOut} style={{ fontSize: '0.85rem' }}>
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  Connect your Google Account to automatically sync telemetry and maintenance data with Cloud Firestore.
                </div>
                <button className="btn btn-primary" onClick={onGoogleSignIn} style={{ fontSize: '0.88rem' }}>
                  <LogIn size={15} />
                  <span>Sign In with Google</span>
                </button>
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Configure or change Firebase API credentials for this browser:
            </div>
            <button className="btn btn-secondary" onClick={onOpenFirebaseModal} style={{ fontSize: '0.85rem' }}>
              <Key size={15} />
              <span>Configure Firebase Keys</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
