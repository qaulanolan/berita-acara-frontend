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
          <p class="instruction">
            {{ isEditMode ? 'Pilih file template baru (.docx) untuk mengganti template yang ada, atau lewati untuk hanya mengubah metadata.' : 'Pilih file template (.docx). Sistem akan memindai placeholder di dalamnya.' }}
          </p>
          <div class="file-upload-wrapper">
            <input 
              type="file" 
              id="file-input" 
              @change="handleFileSelect" 
              accept=".docx" 
              ref="fileInputRef" 
            />
            <label for="file-input" :class="{ 'has-file': selectedFile }">
              {{ selectedFile ? selectedFile.name : 'Klik untuk memilih file...' }}
            </label>
          </div>
          <p v-if="error" class="error-message">{{ error }}</p>
          <div class="modal-actions">
            <button 
              v-if="isEditMode" 
              @click="skipFileUpload" 
              class="button-secondary"
            >
              Lewati Upload File
            </button>
            <button 
              @click="uploadAndScan" 
              :disabled="!selectedFile || isLoading" 
              class="button-primary"
            >
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
                <input 
                  type="text" 
                  id="template-name" 
                  v-model="templateData.templateName" 
                  required 
                  placeholder="Contoh: Berita Acara UAT" 
                />
              </div>
              <div class="form-group">
                <label for="template-description">Deskripsi (Opsional)</label>
                <input 
                  type="text" 
                  id="template-description" 
                  v-model="templateData.description" 
                  placeholder="Deskripsi singkat template"
                />
              </div>
            </div>
            
            <!-- Status Template (untuk edit mode) -->
            <div v-if="isEditMode" class="form-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="templateData.isActive"
                />
                <span class="checkmark"></span>
                Template Aktif
              </label>
            </div>
            
            <h3 class="placeholders-title">
              {{ templateData.placeholders.length > 0 ? 'Definisi Placeholder Ditemukan' : 'Belum Ada Placeholder' }}
            </h3>
            
            <div v-if="templateData.placeholders.length > 0">
              <p class="instruction">
                Berikan label yang mudah dibaca dan tipe data untuk setiap placeholder.
              </p>
              <div class="label-control-buttons">
                <button type="button" @click="regenerateAutoLabels" class="auto-label-button primary">
                  🔄 Regenerate Auto Labels
                </button>
                <button type="button" @click="clearAllLabels" class="auto-label-button danger">
                  🗑️ Kosongkan Semua
                </button>
              </div>

              <!-- Render grouped placeholders -->
              <div v-for="(group, groupName) in groupedPlaceholders" :key="groupName">
                <div v-if="group.length > 0">
                  <h4 class="group-title">{{ groupName }}</h4>
                  <div v-for="placeholder in group" :key="placeholder.placeholderKey" class="placeholder-item">
                    <div class="placeholder-key">{{ placeholder.placeholderKey }}</div>
                    <div class="placeholder-inputs">
                      <input 
                        type="text" 
                        v-model="placeholder.label" 
                        required 
                        placeholder="Label untuk Form" 
                        class="label-input"
                      />
                      <select v-model="placeholder.dataType" required>
                        <option value="TEXT">Teks Singkat</option>
                        <option value="TEXTAREA">Textarea (beberapa baris)</option>
                        <option value="DATE">Tanggal</option>
                        <option value="RICH_TEXT">Teks Panjang (HTML)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-else class="empty-placeholders">
              <p>Tidak ada placeholder yang ditemukan dalam template ini.</p>
            </div>

            <p v-if="error" class="error-message">{{ error }}</p>
            <div class="modal-actions">
              <button @click="goBackToStep1" type="button" class="button-secondary">
                Kembali
              </button>
              <button type="submit" :disabled="isLoading" class="button-primary">
                {{ isLoading ? 'Menyimpan...' : (isEditMode ? 'Update Template' : 'Simpan Template') }}
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
  template: {
    type: Object,
    default: null
  }
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
  isActive: true,
});

