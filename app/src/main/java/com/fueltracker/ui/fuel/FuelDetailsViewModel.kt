package com.fueltracker.ui.fuel

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fueltracker.data.entity.FuelEntry
import com.fueltracker.data.repository.FuelRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class FuelDetailsViewModel @Inject constructor(
    private val repository: FuelRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val entryId: Long = checkNotNull(savedStateHandle["entryId"])

    private val _entry = MutableStateFlow<FuelEntry?>(null)
    val entry: StateFlow<FuelEntry?> = _entry.asStateFlow()

    init {
        viewModelScope.launch {
            _entry.value = repository.getFuelEntryById(entryId)
        }
    }

    fun deleteEntry() {
        viewModelScope.launch {
            entry.value?.let {
                repository.deleteFuelEntry(it)
            }
        }
    }
}
