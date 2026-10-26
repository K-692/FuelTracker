/**
 * serviceCalculator.js
 * Mathematical engine for vehicle maintenance, engine oil telemetry tracking,
 * and component price / frequency analytics.
 */

import { SERVICE_COMPONENTS } from './serviceComponents.js';

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
   * Helper: Adds N months to a date string (YYYY-MM-DD) or Date object,
   * properly clamping month-end dates (e.g., Aug 31 + 6 months -> Feb 28).
   *
   * @param {string|Date} dateInput 
   * @param {number} months 
   * @returns {Date|null}
   */
  addMonths(dateInput, months) {
    if (!dateInput) return null;
    let d;
    if (typeof dateInput === 'string' && dateInput.includes('-') && dateInput.length === 10) {
      const [y, m, day] = dateInput.split('-').map(Number);
      d = new Date(y, m - 1, day);
    } else {
      d = new Date(dateInput);
    }
    if (isNaN(d.getTime())) return null;

    const originalDay = d.getDate();
    d.setMonth(d.getMonth() + Number(months));
    // If date wrapped over (e.g. 31st into a month with 30 or 28 days), clamp to month-end
    if (d.getDate() !== originalDay) {
      d.setDate(0);
    }
    return d;
  },

  /**
   * Formats a Date object to YYYY-MM-DD string.
   *
   * @param {Date} d 
   * @returns {string|null}
   */
  formatDateISO(d) {
    if (!d || isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  /**
   * Calculates the Engine Oil status and remaining telemetry until next service.
   * 
   * Automotive Dual-Threshold Rule:
   * Engine oil should be changed every X kms (default: 5,000 km) OR every Y months
   * (default: 6 months) from the last recorded oil change, whichever comes first.
   * 
   * @param {Array} serviceEntries - All service entries for the active vehicle
   * @param {Array} fuelEntries - All fuel entries for the active vehicle
   * @param {number} intervalKm - Configured engine oil distance interval (default 5000)
   * @param {number} intervalMonths - Configured engine oil time interval in months (default 6)
   * @param {Date|string} referenceDate - Reference date for calculation (defaults to current date)
   * @returns {Object} Comprehensive telemetry metrics:
   *   hasHistory: boolean,
   *   currentOdometer: number,
   *   lastOilOdometer: number|null,
   *   lastOilDate: string|null,
   *   intervalKm: number,
   *   distanceDriven: number,
   *   remainingKm: number,
   *   nextDueOdometer: number,
   *   percentKmElapsed: number,
   *   isKmOverdue: boolean,
   *   isKmWarning: boolean,
   *   intervalMonths: number,
   *   nextDueDate: string|null,
   *   remainingDays: number|null,
   *   remainingMonths: number|null,
   *   daysElapsed: number,
   *   monthsElapsed: number,
   *   totalIntervalDays: number,
   *   percentTimeElapsed: number,
   *   isTimeOverdue: boolean,
   *   isTimeWarning: boolean,
   *   status: 'ok' | 'warning' | 'overdue' | 'no_service_recorded',
   *   primaryTrigger: 'distance' | 'time' | 'both' | 'none',
   *   percentElapsed: number
   */
  calculateEngineOilStatus(
    serviceEntries = [], 
    fuelEntries = [], 
    intervalKm = 5000, 
    intervalMonths = 6, 
    referenceDate = new Date()
  ) {
    const currentOdo = this.getLatestOdometer(fuelEntries, serviceEntries);
    const baselineOdo = this.getBaselineOdometer(fuelEntries, serviceEntries);
    const safeIntervalKm = Number(intervalKm) > 0 ? Number(intervalKm) : 5000;
    const safeIntervalMonths = Number(intervalMonths) > 0 ? Number(intervalMonths) : 6;

    const today = new Date(referenceDate);
    today.setHours(0, 0, 0, 0);
    const msPerDay = 1000 * 60 * 60 * 24;

    // Filter service entries where Engine Oil was changed (component 'engine_oil')
    const oilServices = (serviceEntries || []).filter(s => {
      const comp = s.components?.['engine_oil'];
      return comp && comp.done === true;
    });

    if (oilServices.length === 0) {
      // No recorded engine oil service yet
      const distanceDriven = Math.max(0, currentOdo - baselineOdo);
      const remainingKm = safeIntervalKm - distanceDriven;
      const nextDueOdometer = (currentOdo > 0 ? currentOdo : 0) + Math.max(0, remainingKm);
      const percentKmElapsed = Math.min(100, Math.max(0, (distanceDriven / safeIntervalKm) * 100));

      const isKmOverdue = currentOdo > 0 && distanceDriven >= safeIntervalKm;
      const isKmWarning = currentOdo > 0 && remainingKm <= 500 && remainingKm > 0;

      // Check if any baseline date exists in fuel or service entries
      const allDates = [
        ...(fuelEntries || []).map(e => e.refillDate),
        ...(serviceEntries || []).map(s => s.serviceDate)
      ].filter(Boolean).sort();
      const baselineDate = allDates.length > 0 ? allDates[0] : null;

      let nextDueDate = null;
      let remainingDays = null;
      let remainingMonths = null;
      let daysElapsed = 0;
      let monthsElapsed = 0;
      let totalIntervalDays = safeIntervalMonths * 30;
      let percentTimeElapsed = 0;
      let isTimeOverdue = false;
      let isTimeWarning = false;

      if (baselineDate) {
        const nextDueDateObj = this.addMonths(baselineDate, safeIntervalMonths);
        if (nextDueDateObj) {
          nextDueDate = this.formatDateISO(nextDueDateObj);
          const targetTime = new Date(nextDueDateObj).setHours(0, 0, 0, 0);
          const baseTime = new Date(baselineDate).setHours(0, 0, 0, 0);

          remainingDays = Math.round((targetTime - today.getTime()) / msPerDay);
          totalIntervalDays = Math.max(1, Math.round((targetTime - baseTime) / msPerDay));
          daysElapsed = Math.max(0, totalIntervalDays - remainingDays);
          percentTimeElapsed = Math.min(100, Math.max(0, (daysElapsed / totalIntervalDays) * 100));
          remainingMonths = Number((remainingDays / 30.4375).toFixed(1));
          monthsElapsed = Number((daysElapsed / 30.4375).toFixed(1));

          isTimeOverdue = remainingDays <= 0;
          isTimeWarning = remainingDays > 0 && remainingDays <= 30;
        }
      }

      let status = 'no_service_recorded';
      if (isKmOverdue || isTimeOverdue) {
        status = 'overdue';
      } else if (isKmWarning || isTimeWarning) {
        status = 'warning';
      }

      const primaryTrigger = (isKmOverdue && isTimeOverdue)
        ? 'both'
        : isKmOverdue
        ? 'distance'
        : isTimeOverdue
        ? 'time'
        : (isKmWarning && isTimeWarning)
        ? 'both'
        : isKmWarning
        ? 'distance'
        : isTimeWarning
        ? 'time'
        : 'none';

      return {
        hasHistory: false,
        currentOdometer: currentOdo,
        lastOilOdometer: null,
        lastOilDate: null,
        // Distance telemetry
        intervalKm: safeIntervalKm,
        distanceDriven,
        remainingKm,
        nextDueOdometer,
        percentKmElapsed,
        isKmOverdue,
        isKmWarning,
        // Time telemetry
        intervalMonths: safeIntervalMonths,
        nextDueDate,
        remainingDays,
        remainingMonths,
        daysElapsed,
        monthsElapsed,
        totalIntervalDays,
        percentTimeElapsed,
        isTimeOverdue,
        isTimeWarning,
        // Combined status
        status,
        primaryTrigger,
        percentElapsed: Math.max(percentKmElapsed, percentTimeElapsed),
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
    const lastOilDate = latestOilService.serviceDate;

    // 1. Distance Telemetry
    const distanceDriven = Math.max(0, currentOdo - lastOilOdo);
    const remainingKm = safeIntervalKm - distanceDriven;
    const nextDueOdometer = lastOilOdo + safeIntervalKm;
    const percentKmElapsed = Math.min(100, Math.max(0, (distanceDriven / safeIntervalKm) * 100));

    const isKmOverdue = remainingKm <= 0;
    const isKmWarning = remainingKm > 0 && remainingKm <= 500;

    // 2. Time Telemetry (Months)
    const nextDueDateObj = this.addMonths(lastOilDate, safeIntervalMonths);
    const nextDueDate = nextDueDateObj ? this.formatDateISO(nextDueDateObj) : null;
    
    let remainingDays = null;
    let remainingMonths = null;
    let daysElapsed = 0;
    let monthsElapsed = 0;
    let totalIntervalDays = safeIntervalMonths * 30;
    let percentTimeElapsed = 0;
    let isTimeOverdue = false;
    let isTimeWarning = false;

    if (nextDueDateObj) {
      const targetTime = new Date(nextDueDateObj).setHours(0, 0, 0, 0);
      const lastOilTime = new Date(lastOilDate).setHours(0, 0, 0, 0);

      remainingDays = Math.round((targetTime - today.getTime()) / msPerDay);
      totalIntervalDays = Math.max(1, Math.round((targetTime - lastOilTime) / msPerDay));
      daysElapsed = Math.max(0, totalIntervalDays - remainingDays);
      percentTimeElapsed = Math.min(100, Math.max(0, (daysElapsed / totalIntervalDays) * 100));
      remainingMonths = Number((remainingDays / 30.4375).toFixed(1));
      monthsElapsed = Number((daysElapsed / 30.4375).toFixed(1));

      isTimeOverdue = remainingDays <= 0;
      isTimeWarning = remainingDays > 0 && remainingDays <= 30; // within 30 days
    }

    // 3. Combined Status Evaluation (Whichever comes first)
    let status = 'ok';
    if (isKmOverdue || isTimeOverdue) {
      status = 'overdue';
    } else if (isKmWarning || isTimeWarning) {
      status = 'warning';
    }

    const primaryTrigger = (isKmOverdue && isTimeOverdue)
      ? 'both'
      : isKmOverdue
      ? 'distance'
      : isTimeOverdue
      ? 'time'
      : (isKmWarning && isTimeWarning)
      ? 'both'
      : isKmWarning
      ? 'distance'
      : isTimeWarning
      ? 'time'
      : 'none';

    return {
      hasHistory: true,
      currentOdometer: currentOdo,
      lastOilOdometer: lastOilOdo,
      lastOilDate,
      // Distance telemetry
      intervalKm: safeIntervalKm,
      distanceDriven,
      remainingKm,
      nextDueOdometer,
      percentKmElapsed,
      isKmOverdue,
      isKmWarning,
      // Time telemetry
      intervalMonths: safeIntervalMonths,
      nextDueDate,
      remainingDays,
      remainingMonths,
      daysElapsed,
      monthsElapsed,
      totalIntervalDays,
      percentTimeElapsed,
      isTimeOverdue,
      isTimeWarning,
      // Combined evaluation
      status,
      primaryTrigger,
      percentElapsed: Math.max(percentKmElapsed, percentTimeElapsed),
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
