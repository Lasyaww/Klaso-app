package com.example.klasoapp.network

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import retrofit2.http.Body
import retrofit2.http.POST

@Serializable
data class LoginRequest(
    val email: String,
    val password: String,
    val role: String
)

@Serializable
data class UserData(
    val id: String,
    val first_name: String,
    val last_name: String,
    val email: String,
    val role: String,
    @SerialName("registration_number") val registrationNumber: String? = null
)

@Serializable
data class LoginResponse(
    @SerialName("access_token") val accessToken: String,
    @SerialName("token_type") val tokenType: String,
    val user: UserData
)

interface ApiService {
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): LoginResponse
}
