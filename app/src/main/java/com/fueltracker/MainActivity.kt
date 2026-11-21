package com.fueltracker

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Box
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material3.AssistChip
import androidx.compose.material3.AssistChipDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.fueltracker.data.cloud.CloudFuelEntry
import com.fueltracker.data.cloud.CloudService
import com.fueltracker.data.cloud.CloudServiceItem
import com.fueltracker.data.cloud.CloudVehicle
import com.fueltracker.domain.OilCalculator
import com.fueltracker.ui.AppViewModel
import com.fueltracker.ui.screens.ConfirmDelete
import com.fueltracker.ui.screens.GarageScreen
import com.fueltracker.ui.screens.RefillEditor
import com.fueltracker.ui.screens.RefillsScreen
import com.fueltracker.ui.screens.ServiceEditor
import com.fueltracker.ui.screens.ServiceItemsManager
import com.fueltracker.ui.screens.ServicesScreen
import com.fueltracker.ui.screens.SettingsScreen
import com.fueltracker.ui.screens.SignInScreen
import com.fueltracker.ui.screens.TrackScreen
import com.fueltracker.ui.screens.VehicleEditor
import com.fueltracker.ui.screens.oilColor
import com.fueltracker.ui.screens.oilShortText
import com.fueltracker.ui.theme.BrandGreen
import com.fueltracker.ui.theme.FuelTrackerTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    private val viewModel: AppViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            FuelTrackerTheme {
                Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                    FuelTrackerRoot(viewModel)
                }
            }
        }
    }
}

private enum class Tab(val label: String, val icon: ImageVector) {
    TRACK("Track", Icons.Default.Speed),
    GARAGE("Garage", Icons.Default.DirectionsCar),
    REFILLS("Refills", Icons.Default.History),
    SERVICES("Services", Icons.Default.Build),
    SETTINGS("Settings", Icons.Default.Settings),
}

private sealed interface Editor {
    data class Refill(val entry: CloudFuelEntry?) : Editor
    data class Vehicle(val vehicle: CloudVehicle?) : Editor
    data class Service(val service: CloudService?) : Editor
    data object Items : Editor
}

private sealed interface Confirm {
    data class DeleteRefill(val entry: CloudFuelEntry) : Confirm
    data class DeleteVehicle(val vehicle: CloudVehicle) : Confirm
    data class DeleteService(val service: CloudService) : Confirm
    data class DeleteItem(val item: CloudServiceItem) : Confirm
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FuelTrackerRoot(vm: AppViewModel) {
    val state by vm.state.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    LaunchedEffect(Unit) { vm.messages.collect { snackbar.showSnackbar(it) } }

    if (!state.authChecked) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
        return
    }
    if (state.user == null) {
        Scaffold(snackbarHost = { SnackbarHost(snackbar) }) { p ->
            Box(Modifier.padding(p)) {
                SignInScreen(state.signingIn, vm::setSigningIn, vm::onGoogleIdToken, vm::onSignInError)
            }
        }
        return
    }

    var tab by rememberSaveable { mutableStateOf(Tab.TRACK) }
    var editor by remember { mutableStateOf<Editor?>(null) }
    var confirm by remember { mutableStateOf<Confirm?>(null) }
    var confirmSignOut by remember { mutableStateOf(false) }
    BackHandler(enabled = tab != Tab.TRACK) { tab = Tab.TRACK }

    val vehicle = state.activeVehicle
    val oil = vehicle?.let {
        OilCalculator.status(
            state.activeServices, state.activeEntries, state.data.serviceItems,
            state.data.preferences.engineOilInterval, state.data.preferences.engineOilMonthsInterval,
        )
    }
    val latestOdo = (state.activeEntries.map { it.odometer } + state.activeServices.map { it.odometer }).maxOrNull()

