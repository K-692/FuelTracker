package com.fueltracker.ui

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fueltracker.data.cloud.CloudFuelEntry
import com.fueltracker.data.cloud.CloudFuelType
import com.fueltracker.data.cloud.CloudPreferences
import com.fueltracker.data.cloud.CloudRepository
import com.fueltracker.data.cloud.CloudService
import com.fueltracker.data.cloud.CloudServiceItem
import com.fueltracker.data.cloud.CloudVehicle
import com.fueltracker.domain.ServiceItems
import com.google.firebase.auth.FirebaseUser
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AppData(
    val loaded: Boolean = false,
    val vehicles: List<CloudVehicle> = emptyList(),
    val entries: List<CloudFuelEntry> = emptyList(),
    val services: List<CloudService> = emptyList(),
    val serviceItems: List<CloudServiceItem> = emptyList(),
    val fuelTypes: List<CloudFuelType> = CloudFuelType.DEFAULTS,
    val preferences: CloudPreferences = CloudPreferences(),
)

data class UiState(
    val authChecked: Boolean = false,
    val user: FirebaseUser? = null,
    val signingIn: Boolean = false,
    val data: AppData = AppData(),
    val selectedVehicleId: String? = null,
    val currency: String = "₹",
    val unit: String = "km",
) {
    val activeVehicle: CloudVehicle?
        get() = data.vehicles.firstOrNull { it.id == selectedVehicleId } ?: data.vehicles.firstOrNull()

    val activeEntries: List<CloudFuelEntry>
        get() = activeVehicle?.let { v -> data.entries.filter { it.vehicleId == v.id } } ?: emptyList()

    val activeServices: List<CloudService>
        get() = activeVehicle?.let { v -> data.services.filter { it.vehicleId == v.id } }
            ?.sortedWith(compareByDescending<CloudService> { it.serviceDate }.thenByDescending { it.odometer })
            ?: emptyList()
}

