package com.fueltracker.domain

import com.fueltracker.data.cloud.CloudFuelEntry
import com.fueltracker.data.cloud.CloudService
import com.fueltracker.data.cloud.CloudServiceItem
import com.fueltracker.data.cloud.ServicedItem
import java.time.LocalDate
import java.time.temporal.ChronoUnit

/** Mirrors web_app/src/domain/serviceItems.js so both apps behave the same. */
object ServiceItems {
    const val LEGACY_ENGINE_OIL_ID = "engine_oil"

    fun isEngineOil(item: CloudServiceItem) = item.isEngineOil || item.id == LEGACY_ENGINE_OIL_ID

    fun engineOilIds(items: List<CloudServiceItem>): Set<String> =
        items.filter(::isEngineOil).map { it.id }.toSet() + LEGACY_ENGINE_OIL_ID

    fun sorted(items: List<CloudServiceItem>) = items.sortedWith(
        compareByDescending<CloudServiceItem> { isEngineOil(it) }.thenBy { it.name.lowercase() }
    )

    fun slug(name: String): String =
        name.lowercase().trim().replace(Regex("[^a-z0-9]+"), "_").trim('_').take(40).ifBlank { "item" }

    fun newItem(name: String, category: String, isEngineOil: Boolean, existing: List<CloudServiceItem>): CloudServiceItem {
        val now = System.currentTimeMillis()
        var id = "item_${slug(name)}"
        if (existing.any { it.id == id }) id = "${id}_${now.toString(36)}"
        return CloudServiceItem(id, name.trim(), category.trim(), isEngineOil, now)
    }

    fun nameOf(id: String, items: List<CloudServiceItem>, data: ServicedItem? = null): String =
        items.firstOrNull { it.id == id }?.name
            ?: data?.name
            ?: id.removePrefix("item_").replace('_', ' ').replaceFirstChar { it.uppercase() }

    data class NameSuggestion(val name: String, val count: Int, val inList: Boolean)

    /** Names used before: current items + item names found in past service records. */
    fun nameSuggestions(services: List<CloudService>, items: List<CloudServiceItem>): List<NameSuggestion> {
        val map = LinkedHashMap<String, NameSuggestion>()
        fun add(name: String?, inc: Int, inList: Boolean) {
            val clean = name?.trim().orEmpty()
            if (clean.isEmpty()) return
            val key = clean.lowercase()
            val cur = map[key] ?: NameSuggestion(clean, 0, false)
            map[key] = cur.copy(count = cur.count + inc, inList = cur.inList || inList)
        }
        items.forEach { add(it.name, 0, true) }
        services.forEach { s -> s.doneItems.forEach { (id, data) -> add(nameOf(id, items, data), 1, false) } }
        return map.values.sortedWith(compareByDescending<NameSuggestion> { it.count }.thenBy { it.name.lowercase() })
    }

    /** Prefix matches first, then word-start matches, then (3+ chars) contains. */
    fun filterSuggestions(all: List<NameSuggestion>, query: String, limit: Int = 5): List<NameSuggestion> {
        val q = query.trim().lowercase()
        if (q.isEmpty()) return emptyList()
        return all.mapNotNull { s ->
            val n = s.name.lowercase()
            val score = when {
                n == q -> null
                n.startsWith(q) -> 0
                n.split(Regex("[\\s\\-/&(]+")).any { it.startsWith(q) } -> 1
                q.length >= 3 && n.contains(q) -> 2
                else -> null
            }
            score?.let { it to s }
        }.sortedWith(compareBy<Pair<Int, NameSuggestion>> { it.first }.thenByDescending { it.second.count })
            .take(limit).map { it.second }
    }

    /** Same non-destructive migration as the web: items used in old records become user items. */
    fun missingFromServices(services: List<CloudService>, items: List<CloudServiceItem>): List<CloudServiceItem> {
        val known = items.map { it.id }.toSet()
        return services.flatMap { s -> s.doneItems.map { (id, data) -> Triple(id, data, s.createdAt) } }
            .filter { it.first !in known }
            .distinctBy { it.first }
            .map { (id, data, ts) ->
                CloudServiceItem(
                    id = id,
                    name = data.name ?: nameOf(id, emptyList()),
                    isEngineOil = id == LEGACY_ENGINE_OIL_ID,
                    createdAt = ts,
                )
            }
    }
}

enum class OilState { OK, WARNING, OVERDUE, NO_HISTORY }

data class OilStatus(
    val state: OilState,
    val remainingDistance: Double,
    val remainingDays: Long?,
    val nextDueOdometer: Double,
    val nextDueDate: LocalDate?,
    val lastOilDate: LocalDate?,
    val intervalKm: Int,
    val intervalMonths: Int,
)

/** Engine-oil reminder: whichever of distance or time comes first (same rule as the web). */
object OilCalculator {
    private fun parse(d: String): LocalDate? = runCatching { LocalDate.parse(d.take(10)) }.getOrNull()

    fun status(
        services: List<CloudService>,
        entries: List<CloudFuelEntry>,
        items: List<CloudServiceItem>,
        intervalKm: Int,
        intervalMonths: Int,
        today: LocalDate = LocalDate.now(),
    ): OilStatus {
        val km = if (intervalKm > 0) intervalKm else 5000
        val months = if (intervalMonths > 0) intervalMonths else 6
        val currentOdo = (entries.map { it.odometer } + services.map { it.odometer }).maxOrNull() ?: 0.0
        val oilIds = ServiceItems.engineOilIds(items)
        val lastOil = services
            .filter { s -> oilIds.any { s.components[it]?.done == true } }
            .maxWithOrNull(compareBy<CloudService> { it.serviceDate }.thenBy { it.odometer })

        val baseOdo: Double
        val baseDate: LocalDate?
        if (lastOil != null) {
            baseOdo = lastOil.odometer
            baseDate = parse(lastOil.serviceDate)
        } else {
            baseOdo = (entries.map { it.odometer } + services.map { it.odometer }).filter { it > 0 }.minOrNull() ?: 0.0
            baseDate = (entries.map { it.refillDate } + services.map { it.serviceDate }).mapNotNull(::parse).minOrNull()
        }

        val remainingKm = km - (currentOdo - baseOdo).coerceAtLeast(0.0)
        val dueDate = baseDate?.plusMonths(months.toLong())
        val remainingDays = dueDate?.let { ChronoUnit.DAYS.between(today, it) }

        val hasReadings = currentOdo > 0
        val kmOverdue = hasReadings && remainingKm <= 0
        val kmWarning = hasReadings && remainingKm > 0 && remainingKm <= 500
        val timeOverdue = remainingDays != null && remainingDays <= 0
        val timeWarning = remainingDays != null && remainingDays in 1..30

        val state = when {
            kmOverdue || timeOverdue -> OilState.OVERDUE
            kmWarning || timeWarning -> OilState.WARNING
            lastOil == null -> OilState.NO_HISTORY
            else -> OilState.OK
        }
        return OilStatus(
            state = state,
            remainingDistance = remainingKm,
            remainingDays = remainingDays,
            nextDueOdometer = baseOdo + km,
            nextDueDate = dueDate,
            lastOilDate = if (lastOil != null) baseDate else null,
            intervalKm = km,
            intervalMonths = months,
        )
    }
}
