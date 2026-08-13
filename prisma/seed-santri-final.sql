CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Data 7 MTs
INSERT INTO kelas (id, nama, jenjang) VALUES (gen_random_uuid(), '7 MTs', 'MTs') ON CONFLICT (nama) DO NOTHING;

INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2601070001', 'Atqanul Ummah Ahmad', (SELECT id FROM kelas WHERE nama = '7 MTs'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Atqanul Ummah Ahmad');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2601070002', 'Abdul Aziz Ali', (SELECT id FROM kelas WHERE nama = '7 MTs'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Abdul Aziz Ali');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2601070003', 'Abdul Hakim', (SELECT id FROM kelas WHERE nama = '7 MTs'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Abdul Hakim');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2601070004', 'Ahmad Farros Al Barqy', (SELECT id FROM kelas WHERE nama = '7 MTs'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Ahmad Farros Al Barqy');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2601070005', 'Andi Ibra Faeyza Hasan Alnasr', (SELECT id FROM kelas WHERE nama = '7 MTs'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Andi Ibra Faeyza Hasan Alnasr');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2601070006', 'Azka Panji Kusuma', (SELECT id FROM kelas WHERE nama = '7 MTs'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Azka Panji Kusuma');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2601070007', 'Fariq Malaibui', (SELECT id FROM kelas WHERE nama = '7 MTs'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Fariq Malaibui');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2601070008', 'Haidar Ayyubi', (SELECT id FROM kelas WHERE nama = '7 MTs'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Haidar Ayyubi');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2601070009', 'Khalish', (SELECT id FROM kelas WHERE nama = '7 MTs'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Khalish');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2601070010', 'Labibullah El Fatih', (SELECT id FROM kelas WHERE nama = '7 MTs'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Labibullah El Fatih');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2601070011', 'M Fazril Alkais', (SELECT id FROM kelas WHERE nama = '7 MTs'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'M Fazril Alkais');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2601070012', 'M Naufal Alfaniri', (SELECT id FROM kelas WHERE nama = '7 MTs'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'M Naufal Alfaniri');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2601070013', 'Muhammad Rifqi Hamid', (SELECT id FROM kelas WHERE nama = '7 MTs'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Muhammad Rifqi Hamid');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2601070014', 'Muh Asrorin Da Silva', (SELECT id FROM kelas WHERE nama = '7 MTs'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Muh Asrorin Da Silva');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2601070015', 'Muhammad Hafidz Reo Afelano', (SELECT id FROM kelas WHERE nama = '7 MTs'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Muhammad Hafidz Reo Afelano');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2601070016', 'Muhammad Yahya Ayyash', (SELECT id FROM kelas WHERE nama = '7 MTs'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Muhammad Yahya Ayyash');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2601070017', 'Naufal Dzakiy Purnama', (SELECT id FROM kelas WHERE nama = '7 MTs'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Naufal Dzakiy Purnama');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2601070018', 'Rifqi Arsyad Fadilah', (SELECT id FROM kelas WHERE nama = '7 MTs'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Rifqi Arsyad Fadilah');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2601070019', 'Muhammad Azzam Al Hafiz', (SELECT id FROM kelas WHERE nama = '7 MTs'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Muhammad Azzam Al Hafiz');

-- Data IL
INSERT INTO kelas (id, nama, jenjang) VALUES (gen_random_uuid(), 'IL', 'Islamiyah') ON CONFLICT (nama) DO NOTHING;

INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2602070001', 'Abdullah Rasyid', (SELECT id FROM kelas WHERE nama = 'IL'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Abdullah Rasyid');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2602070002', 'Abdurrahim Pati Raja', (SELECT id FROM kelas WHERE nama = 'IL'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Abdurrahim Pati Raja');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2602070003', 'Daffa Muammar Dzaki', (SELECT id FROM kelas WHERE nama = 'IL'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Daffa Muammar Dzaki');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2602070004', 'Farid', (SELECT id FROM kelas WHERE nama = 'IL'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Farid');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2602070005', 'Favian Radi', (SELECT id FROM kelas WHERE nama = 'IL'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Favian Radi');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2602070006', 'Fanni Hariri Hamonangan', (SELECT id FROM kelas WHERE nama = 'IL'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Fanni Hariri Hamonangan');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2602070007', 'Fiqri Ramdan Handoko', (SELECT id FROM kelas WHERE nama = 'IL'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Fiqri Ramdan Handoko');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2602070008', 'Hibban Hibaturrahman', (SELECT id FROM kelas WHERE nama = 'IL'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Hibban Hibaturrahman');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2602070009', 'Khubaib Abdul Aziz', (SELECT id FROM kelas WHERE nama = 'IL'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Khubaib Abdul Aziz');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2602070010', 'Ken Alfarezha Haryadi', (SELECT id FROM kelas WHERE nama = 'IL'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Ken Alfarezha Haryadi');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2602070011', 'Lalu Muhamad Rizky Ananda', (SELECT id FROM kelas WHERE nama = 'IL'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Lalu Muhamad Rizky Ananda');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2602070012', 'Miizan Alghifary Dizlilar', (SELECT id FROM kelas WHERE nama = 'IL'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Miizan Alghifary Dizlilar');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2602070013', 'Muhammad Hafidz Abdurrahman', (SELECT id FROM kelas WHERE nama = 'IL'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Muhammad Hafidz Abdurrahman');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2602070014', 'Muhammad Khoirul Azzam', (SELECT id FROM kelas WHERE nama = 'IL'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Muhammad Khoirul Azzam');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2602070015', 'Muhammad Rasyid Ridho', (SELECT id FROM kelas WHERE nama = 'IL'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Muhammad Rasyid Ridho');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2602070016', 'Muhammad Rizky', (SELECT id FROM kelas WHERE nama = 'IL'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Muhammad Rizky');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2602070017', 'Nurcahya Eka Putra', (SELECT id FROM kelas WHERE nama = 'IL'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Nurcahya Eka Putra');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2602070018', 'Panji Ahmad', (SELECT id FROM kelas WHERE nama = 'IL'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Panji Ahmad');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2602070019', 'Iman Prayogo', (SELECT id FROM kelas WHERE nama = 'IL'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Iman Prayogo');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2602070020', 'Syeh Al Bani Irsyad Amrulloh', (SELECT id FROM kelas WHERE nama = 'IL'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Syeh Al Bani Irsyad Amrulloh');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2602070021', 'Wahyu Hidayat', (SELECT id FROM kelas WHERE nama = 'IL'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Wahyu Hidayat');
INSERT INTO santri_aktif (id, nis, nama_lengkap, kelas_id, jenis_kelamin)
SELECT gen_random_uuid(), '2602070022', 'Zakaria Reynaldo', (SELECT id FROM kelas WHERE nama = 'IL'), 'L'
WHERE NOT EXISTS (SELECT 1 FROM santri_aktif WHERE nama_lengkap = 'Zakaria Reynaldo');

