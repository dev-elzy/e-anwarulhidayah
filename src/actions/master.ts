"use server";

import { getDb } from "@/lib/db";
import { auth } from "@/auth";
import { 
  santri, 
  ustadz, 
  kelas, 
  kamar, 
  auditLogs,
  users,
  absensiSantri,
  nilaiSantri,
  catatanSantri,
  pelanggaranSantri,
  setoranNadzom,
  riwayatKelas,
  absensiUstadz,
  izinGuru,
  jadwal,
  guruPengganti,
  notifications,
  wali_santri,
  classSessions,
  catatanPembelajaran
} from "@/lib/db/schema";
import { eq, like, and, or, sql } from "drizzle-orm";
import { hashPassword, verifyPassword } from "@/utils/crypto";

// Log activity helper
async function logActivity(userId: string | null, action: string, details: string) {
  const db = getDb();
  if (!db) return;
  try {
    const logId = "LOG-" + Math.random().toString(36).substring(2, 11).toUpperCase();
    await db.insert(auditLogs).values({
      id: logId,
      userId,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}

function isPlaceholderPhone(phone?: string | null) {
  if (!phone) return true;
  const clean = phone.replace(/[^0-9]/g, "");
  if (clean.length < 8) return true;
  // If it's like 080000000000 or similar with trailing repeating digits
  if (/^08(\d)\1+$/.test(clean)) return true;
  // If it consists of all the same digit
  if (/^(\d)\1+$/.test(clean)) return true;
  // Common placeholders
  if (clean === "080000000000" || clean === "12345678" || clean === "08123456789" || clean === "081234567890") return true;
  return false;
}

// 1. Santri Actions
export async function getSantriList(search?: string, gender?: string, kelasId?: string, includeAlumni = false) {
  const db = getDb();
  if (!db) return [];

  try {
    const conditions = [];
    
    if (!includeAlumni) {
      conditions.push(eq(santri.statusAktif, true));
    }
    
    if (search) {
      conditions.push(or(
        like(santri.namaLengkap, `%${search}%`),
        like(santri.nis, `%${search}%`)
      ));
    }
    
    if (gender && gender !== "all") {
      conditions.push(eq(santri.jenisKelamin, gender));
    }

    if (kelasId && kelasId !== "all") {
      conditions.push(eq(santri.kelasId, kelasId));
    }

    const query = db.select().from(santri);
    
    if (conditions.length > 0) {
      return await query.where(and(...conditions));
    }
    
    return await query;
  } catch (error) {
    console.error("Failed to load santri:", error);
    return [];
  }
}

export async function createSantri(data: any, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung." };

  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== "OPERATOR" && session.user.role !== "SUPER_ADMIN")) {
      return { error: "Akses ditolak: Anda tidak memiliki izin untuk melakukan tindakan ini." };
    }
    const verifiedOperatorId = session.user.id || operatorId;

    const id = "SNT-" + Math.random().toString(36).substring(2, 11).toUpperCase();
    await db.insert(santri).values({
      id,
      nis: data.nis,
      namaLengkap: data.namaLengkap,
      fotoUrl: data.fotoUrl || null,
      jenisKelamin: data.jenisKelamin,
      tempatLahir: data.tempatLahir,
      tanggalLahir: data.tanggalLahir,
      alamat: data.alamat,
      namaAyah: data.namaAyah,
      namaIbu: data.namaIbu,
      nomorHpWali: data.nomorHpWali,
      kelasId: data.kelasId || null,
      kamarId: data.kamarId || null,
      tahunMasuk: data.tahunMasuk,
      statusAktif: true,
      waliId: null
    });

    await logActivity(verifiedOperatorId, "CREATE_SANTRI", `Menambahkan santri baru: ${data.namaLengkap} (${data.nis})`);
    return { success: true, message: "Data santri berhasil ditambahkan." };
  } catch (error: any) {
    console.error("Failed to create santri:", error);
    return { error: error.message || "Gagal menambahkan data santri." };
  }
}

