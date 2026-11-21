package com.fueltracker.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Checklist
import androidx.compose.material3.Button
import androidx.compose.material3.Checkbox
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.fueltracker.data.cloud.CloudService
import com.fueltracker.data.cloud.CloudServiceItem
import com.fueltracker.data.cloud.ServicedItem
import com.fueltracker.domain.OilState
import com.fueltracker.domain.OilStatus
import com.fueltracker.domain.ServiceItems
import com.fueltracker.ui.UiState
import com.fueltracker.ui.components.DateField
import com.fueltracker.ui.components.EmptyState
import com.fueltracker.ui.components.FullScreenEditor
import com.fueltracker.ui.components.MetricColumn
import com.fueltracker.ui.components.NameSuggestions
import com.fueltracker.ui.components.NumberField
import com.fueltracker.ui.components.PageHeader
import com.fueltracker.ui.components.SectionCard
import com.fueltracker.ui.components.Tag
import com.fueltracker.ui.components.VehiclePills
import com.fueltracker.ui.components.formatDate
import com.fueltracker.ui.components.formatNumber
import com.fueltracker.ui.components.money
import com.fueltracker.ui.components.toPositiveDouble
import com.fueltracker.ui.theme.BrandDanger
import com.fueltracker.ui.theme.BrandGreen
import com.fueltracker.ui.theme.BrandOrange
import java.time.LocalDate

fun oilColor(state: OilState): Color = when (state) {
    OilState.OVERDUE -> BrandDanger
    OilState.WARNING -> BrandOrange
    OilState.OK -> BrandGreen
    OilState.NO_HISTORY -> Color.Gray
}

fun oilShortText(s: OilStatus, unit: String): String = when (s.state) {
    OilState.OVERDUE -> "Oil due"
    else -> {
        val km = s.remainingDistance.coerceAtLeast(0.0)
        if (km >= 1000) "${formatNumber(km / 1000, 1)}k $unit" else "${formatNumber(km)} $unit"
    }
}

@Composable
fun ServicesScreen(
    state: UiState,
    oil: OilStatus?,
    onSelectVehicle: (String) -> Unit,
    onAddService: () -> Unit,
    onEditService: (CloudService) -> Unit,
    onDeleteService: (CloudService) -> Unit,
    onManageItems: () -> Unit,
) {
    val services = state.activeServices
    val items = state.data.serviceItems
    LazyColumn(contentPadding = screenPadding, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            PageHeader("Services", "Maintenance history for ${state.activeVehicle?.name ?: "your vehicle"}")
            VehiclePills(state.data.vehicles, state.activeVehicle?.id, onSelectVehicle)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(onClick = onManageItems, modifier = Modifier.weight(1f)) {
                    Icon(Icons.Default.Checklist, contentDescription = null)
                    Text("  My Items (${items.size})")
                }
                Button(onClick = onAddService, modifier = Modifier.weight(1f)) {
                    Icon(Icons.Default.Add, contentDescription = null)
                    Text("  Log Service", fontWeight = FontWeight.Bold)
                }
            }
        }
        if (oil != null && state.activeVehicle != null) {
            item { OilCard(oil, state.unit) }
        }
        if (services.isEmpty()) {
            item { EmptyState("No service records yet", "Log periodic services, parts and workshop bills here.") }
        }
        items(services, key = { it.id }) { s ->
            SectionCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text(formatDate(s.serviceDate), fontWeight = FontWeight.ExtraBold)
                        Text(
                            listOfNotNull("${formatNumber(s.odometer)} ${state.unit}", s.serviceCenter).joinToString(" • "),
                            style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    Text(money(state.currency, s.totalCost), fontWeight = FontWeight.ExtraBold)
                    IconButton(onClick = { onEditService(s) }) { Icon(Icons.Default.Edit, contentDescription = "Edit service") }
                    IconButton(onClick = { onDeleteService(s) }) {
                        Icon(Icons.Default.Delete, contentDescription = "Delete service", tint = MaterialTheme.colorScheme.error)
                    }
                }
                val done = s.doneItems
                if (done.isNotEmpty()) {
                    Spacer(Modifier.height(8.dp))
                    done.forEach { (id, data) ->
                        Row(Modifier.fillMaxWidth().padding(vertical = 2.dp)) {
                            Text("• " + ServiceItems.nameOf(id, items, data), Modifier.weight(1f), color = BrandGreen, fontWeight = FontWeight.SemiBold)
                            if (data.price > 0) Text(money(state.currency, data.price))
                        }
                    }
                }
                if (!s.notes.isNullOrBlank()) {
                    Spacer(Modifier.height(6.dp))
                    Text(s.notes, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }
    }
}

