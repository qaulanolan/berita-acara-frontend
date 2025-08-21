// src/services/api.js
import axios from 'axios';
// Hapus import useAuthStore dari sini, karena interceptor akan di-setup di main.js
// atau di tempat store diinisialisasi untuk menghindari circular dependency.
// Namun, untuk struktur sederhana saat ini, kita bisa biarkan.

// Buat instance Axios
const apiClient = axios.create({
  baseURL: 'http://localhost:8080', // URL dasar backend Anda
});

// --- TIDAK ADA PERUBAHAN PADA INTERCEPTOR ---
// Interceptor ini sudah benar. Ia akan dipanggil untuk setiap request yang dibuat
// melalui apiClient.
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Ambil langsung dari localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- PERUBAHAN UTAMA: Ekspor objek dengan metode API ---
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
    // Untuk upload file, kita perlu override header Content-Type
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
    // responseType: 'blob' sangat penting agar browser bisa menangani
    // respons file untuk diunduh.
    return apiClient.post('/berita-acara/generate-dynamic', payload, {
      responseType: 'blob',
    });
  },
  
  // Endpoint untuk riwayat (history) bisa ditambahkan di sini juga
  getHistory() {
    return apiClient.get('/berita-acara/history');
  },
  getHistoryFile(id) {
    return apiClient.get(`/berita-acara/history/${id}/file`, {
      responseType: 'blob',
    });
  },
};