export async function deleteSantri(id: string, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung." };

  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== "OPERATOR" && session.user.role !== "SUPER_ADMIN")) {
      return { error: "Akses ditolak: Anda tidak memiliki izin untuk melakukan tindakan ini." };
    }
    const verifiedOperatorId = session.user.id || operatorId;

    const s = await db.select().from(santri).where(eq(santri.id, id)).limit(1);
    if (s.length === 0) return { error: "Santri tidak ditemukan." };

    // Cascade delete: hapus semua data terkait santri terlebih dahulu
    await db.delete(absensiSantri).where(eq(absensiSantri.santriId, id));
    await db.delete(nilaiSantri).where(eq(nilaiSantri.santriId, id));
    await db.delete(catatanSantri).where(eq(catatanSantri.santriId, id));
    await db.delete(pelanggaranSantri).where(eq(pelanggaranSantri.santriId, id));
    await db.delete(setoranNadzom).where(eq(setoranNadzom.santriId, id));
    await db.delete(riwayatKelas).where(eq(riwayatKelas.santriId, id));
    // Hapus notifikasi terkait santri jika ada
    await db.delete(notifications).where(eq(notifications.userId, id)).catch(() => {});

    const waliId = s[0].waliId;

    // Hapus data santri utama
    await db.delete(santri).where(eq(santri.id, id));

    // Cascade delete Wali Santri dan akunnya jika tidak ada santri lain yang terhubung
    if (waliId) {
      const otherStudents = await db.select().from(santri).where(eq(santri.waliId, waliId));
      if (otherStudents.length === 0) {
        // Hapus akun pengguna wali santri terlebih dahulu
        await db.delete(users).where(and(eq(users.roleId, "WALI_SANTRI"), eq(users.waliId, waliId)));
        // Hapus data profil wali santri
        await db.delete(wali_santri).where(eq(wali_santri.id, waliId));
      }
    }

    await logActivity(verifiedOperatorId, "DELETE_SANTRI", `Menghapus santri: ${s[0].namaLengkap} (${s[0].nis})`);
    return { success: true, message: "Data santri berhasil dihapus." };
  } catch (error: any) {
    console.error("Failed to delete santri:", error);
    return { error: "Gagal menghapus data santri. Pastikan tidak ada data terkait yang tersisa." };
  }
}

// 2. Ustadz Actions
export async function getUstadzList() {
  const db = getDb();
  if (!db) return [];
  try {
    const list = await db.select().from(ustadz);
    const classes = await db.select().from(kelas);
    const userList = await db.select().from(users);

    return list.map((u: any) => {
      const assignedKelas = classes.find((k: any) => k.waliKelasId === u.id);
      const linkedUser = userList.find((usr: any) => usr.ustadzId === u.id);
      const role = linkedUser ? linkedUser.roleId : (assignedKelas ? "MUSTAHIQ" : "MUNAWIB");
      return {
        ...u,
        peran: role,
        kelasWali: assignedKelas ? assignedKelas.namaKelas : null,
        kelasWaliId: assignedKelas ? assignedKelas.id : null,
        user: linkedUser || null,
      };
    });
  } catch (error) {
    console.error("Failed to get ustadz:", error);
    return [];
  }
}

export async function generateUstadzUsername(fullName: string): Promise<string> {
  if (!fullName) return "ustadz";
  
  // 1. Remove title prefixes & honorifics
  const clean = fullName
    .replace(/\b(k\.h\.|kh\.|kyai|kiai|habib|gus|ust\.|ustadz|ustad|drs\.|dr\.|lc\.|m\.pd|s\.pd|s\.ag|m\.ag)\b/gi, "")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()'"’]/g, " ")
    .trim();

  // 2. Split words
  const words = clean.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return "ustadz";

  const skipWords = new Set(["m", "muh", "muhammad", "moch", "mochamad", "mohammad", "ahmad", "achmad", "siti", "nur"]);
  
  let target = words[0];
  if (words.length > 1) {
    if (skipWords.has(words[0].toLowerCase())) {
      target = words[1];
    }
  }

  if (words.length > 2 && (target.toLowerCase() === "lulu" || target.toLowerCase() === "lu" || skipWords.has(target.toLowerCase()))) {
    target = words[2];
  }

  const result = target.toLowerCase().replace(/[^a-z0-9]/g, "");
  return result || "ustadz";
}

export async function createUstadz(data: any, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung." };

  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== "OPERATOR" && session.user.role !== "SUPER_ADMIN")) {
      return { error: "Akses ditolak: Anda tidak memiliki izin untuk melakukan tindakan ini." };
    }
    const verifiedOperatorId = session.user.id || operatorId;

    const id = "UST-" + Math.random().toString(36).substring(2, 11).toUpperCase();
    await db.insert(ustadz).values({
      id,
      nama: data.nama,
      nomorHp: data.nomorHp,
      alamat: data.alamat,
      fotoUrl: data.fotoUrl || null,
      statusAktif: true
    });

    // If assigned as Mustahiq to a specific class
    if (data.peran === "MUSTAHIQ" && data.kelasWaliId) {
      await db.update(kelas).set({ waliKelasId: id }).where(eq(kelas.id, data.kelasWaliId));
    }

    await logActivity(verifiedOperatorId, "CREATE_USTADZ", `Menambahkan ustadz baru: ${data.nama} (Peran: ${data.peran || "MUNAWIB"})`);
    return { success: true, message: "Data ustadz berhasil ditambahkan.", id };
  } catch (error: any) {
    console.error("Failed to create ustadz:", error);
    return { error: error.message || "Gagal menambahkan ustadz." };
  }
}

// 3. Kelas & Kamar Actions
export async function getKelasList() {
  const db = getDb();
  if (!db) return [];
  try {
    return await db.select().from(kelas);
  } catch (error) {
    console.error("Failed to get kelas:", error);
    return [];
  }
}

