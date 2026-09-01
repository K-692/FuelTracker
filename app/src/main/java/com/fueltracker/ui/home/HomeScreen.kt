package com.fueltracker.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.LocalGasStation
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.SyncAlt
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onAddFuelClick: () -> Unit,
    onHistoryClick: () -> Unit,
    onVehicleSelectClick: () -> Unit,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val dateFormat = SimpleDateFormat("dd MMM yyyy", Locale.getDefault())

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    Row(
                        modifier = Modifier.clickable { onVehicleSelectClick() },
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = uiState.selectedVehicle?.name ?: "Fuel Tracker",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.ExtraBold
                        )
                        if (uiState.selectedVehicle != null) {
                            Spacer(modifier = Modifier.width(8.dp))
                            Icon(
                                Icons.Default.SyncAlt,
                                contentDescription = "Switch Vehicle",
                                modifier = Modifier.size(20.dp),
                                tint = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                    containerColor = Color.Transparent
                ),
                actions = {
                    if (uiState.selectedVehicle != null) {
                        IconButton(onClick = onVehicleSelectClick) {
                            Icon(Icons.Default.SyncAlt, contentDescription = "Switch Vehicle")
                        }
                    }
                }
            )
        },
        floatingActionButton = {
            if (uiState.selectedVehicle != null) {
                ExtendedFloatingActionButton(
                    onClick = onAddFuelClick,
                    containerColor = MaterialTheme.colorScheme.primary,
                    contentColor = MaterialTheme.colorScheme.onPrimary,
                    shape = MaterialTheme.shapes.large
                ) {
                    Icon(Icons.Default.Add, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Add Fuel", fontWeight = FontWeight.Bold)
                }
            }
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f),
                            MaterialTheme.colorScheme.background
                        )
                    )
                )
        ) {
            if (uiState.isLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else if (uiState.selectedVehicle == null) {
                Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(32.dp)) {
                        Icon(
                            Icons.Default.LocalGasStation,
                            contentDescription = null,
                            modifier = Modifier.size(100.dp),
                            tint = MaterialTheme.colorScheme.primary.copy(alpha = 0.2f)
                        )
                        Spacer(modifier = Modifier.height(24.dp))
                        Text(
                            "Welcome to Fuel Tracker",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            "Track mileage and costs for all your vehicles in one place.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.outline,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                            modifier = Modifier.padding(vertical = 8.dp)
                        )
                        Spacer(modifier = Modifier.height(24.dp))
                        Button(
                            onClick = onVehicleSelectClick,
                            shape = MaterialTheme.shapes.large,
                            modifier = Modifier.fillMaxWidth().height(56.dp)
                        ) {
                            Text("Add Your First Vehicle")
                        }
                    }
                }
            } else {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                        .padding(horizontal = 20.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(24.dp)
                ) {
                    // Modern Scoreboard Card
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        color = MaterialTheme.colorScheme.primary,
                        shape = MaterialTheme.shapes.extraLarge,
                        shadowElevation = 8.dp
                    ) {
                        Column(
                            modifier = Modifier.padding(32.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                "AVERAGE MILEAGE",
                                style = MaterialTheme.typography.labelLarge,
                                color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.7f),
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            Row(verticalAlignment = Alignment.Bottom) {
                                Text(
                                    text = uiState.averageMileage?.let { "%.2f".format(it) } ?: "---",
                                    style = MaterialTheme.typography.displayLarge.copy(
                                        fontWeight = FontWeight.Black,
                                        fontSize = 64.sp
                                    ),
                                    color = MaterialTheme.colorScheme.onPrimary
                                )
                                Text(
                                    text = " km/L",
                                    style = MaterialTheme.typography.titleLarge,
                                    color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.9f),
                                    modifier = Modifier.padding(bottom = 12.dp, start = 4.dp)
                                )
                            }
                        }
                    }

                    // Key Metrics Grid
                    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                        Text(
                            "Latest Refill Summary",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                            ModernStatCard(
                                modifier = Modifier.weight(1f),
                                label = "Last Amount",
                                value = uiState.lastFuelAmount?.let { "%.1f L".format(it) } ?: "N/A",
                                icon = Icons.Default.LocalGasStation
                            )
                            ModernStatCard(
                                modifier = Modifier.weight(1f),
                                label = "Total Cost",
                                value = uiState.lastCost?.let { "₹%.0f".format(it) } ?: "N/A",
                                icon = Color.Unspecified // Just a placeholder
                            )
                        }

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                            ModernStatCard(
                                modifier = Modifier.weight(1f),
                                label = "Odometer",
                                value = uiState.lastOdometer?.let { "%.0f km".format(it) } ?: "N/A",
                                icon = Icons.Default.Speed
                            )
                            ModernStatCard(
                                modifier = Modifier.weight(1f),
                                label = "Refill Date",
                                value = uiState.lastRefillDate?.let { dateFormat.format(Date(it)) } ?: "N/A",
                                icon = Icons.Default.History
                            )
                        }
                    }

                    // Latest Entry Quick View
                    uiState.latestEntry?.let { entry ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Recent Refill", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                            TextButton(onClick = onHistoryClick) {
                                Text("Full History")
                            }
                        }

                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            onClick = onHistoryClick,
                            shape = MaterialTheme.shapes.extraLarge,
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.surfaceColorAtElevation(4.dp)
                            )
                        ) {
                            Row(
                                modifier = Modifier.padding(20.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Surface(
                                    color = MaterialTheme.colorScheme.primaryContainer,
                                    shape = MaterialTheme.shapes.medium,
                                    modifier = Modifier.size(56.dp)
                                ) {
                                    Icon(
                                        Icons.Default.LocalGasStation,
                                        contentDescription = null,
                                        modifier = Modifier.padding(14.dp),
                                        tint = MaterialTheme.colorScheme.primary
                                    )
                                }
                                Spacer(modifier = Modifier.width(16.dp))
                                Column {
                                    Text("${entry.fuelAmount} L • ₹${entry.totalCost}", fontWeight = FontWeight.ExtraBold, style = MaterialTheme.typography.bodyLarge)
                                    Text("${dateFormat.format(Date(entry.refillDate))} at ${entry.odometer.toInt()} km", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.outline)
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(100.dp))
                }
            }
        }
    }
}

@Composable
fun ModernStatCard(modifier: Modifier = Modifier, label: String, value: String, icon: Any) {
    Surface(
        modifier = modifier,
        color = MaterialTheme.colorScheme.surface,
        shape = MaterialTheme.shapes.large,
        shadowElevation = 2.dp,
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(4.dp))
            Text(value, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.ExtraBold)
        }
    }
}
