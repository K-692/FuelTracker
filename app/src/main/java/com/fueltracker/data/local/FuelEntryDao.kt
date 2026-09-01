package com.fueltracker.data.local

import androidx.room.*
import com.fueltracker.data.entity.FuelEntry
import kotlinx.coroutines.flow.Flow

@Dao
interface FuelEntryDao {
    @Query("SELECT * FROM fuel_entries WHERE vehicleId = :vehicleId ORDER BY odometer DESC")
    fun getFuelEntries(vehicleId: Long): Flow<List<FuelEntry>>

    @Query("SELECT * FROM fuel_entries WHERE vehicleId = :vehicleId ORDER BY odometer DESC LIMIT 1")
    fun getLastFuelEntry(vehicleId: Long): Flow<FuelEntry?>

    @Query("SELECT * FROM fuel_entries WHERE vehicleId = :vehicleId AND odometer < :currentOdometer ORDER BY odometer DESC LIMIT 1")
    suspend fun getPreviousFuelEntry(vehicleId: Long, currentOdometer: Double): FuelEntry?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertFuelEntry(fuelEntry: FuelEntry): Long

    @Update
    suspend fun updateFuelEntry(fuelEntry: FuelEntry)

    @Delete
    suspend fun deleteFuelEntry(fuelEntry: FuelEntry)
    
    @Query("SELECT * FROM fuel_entries WHERE id = :id")
    suspend fun getFuelEntryById(id: Long): FuelEntry?
}
