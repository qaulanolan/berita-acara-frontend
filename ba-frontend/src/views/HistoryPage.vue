<script>

export default {
  name: 'HistoryPage'
}
</script>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import apiClient from '@/services/api';
import { renderAsync } from 'docx-preview';

const historyList = ref([]);
const isLoading = ref(true);
const isBlobLoading = ref(false);

const selectedFileBlob = ref(null);
const selectedNomorBA = ref('');
const isPreviewVisible = ref(false);
const docxContainer = ref(null);
const selectedHistoryId = ref(null);


onMounted(async () => {
  try {
    const response = await apiClient.get('http://localhost:8080/berita-acara/history');
    historyList.value = response.data;
  } catch (error) {
    console.error("Gagal mengambil histori:", error);
    alert("Gagal mengambil data histori.");
  } finally {
    isLoading.value = false;
  }
});

async function loadFile(item) {
  isBlobLoading.value = true;
  isPreviewVisible.value = false;
  selectedFileBlob.value = null;
  selectedHistoryId.value = item.id;
  if (docxContainer.value) docxContainer.value.innerHTML = '';
  
  try {
    const response = await apiClient.get(`http://localhost:8080/berita-acara/history/${item.id}/file`, {
      responseType: 'blob'
    });
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
        <tr   
          v-for="item in historyList" 
          :key="item.id" 
          @click="loadFile(item)" 
          class="history-row"
          :class="{ 'selected-row': item.id === selectedHistoryId }"
        >
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
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
.selected-row {
  background-color: #d4edda !important; 
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