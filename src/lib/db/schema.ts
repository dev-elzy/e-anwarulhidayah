import { pgTable, text, integer, real, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Roles
export const roles = pgTable('roles', {
  id: text('id').primaryKey(), // 'SUPER_ADMIN', 'OPERATOR', 'PENGASUH', 'MUSTAHIQ', 'MUNAWIB', 'WALI_SANTRI'
  name: text('name').notNull(),
});

// Permissions
export const permissions = pgTable('permissions', {
  id: text('id').primaryKey(), // e.g. 'view_dashboard_pengasuh'
  name: text('name').notNull(),
  description: text('description'),
});

// Role Permissions Mapping
export const rolePermissions = pgTable('role_permissions', {
  id: text('id').primaryKey(), // 'roleId_permissionId'
  roleId: text('role_id').notNull().references(() => roles.id),
  permissionId: text('permission_id').notNull().references(() => permissions.id),
});

// Users
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  username: text('username').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  roleId: text('role_id').notNull().references(() => roles.id),
  name: text('name').notNull(),
  email: text('email'),
  ustadzId: text('ustadz_id').references(() => ustadz.id),
  waliId: text('wali_id').references(() => wali_santri.id),
  active: boolean('active').default(true).notNull(),
  mustChangePassword: boolean('must_change_password').default(false).notNull(),
  fcmToken: text('fcm_token'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()).notNull(),
});

// Tahun Ajaran
export const tahunAjaran = pgTable('tahun_ajaran', {
  id: text('id').primaryKey(), // e.g. '2026-2027'
  nama: text('nama').notNull(), // e.g. '2026/2027'
  tanggalMulai: text('tanggal_mulai').notNull(),
  tanggalSelesai: text('tanggal_selesai').notNull(),
  aktif: boolean('aktif').default(false).notNull(),
});

// Semester
export const semester = pgTable('semester', {
  id: text('id').primaryKey(), // e.g. '2026-2027-ganjil'
  tahunAjaranId: text('tahun_ajaran_id').notNull().references(() => tahunAjaran.id),
  nama: text('nama').notNull(), // 'Ganjil' | 'Genap'
  aktif: boolean('aktif').default(false).notNull(),
});

// Settings
export const settings = pgTable('settings', {
  id: text('id').primaryKey().default('system'),
  namaPondok: text('nama_pondok').notNull(),
  alamat: text('alamat').notNull(),
  telepon: text('telepon').notNull(),
  logoUrl: text('logo_url'),
  tahunAjaranAktifId: text('tahun_ajaran_aktif_id').references(() => tahunAjaran.id),
  semesterAktifId: text('semester_aktif_id').references(() => semester.id),
  tampilkanRanking: boolean('tampilkan_ranking').default(true).notNull(),
  namaPengasuh: text('nama_pengasuh'),
  raportTemplate: text('raport_template'), // Custom HTML template with shortcodes
});

// Ustadz (act as Munawib / Mustahiq)
export const ustadz = pgTable('ustadz', {
  id: text('id').primaryKey(), // e.g., 'UST001'
  nama: text('nama').notNull(),
  nomorHp: text('nomor_hp').notNull(),
  alamat: text('alamat').notNull(),
  fotoUrl: text('foto_url'),
  statusAktif: boolean('status_aktif').default(true).notNull(),
});

// Wali Santri
export const wali_santri = pgTable('wali_santri', {
  id: text('id').primaryKey(), // e.g. 'WALI001'
  nama: text('nama').notNull(),
  nomorHp: text('nomor_hp').notNull(),
  alamat: text('alamat').notNull(),
  statusAktif: boolean('status_aktif').default(true).notNull(),
});

// Kamar
export const kamar = pgTable('kamar', {
  id: text('id').primaryKey(),
  namaKamar: text('nama_kamar').notNull(),
  kapasitas: integer('kapasitas').notNull(),
  jumlahPenghuni: integer('jumlah_penghuni').default(0).notNull(),
});

// Kelas
export const kelas = pgTable('kelas', {
  id: text('id').primaryKey(), // e.g. 'QR-IDA-A'
  namaKelas: text('nama_kelas').notNull(),
  tingkatan: text('tingkatan').notNull(), // 'I\'dadiyah' | 'Ibtida' | 'Tsanawi'
  waliKelasId: text('wali_kelas_id').references(() => ustadz.id), // Mustahiq
});

