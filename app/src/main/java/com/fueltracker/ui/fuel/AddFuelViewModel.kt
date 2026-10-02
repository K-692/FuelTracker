package com.fueltracker.ui.fuel

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fueltracker.data.entity.FuelEntry
import com.fueltracker.data.entity.FuelType
import com.fueltracker.data.entity.Vehicle
import com.fueltracker.data.repository.FuelRepository
import com.fueltracker.domain.calculator.FuelCalculator
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AddFuelUiState(
    val vehicles: List<Vehicle> = emptyList(),
    val fuelTypes: List<FuelType> = emptyList(),
    val selectedVehicle: Vehicle? = null,
    val selectedFuelType: FuelType? = null,
    val odometer: String = "",
    val fuelAmount: String = "",
    val totalCost: String = "",
    val refillDate: Long = System.currentTimeMillis(),
    val notes: String = "",
    val calculatedMileage: Double? = null,
    val calculatedPricePerLiter: Double? = null,
    val calculatedDistance: Double? = null,
    val errorMessage: String? = null,
    val isSaved: Boolean = false,
    val isEditMode: Boolean = false
)

@HiltViewModel
class AddFuelViewModel @Inject constructor(
    private val repository: FuelRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val editEntryId: Long? = savedStateHandle.get<String>("entryId")?.toLongOrNull()

    private val _uiState = MutableStateFlow(AddFuelUiState(isEditMode = editEntryId != null))
    val uiState: StateFlow<AddFuelUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            repository.prefillFuelTypes(getDefaultFuelTypes())
            
            val vehicles = repository.getAllVehicles().first()
            val fuelTypes = repository.getAllFuelTypes().first()
            
            _uiState.update { it.copy(
                vehicles = vehicles,
                fuelTypes = fuelTypes
            ) }

            if (editEntryId != null) {
                repository.getFuelEntryById(editEntryId)?.let { entry ->
                    _uiState.update { it.copy(
                        selectedVehicle = vehicles.find { v -> v.id == entry.vehicleId },
                        selectedFuelType = fuelTypes.find { ft -> ft.id == entry.fuelTypeId },
                        odometer = entry.odometer.toString(),
                        fuelAmount = entry.fuelAmount.toString(),
                        totalCost = entry.totalCost.toString(),
                        refillDate = entry.refillDate,
                        notes = entry.notes ?: ""
                    ) }
                    calculateMetrics()
                }
            } else {
                _uiState.update { it.copy(
                    selectedVehicle = vehicles.firstOrNull(),
                    selectedFuelType = fuelTypes.firstOrNull { ft -> ft.name == "Regular Petrol" } ?: fuelTypes.firstOrNull()
                ) }
            }
        }
    }

    fun onVehicleSelected(vehicle: Vehicle) {
        _uiState.update { it.copy(selectedVehicle = vehicle) }
        calculateMetrics()
    }

    fun onFuelTypeSelected(fuelType: FuelType) {
        _uiState.update { it.copy(selectedFuelType = fuelType) }
    }

    fun onOdometerChanged(value: String) {
        _uiState.update { it.copy(odometer = value) }
        calculateMetrics()
    }

    fun onFuelAmountChanged(value: String) {
        _uiState.update { it.copy(fuelAmount = value) }
        calculateMetrics()
    }

    fun onTotalCostChanged(value: String) {
        _uiState.update { it.copy(totalCost = value) }
        calculateMetrics()
    }

    fun onNotesChanged(value: String) {
        _uiState.update { it.copy(notes = value) }
    }

    private fun calculateMetrics() {
        val state = _uiState.value
        val currentOdo = state.odometer.toDoubleOrNull() ?: 0.0
        val amount = state.fuelAmount.toDoubleOrNull() ?: 0.0
        val cost = state.totalCost.toDoubleOrNull() ?: 0.0
        val vehicleId = state.selectedVehicle?.id ?: return

        viewModelScope.launch {
            val previousEntry = repository.getPreviousFuelEntry(vehicleId, currentOdo)
            val distance = if (previousEntry != null) {
                FuelCalculator.distance(previousEntry.odometer, currentOdo)
            } else null
            
            // Mileage is calculated as distance since last fill / amount of fuel from last fill
            val mileage = if (distance != null && previousEntry != null) {
                FuelCalculator.mileage(distance, previousEntry.fuelAmount)
            } else null

            val price = FuelCalculator.fuelPrice(cost, amount)

            _uiState.update { it.copy(
                calculatedDistance = distance,
                calculatedMileage = mileage,
                calculatedPricePerLiter = price
            ) }
        }
    }

    fun saveEntry() {
        val state = _uiState.value
        val vehicleId = state.selectedVehicle?.id ?: return
        val fuelTypeId = state.selectedFuelType?.id ?: return
        val odo = state.odometer.toDoubleOrNull() ?: return
        val amount = state.fuelAmount.toDoubleOrNull() ?: return
        val cost = state.totalCost.toDoubleOrNull() ?: return
        val price = state.calculatedPricePerLiter ?: (cost / amount)

        viewModelScope.launch {
            val entry = FuelEntry(
                id = editEntryId ?: 0,
                vehicleId = vehicleId,
                fuelTypeId = fuelTypeId,
                odometer = odo,
                fuelAmount = amount,
                totalCost = cost,
                pricePerLiter = price,
                refillDate = state.refillDate,
                notes = state.notes
            )
            if (editEntryId != null) {
                repository.updateFuelEntry(entry)
            } else {
                repository.insertFuelEntry(entry)
            }
            _uiState.update { it.copy(isSaved = true) }
        }
    }

    private fun getDefaultFuelTypes() = listOf(
        FuelType(name = "Regular Petrol", category = "Petrol", isSystemFuel = true),
        FuelType(name = "Regular Petrol (E20)", category = "Petrol", isSystemFuel = true),
        FuelType(name = "Premium Petrol 95", category = "Premium Petrol", isSystemFuel = true),
        FuelType(name = "Premium Petrol 97+", category = "Premium Petrol", isSystemFuel = true),
        FuelType(name = "Regular Diesel", category = "Diesel", isSystemFuel = true),
        FuelType(name = "Premium Diesel", category = "Premium Diesel", isSystemFuel = true),
        FuelType(name = "CNG", category = "CNG", isSystemFuel = true),
        FuelType(name = "Auto LPG", category = "LPG", isSystemFuel = true),
        FuelType(name = "Other", category = "Other", isSystemFuel = true)
    )
}
