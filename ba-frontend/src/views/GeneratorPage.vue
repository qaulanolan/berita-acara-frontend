<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';

// --- STATE ---
const router = useRouter();
const templates = ref([]);
const selectedTemplateId = ref('');
const formStructure = ref([]);
const formData = ref({});
const isLoadingForm = ref(false);
const isGenerating = ref(false);
const error = ref(null);

// --- OPSI UNTUK SELECT ---
const tahapOptions = ref([
  { value: '', label: 'Tidak Ada Tahap' },
  { value: 'Tahap I', label: 'Tahap I' },
  { value: 'Tahap II', label: 'Tahap II' },
  { value: 'Tahap Final', label: 'Tahap Final' }
]);
const jenisRequestOptions = ref([
  { value: 'PENGEMBANGAN', label: 'Job Request' },
  { value: 'PERUBAHAN', label: 'Change Request' }
]);
const perusahaanOptions = ref([
    { value: 'PT PLN Indonesia Comnets Plus (Icon Plus)', label: 'PT PLN Indonesia Comnets Plus (Icon Plus)' },
    { value: 'PT PLN Persero', label: 'PT PLN Persero'}
]);

// ======================================================================
// === COMPUTED PROPERTY UTAMA UNTUK MENGELOMPOKKAN SEMUA DATA FORM ===
// ======================================================================
const groupedForm = computed(() => {
  const groups = {
    'Informasi Umum': [],
    'Nomor & Tanggal': [],
    'Deskripsi Fitur': [],
    'Penandatangan': [], // Akan diisi dengan array baris signatory
    'Lainnya': [],
  };
  
  if (!formStructure.value || formStructure.value.length === 0) {
    return groups;
  }

  const signatoriesTemp = {}; // Objek sementara untuk mengumpulkan signatory

  // Loop 1: Pisahkan field ke dalam grup masing-masing
  formStructure.value.forEach(field => {
    const key = field.placeholderKey;

    if (key.includes('signatory.')) {
      const match = key.match(/signatory\.(.*?)\.(nama|jabatan|perusahaan|nip|alamat)/);
      if (match && match[1] && match[2]) {
        const type = match[1]; // e.g., "penandatangan1"
        const prop = match[2]; // e.g., "nama"
        if (!signatoriesTemp[type]) {
          signatoriesTemp[type] = { type: type, nama: null, jabatan: null, perusahaan: null, nip: null, alamat: null }; // Inisialisasi baris
        }
        signatoriesTemp[type][prop] = field; // Tambahkan field ke baris
      } else {
        groups['Lainnya'].push(field);
      }
    } else if (key.includes('jenis_request') || key.includes('aplikasi') || key.includes('judul_pekerjaan') || key.includes('tahap')) {
      groups['Informasi Umum'].push(field);
    } else if (key.includes('nomor_') || key.includes('tanggal_')) {
      groups['Nomor & Tanggal'].push(field);
    } else if (key.includes('fitur.')) {
      groups['Deskripsi Fitur'].push(field);
    } else {
      groups['Lainnya'].push(field);
    }
  });

  // Loop 2: Ubah objek signatory sementara menjadi array baris yang siap di-render
  groups.Penandatangan = Object.values(signatoriesTemp).sort((a, b) => {
    // Urutan kustom: 'mengetahui' selalu di akhir
    if (a.type.includes('mengetahui')) return 1;
    if (b.type.includes('mengetahui')) return -1;
    return a.type.localeCompare(b.type);
  });

  return groups;
});


// === COMPUTED LAINNYA YANG BERGANTUNG PADA formStructure ===
const hasNipColumn = computed(() => {
  return formStructure.value.some(field => field.placeholderKey.includes('.nip'));
});
const hasAlamatColumn = computed(() => {
  return formStructure.value.some(field => field.placeholderKey.includes('.alamat'));
});
const gridTemplateColumns = computed(() => {
  const columns = ['2fr', '2fr', '2fr']; // Nama, Jabatan, Perusahaan
  if (hasNipColumn.value) columns.push('1.5fr');
  if (hasAlamatColumn.value) columns.push('2fr');
  columns.push('1.5fr'); // Tipe Penandatangan
  return columns.join(' ');
});

