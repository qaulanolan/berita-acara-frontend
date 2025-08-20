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
  <div class="generator-container">
    <h1>Generator Berita Acara</h1>
    
    <div class="step-container">
      <h2>Langkah 1: Pilih Template</h2>
      <select v-model="selectedTemplateId" @change="fetchFormStructure" class="template-select">
        <option disabled value="">Pilih salah satu template...</option>
        <option v-for="template in templates" :key="template.id" :value="template.id">
          {{ template.templateName }}
        </option>
      </select>
    </div>

    <div v-if="isLoadingForm" class="loading-state">
      <p>Memuat form...</p>
    </div>

    <form v-if="formStructure.length > 0 && !isLoadingForm" @submit.prevent="generateDocument" class="dynamic-form">
      <h2>Langkah 2: Isi Data</h2>
      <!-- === GANTI BAGIAN INI DENGAN V-FOR GANDA === -->
      <!-- =============================================== -->
      <div v-for="(group, groupName) in groupedForm" :key="groupName" class="form-section">
        <div v-if="group.length > 0">
          <h3 class="group-title">{{ groupName }}</h3>
          <div v-for="field in group" :key="field.placeholderKey" class="form-group">
            <label :for="field.placeholderKey">{{ field.label }}</label>
            
            <!-- TEXT -->
            <input 
              v-if="field.dataType === 'TEXT'" 
              type="text"
              :id="field.placeholderKey"
              v-model="formData[field.placeholderKey]"
              :required="field.isRequired"
            />
            
            <!-- TEXTAREA -->
            <textarea
              v-if="field.dataType === 'TEXTAREA'"
              :id="field.placeholderKey"
              v-model="formData[field.placeholderKey]"
              :required="field.isRequired"
              rows="3"
            ></textarea>

            <!-- DATE -->
            <VueDatePicker 
              v-if="field.dataType === 'DATE'" 
              v-model="formData[field.placeholderKey]"
              :required="field.isRequired"
              format="yyyy-MM-dd"
              :enable-time-picker="false"
              auto-apply
              placeholder="Pilih tanggal"
            />

            <!-- RICH_TEXT -->
            <QuillEditor
              v-if="field.dataType === 'RICH_TEXT'"
              theme="snow"
              contentType="html"
              toolbar="essential"
              v-model:content="formData[field.placeholderKey]"
              style="min-height: 150px;"
            />
          </div>
        </div>
      </div>
      
      <p v-if="error" class="error-message">{{ error }}</p>
      
      <button type="submit" :disabled="isGenerating" class="generate-button">
        {{ isGenerating ? 'Membuat Dokumen...' : 'Generate Dokumen' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.generator-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 1rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 2.5rem;
  font-weight: 300;
  letter-spacing: 1px;
}

.step-container, .dynamic-form {
  background-color: #ffffff;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
  margin-bottom: 2.5rem;
  transition: all 0.3s ease-in-out;
}

h2 {
  color: #007bff;
  font-weight: 500;
  margin-top: 0;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 1rem;
}

.template-select {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 1px solid #ced4da;
  border-radius: 5px;
  background-color: #fff;
  transition: border-color 0.2s;
}

.template-select:focus {
  border-color: #80bdff;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.dynamic-form {
  margin-top: 2.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #495057;
}

/* Common style for input, datepicker, and quill editor wrapper */
.form-group input, 
.form-group textarea,
.form-group :deep(.dp__input),
.form-group :deep(.ql-container) {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #ced4da;
  border-radius: 5px;
  font-size: 1rem;
  transition: border-color 0.2s;
  box-sizing: border-box; /* Ensures padding doesn't affect width */
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: #80bdff;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

/* Specific styles for VueDatePicker */
:deep(.dp__input) {
  padding: 0.75rem 1rem !important; /* Override default padding */
}

/* Specific styles for QuillEditor */
:deep(.ql-toolbar.ql-snow) {
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  border-color: #ced4da;
}
:deep(.ql-container.ql-snow) {
  border-bottom-left-radius: 5px;
  border-bottom-right-radius: 5px;
  min-height: 180px;
  font-size: 1rem;
  border-color: #ced4da;
}
:deep(.ql-container.ql-snow:focus-within) {
  border-color: #80bdff;
}

.generate-button {
  width: 100%;
  padding: 1rem 1.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  background: linear-gradient(90deg, #28a745, #218838);
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  margin-top: 1rem;
}

.generate-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.generate-button:disabled {
  background: #a3d9b1;
  cursor: not-allowed;
}

.loading-state, .error-state {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.error-message { 
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 1rem;
  border-radius: 5px;
  margin-top: 1rem;
}
</style>