<script setup>
import { ref, onMounted } from 'vue';
import api from '@/services/api';
import TemplateUploadModal from '@/components/admin/TemplateUploadModal.vue';

// State untuk data dan UI
const templates = ref([]);
const isLoading = ref(true);
const error = ref(null);
const isModalVisible = ref(false);

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

// Fungsi untuk membuka modal
const openUploadModal = () => {
  isModalVisible.value = true;
};

// Fungsi untuk menutup modal
const closeUploadModal = () => {
  isModalVisible.value = false;
  // Muat ulang data setelah modal ditutup, untuk jaga-jaga jika ada perubahan
  fetchTemplates();
};

// Fungsi untuk mengedit template (untuk masa depan)
const editTemplate = (template) => {
  alert(`Fungsi edit untuk template ID: ${template.id} belum diimplementasikan.`);
  // Di sini Anda akan membuka modal yang sama dengan data template yang sudah ada
};

// Fungsi untuk menghapus template
const confirmDelete = async (template) => {
  if (confirm(`Apakah Anda yakin ingin menghapus template "${template.templateName}"? Tindakan ini tidak bisa dibatalkan.`)) {
    try {
      await api.deleteTemplate(template.id);
      alert('Template berhasil dihapus.');
      // Hapus template dari daftar lokal agar UI langsung update
      templates.value = templates.value.filter(t => t.id !== template.id);
    } catch (err) {
      console.error("Gagal menghapus template:", err);
      alert(`Gagal menghapus template: ${err.response?.data?.error || err.message}`);
    }
  }
};

// Panggil fetchTemplates saat komponen pertama kali di-mount
onMounted(fetchTemplates);
</script>

<template>
  <div class="admin-container">
    <header class="admin-header">
      <h1>Manajemen Template</h1>
      <button @click="openUploadModal" class="add-button">
        + Tambah Template Baru
      </button>
    </header>

    <div v-if="isLoading" class="loading-state">
      <p>Memuat data template...</p>
    </div>

    <div v-if="error" class="error-state">
      <p>Gagal memuat data: {{ error }}</p>
    </div>

    <div v-if="!isLoading && templates.length > 0" class="template-table-container">
      <table>
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
          <tr v-for="template in templates" :key="template.id">
            <td>{{ template.id }}</td>
            <td>{{ template.templateName }}</td>
            <td>{{ template.description || '-' }}</td>
            <td>
              <span :class="['status-badge', template.isActive ? 'active' : 'inactive']">
                {{ template.isActive ? 'Aktif' : 'Tidak Aktif' }}
              </span>
            </td>
            <td class="actions-cell">
              <button @click="editTemplate(template)" class="action-button edit">Edit</button>
              <button @click="confirmDelete(template)" class="action-button delete">Hapus</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!isLoading && templates.length === 0 && !error" class="empty-state">
      <p>Belum ada template yang ditambahkan. Silakan tambahkan template baru.</p>
    </div>

    <!-- Modal untuk upload dan definisi template -->
    <TemplateUploadModal :show="isModalVisible" @close="closeUploadModal" />

  </div>
</template>

<style scoped>
.admin-container {
  padding: 2rem;
  max-width: 1200px;
  margin: auto;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.add-button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
}

.add-button:hover {
  background-color: #0056b3;
}

table {
  width: 100%;
  border-collapse: collapse;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

th, td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

thead {
  background-color: #f8f9fa;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  color: white;
}
.status-badge.active {
  background-color: #28a745;
}
.status-badge.inactive {
  background-color: #6c757d;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
}

.action-button {
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
}

.action-button.edit {
  background-color: #ffc107;
}
.action-button.delete {
  background-color: #dc3545;
  color: white;
}

.loading-state, .error-state, .empty-state {
  text-align: center;
  margin-top: 3rem;
  color: #6c757d;
}
</style>