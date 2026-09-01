package com.fueltracker.ui.fuel

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.fueltracker.data.entity.FuelType
import com.fueltracker.data.entity.Vehicle

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddFuelScreen(
    onBackClick: () -> Unit,
    viewModel: AddFuelViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(uiState.isSaved) {
        if (uiState.isSaved) {
            onBackClick()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (uiState.isEditMode) "Edit Fuel Entry" else "Add Fuel") },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Vehicle Selector
            VehicleSelector(
                vehicles = uiState.vehicles,
                selectedVehicle = uiState.selectedVehicle,
                onVehicleSelected = { viewModel.onVehicleSelected(it) }
            )

            // Fuel Type Selector
            FuelTypeSelector(
                fuelTypes = uiState.fuelTypes,
                selectedFuelType = uiState.selectedFuelType,
                onFuelTypeSelected = { viewModel.onFuelTypeSelected(it) }
            )

            OutlinedTextField(
                value = uiState.odometer,
                onValueChange = { viewModel.onOdometerChanged(it) },
                label = { Text("Odometer Reading (km)") },
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                shape = MaterialTheme.shapes.large
            )

            OutlinedTextField(
                value = uiState.fuelAmount,
                onValueChange = { viewModel.onFuelAmountChanged(it) },
                label = { Text("Fuel Quantity (Litres)") },
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                shape = MaterialTheme.shapes.large
            )

            OutlinedTextField(
                value = uiState.totalCost,
                onValueChange = { viewModel.onTotalCostChanged(it) },
                label = { Text("Total Cost (₹)") },
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                shape = MaterialTheme.shapes.large
            )

            OutlinedTextField(
                value = uiState.notes,
                onValueChange = { viewModel.onNotesChanged(it) },
                label = { Text("Notes (Optional)") },
                modifier = Modifier.fillMaxWidth(),
                shape = MaterialTheme.shapes.large
            )

            // Preview Calculations - Modern Look
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                shape = MaterialTheme.shapes.extraLarge
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(
                        text = "Calculated Insights",
                        style = MaterialTheme.typography.titleSmall,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        InsightItem("Distance", uiState.calculatedDistance?.let { "%.1f km".format(it) } ?: "N/A")
                        InsightItem("Price/L", uiState.calculatedPricePerLiter?.let { "₹%.2f".format(it) } ?: "N/A")
                        InsightItem("Mileage", uiState.calculatedMileage?.let { "%.2f km/L".format(it) } ?: "N/A")
                    }
                }
            }

            uiState.errorMessage?.let {
                Text(
                    text = it,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(start = 4.dp)
                )
            }

            Button(
                onClick = { viewModel.saveEntry() },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                enabled = uiState.odometer.isNotBlank() && uiState.fuelAmount.isNotBlank() && uiState.totalCost.isNotBlank(),
                shape = MaterialTheme.shapes.large
            ) {
                Text(
                    if (uiState.isEditMode) "Update Entry" else "Save Refill",
                    style = MaterialTheme.typography.titleMedium
                )
            }
        }
    }
}

@Composable
fun InsightItem(label: String, value: String) {
    Column(horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally) {
        Text(text = label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(text = value, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VehicleSelector(
    vehicles: List<Vehicle>,
    selectedVehicle: Vehicle?,
    onVehicleSelected: (Vehicle) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }
    ExposedDropdownMenuBox(
        expanded = expanded,
        onExpandedChange = { expanded = !expanded }
    ) {
        OutlinedTextField(
            value = selectedVehicle?.name ?: "Select Vehicle",
            onValueChange = {},
            readOnly = true,
            label = { Text("Vehicle") },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
            modifier = Modifier
                .menuAnchor()
                .fillMaxWidth(),
            shape = MaterialTheme.shapes.large
        )
        ExposedDropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false }
        ) {
            vehicles.forEach { vehicle ->
                DropdownMenuItem(
                    text = { Text(vehicle.name) },
                    onClick = {
                        onVehicleSelected(vehicle)
                        expanded = false
                    }
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FuelTypeSelector(
    fuelTypes: List<FuelType>,
    selectedFuelType: FuelType?,
    onFuelTypeSelected: (FuelType) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }
    ExposedDropdownMenuBox(
        expanded = expanded,
        onExpandedChange = { expanded = !expanded }
    ) {
        OutlinedTextField(
            value = selectedFuelType?.name ?: "Select Fuel Type",
            onValueChange = {},
            readOnly = true,
            label = { Text("Fuel Type") },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
            modifier = Modifier
                .menuAnchor()
                .fillMaxWidth(),
            shape = MaterialTheme.shapes.large
        )
        ExposedDropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false }
        ) {
            fuelTypes.forEach { fuelType ->
                DropdownMenuItem(
                    text = { Text("${fuelType.name} (${fuelType.brand ?: fuelType.category})") },
                    onClick = {
                        onFuelTypeSelected(fuelType)
                        expanded = false
                    }
                )
            }
        }
    }
}
