package com.fueltracker.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.fueltracker.data.cloud.CloudPreferences
import com.fueltracker.data.cloud.CloudVehicle
import com.fueltracker.data.cloud.VehicleKind
import com.fueltracker.domain.FuelStats
import com.fueltracker.ui.UiState
import com.fueltracker.ui.components.EmptyState
import com.fueltracker.ui.components.FullScreenEditor
import com.fueltracker.ui.components.MetricColumn
import com.fueltracker.ui.components.NumberField
import com.fueltracker.ui.components.PageHeader
import com.fueltracker.ui.components.SectionCard
import com.fueltracker.ui.components.formatNumber
import com.fueltracker.ui.components.money
import com.fueltracker.ui.theme.BrandGreen

@Composable
fun GarageScreen(
    state: UiState,
    onSelect: (String) -> Unit,
    onAdd: () -> Unit,
    onEdit: (CloudVehicle) -> Unit,
    onDelete: (CloudVehicle) -> Unit,
) {
    LazyColumn(contentPadding = screenPadding, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            PageHeader("Vehicle Garage", "Pick the active vehicle, or add a new one.")
            Button(onClick = onAdd, modifier = Modifier.fillMaxWidth()) {
                Icon(Icons.Default.Add, contentDescription = null)
                Text("  Add Vehicle", fontWeight = FontWeight.Bold)
            }
        }
        if (state.data.vehicles.isEmpty()) {
            item { EmptyState("Your garage is empty", "Add your first vehicle to start tracking.") }
        }
        items(state.data.vehicles, key = { it.id }) { v ->
            val entries = state.data.entries.filter { it.vehicleId == v.id }
            val stats = FuelStats.statistics(entries)
            val active = v.id == state.activeVehicle?.id
            SectionCard(accent = if (active) BrandGreen else null) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(v.vehicleType.emoji, fontSize = 28.sp)
                    Column(Modifier.weight(1f).padding(start = 12.dp)) {
                        Text(v.name, fontWeight = FontWeight.ExtraBold, style = MaterialTheme.typography.titleMedium)
                        if (v.subtitle().isNotBlank()) {
                            Text(v.subtitle(), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                    IconButton(onClick = { onEdit(v) }) { Icon(Icons.Default.Edit, contentDescription = "Edit ${v.name}") }
                    IconButton(onClick = { onDelete(v) }) {
                        Icon(Icons.Default.Delete, contentDescription = "Delete ${v.name}", tint = MaterialTheme.colorScheme.error)
                    }
                }
                Spacer(Modifier.height(10.dp))
                Row(Modifier.fillMaxWidth()) {
                    MetricColumn("Avg mileage", if (stats.averageMileage > 0) "${formatNumber(stats.averageMileage, 2)} ${state.unit}/L" else "--", Modifier.weight(1f), BrandGreen)
                    MetricColumn("Refills", "${entries.size}", Modifier.weight(0.6f))
                    MetricColumn("Spent", money(state.currency, stats.totalSpending), Modifier.weight(1f))
                }
                Spacer(Modifier.height(10.dp))
                if (active) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.CheckCircle, contentDescription = null, tint = BrandGreen, modifier = Modifier.size(18.dp))
                        Text("  Active vehicle", color = BrandGreen, fontWeight = FontWeight.Bold)
                    }
                } else {
                    OutlinedButton(onClick = { onSelect(v.id) }, modifier = Modifier.fillMaxWidth()) { Text("Set as active") }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VehicleEditor(initial: CloudVehicle?, onSave: (CloudVehicle) -> Unit, onDismiss: () -> Unit) {
    var name by remember { mutableStateOf(initial?.name ?: "") }
    var type by remember { mutableStateOf(initial?.vehicleType ?: VehicleKind.BIKE) }
    var maker by remember { mutableStateOf(initial?.manufacturer ?: "") }
    var model by remember { mutableStateOf(initial?.model ?: "") }
    var year by remember { mutableStateOf(initial?.year?.toString() ?: "") }
    var reg by remember { mutableStateOf(initial?.registrationNumber ?: "") }
    var error by remember { mutableStateOf<String?>(null) }

    val save = {
        if (name.isBlank()) error = "Please give the vehicle a name" else {
            onSave(
                CloudVehicle(
                    id = initial?.id ?: "veh_${System.currentTimeMillis()}",
                    name = name.trim(),
                    vehicleType = type,
                    registrationNumber = reg.trim().ifBlank { null },
                    manufacturer = maker.trim().ifBlank { null },
                    model = model.trim().ifBlank { null },
                    year = year.trim().toIntOrNull(),
                    createdAt = initial?.createdAt ?: System.currentTimeMillis(),
                )
            )
            onDismiss()
        }
    }

    FullScreenEditor(
        title = if (initial == null) "Add Vehicle" else "Edit Vehicle",
        onDismiss = onDismiss,
        actions = { TextButton(onClick = save) { Text("Save", fontWeight = FontWeight.Bold) } },
    ) {
        OutlinedTextField(name, { name = it }, label = { Text("Vehicle name") }, singleLine = true, modifier = Modifier.fillMaxWidth())
        Text("Type", style = MaterialTheme.typography.labelLarge)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            VehicleKind.entries.forEach { k ->
                FilterChip(selected = type == k, onClick = { type = k }, label = { Text("${k.emoji} ${k.label}") })
            }
        }
        OutlinedTextField(maker, { maker = it }, label = { Text("Manufacturer") }, singleLine = true, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(model, { model = it }, label = { Text("Model") }, singleLine = true, modifier = Modifier.fillMaxWidth())
        NumberField(year, { year = it.filter(Char::isDigit).take(4) }, "Year")
        OutlinedTextField(reg, { reg = it.uppercase() }, label = { Text("Registration number") }, singleLine = true, modifier = Modifier.fillMaxWidth())
        error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        Button(onClick = save, modifier = Modifier.fillMaxWidth().height(52.dp)) { Text("Save Vehicle", fontWeight = FontWeight.Bold) }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    state: UiState,
    onCurrency: (String) -> Unit,
    onUnit: (String) -> Unit,
    onSavePrefs: (CloudPreferences) -> Unit,
    onSignOut: () -> Unit,
) {
    val prefs = state.data.preferences
    var km by remember(prefs) { mutableStateOf(prefs.engineOilInterval.toString()) }
    var months by remember(prefs) { mutableStateOf(prefs.engineOilMonthsInterval.toString()) }
    val uri = LocalUriHandler.current

    LazyColumn(contentPadding = screenPadding, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { PageHeader("Settings", null) }
        item {
            SectionCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Surface(shape = CircleShape, color = BrandGreen, modifier = Modifier.size(40.dp)) {
                        androidx.compose.foundation.layout.Box(contentAlignment = Alignment.Center) {
                            Text(
                                (state.user?.displayName ?: state.user?.email ?: "U").take(1).uppercase(),
                                color = MaterialTheme.colorScheme.onPrimary,
                                fontWeight = FontWeight.Bold,
                            )
                        }
                    }
                    Column(Modifier.weight(1f).padding(start = 12.dp)) {
                        Text(state.user?.displayName ?: "Signed in", fontWeight = FontWeight.Bold)
                        Text(state.user?.email ?: "", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
                Spacer(Modifier.height(8.dp))
                Text("Data syncs with the FuelTracker web app in real time.", style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(Modifier.height(8.dp))
                OutlinedButton(onClick = onSignOut, modifier = Modifier.fillMaxWidth()) {
                    Icon(Icons.AutoMirrored.Filled.Logout, contentDescription = null)
                    Text("  Sign out")
                }
            }
        }
        item {
            SectionCard {
                Text("Engine-oil reminder", fontWeight = FontWeight.ExtraBold)
                Text("Reminds you when either limit is reached (whichever comes first). Shared with the web app.",
                    style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    NumberField(km, { km = it.filter(Char::isDigit) }, "Distance (${state.unit})", Modifier.weight(1f))
                    NumberField(months, { months = it.filter(Char::isDigit) }, "Months", Modifier.weight(1f))
                }
                Button(
                    onClick = {
                        onSavePrefs(
                            CloudPreferences(
                                engineOilInterval = km.toIntOrNull()?.takeIf { it > 0 } ?: 5000,
                                engineOilMonthsInterval = months.toIntOrNull()?.takeIf { it in 1..60 } ?: 6,
                            )
                        )
                    },
                    modifier = Modifier.fillMaxWidth(),
                ) { Text("Save interval") }
            }
        }
        item {
            SectionCard {
                Text("Display", fontWeight = FontWeight.ExtraBold)
                Spacer(Modifier.height(6.dp))
                Text("Currency", style = MaterialTheme.typography.labelLarge)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("₹", "$", "€", "£").forEach { c -> FilterChip(selected = state.currency == c, onClick = { onCurrency(c) }, label = { Text(c) }) }
                }
                Text("Distance unit", style = MaterialTheme.typography.labelLarge)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("km", "mi").forEach { u -> FilterChip(selected = state.unit == u, onClick = { onUnit(u) }, label = { Text(u) }) }
                }
            }
        }
        item {
            TextButton(onClick = { uri.openUri("https://k-692.github.io/FuelTracker/") }, modifier = Modifier.fillMaxWidth()) {
                Text("Open the web app")
            }
        }
    }
}
