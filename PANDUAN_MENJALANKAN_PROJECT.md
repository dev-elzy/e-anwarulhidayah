# 🚀 Panduan Menjalankan Project E-Anwarul Hidayah

File ini dibuat untuk memandu Anda langkah demi langkah setelah Anda men-download atau melakukan `clone` *source code* ini dari Github.

---

## 1. Persyaratan Sistem (System Requirements)
Sebelum mulai, pastikan komputer/laptop Anda sudah ter-install program berikut:
1. **Node.js** (Sangat disarankan versi **18.x** atau yang lebih baru).
2. **Git** (Opsional, jika mendownload via ZIP tidak terlalu wajib, tapi disarankan).

---

## 2. Langkah Pertama: Mengembalikan Modul Node (Install Dependencies)
Ingat, folder `node_modules` (yang ukurannya sangat besar) sengaja tidak di-upload ke Github. Jadi langkah pertama yang harus Anda lakukan setelah mengekstrak file/mendownloadnya adalah mendownload ulang modul-modul tersebut secara otomatis.

1. Buka folder project ini (`e-anwarulhidayah`).
2. Klik kanan di ruang kosong folder tersebut, lalu pilih **"Open in Terminal"** (Atau buka CMD/Powershell dan arahkan ke folder ini).
3. Ketikkan perintah berikut lalu tekan **Enter**:
   ```bash
   npm install
   ```
4. Tunggu proses instalasi berjalan (biasanya butuh waktu 1-3 menit tergantung koneksi internet).

---

## 3. Langkah Kedua: Konfigurasi File Lingkungan (.env)
File `.env` telah disiapkan untuk pengembangan lokal:
- Kunci autentikasi sesi lokal (`AUTH_SECRET`).
- Konfigurasi upload gambar (jika Cloudinary dikosongkan, upload foto otomatis disimpan lokal sebagai Base64 tanpa perlu API Cloudinary).

---

## 4. Langkah Ketiga: Inisialisasi Database SQLite Lokal
Untuk membuat atau me-reset database lokal (`local.sqlite`) beserta seluruh data tabel dan akun pengujian, jalankan:

```bash
npm run db:seed
```

### 📋 Daftar Akun Uji Coba Lokal (Password semua akun: `admin123`):
| Role / Hak Akses | Username | Nama Akun |
| :--- | :--- | :--- |
| **Super Admin** | `admin` | Super Admin |
| **Operator / Admin** | `operator` | Operator Pondok |
| **Pengasuh** | `pengasuh` | K.H. Anwarul Hidayah |
| **Mustahiq (Wali Kelas)** | `mustahiq1` | Ust. Wahyu Romadon |
| **Munawib (Guru Mapel)** | `munawib1` | Ust. Alwi Mustaqim |
| **Bendahara** | `bendahara` | Bendahara Pondok |
| **Wali Santri** | `wali1` | H. Sulaiman (Wali Ahmad Zaki) |

---

## 5. Langkah Keempat: Menjalankan Server Lokal
Untuk menjalankan server website di komputer Anda:

```bash
npm run dev
```

Buka browser dan akses: **[http://localhost:3000/login](http://localhost:3000/login)**

---

## ☁️ Langkah Nanti Jika Ingin Deploy Ulang ke Cloudflare D1
Ketika Anda sudah siap membuat ulang database D1 di Cloudflare:
1. Buat database D1 baru di Cloudflare: `npx wrangler d1 create db-anwarulhidayah`
2. Update `database_id` di file `wrangler.jsonc`.
3. Jalankan migrasi ke remote Cloudflare:
   ```bash
   npm run db:migrate:prod
   ```
4. Deploy aplikasi:
   ```bash
   npm run deploy
   ```

---
*Dibuat oleh AI Assistant - E-AnwarulHidayah siap diuji secara lokal 100%!*
