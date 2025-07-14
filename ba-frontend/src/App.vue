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
</style>