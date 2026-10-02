import React, { useState } from 'react';
import { 
  Gauge, 
  TrendingUp, 
  DollarSign, 
  Fuel, 
  Award, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { FuelCalculator } from '../domain/FuelCalculator';
import { LineChart, BarChart } from './Charts';

export function Analytics({ 
  vehicles = [], 
  activeVehicleId, 
  onSelectVehicle, 
  entries = [],
  currency = '₹',
  unit = 'km'
}) {
  const [timeFilter, setTimeFilter] = useState('ALL'); // '30D', '90D', '1Y', 'ALL'

  const activeVehicle = vehicles.find(v => v.id === activeVehicleId) || vehicles[0];
  const vehicleEntries = entries.filter(e => e.vehicleId === activeVehicleId);

  // Time filter logic
  const now = Date.now();
  const filteredEntries = vehicleEntries.filter(e => {
    if (timeFilter === 'ALL') return true;
    const entryDate = new Date(e.refillDate).getTime();
    if (timeFilter === '30D') return (now - entryDate) <= 30 * 86400000;
    if (timeFilter === '90D') return (now - entryDate) <= 90 * 86400000;
    if (timeFilter === '1Y') return (now - entryDate) <= 365 * 86400000;
    return true;
  });

  const stats = FuelCalculator.calculateStatistics(filteredEntries);

  return (
    <div className="analytics-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '4px' }}>
            Vehicle Telemetry & Analytics
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Visual efficiency curves, cost trends, and fuel price analysis for <strong style={{ color: 'var(--text-main)' }}>{activeVehicle?.name}</strong>
          </p>
        </div>

        {/* Time Period Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-surface-elevated)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          {['ALL', '1Y', '90D', '30D'].map(period => (
            <button
              key={period}
              className={`btn btn-ghost ${timeFilter === period ? 'active' : ''}`}
              style={{ 
                padding: '6px 12px', 
                fontSize: '0.82rem', 
                borderRadius: 'var(--radius-sm)',
                background: timeFilter === period ? 'var(--color-primary)' : 'transparent',
                color: timeFilter === period ? '#ffffff' : 'var(--text-muted)'
              }}
              onClick={() => setTimeFilter(period)}
            >
              {period === 'ALL' ? 'All Time' : period}
            </button>
          ))}
        </div>
      </div>

      {/* Vehicle Selector Pills */}
      <div className="vehicle-selector-bar" style={{ marginBottom: '24px' }}>
        {vehicles.map(v => (
          <button
            key={v.id}
            className={`vehicle-pill ${v.id === activeVehicleId ? 'active' : ''}`}
            onClick={() => onSelectVehicle(v.id)}
          >
            <span>{v.name}</span>
          </button>
        ))}
      </div>

      {filteredEntries.length < 2 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 20px', marginBottom: '24px' }}>
          <AlertCircle size={40} color="var(--color-accent-fuel)" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Insufficient Data for Analytics</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto', fontSize: '0.9rem' }}>
            Mileage calculation requires at least two consecutive fill-ups to evaluate the distance traveled against the previous refill's fuel volume.
          </p>
        </div>
      ) : (
        <>
          {/* High-Level Benchmark Cards */}
          <div className="stats-grid" style={{ marginBottom: '28px' }}>
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-label">Average Mileage</span>
                <div className="stat-icon" style={{ background: 'var(--color-primary-glow)', color: 'var(--color-primary)' }}>
                  <Gauge size={18} />
                </div>
              </div>
              <div className="stat-value" style={{ color: 'var(--color-primary)' }}>
                {stats.averageMileage} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{unit}/L</span>
              </div>
              <div className="stat-subtext">True lifetime average efficiency</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-label">Best Mileage Record</span>
                <div className="stat-icon" style={{ background: 'var(--color-primary-glow)', color: 'var(--color-primary)' }}>
                  <Award size={18} />
                </div>
              </div>
              <div className="stat-value" style={{ color: 'var(--color-primary)' }}>
                {stats.highestMileage > 0 ? stats.highestMileage : '--'} 
                <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}> {unit}/L</span>
              </div>
              <div className="stat-subtext">Peak economy trip logged</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-label">Operating Cost</span>
                <div className="stat-icon" style={{ background: 'var(--color-accent-fuel-glow)', color: 'var(--color-accent-fuel)' }}>
                  <DollarSign size={18} />
                </div>
              </div>
              <div className="stat-value">
                {currency}{stats.averageCostPerKm} 
                <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}> /{unit}</span>
              </div>
              <div className="stat-subtext">Net cost to travel 1 {unit}</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-label">Avg Fuel Price</span>
                <div className="stat-icon" style={{ background: 'var(--color-accent-blue-glow)', color: 'var(--color-accent-blue)' }}>
                  <Fuel size={18} />
                </div>
              </div>
              <div className="stat-value">
                {currency}{stats.averageFuelPrice.toFixed(1)} 
                <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}> /L</span>
              </div>
              <div className="stat-subtext">Weighted pump price per liter</div>
            </div>
          </div>

          {/* Chart 1: True Mileage Trend Line */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Mileage Trajectory Curve ({unit}/L)</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Each data point evaluates distance traveled divided by the fuel filled in the preceding refill.
                </p>
              </div>
              <span className="badge badge-primary">Previous Fill Formulation</span>
            </div>

            <LineChart 
              data={stats.mileageHistory}
              valueKey="mileage"
              labelKey="date"
              color="#52c41a"
              unit={`${unit}/L`}
              average={stats.averageMileage}
              height={260}
            />
          </div>

          {/* Chart 2: Fuel Expenditure per Refill */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div className="card">
              <div style={{ marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Refill Expenditure ({currency})</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  Total cost paid per fuel purchase.
                </p>
              </div>

              <BarChart 
                data={stats.costHistory}
                valueKey="cost"
                labelKey="date"
                color="#fa8c16"
                currency={currency}
                height={220}
              />
            </div>

            {/* Chart 3: Fuel Price Evolution */}
            <div className="card">
              <div style={{ marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Fuel Price Trend ({currency}/L)</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  Pump price fluctuation across fill-up dates.
                </p>
              </div>

              <LineChart 
                data={stats.fuelPriceHistory}
                valueKey="price"
                labelKey="date"
                color="#fadb14"
                unit={`${currency}/L`}
                average={stats.averageFuelPrice}
                height={220}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
