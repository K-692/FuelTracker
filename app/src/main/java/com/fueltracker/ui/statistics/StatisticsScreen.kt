package com.fueltracker.ui.statistics

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.patrykandpatrick.vico.compose.axis.horizontal.rememberBottomAxis
import com.patrykandpatrick.vico.compose.axis.vertical.rememberStartAxis
import com.patrykandpatrick.vico.compose.chart.Chart
import com.patrykandpatrick.vico.compose.chart.line.lineChart
import com.patrykandpatrick.vico.core.entry.entryModelOf

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StatisticsScreen(
    viewModel: StatisticsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("Statistics", fontWeight = FontWeight.Bold) }
            )
        }
    ) { padding ->
        if (uiState.isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
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
                Text(
                    text = "Performance Overview",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold
                )
                
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    StatCard(modifier = Modifier.weight(1f), label = "Total Distance", value = "%.0f km".format(uiState.totalDistance))
                    StatCard(modifier = Modifier.weight(1f), label = "Total Fuel", value = "%.1f L".format(uiState.totalFuel))
                }
                
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    StatCard(modifier = Modifier.weight(1f), label = "Total Cost", value = "₹%.0f".format(uiState.totalSpending))
                    StatCard(modifier = Modifier.weight(1f), label = "Avg Mileage", value = "%.1f km/L".format(uiState.averageMileage))
                }

                if (uiState.mileageHistory.isNotEmpty()) {
                    Text("Mileage Trend", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    val mileageEntries = uiState.mileageHistory.map { it.second.toFloat() }
                    Surface(
                        color = MaterialTheme.colorScheme.surfaceColorAtElevation(1.dp),
                        shape = MaterialTheme.shapes.large,
                        modifier = Modifier.fillMaxWidth().height(250.dp).padding(vertical = 8.dp)
                    ) {
                        Chart(
                            chart = lineChart(),
                            model = entryModelOf(*mileageEntries.toTypedArray()),
                            startAxis = rememberStartAxis(),
                            bottomAxis = rememberBottomAxis(),
                            modifier = Modifier.padding(16.dp)
                        )
                    }
                }

                if (uiState.costHistory.isNotEmpty()) {
                    Text("Spending Trend", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    val costEntries = uiState.costHistory.map { it.second.toFloat() }
                    Surface(
                        color = MaterialTheme.colorScheme.surfaceColorAtElevation(1.dp),
                        shape = MaterialTheme.shapes.large,
                        modifier = Modifier.fillMaxWidth().height(250.dp).padding(vertical = 8.dp)
                    ) {
                        Chart(
                            chart = lineChart(),
                            model = entryModelOf(*costEntries.toTypedArray()),
                            startAxis = rememberStartAxis(),
                            bottomAxis = rememberBottomAxis(),
                            modifier = Modifier.padding(16.dp)
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(32.dp))
            }
        }
    }
}

@Composable
fun StatCard(modifier: Modifier = Modifier, label: String, value: String) {
    Surface(
        modifier = modifier,
        color = MaterialTheme.colorScheme.surfaceColorAtElevation(1.dp),
        shape = MaterialTheme.shapes.large,
        tonalElevation = 1.dp
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
            Text(value, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        }
    }
}