export async function getKamarList() {
  const db = getDb();
  if (!db) return [];
  try {
    return await db.select().from(kamar);
  } catch (error) {
    console.error("Failed to get kamar:", error);
    return [];
  }
}

export async function updateSantri(id: string, data: any, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung." };

  try {
    await db.update(santri).set({
      nis: data.nis,
      namaLengkap: data.namaLengkap,
      jenisKelamin: data.jenisKelamin,
      tempatLahir: data.tempatLahir,
      tanggalLahir: data.tanggalLahir,
      alamat: data.alamat,
      namaAyah: data.namaAyah,
      namaIbu: data.namaIbu,
      nomorHpWali: data.nomorHpWali,
      kelasId: data.kelasId || null,
      kamarId: data.kamarId || null,
      tahunMasuk: data.tahunMasuk,
      fotoUrl: data.fotoUrl || null,
    }).where(eq(santri.id, id));

    await logActivity(operatorId, "UPDATE_SANTRI", `Mengubah data santri: ${data.namaLengkap} (${data.nis})`);
    return { success: true, message: "Data santri berhasil diubah." };
  } catch (error: any) {
    console.error("Failed to update santri:", error);
    return { error: error.message || "Gagal mengubah data santri." };
  }
}

export async function updateUstadz(id: string, data: any, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung." };

  try {
    await db.update(ustadz).set({
      nama: data.nama,
      nomorHp: data.nomorHp,
      alamat: data.alamat,
    }).where(eq(ustadz.id, id));

    // Update Mustahiq / Wali Kelas assignment if specified
    if (data.peran === "MUSTAHIQ") {
      // If a class is selected, assign ustadz to it
      if (data.kelasWaliId) {
        // Clear previous classes where this ustadz was wali
        await db.update(kelas).set({ waliKelasId: null }).where(eq(kelas.waliKelasId, id));
        // Assign to new class
        await db.update(kelas).set({ waliKelasId: id }).where(eq(kelas.id, data.kelasWaliId));
      }
      // If ustadz has a user account, sync role to MUSTAHIQ
      await db.update(users).set({ roleId: "MUSTAHIQ" }).where(eq(users.ustadzId, id));
    } else if (data.peran === "MUNAWIB") {
      // Clear any class wali assignments
      await db.update(kelas).set({ waliKelasId: null }).where(eq(kelas.waliKelasId, id));
      // If ustadz has a user account, sync role to MUNAWIB
      await db.update(users).set({ roleId: "MUNAWIB" }).where(eq(users.ustadzId, id));
    }

    await logActivity(operatorId, "UPDATE_USTADZ", `Mengubah data ustadz: ${data.nama}`);
    return { success: true, message: "Data ustadz berhasil diubah." };
  } catch (error: any) {
    console.error("Failed to update ustadz:", error);
    return { error: error.message || "Gagal mengubah data ustadz." };
  }
}

export async function deleteUstadz(id: string, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung." };

  try {
    const u = await db.select().from(ustadz).where(eq(ustadz.id, id)).limit(1);
    if (u.length === 0) return { error: "Ustadz tidak ditemukan." };

    // 1. Nullify references to avoid constraint errors
    await db.update(kelas).set({ waliKelasId: null }).where(eq(kelas.waliKelasId, id));

    // 2. Cascade delete Jadwal & Class Sessions for this Ustadz
    const ustadzJadwalList = await db.select().from(jadwal).where(eq(jadwal.ustadzId, id));
    const jadwalIds = ustadzJadwalList.map((j: any) => j.id);
    if (jadwalIds.length > 0) {
      for (const jid of jadwalIds) {
        // Find sessions for this jadwal
        const sessionList = await db.select().from(classSessions).where(eq(classSessions.jadwalId, jid));
        const sessionIds = sessionList.map((s: any) => s.id);
        if (sessionIds.length > 0) {
          for (const sid of sessionIds) {
            await db.delete(catatanPembelajaran).where(eq(catatanPembelajaran.sessionId, sid));
            await db.delete(absensiUstadz).where(eq(absensiUstadz.sessionId, sid));
            await db.delete(absensiSantri).where(eq(absensiSantri.sessionId, sid));
          }
          await db.delete(classSessions).where(eq(classSessions.jadwalId, jid));
        }
      }
      await db.delete(jadwal).where(eq(jadwal.ustadzId, id));
    }

    // 3. Cascade delete other linked records
    await db.delete(absensiUstadz).where(eq(absensiUstadz.ustadzId, id));
    await db.delete(izinGuru).where(eq(izinGuru.guruId, id));
    await db.delete(izinGuru).where(eq(izinGuru.penggantiId, id)).catch(() => {});
    await db.delete(guruPengganti).where(eq(guruPengganti.ustadzAsliId, id)).catch(() => {});
    await db.delete(guruPengganti).where(eq(guruPengganti.ustadzPenggantiId, id)).catch(() => {});
    await db.delete(setoranNadzom).where(eq(setoranNadzom.ustadzId, id));
    await db.delete(catatanSantri).where(eq(catatanSantri.ustadzId, id));
    await db.delete(pelanggaranSantri).where(eq(pelanggaranSantri.ustadzId, id));
    await db.delete(absensiSantri).where(eq(absensiSantri.ustadzId, id));

    // Hapus user yang terhubung ke ustadz ini (akun login)
    await db.delete(users).where(eq(users.ustadzId, id)).catch(() => {});

    // Hapus ustadz utama
    await db.delete(ustadz).where(eq(ustadz.id, id));
    await logActivity(operatorId, "DELETE_USTADZ", `Menghapus ustadz: ${u[0].nama}`);
    return { success: true, message: "Data ustadz berhasil dihapus." };
  } catch (error: any) {
    console.error("Failed to delete ustadz:", error);
    return { error: "Gagal menghapus data ustadz. Pastikan tidak ada data aktif yang tersisa." };
  }
}

