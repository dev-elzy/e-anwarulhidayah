-- ====================================================================
-- SEED DATA E-ANWARULHIDAYAH UNTUK SUPABASE (POSTGRESQL)
-- ====================================================================

-- 1. Roles
INSERT INTO roles (id, name) VALUES 
('SUPER_ADMIN', 'Super Admin'),
('OPERATOR', 'Operator Pondok'),
('PENGASUH', 'Pengasuh Pondok'),
('MUSTAHIQ', 'Mustahiq / Wali Kelas'),
('MUNAWIB', 'Munawib / Guru Mapel'),
('WALI_SANTRI', 'Wali Santri')
ON CONFLICT (id) DO NOTHING;

-- 2. Permissions
INSERT INTO permissions (id, name, description) VALUES 
('view_dashboard_admin', 'Akses Dashboard Admin', 'Melihat dashboard super admin'),
('manage_users', 'Manajemen User', 'Membuat, mengubah, dan menghapus pengguna'),
('manage_roles', 'Manajemen Role', 'Mengatur permission per role'),
('manage_system_settings', 'Pengaturan Sistem', 'Mengubah profil pondok dan pengaturan umum'),
('manage_master_data', 'Manajemen Data Master', 'Mengelola santri, ustadz, kelas, kamar, dan mapel'),
('manage_academic', 'Manajemen Akademik', 'Mengatur tahun ajaran, semester, dan jadwal'),
('manage_attendance', 'Manajemen Presensi', 'Mengelola presensi harian ustadz dan santri'),
('view_dashboard_pengasuh', 'Akses Dashboard Pengasuh', 'Melihat ringkasan eksekutif pondok'),
('view_santri_progress', 'Melihat Perkembangan Santri', 'Memantau hafalan dan kehadiran'),
('input_grades', 'Input Nilai', 'Menginput nilai ujian santri'),
('manage_hafalan', 'Manajemen Setoran Hafalan', 'Mencatat setoran nadzom santri'),
('generate_raport', 'Cetak Raport Digital', 'Mencetak raport santri'),
('scan_qr_class', 'Scan QR Masuk Kelas', 'Melakukan presensi mengajar via scan QR'),
('manage_class_attendance', 'Input Presensi Kelas', 'Mencatat kehadiran santri di jam pelajaran'),
('view_child_progress', 'Pantau Anak', 'Melihat rekam jejak santri anak kandung')
ON CONFLICT (id) DO NOTHING;

-- 3. Role Permissions Mapping
INSERT INTO role_permissions (id, role_id, permission_id) VALUES 
('SUPER_ADMIN_all', 'SUPER_ADMIN', 'manage_users'),
('SUPER_ADMIN_roles', 'SUPER_ADMIN', 'manage_roles'),
('SUPER_ADMIN_sys', 'SUPER_ADMIN', 'manage_system_settings'),
('SUPER_ADMIN_dash', 'SUPER_ADMIN', 'view_dashboard_admin'),
('OPERATOR_master', 'OPERATOR', 'manage_master_data'),
('OPERATOR_acad', 'OPERATOR', 'manage_academic'),
('OPERATOR_att', 'OPERATOR', 'manage_attendance'),
('PENGASUH_dash', 'PENGASUH', 'view_dashboard_pengasuh'),
('PENGASUH_prog', 'PENGASUH', 'view_santri_progress'),
('MUSTAHIQ_grades', 'MUSTAHIQ', 'input_grades'),
('MUSTAHIQ_hafalan', 'MUSTAHIQ', 'manage_hafalan'),
('MUSTAHIQ_raport', 'MUSTAHIQ', 'generate_raport'),
('MUNAWIB_scan', 'MUNAWIB', 'scan_qr_class'),
('MUNAWIB_att', 'MUNAWIB', 'manage_class_attendance'),
('WALI_child', 'WALI_SANTRI', 'view_child_progress')
ON CONFLICT (id) DO NOTHING;