    fun requireVehicle(open: () -> Unit) {
        if (vehicle == null) editor = Editor.Vehicle(null) else open()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Image(painterResource(R.drawable.app_logo), contentDescription = null,
                            modifier = Modifier.size(30.dp).clip(RoundedCornerShape(7.dp)))
                        Text(
                            buildAnnotatedString {
                                append("  Fuel")
                                withStyle(SpanStyle(color = BrandGreen)) { append("Tracker") }
                            },
                            fontWeight = FontWeight.ExtraBold,
                        )
                    }
                },
                actions = {
                    if (oil != null) {
                        AssistChip(
                            onClick = { tab = Tab.SERVICES },
                            label = { Text("🛢️ " + oilShortText(oil, state.unit), fontWeight = FontWeight.Bold) },
                            colors = AssistChipDefaults.assistChipColors(labelColor = oilColor(oil.state)),
                            modifier = Modifier.padding(end = 4.dp),
                        )
                    }
                    IconButton(onClick = { confirmSignOut = true }) {
                        Icon(Icons.AutoMirrored.Filled.Logout, contentDescription = "Sign out")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
            )
        },
        bottomBar = {
            NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
                Tab.entries.forEach { t ->
                    NavigationBarItem(
                        selected = tab == t,
                        onClick = { tab = t },
                        icon = { Icon(t.icon, contentDescription = null) },
                        label = { Text(t.label, maxLines = 1) },
                    )
                }
            }
        },
        snackbarHost = { SnackbarHost(snackbar) },
        containerColor = MaterialTheme.colorScheme.background,
    ) { padding ->
        Box(Modifier.padding(padding)) {
            when (tab) {
                Tab.TRACK -> TrackScreen(
                    state, vm::selectVehicle,
                    onAddRefill = { requireVehicle { editor = Editor.Refill(null) } },
                    onEditRefill = { editor = Editor.Refill(it) },
                    onAddVehicle = { editor = Editor.Vehicle(null) },
                )
                Tab.GARAGE -> GarageScreen(
                    state, vm::selectVehicle,
                    onAdd = { editor = Editor.Vehicle(null) },
                    onEdit = { editor = Editor.Vehicle(it) },
                    onDelete = { confirm = Confirm.DeleteVehicle(it) },
                )
                Tab.REFILLS -> RefillsScreen(
                    state, vm::selectVehicle,
                    onAddRefill = { requireVehicle { editor = Editor.Refill(null) } },
                    onEditRefill = { editor = Editor.Refill(it) },
                    onDeleteRefill = { confirm = Confirm.DeleteRefill(it) },
                )
                Tab.SERVICES -> ServicesScreen(
                    state, oil, vm::selectVehicle,
                    onAddService = { requireVehicle { editor = Editor.Service(null) } },
                    onEditService = { editor = Editor.Service(it) },
                    onDeleteService = { confirm = Confirm.DeleteService(it) },
                    onManageItems = { editor = Editor.Items },
                )
                Tab.SETTINGS -> SettingsScreen(state, vm::setCurrency, vm::setUnit, vm::savePreferences)
            }
        }
    }

    when (val e = editor) {
        is Editor.Refill -> RefillEditor(
            initial = e.entry,
            vehicleId = e.entry?.vehicleId ?: vehicle?.id ?: "",
            fuelTypes = state.data.fuelTypes,
            currency = state.currency, unit = state.unit,
            suggestedOdometer = null,
            onSave = vm::saveRefill,
            onDismiss = { editor = null },
        )
        is Editor.Vehicle -> VehicleEditor(e.vehicle, vm::saveVehicle) { editor = null }
        is Editor.Service -> ServiceEditor(
            initial = e.service,
            vehicleId = e.service?.vehicleId ?: vehicle?.id ?: "",
            items = state.data.serviceItems,
            currency = state.currency, unit = state.unit,
            suggestedOdometer = latestOdo,
            onAddItem = { name -> vm.addServiceItem(name, "") },
            pastServices = state.data.services,
            onSave = vm::saveService,
            onDismiss = { editor = null },
        )
        Editor.Items -> ServiceItemsManager(
            items = state.data.serviceItems,
            services = state.data.services,
            onAdd = { n, c -> vm.addServiceItem(n, c) },
            onUpdate = vm::updateServiceItem,
            onDelete = { confirm = Confirm.DeleteItem(it) },
            onDismiss = { editor = null },
        )
        null -> Unit
    }

    when (val c = confirm) {
        is Confirm.DeleteRefill -> ConfirmDelete("Delete refill?", "Mileage for later refills will be recalculated.",
            onConfirm = { vm.deleteRefill(c.entry.id) }, onDismiss = { confirm = null })
        is Confirm.DeleteVehicle -> ConfirmDelete("Delete ${c.vehicle.name}?",
            "This permanently deletes the vehicle with all its refills and service records, on web and Android.",
            onConfirm = { vm.deleteVehicle(c.vehicle) }, onDismiss = { confirm = null })
        is Confirm.DeleteService -> ConfirmDelete("Delete service record?", "This record will be removed permanently.",
            onConfirm = { vm.deleteService(c.service.id) }, onDismiss = { confirm = null })
        is Confirm.DeleteItem -> ConfirmDelete("Remove \"${c.item.name}\"?",
            "It is removed from your item list. Past service records keep it unchanged.", confirmText = "Remove",
            onConfirm = { vm.deleteServiceItem(c.item) }, onDismiss = { confirm = null })
        null -> Unit
    }

    if (confirmSignOut) {
        ConfirmDelete(
            title = "Sign out?",
            message = "Your data stays safe in your account. Sign in again any time.",
            confirmText = "Sign out",
            onConfirm = { vm.signOut() },
            onDismiss = { confirmSignOut = false },
        )
    }
}
