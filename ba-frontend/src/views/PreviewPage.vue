<script setup>
import { onMounted, ref } from 'vue';
import { renderAsync } from 'docx-preview';
import { useRoute } from 'vue-router';
import api from '@/services/api';

const docxContainer = ref(null);
const blobFile = ref(null);
const isLoading = ref(true);
const error = ref(null);
const fileName = ref('BeritaAcara.docx');
const route = useRoute();

// Fungsi helper untuk mengubah Base64 menjadi Blob
const base64ToBlob = (base64) => {
  const binary = atob(base64.split(',')[1]);
  const byteArray = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    byteArray[i] = binary.charCodeAt(i);
  }
  return new Blob([byteArray], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
};

onMounted(async () => {
  const historyId = route.params.id; // Ambil ID dari URL, jika ada

  try {
    let responseFromApi = null;

    if (historyId) {
      // Alur Utama: Ambil dari API
      console.log(`Mengambil file untuk riwayat ID: ${historyId}`);
      responseFromApi = await api.getHistoryFile(historyId);
      blobFile.value = responseFromApi.data;
    } else {
      // Alur Fallback: Ambil dari localStorage
      console.log('Mengambil file dari localStorage.');
      const base64 = localStorage.getItem('generatedDocx');
      if (!base64) {
        error.value = "Tidak ada dokumen untuk ditampilkan.";
        isLoading.value = false;
        return;
      }
      blobFile.value = base64ToBlob(base64);
      
      // --- PERBAIKAN: Buat nama file dari metadata localStorage ---
      const jenisBA = localStorage.getItem('generatedDocxJenisBA') || 'BeritaAcara';
      const judulBA = localStorage.getItem('generatedDocxJudulBA') || 'Dokumen';
      // Ganti karakter tidak valid di nama file
      const safeJenis = jenisBA.replace(/[<>:"/\\|?*]/g, '_');
      const safeJudul = judulBA.replace(/[<>:"/\\|?*]/g, '_');
      fileName.value = `BA-${safeJenis}-${safeJudul}.docx`;
      // ----------------------------------------------------------

      // Hapus semua item dari localStorage setelah digunakan
      localStorage.removeItem('generatedDocx');
      localStorage.removeItem('generatedDocxJenisBA');
      localStorage.removeItem('generatedDocxJudulBA');
    }

    // Ekstrak nama file dari header jika sumbernya dari API
    if (responseFromApi) {
      const contentDisposition = responseFromApi.headers['content-disposition'];
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+?)"/);
        if (match && match.length > 1) {
          fileName.value = match[1];
        }
      }
    }

    // Render dokumen
    if (blobFile.value) {
      await renderAsync(blobFile.value, docxContainer.value);
    }
    
  } catch (err) {
    console.error("Gagal memuat dokumen preview:", err);
    error.value = "Gagal memuat dokumen untuk preview.";
  } finally {
    isLoading.value = false;
  }
});

// function downloadFile() {
//   if (!blobFile.value) return;
//   // const nomorBA = localStorage.getItem('generatedDocxNomorBA') || 'BeritaAcara';
//   const jenisBA = localStorage.getItem('generatedDocxJenisBA') || 'BeritaAcara';
//   const judulBA = localStorage.getItem('generatedDocxJudulBA') || 'BeritaAcara';
//   const url = URL.createObjectURL(blobFile.value);
//   const a = document.createElement('a');
//   a.href = url;
//   a.download = `BA ${jenisBA} ${judulBA}.docx`;
//   a.click();
//   URL.revokeObjectURL(url);
// }

function downloadFile() {
  if (!blobFile.value) return;
  const url = URL.createObjectURL(blobFile.value);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.value;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
</script>


<template>
  <div class="preview-wrapper">
    <h2>📄 Preview Dokumen Berita Acara</h2>
    
    <div v-if="!isLoading && !error" class="actions">
      <button @click="downloadFile" class="btn-download">📥 Download .docx</button>
    </div>

    <div v-if="isLoading" class="state-message">Memuat preview...</div>
    <div v-if="error" class="state-message error">{{ error }}</div>

    <div ref="docxContainer" class="docx-content"></div>
  </div>
</template>


<style scoped>
.preview-wrapper {
  padding: 40px;
  background-color: #f4f4f4;
  min-height: 100vh;
}

.btn-download {
  background-color: #007bff;
  color: white;
  padding: 12px 20px;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  margin-bottom: 20px;
  cursor: pointer;
}

.docx-content {
  background: white;
  border-radius: 10px;
  padding: 25px;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
}

.actions { margin-bottom: 1.5rem; }
.state-message { text-align: center; padding: 2rem; color: #6c757d; }
.state-message.error { color: #dc3545; }
</style>