// === FUNGSI HELPER YANG DIPERLUKAN OLEH TEMPLATE ===
const isSelectField = (field) => {
  const key = field.placeholderKey.toLowerCase();
  return key.includes('tahap') || key.includes('jenis_request') || key.includes('perusahaan');
};
const getSelectOptions = (field) => {
  const key = field.placeholderKey.toLowerCase();
  if (key.includes('tahap')) return tahapOptions.value;
  if (key.includes('jenis_request')) return jenisRequestOptions.value;
  if (key.includes('perusahaan')) return perusahaanOptions.value;
  return [];
};
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// --- LIFECYCLE & METHODS ---
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
      formData.value[field.placeholderKey] = field.dataType === 'RICH_TEXT' ? '<p></p>' : '';
    });
  } catch (err) {
    error.value = "Gagal memuat form untuk template ini.";
  } finally {
    isLoadingForm.value = false;
  }
};

const generateDocument = async () => {
  isGenerating.value = true;
  error.value = null;
  
  const payload = {
    templateId: Number(selectedTemplateId.value),
    data: formData.value,
  };
  
  try {
    const response = await api.generateDynamicDocument(payload);
    const base64String = await blobToBase64(response.data);
    
    // Simpan file Base64 ke localStorage
    localStorage.setItem('generatedDocx', base64String);
    
    // --- TAMBAHAN: Simpan juga metadata untuk nama file ---
    // Cari template yang dipilih untuk mendapatkan namanya (jenis BA)
    const selectedTemplate = templates.value.find(t => t.id === Number(selectedTemplateId.value));
    const jenisBA = selectedTemplate ? selectedTemplate.templateName : 'BeritaAcara';
    
    // Cari placeholder judul pekerjaan untuk mendapatkan isinya
    const judulKey = formStructure.value.find(f => f.placeholderKey.includes('judul_pekerjaan'))?.placeholderKey;
    const judulBA = judulKey ? formData.value[judulKey] : 'Dokumen';
    
    localStorage.setItem('generatedDocxJenisBA', jenisBA);
    localStorage.setItem('generatedDocxJudulBA', judulBA);
    // --------------------------------------------------------

    const historyId = response.headers['x-history-id'];
    if (historyId) {
      router.push({ name: 'Preview', params: { id: historyId } });
    } else {
      router.push({ name: 'Preview' }); // Ini akan memicu alur localStorage
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
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h1>Generator Berita Acara</h1>
          <p class="header-subtitle">Buat dokumen berita acara dengan mudah dan cepat</p>
        </div>
      </div>
      
      <!-- Langkah 1: Pilih Template -->
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

      <!-- State Loading -->
      <div v-if="isLoadingForm" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Memuat form...</p>
      </div>

      <!-- Langkah 2: Isi Form -->
      <form v-if="formStructure.length > 0 && !isLoadingForm" @submit.prevent="generateDocument" class="dynamic-form">
        <div class="step-header">
          <div class="step-number">2</div>
          <h2>Isi Data</h2>
        </div>
        
        <!-- Loop melalui Grup -->
        <div v-for="(group, groupName) in groupedForm" :key="groupName" class="form-section">
          <div v-if="group.length > 0">
            <h3 class="group-title">{{ groupName }}</h3>
            
            <!-- Render Khusus untuk Penandatangan -->
            <!-- Di dalam form-section Penandatangan -->
            <div v-if="groupName === 'Penandatangan'" class="signatory-section">
              
              <!-- Container Grid Utama -->
              <div class="signatory-table" :style="{ '--grid-template-columns': gridTemplateColumns }">
                
                <!-- Render Header secara dinamis sebagai sel grid pertama -->
                <div class="header-item">Nama Lengkap</div>
                <div class="header-item">Jabatan</div>
                <div class="header-item">Perusahaan</div>
                <div v-if="hasNipColumn" class="header-item">NIP</div>
                <div v-if="hasAlamatColumn" class="header-item">Alamat</div>
                <div class="header-item">Keterangan</div>
                
                <!-- Render setiap baris data menggunakan v-for -->
                <!-- Kita gunakan <template> agar bisa me-looping beberapa elemen sekaligus -->
                <template v-for="row in group" :key="row.type">
                  <div class="signatory-cell" :class="{ 'mengetahui-row': row.type.includes('mengetahui') }">
                    <textarea v-if="row.nama" :id="row.nama.placeholderKey" v-model="formData[row.nama.placeholderKey]" :placeholder="row.nama.label" :required="row.nama.isRequired" rows="2"></textarea>
                  </div>
                  <div class="signatory-cell" :class="{ 'mengetahui-row': row.type.includes('mengetahui') }">
                    <textarea v-if="row.jabatan" :id="row.jabatan.placeholderKey" v-model="formData[row.jabatan.placeholderKey]" :placeholder="row.jabatan.label" :required="row.jabatan.isRequired" rows="2"></textarea>
                  </div>
                  <div class="signatory-cell" :class="{ 'mengetahui-row': row.type.includes('mengetahui') }">
                    <div class="select-wrapper">
                      <select v-if="row.perusahaan" :id="row.perusahaan.placeholderKey" v-model="formData[row.perusahaan.placeholderKey]" :required="row.perusahaan.isRequired">
                        <option v-for="option in getSelectOptions(row.perusahaan)" :key="option.value" :value="option.value">{{ option.label }}</option>
                      </select>
                      <div class="select-icon"><svg width="16" height="16" viewBox="0 0 24 24"><polyline points="6,9 12,15 18,9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
                    </div>
                  </div>
                  <div v-if="hasNipColumn" class="signatory-cell" :class="{ 'mengetahui-row': row.type.includes('mengetahui') }">
                    <input v-if="row.nip" type="text" :id="row.nip.placeholderKey" v-model="formData[row.nip.placeholderKey]" :placeholder="row.nip.label" :required="row.nip.isRequired" />
                  </div>
                  <div v-if="hasAlamatColumn" class="signatory-cell" :class="{ 'mengetahui-row': row.type.includes('mengetahui') }">
                    <textarea v-if="row.alamat" :id="row.alamat.placeholderKey" v-model="formData[row.alamat.placeholderKey]" :placeholder="row.alamat.label" :required="row.alamat.isRequired" rows="2"></textarea>
                  </div>
                  <div class="signatory-cell" :class="{ 'mengetahui-row': row.type.includes('mengetahui') }">
                    <input type="text" :value="row.type" readonly class="readonly-input" />
                  </div>
                </template>
                
              </div>
            </div>
            
            <!-- Render Grup Lainnya -->
            <div v-else class="form-grid">
              <div v-for="field in group" :key="field.placeholderKey" class="form-group">
                <label :for="field.placeholderKey" class="form-label">{{ field.label }}<span v-if="field.isRequired" class="required-asterisk">*</span></label>
                <div v-if="isSelectField(field)" class="select-wrapper">
                  <select :id="field.placeholderKey" v-model="formData[field.placeholderKey]" :required="field.isRequired" class="form-select">
                    <option disabled value="">-- Pilih {{ field.label }} --</option>
                    <option v-for="option in getSelectOptions(field)" :key="option.value" :value="option.value">{{ option.label }}</option>
                  </select>
                  <div class="select-icon"><svg width="16" height="16" viewBox="0 0 24 24"><polyline points="6,9 12,15 18,9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
                </div>
                <input v-else-if="field.dataType === 'TEXT'" type="text" :id="field.placeholderKey" v-model="formData[field.placeholderKey]" :required="field.isRequired" class="form-input" />
                <textarea v-else-if="field.dataType === 'TEXTAREA'" :id="field.placeholderKey" v-model="formData[field.placeholderKey]" :required="field.isRequired" rows="3" class="form-textarea"></textarea>
                <div v-else-if="field.dataType === 'DATE'" class="date-wrapper">
                  <VueDatePicker v-model="formData[field.placeholderKey]" :required="field.isRequired" format="yyyy-MM-dd" :enable-time-picker="false" auto-apply placeholder="Pilih tanggal" />
                </div>
                <div v-else-if="field.dataType === 'RICH_TEXT'" class="rich-text-wrapper">
                  <QuillEditor theme="snow" contentType="html" toolbar="essential" v-model:content="formData[field.placeholderKey]" style="min-height: 150px;" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Pesan Error -->
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <!-- Tombol Generate -->
        <button type="submit" :disabled="isGenerating" class="generate-button">
          <span>{{ isGenerating ? 'Membuat Dokumen...' : 'Generate Dokumen' }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.page-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #e3f2fd 0%, #ffffff 50%, #f8f9fa 100%);
  padding: 2rem 1rem;
  font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.generator-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.header-content {
  background: linear-gradient(135deg, #003f88 0%, #0056b3 100%);
  color: white;
  padding: 3rem 2rem;
  border-radius: 20px;
  box-shadow: 0 15px 35px rgba(0, 63, 136, 0.2);
  position: relative;
  overflow: hidden;
}

/* .header-content::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, transparent 70%);
  animation: rotate 20s linear infinite;
} */

/* @keyframes rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
} */

.header-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: rgba(255, 215, 0, 0.2);
  border-radius: 50%;
  margin-bottom: 1.5rem;
  color: #ffd700;
  position: relative;
  z-index: 1;
}

.header-content h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  position: relative;
  z-index: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0;
  font-weight: 400;
  position: relative;
  z-index: 1;
}

.step-container, .dynamic-form {
  background: white;
  border-radius: 16px;
  padding: 2.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 63, 136, 0.1);
  position: relative;
  overflow: hidden;
}

.step-container::before, .dynamic-form::before {
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

.template-selection {
  position: relative;
}

.template-select {
  width: 100%;
  padding: 1rem 3rem 1rem 1.5rem;
  font-size: 1.1rem;
  border: 2px solid #e1e5e9;
  border-radius: 12px;
  background: white;
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
}

.select-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  pointer-events: none;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e1e5e9;
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
  color: #666;
  font-weight: 500;
  margin: 0;
}

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
  border-bottom: 2px solid #e1e5e9;
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

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

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
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 400;
  transition: all 0.3s ease;
  background: white;
  color: #333;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  border-color: #0056b3;
  box-shadow: 0 0 0 4px rgba(0, 86, 179, 0.1);
  outline: none;
}

.form-input:hover,
.form-textarea:hover,
.form-select:hover {
  border-color: #0056b3;
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

.date-wrapper :deep(.dp__input) {
  /* padding: 0.875rem 1rem !important; */
  border: 2px solid #e1e5e9 !important;
  border-radius: 8px !important;
  font-size: 1rem !important;
  transition: all 0.3s ease !important;
}

.date-wrapper :deep(.dp__input:focus) {
  border-color: #0056b3 !important;
  box-shadow: 0 0 0 4px rgba(0, 86, 179, 0.1) !important;
}

.rich-text-wrapper :deep(.ql-toolbar.ql-snow) {
  border: 2px solid #e1e5e9;
  border-bottom: none;
  border-radius: 8px 8px 0 0;
}

.rich-text-wrapper :deep(.ql-container.ql-snow) {
  border: 2px solid #e1e5e9;
  border-top: none;
  border-radius: 0 0 8px 8px;
  min-height: 150px;
}

.rich-text-wrapper :deep(.ql-editor) {
  font-size: 1rem;
  line-height: 1.5;
}

/* Hapus semua style .signatory-* yang lama dan ganti dengan ini */

.signatory-section {
  margin-top: 1rem;
}

.signatory-table {
  display: grid; /* INI ADALAH CONTAINER UTAMA */
  /* Definisikan kolom grid langsung di sini menggunakan variabel CSS */
  grid-template-columns: var(--grid-template-columns, 2fr 2fr 2fr 1.5fr);
  border: 1px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden; /* Agar sudut border-radius terlihat bagus */
}

.header-item,
.signatory-cell {
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-item {
  background-color: #003f88; /* Warna biru gelap */
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
}

.signatory-cell {
  background-color: #fff;
  border-top: 1px solid #dee2e6;
  /* Atur agar setiap 3 (atau lebih) sel membentuk garis vertikal */
  border-right: 1px solid #dee2e6;
}

/* Hilangkan border kanan pada sel kolom terakhir */
.signatory-cell:last-child {
  border-right: none;
}

/* Style untuk baris "mengetahui" */
.mengetahui-row .signatory-cell {
  background-color: #f8f9fa;
}

/* Style input di dalam sel */
.signatory-cell textarea,
.signatory-cell input,
.signatory-cell select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 5px;
  font-size: 0.9rem;
  box-sizing: border-box; /* Penting! */
  resize: vertical;
}

.signatory-cell input.readonly-input {
  background-color: #e9ecef;
  border: 1px solid transparent;
  text-align: center;
  font-weight: 500;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #dc3545;
  background: linear-gradient(135deg, #f8d7da 0%, #f1aeb5 100%);
  border: 2px solid #f5c6cb;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  margin: 2rem 0;
  font-weight: 500;
}

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
  background: #e9ecef;
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

/* ===== RESPONSIVE DESIGN ===== */
@media (max-width: 768px) {
  .page-wrapper {
    padding: 1rem 0.5rem;
  }

  .header-content {
    padding: 2rem 1.5rem;
  }

  .header-content h1 {
    font-size: 2rem;
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
    border: 1px solid #e1e5e9;
    border-radius: 8px;
    margin-bottom: 1rem;
    padding: 1rem;
    background: white;
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

@media (max-width: 480px) {
  .header-content h1 {
    font-size: 1.75rem;
  }

  .header-subtitle {
    font-size: 1rem;
  }

  .step-container,
  .dynamic-form {
    padding: 1rem;
  }
}
</style>