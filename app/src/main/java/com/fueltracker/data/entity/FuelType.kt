package com.fueltracker.data.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "fuel_types")
data class FuelType(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val name: String,
    val category: String,
    val brand: String? = null,
    val isSystemFuel: Boolean = false
)
