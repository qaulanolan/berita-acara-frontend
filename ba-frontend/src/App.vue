<!-- <script setup>
import { ref } from 'vue';
import axios from 'axios';
import { renderAsync } from 'docx-preview';
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';

// State untuk menampung semua data form
const formData = ref({
  jenisBeritaAcara: 'UAT',
  tipeRequest: 'Change Request',
  namaAplikasiSpesifik: 'APLIKASI PELAYANAN PELANGGAN TERPUSAT (AP2T)',
  judulPekerjaan: 'Change Request Batas Maksimum Token Perdana di AP2T',
  tahap: 'tahap I',
  nomorBA: '4618.BA/STI.01.03/IC010601/2025',
  nomorSuratRequest: '2357/STI.01.02/F01000402/2025',
  nomorBaUat: '',
  tanggalBA: '2024-12-30',
  tanggalSuratRequest: '2025-01-14',
  tanggalPengerjaan: '2024-12-28',
  // Diisi dengan 1 objek fitur saja
  fiturList: [
    { deskripsi: '<p>Perubahan besaran token perdana untuk <strong>seluruh transaksi</strong> di AP2T.</p>', status: 'OK', catatan: 'Fitur sudah sesuai.' }
  ],
  // Diisi dengan 3 objek penandatangan sesuai placeholder
  signatoryList: [
    { nama: 'Hermawan Asmoko', jabatan: 'VP Aplikasi PLN – Korporat dan Pelayanan Pelanggan', perusahaan: 'PT Indonesia Comnets Plus', tipe: 'utama1' },
    { nama: 'Mumahmmad Nurul Hadi', jabatan: 'VP Pengelolaan Data dan Sistem Informasi Pelanggan', perusahaan: 'PT PLN (Persero)', tipe: 'utama2' },
    { nama: 'Irvan Kristianto', jabatan: 'VP Aplikasi Distribusi dan Pelayanan Pelanggan', perusahaan: 'PT PLN (Persero)', tipe: 'mengetahui' }
  ]
});

const isLoading = ref(false);
const fileBlob = ref(null);
const isPreviewVisible = ref(false);
const docxContainer = ref(null);

async function generateFile() {
  isLoading.value = true;
  isPreviewVisible.value = false;
  fileBlob.value = null;
  if (docxContainer.value) {
    docxContainer.value.innerHTML = '';
  }

  try {
    const response = await axios.post('http://localhost:8080/berita-acara/generate-docx', formData.value, {
      responseType: 'blob'
    });
    fileBlob.value = response.data;
  } catch (error) {
    console.error("Gagal men-generate DOCX:", error);
    alert("Terjadi kesalahan. Cek console log untuk detail.");
  } finally {
    isLoading.value = false;
  }
}

