<template>
  <div v-if="show" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <header class="modal-header">
        <h2>{{ modalTitle }}</h2>
        <button @click="closeModal" class="close-button">&times;</button>
      </header>

      <div class="modal-body">
        <!-- Tahap 1: Upload File -->
        <div v-if="currentStep === 1">
          <p class="instruction">Pilih file template (.docx). Sistem akan memindai placeholder di dalamnya.</p>
          <div class="file-upload-wrapper">
            <input type="file" id="file-input" @change="handleFileSelect" accept=".docx" ref="fileInputRef" />
            <label for="file-input" :class="{ 'has-file': selectedFile }">{{ selectedFile ? selectedFile.name : 'Klik untuk memilih file...' }}</label>
          </div>
          <p v-if="error" class="error-message">{{ error }}</p>
          <div class="modal-actions">
            <button @click="uploadAndScan" :disabled="!selectedFile || isLoading" class="button-primary">
              {{ isLoading ? 'Memindai...' : 'Lanjut' }}
            </button>
          </div>
        </div>

        <!-- Tahap 2: Definisi Metadata -->
        <div v-if="currentStep === 2">
          <form @submit.prevent="defineAndSave">
            <div class="form-group-grid">
              <div class="form-group">
                <label for="template-name">Nama Template</label>
                <input type="text" id="template-name" v-model="templateData.templateName" required placeholder="Contoh: Berita Acara UAT" />
              </div>
              <div class="form-group">
                <label for="template-description">Deskripsi (Opsional)</label>
                <input type="text" id="template-description" v-model="templateData.description" />
              </div>
            </div>
            
            <h3 class="placeholders-title">Definisi Placeholder Ditemukan</h3>
            <p class="instruction">Berikan label yang mudah dibaca dan tipe data untuk setiap placeholder.</p>

            <!-- Gunakan v-for ganda untuk merender grup -->
            <div v-for="(group, groupName) in groupedPlaceholders" :key="groupName">
              <div v-if="group.length > 0">
                <h4 class="group-title">{{ groupName }}</h4>
                <div v-for="placeholder in group" :key="placeholder.placeholderKey" class="placeholder-item">
                  <div class="placeholder-key">{{ placeholder.placeholderKey }}</div>
                  <div class="placeholder-inputs">
                    <input type="text" v-model="placeholder.label" required placeholder="Label untuk Form" class="label-input"/>
                    <select v-model="placeholder.dataType" required>
                      <option value="TEXT">Teks Singkat</option>
                      <option value="DATE">Tanggal</option>
                      <option value="RICH_TEXT">Teks Panjang (HTML)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <p v-if="error" class="error-message">{{ error }}</p>
            <div class="modal-actions">
              <button @click="currentStep = 1" type="button" class="button-secondary">Kembali</button>
              <button type="submit" :disabled="isLoading" class="button-primary">
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

const props = defineProps({ show: Boolean });
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

const modalTitle = computed(() => currentStep.value === 1 ? 'Langkah 1: Unggah File' : 'Langkah 2: Definisikan Metadata');

// ======================================================================
// === PERUBAHAN UTAMA: Tambahkan computed property ini ===
// ======================================================================
const groupedPlaceholders = computed(() => {
  // Selalu siapkan struktur grup kosong sebagai default
  const groups = {
    'Informasi Umum': [],
    'Nomor & Tanggal': [],
    'Deskripsi Fitur': [],
    'Penandatangan': [],
    'Lainnya': [],
  };

  // Jika belum ada placeholder, kembalikan grup kosong
  if (!templateData.value.placeholders || templateData.value.placeholders.length === 0) {
    return groups;
  }

  // Loop melalui setiap placeholder dan masukkan ke grup yang sesuai
  templateData.value.placeholders.forEach(placeholder => {
    const key = placeholder.placeholderKey;
    if (key.includes('jenis_request') || key.includes('aplikasi') || key.includes('judul_pekerjaan') || key.includes('tahap')) {
      groups['Informasi Umum'].push(placeholder);
    } else if (key.includes('nomor_') || key.includes('tanggal_')) {
      groups['Nomor & Tanggal'].push(placeholder);
    } else if (key.includes('fitur.')) {
      groups['Deskripsi Fitur'].push(placeholder);
    } else if (key.includes('signatory.')) {
      groups['Penandatangan'].push(placeholder);
    } else {
      groups['Lainnya'].push(placeholder);
    }
  });

  // Urutkan signatory agar berurutan (penandatangan1, penandatangan2, mengetahui)
  // Ini penting agar form-nya logis.
  groups['Penandatangan'].sort((a, b) => a.placeholderKey.localeCompare(b.placeholderKey));

  return groups;
});

