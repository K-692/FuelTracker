import React, { useRef } from 'react';
import { 
  Sun, 
  Moon, 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  ShieldCheck, 
  Key, 
  LogIn, 
  LogOut, 
  Sliders, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { isFirebaseConfigured } from '../services/firebase';

export function Settings({ 
  theme, 
  toggleTheme, 
  currency, 
  setCurrency, 
  unit, 
  setUnit, 
  user, 
  onGoogleSignIn, 
  onSignOut,
  onOpenFirebaseModal,
  onExportBackup,
  onImportBackup,
  onResetDemoData,
  showNotification
}) {
  const fileInputRef = useRef(null);
  const fbReady = isFirebaseConfigured();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result;
        if (text) {
          await onImportBackup(text);
          showNotification('Backup successfully restored!', 'success');
        }
      } catch (err) {
        showNotification(`Restore failed: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="settings-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="dashboard-header" style={{ marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '4px' }}>
            System Settings & Preferences
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Customize your visual theme, cloud database connectivity, and data backups.
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

        {/* Currency & Measurement Units */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Sliders size={20} color="var(--color-accent-fuel)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Units & Localization</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
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
        </div>

        {/* Cloud Firestore & Google Auth Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Database size={20} color="var(--color-accent-blue)" />
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
                  Connect your Google Account to automatically sync telemetry data with Cloud Firestore.
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

        {/* Android Backup & Universal Portability */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Download size={20} color="var(--color-primary)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Android App Data Portability</h2>
          </div>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '18px', lineHeight: '1.5' }}>
            FuelTracker utilizes an open JSON schema (<code>FuelTracker_AutoBackup.json</code>) 
            fully interoperable between the Android mobile application and this web application.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={onExportBackup}>
              <Download size={16} />
              <span>Export JSON Backup</span>
            </button>

            <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
              <Upload size={16} />
              <span>Import JSON Backup</span>
            </button>

            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".json"
              onChange={handleFileChange}
            />

            <button className="btn btn-ghost" onClick={onResetDemoData} style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              <RefreshCw size={14} />
              <span>Load Sample Fleet Data</span>
            </button>
          </div>
        </div>

        {/* About Card */}
        <div className="card" style={{ background: 'var(--bg-surface-elevated)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Info size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>About FuelTracker Web</h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            Engineered with strict adherence to physical combustion telemetry. 
            All mileage formulas evaluate distance traveled using the fuel volume poured in the preceding refill.
            Build version 1.0.0. Compatible with GitHub Pages, Firebase Hosting, and modern PWA runtimes.
          </p>
        </div>
      </div>
    </div>
  );
}
