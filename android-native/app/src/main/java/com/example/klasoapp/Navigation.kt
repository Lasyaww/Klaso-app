package com.example.klasoapp

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.ui.NavDisplay
import com.example.klasoapp.data.AuthManager
import com.example.klasoapp.ui.auth.AuthViewModel
import com.example.klasoapp.ui.auth.LoginScreen
import com.example.klasoapp.ui.splash.SplashScreen

@Composable
fun MainNavigation() {
  val backStack = rememberNavBackStack(Splash)
  val context = LocalContext.current
  val authManager = remember { AuthManager(context) }
  
  val authViewModel: AuthViewModel = viewModel(
    factory = object : ViewModelProvider.Factory {
      override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return AuthViewModel(authManager) as T
      }
    }
  )

  NavDisplay(
    backStack = backStack,
    onBack = { backStack.removeLastOrNull() },
    entryProvider =
      entryProvider {
        entry<Splash> {
          SplashScreen(onNavigateToLogin = {
             backStack.clear()
             backStack.add(Login)
          })
        }
        entry<Login> {
          LoginScreen(
            viewModel = authViewModel,
            onNavigateToDashboard = { role ->
               backStack.clear() // Clear backstack on login
               backStack.add(Dashboard(role))
            }
          )
        }
        entry<Dashboard> { dashboardArgs ->
          Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
             Text("Welcome to the ${dashboardArgs.role.replaceFirstChar { it.uppercase() }} Dashboard! Native Android works!")
          }
        }
      },
  )
}
