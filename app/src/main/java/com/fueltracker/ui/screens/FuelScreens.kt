package com.fueltracker.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.fueltracker.data.cloud.CloudFuelEntry
import com.fueltracker.data.cloud.CloudFuelType
import com.fueltracker.domain.EnrichedEntry
import com.fueltracker.domain.FuelStats
import com.fueltracker.ui.UiState
import com.fueltracker.ui.components.DateField
import com.fueltracker.ui.components.EmptyState
import com.fueltracker.ui.components.FullScreenEditor
import com.fueltracker.ui.components.MetricColumn
import com.fueltracker.ui.components.NumberField
import com.fueltracker.ui.components.PageHeader
import com.fueltracker.ui.components.SectionCard
import com.fueltracker.ui.components.StatTile
import com.fueltracker.ui.components.Tag
import com.fueltracker.ui.components.VehiclePills
import com.fueltracker.ui.components.formatDate
import com.fueltracker.ui.components.formatNumber
import com.fueltracker.ui.components.money
import com.fueltracker.ui.components.toPositiveDouble
import com.fueltracker.ui.theme.BrandGreen
import java.time.LocalDate

val screenPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 12.dp, bottom = 96.dp)

@Composable
fun TrackScreen(
    state: UiState,
    onSelectVehicle: (String) -> Unit,
    onAddRefill: () -> Unit,
    onEditRefill: (CloudFuelEntry) -> Unit,
    onAddVehicle: () -> Unit,
) {
    val vehicle = state.activeVehicle
    val stats = FuelStats.statistics(state.activeEntries)
    val recent = FuelStats.enrich(state.activeEntries).take(5)
    val name = state.user?.displayName?.substringBefore(' ') ?: "Driver"

    LazyColumn(contentPadding = screenPadding, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            PageHeader("Hi, $name!", vehicle?.let { "Active: ${it.name}" } ?: "Add your first vehicle to begin.")
            VehiclePills(state.data.vehicles, vehicle?.id, onSelectVehicle)
            Button(onClick = onAddRefill, modifier = Modifier.fillMaxWidth()) {
                Icon(Icons.Default.Add, contentDescription = null)
                Text("  Log Refill", fontWeight = FontWeight.Bold)
            }
        }
        if (vehicle == null) {
            item {
                EmptyState("No vehicles yet", "Add your bike, scooter or car to start tracking mileage.") {
                    Button(onClick = onAddVehicle) { Text("Add Vehicle") }
                }
            }
            return@LazyColumn
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                StatTile("Avg mileage", if (stats.averageMileage > 0) formatNumber(stats.averageMileage, 2) else "--",
                    "${state.unit}/L", Modifier.weight(1f), valueColor = BrandGreen)
                StatTile("Distance", formatNumber(stats.totalDistance), state.unit, Modifier.weight(1f))
            }
            Spacer(Modifier.height(10.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                StatTile("Fuel cost", money(state.currency, stats.totalSpending), "${formatNumber(stats.totalFuel, 1)} L", Modifier.weight(1f))
                StatTile("Running cost",
                    if (stats.averageCostPerDistance > 0) money(state.currency, stats.averageCostPerDistance, 2) else "--",
                    "per ${state.unit}", Modifier.weight(1f))
            }
        }
        item {
            Text("Recent refills", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.ExtraBold,
                modifier = Modifier.padding(top = 6.dp))
        }
        if (recent.isEmpty()) {
            item { EmptyState("No refills yet", "Log your first fill-up to set the baseline odometer.") }
        } else {
            items(recent, key = { it.entry.id }) { e -> RefillCard(e, state.currency, state.unit, onEdit = { onEditRefill(e.entry) }) }
        }
    }
}

@Composable
fun RefillsScreen(
    state: UiState,
    onSelectVehicle: (String) -> Unit,
    onAddRefill: () -> Unit,
    onEditRefill: (CloudFuelEntry) -> Unit,
    onDeleteRefill: (CloudFuelEntry) -> Unit,
) {
    val enriched = FuelStats.enrich(state.activeEntries)
    LazyColumn(contentPadding = screenPadding, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            PageHeader("Refill History", "${enriched.size} refills • ${state.activeVehicle?.name ?: "No vehicle"}")
            VehiclePills(state.data.vehicles, state.activeVehicle?.id, onSelectVehicle)
            Button(onClick = onAddRefill, modifier = Modifier.fillMaxWidth()) {
                Icon(Icons.Default.Add, contentDescription = null)
                Text("  Add Refill", fontWeight = FontWeight.Bold)
            }
        }
        if (enriched.isEmpty()) {
            item { EmptyState("No refills recorded", "Your fuel fill-ups will appear here.") }
        } else {
            items(enriched, key = { it.entry.id }) { e ->
                RefillCard(e, state.currency, state.unit, onEdit = { onEditRefill(e.entry) }, onDelete = { onDeleteRefill(e.entry) })
            }
        }
    }
}

