package com.fueltracker.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fueltracker.data.repository.BackupRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class SettingsEvent {
    data class ExportSuccess(val json: String) : SettingsEvent()
    data class Error(val message: String) : SettingsEvent()
    object ImportSuccess : SettingsEvent()
}

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val backupRepository: BackupRepository
) : ViewModel() {

    private val _events = MutableSharedFlow<SettingsEvent>()
    val events = _events.asSharedFlow()

    fun exportData() {
        viewModelScope.launch {
            try {
                val json = backupRepository.exportData()
                _events.emit(SettingsEvent.ExportSuccess(json))
            } catch (e: Exception) {
                _events.emit(SettingsEvent.Error("Export failed: ${e.message}"))
            }
        }
    }

    fun importData(json: String) {
        viewModelScope.launch {
            try {
                backupRepository.importData(json)
                _events.emit(SettingsEvent.ImportSuccess)
            } catch (e: Exception) {
                _events.emit(SettingsEvent.Error("Import failed: ${e.message}"))
            }
        }
    }
}
