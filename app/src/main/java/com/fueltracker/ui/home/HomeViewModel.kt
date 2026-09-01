package com.fueltracker.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fueltracker.data.entity.FuelEntry
import com.fueltracker.data.entity.Vehicle
import com.fueltracker.data.local.PreferenceManager
import com.fueltracker.data.repository.BackupRepository
import com.fueltracker.data.repository.FuelRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class HomeUiState(
    val selectedVehicle: Vehicle? = null,
    val averageMileage: Double? = null,
    val lastFuelAmount: Double? = null,
    val lastCost: Double? = null,
    val lastRefillDate: Long? = null,
    val lastOdometer: Double? = null,
    val latestEntry: FuelEntry? = null,
    val isLoading: Boolean = true
)

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val repository: FuelRepository,
    private val preferenceManager: PreferenceManager,
    private val backupRepository: BackupRepository
) : ViewModel() {

    private val _selectedVehicleId = preferenceManager.selectedVehicleId

    val uiState: StateFlow<HomeUiState> = _selectedVehicleId
        .flatMapLatest { vehicleId ->
            if (vehicleId == null) {
                flowOf(HomeUiState(isLoading = false))
            } else {
                combine(
                    flow { emit(repository.getVehicleById(vehicleId)) },
                    repository.getFuelEntries(vehicleId)
                ) { vehicle, entries ->
                    calculateHomeState(vehicle, entries)
                }
            }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), HomeUiState())

    init {
        viewModelScope.launch {
            // Check for auto-backup file on first launch
            backupRepository.autoRestoreIfNeeded()
        }
    }

    private fun calculateHomeState(vehicle: Vehicle?, entries: List<FuelEntry>): HomeUiState {
        if (vehicle == null) return HomeUiState(isLoading = false)
        if (entries.isEmpty()) return HomeUiState(selectedVehicle = vehicle, isLoading = false)

        val latest = entries.first()
        
        var totalDistance = 0.0
        var totalFuelForMileage = 0.0
        
        // entries are sorted by date descending (latest first)
        for (i in 0 until entries.size - 1) {
            val current = entries[i]
            val previous = entries[i + 1]
            totalDistance += (current.odometer - previous.odometer)
            // The mileage for the distance traveled between 'previous' and 'current' 
            // is calculated using the fuel poured in 'previous'.
            totalFuelForMileage += previous.fuelAmount
        }
        
        val avgMileage = if (totalFuelForMileage > 0) totalDistance / totalFuelForMileage else null

        return HomeUiState(
            selectedVehicle = vehicle,
            averageMileage = avgMileage,
            lastFuelAmount = latest.fuelAmount,
            lastCost = latest.totalCost,
            lastRefillDate = latest.refillDate,
            lastOdometer = latest.odometer,
            latestEntry = latest,
            isLoading = false
        )
    }
}