-- Data Asatidz Resmi (Sinkron 100% dengan Master Data Guru)
INSERT INTO pegawai (id, nip, nama_lengkap, no_hp, email, kategori_pegawai, jabatan, mata_pelajaran) VALUES
(gen_random_uuid(), '3322183101990002', 'Abdil Aziz, S.Pd, B.A', '085856160862', 'abdilaziz3101@gmail.com', 'GURU', 'Kabid Kurikulum & Pengajar', 'Bahasa Arab'),
(gen_random_uuid(), '3202082102690001', 'Ade Supyana S. Pd. I', '085775053526', 'supyanaade33@gmail.com', 'GURU', 'Pengajar / Guru', 'Bahasa Indonesia'),
(gen_random_uuid(), '6408012910950001', 'Agus Cahyono', '081251971250', 'aguscahyono2921@gmail.com', 'GURU', 'Wali Kelas MTs & Musyrif', 'Khitobah, Tadribat Alal Anmath'),
(gen_random_uuid(), '3511110204810005', 'Arifin Saefullah, A.Ma, Dpl, Lc, M.M, M.Pd', '087836270966', 'abahjawiy@gmail.com', 'GURU', 'Pengajar / Guru', 'Akidah'),
(gen_random_uuid(), '1402011503990001', 'Hardiansyah, S. Pd', '082272804497', 'hardiansyahhd51@gmail.com', 'GURU', 'Pengajar / Guru', 'IPA Terpadu'),
(gen_random_uuid(), '3301022411900005', 'Imron Abdillah', '081234566408', 'imr.abd.99@gmail.com', 'GURU', 'Kabid Kurikulum & Wali Kelas IL', 'Nahwu, Tahsin Al-Quran'),
(gen_random_uuid(), '3172020212840005', 'Maulidin Bachtiar', '0895332071063', 'thiarz17@gmail.com', 'GURU', 'Pengajar / Guru', 'Bahasa Inggris'),
(gen_random_uuid(), '3211051605920001', 'Muhammad Iqbal, S.Pd', '085777919274', 'muhammadiqbal.mi118@gmail.com', 'GURU', 'Musyrif & Guru', 'Shorf, Tahsin Al-Quran'),
(gen_random_uuid(), '2026089826', 'Muhammad Maulana Rizki', NULL, 'muhammad@pesantren-alimam.com', 'GURU', 'Pengajar / Guru', 'Bahasa Inggris'),
(gen_random_uuid(), '3202290106940002', 'Muhammad Thoriq Ibn Ziyad, Lc, M.Ag', '085797220373', 'biezie.sundanese@gmail.com', 'GURU', 'Pengajar / Guru', 'Hadis, Siroh Nabi'),
(gen_random_uuid(), '3202091101990007', 'Ramdan', '085703459162', 'Marjinal145@gmail.com', 'GURU', 'Pengajar / Guru', 'TIK'),
(gen_random_uuid(), '1609010706970003', 'Rieza Eka Tomara, S.Kom', '081271414441', 'riezaekatomara@gmail.com', 'GURU', 'Kabid IT & Pengajar', 'Matematika'),
(gen_random_uuid(), '2026087393', 'Teguh Hudaya, Lc, M.M', '081398225358', 'teguh.hudaya@gmail.com', 'GURU', 'Pengajar / Guru', 'Entrepreneurship'),
(gen_random_uuid(), '2026089999', 'Ust. Presentasi (Resmi), Lc.', NULL, 'presentasi.guru@pesantren-alimam.com', 'GURU', 'Pengajar / Guru', 'Bahasa Arab, Tahfidz'),
(gen_random_uuid(), '2026086778', 'Wahab Rajasam, M.Pd', '081326611671', 'prof.wahabrajasam35@gmail.com', 'GURU', 'Mudir Pesantren & Pengajar', 'Fiqh'),
(gen_random_uuid(), '1901072302950001', 'Wahyudi Pranata, Lc', '082316228728', 'wahyudipra95@gmail.com', 'GURU', 'Kabid Pengasuhan & Musyrif', 'Bahasa Arab')
ON CONFLICT (nama_lengkap) DO NOTHING;

