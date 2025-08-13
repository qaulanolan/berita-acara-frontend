<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <header class="modal-header">
        <h2>{{ modalTitle }}</h2>
        <button @click="$emit('close')" class="close-button">&times;</button>
      </header>

      <div class="modal-body">
        <!-- Tahap 1: Upload File -->
        <div v-if="currentStep === 1">
          <p class="instruction">Pilih file template (.docx) yang ingin Anda unggah. Sistem akan memindai placeholder yang ada di dalamnya.</p>
          <div class="file-upload-wrapper">
            <input type="file" id="file-input" @change="handleFileSelect" accept=".docx" ref="fileInputRef" />
            <label for="file-input">{{ selectedFile ? selectedFile.name : 'Pilih File...' }}</label>
          </div>
          <p v-if="error" class="error-message">{{ error }}</p>
          <div class="modal-actions">
            <button @click="uploadAndScan" :disabled="!selectedFile || isLoading">
              {{ isLoading ? 'Memindai...' : 'Lanjut ke Definisi' }}
            </button>
          </div>
        </div>

        <!-- Tahap 2: Definisi Metadata -->
        <div v-if="currentStep === 2">
          <form @submit.prevent="defineAndSave">
            <div class="form-group">
              <label for="template-name">Nama Template</label>
              <input type="text" id="template-name" v-model="templateData.templateName" required placeholder="Contoh: Laporan Proyek Bulanan" />
            </div>
            <div class="form-group">
              <label for="template-description">Deskripsi (Opsional)</label>
              <textarea id="template-description" v-model="templateData.description"></textarea>
            </div>
            
            <h3 class="placeholders-title">Definisi Placeholder</h3>
            <p class="instruction">Berikan label yang mudah dibaca dan tipe data untuk setiap placeholder yang ditemukan.</p>
            
            <div v-for="(placeholder, index) in templateData.placeholders" :key="index" class="placeholder-item">
              <div class="placeholder-key">{{ placeholder.placeholderKey }}</div>
              <div class="placeholder-inputs">
                <input type="text" v-model="placeholder.label" required placeholder="Label Form" />
                <select v-model="placeholder.dataType" required>
                  <option value="TEXT">Teks Singkat</option>
                  <option value="DATE">Tanggal</option>
                  <option value="RICH_TEXT">Teks Panjang (Rich Text)</option>
                </select>
              </div>
            </div>
            <p v-if="error" class="error-message">{{ error }}</p>
            <div class="modal-actions">
              <button @click="currentStep = 1" type="button" class="back-button">Kembali</button>
              <button type="submit" :disabled="isLoading">
                {{ isLoading ? 'Menyimpan...' : 'Simpan Template' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import api from '@/services/api';

const props = defineProps({
  show: Boolean,
});
const emit = defineEmits(['close']);

const currentStep = ref(1);
const isLoading = ref(false);
const error = ref(null);
const selectedFile = ref(null);
const fileInputRef = ref(null);

const templateData = ref({
  templateName: '',
  description: '',
  tempFilePath: '',
  originalFileName: '',
  placeholders: [],
});

const modalTitle = computed(() => {
  return currentStep.value === 1 ? 'Langkah 1: Unggah Template' : 'Langkah 2: Definisikan Metadata';
});

// Reset state saat modal dibuka
watch(() => props.show, (newVal) => {
  if (newVal) {
    resetState();
  }
});

const resetState = () => {
  currentStep.value = 1;
  isLoading.value = false;
  error.value = null;
  selectedFile.value = null;
  if (fileInputRef.value) {
    fileInputRef.value.value = ''; // Reset input file
  }
  templateData.value = {
    templateName: '',
    description: '',
    tempFilePath: '',
    originalFileName: '',
    placeholders: [],
  };
};

const handleFileSelect = (event) => {
  selectedFile.value = event.target.files[0];
};

const uploadAndScan = async () => {
  if (!selectedFile.value) return;
  isLoading.value = true;
  error.value = null;

  const formData = new FormData();
  formData.append('file', selectedFile.value);

  try {
    const response = await api.uploadAndScanTemplate(formData);
    templateData.value.tempFilePath = response.data.tempFilePath;
    templateData.value.originalFileName = response.data.originalFileName;
    // Ubah array string placeholder menjadi array objek untuk form
    templateData.value.placeholders = response.data.placeholders.map(key => ({
      placeholderKey: key,
      label: '', // Kosongkan agar diisi admin
      dataType: 'TEXT', // Default
      isRequired: true,
    }));
    currentStep.value = 2; // Pindah ke langkah berikutnya
  } catch (err) {
    console.error("Gagal upload & scan:", err);
    error.value = err.response?.data?.error || err.message || 'Gagal memproses file.';
  } finally {
    isLoading.value = false;
  }
};

const defineAndSave = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    await api.defineAndSaveTemplate(templateData.value);
    alert('Template berhasil disimpan!');
    emit('close'); // Tutup modal dan picu refresh di halaman parent
  } catch (err) {
    console.error("Gagal menyimpan template:", err);
    error.value = err.response?.data?.error || err.message || 'Gagal menyimpan template.';
  } finally {
    isLoading.value = false;
  }
};

</script>

<style scoped>
/* (Salin style dari kerangka sebelumnya, lalu tambahkan atau modifikasi ini) */
.modal-content { max-width: 700px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 1rem; }
.close-button { background: none; border: none; font-size: 1.5rem; cursor: pointer; }
.modal-body { padding-top: 1rem; }
.instruction { color: #666; margin-bottom: 1.5rem; }
.file-upload-wrapper { position: relative; }
.file-upload-wrapper input[type="file"] { display: none; }
.file-upload-wrapper label { display: block; padding: 1rem; border: 2px dashed #ccc; border-radius: 5px; text-align: center; cursor: pointer; }
.file-upload-wrapper label:hover { border-color: #007bff; }
.modal-actions { display: flex; justify-content: flex-end; margin-top: 2rem; gap: 1rem; }
.modal-actions button { padding: 0.75rem 1.5rem; border-radius: 5px; cursor: pointer; border: none; }
.back-button { background-color: #6c757d; color: white; }

.form-group { margin-bottom: 1rem; }
.form-group label { display: block; margin-bottom: 0.5rem; }
.form-group input, .form-group textarea, .form-group select { width: 100%; padding: 0.75rem; border: 1px solid #ccc; border-radius: 5px; }
.placeholders-title { margin-top: 2rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; }
.placeholder-item { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 5px; }
.placeholder-key { font-family: 'Courier New', Courier, monospace; background: #e9ecef; padding: 0.5rem; border-radius: 3px; }
.placeholder-inputs { display: flex; flex-grow: 1; gap: 1rem; }
.error-message { color: red; margin-top: 1rem; }
</style>