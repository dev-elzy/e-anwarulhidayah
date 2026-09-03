# 📱 Panduan Build Aplikasi Android Native (e-AnwarulHidayah)

Dokumen ini memandu Anda dalam melakukan kompilasi, penandatanganan (*signing*), dan pembuatan paket rilis **APK (Android Package)** dan **AAB (Android App Bundle)** untuk aplikasi **e-AnwarulHidayah** berbasis **Capacitor**.

---

## 1. Persyaratan Sistem

Sebelum memulai build, pastikan laptop/PC Anda sudah ter-install:

1. **Java Development Kit (JDK):** Versi **JDK 17** atau yang lebih baru.
2. **Android Studio:** Unduh versi terbaru untuk mengelola SDK dan Gradle.
3. **Android SDK:** Instal Android SDK API Level 34 & 35 via SDK Manager di Android Studio.

---

## 2. Persiapan Firebase Cloud Messaging (FCM)

Untuk mengaktifkan fitur Push Notification Native:

### A. Dapatkan Berkas `google-services.json` (Untuk Aplikasi Android)

1. Buka [Firebase Console](https://console.firebase.google.com/).
2. Buat proyek baru atau pilih proyek yang sudah ada.
3. Tambahkan aplikasi **Android** baru. Masukkan Package Name: `com.develzy.anwarulhidayah`.
4. Unduh berkas `google-services.json` yang disediakan.
5. Pindahkan berkas tersebut ke dalam folder proyek: `d:\DEVELZY\e-anwarulhidayah\android\app\google-services.json` (gantikan berkas placeholder yang ada).

### B. Dapatkan Akun Layanan Firebase (Untuk Backend Cloudflare Workers)

1. Di Firebase Console, buka **Project Settings** -> **Service Accounts**.
2. Klik **Generate New Private Key**, berkas JSON rahasia akan terunduh.
3. Buka berkas JSON tersebut dan ambil nilai berikut untuk dimasukkan ke variabel lingkungan (*environment variables*):
   - `project_id` -> Masukkan ke `FCM_PROJECT_ID`
   - `client_email` -> Masukkan ke `FCM_SERVICE_ACCOUNT_EMAIL`
   - `private_key` -> Masukkan ke `FCM_PRIVATE_KEY` (pastikan menyalin seluruh string privat dari `-----BEGIN PRIVATE KEY-----` sampai `-----END PRIVATE KEY-----` termasuk karakter baris baru `\n`).

*Catatan: Masukkan nilai tersebut di file `.env` untuk pengujian lokal, dan daftarkan via CLI `wrangler secret put <NAMA_VAR>` saat deploy ke Cloudflare Workers.*

---

## 3. Langkah Sinkronisasi Aset Web

Setiap kali Anda mengubah kode sumber Next.js di dalam `src/`, Anda harus mem-build dan menyinkronkan aset web tersebut ke dalam proyek Android:

```bash
# 1. Build aplikasi Next.js (aset web akan diekspor ke folder public)
npm run build

# 2. Sinkronkan aset web dan plugin Capacitor ke proyek Android
npx cap sync
```

---

## 4. Pembuatan Icon & Splash Screen Native

Aplikasi ini sudah dikonfigurasi untuk menampilkan ikon dan Splash Screen bawaan. Jika Anda ingin mengubahnya:

1. Siapkan file gambar berformat PNG berukuran minimal `1024x1024` px (untuk ikon) dan `2732x2732` px (untuk splash screen).
2. Gunakan pustaka pembantu `@capacitor/assets` untuk membuat aset native secara otomatis:

```bash
# Install generator secara global/lokal
npm install -g @capacitor/assets

# Jalankan perintah generate (pastikan file logo ditaruh di folder assets/)
npx capacitor-assets generate --android
```

---

## 5. Kompilasi Menggunakan Android Studio (Metode GUI)

Ini adalah metode termudah dan direkomendasikan:

1. Buka folder proyek Android menggunakan Android Studio:

```bash
npx cap open android
```

2. Tunggu proses **Gradle Sync** selesai (biasanya 1-3 menit pada pembukaan pertama).
3. **Build APK Debug (Untuk Pengujian di HP):**
   - Klik menu **Build** -> **Build Bundle(s) / APK(s)** -> **Build APK(s)**.
   - Setelah selesai, klik notifikasi *Locate* untuk mengambil file `app-debug.apk` di folder `android/app/build/outputs/apk/debug/`.
4. **Build APK/AAB Release (Siap Rilis / Upload Play Store):**
   - Klik menu **Build** -> **Generate Signed Bundle / APK...**
   - Pilih **Android App Bundle** (untuk Google Play Store) atau **APK** (untuk instal langsung). Klik *Next*.
   - Buat kunci penandatanganan baru (*Key Store Path*) jika belum punya, isi password dan alias kunci.
   - Pilih Build Variant: **release**. Klik *Create*.
   - Berkas biner rilis Anda akan berada di folder `android/app/release/` atau `android/app/build/outputs/bundle/release/app-release.aab`.

---

## 6. Kompilasi Menggunakan Terminal (Metode CLI)

Jika Anda tidak ingin membuka Android Studio, gunakan terminal langsung dari folder `android/`:

Arahkan terminal ke folder `d:\DEVELZY\e-anwarulhidayah\android\`, lalu jalankan:

### A. Build APK Debug (Pengujian)

```powershell
# Di Windows PowerShell
./gradlew assembleDebug
```

*Hasil output file:* `android/app/build/outputs/apk/debug/app-debug.apk`

### B. Build APK Release (Belum Ditandatangani)

```powershell
# Di Windows PowerShell
./gradlew assembleRelease
```

*Hasil output file:* `android/app/build/outputs/apk/release/app-release-unsigned.apk`

### C. Build AAB Release (Siap Upload Google Play)

```powershell
# Di Windows PowerShell
./gradlew bundleRelease
```

*Hasil output file:* `android/app/build/outputs/bundle/release/app-release.aab`

---

## 7. Penandatanganan Manual (Signing) Berkas Release via CLI

Jika Anda mem-build APK Release via CLI (`./gradlew assembleRelease`), Anda wajib menandatanganinya agar bisa di-install di ponsel Android.

1. **Buat Key Store (Kunci Pengaman) - Lewati jika sudah punya:**

```bash
keytool -genkey -v -keystore e-anwarulhidayah.keystore -alias anwarulhidayah-key -keyalg RSA -keysize 2048 -validity 10000
```

2. **Tandatangani APK menggunakan `apksigner` (bagian dari Android SDK Build Tools):**

```bash
# Cari letak apksigner di SDK Android Anda, contoh:
& "C:\Users\ASUS\AppData\Local\Android\Sdk\build-tools\34.0.0\apksigner.bat" sign --ks e-anwarulhidayah.keystore --out app-release-signed.apk android/app/build/outputs/apk/release/app-release-unsigned.apk
```

3. Berkas `app-release-signed.apk` siap didistribusikan dan di-install secara langsung di perangkat pengguna Android 14 maupun Android 15.
