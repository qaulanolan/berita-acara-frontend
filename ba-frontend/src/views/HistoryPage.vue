<script>
// Nama komponen ini penting untuk <KeepAlive>
export default {
  name: 'HistoryPage'
}
</script>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import api from '@/services/api'; // Pastikan path ini benar
import { renderAsync } from 'docx-preview';
import { useRouter } from 'vue-router'; // Impor router untuk navigasi

// --- STATE ---
const historyList = ref([]);
const isLoading = ref(true);
const isBlobLoading = ref(false);
const error = ref(null);

const selectedFileBlob = ref(null);
const selectedNomorBA = ref('');
const isPreviewVisible = ref(false);
const docxContainer = ref(null);
const selectedHistoryId = ref(null);

const router = useRouter(); // Buat instance router

// --- METHODS ---
onMounted(async () => {
  try {
    // --- PERBAIKAN UTAMA: Panggil metode API yang benar ---
    const response = await api.getHistory(); 
    historyList.value = response.data;
  } catch (err) {
    console.error("Gagal mengambil histori:", err);
    error.value = "Gagal mengambil data histori. Silakan coba lagi nanti.";
  } finally {
    isLoading.value = false;
  }
});

// Fungsi untuk menavigasi ke halaman preview
function goToPreview(item) {
  router.push({ name: 'Preview', params: { id: item.id } });
}

// Fungsi loadFile dan downloadFile di sini lebih cocok untuk preview di halaman yang sama
// Anda bisa memilih antara menggunakan fungsi di bawah ini atau goToPreview di atas.

async function loadFile(item) {
  isBlobLoading.value = true;
  isPreviewVisible.value = false;
  selectedFileBlob.value = null;
  selectedHistoryId.value = item.id;
  if (docxContainer.value) docxContainer.value.innerHTML = '';
  
  try {
    const response = await api.getHistoryFile(item.id);
    selectedFileBlob.value = response.data;
    selectedNomorBA.value = item.nomorBA;
  } catch (error) {
    console.error("Gagal memuat file:", error);
    alert("Gagal memuat file dokumen.");
  } finally {
    isBlobLoading.value = false;
  }
}

function downloadFile() {
  if (!selectedFileBlob.value) return;
  const url = window.URL.createObjectURL(selectedFileBlob.value);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `BA-${selectedNomorBA.value}.docx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

async function previewFile() {
  isPreviewVisible.value = !isPreviewVisible.value;
  if (isPreviewVisible.value && selectedFileBlob.value) {
    await nextTick();
    if (docxContainer.value && docxContainer.value.innerHTML === '') {
      await renderAsync(selectedFileBlob.value, docxContainer.value);
    }
  }
}
</script>

<template>
  <div class="history-container">
    <h1>Riwayat Berita Acara</h1>
    
    <div v-if="isLoading" class="loading-state">Memuat data...</div>
    <div v-if="error" class="error-state">{{ error }}</div>
    
    <div v-if="!isLoading && !error">
      <p v-if="historyList.length === 0" class="empty-state">Belum ada riwayat yang tersimpan.</p>
      <table v-else>
        <thead>
          <tr>
            <th>Nomor BA</th>
            <th>Jenis / Nama Template</th>
            <th>Judul Pekerjaan</th>
            <th>Tanggal Generate</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in historyList" :key="item.id" class="history-row">
            <td>{{ item.nomorBA }}</td>
            <td>{{ item.jenisBeritaAcara }}</td>
            <td>{{ item.judulPekerjaan }}</td>
            <td>{{ new Date(item.generationTimestamp).toLocaleString('id-ID') }}</td>
            <td class="actions-cell">
              <!-- Ganti @click dengan navigasi ke halaman Preview -->
              <button @click="goToPreview(item)" class="action-button">Lihat & Download</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Logika preview di halaman ini bisa dihapus jika Anda lebih suka mengarahkan ke halaman PreviewPage -->
  </div>
</template>

<style scoped>
/* Tambahkan style dasar agar terlihat rapi */
.history-container {
  max-width: 1000px;
  margin: 2rem auto;
  padding: 0 1rem;
}
h1 {
  text-align: center;
  margin-bottom: 2rem;
}
.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  background-color: #f8f9fa;
  border-radius: 8px;
}
.error-state {
  color: #dc3545;
  background-color: #f8d7da;
}
table {
  width: 100%;
  border-collapse: collapse;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
th, td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #dee2e6;
}
thead {
  background-color: #f8f9fa;
}
.actions-cell {
  text-align: center;
}
.action-button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
}
.action-button:hover {
  background-color: #0056b3;
}
</style>