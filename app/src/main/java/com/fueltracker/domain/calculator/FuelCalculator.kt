package com.fueltracker.domain.calculator

object FuelCalculator {
    fun mileage(distance: Double, fuel: Double): Double? {
        if (distance <= 0 || fuel <= 0) return null
        return distance / fuel
    }

    fun fuelPrice(cost: Double, quantity: Double): Double? {
        if (cost <= 0 || quantity <= 0) return null
        return cost / quantity
    }

    fun distance(previous: Double, current: Double): Double {
        return current - previous
    }

    fun costPerKm(totalCost: Double, distance: Double): Double? {
        if (totalCost <= 0 || distance <= 0) return null
        return totalCost / distance
    }
}
