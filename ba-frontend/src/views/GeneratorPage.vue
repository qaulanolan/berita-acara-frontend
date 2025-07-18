<script setup>
import { ref, nextTick, watch } from 'vue';
import axios from 'axios';
import { renderAsync } from 'docx-preview';
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import DatePicker from 'vue-datepicker-next';
import 'vue-datepicker-next/index.css';

const step = ref(1);
const nextStep = () => { if (step.value < 4) step.value++ };
const prevStep = () => { if (step.value > 1) step.value-- };

const formData = ref({
  jenisBeritaAcara: 'UAT',
  tipeRequest: 'Change Request',
  namaAplikasiSpesifik: 'APLIKASI PELAYANAN PELANGGAN TERPUSAT (AP2T)',
  judulPekerjaan: 'Change Request Batas Maksimum Token Perdana di AP2T',
  tahap: '',
  nomorBA: '4618.BA/STI.01.03/IC010601/2025',
  nomorSuratRequest: '2357/STI.01.02/F01000402/2025',
  nomorBaUat: '',
  tanggalBA: '2024-12-30',
  tanggalSuratRequest: '2025-01-14',
  tanggalPengerjaan: '2024-12-28',
  fiturList: [
    { deskripsi: '<p>Perubahan besaran token perdana untuk <strong>seluruh transaksi</strong> di AP2T.</p>', status: 'OK', catatan: 'Fitur sudah sesuai.' }
  ],
  signatoryList: [
    // { nama: 'Hermawan Asmoko', jabatan: 'VP Aplikasi PLN – Korporat dan Pelayanan Pelanggan', perusahaan: 'PT Indonesia Comnets Plus', tipe: 'utama1' },
    // { nama: 'Mumahmmad Nurul Hadi', jabatan: 'VP Pengelolaan Data dan Sistem Informasi Pelanggan', perusahaan: 'PT PLN (Persero)', tipe: 'utama2' },
    // { nama: 'Irvan Kristianto', jabatan: 'VP Aplikasi Distribusi dan Pelayanan Pelanggan', perusahaan: 'PT PLN (Persero)', tipe: 'mengetahui' }
  ]
});

const isLoading = ref(false);
const fileBlob = ref(null);
const isPreviewVisible = ref(false);
const docxContainer = ref(null);
const newHistoryId = ref(null); // State baru untuk menyimpan ID
const signatoryCount= ref(2); // Jumlah penandatangan default

async function generateFile() {
  isLoading.value = true;
  isPreviewVisible.value = false;
  fileBlob.value = null;
  newHistoryId.value = null;
  if (docxContainer.value) docxContainer.value.innerHTML = '';

  try {
    const response = await axios.post('http://localhost:8080/berita-acara/generate-docx', formData.value, {
      responseType: 'blob'
    });
    fileBlob.value = response.data;
    newHistoryId.value = response.headers['x-history-id'];
    step.value = 4;
  } catch (error) {
    console.error('Gagal men-generate DOCX:', error);
    alert('Terjadi kesalahan. Cek console log untuk detail.');
  } finally {
    isLoading.value = false;
  }
}

async function previewFile() {
  isPreviewVisible.value = !isPreviewVisible.value;
  if (isPreviewVisible.value && fileBlob.value) {
    await nextTick();
    if (docxContainer.value) {
      docxContainer.value.innerHTML = '';
      await renderAsync(fileBlob.value, docxContainer.value);
    }
  }
}

