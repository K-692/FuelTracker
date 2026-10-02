import React, { useState, useEffect } from 'react';
import { X, Check, Database, Key, AlertCircle, HelpCircle, RefreshCw } from 'lucide-react';
import { getFirebaseConfig, saveFirebaseConfig, clearFirebaseConfig } from '../services/firebase';

export function FirebaseModal({ isOpen, onClose, onConfigSaved }) {
  const [apiKey, setApiKey] = useState('');
  const [authDomain, setAuthDomain] = useState('');
  const [projectId, setProjectId] = useState('');
  const [storageBucket, setStorageBucket] = useState('');
  const [messagingSenderId, setMessagingSenderId] = useState('');
  const [appId, setAppId] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [mode, setMode] = useState('fields'); // 'fields' | 'json'
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const existing = getFirebaseConfig();
      if (existing) {
        setApiKey(existing.apiKey || '');
        setAuthDomain(existing.authDomain || '');
        setProjectId(existing.projectId || '');
        setStorageBucket(existing.storageBucket || '');
        setMessagingSenderId(existing.messagingSenderId || '');
        setAppId(existing.appId || '');
        setJsonInput(JSON.stringify(existing, null, 2));
      } else {
        setApiKey('');
        setAuthDomain('');
        setProjectId('');
        setStorageBucket('');
        setMessagingSenderId('');
        setAppId('');
        setJsonInput('');
      }
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleJsonPaste = (text) => {
    setJsonInput(text);
    try {
      // Clean string if it looks like js object `const firebaseConfig = { ... }`
      let cleaned = text.trim();
      if (cleaned.includes('{') && cleaned.includes('}')) {
        cleaned = cleaned.substring(cleaned.indexOf('{'), cleaned.lastIndexOf('}') + 1);
      }
      // Replace unquoted keys with quoted keys if needed
      const parsed = Function('"use strict";return (' + cleaned + ')')();
      if (parsed && typeof parsed === 'object') {
        if (parsed.apiKey) setApiKey(parsed.apiKey);
        if (parsed.authDomain) setAuthDomain(parsed.authDomain);
        if (parsed.projectId) setProjectId(parsed.projectId);
        if (parsed.storageBucket) setStorageBucket(parsed.storageBucket);
        if (parsed.messagingSenderId) setMessagingSenderId(parsed.messagingSenderId);
        if (parsed.appId) setAppId(parsed.appId);
        setStatusMessage({ type: 'success', text: 'Firebase configuration successfully parsed from JSON!' });
      }
    } catch (e) {
      // Not yet valid JSON while typing
    }
  };

  const handleSave = (e) => {
    e.preventDefault();

    if (!apiKey.trim() || !projectId.trim()) {
      setStatusMessage({ type: 'error', text: 'API Key and Project ID are required.' });
      return;
    }

    const config = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim() || `${projectId.trim()}.appspot.com`,
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
    };

    try {
      saveFirebaseConfig(config);
      setStatusMessage({ type: 'success', text: 'Firebase configuration saved successfully!' });
      setTimeout(() => {
        onConfigSaved();
        onClose();
      }, 700);
    } catch (err) {
      setStatusMessage({ type: 'error', text: `Failed to save: ${err.message}` });
    }
  };

  const handleClear = () => {
    clearFirebaseConfig();
    setApiKey('');
    setAuthDomain('');
    setProjectId('');
    setStorageBucket('');
    setMessagingSenderId('');
    setAppId('');
    setJsonInput('');
    setStatusMessage({ type: 'success', text: 'Firebase configuration cleared. App reverted to Local/Demo mode.' });
    setTimeout(() => {
      onConfigSaved();
      onClose();
    }, 700);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={22} color="var(--color-primary)" />
            <h2 className="modal-title">Firebase & Google Cloud Setup</h2>
          </div>
          <button className="btn-icon-only" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Guidance Banner */}
        <div 
          style={{ 
            padding: '14px', 
            borderRadius: 'var(--radius-md)', 
            background: 'var(--bg-surface-elevated)', 
            border: '1px solid var(--border-medium)',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            marginBottom: '18px',
            lineHeight: '1.5'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontWeight: 700, marginBottom: '4px' }}>
            <HelpCircle size={15} color="var(--color-primary)" />
            <span>How to get these credentials:</span>
          </div>
          <ol style={{ paddingLeft: '20px', margin: 0 }}>
            <li>Open the <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Firebase Console</a> and select or create your project.</li>
            <li>Enable <strong>Authentication &rarr; Sign-in method &rarr; Google</strong>.</li>
            <li>Enable <strong>Cloud Firestore</strong> database.</li>
            <li>Go to <strong>Project Settings &rarr; Your apps &rarr; Web app</strong> and paste the configuration below.</li>
          </ol>
        </div>

        {/* Mode Switcher */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button 
            type="button"
            className={`btn ${mode === 'fields' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            onClick={() => setMode('fields')}
          >
            Form Fields
          </button>
          <button 
            type="button"
            className={`btn ${mode === 'json' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            onClick={() => setMode('json')}
          >
            Paste JSON Object
          </button>
        </div>

        {statusMessage && (
          <div 
            style={{ 
              padding: '10px 14px', 
              borderRadius: 'var(--radius-sm)', 
              background: statusMessage.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              border: `1px solid ${statusMessage.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
              color: statusMessage.type === 'error' ? 'var(--color-danger)' : 'var(--color-primary)',
              fontSize: '0.85rem',
              marginBottom: '16px'
            }}
          >
            {statusMessage.text}
          </div>
        )}

        <form onSubmit={handleSave}>
          {mode === 'json' ? (
            <div className="form-group">
              <label className="form-label">Firebase Config JSON Object</label>
              <textarea 
                className="form-textarea"
                rows="8"
                style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}
                placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "myproject.firebaseapp.com",\n  "projectId": "myproject",\n  "storageBucket": "myproject.appspot.com",\n  "messagingSenderId": "...",\n  "appId": "..."\n}`}
                value={jsonInput}
                onChange={(e) => handleJsonPaste(e.target.value)}
              />
            </div>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">API Key (apiKey) *</label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Project ID (projectId) *</label>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="my-fuel-tracker-app"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Auth Domain (authDomain)</label>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="my-project.firebaseapp.com"
                    value={authDomain}
                    onChange={(e) => setAuthDomain(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Storage Bucket</label>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="my-project.appspot.com"
                    value={storageBucket}
                    onChange={(e) => setStorageBucket(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">App ID</label>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="1:123456789:web:abcdef"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px', flexWrap: 'wrap', gap: '10px' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleClear}
              style={{ color: 'var(--color-danger)' }}
            >
              Reset to Local Mode
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <Check size={16} />
                <span>Save Credentials</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
