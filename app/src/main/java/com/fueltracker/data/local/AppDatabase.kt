package com.fueltracker.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import com.fueltracker.data.entity.FuelEntry
import com.fueltracker.data.entity.FuelType
import com.fueltracker.data.entity.Vehicle

@Database(
    entities = [Vehicle::class, FuelType::class, FuelEntry::class],
    version = 2,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun vehicleDao(): VehicleDao
    abstract fun fuelTypeDao(): FuelTypeDao
    abstract fun fuelEntryDao(): FuelEntryDao
}
