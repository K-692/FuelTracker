package com.fueltracker.data.cloud

/**
 * Data models that mirror the web app's Cloud Firestore schema exactly, so web and
 * Android read and write the same documents:
 *
 *   users/{uid}/vehicles/{id}
 *   users/{uid}/fuel_entries/{id}
 *   users/{uid}/services/{id}
 *   users/{uid}/service_items/{id}
 *   users/{uid}/fuel_types/{id}
 *   users/{uid}/settings/preferences
 *
 * Parsing is defensive (numbers may arrive as Long, Double or String) and writing
 * uses merge, so fields this app does not know about are never removed.
 */

internal fun Any?.asDouble(): Double = when (this) {
    is Number -> this.toDouble()
    is String -> this.trim().toDoubleOrNull() ?: 0.0
    else -> 0.0
}

internal fun Any?.asLong(): Long = when (this) {
    is Number -> this.toLong()
    is String -> this.trim().toLongOrNull() ?: 0L
    else -> 0L
}

internal fun Any?.asIntOrNull(): Int? = when (this) {
    is Number -> this.toInt()
    is String -> this.trim().toIntOrNull()
    else -> null
}

internal fun Any?.asStringOrNull(): String? = when (this) {
    null -> null
    is String -> this.ifBlank { null }
    else -> this.toString()
}

/** Normalises any date value to the web's `YYYY-MM-DD` string. */
internal fun Any?.asIsoDate(): String {
    return when (this) {
        is String -> if (Regex("""^\d{4}-\d{2}-\d{2}""").containsMatchIn(this)) this.substring(0, 10) else this
        is Number -> java.time.Instant.ofEpochMilli(this.toLong())
            .atZone(java.time.ZoneId.systemDefault()).toLocalDate().toString()
        is com.google.firebase.Timestamp -> java.time.Instant.ofEpochMilli(this.toDate().time)
            .atZone(java.time.ZoneId.systemDefault()).toLocalDate().toString()
        else -> java.time.LocalDate.now().toString()
    }
}

enum class VehicleKind(val label: String, val emoji: String) {
    BIKE("Bike", "🏍️"), SCOOTER("Scooter", "🛵"), CAR("Car", "🚗"), OTHER("Other", "🚙");

    companion object {
        fun from(value: Any?): VehicleKind =
            entries.firstOrNull { it.name.equals(value?.toString(), ignoreCase = true) } ?: CAR
    }
}

data class CloudVehicle(
    val id: String,
    val name: String,
    val vehicleType: VehicleKind = VehicleKind.CAR,
    val registrationNumber: String? = null,
    val manufacturer: String? = null,
    val model: String? = null,
    val year: Int? = null,
    val createdAt: Long = System.currentTimeMillis(),
) {
    fun subtitle(): String = listOfNotNull(
        listOfNotNull(manufacturer, model).joinToString(" ").ifBlank { null },
        year?.let { "($it)" },
        registrationNumber,
    ).joinToString(" • ")

    fun toMap(): Map<String, Any?> = mapOf(
        "id" to id,
        "name" to name,
        "vehicleType" to vehicleType.name,
        "registrationNumber" to registrationNumber,
        "manufacturer" to manufacturer,
        "model" to model,
        "year" to year,
        "createdAt" to createdAt,
        "updatedAt" to System.currentTimeMillis(),
    )

    companion object {
        fun from(id: String, d: Map<String, Any?>) = CloudVehicle(
            id = id,
            name = d["name"].asStringOrNull() ?: "Vehicle",
            vehicleType = VehicleKind.from(d["vehicleType"]),
            registrationNumber = d["registrationNumber"].asStringOrNull(),
            manufacturer = d["manufacturer"].asStringOrNull(),
            model = d["model"].asStringOrNull(),
            year = d["year"].asIntOrNull(),
            createdAt = d["createdAt"].asLong().takeIf { it > 0 } ?: System.currentTimeMillis(),
        )
    }
}

data class CloudFuelEntry(
    val id: String,
    val vehicleId: String,
    val fuelTypeId: String = "ft_1",
    val fuelTypeName: String = "Regular Petrol",
    val odometer: Double,
    val fuelAmount: Double,
    val totalCost: Double,
    val pricePerLiter: Double,
    val refillDate: String,
    val notes: String? = null,
    val createdAt: Long = System.currentTimeMillis(),
) {
    fun toMap(): Map<String, Any?> = mapOf(
        "id" to id,
        "vehicleId" to vehicleId,
        "fuelTypeId" to fuelTypeId,
        "fuelTypeName" to fuelTypeName,
        "odometer" to odometer,
        "fuelAmount" to fuelAmount,
        "totalCost" to totalCost,
        "pricePerLiter" to pricePerLiter,
        "refillDate" to refillDate,
        "notes" to (notes ?: ""),
        "createdAt" to createdAt,
        "updatedAt" to System.currentTimeMillis(),
    )

    companion object {
        fun from(id: String, d: Map<String, Any?>): CloudFuelEntry {
            val amount = d["fuelAmount"].asDouble()
            val cost = d["totalCost"].asDouble()
            val price = d["pricePerLiter"].asDouble().takeIf { it > 0 }
                ?: if (amount > 0) cost / amount else 0.0
            return CloudFuelEntry(
                id = id,
                vehicleId = d["vehicleId"]?.toString() ?: "",
                fuelTypeId = d["fuelTypeId"]?.toString() ?: "ft_1",
                fuelTypeName = d["fuelTypeName"].asStringOrNull() ?: "Regular Petrol",
                odometer = d["odometer"].asDouble(),
                fuelAmount = amount,
                totalCost = cost,
                pricePerLiter = price,
                refillDate = d["refillDate"].asIsoDate(),
                notes = d["notes"].asStringOrNull(),
                createdAt = d["createdAt"].asLong().takeIf { it > 0 } ?: System.currentTimeMillis(),
            )
        }
    }
}