// ==========================================
// 6. ACCOUNT MANAGEMENT (Operator)
// ==========================================

export async function getUsersWithUstadz() {
  const db = getDb();
  if (!db) return [];
  try {
    const ustadzList = await db.select().from(ustadz);
    const userList = await db.select().from(users);
    return ustadzList.map((u: any) => {
      const linkedUser = userList.find((usr: any) => usr.ustadzId === u.id);
      return {
        ...u,
        user: linkedUser || null,
      };
    });
  } catch (error) {
    console.error("Failed to get users with ustadz:", error);
    return [];
  }
}

export async function getUsersWithWali() {
  const db = getDb();
  if (!db) return [];
  try {
    const waliList = await db.select().from(wali_santri);
    const userList = await db.select().from(users).where(sql`${users.waliId} IS NOT NULL`);
    const santriList = await db.select().from(santri);
    return waliList.map((w: any) => {
      const linkedUser = userList.find((usr: any) => usr.waliId === w.id);
      const linkedSantri = santriList.filter((s: any) => s.waliId === w.id);
      return {
        ...w,
        user: linkedUser || null,
        santri: linkedSantri || [],
      };
    });
  } catch (error) {
    console.error("Failed to get users with wali:", error);
    return [];
  }
}

export async function createUstadzAccount(
  ustadzId: string, 
  roleId: "MUSTAHIQ" | "MUNAWIB", 
  operatorId: string,
  customUsername?: string,
  customPassword?: string
) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung." };
  try {
    // Check if ustadz already has an account
    const existing = await db.select().from(users).where(eq(users.ustadzId, ustadzId)).limit(1);
    if (existing.length > 0) return { error: "Ustadz ini sudah memiliki akun." };

    const u = await db.select().from(ustadz).where(eq(ustadz.id, ustadzId)).limit(1);
    if (u.length === 0) return { error: "Ustadz tidak ditemukan." };

    let username = "";
    if (customUsername && customUsername.trim()) {
      username = customUsername.trim().toLowerCase().replace(/[^a-z0-9_.]/g, "");
      if (username.length < 3) return { error: "Username minimal 3 karakter." };
      const check = await db.select().from(users).where(eq(users.username, username)).limit(1);
      if (check.length > 0) {
        return { error: `Username "${username}" sudah digunakan pengguna lain. Silakan pilih username lain.` };
      }
    } else {
      const baseUsername = await generateUstadzUsername(u[0].nama);
      username = baseUsername;
      let count = 1;
      while (true) {
        const check = await db.select().from(users).where(eq(users.username, username)).limit(1);
        if (check.length === 0) break;
        username = `${baseUsername}_${count++}`;
      }
    }

    const initialPassword = customPassword && customPassword.trim().length >= 6 
      ? customPassword.trim() 
      : "pesantren123";
    const passwordHash = await hashPassword(initialPassword);
    const id = "USR-" + Math.random().toString(36).substring(2, 11).toUpperCase();

    await db.insert(users).values({
      id,
      username,
      passwordHash,
      roleId,
      name: u[0].nama,
      email: null,
      ustadzId,
      waliId: null,
      active: true,
      mustChangePassword: customPassword ? false : true,
      createdAt: new Date().toISOString(),
    });

    await logActivity(operatorId, "CREATE_USTADZ_ACCOUNT", `Membuat akun ${roleId} untuk ustadz: ${u[0].nama} (username: ${username})`);
    return { success: true, message: `Akun berhasil dibuat. Username: ${username}, Password: ${initialPassword}`, username };
  } catch (error: any) {
    console.error("Failed to create ustadz account:", error);
    return { error: error.message || "Gagal membuat akun." };
  }
}

