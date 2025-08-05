// src/services/api.js
import axios from 'axios';
import { useAuthStore } from '../stores/auth';

// Buat instance Axios
const apiClient = axios.create({
  baseURL: 'http://localhost:8080' // URL dasar backend Anda
});

// Buat Interceptor
apiClient.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    const token = authStore.token;

    // Jika token ada, tambahkan ke header Authorization
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;