// Computed properties
const isEditMode = computed(() => props.template !== null);

const modalTitle = computed(() => {
  if (isEditMode.value) {
    return currentStep.value === 1 ? 'Edit Template: Langkah 1' : 'Edit Template: Langkah 2';
  }
  return currentStep.value === 1 ? 'Langkah 1: Unggah File' : 'Langkah 2: Definisikan Metadata';
});

const groupedPlaceholders = computed(() => {
  const groups = {
    'Informasi Umum': [],
    'Nomor & Tanggal': [],
    'Deskripsi Fitur': [],
    'Penandatangan': [],
    'Lainnya': [],
  };

  if (!templateData.value.placeholders || templateData.value.placeholders.length === 0) {
    return groups;
  }

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

  groups['Penandatangan'].sort((a, b) => a.placeholderKey.localeCompare(b.placeholderKey));
  return groups;
});

// Watchers
watch(() => props.show, (newVal) => {
  if (newVal) {
    resetState();
    if (isEditMode.value) {
      loadTemplateData();
    }
  }
});

// Methods
const resetState = () => {
  currentStep.value = 1;
  isLoading.value = false;
  error.value = null;
  selectedFile.value = null;
  if (fileInputRef.value) fileInputRef.value.value = '';
  
  if (!isEditMode.value) {
    templateData.value = { 
      templateName: '', 
      description: '', 
      tempFilePath: '', 
      originalFileName: '', 
      placeholders: [],
      isActive: true,
    };
  }
};

const loadTemplateData = () => {
  if (props.template) {
    templateData.value = {
      templateName: props.template.templateName || '',
      description: props.template.description || '',
      tempFilePath: props.template.tempFilePath || '',
      originalFileName: props.template.originalFileName || '',
      placeholders: props.template.placeholders || [],
      isActive: props.template.isActive ?? true,
    };
  }
};

const generateAutoLabel = (placeholderKey) => {
  const labelMappings = {
    'jenis_request': 'Jenis Request',
    'aplikasi': 'Nama Aplikasi',
    'judul_pekerjaan': 'Judul Pekerjaan',
    'tahap': 'Tahap',
    'tahap_pengujian': 'Tahap Pengujian',
    'nomor_ba': 'Nomor Berita Acara',
    'nomor_surat': 'Nomor Surat',
    'nomor_dokumen': 'Nomor Dokumen',
    'tanggal_ba': 'Tanggal Berita Acara',
    'tanggal_mulai': 'Tanggal Mulai',
    'tanggal_selesai': 'Tanggal Selesai',
    'tanggal_pengujian': 'Tanggal Pengujian',
    'tanggal_surat': 'Tanggal Surat',
    'deskripsi_aplikasi': 'Deskripsi Aplikasi',
    'deskripsi_pekerjaan': 'Deskripsi Pekerjaan',
    'deskripsi_pengujian': 'Deskripsi Pengujian',
    'deskripsi_hasil': 'Deskripsi Hasil',
    'kesimpulan': 'Kesimpulan',
    'catatan': 'Catatan',
    'keterangan': 'Keterangan',
    'lokasi': 'Lokasi',
    'tempat': 'Tempat',
    'ruangan': 'Ruangan',
    'alamat': 'Alamat',
    'jam_mulai': 'Jam Mulai',
    'jam_selesai': 'Jam Selesai',
    'durasi': 'Durasi',
    'status': 'Status',
    'hasil': 'Hasil',
    'status_pengujian': 'Status Pengujian',
    'hasil_pengujian': 'Hasil Pengujian',
    'versi': 'Versi',
    'versi_aplikasi': 'Versi Aplikasi',
    'release': 'Release',
    'build': 'Build',
  };
  
  if (placeholderKey.startsWith('fitur.')) {
    const featureNumber = placeholderKey.split('.')[1];
    return `Fitur ${featureNumber}`;
  }
  
  if (placeholderKey.startsWith('signatory.')) {
    const signatoryPart = placeholderKey.split('.')[1];
    const signatoryMappings = {
      'penandatangan1_nama': 'Nama Penandatangan 1',
      'penandatangan1_jabatan': 'Jabatan Penandatangan 1',
      'penandatangan1_instansi': 'Instansi Penandatangan 1',
      'penandatangan2_nama': 'Nama Penandatangan 2',
      'penandatangan2_jabatan': 'Jabatan Penandatangan 2',
      'penandatangan2_instansi': 'Instansi Penandatangan 2',
      'mengetahui_nama': 'Nama Yang Mengetahui',
      'mengetahui_jabatan': 'Jabatan Yang Mengetahui',
      'mengetahui_instansi': 'Instansi Yang Mengetahui',
    };
    
    return signatoryMappings[signatoryPart] || capitalizeWords(signatoryPart.replace(/_/g, ' '));
  }
  
  if (labelMappings[placeholderKey]) {
    return labelMappings[placeholderKey];
  }
  
  return capitalizeWords(placeholderKey.replace(/_/g, ' '));
};

