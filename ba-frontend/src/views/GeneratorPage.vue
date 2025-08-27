<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();

import api from '@/services/api';
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';

const templates = ref([]);
const selectedTemplateId = ref('');
const formStructure = ref([]);
const formData = ref({});
const isLoadingForm = ref(false);
const isGenerating = ref(false);
const error = ref(null);

// --- Tambahkan fungsi helper di sini ---
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// === TAMBAHKAN OPTIONS UNTUK SELECT ===
const tahapOptions = ref([
  { value: 'Tahap 1', label: 'Tahap 1' },
  { value: 'Tahap 2', label: 'Tahap 2' },
  { value: 'Tahap 3', label: 'Tahap 3' },
  { value: 'Tahap 4', label: 'Tahap 4' }
]);

const jenisRequestOptions = ref([
  { value: 'PENGEMBANGAN', label: 'Job Request' },
  { value: 'PERUBAHAN', label: 'Change Request' }
]);

// === FUNGSI UNTUK MENGELOMPOKKAN PENANDATANGAN ===
const groupSignatories = (signatoryFields) => {
  const grouped = {};
  
  signatoryFields.forEach(field => {
    const key = field.placeholderKey;
    // Extract signatory number from field key (e.g., signatory.penandatangan1.nama -> penandatangan1)
    const match = key.match(/signatory\.(\w+)\./);
    if (match) {
      const signatoryKey = match[1];
      if (!grouped[signatoryKey]) {
        grouped[signatoryKey] = {};
      }
      
      // Determine field type (jabatan, nama, perusahaan, nip, alamat)
      if (key.includes('.jabatan')) {
        grouped[signatoryKey].jabatan = field;
      } else if (key.includes('.nama')) {
        grouped[signatoryKey].nama = field;
      } else if (key.includes('.perusahaan')) {
        grouped[signatoryKey].perusahaan = field;
      } else if (key.includes('.nip')) {
        grouped[signatoryKey].nip = field;
      } else if (key.includes('.alamat')) {
        grouped[signatoryKey].alamat = field;
      }
    }
  });
  
  return grouped;
};

// === FUNGSI UNTUK MENGECEK APAKAH ADA KOLOM NIP DAN ALAMAT ===
const hasNipColumn = computed(() => {
  const signatoryFields = groupedForm.value['Penandatangan'] || [];
  return signatoryFields.some(field => field.placeholderKey.includes('.nip'));
});

const hasAlamatColumn = computed(() => {
  const signatoryFields = groupedForm.value['Penandatangan'] || [];
  return signatoryFields.some(field => field.placeholderKey.includes('.alamat'));
});

// === COMPUTED UNTUK MENGHITUNG JUMLAH KOLOM GRID ===
const gridColumnsCount = computed(() => {
  let baseColumns = 4; // Nama, Jabatan, Perusahaan, Penandatangan
  if (hasNipColumn.value) baseColumns++;
  if (hasAlamatColumn.value) baseColumns++;
  return baseColumns;
});

// === COMPUTED UNTUK TEMPLATE COLUMNS CSS ===
const gridTemplateColumns = computed(() => {
  const columns = [];
  columns.push('2fr'); // Nama Lengkap - lebih lebar
  columns.push('2fr'); // Jabatan - lebih lebar
  columns.push('2fr'); // Perusahaan - lebih lebar
  
  if (hasNipColumn.value) {
    columns.push('1.5fr'); // NIP
  }
  
  if (hasAlamatColumn.value) {
    columns.push('2fr'); // Alamat - lebih lebar
  }
  
  columns.push('1.5fr'); // Penandatangan
  
  return columns.join(' ');
});

// === FUNGSI HELPER UNTUK MENENTUKAN APAKAH FIELD ADALAH SELECT ===
const isSelectField = (field) => {
  const key = field.placeholderKey.toLowerCase();
  return key.includes('tahap') || key.includes('jenis_request');
};

