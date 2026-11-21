package com.fueltracker.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColors = darkColorScheme(
    primary = BrandGreen,
    onPrimary = Color.White,
    primaryContainer = Color(0xFF1E3A14),
    onPrimaryContainer = Color(0xFFB7EB8F),
    secondary = BrandOrange,
    onSecondary = Color.White,
    secondaryContainer = Color(0xFF3A2A12),
    onSecondaryContainer = Color(0xFFFFD591),
    tertiary = BrandYellow,
    error = BrandDanger,
    background = MidnightBg,
    onBackground = Color(0xFFF8FAFC),
    surface = MidnightSurface,
    onSurface = Color(0xFFF8FAFC),
    surfaceVariant = MidnightElevated,
    onSurfaceVariant = Color(0xFF94A3B8),
    surfaceContainer = MidnightSurface,
    surfaceContainerHigh = MidnightElevated,
    outline = Color(0x33FFFFFF),
    outlineVariant = Color(0x1AFFFFFF),
)

private val LightColors = lightColorScheme(
    primary = BrandGreenDark,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFD9F7BE),
    onPrimaryContainer = Color(0xFF092B00),
    secondary = Color(0xFFD46B08),
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFFFE7BA),
    onSecondaryContainer = Color(0xFF3A2000),
    tertiary = Color(0xFFD4B106),
    error = BrandDanger,
    background = LightBg,
    onBackground = MidnightBg,
    surface = LightSurface,
    onSurface = MidnightBg,
    surfaceVariant = LightElevated,
    onSurfaceVariant = Color(0xFF475569),
    surfaceContainer = LightSurface,
    surfaceContainerHigh = LightElevated,
    outline = Color(0x290C1322),
    outlineVariant = Color(0x140C1322),
)

@Composable
fun FuelTrackerTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColors else LightColors
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            window.navigationBarColor = colorScheme.surface.toArgb()
            val controller = WindowCompat.getInsetsController(window, view)
            controller.isAppearanceLightStatusBars = !darkTheme
            controller.isAppearanceLightNavigationBars = !darkTheme
        }
    }
    MaterialTheme(colorScheme = colorScheme, typography = Typography, shapes = Shapes, content = content)
}
