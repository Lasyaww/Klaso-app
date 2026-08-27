package com.example.klasoapp.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.klasoapp.data.AuthManager
import com.example.klasoapp.network.ApiClient
import com.example.klasoapp.network.LoginRequest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class AuthViewModel(private val authManager: AuthManager) : ViewModel() {

    private val _uiState = MutableStateFlow<AuthUiState>(AuthUiState.Initial)
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    fun login(email: String, pass: String, role: String) {
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            try {
                val response = ApiClient.apiService.login(
                    LoginRequest(email = email, password = pass, role = role)
                )
                authManager.saveToken(response.accessToken)
                ApiClient.authToken = response.accessToken
                _uiState.value = AuthUiState.Success(response.user.role)
            } catch (e: Exception) {
                _uiState.value = AuthUiState.Error(e.message ?: "Unknown login error")
            }
        }
    }
}

sealed class AuthUiState {
    object Initial : AuthUiState()
    object Loading : AuthUiState()
    data class Success(val role: String) : AuthUiState()
    data class Error(val message: String) : AuthUiState()
}
