package com.fueltracker.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.fueltracker.ui.home.HomeScreen
import com.fueltracker.ui.statistics.StatisticsScreen
import com.fueltracker.ui.vehicles.VehiclesScreen
import com.fueltracker.ui.vehicles.VehicleSelectionScreen
import com.fueltracker.ui.fuel.AddFuelScreen
import com.fueltracker.ui.fuel.FuelDetailsScreen
import com.fueltracker.ui.history.FuelHistoryScreen
import com.fueltracker.ui.settings.SettingsScreen

@Composable
fun AppNavigation(navController: NavHostController) {
    NavHost(navController = navController, startDestination = Screen.VehicleSelection.route) {
        composable(Screen.VehicleSelection.route) {
            VehicleSelectionScreen(
                onVehicleSelected = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.VehicleSelection.route) { inclusive = true }
                    }
                }
            )
        }
        composable(Screen.Home.route) {
            HomeScreen(
                onAddFuelClick = { navController.navigate(Screen.AddFuel.createRoute()) },
                onHistoryClick = { navController.navigate(Screen.FuelHistory.route) },
                onVehicleSelectClick = { 
                    navController.navigate(Screen.VehicleSelection.route)
                }
            )
        }
        composable(Screen.Statistics.route) {
            StatisticsScreen()
        }
        composable(Screen.Vehicles.route) {
            VehiclesScreen(
                onBackClick = { navController.popBackStack() }
            )
        }
        composable(
            route = Screen.AddFuel.route,
            arguments = listOf(navArgument("entryId") { 
                type = NavType.StringType
                nullable = true
                defaultValue = null
            })
        ) {
            AddFuelScreen(
                onBackClick = { navController.popBackStack() }
            )
        }
        composable(Screen.FuelHistory.route) {
            FuelHistoryScreen(
                onEntryClick = { entryId ->
                    navController.navigate(Screen.FuelDetails.createRoute(entryId))
                },
                onBackClick = { navController.popBackStack() }
            )
        }
        composable(
            route = Screen.FuelDetails.route,
            arguments = listOf(navArgument("entryId") { type = NavType.LongType })
        ) {
            FuelDetailsScreen(
                onEditClick = { entryId ->
                    navController.navigate(Screen.AddFuel.createRoute(entryId))
                },
                onBackClick = { navController.popBackStack() }
            )
        }
        composable(Screen.Settings.route) {
            SettingsScreen(
                onBackClick = { navController.popBackStack() },
                onManageVehiclesClick = { navController.navigate(Screen.Vehicles.route) }
            )
        }
    }
}