watch(() => props.show, (newVal) => newVal && resetState());

const resetState = () => {
  currentStep.value = 1;
  isLoading.value = false;
  error.value = null;
  selectedFile.value = null;
  if (fileInputRef.value) fileInputRef.value.value = '';
  templateData.value = { templateName: '', description: '', tempFilePath: '', originalFileName: '', placeholders: [] };
};

const closeModal = () => {
  // Hanya emit 'close' jika tidak sedang loading
  if (!isLoading.value) {
    emit('close');
  }
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

    // --- PERBAIKAN UTAMA DI SINI ---
    
    // Pola regex untuk mendeteksi placeholder tanggal turunan
    const dateDerivativePattern = /(_terbilang|_lengkap|_hari|_tanggal|_bulan|_tahun)$/;

    // Filter placeholder yang ditemukan oleh backend
    const filteredPlaceholders = response.data.placeholders.filter(key => {
      // Dapatkan nama di dalam kurung kurawal, e.g., "hari_ba_terbilang"
      const innerKey = key.substring(2, key.length - 1);
      // Simpan placeholder JIKA BUKAN placeholder tanggal turunan
      return !dateDerivativePattern.test(innerKey);
    });

    // Ubah array string placeholder yang sudah difilter menjadi array objek untuk form
    templateData.value.placeholders = filteredPlaceholders.map(key => {
      const innerKey = key.substring(2, key.length - 1);
      let dataType = 'TEXT'; // Default
      
      // Heuristik (tebakan pintar) untuk menentukan tipe data default
      if (innerKey.startsWith('tanggal_')) {
        dataType = 'DATE';
      } else if (innerKey.includes('deskripsi')) {
        dataType = 'RICH_TEXT';
      }
      
      return {
        placeholderKey: key,
        label: '', // Kosongkan agar diisi admin
        dataType: dataType,
        isRequired: true,
      };
    });
    
    // ------------------------------------

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

  // Validasi sederhana
  if (!templateData.value.templateName) {
      error.value = "Nama Template wajib diisi.";
      isLoading.value = false;
      return;
  }

  try {
    await api.defineAndSaveTemplate(templateData.value);
    alert('Template berhasil disimpan!');
    emit('close');
  } catch (err) {
    error.value = err.response?.data?.message || 'Gagal menyimpan template.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
/* (Salin style dari kerangka sebelumnya, lalu tambahkan atau modifikasi ini) */
.modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 1rem; }
.close-button { background: none; border: none; font-size: 1.5rem; cursor: pointer; }
.modal-body { padding-top: 1rem; }
.instruction { color: #666; margin-bottom: 1.5rem; }
.file-upload-wrapper { position: relative; }
.file-upload-wrapper input[type="file"] { display: none; }
.file-upload-wrapper label { display: block; padding: 1rem; border: 2px dashed #ccc; border-radius: 5px; text-align: center; cursor: pointer; }
.file-upload-wrapper label:hover { border-color: #007bff; }
.modal-actions { display: flex; justify-content: flex-end; margin-top: 2rem; gap: 1rem; }
.back-button { background-color: #6c757d; color: white; }

.form-group { margin-bottom: 1rem; }
.form-group label { display: block; margin-bottom: 0.5rem; }
.form-group input, .form-group textarea, .form-group select { width: 100%; padding: 0.75rem; border: 1px solid #ccc; border-radius: 5px; }
.placeholders-title { margin-top: 2rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; }
.placeholder-key { font-family: 'Courier New', Courier, monospace; background: #e9ecef; padding: 0.5rem; border-radius: 3px; }
.error-message { color: red; margin-top: 1rem; }

.modal-content { width: 90%; max-width: 800px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
.modal-actions button { font-size: 1rem; }
.button-primary { background-color: #007bff; color: white; border: none; }
.button-primary:disabled { background-color: #a0c7ff; }
.button-secondary { background-color: #6c757d; color: white; border: none; }
.form-group-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.placeholder-item { display: grid; grid-template-columns: 1fr 2fr; align-items: center; gap: 1rem; margin-bottom: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 5px; }
.placeholder-inputs { display: flex; gap: 1rem; }
.label-input { flex-grow: 1; }
label.has-file { border-color: #28a745; color: #28a745; }
.group-title {
  margin-top: 2rem;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  color: #007bff;
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 0.5rem;
}

.placeholder-item:first-of-type {
  margin-top: 0;
}
</style>