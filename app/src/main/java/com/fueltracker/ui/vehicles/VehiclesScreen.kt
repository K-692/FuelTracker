package com.fueltracker.ui.vehicles

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.fueltracker.data.entity.Vehicle
import com.fueltracker.data.entity.VehicleType

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VehiclesScreen(
    onBackClick: () -> Unit,
    viewModel: VehicleViewModel = hiltViewModel()
) {
    val vehicles by viewModel.allVehicles.collectAsState()
    val selectedVehicleId by viewModel.selectedVehicleId.collectAsState()
    var showAddDialog by remember { mutableStateOf(false) }
    var vehicleToEdit by remember { mutableStateOf<Vehicle?>(null) }
    var vehicleToDelete by remember { mutableStateOf<Vehicle?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("My Vehicles") },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { showAddDialog = true }) {
                Icon(Icons.Default.Add, contentDescription = "Add Vehicle")
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(vehicles) { vehicle ->
                VehicleItem(
                    vehicle = vehicle,
                    isSelected = vehicle.id == selectedVehicleId,
                    onSelect = { viewModel.selectVehicle(vehicle.id) },
                    onEdit = { vehicleToEdit = vehicle },
                    onDelete = { vehicleToDelete = vehicle }
                )
            }
        }

        if (showAddDialog) {
            VehicleDialog(
                title = "Add Vehicle",
                onDismiss = { showAddDialog = false },
                onConfirm = { name, type ->
                    viewModel.addVehicle(Vehicle(name = name, vehicleType = type))
                    showAddDialog = false
                }
            )
        }

        vehicleToEdit?.let { vehicle ->
            VehicleDialog(
                title = "Edit Vehicle",
                initialName = vehicle.name,
                initialType = vehicle.vehicleType,
                onDismiss = { vehicleToEdit = null },
                onConfirm = { name, type ->
                    viewModel.updateVehicle(vehicle.copy(name = name, vehicleType = type))
                    vehicleToEdit = null
                }
            )
        }

        vehicleToDelete?.let { vehicle ->
            AlertDialog(
                onDismissRequest = { vehicleToDelete = null },
                title = { Text("Delete Vehicle") },
                text = { Text("Are you sure you want to delete '${vehicle.name}'? This will delete all fuel entries for this vehicle.") },
                confirmButton = {
                    Button(
                        onClick = {
                            viewModel.deleteVehicle(vehicle)
                            vehicleToDelete = null
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                    ) {
                        Text("Delete")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { vehicleToDelete = null }) {
                        Text("Cancel")
                    }
                }
            )
        }
    }
}

@Composable
fun VehicleItem(
    vehicle: Vehicle,
    isSelected: Boolean,
    onSelect: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onSelect() },
        colors = if (isSelected) CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
        else CardDefaults.cardColors()
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(text = vehicle.name, style = MaterialTheme.typography.titleLarge)
                Text(text = vehicle.vehicleType.name, style = MaterialTheme.typography.bodyMedium)
            }
            Row {
                if (isSelected) {
                    Icon(
                        Icons.Default.Check, 
                        contentDescription = "Selected", 
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.padding(end = 8.dp)
                    )
                }
                IconButton(onClick = onEdit) {
                    Icon(Icons.Default.Edit, contentDescription = "Edit")
                }
                IconButton(onClick = onDelete) {
                    Icon(Icons.Default.Delete, contentDescription = "Delete")
                }
            }
        }
    }
}

@Composable
fun VehicleDialog(
    title: String,
    initialName: String = "",
    initialType: VehicleType = VehicleType.CAR,
    onDismiss: () -> Unit,
    onConfirm: (String, VehicleType) -> Unit
) {
    var name by remember { mutableStateOf(initialName) }
    var type by remember { mutableStateOf(initialType) }
    var expanded by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Vehicle Name") },
                    modifier = Modifier.fillMaxWidth()
                )
                Box(modifier = Modifier.fillMaxWidth()) {
                    OutlinedButton(
                        onClick = { expanded = true },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Type: ${type.name}")
                    }
                    DropdownMenu(
                        expanded = expanded,
                        onDismissRequest = { expanded = false }
                    ) {
                        VehicleType.values().forEach { vehicleType ->
                            DropdownMenuItem(
                                text = { Text(vehicleType.name) },
                                onClick = {
                                    type = vehicleType
                                    expanded = false
                                }
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = { if (name.isNotBlank()) onConfirm(name, type) },
                enabled = name.isNotBlank()
            ) {
                Text("Confirm")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