-- 4. Tahun Ajaran & Semester
INSERT INTO tahun_ajaran (id, nama, tanggal_mulai, tanggal_selesai, aktif) VALUES 
('2026-2027', '2026/2027', '2026-07-15', '2027-06-20', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO semester (id, tahun_ajaran_id, nama, aktif) VALUES 
('2026-2027-ganjil', '2026-2027', 'Ganjil', TRUE),
('2026-2027-genap', '2026-2027', 'Genap', FALSE)
ON CONFLICT (id) DO NOTHING;

-- 5. System Settings
INSERT INTO settings (id, nama_pondok, alamat, telepon, logo_url, tahun_ajaran_aktif_id, semester_aktif_id, tampilkan_ranking, nama_pengasuh, raport_template) VALUES 
('system', 'Pondok Pesantren Anwarul Hidayah', 'Jl. Pesantren No. 01, Jawa Timur', '081234567890', '/logo.png', '2026-2027', '2026-2027-ganjil', TRUE, 'K.H. M. Anwarul Hidayah', NULL)
ON CONFLICT (id) DO NOTHING;

-- 6. Ustadz
INSERT INTO ustadz (id, nama, nomor_hp, alamat, status_aktif) VALUES 
('UST-WR', 'Ust. Wahyu Romadon', '081200000001', 'Pondok Pesantren Anwarul Hidayah', TRUE),
('UST-AM', 'Ust. Alwi Mustaqim', '081200000002', 'Pondok Pesantren Anwarul Hidayah', TRUE),
('UST-IH', 'Ust. Irfaul Huda', '081200000003', 'Pondok Pesantren Anwarul Hidayah', TRUE),
('UST-MK', 'Ust. M. Khamdan', '081200000004', 'Pondok Pesantren Anwarul Hidayah', TRUE),
('UST-LK', 'Ust. M. Lu''lu Khulaluddin', '081200000005', 'Pondok Pesantren Anwarul Hidayah', TRUE),
('UST-AB', 'Ust. Abdul Basith', '081200000006', 'Pondok Pesantren Anwarul Hidayah', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 7. Wali Santri
INSERT INTO wali_santri (id, nama, nomor_hp, alamat, status_aktif) VALUES 
('WALI001', 'H. Sulaiman', '081298765432', 'Jl. Mawar No. 10, Surabaya', TRUE),
('WALI002', 'Drs. H. Abdullah', '081398765433', 'Jl. Melati No. 22, Malang', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 8. Users (Password: 'admin123' | Hash SHA-256: 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9)
INSERT INTO users (id, username, password_hash, role_id, name, email, ustadz_id, wali_id, active, must_change_password) VALUES 
('USR001', 'admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'SUPER_ADMIN', 'Super Admin', 'admin@anwarulhidayah.com', NULL, NULL, TRUE, FALSE),
('USR002', 'operator', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'OPERATOR', 'Operator Pondok', 'operator@anwarulhidayah.com', NULL, NULL, TRUE, FALSE),
('USR003', 'pengasuh', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'PENGASUH', 'K.H. Anwarul Hidayah', 'pengasuh@anwarulhidayah.com', NULL, NULL, TRUE, FALSE),
('USR004', 'mustahiq1', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'MUSTAHIQ', 'Ust. Wahyu Romadon', 'mustahiq@anwarulhidayah.com', 'UST-WR', NULL, TRUE, FALSE),
('USR005', 'munawib1', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'MUNAWIB', 'Ust. Alwi Mustaqim', 'munawib@anwarulhidayah.com', 'UST-AM', NULL, TRUE, FALSE),
('USR007', 'wali1', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'WALI_SANTRI', 'H. Sulaiman (Wali Ahmad Zaki)', 'wali@anwarulhidayah.com', NULL, 'WALI001', TRUE, FALSE)
ON CONFLICT (id) DO NOTHING;

-- 9. Kamar & Kelas
INSERT INTO kamar (id, nama_kamar, kapasitas, jumlah_penghuni) VALUES 
('KMR-A1', 'Kamar Al-Fatihah (A1)', 15, 2),
('KMR-B1', 'Kamar Al-Baqarah (B1)', 20, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO kelas (id, nama_kelas, tingkatan, wali_kelas_id) VALUES 
('QR-IDA', 'Kelas I''dadiyah', 'I''dadiyah', 'UST-WR'),
('QR-IUL', 'Kelas Ibtida Ula', 'Ibtida', 'UST-AM'),
('QR-IWS', 'Kelas Ibtida Wustho', 'Ibtida', 'UST-IH'),
('QR-IUY', 'Kelas Ibtida Ulya', 'Ibtida', 'UST-MK'),
('QR-TSU', 'Kelas Tsanawi Ula', 'Tsanawi', 'UST-LK')
ON CONFLICT (id) DO NOTHING;

-- 10. QR Kelas
INSERT INTO qr_kelas (id, kelas_id) VALUES 
('QR-IDA', 'QR-IDA'),
('QR-IUL', 'QR-IUL'),
('QR-IWS', 'QR-IWS'),
('QR-IUY', 'QR-IUY'),
('QR-TSU', 'QR-TSU')
ON CONFLICT (id) DO NOTHING;

-- 11. Kitab / Mapel (Teks Arab)
INSERT INTO kitab_mapel (id, nama_kitab_mapel, keterangan) VALUES 
('MAPEL-ALALA', 'العَلاَلَة', 'الأخلاق'),
('MAPEL-TARIKH', 'تَارِيخُ الأَنْبِيَاءِ', 'التاريخ'),
('MAPEL-ROSUN', 'رَأْسُ السِّيرَةِ', 'التاريخ'),
('MAPEL-FASHOLATAN', 'فَصَلَاتَانْ عُبُودِيَّة', 'الفقه'),
('MAPEL-ZADUL', 'زَادُ الْمُبْتَدِئِ', 'الفقه'),
('MAPEL-KITABAH', 'الكِتَابَةُ وَالقِرَاءَةُ', 'المهارة'),
('MAPEL-KHULASHOH1', 'خُلَاصَةُ نُورِ اليَقِينِ ١', 'التاريخ'),
('MAPEL-MATLAB', 'مَطْلَبُ التَّصْرِيفِ', 'الصرف'),
('MAPEL-SAFINAH', 'سَفِينَةُ النَّجَاةِ', 'الفقه'),
('MAPEL-AQIDAH', 'عَقِيدَةُ العَوَامِّ', 'التوحيد'),
('MAPEL-SIBYAN', 'هِدَايَةُ الصِّبْيَانِ', 'التجويد'),
('MAPEL-NATSAR', 'قَوَاعِدُ النَّثْرِ', 'الصرف'),
('MAPEL-AWAMIL', 'العَوَامِلُ الجُرْجَانِيَّة', 'النحو'),
('MAPEL-SULAM', 'سُلَّمُ التَّوْفِيقِ', 'الفقه'),
('MAPEL-JURUMIYAH', 'الآجُرُّومِيَّة', 'النحو'),
('MAPEL-SHORFIYAH1', 'القَوَاعِدُ الصَّرْفِيَّةُ ١', 'الصرف'),
('MAPEL-TASHRIF1', 'التَّصْرِيفُ الاِصْطِلَاحِي', 'الصرف'),
('MAPEL-ARBAIN', 'الأَرْبَعُونَ النَّوَوِيَّة', 'الحديث'),
('MAPEL-TIJAN', 'تِيجَانُ الدُّرُورِي', 'التوحيد'),
('MAPEL-TUHFATUL', 'تُحْفَةُ الأَطْفَالِ', 'التجويد'),
('MAPEL-KHULASHOH2', 'خُلَاصَةُ نُورِ اليَقِينِ ٢', 'التاريخ'),
('MAPEL-WASHOYA', 'وَصَايَا الآبَاءِ لِلأَبْنَاءِ', 'الأخلاق'),
('MAPEL-FATHUL1', 'فَتْحُ القَرِيبِ المُجِيبِ ١', 'الفقه'),
('MAPEL-IMRITHI', 'نَظْمُ العِمْرِيطِي', 'النحو'),
('MAPEL-SHORFIYAH2', 'القَوَاعِدُ الصَّرْفِيَّةُ ٢', 'الصرف'),
('MAPEL-KHULASHOH3', 'خُلَاصَةُ نُورِ اليَقِينِ ٣', 'التاريخ'),
('MAPEL-JAZARIYAH', 'المَنْظُومَةُ الجَزَرِيَّة', 'التجوid'),
('MAPEL-SANUSI', 'مَتْنُ السَّنُوسِيَّة', 'التوحيد'),
('MAPEL-TASHRIF2', 'التَّصْرِيفُ اللُّغَوِي', 'الصرف'),
('MAPEL-FATHUL2', 'فَتْحُ القَرِيبِ المُجِيبِ ٢', 'الفقه'),
('MAPEL-FUSHUL', 'الفُصُولُ الفِكْرِيَّة', 'الفقه'),
('MAPEL-JAMIUL2', 'جَامِعُ العُلُومِ وَالحِكَمِ ٢', 'الحديث'),
('MAPEL-TAISHIR', 'تَيْسِيرُ الخَلَّاقِ', 'الأخلاق'),
('MAPEL-MAQSUD', 'مَقْصُودُ التَّصْرِيفِ', 'الصرف'),
('MAPEL-KIFAYATUL', 'كِفَايَةُ العَوَامِّ', 'التوحيد')
ON CONFLICT (id) DO NOTHING;

-- 12. Kitab Nadzom (Teks Arab)
INSERT INTO kitab_nadzom (id, nama_kitab, jumlah_bait) VALUES 
('NADZOM-ALALA', 'العَلاَلَة', 74),
('NADZOM-IMRITHI', 'نَظْمُ العِمْرِيطِي', 254),
('NADZOM-JAZARIYAH', 'المَنْظُومَةُ الجَزَرِيَّة', 120),
('NADZOM-ALFIYAH', 'أَلْفِيَّةُ ابْنِ مَالِكٍ', 1002),
('NADZOM-AQIDAH', 'عَقِيدَةُ العَوَامِّ', 57),
('NADZOM-TUHFAH', 'تُحْفَةُ الأَطْفَالِ', 61),
('NADZOM-MAQSUD', 'مَقْصُودُ التَّصْرِيفِ', 113)
ON CONFLICT (id) DO NOTHING;

-- 13. Target Hafalan Nadzom per Kelas
INSERT INTO target_hafalan_nadzom (id, kelas_id, kitab_nadzom_id, bait_mulai, bait_selesai) VALUES 
('TGT-IDA', 'QR-IDA', 'NADZOM-ALALA', 1, 74),
('TGT-IUL', 'QR-IUL', 'NADZOM-AQIDAH', 1, 57),
('TGT-IWS', 'QR-IWS', 'NADZOM-TUHFAH', 1, 61),
('TGT-IUY', 'QR-IUY', 'NADZOM-IMRITHI', 1, 254),
('TGT-TSU', 'QR-TSU', 'NADZOM-ALFIYAH', 1, 250)
ON CONFLICT (id) DO NOTHING;

-- 14. Jadwal Madrasah
INSERT INTO jadwal (id, hari, jam_mulai, jam_selesai, kelas_id, kitab_mapel_id, ustadz_id, tahun_ajaran_id, semester_id) VALUES 
('JDW-IDA-1', 'Sabtu', '08:00', '09:30', 'QR-IDA', 'MAPEL-ALALA', 'UST-WR', '2026-2027', '2026-2027-ganjil'),
('JDW-IDA-2', 'Ahad', '08:00', '09:30', 'QR-IDA', 'MAPEL-TARIKH', 'UST-AB', '2026-2027', '2026-2027-ganjil'),
('JDW-IDA-3', 'Senin', '08:00', '09:30', 'QR-IDA', 'MAPEL-ROSUN', 'UST-WR', '2026-2027', '2026-2027-ganjil'),
('JDW-IUL-1', 'Sabtu', '08:00', '09:30', 'QR-IUL', 'MAPEL-KHULASHOH1', 'UST-AB', '2026-2027', '2026-2027-ganjil'),
('JDW-IUL-2', 'Sabtu', '09:45', '11:15', 'QR-IUL', 'MAPEL-MATLAB', 'UST-AB', '2026-2027', '2026-2027-ganjil'),
('JDW-IUL-3', 'Ahad', '08:00', '09:30', 'QR-IUL', 'MAPEL-SAFINAH', 'UST-AM', '2026-2027', '2026-2027-ganjil')
ON CONFLICT (id) DO NOTHING;

-- 15. Santri
INSERT INTO santri (id, nis, nama_lengkap, jenis_kelamin, tempat_lahir, tanggal_lahir, alamat, nama_ayah, nama_ibu, nomor_hp_wali, kelas_id, kamar_id, tahun_masuk, status_aktif, wali_id) VALUES 
('SNT001', '2026001', 'Ahmad Zaki Mubarak', 'L', 'Surabaya', '2010-05-14', 'Jl. Mawar No. 10, Surabaya', 'H. Sulaiman', 'Hj. Aminah', '081298765432', 'QR-IDA', 'KMR-A1', '2026', TRUE, 'WALI001'),
('SNT002', '2026002', 'Muhammad Farhan', 'L', 'Malang', '2010-08-21', 'Jl. Melati No. 22, Malang', 'Drs. H. Abdullah', 'Siti Maryam', '081398765433', 'QR-IDA', 'KMR-A1', '2026', TRUE, 'WALI002')
ON CONFLICT (id) DO NOTHING;

-- 16. Riwayat Kelas
INSERT INTO riwayat_kelas (id, santri_id, kelas_id, tahun_ajaran_id, semester_id) VALUES 
('RK001', 'SNT001', 'QR-IDA', '2026-2027', '2026-2027-ganjil'),
('RK002', 'SNT002', 'QR-IDA', '2026-2027', '2026-2027-ganjil')
ON CONFLICT (id) DO NOTHING;

-- 17. Pengumuman
INSERT INTO pengumuman (id, judul, konten, tanggal, target_roles) VALUES 
('ANN001', 'Selamat Datang Tahun Ajaran 2026/2027', 'Kegiatan pembelajaran madrasah diniyah Anwarul Hidayah resmi dimulai. Harap seluruh santri mematuhi jadwal.', '2026-07-15', 'SUPER_ADMIN,OPERATOR,PENGASUH,MUSTAHIQ,MUNAWIB,WALI_SANTRI')
ON CONFLICT (id) DO NOTHING;