const getSelectOptions = (field) => {
  const key = field.placeholderKey.toLowerCase();
  if (key.includes('tahap')) {
    return tahapOptions.value;
  } else if (key.includes('jenis_request')) {
    return jenisRequestOptions.value;
  }
  return [];
};

// ======================================================================
// === PERUBAHAN UTAMA: Tambahkan computed property ini ===
// ======================================================================
const groupedForm = computed(() => {
  const groups = {
    'Informasi Umum': [],
    'Nomor & Tanggal': [],
    'Deskripsi Fitur': [],
    'Penandatangan': [],
    'Lainnya': [],
  };

  if (!formStructure.value || formStructure.value.length === 0) {
    return groups;
  }

  // Loop melalui definisi form dari API dan masukkan ke grup yang sesuai
  formStructure.value.forEach(field => {
    const key = field.placeholderKey;
    if (key.includes('jenis_request') || key.includes('aplikasi') || key.includes('judul_pekerjaan') || key.includes('tahap')) {
      groups['Informasi Umum'].push(field);
    } else if (key.includes('nomor_') || key.includes('tanggal_')) {
      groups['Nomor & Tanggal'].push(field);
    } else if (key.includes('fitur.')) {
      groups['Deskripsi Fitur'].push(field);
    } else if (key.includes('signatory.')) {
      groups['Penandatangan'].push(field);
    } else {
      groups['Lainnya'].push(field);
    }
  });

  // Urutkan signatory agar berurutan (penandatangan1, penandatangan2, mengetahui)
  groups['Penandatangan'].sort((a, b) => a.placeholderKey.localeCompare(b.placeholderKey));

  return groups;
});

onMounted(async () => {
  try {
    const response = await api.getActiveTemplates();
    templates.value = response.data;
  } catch (err) {
    error.value = "Gagal memuat daftar template.";
  }
});

const fetchFormStructure = async () => {
  if (!selectedTemplateId.value) return;
  isLoadingForm.value = true;
  formStructure.value = [];
  formData.value = {};
  error.value = null;

  try {
    const response = await api.getTemplateFormStructure(selectedTemplateId.value);
    formStructure.value = response.data;
    response.data.forEach(field => {
      // Inisialisasi formData dengan nilai default
      formData.value[field.placeholderKey] = field.dataType === 'RICH_TEXT' ? '<p></p>' : '';
    });
  } catch (err) {
    error.value = "Gagal memuat form untuk template ini.";
  } finally {
    isLoadingForm.value = false;
  }
};

// --- GANTI FUNGSI generateDocument DENGAN VERSI BARU INI ---
const generateDocument = async () => {
  isGenerating.value = true;
  error.value = null;
  
  const payload = {
    templateId: Number(selectedTemplateId.value),
    data: formData.value,
  };
  
  try {
    const response = await api.generateDynamicDocument(payload);
    
    // --- Logika Baru: Simpan ke localStorage dan Redirect ---
    
    // 1. Ubah blob menjadi Base64
    const base64String = await blobToBase64(response.data);
    
    // 2. Simpan file Base64 ke localStorage
    localStorage.setItem('generatedDocx', base64String);
    
    // 3. (Opsional) Simpan metadata untuk nama file saat di-download nanti
    // Kita ambil dari header 'X-History-ID' yang dikirim backend
    const historyId = response.headers['x-history-id'];
    if (historyId) {
        // Arahkan ke halaman preview dengan ID dari riwayat
        // Asumsi rute preview Anda adalah /preview/:id
        // Jika rute Anda hanya /preview, maka gunakan router.push({ name: 'Preview' })
        router.push({ name: 'Preview', params: { id: historyId } });
    } else {
        // Fallback jika header tidak ada, arahkan ke halaman preview generik
        router.push({ name: 'Preview' });
    }

  } catch (err) {
    console.error("Gagal generate dokumen:", err);
    error.value = "Terjadi kesalahan saat membuat dokumen.";
  } finally {
    isGenerating.value = false;
  }
};
</script>

