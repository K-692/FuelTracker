package com.fueltracker.data.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

enum class VehicleType {
    BIKE, CAR, SCOOTER, OTHER
}

@Entity(tableName = "vehicles")
data class Vehicle(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val name: String,
    val registrationNumber: String? = null,
    val vehicleType: VehicleType,
    val manufacturer: String? = null,
    val model: String? = null,
    val year: Int? = null,
    val createdAt: Long = System.currentTimeMillis()
)
