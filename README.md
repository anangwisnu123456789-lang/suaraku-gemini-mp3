# SuaraKu Gemini TTS — MP3 (Online deployment)

Website ini memakai Gemini TTS dari server Node.js. API key tidak diletakkan di browser. Audio WAV dari Gemini dikonversi ke MP3 di server.

## Pilihan A — Pasang online di Render (direkomendasikan)

Anda memerlukan akun GitHub, akun Render, dan Gemini API key.

### 1. Siapkan API key Gemini
1. Buka https://aistudio.google.com/apikey
2. Buat atau pilih API key untuk Gemini API.
3. Simpan secara rahasia. Jangan menaruh key dalam file `public/index.html`, jangan mengirimnya di chat, dan jangan mengunggah file `.env` ke GitHub.

Pastikan model TTS yang digunakan tersedia untuk akun/proyek Anda. Dokumentasi resmi: https://ai.google.dev/gemini-api/docs/speech-generation

### 2. Unggah folder ke GitHub
1. Buat akun atau masuk ke https://github.com
2. Buat repository baru bernama `suaraku-gemini-mp3`.
3. Unggah semua file dan folder dalam paket ZIP yang diekstrak: `public/`, `server.js`, `package.json`, `render.yaml`, `README.md`, dan `.env.example`.
4. Jangan unggah file `.env` yang berisi kunci rahasia.

### 3. Deploy di Render
1. Buka https://render.com dan daftar/masuk.
2. Pilih **New +** → **Blueprint** (atau buat **Web Service** yang terhubung ke repository GitHub).
3. Pilih repository `suaraku-gemini-mp3`. Render dapat membaca `render.yaml`.
4. Saat diminta nilai `GEMINI_API_KEY`, tempel API key dari Google AI Studio secara langsung ke kolom environment variable rahasia di Render.
5. Klik deploy dan tunggu sampai status layanan menjadi Live.
6. Buka URL `.onrender.com` yang diberikan Render.

Jika membuat Web Service secara manual, gunakan:
- Runtime: Node
- Build command: `npm install`
- Start command: `npm start`
- Environment variable: `GEMINI_API_KEY` = API key rahasia Anda
- Environment variable opsional: `GEMINI_TTS_MODEL` = `gemini-3.8-flash-tts`

### 4. Uji
Buka URL website, masukkan teks pendek, pilih suara, lalu klik **Buat Suara AI & Unduh MP3**. Periksa folder Downloads pada browser.

## Pilihan B — Jalankan di komputer untuk mencoba
1. Instal Node.js 20 atau lebih baru: https://nodejs.org
2. Ekstrak ZIP.
3. Buka terminal di folder hasil ekstrak.
4. Jalankan `npm install`.
5. Salin `.env.example` menjadi `.env`, lalu isi `GEMINI_API_KEY` dengan kunci Anda.
6. Jalankan `npm start`.
7. Buka http://localhost:3000

## Catatan penting
- Paket ini menyiapkan kode dan konfigurasi deploy, tetapi deployment online harus dilakukan melalui akun GitHub/Render milik Anda. Saya tidak dapat masuk atau menerbitkan website ke akun eksternal Anda dari sini.
- Paket belum diuji memakai API key atau akun Gemini milik Anda. Ketersediaan model, kuota, dan biaya mengikuti akun Google AI Studio.
- Paket Render gratis, jika tersedia untuk akun/wilayah Anda, dapat memiliki batas pemakaian atau membuat layanan tidur setelah tidak aktif; cek ketentuan Render terbaru.
- Endpoint TTS memiliki pembatasan dasar 10 permintaan per 15 menit per alamat IP. Untuk penggunaan publik/komersial, tambahkan autentikasi pengguna, kontrol biaya, dan pemantauan kuota.
- Nama karakter SuaraKu adalah preset tampilan yang dipetakan ke voice bawaan Gemini, bukan suara kloning.
