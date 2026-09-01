package com.fueltracker.data.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "fuel_entries",
    foreignKeys = [
        ForeignKey(
            entity = Vehicle::class,
            parentColumns = ["id"],
            childColumns = ["vehicleId"],
            onDelete = ForeignKey.CASCADE
        ),
        ForeignKey(
            entity = FuelType::class,
            parentColumns = ["id"],
            childColumns = ["fuelTypeId"],
            onDelete = ForeignKey.RESTRICT
        )
    ],
    indices = [Index("vehicleId"), Index("fuelTypeId")]
)
data class FuelEntry(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val vehicleId: Long,
    val fuelTypeId: Long,
    val odometer: Double,
    val fuelAmount: Double,
    val totalCost: Double,
    val pricePerLiter: Double,
    val refillDate: Long,
    val notes: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)