<template>
  <div class="page-wrapper">
    <div class="generator-container">
      <!-- Header dengan design yang lebih menarik -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <polyline points="10,9 9,9 8,9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h1>Generator Berita Acara</h1>
          <p class="header-subtitle">Buat dokumen berita acara dengan mudah dan cepat</p>
        </div>
      </div>
      
      <!-- Step 1: Template Selection -->
      <div class="step-container">
        <div class="step-header">
          <div class="step-number">1</div>
          <h2>Pilih Template</h2>
        </div>
        <div class="template-selection">
          <select v-model="selectedTemplateId" @change="fetchFormStructure" class="template-select">
            <option disabled value="">Pilih salah satu template...</option>
            <option v-for="template in templates" :key="template.id" :value="template.id">
              {{ template.templateName }}
            </option>
          </select>
          <div class="select-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polyline points="6,9 12,15 18,9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoadingForm" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Memuat form...</p>
      </div>

      <!-- Step 2: Form -->
      <form v-if="formStructure.length > 0 && !isLoadingForm" @submit.prevent="generateDocument" class="dynamic-form">
        <div class="step-header">
          <div class="step-number">2</div>
          <h2>Isi Data</h2>
        </div>
        
        <!-- Form Groups -->
        <div v-for="(group, groupName) in groupedForm" :key="groupName" class="form-section">
          <div v-if="group.length > 0">
            <h3 class="group-title">
              <span class="group-icon">
                <svg v-if="groupName === 'Informasi Umum'" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" stroke-width="2"/>
                </svg>
                <svg v-else-if="groupName === 'Nomor & Tanggal'" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
                  <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="2"/>
                  <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="2"/>
                  <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2"/>
                </svg>
                <svg v-else-if="groupName === 'Deskripsi Fitur'" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2"/>
                  <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2"/>
                </svg>
                <svg v-else-if="groupName === 'Penandatangan'" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 4.17157 16.1716C3.42143 16.9217 3 17.9391 3 19V21" stroke="currentColor" stroke-width="2"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
                </svg>
                <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                  <line x1="12" y1="16" x2="12" y2="12" stroke="currentColor" stroke-width="2"/>
                  <line x1="12" y1="8" x2="12.01" y2="8" stroke="currentColor" stroke-width="2"/>
                </svg>
              </span>
              {{ groupName }}
            </h3>
            
            <!-- Penandatangan Section -->
            <div v-if="groupName === 'Penandatangan'" class="signatory-section">
              <div class="signatory-table" :style="{ '--grid-columns': gridTemplateColumns }">
                <div class="signatory-headers">
                  <div class="header-item">Nama Lengkap</div>
                  <div class="header-item">Jabatan</div>
                  <div class="header-item">Perusahaan</div>
                  <div v-if="hasNipColumn" class="header-item">NIP</div>
                  <div v-if="hasAlamatColumn" class="header-item">Alamat</div>
                  <div class="header-item">Penandatangan</div>
                </div>
                
                <div v-for="(signatoryGroup, signatoryKey) in groupSignatories(group)" :key="signatoryKey" 
                     class="signatory-row" 
                     :class="{ 'mengetahui-row': signatoryKey.includes('mengetahui') }">
                  
                  <!-- Nama Lengkap -->
                  <div class="signatory-cell">
                    <textarea
                      v-if="signatoryGroup.nama"
                      :id="signatoryGroup.nama.placeholderKey"
                      v-model="formData[signatoryGroup.nama.placeholderKey]"
                      :placeholder="signatoryGroup.nama.label"
                      :required="signatoryGroup.nama.isRequired"
                      class="signatory-input"
                      rows="2"
                    ></textarea>
                  </div>
                  
                  <!-- Jabatan -->
                  <div class="signatory-cell">
                    <textarea
                      v-if="signatoryGroup.jabatan"
                      :id="signatoryGroup.jabatan.placeholderKey"
                      v-model="formData[signatoryGroup.jabatan.placeholderKey]"
                      :placeholder="signatoryGroup.jabatan.label"
                      :required="signatoryGroup.jabatan.isRequired"
                      class="signatory-input"
                      rows="2"
                    ></textarea>
                  </div>
                  
                  <!-- Perusahaan -->
                  <div class="signatory-cell">
                    <select 
                      v-if="signatoryGroup.perusahaan"
                      :id="signatoryGroup.perusahaan.placeholderKey"
                      v-model="formData[signatoryGroup.perusahaan.placeholderKey]"
                      :required="signatoryGroup.perusahaan.isRequired"
                      class="signatory-select"
                    >
                      <option value="">Pilih Perusahaan</option>
                      <option value="PT PLN Indonesia Comnets Plus<br>(Icon Plus)">PT PLN Indonesia Comnets Plus (Icon Plus)</option>
                      <option value="PT PLN Persero">PT PLN Persero</option>
                    </select>
                  </div>
                  
                  <!-- NIP - Tampil kondisional -->
                  <div v-if="hasNipColumn" class="signatory-cell">
                    <input
                      v-if="signatoryGroup.nip"
                      type="text"
                      :id="signatoryGroup.nip.placeholderKey"
                      v-model="formData[signatoryGroup.nip.placeholderKey]"
                      :placeholder="signatoryGroup.nip.label"
                      :required="signatoryGroup.nip.isRequired"
                      class="signatory-input"
                    />
                  </div>
                  
                  <!-- Alamat - Tampil kondisional -->
                  <div v-if="hasAlamatColumn" class="signatory-cell">
                    <textarea
                      v-if="signatoryGroup.alamat"
                      :id="signatoryGroup.alamat.placeholderKey"
                      v-model="formData[signatoryGroup.alamat.placeholderKey]"
                      :placeholder="signatoryGroup.alamat.label"
                      :required="signatoryGroup.alamat.isRequired"
                      class="signatory-input"
                      rows="2"
                    ></textarea>
                  </div>
                  
                  <!-- Penandatangan -->
                  <div class="signatory-cell">
                    <input 
                      type="text"
                      :value="signatoryKey"
                      readonly
                      class="signatory-input readonly"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Other Groups -->
            <div v-else class="form-grid">
              <div v-for="field in group" :key="field.placeholderKey" class="form-group">
                <label :for="field.placeholderKey" class="form-label">
                  {{ field.label }}
                  <span v-if="field.isRequired" class="required-asterisk">*</span>
                </label>
                
                <!-- SELECT -->
                <div v-if="isSelectField(field)" class="select-wrapper">
                  <select 
                    :id="field.placeholderKey"
                    v-model="formData[field.placeholderKey]"
                    :required="field.isRequired"
                    class="form-select"
                  >
                    <option disabled value="">-- Pilih {{ field.label }} --</option>
                    <option 
                      v-for="option in getSelectOptions(field)" 
                      :key="option.value" 
                      :value="option.value"
                    >
                      {{ option.label }}
                    </option>
                  </select>
                  <div class="select-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <polyline points="6,9 12,15 18,9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                </div>
                
                <!-- TEXT -->
                <input 
                  v-else-if="field.dataType === 'TEXT'" 
                  type="text"
                  :id="field.placeholderKey"
                  v-model="formData[field.placeholderKey]"
                  :required="field.isRequired"
                  class="form-input"
                />
                
                <!-- TEXTAREA -->
                <textarea
                  v-else-if="field.dataType === 'TEXTAREA'"
                  :id="field.placeholderKey"
                  v-model="formData[field.placeholderKey]"
                  :required="field.isRequired"
                  rows="3"
                  class="form-textarea"
                ></textarea>

                <!-- DATE -->
                <div v-else-if="field.dataType === 'DATE'" class="date-wrapper">
                  <VueDatePicker 
                    v-model="formData[field.placeholderKey]"
                    :required="field.isRequired"
                    format="yyyy-MM-dd"
                    :enable-time-picker="false"
                    auto-apply
                    placeholder="Pilih tanggal"
                  />
                </div>

                <!-- RICH_TEXT -->
                <div v-else-if="field.dataType === 'RICH_TEXT'" class="rich-text-wrapper">
                  <QuillEditor
                    theme="snow"
                    contentType="html"
                    toolbar="essential"
                    v-model:content="formData[field.placeholderKey]"
                    style="min-height: 150px;"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Error Message -->
        <div v-if="error" class="error-message">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2"/>
            <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2"/>
          </svg>
          {{ error }}
        </div>
        
        <!-- Generate Button -->
        <button type="submit" :disabled="isGenerating" class="generate-button">
          <div class="button-content">
            <div v-if="isGenerating" class="button-spinner"></div>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <polyline points="7,10 12,15 17,10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>{{ isGenerating ? 'Membuat Dokumen...' : 'Generate Dokumen' }}</span>
          </div>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* === GLOBAL STYLES === */
