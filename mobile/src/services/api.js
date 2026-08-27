import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In React Native, you need the absolute URL to your backend.
// Replace this with your computer's local IP address when testing on a physical device.
// e.g., 'http://192.168.1.100:8000'
const BACKEND_URL = 'http://10.0.2.2:8000'; // 10.0.2.2 is localhost for Android Emulator

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: attach token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('klaso_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('Error reading token from AsyncStorage', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.detail || 'Something went wrong. Please try again.';
    return Promise.reject(new Error(message));
  }
);

export default api;
