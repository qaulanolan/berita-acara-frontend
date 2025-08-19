// src/services/api.js
import axios from 'axios';

// Buat instance Axios
const apiClient = axios.create({
  baseURL: 'http://localhost:8080', // URL dasar backend Anda
  timeout: 30000, // 30 detik timeout untuk operasi yang lebih lama
});

// Interceptor untuk request - menambahkan token otomatis
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor untuk response - menangani error secara global
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error untuk debugging
    console.error('API Error:', error);
    
    // Handle token expired
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Redirect ke login jika perlu
      // window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default {
  // ===================================
  // == Endpoint Otentikasi & Pengguna ==
  // ===================================
  login(credentials) {
    return apiClient.post('/auth/login', credentials);
  },
  register(data) {
    return apiClient.post('/auth/register', data);
  },
  getMe() {
    return apiClient.get('/auth/me');
  },

  // ===================================
  // == Endpoint Manajemen Template (Admin) ==
  // ===================================
  uploadAndScanTemplate(formData) {
    return apiClient.post('/api/admin/templates/upload-and-scan', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  defineAndSaveTemplate(payload) {
    return apiClient.post('/api/admin/templates/define-and-save', payload);
  },
  getAdminTemplates() {
    return apiClient.get('/api/admin/templates');
  },
  deleteTemplate(id) {
    return apiClient.delete(`/api/admin/templates/${id}`);
  },
  
  // === TAMBAHAN: Endpoint untuk edit template ===
  updateTemplate(id, payload) {
    return apiClient.put(`/api/admin/templates/${id}`, payload);
  },
  
  // === TAMBAHAN: Endpoint untuk mengubah status template ===
  updateTemplateStatus(id, statusData) {
    return apiClient.patch(`/api/admin/templates/${id}/status`, statusData);
  },
  
  // === TAMBAHAN: Endpoint untuk mendapatkan detail template ===
  getTemplateDetail(id) {
    return apiClient.get(`/api/admin/templates/${id}`);
  },

  // ===================================
  // == Endpoint Pengguna Biasa ==
  // ===================================
  getActiveTemplates() {
    return apiClient.get('/berita-acara/templates');
  },
  getTemplateFormStructure(id) {
    return apiClient.get(`/berita-acara/templates/${id}/form-structure`);
  },
  generateDynamicDocument(payload) {
    return apiClient.post('/berita-acara/generate-dynamic', payload, {
      responseType: 'blob',
    });
  },
  
  // Endpoint untuk riwayat (history)
  getHistory() {
    return apiClient.get('/berita-acara/history');
  },
  getHistoryFile(id) {
    return apiClient.get(`/berita-acara/history/${id}/file`, {
      responseType: 'blob',
    });
  },
};