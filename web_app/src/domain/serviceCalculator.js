/**
 * serviceCalculator.js
 * Mathematical engine for vehicle maintenance, engine oil telemetry tracking,
 * and component price / frequency analytics.
 */

import { SERVICE_COMPONENTS } from './serviceComponents';

export const ServiceCalculator = {
  /**
   * Determines the latest known odometer reading for a vehicle.
   * Compares all fuel refill entries and service entries.
   *
   * @param {Array} fuelEntries - Fuel entries for the vehicle
   * @param {Array} serviceEntries - Service entries for the vehicle
   * @returns {number} Latest odometer reading
   */
  getLatestOdometer(fuelEntries = [], serviceEntries = []) {
    let maxOdo = 0;
    fuelEntries.forEach(e => {
      const odo = Number(e.odometer) || 0;
      if (odo > maxOdo) maxOdo = odo;
    });
    serviceEntries.forEach(s => {
      const odo = Number(s.odometer) || 0;
      if (odo > maxOdo) maxOdo = odo;
    });
    return maxOdo;
  },

  /**
   * Determines the baseline (minimum/initial) odometer reading for a vehicle.
   */
  getBaselineOdometer(fuelEntries = [], serviceEntries = []) {
    let minOdo = Infinity;
    fuelEntries.forEach(e => {
      const odo = Number(e.odometer) || 0;
      if (odo > 0 && odo < minOdo) minOdo = odo;
    });
    serviceEntries.forEach(s => {
      const odo = Number(s.odometer) || 0;
      if (odo > 0 && odo < minOdo) minOdo = odo;
    });
    return minOdo === Infinity ? 0 : minOdo;
  },

  /**
   * Calculates the Engine Oil status and remaining kilometers until next service.
   * 
   * Rule:
   * Engine oil should ideally be changed every X kms (default: 5,000 km, user configurable).
   * 
   * @param {Array} serviceEntries - All service entries for the active vehicle
   * @param {Array} fuelEntries - All fuel entries for the active vehicle
   * @param {number} intervalKm - Configured engine oil change interval (default 5000)
   * @returns {Object} {
   *   hasHistory: boolean,
   *   currentOdometer: number,
   *   lastOilOdometer: number|null,
   *   lastOilDate: string|null,
   *   distanceDriven: number,
   *   intervalKm: number,
   *   remainingKm: number,
   *   nextDueOdometer: number,
   *   status: 'ok' | 'warning' | 'overdue' | 'no_service_recorded',
   *   percentElapsed: number
   * }
   */
  calculateEngineOilStatus(serviceEntries = [], fuelEntries = [], intervalKm = 5000) {
    const currentOdo = this.getLatestOdometer(fuelEntries, serviceEntries);
    const baselineOdo = this.getBaselineOdometer(fuelEntries, serviceEntries);
    const safeInterval = Number(intervalKm) > 0 ? Number(intervalKm) : 5000;

    // Filter service entries where Engine Oil was changed (component 'engine_oil')
    const oilServices = (serviceEntries || []).filter(s => {
      const comp = s.components?.['engine_oil'];
      return comp && comp.done === true;
    });

    if (oilServices.length === 0) {
      // No recorded engine oil service yet
      const totalDriven = Math.max(0, currentOdo - baselineOdo);
      const remainingKm = safeInterval - totalDriven;
      const nextDue = (currentOdo > 0 ? currentOdo : 0) + Math.max(0, remainingKm);

      let status = 'no_service_recorded';
      if (currentOdo > 0 && totalDriven >= safeInterval) {
        status = 'overdue';
      } else if (currentOdo > 0 && remainingKm <= 500 && remainingKm > 0) {
        status = 'warning';
      }

      return {
        hasHistory: false,
        currentOdometer: currentOdo,
        lastOilOdometer: null,
        lastOilDate: null,
        distanceDriven: totalDriven,
        intervalKm: safeInterval,
        remainingKm,
        nextDueOdometer: nextDue,
        status,
        percentElapsed: Math.min(100, Math.max(0, (totalDriven / safeInterval) * 100)),
      };
    }

    // Sort oil services by date and odometer descending (newest first)
    const sortedOilServices = [...oilServices].sort((a, b) => {
      const dateA = new Date(a.serviceDate).getTime() || 0;
      const dateB = new Date(b.serviceDate).getTime() || 0;
      if (dateB !== dateA) return dateB - dateA;
      return (Number(b.odometer) || 0) - (Number(a.odometer) || 0);
    });

    const latestOilService = sortedOilServices[0];
    const lastOilOdo = Number(latestOilService.odometer) || 0;
    const distanceDriven = Math.max(0, currentOdo - lastOilOdo);
    const remainingKm = safeInterval - distanceDriven;
    const nextDueOdometer = lastOilOdo + safeInterval;
    const percentElapsed = Math.min(100, Math.max(0, (distanceDriven / safeInterval) * 100));

    let status = 'ok';
    if (remainingKm <= 0) {
      status = 'overdue';
    } else if (remainingKm <= 500) {
      status = 'warning';
    }

    return {
      hasHistory: true,
      currentOdometer: currentOdo,
      lastOilOdometer: lastOilOdo,
      lastOilDate: latestOilService.serviceDate,
      distanceDriven,
      intervalKm: safeInterval,
      remainingKm,
      nextDueOdometer,
      status,
      percentElapsed,
    };
  },

  /**
   * Aggregates component-level service counts and total expense for a vehicle.
   *
   * @param {Array} serviceEntries - Service entries for the vehicle
   * @returns {Array} List of components with count, totalSpend, and lastServiceDate
   */
  calculateComponentFrequency(serviceEntries = []) {
    const map = new Map();

    // Initialize all components with 0 count
    SERVICE_COMPONENTS.forEach(c => {
      map.set(c.id, {
        id: c.id,
        number: c.number,
        name: c.name,
        category: c.category,
        vehicleLabel: c.vehicleLabel,
        count: 0,
        totalSpend: 0,
        history: [],
      });
    });

    serviceEntries.forEach(entry => {
      if (!entry.components) return;
      Object.entries(entry.components).forEach(([compId, data]) => {
        if (data && data.done) {
          const item = map.get(compId) || {
            id: compId,
            number: 99,
            name: compId,
            category: 'Other',
            vehicleLabel: 'Both',
            count: 0,
            totalSpend: 0,
            history: [],
          };

          const price = Number(data.price) || 0;
          item.count += 1;
          item.totalSpend += price;
          item.history.push({
            serviceId: entry.id,
            date: entry.serviceDate,
            odometer: Number(entry.odometer) || 0,
            price,
          });
          map.set(compId, item);
        }
      });
    });

    return Array.from(map.values())
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count || b.totalSpend - a.totalSpend);
  },

  /**
   * Generates chronological price points for a specific component over time.
   *
   * @param {Array} serviceEntries - Service entries for the vehicle
   * @param {string} componentId - ID of the component (e.g. 'engine_oil')
   * @returns {Object} { data: Array<{ date, price, odometer }>, minPrice, maxPrice, avgPrice, priceChangePct }
   */
  calculateComponentPriceTrajectory(serviceEntries = [], componentId = 'engine_oil') {
    const points = [];

    // Sort service entries ascending by date
    const sorted = [...serviceEntries].sort((a, b) => {
      const tA = new Date(a.serviceDate).getTime() || 0;
      const tB = new Date(b.serviceDate).getTime() || 0;
      return tA - tB;
    });

    sorted.forEach(entry => {
      const comp = entry.components?.[componentId];
      if (comp && comp.done) {
        points.push({
          date: entry.serviceDate,
          price: Number(comp.price) || 0,
          odometer: Number(entry.odometer) || 0,
          serviceId: entry.id,
        });
      }
    });

    if (points.length === 0) {
      return {
        data: [],
        minPrice: 0,
        maxPrice: 0,
        avgPrice: 0,
        priceChangePct: 0,
      };
    }

    const prices = points.map(p => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const total = prices.reduce((acc, curr) => acc + curr, 0);
    const avgPrice = Math.round(total / prices.length);

    let priceChangePct = 0;
    if (points.length >= 2) {
      const first = points[0].price;
      const last = points[points.length - 1].price;
      if (first > 0) {
        priceChangePct = Math.round(((last - first) / first) * 100);
      }
    }

    return {
      data: points,
      minPrice,
      maxPrice,
      avgPrice,
      priceChangePct,
    };
  },

  /**
   * Computes lifetime servicing metrics for a vehicle.
   */
  calculateLifetimeServiceMetrics(serviceEntries = []) {
    const count = serviceEntries.length;
    let totalExpenditure = 0;
    serviceEntries.forEach(s => {
      totalExpenditure += Number(s.totalCost) || 0;
    });

    const averagePerService = count > 0 ? Math.round(totalExpenditure / count) : 0;

    return {
      totalServices: count,
      totalCost: totalExpenditure,
      averageCost: averagePerService,
    };
  }
};