const capitalizeWords = (str) => {
  return str.replace(/\b\w/g, l => l.toUpperCase());
};

const regenerateAutoLabels = () => {
  templateData.value.placeholders.forEach(placeholder => {
    const innerKey = placeholder.placeholderKey.substring(2, placeholder.placeholderKey.length - 1);
    placeholder.label = generateAutoLabel(innerKey);
  });
};

const clearAllLabels = () => {
  templateData.value.placeholders.forEach(placeholder => {
    placeholder.label = '';
  });
};

const closeModal = () => {
  if (!isLoading.value) {
    emit('close');
  }
};

const handleFileSelect = (event) => {
  selectedFile.value = event.target.files[0];
  error.value = null;
};

const skipFileUpload = () => {
  // Untuk edit mode, skip upload file dan langsung ke step 2
  currentStep.value = 2;
};

const goBackToStep1 = () => {
  currentStep.value = 1;
  error.value = null;
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

    // Filter placeholder tanggal turunan
    const dateDerivativePattern = /(_terbilang|_lengkap|_hari|_tanggal|_bulan|_tahun)$/;
    const filteredPlaceholders = response.data.placeholders.filter(key => {
      const innerKey = key.substring(2, key.length - 1);
      return !dateDerivativePattern.test(innerKey);
    });

    // Convert ke objek placeholder
    templateData.value.placeholders = filteredPlaceholders.map(key => {
      const innerKey = key.substring(2, key.length - 1);
      let dataType = 'TEXT';
      
      if (innerKey.startsWith('tanggal_')) {
        dataType = 'DATE';
      } else if (innerKey.includes('deskripsi')) {
        dataType = 'RICH_TEXT';
      } else if (innerKey.includes('signatory')) {
        dataType = 'TEXTAREA';
      }
      
      return {
        placeholderKey: key,
        label: generateAutoLabel(innerKey),
        dataType: dataType,
        isRequired: true,
      };
    });
    
    currentStep.value = 2;
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

  if (!templateData.value.templateName.trim()) {
    error.value = "Nama Template wajib diisi.";
    isLoading.value = false;
    return;
  }

  try {
    if (isEditMode.value) {
      // Update existing template
      await api.updateTemplate(props.template.id, templateData.value);
      showNotification('Template berhasil diupdate!', 'success');
    } else {
      // Create new template
      await api.defineAndSaveTemplate(templateData.value);
      showNotification('Template berhasil disimpan!', 'success');
    }
    
    emit('close');
  } catch (err) {
    console.error('Error saving template:', err);
    error.value = err.response?.data?.message || err.response?.data?.error || 'Gagal menyimpan template.';
  } finally {
    isLoading.value = false;
  }
};

const showNotification = (message, type = 'info') => {
  if (type === 'error') {
    alert(`❌ ${message}`);
  } else if (type === 'success') {
    alert(`✅ ${message}`);
  } else {
    alert(`ℹ️ ${message}`);
  }
};
</script>