@Composable
fun OilCard(oil: OilStatus, unit: String) {
    val color = oilColor(oil.state)
    SectionCard(accent = color) {
        Text("Engine-oil reminder", fontWeight = FontWeight.ExtraBold)
        Text(
            when (oil.state) {
                OilState.OVERDUE -> "Oil change is due now."
                OilState.WARNING -> "Oil change due soon."
                OilState.OK -> "Last changed ${formatDate(oil.lastOilDate?.toString())}."
                OilState.NO_HISTORY -> "No oil change logged yet. Mark an item as Engine oil and log it in a service."
            },
            style = MaterialTheme.typography.bodySmall, color = color,
        )
        Spacer(Modifier.height(8.dp))
        val kmUsed = (1 - oil.remainingDistance / oil.intervalKm).coerceIn(0.0, 1.0)
        LinearProgressIndicator(progress = { kmUsed.toFloat() }, modifier = Modifier.fillMaxWidth(), color = color)
        Spacer(Modifier.height(8.dp))
        Row(Modifier.fillMaxWidth()) {
            MetricColumn("Distance left", "${formatNumber(oil.remainingDistance.coerceAtLeast(0.0))} $unit", Modifier.weight(1f), color)
            MetricColumn("Time left", oil.remainingDays?.let { if (it > 0) "$it days" else "Overdue" } ?: "--", Modifier.weight(1f), color)
        }
        Spacer(Modifier.height(4.dp))
        Text(
            "Due at ${formatNumber(oil.nextDueOdometer)} $unit" + (oil.nextDueDate?.let { " or ${formatDate(it.toString())}" } ?: "") +
                " — every ${formatNumber(oil.intervalKm.toDouble())} $unit / ${oil.intervalMonths} months",
            style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

private data class ItemEdit(val done: Boolean, val price: String, val name: String?)

@Composable
fun ServiceEditor(
    initial: CloudService?,
    vehicleId: String,
    items: List<CloudServiceItem>,
    currency: String,
    unit: String,
    suggestedOdometer: Double?,
    onAddItem: (name: String, isOil: Boolean) -> CloudServiceItem?,
    pastServices: List<CloudService>,
    onSave: (CloudService) -> Unit,
    onDismiss: () -> Unit,
) {
    val suggestions = remember(pastServices, items) { ServiceItems.nameSuggestions(pastServices, items) }
    var date by remember { mutableStateOf(initial?.serviceDate ?: LocalDate.now().toString()) }
    var odometer by remember { mutableStateOf(initial?.odometer?.let(::formatPlain) ?: suggestedOdometer?.let(::formatPlain) ?: "") }
    var center by remember { mutableStateOf(initial?.serviceCenter ?: "") }
    var notes by remember { mutableStateOf(initial?.notes ?: "") }
    var total by remember { mutableStateOf(initial?.totalCost?.let(::formatPlain) ?: "") }
    val state = remember {
        mutableStateMapOf<String, ItemEdit>().apply {
            initial?.components?.forEach { (id, d) ->
                put(id, ItemEdit(d.done, if (d.done && d.price > 0) formatPlain(d.price) else "", d.name))
            }
        }
    }
    val addedLocally = remember { mutableStateMapOf<String, CloudServiceItem>() }
    var newName by remember { mutableStateOf("") }
    var newIsOil by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    val allItems = run {
        val list = ServiceItems.sorted((items + addedLocally.values).distinctBy { it.id }).toMutableList()
        state.filter { it.value.done && list.none { i -> i.id == it.key } }.forEach { (id, e) ->
            list += CloudServiceItem(id, e.name ?: ServiceItems.nameOf(id, items))
        }
        list
    }
    val sum = state.values.filter { it.done }.sumOf { it.price.toPositiveDouble() ?: 0.0 }

    val save = {
        val o = odometer.toPositiveDouble()
        val t = total.toPositiveDouble()
        when {
            o == null -> error = "Enter a valid odometer reading"
            t == null -> error = "Enter the total bill"
            else -> {
                val comps = state.mapValues { (id, e) ->
                    ServicedItem(
                        done = e.done,
                        price = if (e.done) e.price.toPositiveDouble() ?: 0.0 else 0.0,
                        name = allItems.firstOrNull { it.id == id }?.name ?: e.name,
                    )
                }
                onSave(
                    CloudService(
                        id = initial?.id ?: "srv_${System.currentTimeMillis()}",
                        vehicleId = vehicleId,
                        serviceDate = date,
                        odometer = o,
                        serviceCenter = center.trim().ifBlank { null },
                        notes = notes.trim().ifBlank { null },
                        totalCost = t,
                        components = comps,
                        createdAt = initial?.createdAt ?: System.currentTimeMillis(),
                    )
                )
                onDismiss()
            }
        }
    }

    FullScreenEditor(
        title = if (initial == null) "Log Service" else "Edit Service",
        onDismiss = onDismiss,
        actions = { TextButton(onClick = save) { Text("Save", fontWeight = FontWeight.Bold) } },
    ) {
        DateField(date, { date = it }, "Service date")
        NumberField(odometer, { odometer = it }, "Odometer ($unit)")
        OutlinedTextField(center, { center = it }, label = { Text("Service center (optional)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(notes, { notes = it }, label = { Text("Notes (optional)") }, modifier = Modifier.fillMaxWidth())

        Text("Items serviced", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.ExtraBold)
        Text("Your own items. Tap Yes for each one done and enter its charge. New items are saved for next time.",
            style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)

        // Add a new item inline
        OutlinedTextField(newName, { newName = it.take(60) }, label = { Text("Type an item, e.g. Chain lubrication") },
            singleLine = true, modifier = Modifier.fillMaxWidth())
        NameSuggestions(newName, suggestions) { newName = it.name }
        Row(verticalAlignment = Alignment.CenterVertically) {
            Checkbox(checked = newIsOil, onCheckedChange = { newIsOil = it })
            Text("Engine oil (for reminders)", Modifier.weight(1f))
            Button(onClick = {
                val created = onAddItem(newName, newIsOil)
                if (created != null) {
                    addedLocally[created.id] = created
                    state[created.id] = ItemEdit(true, state[created.id]?.price ?: "", created.name)
                    newName = ""; newIsOil = false
                }
            }, enabled = newName.isNotBlank()) { Text("Add") }
        }

        if (allItems.isEmpty()) {
            Text("No items yet — add the first thing you get serviced above.", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        allItems.forEach { item ->
            val e = state[item.id] ?: ItemEdit(false, "", item.name)
            Surface(
                shape = MaterialTheme.shapes.medium,
                color = if (e.done) BrandGreen.copy(alpha = 0.08f) else MaterialTheme.colorScheme.surface,
                border = BorderStroke(1.dp, if (e.done) BrandGreen.copy(alpha = 0.5f) else MaterialTheme.colorScheme.outlineVariant),
            ) {
                Column(Modifier.padding(12.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(item.name, fontWeight = if (e.done) FontWeight.Bold else FontWeight.Normal, color = if (e.done) BrandGreen else MaterialTheme.colorScheme.onSurface)
                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                if (ServiceItems.isEngineOil(item)) Tag("Engine oil reminder", BrandOrange)
                                if (item.category.isNotBlank()) Tag(item.category)
                            }
                        }
                        FilterChip(selected = !e.done, onClick = { state[item.id] = e.copy(done = false) }, label = { Text("No") })
                        Spacer(Modifier.width(6.dp))
                        FilterChip(selected = e.done, onClick = { state[item.id] = e.copy(done = true, name = item.name) }, label = { Text("Yes") })
                    }
                    if (e.done) {
                        NumberField(e.price, { state[item.id] = e.copy(price = it) }, "Charge", prefix = currency)
                    }
                }
            }
        }

        NumberField(total, { total = it }, "Total bill", prefix = currency,
            supporting = if (sum > 0) "Items add up to ${money(currency, sum)}" else null)
        if (sum > 0) {
            TextButton(onClick = { total = formatPlain(sum) }) { Text("Use items total (${money(currency, sum)})") }
        }
        error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        Button(onClick = save, modifier = Modifier.fillMaxWidth().height(52.dp)) { Text("Save Service", fontWeight = FontWeight.Bold) }
    }
}

@Composable
fun ServiceItemsManager(
    items: List<CloudServiceItem>,
    services: List<CloudService>,
    onAdd: (name: String, category: String, isOil: Boolean) -> Unit,
    onUpdate: (CloudServiceItem) -> Unit,
    onDelete: (CloudServiceItem) -> Unit,
    onDismiss: () -> Unit,
) {
    var name by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("") }
    var isOil by remember { mutableStateOf(false) }
    var editing by remember { mutableStateOf<CloudServiceItem?>(null) }
    val usage = services.flatMap { s -> s.doneItems.map { it.first } }.groupingBy { it }.eachCount()
    val suggestions = remember(services, items) { ServiceItems.nameSuggestions(services, items).filter { !it.inList } }

    FullScreenEditor(title = "My Service Items", onDismiss = onDismiss, actions = {}) {
        Text("Build your own list of parts and jobs. They appear in every service, for all vehicles, on Android and web.",
            style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        OutlinedTextField(name, { name = it.take(60) }, label = { Text("Item name") }, singleLine = true, modifier = Modifier.fillMaxWidth())
        NameSuggestions(name, suggestions) { name = it.name }
        OutlinedTextField(category, { category = it.take(40) }, label = { Text("Group (optional)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
        Row(verticalAlignment = Alignment.CenterVertically) {
            Checkbox(checked = isOil, onCheckedChange = { isOil = it })
            Text("Engine oil (for reminders)", Modifier.weight(1f))
            Button(onClick = { onAdd(name, category, isOil); name = ""; category = ""; isOil = false }, enabled = name.isNotBlank()) {
                Icon(Icons.Default.Add, contentDescription = null)
                Text(" Add")
            }
        }
        if (items.isEmpty()) {
            Text("No items yet.", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        ServiceItems.sorted(items).forEach { item ->
            SectionCard {
                val edit = editing
                if (edit != null && edit.id == item.id) {
                    OutlinedTextField(edit.name, { editing = edit.copy(name = it.take(60)) }, label = { Text("Name") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                    OutlinedTextField(edit.category, { editing = edit.copy(category = it.take(40)) }, label = { Text("Group") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(checked = edit.isEngineOil, onCheckedChange = { editing = edit.copy(isEngineOil = it) })
                        Text("Engine oil", Modifier.weight(1f))
                        IconButton(onClick = { if (edit.name.isNotBlank()) { onUpdate(edit.copy(name = edit.name.trim())); editing = null } }) {
                            Icon(Icons.Default.Check, contentDescription = "Save", tint = BrandGreen)
                        }
                        IconButton(onClick = { editing = null }) { Icon(Icons.Default.Close, contentDescription = "Cancel") }
                    }
                } else {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(item.name, fontWeight = FontWeight.Bold)
                            Text(
                                listOfNotNull(
                                    if (ServiceItems.isEngineOil(item)) "🛢️ Engine oil reminder" else null,
                                    item.category.ifBlank { null },
                                    usage[item.id]?.let { "Used in $it service${if (it == 1) "" else "s"}" } ?: "Not used yet",
                                ).joinToString(" • "),
                                style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                        IconButton(onClick = { editing = item.copy(isEngineOil = ServiceItems.isEngineOil(item)) }) {
                            Icon(Icons.Default.Edit, contentDescription = "Edit ${item.name}")
                        }
                        IconButton(onClick = { onDelete(item) }) {
                            Icon(Icons.Default.Delete, contentDescription = "Remove ${item.name}", tint = MaterialTheme.colorScheme.error)
                        }
                    }
                }
            }
        }
    }
}