* {
  box-sizing: border-box;
}

/* === PAGE LAYOUT === */
.page-wrapper {
  min-height: calc(100vh - 70px);
  padding: 2rem 0;
  background: transparent; /* Inherit from App.vue background */
  font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.generator-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* === HEADER SECTION === */
.page-header {
  margin-bottom: 2.5rem;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 63, 136, 0.1);
  position: relative;
  overflow: hidden;
}

.header-content::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, transparent 70%);
  animation: rotate 20s linear infinite;
}

@keyframes rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #003f88 0%, #0056b3 100%);
  border-radius: 16px;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 8px 24px rgba(0, 63, 136, 0.3);
  position: relative;
  z-index: 1;
}

.header-text {
  flex: 1;
  position: relative;
  z-index: 1;
}

.header-text h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
  font-weight: 700;
  color: #003f88;
  letter-spacing: -0.5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-subtitle {
  margin: 0;
  font-size: 1.1rem;
  color: #6c757d;
  line-height: 1.5;
}

/* === CONTENT SECTIONS === */
.step-container, 
.dynamic-form {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 63, 136, 0.1);
  padding: 2.5rem;
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;
}

.step-container::before, 
.dynamic-form::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #003f88 0%, #0056b3 50%, #ffd700 100%);
}

.step-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #003f88 0%, #0056b3 100%);
  color: white;
  border-radius: 50%;
  font-weight: 700;
  font-size: 1.1rem;
  box-shadow: 0 4px 12px rgba(0, 63, 136, 0.3);
}