function downloadFile() {
  if (!fileBlob.value) return;
  const url = window.URL.createObjectURL(fileBlob.value);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `BA-${formData.value.judulPekerjaan}.docx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// 3. Logika 'watch' untuk menyesuaikan signatoryList secara otomatis
watch(signatoryCount, (newCount) => {
  const currentSignatories = formData.value.signatoryList;
  const newSignatories = [];
  
  // Isi penandatangan utama
  for (let i = 0; i < newCount; i++) {
    // Ambil data lama jika ada, atau buat objek baru
    const existing = currentSignatories.find(s => s.tipe === `utama${i + 1}`);
    newSignatories.push(existing || {
      nama: '',
      jabatan: '',
      perusahaan: 'PT PLN (Persero)',
      tipe: `utama${i + 1}`
    });
  }

  if (formData.value.jenisBeritaAcara === 'UAT') {
    // Tambahkan kembali penandatangan 'mengetahui' jika ada
    const mengetahui = currentSignatories.find(s => s.tipe === 'mengetahui');
    newSignatories.push(mengetahui || {
      nama: '',
      jabatan: '',
      perusahaan: 'PT PLN (Persero)',
      tipe: 'mengetahui'
    });
  }
  

  formData.value.signatoryList = newSignatories;
}, { immediate: true }); // 'immediate: true' agar dijalankan saat komponen pertama kali dimuat

</script>


<template>
  <div class="app-container">
    <header class="app-header">
      <h1>📄 Generator Berita Acara</h1>
    </header>

    <main class="main-content">
      <!-- STEP 1: Informasi Umum -->
      <div v-if="step === 1" class="section-card">
        <h2 class="section-header">Informasi Umum</h2>
        <div class="form-group">
          <label>Jenis Berita Acara</label>
          <select v-model="formData.jenisBeritaAcara" class="form-select">
            <option>UAT</option>
            <option>Deployment</option>
          </select>
        </div>
        <div class="form-group">
          <label>Tipe Request</label>
          <select v-model="formData.tipeRequest" class="form-select">
            <option>Change Request</option>
            <option>Job Request</option>
          </select>
        </div>
        <div class="form-group">
          <label>Judul Pekerjaan</label>
          <input type="text" v-model="formData.judulPekerjaan" class="form-input" />
        </div>
        <div class="form-group">
          <label>Nama Aplikasi Spesifik</label>
          <input type="text" v-model="formData.namaAplikasiSpesifik" class="form-input" />
        </div>
        <div class="form-group">
          <label>Tahap (Opsional)</label>
          <input type="text" v-model="formData.tahap" class="form-input" />
        </div>
      </div>

      <!-- STEP 2: Nomor & Tanggal + Deskripsi -->
      <div v-if="step === 2">
        <div class="section-card">
          <h2 class="section-header">Nomor & Tanggal</h2>
          <div class="form-group">
            <label>Nomor Berita Acara</label>
            <input type="text" v-model="formData.nomorBA" class="form-input" />
          </div>
          <div class="form-group">
            <label>Nomor Surat Request</label>
            <input type="text" v-model="formData.nomorSuratRequest" class="form-input" />
          </div>
          <div class="form-group">
            <label>Tanggal Surat Request</label>
            <input type="date" v-model="formData.tanggalSuratRequest" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Tahap</label>
            <select v-model="formData.tahap" class="form-select">
                <option value="">Tidak Ada Tahap</option>
                <option value="Tahap I">Tahap I</option>
                <option value="Tahap II">Tahap II</option>
                <option value="Tahap III">Tahap III</option>
                <option value="Tahap IV">Tahap IV</option>
            </select>
            <!-- <input type="text" v-model="formData.tahap" placeholder="e.g., tahap I" class="form-input"> -->
          </div>
          <div class="form-group">
            <label>Tanggal Pengerjaan/Pengujian</label>
            <input type="date" v-model="formData.tanggalPengerjaan" class="form-input" />
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Nomor Berita Acara</label>
              <input type="text" v-model="formData.nomorBA" required class="form-input">
            </div>
            <div class="form-group">
              <label class="form-label">Tanggal Berita Acara</label>
              <date-picker 
                v-model:value="formData.tanggalBA" 
                format="DD-MM-YYYY" 
                value-type="format"
              ></date-picker>
            </div>
            <div class="form-group">
              <label class="form-label">Tanggal Surat Request</label>
              <date-picker 
                v-model:value="formData.tanggalSuratRequest" 
                format="DD-MM-YYYY" 
                value-type="format"
              ></date-picker>
            </div>
            <div class="form-group">
              <label class="form-label">Nomor Surat Request</label>
              <input type="text" v-model="formData.nomorSuratRequest" required class="form-input">
            </div>
            <div class="form-group">
              <label class="form-label">Tanggal Pengerjaan/Pengujian</label>
              <!-- <input type="date" v-model="formData.tanggalPengerjaan" required class="form-input"> -->
              <date-picker 
                v-model:value="formData.tanggalPengerjaan" 
                format="DD-MM-YYYY" 
                value-type="format"
              ></date-picker>
            </div>
            <div v-if="formData.jenisBeritaAcara === 'Deployment'" class="form-group">
              <label class="form-label">Nomor BA UAT</label>
              <input type="text" v-model="formData.nomorBaUat" required class="form-input">
            </div>
          </div>
        </div>

        <div v-if="formData.jenisBeritaAcara === 'UAT'" class="section-card">
          <h2 class="section-header">Deskripsi Fitur</h2>
          <div v-for="(fitur, index) in formData.fiturList" :key="index">
            <label>Deskripsi Kegiatan</label>
            <QuillEditor v-model:content="fitur.deskripsi" contentType="html" theme="snow" />
            <div class="form-group">
              <label>Status</label>
              <select v-model="fitur.status" class="form-select">
                <option>OK</option>
                <option>Ditolak</option>
                <option>Perbaikan</option>
              </select>
            </div>
            <div class="form-group">
              <label>Catatan</label>
              <input type="text" v-model="fitur.catatan" class="form-input" />
            </div>
          </div>
        </div>
      </div>

        <!-- Daftar Penandatangan -->
        <div v-if="formData.jenisBeritaAcara === 'Deployment'" class="section-card">
          <div class="section-header">
            <h2>Daftar Penandatangan</h2>
          </div>

          <!-- Data -->
          <div v-for="(p, index) in formData.signatoryList" :key="index" class="signer-grid mb-3">
            <input type="text" v-model="p.nama" class="form-input" placeholder="Nama Lengkap" />
            <input type="text" v-model="p.jabatan" class="form-input" placeholder="Jabatan" />
            <input type="text" v-model="p.perusahaan" class="form-input" placeholder="Perusahaan" />
            <input type="text" v-model="p.tipe" class="form-input readonly" readonly />
          </div>
        </div>

        <div v-if="formData.jenisBeritaAcara === 'UAT'" class="section-card">
          <!-- <fieldset> -->
            <div class="section-header">
              <h2>Daftar Penandatangan</h2>
            </div>
            
            <div class="signer-count-selector">
              <label for="signer-count" class="form-label">Jumlah Penandatangan Utama:</label>
              <select class="form-select" v-model.number="signatoryCount">
                <option value="2">default</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
            </div>
  
            <div class="signer-grid">
              <div class="signer-header">
                <span>Nama Lengkap</span>
                <span>Jabatan</span>
                <span>Perusahaan</span>
                <span>Tipe</span>
              </div>
              <div v-for="(p, index) in formData.signatoryList" :key="index" class="signer-row">
                <input type="text" v-model="p.nama" placeholder="Nama Lengkap" required class="form-input">
                <!-- <div class="editor-wrapper">
                  <QuillEditor 
                    v-model:content="fitur.deskripsi" 
                    contentType="html" 
                    theme="snow"
                    toolbar="essential"
                  />
                </div> -->
                <input type="text" v-model="p.jabatan" placeholder="Jabatan" class="form-input">
                <input type="text" v-model="p.perusahaan" placeholder="Perusahaan" class="form-input">
                <input type="text" :value="p.tipe" readonly class="form-input readonly">
              </div>
            </div>
          <!-- </fieldset> -->
        </div>
        
        <!-- Generate Button -->
        <div class="action-section">
          <button @click="generateFile" :disabled="isLoading" class="btn-primary">
            <span v-if="isLoading" class="loading-spinner"></span>
            {{ isLoading ? 'Generating...' : 'Generate File' }}
          </button>
        </div>
      </form>
      
      <!-- Action Buttons -->
      <div v-if="fileBlob" class="action-buttons">
        <button @click="downloadFile" class="btn-success">
          📥 Download .docx
        </button>
        <button @click="previewFile" class="btn-secondary">
          {{ isPreviewVisible ? '👁️ Sembunyikan Preview' : '👁️ Tampilkan Preview' }}
        </button>
      </div>

      <!-- STEP 4: Preview -->
      <div v-if="step === 4">
        <div v-if="fileBlob" class="action-buttons">
          <button @click="downloadFile" class="btn-success">📥 Download .docx</button>
          <button @click="previewFile" class="btn-secondary">
            {{ isPreviewVisible ? '👁️ Sembunyikan Preview' : '👁️ Tampilkan Preview' }}
          </button>
        </div>
        <div v-if="isPreviewVisible" class="preview-section">
          <h2 class="section-header-preview">👀 Preview Dokumen</h2>
          <div class="preview-container">
            <div ref="docxContainer" class="docx-content"></div>
          </div>
        </div>
      </div>

      <!-- Navigasi -->
      <div class="flex justify-center space-x-4 mt-8">
        <button @click="prevStep" :disabled="step === 1" class="btn-secondary">← Kembali</button>
        <button @click="nextStep" :disabled="step === 4" class="btn-success">Lanjut →</button>
      </div>
    </main>
  </div>
</template>


<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.signer-grid {
  display: grid;
  grid-template-columns: 2fr 3fr 2.5fr 1.5fr;
  gap: 10px;
  align-items: center;
}

html, body {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
}

.app-container {
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(#276184 100%);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  padding: 20px;
  position: relative;
}

.app-header {
  text-align: center;
  color: white;
  margin-bottom: 30px;
}

.app-header h1 {
  font-size: 2.5rem;
  margin: 0;
  font-weight: 700;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.main-content {
  max-width: 1000px;
  margin: 0 auto;
  width: 100%;
}

.section-card {
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  margin-bottom: 20px;
}

.section-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 35px rgba(0,0,0,0.15);
}

.section-header {
  margin-bottom: 20px;
  border-bottom: 3px solid #00AEEF;
  padding-bottom: 10px;
  color: #276184;
  font-size: 1.4rem;
  font-weight: 600;
}

.section-header-preview h2 {
  color: white;
  font-size: 1.4rem;
  margin: 0;
  font-weight: 600;
}

.form-group {
  margin-bottom: 15px;
}

.form-input, .form-select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: .85rem;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  background: white;
}

.form-input:focus, .form-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.action-section {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

.btn-primary {
  background: #fff200;
  color: #276184;
  border: none;
  padding: 15px 40px;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #ffffff;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 25px;
}

.btn-success {
  background: linear-gradient(45deg, #28a745, #20c997);
  color: white;
  border: none;
  padding: 12px 25px;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.4);
}

.btn-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(40, 167, 69, 0.6);
}

.btn-secondary {
  background: linear-gradient(45deg, #6c757d, #495057);
  color: white;
  border: none;
  padding: 12px 25px;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(108, 117, 125, 0.4);
}

.btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(108, 117, 125, 0.6);
}

.preview-section {
  margin-top: 30px;
}

.preview-container {
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
}

.docx-content {
  background: #f8f9fa;
  padding: 30px;
  border-radius: 10px;
  min-height: 500px;
  border: 1px solid #e9ecef;
}

.ql-container {
  min-height: 120px;
  font-size: 1rem;
  border-radius: 0 0 8px 8px;
}

.ql-toolbar {
  border-radius: 8px 8px 0 0;
}

.ql-editor {
  color: #333 !important;
  background-color: #fff !important;
}

.ql-editor p, .ql-editor strong, .ql-editor * {
  color: #333 !important;
}

.ql-indent-0 { padding-left: 0; }
.ql-indent-1 { padding-left: 2rem; }
.ql-indent-2 { padding-left: 1rem; }
.ql-indent-3 { padding-left: 5rem; }

.ql-toolbar.ql-snow {
  border: 2px solid #e1e5e9;
  border-bottom: 1px solid #e1e5e9;
  background-color: #f8f9fa;
}

.ql-container.ql-snow {
  border: 2px solid #e1e5e9;
  border-top: none;
  background-color: white;
}

.ql-editor.ql-blank::before {
  color: #999 !important;
  font-style: italic;
}

@media (max-width: 768px) {
  .app-container { padding: 15px; }
  .app-header h1 { font-size: 2rem; }
  .form-grid { grid-template-columns: 1fr; }
  .action-buttons { flex-direction: column; align-items: center; }
  .btn-primary, .btn-success, .btn-secondary {
    width: 100%;
    max-width: 300px;
  }
}

@media (max-width: 480px) {
  .app-container { padding: 10px; }
  .section-card { padding: 20px; }
}
</style>