async function previewFile() {
  isPreviewVisible.value = !isPreviewVisible.value;
  if (isPreviewVisible.value && docxContainer.value && docxContainer.value.innerHTML === '') {
    if (fileBlob.value) {
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
</script>

<template>
  <main>
    <h1>Generator Berita Acara (.docx)</h1>
    <form @submit.prevent="generateFile">
      
      <fieldset>
        <legend>Informasi Umum</legend>
        <div class="grid">
          <div>
            <label>Jenis Berita Acara</label>
            <select v-model="formData.jenisBeritaAcara">
              <option>UAT</option>
              <option>Deployment</option>
            </select>
          </div>
          <div>
            <label>Tipe Request</label>
            <select v-model="formData.tipeRequest">
              <option>Change Request</option>
              <option>Job Request</option>
            </select>
          </div>
        </div>
        <div>
          <label>Judul Pekerjaan</label>
          <input type="text" v-model="formData.judulPekerjaan" required>
        </div>
         <div>
          <label>Nama Aplikasi Spesifik</label>
          <input type="text" v-model="formData.namaAplikasiSpesifik">
        </div>
         <div>
          <label>Tahap (Opsional)</label>
          <input type="text" v-model="formData.tahap" placeholder="e.g., tahap I">
        </div>
      </fieldset>

      <fieldset>
        <legend>Nomor & Tanggal</legend>
        <div class="grid">
           <div>
            <label>Nomor Berita Acara</label>
            <input type="text" v-model="formData.nomorBA" required>
          </div>
          <div>
            <label>Nomor Surat Request</label>
            <input type="text" v-model="formData.nomorSuratRequest">
          </div>
           <div>
            <label>Tanggal Surat Request</label>
            <input type="date" v-model="formData.tanggalSuratRequest">
          </div>
          <div>
            <label>Tanggal Berita Acara</label>
            <input type="date" v-model="formData.tanggalBA" required>
          </div>
          <div>
            <label>Tanggal Pengerjaan/Pengujian</label>
            <input type="date" v-model="formData.tanggalPengerjaan" required>
          </div>
          <div v-if="formData.jenisBeritaAcara === 'Deployment'">
            <label>Nomor BA UAT (Wajib untuk Deployment)</label>
            <input type="text" v-model="formData.nomorBaUat" required>
          </div>
        </div>
      </fieldset>

      <fieldset v-if="formData.jenisBeritaAcara === 'UAT'">
        <legend>Deskripsi Fitur</legend>
        <div v-for="(fitur, index) in formData.fiturList" :key="index" class="fitur-item">
          <div class="editor-container">
            <label>Deskripsi Kegiatan</label>
            <QuillEditor 
              v-model:content="fitur.deskripsi" 
              contentType="html" 
              theme="snow"
              toolbar="essential"
            />
          </div>
          <div class="meta-container">
            <div>
              <label>Status</label>
              <select v-model="fitur.status">
                <option>OK</option>
                <option>Ditolak</option>
                <option>Perbaikan</option>
              </select>
            </div>
            <div>
              <label>Catatan</label>
              <input type="text" v-model="fitur.catatan" placeholder="Catatan">
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Daftar Penandatangan</legend>
        <div v-for="(p, index) in formData.signatoryList" :key="index" class="dynamic-item-signer">
            <input type="text" v-model="p.nama" placeholder="Nama Lengkap" required>
            <input type="text" v-model="p.jabatan" placeholder="Jabatan">
            <input type="text" v-model="p.perusahaan" placeholder="Perusahaan">
            <input type="text" :value="p.tipe" readonly>
        </div>
      </fieldset>
      
      <button type="submit" :disabled="isLoading">
        {{ isLoading ? 'Generating...' : '1. Generate File' }}
      </button>
    </form>
    
    <div v-if="fileBlob" class="action-buttons">
      <button @click="downloadFile" class="btn-download">2. Download .docx</button>
      <button @click="previewFile" class="btn-preview">
        {{ isPreviewVisible ? 'Sembunyikan Preview' : '3. Tampilkan Preview' }}
      </button>
    </div>

    <div v-if="isPreviewVisible" class="preview-container">
      <h2>Preview Dokumen</h2>
      <div ref="docxContainer" class="docx-content"></div>
    </div>
  </main>
</template>

<style scoped>
main {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  max-width: 900px;
  margin: 2rem auto;
  padding: 1rem;
}
h1, h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
}
form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
fieldset {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  background-color: #ffff;
}
legend {
  font-weight: bold;
  padding: 0 0.5rem;
  font-size: 1.1em;
  color: #007bff;
}
label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9em;
  font-weight: 500;
  color: #555;
}
input, select {
  width: 100%;
  padding: 0.6rem;
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 4px;
}
input:read-only {
  background-color: #0000;
  cursor: not-allowed;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.2rem;
}
.fitur-item {
  border: 1px solid #e0e0e0;
  padding: 1rem;
  border-radius: 8px;
  background-color: #0000;
}
.editor-container {
  margin-bottom: 1rem;
}
.meta-container {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1rem;
  align-items: end;
}
.dynamic-item-signer {
  display: grid;
  grid-template-columns: 2fr 3fr 2fr 1.5fr;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
}
button {
  padding: 0.8rem 1.5rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  font-weight: bold;
  transition: background-color 0.2s;
}
button:hover {
  background-color: #0056b3;
}
button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
.action-buttons {
  margin-top: 1.5rem;
  display: flex;
  gap: 1rem;
  justify-content: center;
}
.btn-download {
  background-color: #28a745;
}
.btn-download:hover {
  background-color: #218838;
}
.btn-preview {
  background-color: #6c757d;
}
.btn-preview:hover {
  background-color: #5a6268;
}
.preview-container {
  margin-top: 2.5rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
}
.docx-content {
  background: #f7f7f7;
  padding: 2rem;
  box-shadow: 0 0 10px rgba(0,0,0,0.1) inset;
  min-height: 500px;
  border-radius: 4px;
}
.ql-container {
  min-height: 100px;
  font-size: 1rem;
}
</style> -->

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { renderAsync } from 'docx-preview';
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';

// State untuk menampung semua data form
const formData = ref({
  jenisBeritaAcara: 'UAT',
  tipeRequest: 'Change Request',
  namaAplikasiSpesifik: 'APLIKASI PELAYANAN PELANGGAN TERPUSAT (AP2T)',
  judulPekerjaan: 'Change Request Batas Maksimum Token Perdana di AP2T',
  tahap: 'tahap I',
  nomorBA: '4618.BA/STI.01.03/IC010601/2025',
  nomorSuratRequest: '2357/STI.01.02/F01000402/2025',
  nomorBaUat: '',
  tanggalBA: '2024-12-30',
  tanggalSuratRequest: '2025-01-14',
  tanggalPengerjaan: '2024-12-28',
  // Diisi dengan 1 objek fitur saja
  fiturList: [
    { deskripsi: '<p>Perubahan besaran token perdana untuk <strong>seluruh transaksi</strong> di AP2T.</p>', status: 'OK', catatan: 'Fitur sudah sesuai.' }
  ],
  // Diisi dengan 3 objek penandatangan sesuai placeholder
  signatoryList: [
    { nama: 'Hermawan Asmoko', jabatan: 'VP Aplikasi PLN – Korporat dan Pelayanan Pelanggan', perusahaan: 'PT Indonesia Comnets Plus', tipe: 'utama1' },
    { nama: 'Mumahmmad Nurul Hadi', jabatan: 'VP Pengelolaan Data dan Sistem Informasi Pelanggan', perusahaan: 'PT PLN (Persero)', tipe: 'utama2' },
    { nama: 'Irvan Kristianto', jabatan: 'VP Aplikasi Distribusi dan Pelayanan Pelanggan', perusahaan: 'PT PLN (Persero)', tipe: 'mengetahui' }
  ]
});

const isLoading = ref(false);
const fileBlob = ref(null);
const isPreviewVisible = ref(false);
const docxContainer = ref(null);

async function generateFile() {
  isLoading.value = true;
  isPreviewVisible.value = false;
  fileBlob.value = null;
  if (docxContainer.value) {
    docxContainer.value.innerHTML = '';
  }

  try {
    const response = await axios.post('http://localhost:8080/berita-acara/generate-docx', formData.value, {
      responseType: 'blob'
    });
    fileBlob.value = response.data;
  } catch (error) {
    console.error("Gagal men-generate DOCX:", error);
    alert("Terjadi kesalahan. Cek console log untuk detail.");
  } finally {
    isLoading.value = false;
  }
}

async function previewFile() {
  isPreviewVisible.value = !isPreviewVisible.value;
  if (isPreviewVisible.value && docxContainer.value && docxContainer.value.innerHTML === '') {
    if (fileBlob.value) {
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
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1>📄 Generator Berita Acara</h1>
      <p class="subtitle">Buat dokumen berita acara UAT/Deployment dengan mudah</p>
    </header>

    <main class="main-content">
      <form @submit.prevent="generateFile" class="form-container">
        
        <!-- Informasi Umum -->
        <div class="section-card">
          <div class="section-header">
            <h2>📋 Informasi Umum</h2>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Jenis Berita Acara</label>
              <select v-model="formData.jenisBeritaAcara" class="form-select">
                <option>UAT</option>
                <option>Deployment</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Tipe Request</label>
              <select v-model="formData.tipeRequest" class="form-select">
                <option>Change Request</option>
                <option>Job Request</option>
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Judul Pekerjaan</label>
            <input type="text" v-model="formData.judulPekerjaan" required class="form-input">
          </div>
          
          <div class="form-group">
            <label class="form-label">Nama Aplikasi Spesifik</label>
            <input type="text" v-model="formData.namaAplikasiSpesifik" class="form-input">
          </div>
          
          <div class="form-group">
            <label class="form-label">Tahap (Opsional)</label>
            <input type="text" v-model="formData.tahap" placeholder="e.g., tahap I" class="form-input">
          </div>
        </div>

        <!-- Nomor & Tanggal -->
        <div class="section-card">
          <div class="section-header">
            <h2>📅 Nomor & Tanggal</h2>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Nomor Berita Acara</label>
              <input type="text" v-model="formData.nomorBA" required class="form-input">
            </div>
            <div class="form-group">
              <label class="form-label">Nomor Surat Request</label>
              <input type="text" v-model="formData.nomorSuratRequest" class="form-input">
            </div>
            <div class="form-group">
              <label class="form-label">Tanggal Surat Request</label>
              <input type="date" v-model="formData.tanggalSuratRequest" class="form-input">
            </div>
            <div class="form-group">
              <label class="form-label">Tanggal Berita Acara</label>
              <input type="date" v-model="formData.tanggalBA" required class="form-input">
            </div>
            <div class="form-group">
              <label class="form-label">Tanggal Pengerjaan/Pengujian</label>
              <input type="date" v-model="formData.tanggalPengerjaan" required class="form-input">
            </div>
            <div v-if="formData.jenisBeritaAcara === 'Deployment'" class="form-group">
              <label class="form-label">Nomor BA UAT</label>
              <input type="text" v-model="formData.nomorBaUat" required class="form-input">
            </div>
          </div>
        </div>

        <!-- Deskripsi Fitur (hanya untuk UAT) -->
        <div v-if="formData.jenisBeritaAcara === 'UAT'" class="section-card">
          <div class="section-header">
            <h2>⚙️ Deskripsi Fitur</h2>
          </div>
          <div v-for="(fitur, index) in formData.fiturList" :key="index" class="fitur-card">
            <div class="form-group">
              <label class="form-label">Deskripsi Kegiatan</label>
              <div class="editor-wrapper">
                <QuillEditor 
                  v-model:content="fitur.deskripsi" 
                  contentType="html" 
                  theme="snow"
                  toolbar="essential"
                />
              </div>
            </div>
            <div class="fitur-meta">
              <div class="form-group">
                <label class="form-label">Status</label>
                <select v-model="fitur.status" class="form-select">
                  <option>OK</option>
                  <option>Ditolak</option>
                  <option>Perbaikan</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Catatan</label>
                <input type="text" v-model="fitur.catatan" placeholder="Catatan" class="form-input">
              </div>
            </div>
          </div>
        </div>

        <!-- Daftar Penandatangan -->
        <div class="section-card">
          <div class="section-header">
            <h2>✍️ Daftar Penandatangan</h2>
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
              <input type="text" v-model="p.jabatan" placeholder="Jabatan" class="form-input">
              <input type="text" v-model="p.perusahaan" placeholder="Perusahaan" class="form-input">
              <input type="text" :value="p.tipe" readonly class="form-input readonly">
            </div>
          </div>
        </div>
        
        <!-- Generate Button -->
        <div class="action-section">
          <button type="submit" :disabled="isLoading" class="btn-primary">
            <span v-if="isLoading" class="loading-spinner"></span>
            {{ isLoading ? 'Generating...' : '🚀 Generate File' }}
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

      <!-- Preview Section -->
      <div v-if="isPreviewVisible" class="preview-section">
        <div class="section-header">
          <h2>👀 Preview Dokumen</h2>
        </div>
        <div class="preview-container">
          <div ref="docxContainer" class="docx-content"></div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  padding: 20px;
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

.subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 10px 0 0 0;
}

.main-content {
  max-width: 100%;
  background: #f8f9fa;
  margin: 0 auto;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.section-card {
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.section-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 35px rgba(0,0,0,0.15);
}

.section-header {
  margin-bottom: 20px;
  border-bottom: 3px solid #667eea;
  padding-bottom: 10px;
}

.section-header h2 {
  color: #333;
  font-size: 1.4rem;
  margin: 0;
  font-weight: 600;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #444;
  font-size: 0.95rem;
}

.form-input, .form-select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  background: white;
}

.form-input:focus, .form-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input.readonly {
  background-color: #f8f9fa;
  cursor: not-allowed;
  color: #6c757d;
}

.fitur-card {
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 20px;
  background: #f8f9fa;
}

.editor-wrapper {
  margin-bottom: 15px;
}

.fitur-meta {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 15px;
  align-items: end;
}

.signer-grid {
  display: grid;
  gap: 10px;
}

.signer-header {
  display: grid;
  grid-template-columns: 2fr 3fr 2fr 1.5fr;
  gap: 10px;
  font-weight: 600;
  color: #495057;
  padding: 0 5px;
  margin-bottom: 10px;
}

.signer-row {
  display: grid;
  grid-template-columns: 2fr 3fr 2fr 1.5fr;
  gap: 10px;
  align-items: center;
}

.action-section {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

.btn-primary {
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
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

/* Responsive Design */
@media (max-width: 768px) {
  .app-header h1 {
    font-size: 2rem;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .signer-header,
  .signer-row {
    grid-template-columns: 1fr;
    gap: 5px;
  }
  
  .signer-header {
    display: none;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .btn-primary,
  .btn-success,
  .btn-secondary {
    width: 100%;
    max-width: 300px;
  }
}

@media (max-width: 480px) {
  .app-container {
    padding: 10px;
  }
  
  .section-card {
    padding: 20px;
  }
  
  .fitur-meta {
    grid-template-columns: 1fr;
  }
}
</style>