export async function createWaliAccount(waliId: string, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung." };
  try {
    // Check if wali already has an account
    const existing = await db.select().from(users).where(eq(users.waliId, waliId)).limit(1);
    if (existing.length > 0) return { error: "Wali santri ini sudah memiliki akun." };

    const w = await db.select().from(wali_santri).where(eq(wali_santri.id, waliId)).limit(1);
    if (w.length === 0) return { error: "Wali santri tidak ditemukan." };

    // Generate username from first related student's name, or fallback to wali's name
    const relatedSantriList = await db.select().from(santri).where(eq(santri.waliId, waliId)).limit(1);
    const santriName = relatedSantriList[0]?.namaLengkap || w[0].nama;
    const nameWords = santriName.trim().split(/\s+/);
    let targetWord = nameWords[0];
    if (nameWords.length > 1) {
      const firstLower = targetWord.toLowerCase().replace(/[^a-z]/g, "");
      if (firstLower === "m" || firstLower === "muhammad" || firstLower === "muh") {
        targetWord = nameWords[1];
      }
    }
    const cleanFirstWord = targetWord.toLowerCase().replace(/[^a-z0-9]/g, "") || "santri";
    const baseUsername = "wali." + cleanFirstWord;

    let username = baseUsername;
    let suffix = 1;
    while (true) {
      const check = await db.select().from(users).where(eq(users.username, username)).limit(1);
      if (check.length === 0) break;
      username = baseUsername + suffix;
      suffix++;
    }

    const DEFAULT_PASSWORD = "pesantren123";
    const passwordHash = await hashPassword(DEFAULT_PASSWORD);
    const id = "USR-" + Math.random().toString(36).substring(2, 11).toUpperCase();

    await db.insert(users).values({
      id,
      username,
      passwordHash,
      roleId: "WALI_SANTRI",
      name: w[0].nama,
      email: null,
      ustadzId: null,
      waliId,
      active: true,
      mustChangePassword: true,
      createdAt: new Date().toISOString(),
    });

    await logActivity(operatorId, "CREATE_WALI_ACCOUNT", `Membuat akun Wali untuk: ${w[0].nama} (username: ${username})`);
    return { success: true, message: `Akun berhasil dibuat. Username: ${username}, Password: ${DEFAULT_PASSWORD}`, username };
  } catch (error: any) {
    console.error("Failed to create wali account:", error);
    return { error: error.message || "Gagal membuat akun." };
  }
}

export async function resetUserPassword(userId: string, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung." };
  try {
    const DEFAULT_PASSWORD = "pesantren123";
    const passwordHash = await hashPassword(DEFAULT_PASSWORD);
    await db.update(users).set({
      passwordHash,
      mustChangePassword: true,
    }).where(eq(users.id, userId));

    await logActivity(operatorId, "RESET_PASSWORD", `Mereset password user ID: ${userId}`);
    return { success: true, message: `Password direset ke: ${DEFAULT_PASSWORD}` };
  } catch (error: any) {
    console.error("Failed to reset password:", error);
    return { error: "Gagal mereset password." };
  }
}

export async function changeUserPassword(userId: string, newPassword: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung." };
  try {
    const session = await auth();
    if (!session?.user || session.user.id !== userId) {
      return { error: "Akses ditolak: Anda hanya dapat mengubah password akun Anda sendiri." };
    }

    if (newPassword.length < 8) return { error: "Password minimal 8 karakter." };
    const passwordHash = await hashPassword(newPassword);
    await db.update(users).set({
      passwordHash,
      mustChangePassword: false,
    }).where(eq(users.id, userId));

    return { success: true, message: "Password berhasil diperbarui." };
  } catch (error: any) {
    console.error("Failed to change password:", error);
    return { error: "Gagal mengubah password." };
  }
}

export async function updateUserAccount(
  userId: string,
  data: { username?: string; roleId?: string; password?: string; active?: boolean },
  operatorId: string
) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung." };
  try {
    const existing = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (existing.length === 0) return { error: "User tidak ditemukan." };

    const updatePayload: any = {};

    if (data.username && data.username.trim() !== existing[0].username) {
      const cleanUsername = data.username.trim().toLowerCase().replace(/[^a-z0-9_.]/g, "");
      if (cleanUsername.length < 3) return { error: "Username minimal 3 karakter." };
      
      const check = await db.select().from(users).where(eq(users.username, cleanUsername)).limit(1);
      if (check.length > 0 && check[0].id !== userId) {
        return { error: `Username "${cleanUsername}" sudah digunakan oleh akun lain.` };
      }
      updatePayload.username = cleanUsername;
    }

    if (data.roleId && ["MUSTAHIQ", "MUNAWIB", "OPERATOR", "PENGASUH", "SUPER_ADMIN", "WALI_SANTRI"].includes(data.roleId)) {
      updatePayload.roleId = data.roleId;
    }

    if (data.password && data.password.trim().length >= 6) {
      updatePayload.passwordHash = await hashPassword(data.password.trim());
      updatePayload.mustChangePassword = false;
    }

    if (data.active !== undefined) {
      updatePayload.active = data.active;
    }

    if (Object.keys(updatePayload).length > 0) {
      await db.update(users).set(updatePayload).where(eq(users.id, userId));
    }

    await logActivity(operatorId, "UPDATE_USER_ACCOUNT", `Memperbarui akun user: ${existing[0].name} (${updatePayload.username || existing[0].username})`);
    return { success: true, message: "Akun berhasil diperbarui." };
  } catch (error: any) {
    console.error("Failed to update user account:", error);
    return { error: error.message || "Gagal memperbarui akun." };
  }
}

