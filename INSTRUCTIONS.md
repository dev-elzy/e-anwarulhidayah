# Petunjuk Development & Deployment

Dokumen ini berisi pengingat penting untuk pengembangan dan deployment aplikasi **e-AnwarulHidayah**. Harap selalu baca dokumen ini sebelum mengeksekusi aksi push atau deploy.

## 1. Commit & Push
Setiap kali selesai mengerjakan fitur atau perbaikan bug, pastikan untuk selalu melakukan commit dan push ke repository GitHub resmi:
- **Repository:** `https://github.com/develzy/e-anwarulhidayah.git`
- **Branch Utama:** `main`

**Perintah yang dijalankan:**
```bash
git add .
git commit -m "feat/fix/chore: deskripsi perubahan"
git push
```

## 2. Deployment (MANUAL)
**PENTING: Aplikasi ini menggunakan Cloudflare Workers dan tidak dikonfigurasi menggunakan GitHub Actions untuk Auto-Deploy.**

Setiap perubahan yang sudah di-push ke GitHub **TIDAK AKAN** otomatis live. Deployment wajib dilakukan secara **manual** melalui terminal menggunakan OpenNext dan Wrangler.

- **URL Live Aplikasi:** `https://e-anwarulhidayah.develzy.workers.dev/`

**Perintah Deployment Manual:**
```bash
# 1. Build project menggunakan OpenNext untuk Cloudflare
npm run build:cloudflare

# 2. Deploy bundle ke Cloudflare Workers menggunakan Wrangler
npm run deploy
```

*(Catatan Windows: Jika terdapat kendala Execution Policy pada PowerShell, gunakan `cmd.exe /c "npm run build:cloudflare"` dan `cmd.exe /c "npm run deploy"`)*
