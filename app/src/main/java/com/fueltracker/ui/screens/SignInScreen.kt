package com.fueltracker.ui.screens

import android.content.Context
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Login
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import com.fueltracker.R
import com.fueltracker.ui.theme.BrandGreen
import com.fueltracker.ui.theme.BrandOrange
import com.fueltracker.ui.theme.BrandYellow
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import kotlinx.coroutines.launch

/**
 * Launches the system "Sign in with Google" sheet and returns a Google ID token,
 * which is exchanged for a Firebase session — the same account used on the web app.
 */
suspend fun requestGoogleIdToken(context: Context): Result<String> = runCatching {
    val option = GetSignInWithGoogleOption.Builder(context.getString(R.string.default_web_client_id)).build()
    val request = GetCredentialRequest.Builder().addCredentialOption(option).build()
    val result = CredentialManager.create(context).getCredential(context, request)
    val credential = result.credential
    if (credential is CustomCredential &&
        credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL
    ) {
        GoogleIdTokenCredential.createFrom(credential.data).idToken
    } else {
        error("Unexpected credential type")
    }
}

@Composable
fun SignInScreen(
    signingIn: Boolean,
    onSigningIn: (Boolean) -> Unit,
    onToken: (String) -> Unit,
    onError: (String) -> Unit,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    Column(
        Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Image(
            painter = painterResource(R.drawable.app_logo),
            contentDescription = "FuelTracker",
            modifier = Modifier.size(96.dp).clip(RoundedCornerShape(22.dp)),
        )
        Spacer(Modifier.height(20.dp))
        Text(
            buildAnnotatedString {
                append("The Ultimate\n")
                withStyle(SpanStyle(brush = Brush.linearGradient(listOf(BrandGreen, BrandYellow, BrandOrange)))) {
                    append("Fuel Tracker")
                }
            },
            fontSize = 34.sp,
            lineHeight = 40.sp,
            fontWeight = FontWeight.Black,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(12.dp))
        Text(
            "Mileage, refills, servicing and engine-oil reminders — synced with the FuelTracker web app through your Google account.",
            textAlign = TextAlign.Center,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(Modifier.height(28.dp))
        Button(
            onClick = {
                onSigningIn(true)
                scope.launch {
                    requestGoogleIdToken(context)
                        .onSuccess(onToken)
                        .onFailure { e ->
                            when (e) {
                                is GetCredentialCancellationException -> onSigningIn(false)
                                is GetCredentialException -> onError("Google sign-in unavailable: ${e.message}")
                                else -> onError("Google sign-in failed: ${e.message}")
                            }
                        }
                }
            },
            enabled = !signingIn,
            modifier = Modifier.fillMaxWidth().height(52.dp),
        ) {
            if (signingIn) {
                CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp, color = MaterialTheme.colorScheme.onPrimary)
            } else {
                Icon(Icons.AutoMirrored.Filled.Login, contentDescription = null)
                Spacer(Modifier.size(8.dp))
                Text("Sign in with Google", fontWeight = FontWeight.Bold)
            }
        }
        Spacer(Modifier.height(12.dp))
        Text(
            "Your data stays in your own FuelTracker cloud account.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}