export async function updateSelfProfile(
  userId: string,
  data: { username?: string; currentPassword?: string; newPassword?: string }
) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung." };
  try {
    const session = await auth();
    if (!session?.user || session.user.id !== userId) {
      return { error: "Akses ditolak: Anda hanya dapat memperbarui profil akun Anda sendiri." };
    }

    const u = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (u.length === 0) return { error: "Pengguna tidak ditemukan." };

    const user = u[0];
    const updatePayload: any = {};

    // 1. Update Username if requested
    if (data.username && data.username.trim() !== user.username) {
      const cleanUsername = data.username.trim().toLowerCase().replace(/[^a-z0-9_.]/g, "");
      if (cleanUsername.length < 3) return { error: "Username minimal 3 karakter." };
      
      const check = await db.select().from(users).where(eq(users.username, cleanUsername)).limit(1);
      if (check.length > 0 && check[0].id !== userId) {
        return { error: `Username "${cleanUsername}" sudah digunakan oleh akun lain. Silakan pilih username lain.` };
      }
      updatePayload.username = cleanUsername;
    }

    // 2. Update Password if requested
    if (data.newPassword && data.newPassword.trim()) {
      if (data.newPassword.trim().length < 8) {
        return { error: "Password baru minimal 8 karakter." };
      }

      if (!user.mustChangePassword) {
        if (!data.currentPassword) {
          return { error: "Harap masukkan password saat ini untuk verifikasi keamanan." };
        }
        const matches = await verifyPassword(data.currentPassword, user.passwordHash);
        if (!matches) {
          return { error: "Password saat ini salah." };
        }
      }

      updatePayload.passwordHash = await hashPassword(data.newPassword.trim());
      updatePayload.mustChangePassword = false;
    }

    if (Object.keys(updatePayload).length > 0) {
      await db.update(users).set(updatePayload).where(eq(users.id, userId));
    }

    return { 
      success: true, 
      message: "Profil & kredensial akun Anda berhasil diperbarui.",
      username: updatePayload.username || user.username 
    };
  } catch (error: any) {
    console.error("Failed to update self profile:", error);
    return { error: error.message || "Gagal memperbarui profil." };
  }
}

// ==========================================
// 7. IMPORT SANTRI (from CSV rows)
// ==========================================

export async function importSantri(rows: any[], operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung." };

  let inserted = 0;
  const errors: string[] = [];

  try {
    const kelasList = await db.select().from(kelas);
    const kamarList = await db.select().from(kamar);

    for (const row of rows) {
      try {
        if (!row.nis || !row.namaLengkap) {
          errors.push(`Baris NIS "${row.nis || "-"}" dilewati: NIS atau Nama kosong.`);
          continue;
        }
        // Check duplicate NIS
        const existing = await db.select().from(santri).where(eq(santri.nis, row.nis)).limit(1);
        if (existing.length > 0) {
          errors.push(`NIS ${row.nis} sudah terdaftar, dilewati.`);
          continue;
        }

        // Map Kelas Name/ID to ID
        let resolvedKelasId: string | null = null;
        const rowKelas = row.kelas || row.kelasId;
        if (rowKelas) {
          const found = kelasList.find(
            (k: any) => k.namaKelas.toLowerCase().trim() === String(rowKelas).toLowerCase().trim()
          );
          if (found) {
            resolvedKelasId = found.id;
          } else {
            const foundById = kelasList.find((k: any) => k.id === rowKelas);
            if (foundById) resolvedKelasId = foundById.id;
          }
        }

        // Map Kamar Name/ID to ID
        let resolvedKamarId: string | null = null;
        const rowKamar = row.kamar || row.kamarId;
        if (rowKamar) {
          const found = kamarList.find(
            (k: any) => k.namaKamar.toLowerCase().trim() === String(rowKamar).toLowerCase().trim()
          );
          if (found) {
            resolvedKamarId = found.id;
          } else {
            const foundById = kamarList.find((k: any) => k.id === rowKamar);
            if (foundById) resolvedKamarId = foundById.id;
          }
        }

        const id = "SNT-" + Math.random().toString(36).substring(2, 11).toUpperCase();
        await db.insert(santri).values({
          id,
          nis: row.nis,
          namaLengkap: row.namaLengkap,
          jenisKelamin: row.jenisKelamin || "L",
          tempatLahir: row.tempatLahir || "-",
          tanggalLahir: row.tanggalLahir || "2000-01-01",
          alamat: row.alamat || "-",
          namaAyah: row.namaAyah || "-",
          namaIbu: row.namaIbu || "-",
          nomorHpWali: row.nomorHpWali || "-",
          kelasId: resolvedKelasId,
          kamarId: resolvedKamarId,
          tahunMasuk: row.tahunMasuk || new Date().getFullYear().toString(),
          statusAktif: true,
          waliId: null,
          fotoUrl: null,
        });
        inserted++;
      } catch (err: any) {
        errors.push(`NIS ${row.nis}: ${err.message}`);
      }
    }
  } catch (err: any) {
    console.error("Import error:", err);
    return { error: "Terjadi kesalahan sistem saat memproses impor." };
  }

  await logActivity(operatorId, "IMPORT_SANTRI", `Import santri: ${inserted} berhasil, ${errors.length} gagal.`);
  return { success: true, inserted, errors };
}