/** One item recorded inside a service: `components.{itemId} = { done, price, name }`. */
data class ServicedItem(val done: Boolean, val price: Double, val name: String?)

data class CloudService(
    val id: String,
    val vehicleId: String,
    val serviceDate: String,
    val odometer: Double,
    val serviceCenter: String? = null,
    val notes: String? = null,
    val totalCost: Double,
    val components: Map<String, ServicedItem> = emptyMap(),
    val createdAt: Long = System.currentTimeMillis(),
) {
    val doneItems: List<Pair<String, ServicedItem>>
        get() = components.filter { it.value.done }.toList()

    fun toMap(): Map<String, Any?> = mapOf(
        "id" to id,
        "vehicleId" to vehicleId,
        "serviceDate" to serviceDate,
        "odometer" to odometer,
        "serviceCenter" to serviceCenter,
        "notes" to notes,
        "totalCost" to totalCost,
        // Items switched off are written as done=false (Firestore merge keeps map keys).
        "components" to components.mapValues { (_, v) ->
            if (v.done) mapOf("done" to true, "price" to v.price, "name" to v.name)
            else mapOf("done" to false, "price" to 0.0)
        },
        "createdAt" to createdAt,
        "updatedAt" to System.currentTimeMillis(),
    )

    companion object {
        fun from(id: String, d: Map<String, Any?>): CloudService {
            @Suppress("UNCHECKED_CAST")
            val raw = d["components"] as? Map<String, Any?> ?: emptyMap()
            val comps = raw.mapNotNull { (key, value) ->
                val m = value as? Map<*, *> ?: return@mapNotNull null
                key to ServicedItem(
                    done = m["done"] == true,
                    price = m["price"].asDouble(),
                    name = m["name"].asStringOrNull(),
                )
            }.toMap()
            return CloudService(
                id = id,
                vehicleId = d["vehicleId"]?.toString() ?: "",
                serviceDate = d["serviceDate"].asIsoDate(),
                odometer = d["odometer"].asDouble(),
                serviceCenter = d["serviceCenter"].asStringOrNull(),
                notes = d["notes"].asStringOrNull(),
                totalCost = d["totalCost"].asDouble(),
                components = comps,
                createdAt = d["createdAt"].asLong().takeIf { it > 0 } ?: System.currentTimeMillis(),
            )
        }
    }
}

/** A user-defined servicing item (no pre-defined catalogue). */
data class CloudServiceItem(
    val id: String,
    val name: String,
    val category: String = "",
    val isEngineOil: Boolean = false,
    val createdAt: Long = System.currentTimeMillis(),
) {
    fun toMap(): Map<String, Any?> = mapOf(
        "id" to id,
        "name" to name,
        "category" to category,
        "isEngineOil" to isEngineOil,
        "createdAt" to createdAt,
        "updatedAt" to System.currentTimeMillis(),
    )

    companion object {
        fun from(id: String, d: Map<String, Any?>) = CloudServiceItem(
            id = id,
            name = d["name"].asStringOrNull() ?: id,
            category = d["category"].asStringOrNull() ?: "",
            isEngineOil = d["isEngineOil"] == true,
            createdAt = d["createdAt"].asLong().takeIf { it > 0 } ?: System.currentTimeMillis(),
        )
    }
}

data class CloudFuelType(val id: String, val name: String, val category: String = "") {
    companion object {
        fun from(id: String, d: Map<String, Any?>) = CloudFuelType(
            id = id,
            name = d["name"].asStringOrNull() ?: id,
            category = d["category"].asStringOrNull() ?: "",
        )

        /** Same defaults as the web app (web_app/src/services/defaultData.js). */
        val DEFAULTS = listOf(
            CloudFuelType("ft_1", "Regular Petrol", "Petrol"),
            CloudFuelType("ft_2", "Regular Petrol (E20)", "Petrol"),
            CloudFuelType("ft_3", "Premium Petrol 95", "Premium Petrol"),
            CloudFuelType("ft_4", "Premium Petrol 97+", "Premium Petrol"),
            CloudFuelType("ft_5", "Regular Diesel", "Diesel"),
            CloudFuelType("ft_6", "Premium Diesel", "Premium Diesel"),
            CloudFuelType("ft_7", "CNG", "CNG"),
            CloudFuelType("ft_8", "Auto LPG", "LPG"),
            CloudFuelType("ft_9", "Other", "Other"),
        )
    }
}

data class CloudPreferences(
    val engineOilInterval: Int = 5000,
    val engineOilMonthsInterval: Int = 6,
)
