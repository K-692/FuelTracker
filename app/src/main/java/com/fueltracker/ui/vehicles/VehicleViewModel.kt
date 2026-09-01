package com.fueltracker.ui.vehicles

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fueltracker.data.entity.Vehicle
import com.fueltracker.data.local.PreferenceManager
import com.fueltracker.data.repository.FuelRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class VehicleViewModel @Inject constructor(
    private val repository: FuelRepository,
    private val preferenceManager: PreferenceManager
) : ViewModel() {

    val allVehicles: StateFlow<List<Vehicle>> = repository.getAllVehicles()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val selectedVehicleId: StateFlow<Long?> = preferenceManager.selectedVehicleId
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    fun selectVehicle(id: Long?) {
        viewModelScope.launch {
            preferenceManager.setSelectedVehicleId(id)
        }
    }

    fun addVehicle(vehicle: Vehicle) {
        viewModelScope.launch {
            val id = repository.insertVehicle(vehicle)
            if (selectedVehicleId.value == null) {
                selectVehicle(id)
            }
        }
    }

    fun updateVehicle(vehicle: Vehicle) {
        viewModelScope.launch {
            repository.updateVehicle(vehicle)
        }
    }

    fun deleteVehicle(vehicle: Vehicle) {
        viewModelScope.launch {
            repository.deleteVehicle(vehicle)
            if (selectedVehicleId.value == vehicle.id) {
                preferenceManager.setSelectedVehicleId(null)
            }
        }
    }
}
