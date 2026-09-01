package com.fueltracker.data.repository

import com.fueltracker.data.entity.FuelEntry
import com.fueltracker.data.entity.FuelType
import com.fueltracker.data.entity.Vehicle
import com.fueltracker.data.local.FuelEntryDao
import com.fueltracker.data.local.FuelTypeDao
import com.fueltracker.data.local.VehicleDao
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FuelRepository @Inject constructor(
    private val vehicleDao: VehicleDao,
    private val fuelTypeDao: FuelTypeDao,
    private val fuelEntryDao: FuelEntryDao
) {
    // Vehicles
    fun getAllVehicles(): Flow<List<Vehicle>> = vehicleDao.getAllVehicles()
    suspend fun getVehicleById(id: Long): Vehicle? = vehicleDao.getVehicleById(id)
    suspend fun insertVehicle(vehicle: Vehicle): Long = vehicleDao.insertVehicle(vehicle)
    suspend fun updateVehicle(vehicle: Vehicle) = vehicleDao.updateVehicle(vehicle)
    suspend fun deleteVehicle(vehicle: Vehicle) = vehicleDao.deleteVehicle(vehicle)

    // Fuel Types
    fun getAllFuelTypes(): Flow<List<FuelType>> = fuelTypeDao.getAllFuelTypes()
    suspend fun insertFuelType(fuelType: FuelType) = fuelTypeDao.insertFuelType(fuelType)
    suspend fun prefillFuelTypes(fuelTypes: List<FuelType>) {
        if (fuelTypeDao.getCount() == 0) {
            fuelTypeDao.insertAll(fuelTypes)
        }
    }

    // Fuel Entries
    fun getFuelEntries(vehicleId: Long): Flow<List<FuelEntry>> = fuelEntryDao.getFuelEntries(vehicleId)
    fun getLastFuelEntry(vehicleId: Long): Flow<FuelEntry?> = fuelEntryDao.getLastFuelEntry(vehicleId)
    suspend fun getPreviousFuelEntry(vehicleId: Long, currentOdometer: Double): FuelEntry? =
        fuelEntryDao.getPreviousFuelEntry(vehicleId, currentOdometer)
    suspend fun insertFuelEntry(fuelEntry: FuelEntry): Long = fuelEntryDao.insertFuelEntry(fuelEntry)
    suspend fun updateFuelEntry(fuelEntry: FuelEntry) = fuelEntryDao.updateFuelEntry(fuelEntry)
    suspend fun deleteFuelEntry(fuelEntry: FuelEntry) = fuelEntryDao.deleteFuelEntry(fuelEntry)
    suspend fun getFuelEntryById(id: Long): FuelEntry? = fuelEntryDao.getFuelEntryById(id)
}
