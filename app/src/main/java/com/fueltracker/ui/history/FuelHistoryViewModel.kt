package com.fueltracker.ui.history

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fueltracker.data.entity.FuelEntry
import com.fueltracker.data.local.PreferenceManager
import com.fueltracker.data.repository.FuelRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import javax.inject.Inject

data class HistoryUiState(
    val entries: List<FuelEntry> = emptyList(),
    val isLoading: Boolean = true
)

@HiltViewModel
class FuelHistoryViewModel @Inject constructor(
    private val repository: FuelRepository,
    private val preferenceManager: PreferenceManager
) : ViewModel() {

    val uiState: StateFlow<HistoryUiState> = preferenceManager.selectedVehicleId
        .flatMapLatest { vehicleId ->
            if (vehicleId == null) {
                flowOf(HistoryUiState(isLoading = false))
            } else {
                repository.getFuelEntries(vehicleId).map { entries ->
                    HistoryUiState(entries = entries, isLoading = false)
                }
            }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), HistoryUiState())
}
