import React from 'react';
import { 
  Plus, 
  Fuel, 
  Gauge, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  ArrowRight, 
  Clock, 
  AlertCircle,
  Edit3
} from 'lucide-react';
import { FuelCalculator } from '../domain/FuelCalculator';
import { formatDate } from '../utils/dateFormatter';

export function Dashboard({ 
  user,
  vehicles = [], 
  activeVehicleId, 
  onSelectVehicle, 
  entries = [], 
  onOpenAddRefill, 
  onEditRefill,
  onOpenAddVehicle, 
  onNavigateTab,
  currency = '₹',
  unit = 'km'
}) {
  const activeVehicle = vehicles.find(v => v.id === activeVehicleId) || vehicles[0];
  const vehicleEntries = entries.filter(e => e.vehicleId === activeVehicleId);
  const stats = FuelCalculator.calculateStatistics(vehicleEntries);
  const enrichedEntries = FuelCalculator.enrichEntries(vehicleEntries);
  const recentEntries = enrichedEntries.slice(0, 4);

  const username = user?.displayName || user?.email?.split('@')[0] || 'Driver';

  const getVehicleIcon = (type) => {
    switch (type) {
      case 'BIKE': return '🏍️';
      case 'SCOOTER': return '🛵';
      case 'CAR': return '🚗';
      default: return '🚙';
    }
  };

  return (
    <div className="dashboard-container">
      {/* Top Header: Active Vehicle Quick Selector */}
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '2px' }}>
            Hi, {username}!
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {activeVehicle ? (
              <>
                Active Profile: <strong style={{ color: 'var(--text-main)' }}>{activeVehicle.name}</strong>
                {activeVehicle.registrationNumber && ` • ${activeVehicle.registrationNumber}`}
              </>
            ) : (
              'Welcome to FuelTracker. Start by adding your first vehicle.'
            )}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary" onClick={onOpenAddRefill}>
            <Plus size={16} />
            <span>Log Refill</span>
          </button>
        </div>
      </div>

      {/* Horizontal Vehicle Selector Ribbon */}
      <div style={{ marginBottom: '20px' }}>
        <div className="vehicle-selector-bar">
          {vehicles.map(v => (
            <button
              key={v.id}
              className={`vehicle-pill ${v.id === activeVehicleId ? 'active' : ''}`}
              onClick={() => onSelectVehicle(v.id)}
            >
              <span>{getVehicleIcon(v.vehicleType)}</span>
              <span>{v.name}</span>
            </button>
          ))}
          <button 
            className="vehicle-pill" 
            onClick={onOpenAddVehicle}
            style={{ borderStyle: 'dashed' }}
          >
            <Plus size={14} />
            <span>Add Vehicle</span>
          </button>
        </div>
      </div>

      {/* Active Vehicle Hero Card or Empty State Banner */}
      {vehicles.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '36px 20px', marginBottom: '22px' }}>
          <div 
            style={{ 
              width: '52px', 
              height: '52px', 
              borderRadius: 'var(--radius-md)', 
              background: 'var(--color-primary-glow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              margin: '0 auto 12px auto',
              border: '1px solid var(--border-active)'
            }}
          >
            🚗
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>
            No Vehicles in Garage Yet
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 16px auto' }}>
            Add your motorcycle, scooter, or car profile to begin tracking mileage and fuel consumption.
          </p>
          <button className="btn btn-primary" onClick={onOpenAddVehicle}>
            <Plus size={16} />
            <span>Add First Vehicle</span>
          </button>
        </div>
      ) : (
        activeVehicle && (
          <div 
            className="card" 
            style={{ 
              marginBottom: '22px', 
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-medium)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div 
                style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: 'var(--radius-md)', 
                  background: 'var(--color-primary-glow)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.6rem',
                  border: '1px solid var(--border-active)'
                }}
              >
                {getVehicleIcon(activeVehicle.vehicleType)}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{activeVehicle.name}</h2>
                  <span className="badge badge-primary">{activeVehicle.vehicleType}</span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '2px' }}>
                  {activeVehicle.manufacturer} {activeVehicle.model} {activeVehicle.year ? `(${activeVehicle.year})` : ''} 
                  {activeVehicle.registrationNumber && ` • ${activeVehicle.registrationNumber}`}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={() => onNavigateTab('refills')}>
                <Clock size={15} />
                <span>History ({vehicleEntries.length})</span>
              </button>
              <button className="btn btn-secondary" onClick={() => onNavigateTab('analytics')}>
                <TrendingUp size={15} />
                <span>Analytics</span>
              </button>
            </div>
          </div>
        )
      )}

      {/* Primary Telemetry Metrics Grid */}
      <div className="stats-grid">
        {/* Average Mileage */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Average Mileage</span>
            <div className="stat-icon" style={{ background: 'var(--color-green-glow)', color: 'var(--color-green)' }}>
              <Gauge size={17} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--color-green)' }}>
            {stats.averageMileage > 0 ? stats.averageMileage : '--'} 
            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)' }}> {unit}/L</span>
          </div>
          <div className="stat-subtext">Previous Fill-Up method</div>
        </div>

        {/* Total Distance */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Distance</span>
            <div className="stat-icon" style={{ background: 'var(--color-orange-glow)', color: 'var(--color-orange)' }}>
              <TrendingUp size={17} />
            </div>
          </div>
          <div className="stat-value">
            {stats.totalDistance.toLocaleString()} 
            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)' }}> {unit}</span>
          </div>
          <div className="stat-subtext">Cumulative tracked span</div>
        </div>

        {/* Total Spending */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Fuel Cost</span>
            <div className="stat-icon" style={{ background: 'rgba(250, 173, 20, 0.2)', color: 'var(--color-yellow-dark)' }}>
              <DollarSign size={17} />
            </div>
          </div>
          <div className="stat-value">
            {currency}{stats.totalSpending.toLocaleString()}
          </div>
          <div className="stat-subtext">
            {stats.totalFuel.toFixed(1)} L pumped
          </div>
        </div>

        {/* Cost per km */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Operating Cost</span>
            <div className="stat-icon" style={{ background: 'var(--color-green-glow)', color: 'var(--color-green)' }}>
              <Fuel size={17} />
            </div>
          </div>
          <div className="stat-value">
            {stats.averageCostPerKm > 0 ? `${currency}${stats.averageCostPerKm}` : '--'}
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}> /{unit}</span>
          </div>
          <div className="stat-subtext">
            Avg: {currency}{stats.averageFuelPrice.toFixed(1)}/L
          </div>
        </div>
      </div>

      {/* Latest Refill Snapshot Card */}
      {stats.latestRefill ? (
        <div className="card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--color-green)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-primary">Most Recent Refill</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <Calendar size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                {formatDate(stats.latestRefill.refillDate)}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-amber">{stats.latestRefill.fuelTypeName || 'Regular Petrol'}</span>
              <button 
                className="btn btn-secondary" 
                onClick={() => onEditRefill(stats.latestRefill)}
                style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                title="Edit this refill log"
              >
                <Edit3 size={12} />
                <span>Edit</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px' }}>
            <div>
              <div className="calc-stat-label">Odometer</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                {stats.latestRefill.odometer} {unit}
              </div>
              {stats.latestRefill.tripDistance && (
                <div style={{ fontSize: '0.75rem', color: 'var(--color-green)', fontWeight: 600 }}>
                  +{stats.latestRefill.tripDistance} {unit} trip
                </div>
              )}
            </div>

            <div>
              <div className="calc-stat-label">Trip Mileage</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-green)' }}>
                {stats.latestRefill.calculatedMileage 
                  ? `${stats.latestRefill.calculatedMileage.toFixed(2)} ${unit}/L` 
                  : 'Baseline Fill'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                {stats.latestRefill.previousFuelUsed 
                  ? `From ${stats.latestRefill.previousFuelUsed} L prior fill` 
                  : 'Starting reading'}
              </div>
            </div>

            <div>
              <div className="calc-stat-label">Fuel Added</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                {stats.latestRefill.fuelAmount} L
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                {currency}{stats.latestRefill.pricePerLiter?.toFixed(2)}/L
              </div>
            </div>

            <div>
              <div className="calc-stat-label">Cost Paid</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                {currency}{stats.latestRefill.totalCost}
              </div>
              {stats.latestRefill.costPerUnitDistance && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  {currency}{stats.latestRefill.costPerUnitDistance.toFixed(2)}/{unit}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '36px', marginBottom: '24px' }}>
          <AlertCircle size={36} color="var(--color-orange)" style={{ margin: '0 auto 10px auto' }} />
          <h3 style={{ fontSize: '1.15rem', marginBottom: '6px' }}>No Refills Recorded Yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '16px' }}>
            Record your first fuel fill to establish the baseline odometer.
          </p>
          <button className="btn btn-primary" onClick={onOpenAddRefill}>
            <Plus size={15} />
            <span>Log Initial Refill</span>
          </button>
        </div>
      )}

      {/* Recent Activity Table Preview */}
      {recentEntries.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Recent Activity</h3>
            <button 
              className="btn btn-ghost" 
              onClick={() => onNavigateTab('refills')}
              style={{ fontSize: '0.85rem', color: 'var(--color-green)' }}
            >
              <span>View All Refills</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="entries-table-wrapper">
            <table className="entries-table">
              <thead>
                <tr>
                  <th>Date (DD/MMM/YYYY)</th>
                  <th>Odometer</th>
                  <th>Trip Delta</th>
                  <th>Fuel Liters</th>
                  <th>Total Cost</th>
                  <th>Calculated Mileage</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentEntries.map(entry => (
                  <tr key={entry.id}>
                    <td>
                      <strong>{formatDate(entry.refillDate)}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{entry.fuelTypeName}</div>
                    </td>
                    <td>{entry.odometer} {unit}</td>
                    <td>
                      {entry.tripDistance ? (
                        <span style={{ color: 'var(--color-green)', fontWeight: 600 }}>+{entry.tripDistance} {unit}</span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>-- (Base)</span>
                      )}
                    </td>
                    <td>{entry.fuelAmount} L</td>
                    <td>{currency}{entry.totalCost}</td>
                    <td>
                      {entry.calculatedMileage ? (
                        <span className="badge badge-primary">
                          {entry.calculatedMileage.toFixed(2)} {unit}/L
                        </span>
                      ) : (
                        <span className="badge badge-amber">Baseline</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="btn-icon-only" 
                        onClick={() => onEditRefill(entry)}
                        title="Edit this refill"
                        style={{ width: '28px', height: '28px' }}
                      >
                        <Edit3 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