export async function autoGenerateAccounts(operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung." };

  try {
    const defaultPasswordHash = await hashPassword("pesantren123");
    let ustadzCreatedCount = 0;
    let waliCreatedCount = 0;

    // --- Part 1: Auto-generate Ustadz accounts (MUSTAHIQ or MUNAWIB) ---
    const allUstadz = await db.select().from(ustadz).where(eq(ustadz.statusAktif, true));
    const existingUstadzUsers = await db.select().from(users).where(sql`${users.ustadzId} IS NOT NULL`);
    const existingUstadzIds = new Set(existingUstadzUsers.map((u: any) => u.ustadzId));

    const allClasses = await db.select().from(kelas);
    const waliKelasIds = new Set(allClasses.map((k: any) => k.waliKelasId).filter(Boolean));

    for (const u of allUstadz) {
      if (!existingUstadzIds.has(u.id)) {
        const roleId = waliKelasIds.has(u.id) ? "MUSTAHIQ" : "MUNAWIB";
        const baseUsername = await generateUstadzUsername(u.nama);
        
        let username = baseUsername;
        let suffix = 1;
        while (true) {
          const check = await db.select().from(users).where(eq(users.username, username)).limit(1);
          if (check.length === 0) break;
          username = baseUsername + suffix;
          suffix++;
        }

        const userId = "USR-" + Math.random().toString(36).substring(2, 11).toUpperCase();
        await db.insert(users).values({
          id: userId,
          username,
          passwordHash: defaultPasswordHash,
          roleId,
          name: u.nama,
          ustadzId: u.id,
          mustChangePassword: true,
          active: true,
          createdAt: new Date().toISOString()
        });

        ustadzCreatedCount++;
      }
    }

    // --- Part 2: Auto-generate Wali Santri accounts (from Santri data) ---
    const allSantri = await db.select().from(santri).where(eq(santri.statusAktif, true));
    const existingWaliUsers = await db.select().from(users).where(sql`${users.waliId} IS NOT NULL`);
    const existingWaliIds = new Set(existingWaliUsers.map((u: any) => u.waliId));

    const allWalis = await db.select().from(wali_santri);

    // Clean up incorrect shared wali mappings for placeholder phones
    const waliMap = new Map(allWalis.map((w: any) => [w.id, w]));
    const waliToSantri = new Map<string, any[]>();
    for (const s of allSantri) {
      if (s.waliId) {
        if (!waliToSantri.has(s.waliId)) {
          waliToSantri.set(s.waliId, []);
        }
        waliToSantri.get(s.waliId)!.push(s);
      }
    }

    for (const [wId, students] of waliToSantri.entries()) {
      if (students.length > 1) {
        const wObj = waliMap.get(wId) as any;
        const phone = wObj?.nomorHp;
        
        if (isPlaceholderPhone(phone)) {
          let keptStudentId = "";
          if (wObj?.nama) {
            const matchingStudent = students.find(st => 
              st.namaAyah?.toLowerCase().trim() === wObj.nama.toLowerCase().trim() ||
              st.namaIbu?.toLowerCase().trim() === wObj.nama.toLowerCase().trim()
            );
            if (matchingStudent) {
              keptStudentId = matchingStudent.id;
            }
          }
          if (!keptStudentId) {
            keptStudentId = students[0].id;
          }

          for (const st of students) {
            if (st.id !== keptStudentId) {
              await db.update(santri).set({ waliId: null }).where(eq(santri.id, st.id));
              st.waliId = null; // Update local representation
            }
          }
        }
      }
    }

    for (const s of allSantri) {
      let currentWaliId = s.waliId;

      if (!currentWaliId) {
        const matchedWali = allWalis.find((w: any) => {
          if (isPlaceholderPhone(s.nomorHpWali)) return false;
          return w.nomorHp === s.nomorHpWali;
        });
        
        if (!matchedWali) {
          const newWaliId = "WALI-" + Math.random().toString(36).substring(2, 11).toUpperCase();
          const waliName = s.namaAyah && s.namaAyah !== "-" ? s.namaAyah : (s.namaIbu && s.namaIbu !== "-" ? s.namaIbu : `Wali dari ${s.namaLengkap}`);
          
          await db.insert(wali_santri).values({
            id: newWaliId,
            nama: waliName,
            nomorHp: s.nomorHpWali,
            alamat: s.alamat,
            statusAktif: true
          });

          const newWaliObj = {
            id: newWaliId,
            nama: waliName,
            nomorHp: s.nomorHpWali,
            alamat: s.alamat,
            statusAktif: true
          };
          allWalis.push(newWaliObj as any);
          currentWaliId = newWaliId;
        } else {
          currentWaliId = matchedWali.id;
        }

        await db.update(santri).set({ waliId: currentWaliId }).where(eq(santri.id, s.id));
      }

      if (currentWaliId && !existingWaliIds.has(currentWaliId)) {
        const nameWords = s.namaLengkap.trim().split(/\s+/);
        let targetWord = nameWords[0];
        if (nameWords.length > 1) {
          const firstLower = targetWord.toLowerCase().replace(/[^a-z]/g, "");
          if (firstLower === "m" || firstLower === "muhammad" || firstLower === "muh") {
            targetWord = nameWords[1];
          }
        }
        const cleanFirstWord = targetWord.toLowerCase().replace(/[^a-z0-9]/g, "") || "santri";
        const baseUsername = "wali." + cleanFirstWord;
        let username = baseUsername;
        let suffix = 1;
        while (true) {
          const check = await db.select().from(users).where(eq(users.username, username)).limit(1);
          if (check.length === 0) break;
          username = baseUsername + suffix;
          suffix++;
        }

        const matchedWali = allWalis.find((w: any) => w.id === currentWaliId);
        const waliName = matchedWali ? matchedWali.nama : `Wali dari ${s.namaLengkap}`;

        const userId = "USR-" + Math.random().toString(36).substring(2, 11).toUpperCase();
        await db.insert(users).values({
          id: userId,
          username,
          passwordHash: defaultPasswordHash,
          roleId: "WALI_SANTRI",
          name: waliName,
          waliId: currentWaliId,
          mustChangePassword: true,
          active: true,
          createdAt: new Date().toISOString()
        });

        existingWaliIds.add(currentWaliId);
        waliCreatedCount++;
      }
    }

    await logActivity(operatorId, "GENERATE_ACCOUNTS_AUTO", `Men-generate otomatis ${ustadzCreatedCount} akun Ustadz dan ${waliCreatedCount} akun Wali Santri.`);
    return { 
      success: true, 
      message: `Proses generate otomatis selesai. Berhasil membuat ${ustadzCreatedCount} akun Ustadz dan ${waliCreatedCount} akun Wali Santri.` 
    };
  } catch (error: any) {
    console.error("Failed to auto-generate accounts:", error);
    return { error: error.message || "Gagal melakukan generate otomatis." };
  }
}

