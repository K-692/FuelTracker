package com.fueltracker.data.local

import androidx.room.*
import com.fueltracker.data.entity.FuelType
import kotlinx.coroutines.flow.Flow

@Dao
interface FuelTypeDao {
    @Query("SELECT * FROM fuel_types ORDER BY isSystemFuel DESC, name ASC")
    fun getAllFuelTypes(): Flow<List<FuelType>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertFuelType(fuelType: FuelType): Long

    @Query("SELECT COUNT(*) FROM fuel_types")
    suspend fun getCount(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(fuelTypes: List<FuelType>)
}
