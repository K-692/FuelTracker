package com.fueltracker.di

import android.content.Context
import androidx.room.Room
import com.fueltracker.data.local.AppDatabase
import com.fueltracker.data.local.FuelEntryDao
import com.fueltracker.data.local.FuelTypeDao
import com.fueltracker.data.local.VehicleDao
import com.google.gson.Gson
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideAppDatabase(@ApplicationContext context: Context): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "fuel_tracker_db"
        )
        .fallbackToDestructiveMigration()
        .build()
    }

    @Provides
    fun provideVehicleDao(database: AppDatabase): VehicleDao = database.vehicleDao()

    @Provides
    fun provideFuelTypeDao(database: AppDatabase): FuelTypeDao = database.fuelTypeDao()

    @Provides
    fun provideFuelEntryDao(database: AppDatabase): FuelEntryDao = database.fuelEntryDao()

    @Provides
    @Singleton
    fun provideGson(): Gson = Gson()
}