<style scoped>
/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

/* Modal Content */
.modal-content {
  background: white;
  border-radius: 10px;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

/* Modal Header */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem 1rem 2rem;
  border-bottom: 1px solid #e9ecef;
  background-color: #f8f9fa;
  border-radius: 10px 10px 0 0;
}

.modal-header h2 {
  margin: 0;
  color: #495057;
  font-size: 1.5rem;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #6c757d;
  padding: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-button:hover {
  background-color: #e9ecef;
  color: #495057;
}

/* Modal Body */
.modal-body {
  padding: 2rem;
}

/* Instructions */
.instruction {
  color: #6c757d;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  line-height: 1.5;
}

/* File Upload */
.file-upload-wrapper {
  position: relative;
  margin-bottom: 1.5rem;
}

.file-upload-wrapper input[type="file"] {
  display: none;
}

.file-upload-wrapper label {
  display: block;
  padding: 2rem;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #f8f9fa;
  color: #6c757d;
  font-size: 1rem;
}

.file-upload-wrapper label:hover {
  border-color: #007bff;
  background-color: #e7f1ff;
  color: #007bff;
}

.file-upload-wrapper label.has-file {
  border-color: #28a745;
  background-color: #d4edda;
  color: #155724;
}

/* Form Groups */
.form-group-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #495057;
  font-size: 0.95rem;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 1rem;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

/* Checkbox Label */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.checkmark {
  color: #495057;
  font-weight: 500;
}

/* Placeholders Section */
.placeholders-title {
  margin: 2.5rem 0 1rem 0;
  color: #495057;
  font-size: 1.25rem;
  font-weight: 600;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 0.5rem;
}

.group-title {
  margin: 2rem 0 1rem 0;
  font-size: 1.1rem;
  color: #007bff;
  font-weight: 600;
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 0.5rem;
}

.placeholder-item {
  display: grid;
  grid-template-columns: 1fr 2fr;
  align-items: start;
  gap: 1.5rem;
  margin-bottom: 1rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.placeholder-key {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  background: #e9ecef;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
  word-break: break-all;
  color: #495057;
}

.placeholder-inputs {
  display: flex;
  gap: 1rem;
  align-items: start;
}

.label-input {
  flex: 2;
}

.placeholder-inputs select {
  flex: 1;
  min-width: 150px;
}

/* Empty Placeholders */
.empty-placeholders {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  font-style: italic;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

/* Buttons */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 2.5rem;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.button-primary,
.button-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.button-primary {
  background-color: #007bff;
  color: white;
}

.button-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.button-primary:disabled {
  background-color: #a0c7ff;
  cursor: not-allowed;
}

.button-secondary {
  background-color: #6c757d;
  color: white;
}

.button-secondary:hover {
  background-color: #545b62;
}

/* Error Message */
.error-message {
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
  padding: 0.75rem;
  margin-top: 1rem;
  font-size: 0.95rem;
}

/* Auto Label Buttons */
.label-control-buttons {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.auto-label-button {
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.auto-label-button.primary {
  background-color: #17a2b8;
  color: white;
}

.auto-label-button.primary:hover {
  background-color: #138496;
  transform: translateY(-1px);
}

.auto-label-button.danger {
  background-color: #dc3545;
  color: white;
}

.auto-label-button.danger:hover {
  background-color: #c82333;
  transform: translateY(-1px);
}

.auto-label-button:active {
  transform: translateY(0);
}

/* Responsive Design */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
  
  .modal-body {
    padding: 1.5rem;
  }
  
  .modal-header {
    padding: 1rem 1.5rem;
  }
  
  .form-group-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .placeholder-item {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .placeholder-inputs {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .label-control-buttons {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .auto-label-button {
    justify-content: center;
  }
  
  .modal-actions {
    flex-direction: column-reverse;
    gap: 0.5rem;
  }
  
  .modal-actions button {
    width: 100%;
  }
}
</style>