@Composable
fun RefillCard(e: EnrichedEntry, currency: String, unit: String, onEdit: () -> Unit, onDelete: (() -> Unit)? = null) {
    SectionCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(formatDate(e.entry.refillDate), fontWeight = FontWeight.ExtraBold)
                Text(e.entry.fuelTypeName, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            if (e.mileage != null) Tag("${formatNumber(e.mileage, 2)} $unit/L", BrandGreen) else Tag("Baseline")
            IconButton(onClick = onEdit) { Icon(Icons.Default.Edit, contentDescription = "Edit refill") }
            if (onDelete != null) {
                IconButton(onClick = onDelete) { Icon(Icons.Default.Delete, contentDescription = "Delete refill", tint = MaterialTheme.colorScheme.error) }
            }
        }
        Spacer(Modifier.height(8.dp))
        Row(Modifier.fillMaxWidth()) {
            MetricColumn("Odometer", "${formatNumber(e.entry.odometer)} $unit", Modifier.weight(1f))
            MetricColumn("Trip", e.tripDistance?.let { "+${formatNumber(it)} $unit" } ?: "--", Modifier.weight(1f), BrandGreen)
        }
        Spacer(Modifier.height(6.dp))
        Row(Modifier.fillMaxWidth()) {
            MetricColumn("Fuel", "${formatNumber(e.entry.fuelAmount, 2)} L", Modifier.weight(1f))
            MetricColumn("Cost", money(currency, e.entry.totalCost, 2), Modifier.weight(1f))
        }
        if (!e.entry.notes.isNullOrBlank()) {
            Spacer(Modifier.height(6.dp))
            Text(e.entry.notes, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RefillEditor(
    initial: CloudFuelEntry?,
    vehicleId: String,
    fuelTypes: List<CloudFuelType>,
    currency: String,
    unit: String,
    suggestedOdometer: Double?,
    onSave: (CloudFuelEntry) -> Unit,
    onDismiss: () -> Unit,
) {
    var date by remember { mutableStateOf(initial?.refillDate ?: LocalDate.now().toString()) }
    var odometer by remember { mutableStateOf(initial?.odometer?.let { formatPlain(it) } ?: suggestedOdometer?.let { formatPlain(it) } ?: "") }
    var fuel by remember { mutableStateOf(initial?.fuelAmount?.let { formatPlain(it) } ?: "") }
    var cost by remember { mutableStateOf(initial?.totalCost?.let { formatPlain(it) } ?: "") }
    var notes by remember { mutableStateOf(initial?.notes ?: "") }
    var fuelType by remember { mutableStateOf(fuelTypes.firstOrNull { it.id == initial?.fuelTypeId } ?: fuelTypes.firstOrNull() ?: CloudFuelType.DEFAULTS.first()) }
    var typeMenu by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    val save = {
        val o = odometer.toPositiveDouble()
        val f = fuel.toPositiveDouble()
        val c = cost.toPositiveDouble()
        when {
            o == null -> error = "Enter a valid odometer reading"
            f == null || f <= 0 -> error = "Enter litres filled"
            c == null || c <= 0 -> error = "Enter the amount paid"
            else -> {
                onSave(
                    CloudFuelEntry(
                        id = initial?.id ?: "entry_${System.currentTimeMillis()}",
                        vehicleId = vehicleId,
                        fuelTypeId = fuelType.id,
                        fuelTypeName = fuelType.name,
                        odometer = o,
                        fuelAmount = Math.round(f * 100) / 100.0,
                        totalCost = Math.round(c * 100) / 100.0,
                        pricePerLiter = Math.round(c / f * 100) / 100.0,
                        refillDate = date,
                        notes = notes.trim(),
                        createdAt = initial?.createdAt ?: System.currentTimeMillis(),
                    )
                )
                onDismiss()
            }
        }
    }

    FullScreenEditor(
        title = if (initial == null) "Log Refill" else "Edit Refill",
        onDismiss = onDismiss,
        actions = { TextButton(onClick = save) { Text("Save", fontWeight = FontWeight.Bold) } },
    ) {
        DateField(date, { date = it }, "Refill date")
        NumberField(odometer, { odometer = it }, "Odometer ($unit)")
        ExposedDropdownMenuBox(expanded = typeMenu, onExpandedChange = { typeMenu = it }) {
            OutlinedTextField(
                value = fuelType.name,
                onValueChange = {},
                readOnly = true,
                label = { Text("Fuel type") },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = typeMenu) },
                modifier = Modifier.fillMaxWidth().menuAnchor(),
            )
            ExposedDropdownMenu(expanded = typeMenu, onDismissRequest = { typeMenu = false }) {
                fuelTypes.forEach { t ->
                    DropdownMenuItem(text = { Text(t.name) }, onClick = { fuelType = t; typeMenu = false })
                }
            }
        }
        NumberField(fuel, { fuel = it }, "Fuel filled (L)")
        NumberField(cost, { cost = it }, "Amount paid", prefix = currency,
            supporting = run {
                val f = fuel.toPositiveDouble(); val c = cost.toPositiveDouble()
                if (f != null && c != null && f > 0) "≈ ${money(currency, c / f, 2)} per litre" else null
            })
        OutlinedTextField(notes, { notes = it }, label = { Text("Notes (optional)") }, modifier = Modifier.fillMaxWidth())
        error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        Button(onClick = save, modifier = Modifier.fillMaxWidth().height(52.dp)) { Text("Save Refill", fontWeight = FontWeight.Bold) }
    }
}

fun formatPlain(v: Double): String = if (v % 1.0 == 0.0) v.toLong().toString() else v.toString()

@Composable
fun ConfirmDelete(title: String, message: String, confirmText: String = "Delete", onConfirm: () -> Unit, onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title) },
        text = { Text(message) },
        confirmButton = {
            TextButton(onClick = { onConfirm(); onDismiss() }) { Text(confirmText, color = MaterialTheme.colorScheme.error) }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
    )
}
