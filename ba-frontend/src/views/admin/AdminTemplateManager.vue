<script setup>
import { ref, onMounted } from 'vue';
import api from '@/services/api';
import TemplateUploadModal from '@/components/admin/TemplateUploadModal.vue';

// State untuk data dan UI
const templates = ref([]);
const isLoading = ref(true);
const error = ref(null);
const isModalVisible = ref(false);
const editingTemplate = ref(null);

// Fungsi untuk mengambil data dari API
const fetchTemplates = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await api.getAdminTemplates();
    templates.value = response.data;
  } catch (err) {
    console.error("Gagal mengambil template admin:", err);
    error.value = err.response?.data?.error || err.message;
  } finally {
    isLoading.value = false;
  }
};

// Fungsi untuk membuka modal (untuk tambah template baru)
const openUploadModal = () => {
  editingTemplate.value = null;
  isModalVisible.value = true;
};

// Fungsi untuk membuka modal edit
const openEditModal = async (template) => {
  // Panggil API untuk mendapatkan detail lengkap template
    const response = await api.getTemplateById(template.id);
    
    // Simpan data lengkap (termasuk placeholders) ke state
    editingTemplate.value = response.data; // response.data adalah TemplateDetailDTO
    
    // Baru buka modal setelah data lengkap diterima
    isModalVisible.value = true;
};

// Fungsi untuk menutup modal
const closeUploadModal = () => {
  isModalVisible.value = false;
  editingTemplate.value = null;
  fetchTemplates();
};

// Fungsi untuk mengedit template
const editTemplate = (template) => {
  openEditModal(template);
};

// // Fungsi untuk menghapus template dengan error handling yang lebih baik
// const confirmDelete = async (template, event) => {
//   if (confirm(`Apakah Anda yakin ingin menghapus template "${template.templateName}"? Tindakan ini tidak bisa dibatalkan.`)) {
//     try {
//       // Tambahkan loading state untuk tombol delete
//       const deleteButton = event.target;
//       const originalText = deleteButton.textContent;
//       deleteButton.disabled = true;
//       deleteButton.textContent = 'Menghapus...';
      
//       await api.deleteTemplate(template.id);
      
//       // Update UI
//       templates.value = templates.value.filter(t => t.id !== template.id);
//       showNotification('Template berhasil dihapus', 'success');
      
//     } catch (err) {
//       console.error("Gagal menghapus template:", err);
      
//       let errorMessage = 'Gagal menghapus template';
      
//       if (err.response) {
//         const status = err.response.status;
//         const serverMessage = err.response.data?.error || err.response.data?.message;
        
//         switch (status) {
//           case 404:
//             errorMessage = 'Template tidak ditemukan';
//             break;
//           case 403:
//             errorMessage = 'Anda tidak memiliki izin untuk menghapus template ini';
//             break;
//           case 409:
//             errorMessage = 'Template sedang digunakan dan tidak dapat dihapus';
//             break;
//           case 500:
//             errorMessage = 'Terjadi kesalahan server. Silakan coba lagi nanti';
//             break;
//           default:
//             errorMessage = serverMessage || `Error ${status}: Gagal menghapus template`;
//         }
//       } else if (err.request) {
//         errorMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda';
//       }
      
//       showNotification(errorMessage, 'error');
      
//     } finally {
//       // Reset button state
//       const deleteButton = event.target;
//       if (deleteButton) {
//         deleteButton.disabled = false;
//         deleteButton.innerHTML = '🗑️ Hapus';
//       }
//     }
//   }
// };

// Fungsi untuk menampilkan notifikasi
const showNotification = (message, type = 'info') => {
  if (type === 'error') {
    alert(`❌ ${message}`);
  } else if (type === 'success') {
    alert(`✅ ${message}`);
  } else {
    alert(`ℹ️ ${message}`);
  }
};

// Fungsi untuk refresh data
const refreshData = () => {
  fetchTemplates();
};

// Fungsi untuk toggle status template
const toggleTemplateStatus = async (template) => {
  try {
    const newStatus = !template.isActive;
    await api.updateTemplateStatus(template.id, { isActive: newStatus });
    
    template.isActive = newStatus;
    showNotification(`Template ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`, 'success');
    
  } catch (err) {
    console.error("Gagal mengubah status template:", err);
    showNotification('Gagal mengubah status template', 'error');
  }
};

// Panggil fetchTemplates saat komponen pertama kali di-mount
onMounted(fetchTemplates);
</script>

