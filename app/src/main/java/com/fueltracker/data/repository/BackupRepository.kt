package com.fueltracker.data.repository

import android.content.Context
import android.os.Environment
import com.fueltracker.data.entity.FuelEntry
import com.fueltracker.data.entity.FuelType
import com.fueltracker.data.entity.Vehicle
import com.google.gson.Gson
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileWriter
import javax.inject.Inject
import javax.inject.Singleton

data class FuelTrackerBackup(
    val vehicles: List<Vehicle>,
    val fuelTypes: List<FuelType>,
    val fuelEntries: List<FuelEntry>
)

@Singleton
class BackupRepository @Inject constructor(
    private val fuelRepository: FuelRepository,
    private val gson: Gson,
    @ApplicationContext private val context: Context
) {
    private val backupFileName = "FuelTracker_AutoBackup.json"

    suspend fun exportData(): String {
        val vehicles = fuelRepository.getAllVehicles().first()
        val fuelTypes = fuelRepository.getAllFuelTypes().first()
        val fuelEntries = mutableListOf<FuelEntry>()
        
        vehicles.forEach { vehicle ->
            fuelEntries.addAll(fuelRepository.getFuelEntries(vehicle.id).first())
        }
        
        val backup = FuelTrackerBackup(vehicles, fuelTypes, fuelEntries)
        val json = gson.toJson(backup)
        
        // Auto-save a copy to a persistent location if possible
        saveToPersistentStorage(json)
        
        return json
    }

    private suspend fun saveToPersistentStorage(json: String) {
        withContext(Dispatchers.IO) {
            try {
                // We use getExternalFilesDir(null) as a base, but for true persistence across reinstalls
                // without cloud backup, a public folder is needed. 
                // However, Scoped Storage makes this tricky without a picker.
                // For now, we save it in a hidden app-specific external folder that some cleaners might skip.
                val dir = context.getExternalFilesDir(null)
                val file = File(dir, backupFileName)
                FileWriter(file).use { it.write(json) }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    suspend fun autoRestoreIfNeeded() {
        val vehicles = fuelRepository.getAllVehicles().first()
        if (vehicles.isEmpty()) {
            val dir = context.getExternalFilesDir(null)
            val file = File(dir, backupFileName)
            if (file.exists()) {
                val json = file.readText()
                importData(json)
            }
        }
    }

    suspend fun importData(json: String) {
        val backup = gson.fromJson(json, FuelTrackerBackup::class.java) ?: return
        
        val vehicleIdMap = mutableMapOf<Long, Long>()
        val fuelTypeIdMap = mutableMapOf<Long, Long>()

        backup.vehicles.forEach { vehicle ->
            val newId = fuelRepository.insertVehicle(vehicle.copy(id = 0))
            vehicleIdMap[vehicle.id] = newId
        }

        backup.fuelTypes.forEach { fuelType ->
            val existing = fuelRepository.getAllFuelTypes().first().find { it.name == fuelType.name }
            if (existing == null) {
                val newId = fuelRepository.insertFuelType(fuelType.copy(id = 0))
                fuelTypeIdMap[fuelType.id] = newId
            } else {
                fuelTypeIdMap[fuelType.id] = existing.id
            }
        }

        backup.fuelEntries.forEach { entry ->
            val newVehicleId = vehicleIdMap[entry.vehicleId]
            val newFuelTypeId = fuelTypeIdMap[entry.fuelTypeId]
            if (newVehicleId != null && newFuelTypeId != null) {
                fuelRepository.insertFuelEntry(entry.copy(
                    id = 0,
                    vehicleId = newVehicleId,
                    fuelTypeId = newFuelTypeId
                ))
            }
        }
    }
}
