<script setup>
import { onMounted, ref } from 'vue';
import { renderAsync } from 'docx-preview';

const docxContainer = ref(null);
const blobFile = ref(null);

onMounted(async () => {
  const base64 = localStorage.getItem('generatedDocx');
  if (!base64) return;

  const binary = atob(base64.split(',')[1]);
  const byteArray = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    byteArray[i] = binary.charCodeAt(i);
  }

  blobFile.value = new Blob([byteArray], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  await renderAsync(blobFile.value, docxContainer.value);
});

function downloadFile() {
  if (!blobFile.value) return;
  // const nomorBA = localStorage.getItem('generatedDocxNomorBA') || 'BeritaAcara';
  const jenisBA = localStorage.getItem('generatedDocxJenisBA') || 'BeritaAcara';
  const judulBA = localStorage.getItem('generatedDocxJudulBA') || 'BeritaAcara';
  const url = URL.createObjectURL(blobFile.value);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BA ${jenisBA} ${judulBA}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
</script>


<template>
  <div class="preview-wrapper">
    <h2>📄 Preview Dokumen Berita Acara</h2>

    <button @click="downloadFile" class="btn-download">📥 Download .docx</button>

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
</style>