// Santri
export const santri = pgTable('santri', {
  id: text('id').primaryKey(),
  nis: text('nis').unique().notNull(),
  namaLengkap: text('nama_lengkap').notNull(),
  fotoUrl: text('foto_url'),
  jenisKelamin: text('jenis_kelamin').notNull(), // 'L' | 'P'
  tempatLahir: text('tempat_lahir').notNull(),
  tanggalLahir: text('tanggal_lahir').notNull(),
  alamat: text('alamat').notNull(),
  namaAyah: text('nama_ayah').notNull(),
  namaIbu: text('nama_ibu').notNull(),
  nomorHpWali: text('nomor_hp_wali').notNull(),
  kelasId: text('kelas_id').references(() => kelas.id), // Current Class
  kamarId: text('kamar_id').references(() => kamar.id),
  tahunMasuk: text('tahun_masuk').notNull(),
  statusAktif: boolean('status_aktif').default(true).notNull(),
  waliId: text('wali_id').references(() => wali_santri.id),
  statusBoyongLulus: text('status_boyong_lulus'), // 'BOYONG' | 'LULUS'
  tahunKeluar: text('tahun_keluar'), // e.g. '2026'
});

// Riwayat Kelas Santri
export const riwayatKelas = pgTable('riwayat_kelas', {
  id: text('id').primaryKey(),
  santriId: text('santri_id').notNull().references(() => santri.id),
  kelasId: text('kelas_id').notNull().references(() => kelas.id),
  tahunAjaranId: text('tahun_ajaran_id').notNull().references(() => tahunAjaran.id),
  semesterId: text('semester_id').notNull().references(() => semester.id),
});

// Kitab / Mapel
export const kitabMapel = pgTable('kitab_mapel', {
  id: text('id').primaryKey(),
  namaKitabMapel: text('nama_kitab_mapel').notNull(),
  keterangan: text('keterangan'),
});

// Jadwal Madrasah (Links Kelas -> Mapel -> Munawib per Semester)
export const jadwal = pgTable('jadwal', {
  id: text('id').primaryKey(),
  hari: text('hari').notNull(), // 'Senin', 'Selasa', ...
  jamMulai: text('jam_mulai').notNull(), // '07:30'
  jamSelesai: text('jam_selesai').notNull(),
  kelasId: text('kelas_id').notNull().references(() => kelas.id),
  kitabMapelId: text('kitab_mapel_id').notNull().references(() => kitabMapel.id),
  ustadzId: text('ustadz_id').notNull().references(() => ustadz.id), // Munawib
  tahunAjaranId: text('tahun_ajaran_id').notNull().references(() => tahunAjaran.id),
  semesterId: text('semester_id').notNull().references(() => semester.id),
});

// QR Kelas (Permanent QR per class)
export const qrKelas = pgTable('qr_kelas', {
  id: text('id').primaryKey(), // QR Code String (e.g. 'QR-IDA-A')
  kelasId: text('kelas_id').notNull().references(() => kelas.id),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()).notNull(),
});

// Class Sessions (Sesi Kelas)
export const classSessions = pgTable('class_sessions', {
  id: text('id').primaryKey(), // SESS-...
  kelasId: text('kelas_id').notNull().references(() => kelas.id),
  jadwalId: text('jadwal_id').notNull().references(() => jadwal.id),
  tanggal: text('tanggal').notNull(), // YYYY-MM-DD
  jamMulai: text('jam_mulai').notNull(),
  jamSelesai: text('jam_selesai').notNull(),
  status: text('status').default('OPEN').notNull(), // 'OPEN' | 'CLOSED' | 'TIDAK_BERJALAN'
  tahunAjaranId: text('tahun_ajaran_id').notNull().references(() => tahunAjaran.id),
  semesterId: text('semester_id').notNull().references(() => semester.id),
});

// Catatan Pembelajaran per Sesi
export const catatanPembelajaran = pgTable('catatan_pembelajaran', {
  id: text('id').primaryKey(), // CTP-...
  sessionId: text('session_id').notNull().references(() => classSessions.id),
  materi: text('materi').notNull(),
  catatan: text('catatan').notNull(),
});

// Absensi Ustadz / Munawib
export const absensiUstadz = pgTable('absensi_ustadz', {
  id: text('id').primaryKey(),
  ustadzId: text('ustadz_id').notNull().references(() => ustadz.id),
  jadwalId: text('jadwal_id').notNull().references(() => jadwal.id),
  sessionId: text('session_id').references(() => classSessions.id),
  tanggal: text('tanggal').notNull(), // YYYY-MM-DD
  waktuScan: text('waktu_scan').notNull(), // HH:MM:SS
  status: text('status').notNull(), // 'Hadir' | 'Terlambat' | 'Alpha' | 'Hadir (Pengganti)'
  teacherType: text('teacher_type').notNull(), // 'PRIMARY' | 'SUBSTITUTE'
});

