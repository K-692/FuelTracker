package com.fueltracker.ui.statistics

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fueltracker.data.entity.FuelEntry
import com.fueltracker.data.local.PreferenceManager
import com.fueltracker.data.repository.FuelRepository
import com.fueltracker.domain.calculator.FuelCalculator
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import javax.inject.Inject

data class StatisticsUiState(
    val totalDistance: Double = 0.0,
    val totalFuel: Double = 0.0,
    val totalSpending: Double = 0.0,
    val averageMileage: Double = 0.0,
    val averageFuelPrice: Double = 0.0,
    val mileageHistory: List<Pair<Long, Double>> = emptyList(),
    val costHistory: List<Pair<Long, Double>> = emptyList(),
    val isLoading: Boolean = true
)

@HiltViewModel
class StatisticsViewModel @Inject constructor(
    private val repository: FuelRepository,
    private val preferenceManager: PreferenceManager
) : ViewModel() {

    val uiState: StateFlow<StatisticsUiState> = preferenceManager.selectedVehicleId
        .flatMapLatest { vehicleId ->
            if (vehicleId == null) {
                flowOf(StatisticsUiState(isLoading = false))
            } else {
                repository.getFuelEntries(vehicleId).map { entries ->
                    calculateStatistics(entries)
                }
            }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), StatisticsUiState())

    private fun calculateStatistics(entries: List<FuelEntry>): StatisticsUiState {
        if (entries.isEmpty()) return StatisticsUiState(isLoading = false)

        val sortedEntries = entries.sortedBy { it.odometer }
        var totalDistance = 0.0
        var totalFuelForMileage = 0.0
        var totalSpending = 0.0
        var totalFuelQuantity = 0.0
        
        val mileageHistory = mutableListOf<Pair<Long, Double>>()
        val costHistory = mutableListOf<Pair<Long, Double>>()

        for (i in 1 until sortedEntries.size) {
            val prev = sortedEntries[i - 1]
            val current = sortedEntries[i]
            val distance = current.odometer - prev.odometer
            totalDistance += distance
            // Mileage for the trip between prev and current uses fuel from prev
            totalFuelForMileage += prev.fuelAmount
            
            FuelCalculator.mileage(distance, prev.fuelAmount)?.let {
                mileageHistory.add(current.refillDate to it)
            }
        }

        sortedEntries.forEach { 
            totalSpending += it.totalCost
            totalFuelQuantity += it.fuelAmount
            costHistory.add(it.refillDate to it.totalCost)
        }

        return StatisticsUiState(
            totalDistance = totalDistance,
            totalFuel = totalFuelQuantity,
            totalSpending = totalSpending,
            averageMileage = if (totalFuelForMileage > 0) totalDistance / totalFuelForMileage else 0.0,
            averageFuelPrice = if (totalFuelQuantity > 0) totalSpending / totalFuelQuantity else 0.0,
            mileageHistory = mileageHistory,
            costHistory = costHistory,
            isLoading = false
        )
    }
}
