import React, { useState, useEffect } from 'react';
import { X, Check, Calculator, AlertTriangle, Sparkles } from 'lucide-react';
import { formatDate, getTodayInputDate } from '../utils/dateFormatter';

export function RefillModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData = null, 
  activeVehicleId, 
  vehicleEntries = [], 
  fuelTypes = [],
  currency = '₹',
  unit = 'km'
}) {
  const [odometer, setOdometer] = useState('');
  const [fuelAmount, setFuelAmount] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [fuelTypeId, setFuelTypeId] = useState('');
  const [refillDate, setRefillDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const sortedPastEntries = [...vehicleEntries]
    .filter(e => !initialData || e.id !== initialData.id)
    .sort((a, b) => Number(a.odometer) - Number(b.odometer));

  const latestPastEntry = sortedPastEntries.length > 0 
    ? sortedPastEntries[sortedPastEntries.length - 1] 
    : null;

  useEffect(() => {
    if (initialData) {
      setOdometer(String(initialData.odometer || ''));
      setFuelAmount(String(initialData.fuelAmount || ''));
      setTotalCost(String(initialData.totalCost || ''));
      setFuelTypeId(String(initialData.fuelTypeId || fuelTypes[0]?.id || ''));
      setRefillDate(initialData.refillDate || getTodayInputDate());
      setNotes(initialData.notes || '');
    } else {
      setOdometer('');
      setFuelAmount('');
      setTotalCost('');
      setFuelTypeId(fuelTypes[0]?.id || 'ft_1');
      setRefillDate(getTodayInputDate());
      setNotes('');
    }
    setError('');
  }, [initialData, isOpen, fuelTypes]);

  if (!isOpen) return null;

  const numOdo = Number(odometer);
  const numFuel = Number(fuelAmount);
  const numCost = Number(totalCost);

  const prevOdo = latestPastEntry ? Number(latestPastEntry.odometer) : null;
  const prevFuel = latestPastEntry ? Number(latestPastEntry.fuelAmount) : null;

  const tripDistance = (numOdo && prevOdo && numOdo > prevOdo) ? (numOdo - prevOdo) : null;
  const calculatedPricePerLiter = (numCost > 0 && numFuel > 0) ? (numCost / numFuel) : null;
  const estimatedMileage = (tripDistance && prevFuel && prevFuel > 0) ? (tripDistance / prevFuel) : null;
  const costPerKm = (numCost > 0 && tripDistance && tripDistance > 0) ? (numCost / tripDistance) : null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!numOdo || numOdo <= 0) {
      setError('Please provide a valid odometer reading.');
      return;
    }
    if (!numFuel || numFuel <= 0) {
      setError('Please enter the fuel volume pumped.');
      return;
    }
    if (!numCost || numCost <= 0) {
      setError('Please enter the total cost paid.');
      return;
    }

    if (prevOdo && numOdo <= prevOdo && !initialData) {
      setError(`Odometer must be greater than previous reading (${prevOdo} ${unit}).`);
      return;
    }

    const selectedType = fuelTypes.find(f => f.id === fuelTypeId) || fuelTypes[0];

    const payload = {
      ...(initialData || {}),
      vehicleId: activeVehicleId,
      fuelTypeId: fuelTypeId || selectedType.id,
      fuelTypeName: selectedType?.name || 'Regular Petrol',
      odometer: numOdo,
      fuelAmount: Number(numFuel.toFixed(2)),
      totalCost: Number(numCost.toFixed(2)),
      pricePerLiter: Number((numCost / numFuel).toFixed(2)),
      refillDate: refillDate || getTodayInputDate(),
      notes: notes.trim(),
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calculator size={20} color="var(--color-green)" />
            <h2 className="modal-title">
              {initialData ? 'Edit Fuel Refill' : 'Log Fuel Refill'}
            </h2>
          </div>
          <button className="btn-icon-only" onClick={onClose} aria-label="Close modal">
            <X size={17} />
          </button>
        </div>

        {error && (
          <div 
            style={{ 
              padding: '10px 14px', 
              borderRadius: 'var(--radius-sm)', 
              background: 'rgba(245, 34, 45, 0.1)', 
              border: '1px solid rgba(245, 34, 45, 0.3)',
              color: 'var(--color-danger)',
              fontSize: '0.88rem',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertTriangle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Refill Date with DD/Apr/YYYY Badge */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>Refill Date</label>
              <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                {formatDate(refillDate)}
              </span>
            </div>
            <input 
              type="date"
              className="form-input"
              value={refillDate}
              onChange={(e) => setRefillDate(e.target.value)}
              required
            />
          </div>

          {/* Odometer */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>
                Odometer Reading ({unit})
              </label>
              {prevOdo && (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  Previous: <strong>{prevOdo} {unit}</strong>
                </span>
              )}
            </div>
            <input 
              type="number"
              step="any"
              className="form-input"
              placeholder={prevOdo ? `e.g. ${prevOdo + 350}` : 'e.g. 15200'}
              value={odometer}
              onChange={(e) => setOdometer(e.target.value)}
              required
            />
          </div>

          {/* Fuel Type */}
          <div className="form-group">
            <label className="form-label">Fuel Category</label>
            <select 
              className="form-select"
              value={fuelTypeId}
              onChange={(e) => setFuelTypeId(e.target.value)}
            >
              {fuelTypes.map(ft => (
                <option key={ft.id} value={ft.id}>
                  {ft.name} {ft.category ? `(${ft.category})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Fuel Amount & Total Cost */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Volume (Liters)</label>
              <input 
                type="number"
                step="0.01"
                className="form-input"
                placeholder="e.g. 12.5"
                value={fuelAmount}
                onChange={(e) => setFuelAmount(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Total Cost ({currency})</label>
              <input 
                type="number"
                step="0.01"
                className="form-input"
                placeholder="e.g. 1300"
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Live Telemetry Calculation Preview Card */}
          <div className="live-calc-box">
            <div>
              <div className="calc-stat-label">Price / Liter</div>
              <div className="calc-stat-val">
                {calculatedPricePerLiter ? `${currency}${calculatedPricePerLiter.toFixed(2)}` : '--'}
              </div>
            </div>

            <div>
              <div className="calc-stat-label">Trip Delta</div>
              <div className="calc-stat-val" style={{ color: 'var(--text-main)' }}>
                {tripDistance ? `+${tripDistance} ${unit}` : '--'}
              </div>
            </div>

            <div>
              <div className="calc-stat-label">True Mileage</div>
              <div className="calc-stat-val">
                {estimatedMileage 
                  ? `${estimatedMileage.toFixed(2)} ${unit}/L` 
                  : (latestPastEntry ? '--' : 'Baseline')}
              </div>
              {latestPastEntry && (
                <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                  From {prevFuel}L prior fill
                </div>
              )}
            </div>

            <div>
              <div className="calc-stat-label">Cost / {unit}</div>
              <div className="calc-stat-val" style={{ color: 'var(--text-main)' }}>
                {costPerKm ? `${currency}${costPerKm.toFixed(2)}` : '--'}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Notes (Optional)</label>
            <textarea 
              className="form-textarea"
              rows="2"
              placeholder="Station, highway trip, tire check..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={16} />
              <span>{initialData ? 'Update Refill' : 'Save Refill'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
