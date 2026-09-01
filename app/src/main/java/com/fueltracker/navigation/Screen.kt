package com.fueltracker.navigation

sealed class Screen(val route: String) {
    object VehicleSelection : Screen("vehicle_selection")
    object Home : Screen("home")
    object Statistics : Screen("statistics")
    object Vehicles : Screen("vehicles")
    object AddVehicle : Screen("add_vehicle")
    object AddFuel : Screen("add_fuel?entryId={entryId}") {
        fun createRoute(entryId: Long? = null) = if (entryId != null) "add_fuel?entryId=$entryId" else "add_fuel"
    }
    object FuelHistory : Screen("fuel_history")
    object FuelDetails : Screen("fuel_details/{entryId}") {
        fun createRoute(entryId: Long) = "fuel_details/$entryId"
    }
    object Settings : Screen("settings")
}
