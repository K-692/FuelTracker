/**
 * FuelCalculator.js
 * Implements the core mathematical formulas for the FuelTracker application.
 * 
 * Working Principle: The Previous Fill-Up Method.
 * Mileage is calculated using the distance traveled since the last fill-up
 * divided by the fuel volume added in that PREVIOUS fill-up (the fuel actually consumed).
 */

export const FuelCalculator = {
  /**
   * Calculates fuel efficiency / mileage.
   * @param {number} distance - Distance traveled (km or miles).
   * @param {number} fuel - Fuel quantity consumed from previous refill (Liters or Gallons).
   * @returns {number|null} Mileage (km/L) or null if invalid.
   */
  mileage(distance, fuel) {
    if (!distance || !fuel || distance <= 0 || fuel <= 0) return null;
    return distance / fuel;
  },

  /**
   * Calculates unit fuel price.
   * @param {number} cost - Total monetary cost of the refill.
   * @param {number} quantity - Quantity of fuel pumped.
   * @returns {number|null} Price per unit or null.
   */
  fuelPrice(cost, quantity) {
    if (!cost || !quantity || cost <= 0 || quantity <= 0) return null;
    return cost / quantity;
  },

  /**
   * Calculates distance between consecutive odometer readings.
   * @param {number} previousOdo 
   * @param {number} currentOdo 
   * @returns {number}
   */
  distance(previousOdo, currentOdo) {
    return (currentOdo || 0) - (previousOdo || 0);
  },

  /**
   * Calculates monetary cost per distance unit.
   * @param {number} totalCost 
   * @param {number} distance 
   * @returns {number|null}
   */
  costPerKm(totalCost, distance) {
    if (!totalCost || !distance || totalCost <= 0 || distance <= 0) return null;
    return totalCost / distance;
  },

  /**
   * Computes enriched trip metrics for all entries of a vehicle.
   * @param {Array} entries - List of fuel entries for a single vehicle.
   * @returns {Array} List of enriched entries sorted in descending chronological order.
   */
  enrichEntries(entries = []) {
    if (!entries || entries.length === 0) return [];

    // Sort ascending by odometer to calculate delta metrics
    const sortedAsc = [...entries].sort((a, b) => (Number(a.odometer) || 0) - (Number(b.odometer) || 0));

    const enriched = sortedAsc.map((current, index) => {
      let tripDistance = null;
      let calculatedMileage = null;
      let costPerUnitDistance = null;
      let previousFuelUsed = null;

      if (index > 0) {
        const prev = sortedAsc[index - 1];
        const dist = (Number(current.odometer) || 0) - (Number(prev.odometer) || 0);
        if (dist > 0) {
          tripDistance = dist;
          previousFuelUsed = Number(prev.fuelAmount) || 0;
          calculatedMileage = this.mileage(dist, previousFuelUsed);
          costPerUnitDistance = this.costPerKm(Number(current.totalCost) || 0, dist);
        }
      }

      const pricePerL = Number(current.pricePerLiter) || 
        this.fuelPrice(Number(current.totalCost) || 0, Number(current.fuelAmount) || 0);

      return {
        ...current,
        tripDistance,
        previousFuelUsed,
        calculatedMileage,
        costPerUnitDistance,
        pricePerLiter: pricePerL,
      };
    });

    // Return in reverse chronological order (newest first for UI display)
    return enriched.sort((a, b) => new Date(b.refillDate).getTime() - new Date(a.refillDate).getTime());
  },

  /**
   * Computes comprehensive summary and time-series statistics.
   * Mirrors StatisticsViewModel.kt logic.
   * @param {Array} entries - Fuel entries.
   * @returns {Object}
   */
  calculateStatistics(entries = []) {
    if (!entries || entries.length === 0) {
      return {
        totalDistance: 0,
        totalFuel: 0,
        totalSpending: 0,
        averageMileage: 0,
        averageFuelPrice: 0,
        averageCostPerKm: 0,
        highestMileage: 0,
        lowestMileage: 0,
        latestRefill: null,
        mileageHistory: [],
        costHistory: [],
        fuelPriceHistory: [],
      };
    }

    const sortedAsc = [...entries].sort((a, b) => (Number(a.odometer) || 0) - (Number(b.odometer) || 0));

    let totalDistance = 0;
    let totalFuelForMileage = 0;
    let totalSpending = 0;
    let totalFuelQuantity = 0;

    const mileageHistory = [];
    const costHistory = [];
    const fuelPriceHistory = [];
    const mileageValues = [];

    for (let i = 1; i < sortedAsc.length; i++) {
      const prev = sortedAsc[i - 1];
      const current = sortedAsc[i];
      const distance = (Number(current.odometer) || 0) - (Number(prev.odometer) || 0);
      const prevFuel = Number(prev.fuelAmount) || 0;

      if (distance > 0 && prevFuel > 0) {
        totalDistance += distance;
        totalFuelForMileage += prevFuel;
        const tripMileage = this.mileage(distance, prevFuel);
        if (tripMileage) {
          mileageHistory.push({
            date: current.refillDate,
            mileage: Number(tripMileage.toFixed(2)),
            odometer: current.odometer,
          });
          mileageValues.push(tripMileage);
        }
      }
    }

    sortedAsc.forEach((entry) => {
      const cost = Number(entry.totalCost) || 0;
      const amount = Number(entry.fuelAmount) || 0;
      const price = Number(entry.pricePerLiter) || (amount > 0 ? cost / amount : 0);

      totalSpending += cost;
      totalFuelQuantity += amount;

      costHistory.push({
        date: entry.refillDate,
        cost: cost,
        odometer: entry.odometer,
      });

      if (price > 0) {
        fuelPriceHistory.push({
          date: entry.refillDate,
          price: Number(price.toFixed(2)),
          fuelType: entry.fuelTypeName || 'Regular',
        });
      }
    });

    const averageMileage = totalFuelForMileage > 0 ? (totalDistance / totalFuelForMileage) : 0;
    const averageFuelPrice = totalFuelQuantity > 0 ? (totalSpending / totalFuelQuantity) : 0;
    const averageCostPerKm = totalDistance > 0 ? (totalSpending / totalDistance) : 0;

    // Identify latest refill
    const sortedByDateDesc = [...sortedAsc].sort((a, b) => new Date(b.refillDate).getTime() - new Date(a.refillDate).getTime());
    const enrichedList = this.enrichEntries(entries);
    const latestRefill = enrichedList.length > 0 ? enrichedList[0] : null;

    return {
      totalDistance: Number(totalDistance.toFixed(1)),
      totalFuel: Number(totalFuelQuantity.toFixed(2)),
      totalSpending: Number(totalSpending.toFixed(2)),
      averageMileage: Number(averageMileage.toFixed(2)),
      averageFuelPrice: Number(averageFuelPrice.toFixed(2)),
      averageCostPerKm: Number(averageCostPerKm.toFixed(2)),
      highestMileage: mileageValues.length > 0 ? Number(Math.max(...mileageValues).toFixed(2)) : 0,
      lowestMileage: mileageValues.length > 0 ? Number(Math.min(...mileageValues).toFixed(2)) : 0,
      latestRefill,
      mileageHistory,
      costHistory,
      fuelPriceHistory,
    };
  }
};
