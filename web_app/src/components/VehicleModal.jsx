import React, { useState, useEffect } from 'react';
import { X, Check, Car } from 'lucide-react';

export function VehicleModal({ isOpen, onClose, onSave, initialData = null }) {
  const [name, setName] = useState('');
  const [vehicleType, setVehicleType] = useState('CAR');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setVehicleType(initialData.vehicleType || 'CAR');
      setRegistrationNumber(initialData.registrationNumber || '');
      setManufacturer(initialData.manufacturer || '');
      setModel(initialData.model || '');
      setYear(initialData.year ? String(initialData.year) : '');
    } else {
      setName('');
      setVehicleType('CAR');
      setRegistrationNumber('');
      setManufacturer('');
      setModel('');
      setYear('');
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please provide a vehicle name.');
      return;
    }

    const payload = {
      ...(initialData || {}),
      name: name.trim(),
      vehicleType,
      registrationNumber: registrationNumber.trim() || null,
      manufacturer: manufacturer.trim() || null,
      model: model.trim() || null,
      year: year ? parseInt(year, 10) : null,
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Car size={22} color="var(--color-primary)" />
            <h2 className="modal-title">
              {initialData ? 'Edit Vehicle Profile' : 'Add New Vehicle'}
            </h2>
          </div>
          <button className="btn-icon-only" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div 
            style={{ 
              padding: '10px 14px', 
              borderRadius: 'var(--radius-sm)', 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--color-danger)',
              fontSize: '0.88rem',
              marginBottom: '16px'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div className="form-group">
            <label className="form-label">Vehicle Nickname / Display Name</label>
            <input 
              type="text"
              className="form-input"
              placeholder="e.g. Daily Commuter / Meteor 350"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Vehicle Type */}
          <div className="form-group">
            <label className="form-label">Vehicle Category</label>
            <select 
              className="form-select"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
            >
              <option value="BIKE">🏍️ Motorcycle / Bike</option>
              <option value="SCOOTER">🛵 Scooter</option>
              <option value="CAR">🚗 Passenger Car</option>
              <option value="OTHER">🚙 Other / Commercial</option>
            </select>
          </div>

          {/* Registration Number */}
          <div className="form-group">
            <label className="form-label">Registration / License Plate (Optional)</label>
            <input 
              type="text"
              className="form-input"
              placeholder="e.g. DL 03 CB 4412"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
            />
          </div>

          {/* Manufacturer & Model */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Manufacturer (Optional)</label>
              <input 
                type="text"
                className="form-input"
                placeholder="e.g. Honda, Royal Enfield"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Model (Optional)</label>
              <input 
                type="text"
                className="form-input"
                placeholder="e.g. CB350, City"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
            </div>
          </div>

          {/* Model Year */}
          <div className="form-group">
            <label className="form-label">Manufacturing Year (Optional)</label>
            <input 
              type="number"
              className="form-input"
              placeholder="e.g. 2023"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              min="1950"
              max={new Date().getFullYear() + 1}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={16} />
              <span>{initialData ? 'Update Profile' : 'Save Vehicle'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
