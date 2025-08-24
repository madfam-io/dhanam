import axios from 'axios';
import { Platform } from 'react-native';

// API Configuration
const API_BASE_URL = __DEV__
  ? Platform.OS === 'ios'
    ? 'http://localhost:4000/api'
    : 'http://10.0.2.2:4000/api'
  : 'https://api.dhanam.app';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    if (__DEV__) {
      console.log(`🔵 ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    if (__DEV__) {
      console.log('🔴 Request Error:', error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(
        `🟢 ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`
      );
    }
    return response;
  },
  async (error) => {
    if (__DEV__) {
      console.log('🔴 Response Error:', error.response?.status, error.response?.data);
    }

    // Handle 401 errors (token refresh)
    if (error.response?.status === 401) {
      // Token refresh logic would be handled by the AuthContext
      // This is just a placeholder for the interceptor structure
    }

    // Transform error for better error handling
    const errorMessage =
      error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(errorMessage));
  }
);

export default apiClient;
