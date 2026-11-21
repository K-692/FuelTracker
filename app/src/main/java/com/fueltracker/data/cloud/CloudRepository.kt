package com.fueltracker.data.cloud

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.SetOptions
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Single access point to the shared Firebase backend (same project, same documents
 * as the web app). Firestore's built-in offline cache keeps the app usable without
 * a connection; writes sync automatically when back online.
 *
 * Writes always use merge so fields written by the web app are never removed.
 */
@Singleton
class CloudRepository @Inject constructor() {
    private val auth: FirebaseAuth = FirebaseAuth.getInstance()
    private val db: FirebaseFirestore = FirebaseFirestore.getInstance()

    // ---------------------------------------------------------------- Auth
    val currentUser: FirebaseUser? get() = auth.currentUser

    fun authState(): Flow<FirebaseUser?> = callbackFlow {
        val listener = FirebaseAuth.AuthStateListener { trySend(it.currentUser) }
        auth.addAuthStateListener(listener)
        awaitClose { auth.removeAuthStateListener(listener) }
    }

    suspend fun signInWithGoogleIdToken(idToken: String): FirebaseUser? {
        val credential = GoogleAuthProvider.getCredential(idToken, null)
        return auth.signInWithCredential(credential).await().user
    }

    fun signOut() = auth.signOut()

    // ---------------------------------------------------------------- Paths
    private fun col(uid: String, name: String) = db.collection("users").document(uid).collection(name)

    private fun <T> listen(uid: String, name: String, map: (String, Map<String, Any?>) -> T): Flow<List<T>> =
        callbackFlow {
            val reg: ListenerRegistration = col(uid, name).addSnapshotListener { snap, err ->
                if (err != null) {
                    close(err)
                    return@addSnapshotListener
                }
                val items = snap?.documents?.mapNotNull { d ->
                    runCatching { map(d.id, d.data ?: emptyMap()) }.getOrNull()
                } ?: emptyList()
                trySend(items)
            }
            awaitClose { reg.remove() }
        }

    // ---------------------------------------------------------------- Streams
    fun vehicles(uid: String) = listen(uid, "vehicles") { id, d -> CloudVehicle.from(id, d) }
    fun fuelEntries(uid: String) = listen(uid, "fuel_entries") { id, d -> CloudFuelEntry.from(id, d) }
    fun services(uid: String) = listen(uid, "services") { id, d -> CloudService.from(id, d) }
    fun serviceItems(uid: String) = listen(uid, "service_items") { id, d -> CloudServiceItem.from(id, d) }
    fun fuelTypes(uid: String) = listen(uid, "fuel_types") { id, d -> CloudFuelType.from(id, d) }

    fun preferences(uid: String): Flow<CloudPreferences> = callbackFlow {
        val reg = col(uid, "settings").document("preferences").addSnapshotListener { snap, _ ->
            val d = snap?.data
            trySend(
                CloudPreferences(
                    engineOilInterval = d?.get("engineOilInterval").asIntOrNull()?.takeIf { it > 0 } ?: 5000,
                    engineOilMonthsInterval = d?.get("engineOilMonthsInterval").asIntOrNull()?.takeIf { it > 0 } ?: 6,
                )
            )
        }
        awaitClose { reg.remove() }
    }

    // ---------------------------------------------------------------- Writes
    suspend fun saveVehicle(uid: String, v: CloudVehicle) {
        col(uid, "vehicles").document(v.id).set(v.toMap(), SetOptions.merge()).await()
    }

    /** Deletes a vehicle and its refills & services — same cascade as the web app. */
    suspend fun deleteVehicle(uid: String, vehicleId: String) {
        val entries = col(uid, "fuel_entries").whereEqualTo("vehicleId", vehicleId).get().await()
        val services = col(uid, "services").whereEqualTo("vehicleId", vehicleId).get().await()
        val batch = db.batch()
        batch.delete(col(uid, "vehicles").document(vehicleId))
        entries.documents.forEach { batch.delete(it.reference) }
        services.documents.forEach { batch.delete(it.reference) }
        batch.commit().await()
    }

    suspend fun saveFuelEntry(uid: String, e: CloudFuelEntry) {
        col(uid, "fuel_entries").document(e.id).set(e.toMap(), SetOptions.merge()).await()
    }

    suspend fun deleteFuelEntry(uid: String, id: String) {
        col(uid, "fuel_entries").document(id).delete().await()
    }

    suspend fun saveService(uid: String, s: CloudService) {
        col(uid, "services").document(s.id).set(s.toMap(), SetOptions.merge()).await()
    }

    suspend fun deleteService(uid: String, id: String) {
        col(uid, "services").document(id).delete().await()
    }

    suspend fun saveServiceItems(uid: String, items: List<CloudServiceItem>) {
        if (items.isEmpty()) return
        val batch = db.batch()
        items.forEach { batch.set(col(uid, "service_items").document(it.id), it.toMap(), SetOptions.merge()) }
        batch.commit().await()
    }

    /** Removes an item from the user's list. Past service records are left untouched. */
    suspend fun deleteServiceItem(uid: String, id: String) {
        col(uid, "service_items").document(id).delete().await()
    }

    suspend fun savePreferences(uid: String, prefs: CloudPreferences) {
        col(uid, "settings").document("preferences").set(
            mapOf(
                "engineOilInterval" to prefs.engineOilInterval,
                "engineOilMonthsInterval" to prefs.engineOilMonthsInterval,
                "updatedAt" to System.currentTimeMillis(),
            ),
            SetOptions.merge()
        ).await()
    }
}