export async function changeSantriStatus(id: string, status: "AKTIF" | "BOYONG" | "LULUS", tahunKeluar: string | null, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung." };

  try {
    const s = await db.select().from(santri).where(eq(santri.id, id)).limit(1);
    if (s.length === 0) return { error: "Santri tidak ditemukan." };

    if (status === "AKTIF") {
      await db.update(santri).set({
        statusAktif: true,
        statusBoyongLulus: null,
        tahunKeluar: null,
      }).where(eq(santri.id, id));

      await logActivity(operatorId, "CHANGE_SANTRI_STATUS", `Mengaktifkan kembali santri: ${s[0].namaLengkap} (${s[0].nis})`);
      return { success: true, message: "Santri berhasil diaktifkan kembali." };
    } else {
      await db.update(santri).set({
        statusAktif: false,
        statusBoyongLulus: status,
        tahunKeluar: tahunKeluar || new Date().getFullYear().toString(),
      }).where(eq(santri.id, id));

      await logActivity(operatorId, "CHANGE_SANTRI_STATUS", `Mengubah status santri menjadi ${status}: ${s[0].namaLengkap} (${s[0].nis})`);
      return { success: true, message: `Status santri berhasil diubah menjadi ${status}.` };
    }
  } catch (error: any) {
    console.error("Failed to change santri status:", error);
    return { error: error.message || "Gagal mengubah status santri." };
  }
}

export async function getAlumniList(search?: string, gender?: string, status?: string, tahunKeluar?: string) {
  const db = getDb();
  if (!db) return [];

  try {
    const conditions = [];
    conditions.push(eq(santri.statusAktif, false));
    conditions.push(sql`${santri.statusBoyongLulus} IS NOT NULL`);

    if (search) {
      conditions.push(or(
        like(santri.namaLengkap, `%${search}%`),
        like(santri.nis, `%${search}%`)
      ));
    }

    if (gender && gender !== "all") {
      conditions.push(eq(santri.jenisKelamin, gender));
    }

    if (status && status !== "all") {
      conditions.push(eq(santri.statusBoyongLulus, status));
    }

    if (tahunKeluar && tahunKeluar !== "all") {
      conditions.push(eq(santri.tahunKeluar, tahunKeluar));
    }

    const query = db.select().from(santri);
    if (conditions.length > 0) {
      return await query.where(and(...conditions));
    }
    return await query;
  } catch (error) {
    console.error("Failed to load alumni:", error);
    return [];
  }
}
