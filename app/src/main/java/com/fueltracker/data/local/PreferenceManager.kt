package com.fueltracker.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")

@Singleton
class PreferenceManager @Inject constructor(@ApplicationContext context: Context) {
    private val dataStore = context.dataStore

    object PreferencesKeys {
        val SELECTED_VEHICLE_ID = longPreferencesKey("selected_vehicle_id")
    }

    val selectedVehicleId: Flow<Long?> = dataStore.data.map { preferences ->
        val id = preferences[PreferencesKeys.SELECTED_VEHICLE_ID]
        if (id == -1L) null else id
    }

    suspend fun setSelectedVehicleId(id: Long?) {
        dataStore.edit { preferences ->
            preferences[PreferencesKeys.SELECTED_VEHICLE_ID] = id ?: -1L
        }
    }
}
