package com.fueltracker.domain

import com.fueltracker.data.cloud.CloudFuelEntry

/** A refill with values derived using the Previous Fill-Up method (same as the web app). */
data class EnrichedEntry(
    val entry: CloudFuelEntry,
    val tripDistance: Double?,
    val previousFuelUsed: Double?,
    val mileage: Double?,
    val costPerDistance: Double?,
)

data class FuelStatistics(
    val totalDistance: Double = 0.0,
    val totalFuel: Double = 0.0,
    val totalSpending: Double = 0.0,
    val averageMileage: Double = 0.0,
    val averageFuelPrice: Double = 0.0,
    val averageCostPerDistance: Double = 0.0,
    val bestMileage: Double = 0.0,
    val latest: EnrichedEntry? = null,
)

object FuelStats {
    /** Newest first (by refill date), mileage = distance since previous fill / previous fill's litres. */
    fun enrich(entries: List<CloudFuelEntry>): List<EnrichedEntry> {
        val asc = entries.sortedBy { it.odometer }
        val enriched = asc.mapIndexed { i, cur ->
            var trip: Double? = null
            var prevFuel: Double? = null
            var mileage: Double? = null
            var cpd: Double? = null
            if (i > 0) {
                val prev = asc[i - 1]
                val dist = cur.odometer - prev.odometer
                if (dist > 0) {
                    trip = dist
                    prevFuel = prev.fuelAmount
                    mileage = if (prev.fuelAmount > 0) dist / prev.fuelAmount else null
                    cpd = if (cur.totalCost > 0) cur.totalCost / dist else null
                }
            }
            EnrichedEntry(cur, trip, prevFuel, mileage, cpd)
        }
        return enriched.sortedWith(compareByDescending<EnrichedEntry> { it.entry.refillDate }.thenByDescending { it.entry.odometer })
    }

    fun statistics(entries: List<CloudFuelEntry>): FuelStatistics {
        if (entries.isEmpty()) return FuelStatistics()
        val asc = entries.sortedBy { it.odometer }
        var distance = 0.0
        var fuelForMileage = 0.0
        val mileages = mutableListOf<Double>()
        for (i in 1 until asc.size) {
            val d = asc[i].odometer - asc[i - 1].odometer
            val f = asc[i - 1].fuelAmount
            if (d > 0 && f > 0) {
                distance += d
                fuelForMileage += f
                mileages += d / f
            }
        }
        val spending = asc.sumOf { it.totalCost }
        val fuel = asc.sumOf { it.fuelAmount }
        return FuelStatistics(
            totalDistance = distance,
            totalFuel = fuel,
            totalSpending = spending,
            averageMileage = if (fuelForMileage > 0) distance / fuelForMileage else 0.0,
            averageFuelPrice = if (fuel > 0) spending / fuel else 0.0,
            averageCostPerDistance = if (distance > 0) spending / distance else 0.0,
            bestMileage = mileages.maxOrNull() ?: 0.0,
            latest = enrich(entries).firstOrNull(),
        )
    }
}