@OptIn(ExperimentalCoroutinesApi::class)
@HiltViewModel
class AppViewModel @Inject constructor(
    @ApplicationContext context: Context,
    private val cloud: CloudRepository,
) : ViewModel() {

    private val localPrefs = context.getSharedPreferences("fueltracker_prefs", Context.MODE_PRIVATE)

    private val _state = MutableStateFlow(
        UiState(
            selectedVehicleId = localPrefs.getString("active_vehicle_id", null),
            currency = localPrefs.getString("currency", "₹") ?: "₹",
            unit = localPrefs.getString("unit", "km") ?: "km",
        )
    )
    val state: StateFlow<UiState> = _state.asStateFlow()

    private val _messages = MutableSharedFlow<String>(extraBufferCapacity = 8)
    val messages: SharedFlow<String> = _messages

    private var dataJob: Job? = null
    private var itemMigrationDoneFor: String? = null

    init {
        viewModelScope.launch {
            cloud.authState().collect { user ->
                _state.update { it.copy(authChecked = true, user = user) }
                if (user != null) startSync(user.uid) else stopSync()
            }
        }
    }

    private fun startSync(uid: String) {
        dataJob?.cancel()
        dataJob = viewModelScope.launch {
            val core = combine(
                cloud.vehicles(uid), cloud.fuelEntries(uid), cloud.services(uid)
            ) { v, e, s -> Triple(v, e, s) }
            val extra = combine(
                cloud.serviceItems(uid), cloud.fuelTypes(uid), cloud.preferences(uid)
            ) { i, f, p -> Triple(i, f, p) }

            combine(core, extra) { c, x ->
                AppData(
                    loaded = true,
                    vehicles = c.first.sortedBy { it.createdAt },
                    entries = c.second,
                    services = c.third,
                    serviceItems = x.first,
                    fuelTypes = x.second.ifEmpty { CloudFuelType.DEFAULTS },
                    preferences = x.third,
                )
            }.catch { e ->
                message("Sync error: ${e.message ?: "check your connection"}")
            }.collect { data ->
                _state.update { it.copy(data = data) }
                migrateItemsOnce(uid, data)
            }
        }
    }

    private fun stopSync() {
        dataJob?.cancel()
        dataJob = null
        itemMigrationDoneFor = null
        _state.update { it.copy(data = AppData()) }
    }

    /** Non-destructive: items referenced by old service records become user items. */
    private fun migrateItemsOnce(uid: String, data: AppData) {
        if (itemMigrationDoneFor == uid) return
        itemMigrationDoneFor = uid
        val missing = ServiceItems.missingFromServices(data.services, data.serviceItems)
        if (missing.isNotEmpty()) viewModelScope.launch { runCatching { cloud.saveServiceItems(uid, missing) } }
    }

    private fun message(text: String) { _messages.tryEmit(text) }

    private fun uid(): String? = _state.value.user?.uid

    private fun write(success: String? = null, block: suspend (String) -> Unit) {
        val uid = uid() ?: return message("Please sign in first")
        viewModelScope.launch {
            runCatching { block(uid) }
                .onSuccess { success?.let(::message) }
                .onFailure { message("Could not save: ${it.message}") }
        }
    }

    // ---------------------------------------------------------------- Auth
    fun setSigningIn(value: Boolean) = _state.update { it.copy(signingIn = value) }

    fun onGoogleIdToken(idToken: String) {
        viewModelScope.launch {
            setSigningIn(true)
            runCatching { cloud.signInWithGoogleIdToken(idToken) }
                .onSuccess { u -> message("Signed in as ${u?.displayName ?: u?.email ?: "you"}") }
                .onFailure { message("Sign-in failed: ${it.message}") }
            setSigningIn(false)
        }
    }

    fun onSignInError(text: String) {
        setSigningIn(false)
        message(text)
    }

    fun signOut() {
        cloud.signOut()
        message("Signed out")
    }

    // ---------------------------------------------------------------- Local prefs
    fun selectVehicle(id: String) {
        localPrefs.edit().putString("active_vehicle_id", id).apply()
        _state.update { it.copy(selectedVehicleId = id) }
    }

    fun setCurrency(value: String) {
        localPrefs.edit().putString("currency", value).apply()
        _state.update { it.copy(currency = value) }
    }

    fun setUnit(value: String) {
        localPrefs.edit().putString("unit", value).apply()
        _state.update { it.copy(unit = value) }
    }

    // ---------------------------------------------------------------- Data writes
    fun saveVehicle(v: CloudVehicle) = write("Vehicle \"${v.name}\" saved") {
        cloud.saveVehicle(it, v)
        if (_state.value.selectedVehicleId == null) selectVehicle(v.id)
    }

    fun deleteVehicle(v: CloudVehicle) = write("Vehicle \"${v.name}\" deleted") { cloud.deleteVehicle(it, v.id) }

    fun saveRefill(e: CloudFuelEntry) = write("Refill saved") { cloud.saveFuelEntry(it, e) }

    fun deleteRefill(id: String) = write("Refill deleted") { cloud.deleteFuelEntry(it, id) }

    fun saveService(s: CloudService) = write("Service record saved") { cloud.saveService(it, s) }

    fun deleteService(id: String) = write("Service record deleted") { cloud.deleteService(it, id) }

    /** Returns the created (or existing, if same name) item immediately for the UI. */
    fun addServiceItem(name: String, category: String): CloudServiceItem? {
        val trimmed = name.trim()
        if (trimmed.isEmpty()) return null
        val items = _state.value.data.serviceItems
        // Reuse an existing item with the same name (e.g. picked from suggestions)
        items.firstOrNull { it.name.equals(trimmed, ignoreCase = true) }?.let { return it }
        val item = ServiceItems.newItem(trimmed, category, items)
        write("Item \"${item.name}\" added") { cloud.saveServiceItems(it, listOf(item)) }
        return item
    }

    fun updateServiceItem(item: CloudServiceItem) {
        val updated = item.copy(isEngineOil = ServiceItems.looksLikeEngineOil(item.name))
        write("Item \"${updated.name}\" updated") { cloud.saveServiceItems(it, listOf(updated)) }
    }

    fun deleteServiceItem(item: CloudServiceItem) =
        write("\"${item.name}\" removed from your items") { cloud.deleteServiceItem(it, item.id) }

    fun savePreferences(prefs: CloudPreferences) =
        write("Oil-change interval saved") { cloud.savePreferences(it, prefs) }
}
