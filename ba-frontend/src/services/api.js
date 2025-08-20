// src/services/api.js
import axios from 'axios';
<<<<<<< HEAD
=======
// Hapus import useAuthStore dari sini, karena interceptor akan di-setup di main.js
// atau di tempat store diinisialisasi untuk menghindari circular dependency.
// Namun, untuk struktur sederhana saat ini, kita bisa biarkan.
>>>>>>> ad57ec71e1f63e85bd3bde486cbeefe2453b1ae9

// Buat instance Axios
const apiClient = axios.create({
  baseURL: 'http://localhost:8080', // URL dasar backend Anda
<<<<<<< HEAD
  timeout: 30000, // 30 detik timeout untuk operasi yang lebih lama
});

// Interceptor untuk request - menambahkan token otomatis
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
=======
});

// --- TIDAK ADA PERUBAHAN PADA INTERCEPTOR ---
// Interceptor ini sudah benar. Ia akan dipanggil untuk setiap request yang dibuat
// melalui apiClient.
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Ambil langsung dari localStorage
>>>>>>> ad57ec71e1f63e85bd3bde486cbeefe2453b1ae9
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
<<<<<<< HEAD
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

=======
);

// --- PERUBAHAN UTAMA: Ekspor objek dengan metode API ---
>>>>>>> ad57ec71e1f63e85bd3bde486cbeefe2453b1ae9
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
<<<<<<< HEAD
=======
    // Untuk upload file, kita perlu override header Content-Type
>>>>>>> ad57ec71e1f63e85bd3bde486cbeefe2453b1ae9
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
<<<<<<< HEAD
  
  // === TAMBAHAN: Endpoint untuk edit template ===
=======

   // === TAMBAHAN: Endpoint untuk edit template ===
>>>>>>> ad57ec71e1f63e85bd3bde486cbeefe2453b1ae9
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
<<<<<<< HEAD
=======
    // responseType: 'blob' sangat penting agar browser bisa menangani
    // respons file untuk diunduh.
>>>>>>> ad57ec71e1f63e85bd3bde486cbeefe2453b1ae9
    return apiClient.post('/berita-acara/generate-dynamic', payload, {
      responseType: 'blob',
    });
  },
  
<<<<<<< HEAD
  // Endpoint untuk riwayat (history)
=======
  // Endpoint untuk riwayat (history) bisa ditambahkan di sini juga
>>>>>>> ad57ec71e1f63e85bd3bde486cbeefe2453b1ae9
  getHistory() {
    return apiClient.get('/berita-acara/history');
  },
  getHistoryFile(id) {
    return apiClient.get(`/berita-acara/history/${id}/file`, {
      responseType: 'blob',
    });
  },
};