// Absensi Santri
export const absensiSantri = pgTable('absensi_santri', {
  id: text('id').primaryKey(),
  santriId: text('santri_id').notNull().references(() => santri.id),
  jadwalId: text('jadwal_id').notNull().references(() => jadwal.id),
  sessionId: text('session_id').references(() => classSessions.id),
  tanggal: text('tanggal').notNull(), // YYYY-MM-DD
  status: text('status').notNull(), // 'Masuk' | 'Terlambat' | 'Izin' | 'Alpha'
  ustadzId: text('ustadz_id').notNull().references(() => ustadz.id), // Munawib / Mustahiq pencatat
});

// Rekap Absensi Bulanan (Hijriyah)
export const rekapAbsensiBulanHijriah = pgTable('rekap_absensi_bulanan', {
  id: text('id').primaryKey(),
  santriId: text('santri_id').notNull().references(() => santri.id),
  kelasId: text('kelas_id').notNull().references(() => kelas.id),
  semesterId: text('semester_id').notNull().references(() => semester.id),
  bulanHijriah: text('bulan_hijriah').notNull(), // e.g., 'Syawal', 'Dzulqa\'dah'
  sakit: integer('sakit').notNull().default(0),
  izin: integer('izin').notNull().default(0),
  alpha: integer('alpha').notNull().default(0),
});

// Guru Pengganti (Detailed Log)
export const guruPengganti = pgTable('guru_pengganti', {
  id: text('id').primaryKey(),
  ustadzAsliId: text('ustadz_asli_id').notNull().references(() => ustadz.id),
  ustadzPenggantiId: text('ustadz_pengganti_id').notNull().references(() => ustadz.id),
  jadwalId: text('jadwal_id').notNull().references(() => jadwal.id),
  tanggal: text('tanggal').notNull(), // YYYY-MM-DD
  waktu: text('waktu').notNull(), // HH:MM:SS
});

// Perizinan Guru
export const izinGuru = pgTable('izin_guru', {
  id: text('id').primaryKey(),
  guruId: text('guru_id').notNull().references(() => ustadz.id),
  tanggal: text('tanggal').notNull(), // YYYY-MM-DD
  alasan: text('alasan').notNull(),
  status: text('status').default('Pending').notNull(), // 'Pending' | 'Disetujui' | 'Ditolak'
  penggantiId: text('pengganti_id').references(() => ustadz.id),
});

// Nilai Santri
export const nilaiSantri = pgTable('nilai_santri', {
  id: text('id').primaryKey(),
  santriId: text('santri_id').notNull().references(() => santri.id),
  kitabMapelId: text('kitab_mapel_id').notNull().references(() => kitabMapel.id),
  nilai: real('nilai').notNull(),
  tahunAjaranId: text('tahun_ajaran_id').notNull().references(() => tahunAjaran.id),
  semesterId: text('semester_id').notNull().references(() => semester.id),
  jenis: text('jenis').default('UAS').notNull(), // 'TAMRIN' | 'UAS'
});

// Kitab Nadzom (Master Kitab Hafalan)
export const kitabNadzom = pgTable('kitab_nadzom', {
  id: text('id').primaryKey(),
  namaKitab: text('nama_kitab').notNull(), // e.g. 'Imrithi', 'Alfiyah'
  jumlahBait: integer('jumlah_bait').notNull(),
});

// Target Hafalan Nadzom per Kelas
export const targetHafalanNadzom = pgTable('target_hafalan_nadzom', {
  id: text('id').primaryKey(),
  kelasId: text('kelas_id').notNull().references(() => kelas.id),
  kitabNadzomId: text('kitab_nadzom_id').notNull().references(() => kitabNadzom.id),
  baitMulai: integer('bait_mulai').notNull(),
  baitSelesai: integer('bait_selesai').notNull(),
});

// Setoran Hafalan Nadzom
export const setoranNadzom = pgTable('setoran_nadzom', {
  id: text('id').primaryKey(),
  santriId: text('santri_id').notNull().references(() => santri.id),
  kitabNadzomId: text('kitab_nadzom_id').notNull().references(() => kitabNadzom.id),
  baitMulai: integer('bait_mulai').notNull(),
  baitSelesai: integer('bait_selesai').notNull(),
  status: text('status').notNull(), // 'Lancar' | 'Cukup' | 'Mengulang'
  tanggal: text('tanggal').notNull(), // YYYY-MM-DD
  ustadzId: text('ustadz_id').notNull().references(() => ustadz.id), // Munawib / Mustahiq
  semesterId: text('semester_id').notNull().references(() => semester.id),
  tahunAjaranId: text('tahun_ajaran_id').notNull().references(() => tahunAjaran.id),
});

