-- ====================================================================
-- E-ANWARULHIDAYAH - POSTGRESQL DATABASE SCHEMA (SUPABASE)
-- 100% Aligned with Drizzle ORM Schema
-- ====================================================================

-- 1. Roles & Permissions
CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS permissions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id TEXT PRIMARY KEY,
    role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE
);

-- 2. Master Tahun Ajaran & Semester
CREATE TABLE IF NOT EXISTS tahun_ajaran (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    tanggal_mulai TEXT NOT NULL,
    tanggal_selesai TEXT NOT NULL,
    aktif BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS semester (
    id TEXT PRIMARY KEY,
    tahun_ajaran_id TEXT NOT NULL REFERENCES tahun_ajaran(id) ON DELETE CASCADE,
    nama TEXT NOT NULL,
    aktif BOOLEAN NOT NULL DEFAULT FALSE
);

-- 3. Kamar, Kelas, dan Asatidz
CREATE TABLE IF NOT EXISTS kamar (
    id TEXT PRIMARY KEY,
    nama_kamar TEXT NOT NULL,
    kapasitas INTEGER NOT NULL DEFAULT 0,
    jumlah_penghuni INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ustadz (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    nomor_hp TEXT,
    alamat TEXT,
    foto_url TEXT,
    status_aktif BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS kelas (
    id TEXT PRIMARY KEY,
    nama_kelas TEXT NOT NULL,
    tingkatan TEXT NOT NULL,
    wali_kelas_id TEXT REFERENCES ustadz(id) ON DELETE SET NULL
);

-- 4. Wali Santri & Santri
CREATE TABLE IF NOT EXISTS wali_santri (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    nomor_hp TEXT,
    alamat TEXT,
    status_aktif BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS santri (
    id TEXT PRIMARY KEY,
    nis TEXT NOT NULL UNIQUE,
    nama_lengkap TEXT NOT NULL,
    foto_url TEXT,
    jenis_kelamin TEXT NOT NULL,
    tempat_lahir TEXT NOT NULL,
    tanggal_lahir TEXT NOT NULL,
    alamat TEXT NOT NULL,
    nama_ayah TEXT NOT NULL,
    nama_ibu TEXT NOT NULL,
    nomor_hp_wali TEXT NOT NULL,
    kelas_id TEXT REFERENCES kelas(id) ON DELETE SET NULL,
    kamar_id TEXT REFERENCES kamar(id) ON DELETE SET NULL,
    tahun_masuk TEXT NOT NULL,
    status_aktif BOOLEAN NOT NULL DEFAULT TRUE,
    wali_id TEXT REFERENCES wali_santri(id) ON DELETE SET NULL,
    status_boyong_lulus TEXT,
    tahun_keluar TEXT
);

CREATE TABLE IF NOT EXISTS riwayat_kelas (
    id TEXT PRIMARY KEY,
    santri_id TEXT NOT NULL REFERENCES santri(id) ON DELETE CASCADE,
    kelas_id TEXT NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
    tahun_ajaran_id TEXT NOT NULL REFERENCES tahun_ajaran(id) ON DELETE CASCADE,
    semester_id TEXT NOT NULL REFERENCES semester(id) ON DELETE CASCADE
);

-- 5. Kitab / Mapel & Jadwal
CREATE TABLE IF NOT EXISTS kitab_mapel (
    id TEXT PRIMARY KEY,
    nama_kitab_mapel TEXT NOT NULL,
    keterangan TEXT
);

CREATE TABLE IF NOT EXISTS jadwal (
    id TEXT PRIMARY KEY,
    hari TEXT NOT NULL,
    jam_mulai TEXT NOT NULL,
    jam_selesai TEXT NOT NULL,
    kelas_id TEXT NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
    kitab_mapel_id TEXT NOT NULL REFERENCES kitab_mapel(id) ON DELETE CASCADE,
    ustadz_id TEXT NOT NULL REFERENCES ustadz(id) ON DELETE CASCADE,
    tahun_ajaran_id TEXT NOT NULL REFERENCES tahun_ajaran(id) ON DELETE CASCADE,
    semester_id TEXT NOT NULL REFERENCES semester(id) ON DELETE CASCADE
);

-- 6. QR Presensi & Sesi Kelas
CREATE TABLE IF NOT EXISTS qr_kelas (
    id TEXT PRIMARY KEY,
    kelas_id TEXT NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS class_sessions (
    id TEXT PRIMARY KEY,
    kelas_id TEXT NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
    jadwal_id TEXT NOT NULL REFERENCES jadwal(id) ON DELETE CASCADE,
    tanggal TEXT NOT NULL,
    jam_mulai TEXT NOT NULL,
    jam_selesai TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN',
    tahun_ajaran_id TEXT NOT NULL REFERENCES tahun_ajaran(id) ON DELETE CASCADE,
    semester_id TEXT NOT NULL REFERENCES semester(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS catatan_pembelajaran (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
    materi TEXT NOT NULL,
    catatan TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS absensi_ustadz (
    id TEXT PRIMARY KEY,
    ustadz_id TEXT NOT NULL REFERENCES ustadz(id) ON DELETE CASCADE,
    jadwal_id TEXT NOT NULL REFERENCES jadwal(id) ON DELETE CASCADE,
    session_id TEXT REFERENCES class_sessions(id) ON DELETE SET NULL,
    tanggal TEXT NOT NULL,
    waktu_scan TEXT NOT NULL,
    status TEXT NOT NULL,
    teacher_type TEXT NOT NULL
);

-- 7. Presensi Santri & Rekap
CREATE TABLE IF NOT EXISTS absensi_santri (
    id TEXT PRIMARY KEY,
    santri_id TEXT NOT NULL REFERENCES santri(id) ON DELETE CASCADE,
    jadwal_id TEXT NOT NULL REFERENCES jadwal(id) ON DELETE CASCADE,
    session_id TEXT REFERENCES class_sessions(id) ON DELETE SET NULL,
    tanggal TEXT NOT NULL,
    status TEXT NOT NULL,
    ustadz_id TEXT NOT NULL REFERENCES ustadz(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rekap_absensi_bulanan (
    id TEXT PRIMARY KEY,
    santri_id TEXT NOT NULL REFERENCES santri(id) ON DELETE CASCADE,
    kelas_id TEXT NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
    semester_id TEXT NOT NULL REFERENCES semester(id) ON DELETE CASCADE,
    bulan_hijriah TEXT NOT NULL,
    sakit INTEGER NOT NULL DEFAULT 0,
    izin INTEGER NOT NULL DEFAULT 0,
    alpha INTEGER NOT NULL DEFAULT 0
);

-- 8. Guru Pengganti & Izin Guru
CREATE TABLE IF NOT EXISTS guru_pengganti (
    id TEXT PRIMARY KEY,
    ustadz_asli_id TEXT NOT NULL REFERENCES ustadz(id) ON DELETE CASCADE,
    ustadz_pengganti_id TEXT NOT NULL REFERENCES ustadz(id) ON DELETE CASCADE,
    jadwal_id TEXT NOT NULL REFERENCES jadwal(id) ON DELETE CASCADE,
    tanggal TEXT NOT NULL,
    waktu TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS izin_guru (
    id TEXT PRIMARY KEY,
    guru_id TEXT NOT NULL REFERENCES ustadz(id) ON DELETE CASCADE,
    tanggal TEXT NOT NULL,
    alasan TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    pengganti_id TEXT REFERENCES ustadz(id) ON DELETE SET NULL
);

-- 9. Penilaian Santri
CREATE TABLE IF NOT EXISTS nilai_santri (
    id TEXT PRIMARY KEY,
    santri_id TEXT NOT NULL REFERENCES santri(id) ON DELETE CASCADE,
    kitab_mapel_id TEXT NOT NULL REFERENCES kitab_mapel(id) ON DELETE CASCADE,
    nilai REAL NOT NULL,
    tahun_ajaran_id TEXT NOT NULL REFERENCES tahun_ajaran(id) ON DELETE CASCADE,
    semester_id TEXT NOT NULL REFERENCES semester(id) ON DELETE CASCADE,
    jenis TEXT NOT NULL DEFAULT 'UAS'
);

-- 10. Nadzom & Setoran Hafalan
CREATE TABLE IF NOT EXISTS kitab_nadzom (
    id TEXT PRIMARY KEY,
    nama_kitab TEXT NOT NULL,
    jumlah_bait INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS target_hafalan_nadzom (
    id TEXT PRIMARY KEY,
    kelas_id TEXT NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
    kitab_nadzom_id TEXT NOT NULL REFERENCES kitab_nadzom(id) ON DELETE CASCADE,
    bait_mulai INTEGER NOT NULL DEFAULT 1,
    bait_selesai INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS setoran_nadzom (
    id TEXT PRIMARY KEY,
    santri_id TEXT NOT NULL REFERENCES santri(id) ON DELETE CASCADE,
    kitab_nadzom_id TEXT NOT NULL REFERENCES kitab_nadzom(id) ON DELETE CASCADE,
    bait_mulai INTEGER NOT NULL,
    bait_selesai INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'Lancar',
    tanggal TEXT NOT NULL,
    ustadz_id TEXT NOT NULL REFERENCES ustadz(id) ON DELETE CASCADE,
    semester_id TEXT NOT NULL REFERENCES semester(id) ON DELETE CASCADE,
    tahun_ajaran_id TEXT NOT NULL REFERENCES tahun_ajaran(id) ON DELETE CASCADE
);

-- 11. Catatan, Pelanggaran, dan Pengumuman
CREATE TABLE IF NOT EXISTS catatan_santri (
    id TEXT PRIMARY KEY,
    santri_id TEXT NOT NULL REFERENCES santri(id) ON DELETE CASCADE,
    catatan_ustadz TEXT NOT NULL,
    tanggal TEXT NOT NULL,
    ustadz_id TEXT NOT NULL REFERENCES ustadz(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pelanggaran_santri (
    id TEXT PRIMARY KEY,
    santri_id TEXT NOT NULL REFERENCES santri(id) ON DELETE CASCADE,
    tanggal TEXT NOT NULL,
    pelanggaran TEXT NOT NULL,
    tindakan TEXT NOT NULL,
    ustadz_id TEXT NOT NULL REFERENCES ustadz(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pengumuman (
    id TEXT PRIMARY KEY,
    judul TEXT NOT NULL,
    konten TEXT NOT NULL,
    tanggal TEXT NOT NULL,
    target_roles TEXT NOT NULL
);

-- 12. Users (Autentikasi NextAuth)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    ustadz_id TEXT REFERENCES ustadz(id) ON DELETE SET NULL,
    wali_id TEXT REFERENCES wali_santri(id) ON DELETE SET NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    fcm_token TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 13. Pengaturan Sistem
CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    nama_pondok TEXT NOT NULL DEFAULT 'Pondok Pesantren Anwarul Hidayah',
    alamat TEXT NOT NULL DEFAULT 'Jl. Pesantren No. 01, Jawa Timur',
    telepon TEXT NOT NULL DEFAULT '081234567890',
    logo_url TEXT,
    tahun_ajaran_aktif_id TEXT REFERENCES tahun_ajaran(id) ON DELETE SET NULL,
    semester_aktif_id TEXT REFERENCES semester(id) ON DELETE SET NULL,
    tampilkan_ranking BOOLEAN NOT NULL DEFAULT TRUE,
    nama_pengasuh TEXT DEFAULT 'K.H. M. Anwarul Hidayah',
    raport_template TEXT
);

-- 14. Notifikasi & Audit Log
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    role_id TEXT REFERENCES roles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    ip_address TEXT,
    timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- COVERING INDEXES FOR OPTIMAL QUERY PERFORMANCE
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_santri_nis ON santri(nis);
CREATE INDEX IF NOT EXISTS idx_santri_kelas_id ON santri(kelas_id);
CREATE INDEX IF NOT EXISTS idx_santri_kamar_id ON santri(kamar_id);
CREATE INDEX IF NOT EXISTS idx_santri_wali_id ON santri(wali_id);

CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_ustadz_id ON users(ustadz_id);
CREATE INDEX IF NOT EXISTS idx_users_wali_id ON users(wali_id);

CREATE INDEX IF NOT EXISTS idx_kelas_wali_kelas_id ON kelas(wali_kelas_id);
CREATE INDEX IF NOT EXISTS idx_semester_tahun_ajaran_id ON semester(tahun_ajaran_id);

CREATE INDEX IF NOT EXISTS idx_jadwal_kelas_id ON jadwal(kelas_id);
CREATE INDEX IF NOT EXISTS idx_jadwal_kitab_mapel_id ON jadwal(kitab_mapel_id);
CREATE INDEX IF NOT EXISTS idx_jadwal_ustadz_id ON jadwal(ustadz_id);
CREATE INDEX IF NOT EXISTS idx_jadwal_tahun_ajaran_id ON jadwal(tahun_ajaran_id);
CREATE INDEX IF NOT EXISTS idx_jadwal_semester_id ON jadwal(semester_id);
CREATE INDEX IF NOT EXISTS idx_jadwal_kelas_hari ON jadwal(kelas_id, hari);

CREATE INDEX IF NOT EXISTS idx_class_sessions_kelas_id ON class_sessions(kelas_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_jadwal_id ON class_sessions(jadwal_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_tahun_ajaran_id ON class_sessions(tahun_ajaran_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_semester_id ON class_sessions(semester_id);

CREATE INDEX IF NOT EXISTS idx_absensi_santri_santri_id ON absensi_santri(santri_id);
CREATE INDEX IF NOT EXISTS idx_absensi_santri_jadwal_id ON absensi_santri(jadwal_id);
CREATE INDEX IF NOT EXISTS idx_absensi_santri_session_id ON absensi_santri(session_id);
CREATE INDEX IF NOT EXISTS idx_absensi_santri_ustadz_id ON absensi_santri(ustadz_id);
CREATE INDEX IF NOT EXISTS idx_absensi_santri_lookup ON absensi_santri(santri_id, tanggal);

CREATE INDEX IF NOT EXISTS idx_absensi_ustadz_ustadz_id ON absensi_ustadz(ustadz_id);
CREATE INDEX IF NOT EXISTS idx_absensi_ustadz_jadwal_id ON absensi_ustadz(jadwal_id);
CREATE INDEX IF NOT EXISTS idx_absensi_ustadz_session_id ON absensi_ustadz(session_id);

CREATE INDEX IF NOT EXISTS idx_nilai_santri_santri_id ON nilai_santri(santri_id);
CREATE INDEX IF NOT EXISTS idx_nilai_santri_kitab_mapel_id ON nilai_santri(kitab_mapel_id);
CREATE INDEX IF NOT EXISTS idx_nilai_santri_tahun_ajaran_id ON nilai_santri(tahun_ajaran_id);
CREATE INDEX IF NOT EXISTS idx_nilai_santri_semester_id ON nilai_santri(semester_id);

CREATE INDEX IF NOT EXISTS idx_target_hafalan_kelas_id ON target_hafalan_nadzom(kelas_id);
CREATE INDEX IF NOT EXISTS idx_target_hafalan_kitab_id ON target_hafalan_nadzom(kitab_nadzom_id);

CREATE INDEX IF NOT EXISTS idx_setoran_nadzom_santri_id ON setoran_nadzom(santri_id);
CREATE INDEX IF NOT EXISTS idx_setoran_nadzom_kitab_id ON setoran_nadzom(kitab_nadzom_id);
CREATE INDEX IF NOT EXISTS idx_setoran_nadzom_ustadz_id ON setoran_nadzom(ustadz_id);
CREATE INDEX IF NOT EXISTS idx_setoran_nadzom_tahun_ajaran_id ON setoran_nadzom(tahun_ajaran_id);
CREATE INDEX IF NOT EXISTS idx_setoran_nadzom_semester_id ON setoran_nadzom(semester_id);

CREATE INDEX IF NOT EXISTS idx_catatan_santri_santri_id ON catatan_santri(santri_id);
CREATE INDEX IF NOT EXISTS idx_catatan_santri_ustadz_id ON catatan_santri(ustadz_id);

CREATE INDEX IF NOT EXISTS idx_catatan_pembelajaran_session_id ON catatan_pembelajaran(session_id);

CREATE INDEX IF NOT EXISTS idx_pelanggaran_santri_santri_id ON pelanggaran_santri(santri_id);
CREATE INDEX IF NOT EXISTS idx_pelanggaran_santri_ustadz_id ON pelanggaran_santri(ustadz_id);

CREATE INDEX IF NOT EXISTS idx_rekap_absensi_santri_id ON rekap_absensi_bulanan(santri_id);
CREATE INDEX IF NOT EXISTS idx_rekap_absensi_kelas_id ON rekap_absensi_bulanan(kelas_id);
CREATE INDEX IF NOT EXISTS idx_rekap_absensi_semester_id ON rekap_absensi_bulanan(semester_id);

CREATE INDEX IF NOT EXISTS idx_riwayat_kelas_santri_id ON riwayat_kelas(santri_id);
CREATE INDEX IF NOT EXISTS idx_riwayat_kelas_kelas_id ON riwayat_kelas(kelas_id);
CREATE INDEX IF NOT EXISTS idx_riwayat_kelas_tahun_ajaran_id ON riwayat_kelas(tahun_ajaran_id);
CREATE INDEX IF NOT EXISTS idx_riwayat_kelas_semester_id ON riwayat_kelas(semester_id);

CREATE INDEX IF NOT EXISTS idx_guru_pengganti_ustadz_asli ON guru_pengganti(ustadz_asli_id);
CREATE INDEX IF NOT EXISTS idx_guru_pengganti_ustadz_pengganti ON guru_pengganti(ustadz_pengganti_id);
CREATE INDEX IF NOT EXISTS idx_guru_pengganti_jadwal ON guru_pengganti(jadwal_id);

CREATE INDEX IF NOT EXISTS idx_izin_guru_guru_id ON izin_guru(guru_id);
CREATE INDEX IF NOT EXISTS idx_izin_guru_pengganti_id ON izin_guru(pengganti_id);

CREATE INDEX IF NOT EXISTS idx_qr_kelas_kelas_id ON qr_kelas(kelas_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_role_id ON notifications(role_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_settings_tahun_ajaran ON settings(tahun_ajaran_aktif_id);
CREATE INDEX IF NOT EXISTS idx_settings_semester ON settings(semester_aktif_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tahun_ajaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE semester ENABLE ROW LEVEL SECURITY;
ALTER TABLE kamar ENABLE ROW LEVEL SECURITY;
ALTER TABLE ustadz ENABLE ROW LEVEL SECURITY;
ALTER TABLE kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE wali_santri ENABLE ROW LEVEL SECURITY;
ALTER TABLE santri ENABLE ROW LEVEL SECURITY;
ALTER TABLE riwayat_kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitab_mapel ENABLE ROW LEVEL SECURITY;
ALTER TABLE jadwal ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE absensi_ustadz ENABLE ROW LEVEL SECURITY;
ALTER TABLE absensi_santri ENABLE ROW LEVEL SECURITY;
ALTER TABLE rekap_absensi_bulanan ENABLE ROW LEVEL SECURITY;
ALTER TABLE guru_pengganti ENABLE ROW LEVEL SECURITY;
ALTER TABLE izin_guru ENABLE ROW LEVEL SECURITY;
ALTER TABLE nilai_santri ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitab_nadzom ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_hafalan_nadzom ENABLE ROW LEVEL SECURITY;
ALTER TABLE setoran_nadzom ENABLE ROW LEVEL SECURITY;
ALTER TABLE catatan_santri ENABLE ROW LEVEL SECURITY;
ALTER TABLE catatan_pembelajaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE pelanggaran_santri ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengumuman ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Pasang kebijakan SELECT otomatis untuk authenticated users
DO $$ 
DECLARE 
    t text;
BEGIN 
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "allow_auth_select_%I" ON %I;', t, t);
        EXECUTE format('CREATE POLICY "allow_auth_select_%I" ON %I FOR SELECT TO authenticated USING (true);', t, t);
    END LOOP;
END $$;
