<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { renderAsync } from 'docx-preview';

// --- STATE ---
const historyList = ref([]);
const isLoading = ref(true); // Untuk loading daftar awal
const isBlobLoading = ref(false); // Untuk loading saat mengambil file docx

const selectedFileBlob = ref(null); // Menyimpan data file .docx yang dipilih
const selectedNomorBA = ref(''); // Menyimpan nomor BA dari file yang dipilih
const isPreviewVisible = ref(false); // Mengontrol tampilan preview
const docxContainer = ref(null); // Ref untuk div preview

// --- METHODS ---

// Mengambil daftar riwayat saat halaman dimuat
onMounted(async () => {
  try {
    const response = await axios.get('http://localhost:8080/berita-acara/history');
    historyList.value = response.data;
  } catch (error) {
    console.error("Gagal mengambil histori:", error);
    alert("Gagal mengambil data histori.");
  } finally {
    isLoading.value = false;
  }
});

// Mengambil file .docx dari backend dan menyimpannya di state
async function loadFile(item) {
  isBlobLoading.value = true;
  isPreviewVisible.value = false;
  selectedFileBlob.value = null;
  if (docxContainer.value) docxContainer.value.innerHTML = '';
  
  try {
    const response = await axios.get(`http://localhost:8080/berita-acara/history/${item.id}/file`, {
      responseType: 'blob'
    });
    selectedFileBlob.value = response.data;
    selectedNomorBA.value = item.nomorBA; // Simpan nomor BA untuk nama file
  } catch (error) {
    console.error("Gagal memuat file:", error);
    alert("Gagal memuat file dokumen.");
  } finally {
    isBlobLoading.value = false;
  }
}

// Mengunduh file yang sudah ada di state `selectedFileBlob`
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

// Menampilkan preview dari file yang sudah ada di state `selectedFileBlob`
async function previewFile(historyId) {
  isPreviewVisible.value = true;
  if (docxContainer.value) {
    docxContainer.value.innerHTML = 'Memuat pratinjau...';
    try {
      const response = await axios.get(`http://localhost:8080/berita-acara/history/${historyId}/file`, {
        responseType: 'blob'
      });
      
      // Secara eksplisit buat blob baru dengan tipe yang benar
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

      // Render blob yang sudah valid
      await renderAsync(blob, docxContainer.value);

    } catch (error) {
      console.error("Gagal memuat preview:", error);
      docxContainer.value.innerHTML = 'Gagal memuat pratinjau.';
    }
  }
}
</script>

<template>
  <div class="history-container">
    <h1>Riwayat Berita Acara</h1>
    <p class="instruction">Klik pada salah satu baris untuk memuat file.</p>
    
    <div v-if="isLoading">Memuat data...</div>
    <table v-else-if="historyList.length > 0">
      <thead>
        <tr>
          <th>Nomor BA</th>
          <th>Jenis</th>
          <th>Judul Pekerjaan</th>
          <th>Tanggal Generate</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in historyList" :key="item.id" @click="loadFile(item)" class="history-row">
          <td>{{ item.nomorBA }}</td>
          <td>{{ item.jenisBeritaAcara }}</td>
          <td>{{ item.judulPekerjaan }}</td>
          <td>{{ new Date(item.generationTimestamp).toLocaleString('id-ID') }}</td>
        </tr>
      </tbody>
    </table>
    <div v-else>
      <p>Belum ada riwayat yang tersimpan.</p>
    </div>

    <div v-if="isBlobLoading">
        <p class="loading-text">Memuat file dokumen...</p>
    </div>
    <div v-if="selectedFileBlob" class="action-buttons">
      <button @click="downloadFile" class="btn-download">Download .docx</button>
      <button @click="previewFile" class="btn-preview">
        {{ isPreviewVisible ? 'Sembunyikan Preview' : 'Tampilkan Preview' }}
      </button>
    </div>

    <div v-if="isPreviewVisible" class="preview-container">
      <button @click="isPreviewVisible = false" class="btn-close">Tutup Preview</button>
      <h2>Preview Dokumen</h2>
      <div ref="docxContainer" class="docx-content"></div>
    </div>
  </div>
</template>

<style scoped>
.history-container {
  max-width: 1000px;
  margin: 2rem auto;
  padding: 2rem;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1.5rem;
}
th, td {
  border: 1px solid #ddd;
  padding: 0.8rem;
  text-align: left;
}
th {
  background-color: #f4f4f4;
}
.action-cell {
  display: flex;
  gap: 0.5rem;
}
.btn {
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  text-decoration: none;
  font-size: 0.9em;
}
.preview-container {
  margin-top: 2.5rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  position: relative;
}
.docx-content {
  background: #f7f7f7;
  padding: 2rem;
  box-shadow: 0 0 10px rgba(0,0,0,0.1) inset;
  min-height: 500px;
  border-radius: 4px;
}
.btn-close {
    position: absolute;
    top: 1.5rem;
    right: 1.5rem;
    background-color: #dc3545;
    padding: 0.5rem 1rem;
    border: none;
    color: white;
    border-radius: 4px;
    cursor: pointer;
}
.instruction {
  text-align: center;
  color: #666;
  font-style: italic;
}
.history-row {
  cursor: pointer;
  transition: background-color 0.2s;
}
.history-row:hover {
  background-color: #f0f8ff;
}
.action-buttons {
  margin-top: 1.5rem;
  display: flex;
  gap: 1rem;
  justify-content: center;
}
.loading-text {
    text-align: center;
    margin-top: 1.5rem;
    font-weight: bold;
    color: #007bff;
}
.btn-download, .btn-preview {
  padding: 0.75rem 1.5rem;
}
</style>