.step-header h2 {
  color: #003f88;
  font-weight: 600;
  margin: 0;
  font-size: 1.5rem;
}

/* === TEMPLATE SELECTION === */
.template-selection {
  position: relative;
}

.template-select {
  width: 100%;
  padding: 1rem 3rem 1rem 1.5rem;
  font-size: 1.1rem;
  border: 2px solid rgba(0, 63, 136, 0.1);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  color: #333;
  font-weight: 500;
  transition: all 0.3s ease;
  appearance: none;
  cursor: pointer;
}

.template-select:focus {
  border-color: #0056b3;
  box-shadow: 0 0 0 4px rgba(0, 86, 179, 0.1);
  outline: none;
}

.template-select:hover {
  border-color: #0056b3;
  background: white;
}

.select-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  pointer-events: none;
}

/* === LOADING STATE === */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 63, 136, 0.1);
  margin-bottom: 2rem;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(0, 63, 136, 0.1);
  border-top: 4px solid #0056b3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-state p {
  color: #6c757d;
  font-weight: 500;
  margin: 0;
  font-size: 1rem;
}

/* === FORM SECTIONS === */
.form-section {
  margin-bottom: 3rem;
}

.group-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #003f88;
  font-weight: 600;
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid rgba(0, 63, 136, 0.1);
  position: relative;
}

.group-title::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, #ffd700 0%, #ffb300 100%);
  border-radius: 1px;
}

.group-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #ffd700 0%, #ffb300 100%);
  border-radius: 8px;
  color: #003f88;
}

/* === FORM GRID === */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

