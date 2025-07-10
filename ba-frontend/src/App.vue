<script setup>
import { ref } from 'vue';
import axios from 'axios';

// 1. STATE MANAGEMENT
// Struktur data ini mencerminkan DTO BeritaAcaraRequest.java di backend.
const formData = ref({
  jenisBeritaAcara: 'UAT',
  kategoriAplikasi: 'Aplikasi Web',
  namaAplikasiSpesifik: '',
  tipeRequest: 'Change Request',
  nomorBA: 'BA-001/DEV/2025',
  tahun: '2025',
  judulPekerjaan: '',
  nomorSuratRequest: '',
  tanggalSuratRequest: '',
  nomorBaUat: '',
  tahap: '',
  tanggalPelaksanaan: '',
  fiturList: [],
  signatoryList: []
});

const isLoading = ref(false);
const pdfUrl = ref(null); // State untuk menyimpan URL preview

// 2. METHODS (Fungsi untuk interaktivitas)
function addFitur() {
  formData.value.fiturList.push({
    deskripsi: '',
    status: 'OK',
    catatan: ''
  });
}

function removeFitur(index) {
  formData.value.fiturList.splice(index, 1);
}

function addSignatory() {
  formData.value.signatoryList.push({
    nama: '',
    jabatan: '',
    perusahaan: 'PT PLN (Persero)',
    tipe: 'utama'
  });
}

function removeSignatory(index) {
  formData.value.signatoryList.splice(index, 1);
}

// 3. API CALL & PDF HANDLING
async function generatePDF() {
  isLoading.value = true;
  
  // Hapus URL lama untuk membersihkan memori
  if (pdfUrl.value) {
    URL.revokeObjectURL(pdfUrl.value);
    pdfUrl.value = null;
  }

  try {
    const response = await axios.post('http://localhost:8080/berita-acara/generate', formData.value, {
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    pdfUrl.value = url;

  } catch (error) {
    console.error("Gagal men-generate PDF:", error);
    alert("Terjadi kesalahan. Cek console log untuk detail.");
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <main>
    <h1>Generator Berita Acara</h1>
    <form @submit.prevent="generatePDF">

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
          <label>Kategori Aplikasi</label>
          <input type="text" v-model="formData.kategoriAplikasi">
        </div>
         <div>
          <label>Nama Aplikasi Spesifik (Opsional)</label>
          <input type="text" v-model="formData.namaAplikasiSpesifik">
        </div>
      </fieldset>

      <fieldset>
        <legend>Nomor & Tanggal</legend>
        <div class.grid>
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
            <label>Tanggal Pelaksanaan</label>
            <input type="date" v-model="formData.tanggalPelaksanaan" required>
          </div>
          <div v-if="formData.jenisBeritaAcara === 'Deployment'">
            <label>Nomor BA UAT (Untuk Deployment)</label>
            <input type="text" v-model="formData.nomorBaUat" required>
          </div>
        </div>
      </fieldset>

      <fieldset v-if="formData.jenisBeritaAcara === 'UAT'">
        <legend>Daftar Fitur (hanya untuk UAT)</legend>
        <div v-for="(fitur, index) in formData.fiturList" :key="index" class="dynamic-item">
          <input type="text" v-model="fitur.deskripsi" placeholder="Deskripsi Fitur">
          <select v-model="fitur.status">
            <option>OK</option>
            <option>Ditolak</option>
            <option>Perbaikan</option>
          </select>
          <input type="text" v-model="fitur.catatan" placeholder="Catatan">
          <button type="button" @click="removeFitur(index)" class="remove-btn">Hapus</button>
        </div>
        <button type="button" @click="addFitur">Tambah Fitur</button>
      </fieldset>

      <fieldset>
        <legend>Daftar Penandatangan</legend>
        <div v-for="(p, index) in formData.signatoryList" :key="index" class="dynamic-item">
            <input type="text" v-model="p.nama" placeholder="Nama Lengkap">
            <input type="text" v-model="p.jabatan" placeholder="Jabatan">
            <input type="text" v-model="p.perusahaan" placeholder="Perusahaan">
            <select v-model="p.tipe">
              <option value="utama">Utama</option>
              <option value="mengetahui">Mengetahui</option>
            </select>
            <button type="button" @click="removeSignatory(index)" class="remove-btn">Hapus</button>
        </div>
        <button type="button" @click="addSignatory">Tambah Penandatangan</button>
      </fieldset>
      
      <button type="submit" :disabled="isLoading">
        {{ isLoading ? 'Generating...' : 'Generate PDF' }}
      </button>
    </form>

    <div v-if="pdfUrl" class="pdf-preview-container">
      <h2>Preview Berita Acara</h2>
      <iframe :src="pdfUrl" width="100%" height="800px" frameborder="0"></iframe>
    </div>
  </main>
</template>

<style scoped>
main {
  font-family: sans-serif;
  max-width: 800px;
  margin: 2rem auto;
  padding: 1rem;
}
form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
fieldset {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 1rem;
}
legend {
  font-weight: bold;
  padding: 0 0.5rem;
}
label {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.9em;
}
input, select {
  width: 100%;
  padding: 0.5rem;
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.dynamic-item {
  display: grid;
  grid-template-columns: 3fr 3fr 2fr 1.5fr auto;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
}
button {
  padding: 0.75rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
}
button:disabled {
  background-color: #ccc;
}
.remove-btn {
  background-color: #dc3545;
  padding: 0.5rem;
}
.pdf-preview-container {
  margin-top: 2rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 1rem;
}
</style>