// Catatan Santri (By Mustahiq / Wali Kelas)
export const catatanSantri = pgTable('catatan_santri', {
  id: text('id').primaryKey(),
  santriId: text('santri_id').notNull().references(() => santri.id),
  catatanUstadz: text('catatan_ustadz').notNull(),
  tanggal: text('tanggal').notNull(), // YYYY-MM-DD
  ustadzId: text('ustadz_id').notNull().references(() => ustadz.id), // Mustahiq
});

// Pelanggaran Santri
export const pelanggaranSantri = pgTable('pelanggaran_santri', {
  id: text('id').primaryKey(),
  santriId: text('santri_id').notNull().references(() => santri.id),
  tanggal: text('tanggal').notNull(), // YYYY-MM-DD
  pelanggaran: text('pelanggaran').notNull(),
  tindakan: text('tindakan').notNull(),
  ustadzId: text('ustadz_id').notNull().references(() => ustadz.id),
});

// Pengumuman
export const pengumuman = pgTable('pengumuman', {
  id: text('id').primaryKey(),
  judul: text('judul').notNull(),
  konten: text('konten').notNull(),
  tanggal: text('tanggal').notNull(), // YYYY-MM-DD
  targetRoles: text('target_roles').notNull(), // comma-separated, e.g. 'PENGASUH,MUSTAHIQ,WALI_SANTRI'
});

// Pusat Notifikasi
export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  roleId: text('role_id').references(() => roles.id),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()).notNull(),
});

// Audit Logs
export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  action: text('action').notNull(),
  details: text('details').notNull(),
  ipAddress: text('ip_address'),
  timestamp: text('timestamp').$defaultFn(() => new Date().toISOString()).notNull(),
});

// Relations
export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
  rolePermissions: many(rolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }),
  permission: one(permissions, { fields: [rolePermissions.permissionId], references: [permissions.id] }),
}));

export const absensiSantriRelations = relations(absensiSantri, ({ one }) => ({
  santri: one(santri, { fields: [absensiSantri.santriId], references: [santri.id] }),
  jadwal: one(jadwal, { fields: [absensiSantri.jadwalId], references: [jadwal.id] }),
  session: one(classSessions, { fields: [absensiSantri.sessionId], references: [classSessions.id] }),
  ustadz: one(ustadz, { fields: [absensiSantri.ustadzId], references: [ustadz.id] }),
}));

export const rekapAbsensiBulanHijriahRelations = relations(rekapAbsensiBulanHijriah, ({ one }) => ({
  santri: one(santri, { fields: [rekapAbsensiBulanHijriah.santriId], references: [santri.id] }),
  kelas: one(kelas, { fields: [rekapAbsensiBulanHijriah.kelasId], references: [kelas.id] }),
  semester: one(semester, { fields: [rekapAbsensiBulanHijriah.semesterId], references: [semester.id] }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  ustadz: one(ustadz, {
    fields: [users.ustadzId],
    references: [ustadz.id],
  }),
  wali: one(wali_santri, {
    fields: [users.waliId],
    references: [wali_santri.id],
  }),
  auditLogs: many(auditLogs),
}));

export const santriRelations = relations(santri, ({ one, many }) => ({
  kelas: one(kelas, {
    fields: [santri.kelasId],
    references: [kelas.id],
  }),
  kamar: one(kamar, {
    fields: [santri.kamarId],
    references: [kamar.id],
  }),
  wali: one(wali_santri, {
    fields: [santri.waliId],
    references: [wali_santri.id],
  }),
  absensi: many(absensiSantri),
  rekapAbsensiBulanHijriah: many(rekapAbsensiBulanHijriah),
  nilai: many(nilaiSantri),
  catatan: many(catatanSantri),
  pelanggaran: many(pelanggaranSantri),
  riwayatKelas: many(riwayatKelas),
  setoranNadzom: many(setoranNadzom),
}));

export const classSessionsRelations = relations(classSessions, ({ one, many }) => ({
  kelas: one(kelas, { fields: [classSessions.kelasId], references: [kelas.id] }),
  jadwal: one(jadwal, { fields: [classSessions.jadwalId], references: [jadwal.id] }),
  catatanPembelajaran: many(catatanPembelajaran),
  absensiUstadz: many(absensiUstadz),
  absensiSantri: many(absensiSantri),
}));