/* === FORM INPUTS === */
.form-label {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.required-asterisk {
  color: #dc3545;
  margin-left: 0.25rem;
}

.form-input,
.form-textarea,
.form-select {
  padding: 0.875rem 1rem;
  border: 2px solid rgba(0, 63, 136, 0.1);
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 400;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  color: #333;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  border-color: #0056b3;
  box-shadow: 0 0 0 4px rgba(0, 86, 179, 0.1);
  outline: none;
  background: white;
}

.form-input:hover,
.form-textarea:hover,
.form-select:hover {
  border-color: #0056b3;
  background: white;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.select-wrapper {
  position: relative;
}

.select-wrapper .form-select {
  appearance: none;
  padding-right: 3rem;
  cursor: pointer;
}

.select-wrapper .select-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  pointer-events: none;
}

/* === DATE PICKER STYLES === */
.date-wrapper :deep(.dp__input) {
  padding: 0.875rem 1rem !important;
  border: 2px solid rgba(0, 63, 136, 0.1) !important;
  border-radius: 8px !important;
  font-size: 1rem !important;
  transition: all 0.3s ease !important;
  background: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(10px) !important;
}

.date-wrapper :deep(.dp__input:focus) {
  border-color: #0056b3 !important;
  box-shadow: 0 0 0 4px rgba(0, 86, 179, 0.1) !important;
  background: white !important;
}

/* === RICH TEXT EDITOR STYLES === */
.rich-text-wrapper :deep(.ql-toolbar.ql-snow) {
  border: 2px solid rgba(0, 63, 136, 0.1);
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
}

.rich-text-wrapper :deep(.ql-container.ql-snow) {
  border: 2px solid rgba(0, 63, 136, 0.1);
  border-top: none;
  border-radius: 0 0 8px 8px;
  min-height: 150px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
}

.rich-text-wrapper :deep(.ql-editor) {
  font-size: 1rem;
  line-height: 1.5;
}

/* === SIGNATORY TABLE === */
.signatory-section {
  margin-top: 1rem;
}

.signatory-table {
  border: 2px solid rgba(0, 63, 136, 0.1);
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  width: 100%;
  display: grid;
  grid-template-rows: auto;
}

.signatory-headers {
  display: grid;
  grid-template-columns: var(--grid-columns);
  background: linear-gradient(135deg, #003f88 0%, #0056b3 100%);
  color: white;
}

.signatory-row {
  display: grid;
  grid-template-columns: var(--grid-columns);
  border-bottom: 1px solid rgba(0, 63, 136, 0.1);
  transition: background-color 0.2s ease;
  min-height: 80px;
}

.signatory-row:hover {
  background-color: rgba(0, 86, 179, 0.05);
}

.signatory-row:last-child {
  border-bottom: none;
}

.mengetahui-row {
  background-color: rgba(248, 249, 250, 0.8);
}

.mengetahui-row:hover {
  background-color: rgba(233, 236, 239, 0.8);
}

.header-item {
  padding: 1.25rem 1rem;
  font-weight: 600;
  text-align: center;
  border-right: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-item:last-child {
  border-right: none;
}

.signatory-cell {
  padding: 1rem;
  border-right: 1px solid rgba(0, 63, 136, 0.1);
  display: flex;
  align-items: center;
  min-height: 80px;
}

.signatory-cell:last-child {
  border-right: none;
}

.signatory-input,
.signatory-select {
  width: 100% !important;
  padding: 0.75rem !important;
  border: 2px solid rgba(0, 63, 136, 0.1) !important;
  border-radius: 6px !important;
  font-size: 0.9rem !important;
  transition: all 0.3s ease !important;
  background: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(10px) !important;
  resize: vertical !important;
  min-height: 40px !important;
}

.signatory-input:focus,
.signatory-select:focus {
  border-color: #0056b3 !important;
  box-shadow: 0 0 0 2px rgba(0, 86, 179, 0.1) !important;
  outline: none !important;
  background: white !important;
}

.signatory-input.readonly {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
  color: #495057 !important;
  text-align: center !important;
  font-weight: 600 !important;
  text-transform: capitalize !important;
}

/* === ERROR MESSAGE === */
.error-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #dc3545;
  background: linear-gradient(135deg, rgba(248, 215, 218, 0.8) 0%, rgba(241, 174, 181, 0.8) 100%);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(245, 198, 203, 0.5);
  padding: 1rem 1.25rem;
  border-radius: 12px;
  margin: 2rem 0;
  font-weight: 500;
}

/* === GENERATE BUTTON === */
.generate-button {
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  background: linear-gradient(135deg, #ffd700 0%, #ffb300 100%);
  color: #003f88;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 2rem;
  box-shadow: 0 8px 20px rgba(255, 179, 0, 0.3);
  position: relative;
  overflow: hidden;
}

.generate-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.generate-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 25px rgba(255, 179, 0, 0.4);
}

.generate-button:hover:not(:disabled)::before {
  left: 100%;
}

.generate-button:active:not(:disabled) {
  transform: translateY(0);
}

.generate-button:disabled {
  background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
  color: #6c757d;
  cursor: not-allowed;
  box-shadow: none;
}

.button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  position: relative;
  z-index: 1;
}

.button-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #6c757d;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* === RESPONSIVE DESIGN === */
@media (max-width: 1024px) {
  .generator-container {
    padding: 0 1.5rem;
  }

  .header-content {
    padding: 1.5rem;
  }

  .header-text h1 {
    font-size: 2rem;
  }

  .header-text p {
    font-size: 1rem;
  }

  .step-container,
  .dynamic-form {
    padding: 2rem;
  }
}

@media (max-width: 768px) {
  .page-wrapper {
    padding: 1rem 0;
  }

  .generator-container {
    padding: 0 1rem;
  }

  .header-content {
    flex-direction: column;
    text-align: center;
    padding: 1.5rem;
    gap: 1rem;
  }

  .header-icon {
    width: 56px;
    height: 56px;
  }

  .header-text h1 {
    font-size: 1.75rem;
  }

  .header-subtitle {
    font-size: 1rem;
  }

  .step-container,
  .dynamic-form {
    padding: 1.5rem;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  /* MOBILE TABLE - Stack vertically */
  .signatory-headers {
    display: none;
  }

  .signatory-table {
    display: block;
  }

  .signatory-row {
    display: block;
    border: 1px solid rgba(0, 63, 136, 0.1);
    border-radius: 8px;
    margin-bottom: 1rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .signatory-cell {
    display: block;
    border: none;
    padding: 0.75rem 0;
    min-height: auto;
    position: relative;
  }

  .signatory-cell::before {
    content: '';
    display: block;
    font-weight: 600;
    color: #003f88;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
  }

  .signatory-cell:nth-child(1)::before {
    content: "Nama Lengkap:";
  }

  .signatory-cell:nth-child(2)::before {
    content: "Jabatan:";
  }

  .signatory-cell:nth-child(3)::before {
    content: "Perusahaan:";
  }

  .signatory-cell:nth-child(4)::before {
    content: "NIP:";
  }

  .signatory-cell:nth-child(5)::before {
    content: "Alamat:";
  }

  .signatory-cell:last-child::before {
    content: "Penandatangan:";
  }

  .signatory-input,
  .signatory-select {
    font-size: 1rem !important;
    padding: 0.75rem !important;
  }
}

@media (max-width: 640px) {
  .page-header {
    margin-bottom: 1.5rem;
  }

  .header-content {
    padding: 1rem;
  }

  .header-icon {
    width: 48px;
    height: 48px;
  }

  .header-text h1 {
    font-size: 1.5rem;
  }

  .header-subtitle {
    font-size: 0.875rem;
  }

  .step-container,
  .dynamic-form {
    padding: 1rem;
  }

  .loading-state {
    padding: 3rem 1.5rem;
  }
}

@media (max-width: 480px) {
  .generator-container {
    padding: 0 0.75rem;
  }

  .header-text h1 {
    font-size: 1.25rem;
  }

  .step-header h2 {
    font-size: 1.25rem;
  }

  .generate-button {
    padding: 1rem 1.5rem;
    font-size: 1rem;
  }
}
</style>