<template>
  <div class="admin-container">
    <!-- Main Content -->
    <div class="main-content">
      <header class="page-header">
        <h1 class="page-title">Manajemen Template</h1>
        <div class="header-actions">
          <button @click="refreshData" class="refresh-button" title="Refresh Data">
            🔄 Refresh
          </button>
          <button @click="openUploadModal" class="add-button">
            <span class="add-icon">+</span>
            Tambah Template Baru
          </button>
        </div>
      </header>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Memuat data template...</p>
      </div>

      <!-- Error State -->
      <div v-if="error" class="error-state">
        <div class="error-icon">⚠️</div>
        <p>Gagal memuat data: {{ error }}</p>
        <button @click="fetchTemplates" class="retry-button">Coba Lagi</button>
      </div>

      <!-- Templates Table -->
      <div v-if="!isLoading && templates.length > 0" class="table-wrapper">
        <div class="table-container">
          <table class="templates-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama Template</th>
                <th>Deskripsi</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="template in templates" :key="template.id" class="table-row">
                <td class="id-cell">{{ template.id }}</td>
                <td class="name-cell">
                  <div class="template-name">{{ template.templateName }}</div>
                </td>
                <td class="description-cell">
                  <span class="description-text">{{ template.description || 'Tidak ada deskripsi' }}</span>
                </td>
                <td class="status-cell">
                  <button 
                    @click="toggleTemplateStatus(template)"
                    :class="['status-badge', template.isActive ? 'active' : 'inactive']"
                    title="Klik untuk mengubah status"
                  >
                    <span class="status-dot"></span>
                    {{ template.isActive ? 'Aktif' : 'Tidak Aktif' }}
                  </button>
                </td>
                <td class="actions-cell">
                  <button @click="editTemplate(template)" class="action-button edit" title="Edit Template">
                    ✏️ Edit
                  </button>
                  <!-- <button @click="(event) => confirmDelete(template, event)" class="action-button delete" title="Hapus Template">
                    🗑️ Hapus
                  </button> -->
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!isLoading && templates.length === 0 && !error" class="empty-state">
        <div class="empty-icon">📄</div>
        <h3>Belum ada template</h3>
        <p>Silakan tambahkan template baru untuk memulai.</p>
        <button @click="openUploadModal" class="empty-add-button">
          + Tambah Template Pertama
        </button>
      </div>
    </div>

    <!-- Modal untuk upload dan edit template -->
    <TemplateUploadModal 
      :show="isModalVisible" 
      :template="editingTemplate"
      @close="closeUploadModal" 
    />
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.admin-container {
  min-height: 100vh;
  background: #f8f9fc;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* Main Content */
.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  margin-top: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  background: white;
  padding: 1.5rem 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.page-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: #3b82f6;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.refresh-button {
  background: #10b981;
  color: white;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.refresh-button:hover {
  background: #059669;
}

.add-button {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.add-button:hover {
  background: #2563eb;
}

.add-icon {
  font-size: 1.25rem;
  font-weight: bold;
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f1f5f9;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error State */
.error-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  color: #dc2626;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.retry-button {
  background: #f59e0b;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 1rem;
  transition: all 0.2s ease;
}

.retry-button:hover {
  background: #d97706;
}

/* Table */
.table-wrapper {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.table-container {
  overflow-x: auto;
}

.templates-table {
  width: 100%;
  border-collapse: collapse;
}

.templates-table thead {
  background-color: #3b82f6;
  color: white;
}

.templates-table th {
  padding: 1.25rem 1.5rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.table-row {
  transition: all 0.3s ease;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.table-row:hover {
  background: rgba(99, 102, 241, 0.05);
}

.templates-table td {
  padding: 1.25rem 1.5rem;
  vertical-align: middle;
}

.id-cell {
  font-weight: 600;
  color: #6b7280;
  font-family: 'Monaco', 'Menlo', monospace;
}

.template-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 1rem;
}

.description-text {
  color: #6b7280;
  font-style: italic;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.status-badge.active {
  background: #10b981;
  color: white;
}

.status-badge.active:hover {
  background: #059669;
}

.status-badge.inactive {
  background: #6b7280;
  color: white;
}

.status-badge.inactive:hover {
  background: #4b5563;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.actions-cell {
  display: flex;
  gap: 0.75rem;
}

.action-button {
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.3s ease;
}

.action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-button.edit {
  background: #f59e0b;
  color: white;
}

.action-button.edit:hover:not(:disabled) {
  background: #d97706;
}

.action-button.delete {
  background: #ef4444;
  color: white;
}

.action-button.delete:hover:not(:disabled) {
  background: #dc2626;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.6;
}

.empty-state h3 {
  color: #1f2937;
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
}

.empty-state p {
  color: #6b7280;
  margin-bottom: 2rem;
}

.empty-add-button {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.empty-add-button:hover {
  background: #2563eb;
}

/* Responsive Design */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .header-actions {
    flex-direction: column;
    width: 100%;
  }

  .main-content {
    padding: 1rem;
  }

  .actions-cell {
    flex-direction: column;
  }
  
  .templates-table th,
  .templates-table td {
    padding: 0.75rem;
    font-size: 0.875rem;
  }
}
</style>