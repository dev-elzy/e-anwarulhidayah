"use server";

import { getDb } from "@/lib/db";
import { 
  users, 
  roles, 
  kelas, 
  kamar, 
  kitabMapel, 
  jadwal, 
  pengumuman, 
  settings, 
  auditLogs,
  tahunAjaran,
  semester,
  wali_santri,
  catatanSantri,
  nilaiSantri,
  absensiSantri,
  absensiUstadz,
  ustadz,
  santri,
  permissions,
  rolePermissions,
  kitabNadzom,
  targetHafalanNadzom,
  setoranNadzom,
  izinGuru,
  notifications,
  riwayatKelas,
  classSessions,
  catatanPembelajaran,
  qrKelas,
  guruPengganti
} from "@/lib/db/schema";
import { eq, and, or, desc } from "drizzle-orm";
import { hashPassword } from "@/utils/crypto";
import { sendBroadcastNotification } from "@/actions/notification";
import { headers } from "next/headers";

// Helper for audit logging with IP Address capture
async function logAudit(userId: string | null, action: string, details: string) {
  const db = getDb();
  if (!db) return;
  try {
    const id = "LOG-" + Math.random().toString(36).substring(2, 11).toUpperCase();
    let ip = "127.0.0.1";
    try {
      const headerList = await headers();
      ip = headerList.get("x-forwarded-for") || headerList.get("cf-connecting-ip") || "127.0.0.1";
    } catch (e) {
      console.warn("Could not retrieve request headers in logAudit:", e);
    }
    
    await db.insert(auditLogs).values({
      id,
      userId,
      action,
      details,
      ipAddress: ip,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }
}

// Helper to get active year and semester from DB settings
async function getActiveAcademicPeriod() {
  const db = getDb();
  if (!db) return { yearId: "", semesterId: "" };
  try {
    const activeSetting = await db.select().from(settings).limit(1);
    return {
      yearId: activeSetting[0]?.tahunAjaranAktifId || "",
      semesterId: activeSetting[0]?.semesterAktifId || ""
    };
  } catch {
    return { yearId: "", semesterId: "" };
  }
}

// ==========================================
// 1. SYSTEM SETTINGS & AUDIT LOGS
// ==========================================

export async function getSystemSettings() {
  const db = getDb();
  if (!db) return null;
  try {
    const data = await db.select().from(settings).limit(1);
    return data[0] || null;
  } catch (error) {
    console.error("getSystemSettings error:", error);
    return null;
  }
}

export async function getTahunAjaranList() {
  const db = getDb();
  if (!db) return [];
  try {
    return await db.select().from(tahunAjaran);
  } catch (error) {
    console.error("getTahunAjaranList error:", error);
    return [];
  }
}

export async function getSemesterList() {
  const db = getDb();
  if (!db) return [];
  try {
    return await db.select().from(semester);
  } catch (error) {
    console.error("getSemesterList error:", error);
    return [];
  }
}

export async function updateSystemSettings(data: any, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    const current = await getSystemSettings();
    if (current) {
      await db.update(settings).set({
        namaPondok: data.namaPondok,
        alamat: data.alamat,
        telepon: data.telepon,
        logoUrl: data.logoUrl || null,
        tahunAjaranAktifId: data.tahunAjaranAktifId || null,
        semesterAktifId: data.semesterAktifId || null,
        tampilkanRanking: data.tampilkanRanking === undefined ? true : data.tampilkanRanking,
        namaPengasuh: data.namaPengasuh || null,
        raportTemplate: data.raportTemplate || null,  // FIX: simpan raportTemplate
      }).where(eq(settings.id, "system"));
    } else {
      await db.insert(settings).values({
        id: "system",
        namaPondok: data.namaPondok,
        alamat: data.alamat,
        telepon: data.telepon,
        logoUrl: data.logoUrl || null,
        tahunAjaranAktifId: data.tahunAjaranAktifId || null,
        semesterAktifId: data.semesterAktifId || null,
        tampilkanRanking: data.tampilkanRanking === undefined ? true : data.tampilkanRanking,
        namaPengasuh: data.namaPengasuh || null,
        raportTemplate: data.raportTemplate || null,  // FIX: simpan raportTemplate
      });
    }
    await logAudit(operatorId, "UPDATE_SETTINGS", `Mengubah pengaturan sistem: ${data.namaPondok}`);
    return { success: true, message: "Pengaturan berhasil diperbarui." };
  } catch (error: any) {
    return { error: error.message || "Gagal memperbarui pengaturan." };
  }
}

export async function getAuditLogsList() {
  const db = getDb();
  if (!db) return [];
  try {
    return await db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp)).limit(100);
  } catch (error) {
    console.error("getAuditLogsList error:", error);
    return [];
  }
}

// ==========================================
// 2. USER MANAGEMENT & RBAC
// ==========================================

export async function getUsersList() {
  const db = getDb();
  if (!db) return [];
  try {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  } catch (error) {
    console.error("getUsersList error:", error);
    return [];
  }
}

export async function createUser(data: any, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    const existing = await db.select().from(users).where(eq(users.username, data.username)).limit(1);
    if (existing.length > 0) {
      return { error: "Username sudah digunakan." };
    }

    const id = "USR-" + Math.random().toString(36).substring(2, 11).toUpperCase();
    const pwHash = await hashPassword(data.password);

    await db.insert(users).values({
      id,
      username: data.username,
      passwordHash: pwHash,
      roleId: data.roleId,
      name: data.name,
      email: data.email || null,
      ustadzId: data.ustadzId || null,
      waliId: data.waliId || null,
      active: true,
      createdAt: new Date().toISOString()
    });

    await logAudit(operatorId, "CREATE_USER", `Menambahkan user: ${data.username} (${data.roleId})`);
    return { success: true, message: `User ${data.username} berhasil dibuat.` };
  } catch (error: any) {
    return { error: error.message || "Gagal membuat user." };
  }
}

export async function deleteUser(id: string, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    const user = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (user.length === 0) return { error: "User tidak ditemukan." };
    
    // Cascade & nullify references
    await db.delete(notifications).where(eq(notifications.userId, id)).catch(() => {});
    await db.update(auditLogs).set({ userId: null }).where(eq(auditLogs.userId, id)).catch(() => {});

    await db.delete(users).where(eq(users.id, id));
    await logAudit(operatorId, "DELETE_USER", `Menghapus user: ${user[0].username}`);
    return { success: true, message: "User berhasil dihapus." };
  } catch (error: any) {
    return { error: error.message || "Gagal menghapus user." };
  }
}

export async function updateUserStatus(id: string, active: boolean, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    await db.update(users).set({ active }).where(eq(users.id, id));
    await logAudit(operatorId, active ? "ENABLE_USER" : "DISABLE_USER", `Mengubah status keaktifan user ID ${id} menjadi ${active}`);
    return { success: true, message: "Status user berhasil diubah." };
  } catch (error: any) {
    return { error: error.message || "Gagal mengubah status user." };
  }
}

export async function resetUserPassword(id: string, newPassword: string, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    const pwHash = await hashPassword(newPassword);
    await db.update(users).set({ passwordHash: pwHash }).where(eq(users.id, id));
    await logAudit(operatorId, "RESET_PASSWORD", `Mereset password user ID ${id}`);
    return { success: true, message: "Password user berhasil di-reset." };
  } catch (error: any) {
    return { error: error.message || "Gagal mereset password." };
  }
}

export async function getRolesList() {
  const db = getDb();
  if (!db) return [];
  try {
    return await db.select().from(roles);
  } catch {
    return [];
  }
}

export async function getPermissionsList() {
  const db = getDb();
  if (!db) return [];
  try {
    return await db.select().from(permissions);
  } catch {
    return [];
  }
}

export async function getRolePermissionsList() {
  const db = getDb();
  if (!db) return [];
  try {
    return await db.select().from(rolePermissions);
  } catch {
    return [];
  }
}

export async function updateRolePermissions(roleId: string, permissionIds: string[], operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    // Clear old mappings
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
    // Insert new mappings
    for (const permId of permissionIds) {
      const mappingId = `RP-${roleId}-${permId}`;
      await db.insert(rolePermissions).values({
        id: mappingId,
        roleId,
        permissionId: permId
      });
    }
    await logAudit(operatorId, "UPDATE_ROLE_PERMISSIONS", `Memetakan ulang hak akses untuk peran: ${roleId}`);
    return { success: true, message: "Hak akses peran berhasil diperbarui." };
  } catch (error: any) {
    return { error: error.message || "Gagal memperbarui pemetaan peran." };
  }
}

// ==========================================
// 3. MASTER KELAS & KAMAR
// ==========================================

export async function createKelas(data: any, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    const id = "QR-" + data.namaKelas.replace(/\s+/g, "-").toUpperCase() + "-" + Math.random().toString(36).substring(2, 5).toUpperCase();
    await db.insert(kelas).values({
      id,
      namaKelas: data.namaKelas,
      tingkatan: data.tingkatan,
      waliKelasId: data.waliKelasId || null
    });
    await logAudit(operatorId, "CREATE_KELAS", `Menambahkan kelas baru: ${data.namaKelas}`);
    return { success: true, message: "Kelas berhasil ditambahkan." };
  } catch (error: any) {
    return { error: error.message || "Gagal menambahkan kelas." };
  }
}

export async function deleteKelas(id: string, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    // Nullify santri class assignment
    await db.update(santri).set({ kelasId: null }).where(eq(santri.kelasId, id));
    
    // Delete class history, QR class mappings, and targets
    await db.delete(riwayatKelas).where(eq(riwayatKelas.kelasId, id));
    await db.delete(qrKelas).where(eq(qrKelas.kelasId, id));
    await db.delete(targetHafalanNadzom).where(eq(targetHafalanNadzom.kelasId, id));
    
    // Delete sessions of this class and their dependencies FIRST (before jadwal)
    const sessionList = await db.select().from(classSessions).where(eq(classSessions.kelasId, id));
    const sessionIds = sessionList.map((s: any) => s.id);
    if (sessionIds.length > 0) {
      for (const sid of sessionIds) {
        await db.delete(catatanPembelajaran).where(eq(catatanPembelajaran.sessionId, sid));
        await db.delete(absensiUstadz).where(eq(absensiUstadz.sessionId, sid));
        await db.delete(absensiSantri).where(eq(absensiSantri.sessionId, sid));
      }
      await db.delete(classSessions).where(eq(classSessions.kelasId, id));
    }

    // Delete schedules of this class and their dependencies SECOND
    const classJadwalList = await db.select().from(jadwal).where(eq(jadwal.kelasId, id));
    const jadwalIds = classJadwalList.map((j: any) => j.id);
    if (jadwalIds.length > 0) {
      for (const jid of jadwalIds) {
        await db.delete(absensiUstadz).where(eq(absensiUstadz.jadwalId, jid));
        await db.delete(absensiSantri).where(eq(absensiSantri.jadwalId, jid));
        await db.delete(guruPengganti).where(eq(guruPengganti.jadwalId, jid));
      }
      await db.delete(jadwal).where(eq(jadwal.kelasId, id));
    }

    await db.delete(kelas).where(eq(kelas.id, id));
    await logAudit(operatorId, "DELETE_KELAS", `Menghapus kelas ID ${id}`);
    return { success: true, message: "Kelas berhasil dihapus." };
  } catch (error: any) {
    console.error("Failed to delete kelas:", error);
    return { error: error.message || "Gagal menghapus kelas." };
  }
}

export async function createKamar(data: any, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    const id = "KMR-" + Math.random().toString(36).substring(2, 11).toUpperCase();
    await db.insert(kamar).values({
      id,
      namaKamar: data.namaKamar,
      kapasitas: parseInt(data.kapasitas) || 10,
      jumlahPenghuni: 0
    });
    await logAudit(operatorId, "CREATE_KAMAR", `Menambahkan kamar baru: ${data.namaKamar}`);
    return { success: true, message: "Kamar berhasil ditambahkan." };
  } catch (error: any) {
    return { error: error.message || "Gagal menambahkan kamar." };
  }
}

export async function deleteKamar(id: string, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    // Nullify kamarId for santri inside this kamar to prevent constraint error
    await db.update(santri).set({ kamarId: null }).where(eq(santri.kamarId, id));

    await db.delete(kamar).where(eq(kamar.id, id));
    await logAudit(operatorId, "DELETE_KAMAR", `Menghapus kamar ID ${id}`);
    return { success: true, message: "Kamar berhasil dihapus." };
  } catch (error: any) {
    console.error("Failed to delete kamar:", error);
    return { error: error.message || "Gagal menghapus kamar." };
  }
}

// ==========================================
// 4. KITAB & MAPEL
// ==========================================

export async function getKitabList() {
  const db = getDb();
  if (!db) return [];
  try {
    return await db.select().from(kitabMapel);
  } catch (error) {
    console.error("getKitabList error:", error);
    return [];
  }
}

export async function createKitab(data: any, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    const id = "KTB-" + Math.random().toString(36).substring(2, 11).toUpperCase();
    await db.insert(kitabMapel).values({
      id,
      namaKitabMapel: data.namaKitabMapel,
      keterangan: data.keterangan || null
    });
    await logAudit(operatorId, "CREATE_KITAB", `Menambahkan kitab baru: ${data.namaKitabMapel}`);
    return { success: true, message: "Kitab/Mapel berhasil ditambahkan." };
  } catch (error: any) {
    return { error: error.message || "Gagal menambahkan kitab." };
  }
}

export async function deleteKitab(id: string, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    // Delete schedules referencing this kitab and their dependencies
    const kitabJadwalList = await db.select().from(jadwal).where(eq(jadwal.kitabMapelId, id));
    const jadwalIds = kitabJadwalList.map((j: any) => j.id);
    if (jadwalIds.length > 0) {
      for (const jid of jadwalIds) {
        // Cascade delete class sessions first to avoid FK constraint error
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

        await db.delete(absensiUstadz).where(eq(absensiUstadz.jadwalId, jid));
        await db.delete(absensiSantri).where(eq(absensiSantri.jadwalId, jid));
        await db.delete(guruPengganti).where(eq(guruPengganti.jadwalId, jid));
      }
      await db.delete(jadwal).where(eq(jadwal.kitabMapelId, id));
    }

    // Delete grades related to this kitab
    await db.delete(nilaiSantri).where(eq(nilaiSantri.kitabMapelId, id));

    await db.delete(kitabMapel).where(eq(kitabMapel.id, id));
    await logAudit(operatorId, "DELETE_KITAB", `Menghapus kitab ID ${id}`);
    return { success: true, message: "Kitab/Mapel berhasil dihapus." };
  } catch (error: any) {
    console.error("Failed to delete kitab:", error);
    return { error: error.message || "Gagal menghapus kitab." };
  }
}

// ==========================================
// 5. JADWAL MADRASAH
// ==========================================

export async function getJadwalList() {
  const db = getDb();
  if (!db) return [];
  try {
    return await db.select().from(jadwal);
  } catch (error) {
    console.error("getJadwalList error:", error);
    return [];
  }
}

export async function createJadwal(data: any, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    const id = "JDW-" + Math.random().toString(36).substring(2, 11).toUpperCase();
    const period = await getActiveAcademicPeriod();
    
    await db.insert(jadwal).values({
      id,
      hari: data.hari,
      jamMulai: data.jamMulai,
      jamSelesai: data.jamSelesai,
      kelasId: data.kelasId,
      kitabMapelId: data.kitabMapelId,
      ustadzId: data.ustadzId,
      tahunAjaranId: period.yearId,
      semesterId: period.semesterId
    });
    await logAudit(operatorId, "CREATE_JADWAL", `Menambahkan jadwal baru untuk hari ${data.hari}`);
    return { success: true, message: "Jadwal berhasil ditambahkan." };
  } catch (error: any) {
    return { error: error.message || "Gagal menambahkan jadwal." };
  }
}

export async function deleteJadwal(id: string, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    // Delete attendance records and substitution logs referencing this schedule
    await db.delete(absensiUstadz).where(eq(absensiUstadz.jadwalId, id));
    await db.delete(absensiSantri).where(eq(absensiSantri.jadwalId, id));
    await db.delete(guruPengganti).where(eq(guruPengganti.jadwalId, id));
    
    // Delete sessions of this schedule and their notes/attendance
    const sessions = await db.select().from(classSessions).where(eq(classSessions.jadwalId, id));
    for (const s of sessions) {
      await db.delete(catatanPembelajaran).where(eq(catatanPembelajaran.sessionId, s.id));
      await db.delete(absensiUstadz).where(eq(absensiUstadz.sessionId, s.id));
      await db.delete(absensiSantri).where(eq(absensiSantri.sessionId, s.id));
    }
    await db.delete(classSessions).where(eq(classSessions.jadwalId, id));

    await db.delete(jadwal).where(eq(jadwal.id, id));
    await logAudit(operatorId, "DELETE_JADWAL", `Menghapus jadwal ID ${id}`);
    return { success: true, message: "Jadwal berhasil dihapus." };
  } catch (error: any) {
    console.error("Failed to delete jadwal:", error);
    return { error: error.message || "Gagal menghapus jadwal." };
  }
}

// ==========================================
// 6. PERIZINAN GURU
// ==========================================

export async function getIzinGuruList() {
  const db = getDb();
  if (!db) return [];
  try {
    return await db.select().from(izinGuru).orderBy(desc(izinGuru.tanggal));
  } catch {
    return [];
  }
}

export async function createIzinGuru(data: any, requesterId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    const id = "IZG-" + Math.random().toString(36).substring(2, 11).toUpperCase();
    await db.insert(izinGuru).values({
      id,
      guruId: data.guruId,
      tanggal: data.tanggal,
      alasan: data.alasan,
      status: "Pending",
      penggantiId: data.penggantiId || null
    });
    await logAudit(requesterId, "CREATE_IZIN_GURU", `Mengajukan izin guru ID ${data.guruId}`);
    return { success: true, message: "Izin guru berhasil diajukan." };
  } catch (e: any) {
    return { error: e.message || "Gagal mengajukan izin." };
  }
}

export async function approveIzinGuru(id: string, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    await db.update(izinGuru).set({ status: "Disetujui" }).where(eq(izinGuru.id, id));
    await logAudit(operatorId, "APPROVE_IZIN_GURU", `Menyetujui izin guru ID ${id}`);
    return { success: true, message: "Izin guru disetujui." };
  } catch (e: any) {
    return { error: e.message || "Gagal menyetujui izin." };
  }
}

// ==========================================
// 7. PENGUMUMAN
// ==========================================

export async function getPengumumanList() {
  const db = getDb();
  if (!db) return [];
  try {
    return await db.select().from(pengumuman).orderBy(desc(pengumuman.tanggal));
  } catch (error) {
    console.error("getPengumumanList error:", error);
    return [];
  }
}

export async function createPengumuman(data: any, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    const id = "ANN-" + Math.random().toString(36).substring(2, 11).toUpperCase();
    const targetRoles = data.targetRoles || "PENGASUH,MUSTAHIQ,WALI_SANTRI";
    await db.insert(pengumuman).values({
      id,
      judul: data.judul,
      konten: data.konten,
      tanggal: new Date().toISOString().split("T")[0],
      targetRoles
    });

    // Create notifications for each target role
    const rolesArray = targetRoles.split(",");
    for (const role of rolesArray) {
      const trimmedRole = role.trim();
      if (trimmedRole) {
        const notifId = "NTF-" + Math.random().toString(36).substring(2, 11).toUpperCase();
        await db.insert(notifications).values({
          id: notifId,
          roleId: trimmedRole,
          title: `Pengumuman: ${data.judul}`,
          message: data.konten,
          type: "PENGUMUMAN",
          isRead: false,
          createdAt: new Date().toISOString()
        });

        // Broadcast actual FCM Push Notification to all users with active device tokens in this role
        await sendBroadcastNotification(
          trimmedRole as any,
          `Pengumuman: ${data.judul}`,
          data.konten,
          { click_action: `/dashboard/${trimmedRole.toLowerCase().replace('_', '-')}` }
        ).catch(err => console.error(`Failed to send broadcast push notification for role ${trimmedRole}:`, err));
      }
    }

    await logAudit(operatorId, "CREATE_PENGUMUMAN", `Membuat pengumuman: ${data.judul}`);
    return { success: true, message: "Pengumuman berhasil dipublikasikan." };
  } catch (error: any) {
    return { error: error.message || "Gagal mempublikasikan pengumuman." };
  }
}

export async function deletePengumuman(id: string, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    // 1. Fetch details of the announcement to delete corresponding notification records
    const existingList = await db.select().from(pengumuman).where(eq(pengumuman.id, id)).limit(1);
    const existing = existingList[0];
    if (existing) {
      await db.delete(notifications).where(and(
        eq(notifications.type, "PENGUMUMAN"),
        eq(notifications.title, `Pengumuman: ${existing.judul}`),
        eq(notifications.message, existing.konten)
      ));
    }

    await db.delete(pengumuman).where(eq(pengumuman.id, id));
    await logAudit(operatorId, "DELETE_PENGUMUMAN", `Menghapus pengumuman ID ${id}`);
    return { success: true, message: "Pengumuman berhasil dihapus." };
  } catch (error: any) {
    return { error: error.message || "Gagal menghapus pengumuman." };
  }
}

// ==========================================
// 8. WALI SANTRI
// ==========================================

export async function getWaliList() {
  const db = getDb();
  if (!db) return [];
  try {
    return await db.select().from(wali_santri);
  } catch (error) {
    console.error("getWaliList error:", error);
    return [];
  }
}

export async function createWali(data: any, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    const id = "WLI-" + Math.random().toString(36).substring(2, 11).toUpperCase();
    await db.insert(wali_santri).values({
      id,
      nama: data.nama,
      nomorHp: data.nomorHp,
      alamat: data.alamat,
      statusAktif: true
    });
    await logAudit(operatorId, "CREATE_WALI", `Menambahkan wali santri: ${data.nama}`);
    return { success: true, message: "Data wali santri berhasil ditambahkan." };
  } catch (error: any) {
    return { error: error.message || "Gagal menambahkan data wali." };
  }
}

// ==========================================
// 9. AKADEMIK (NILAI & CATATAN PERKEMBANGAN)
// ==========================================

export async function getNilaiList(santriId?: string) {
  const db = getDb();
  if (!db) return [];
  try {
    if (santriId) {
      return await db.select().from(nilaiSantri).where(eq(nilaiSantri.santriId, santriId));
    }
    return await db.select().from(nilaiSantri);
  } catch (error) {
    console.error("getNilaiList error:", error);
    return [];
  }
}

export async function createNilai(data: any, ustadzId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    const id = "NLI-" + Math.random().toString(36).substring(2, 11).toUpperCase();
    const period = await getActiveAcademicPeriod();

    await db.insert(nilaiSantri).values({
      id,
      santriId: data.santriId,
      kitabMapelId: data.kitabMapelId,
      nilai: parseFloat(data.nilai),
      tahunAjaranId: period.yearId,
      semesterId: period.semesterId
    });
    await logAudit(ustadzId, "CREATE_NILAI", `Memasukkan nilai santri ${data.santriId} mapel ${data.kitabMapelId}: ${data.nilai}`);
    return { success: true, message: "Nilai berhasil disimpan." };
  } catch (error: any) {
    return { error: error.message || "Gagal menyimpan nilai." };
  }
}

export async function saveGradesBatch(data: { jenis?: string, semesterId?: string, grades: { santriId: string, kitabMapelId: string, nilai: number }[] }, ustadzId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    const period = await getActiveAcademicPeriod();
    const targetSemesterId = data.semesterId || period.semesterId;
    let targetYearId = period.yearId;

    if (data.semesterId) {
      const semDetail = await db.select().from(semester).where(eq(semester.id, data.semesterId)).limit(1);
      if (semDetail.length > 0) {
        targetYearId = semDetail[0].tahunAjaranId;
      }
    }

    let updatedCount = 0;
    let insertedCount = 0;

    for (const item of data.grades) {
      // Look for existing grade for the same student, subject, semester, year, and jenis
      const existing = await db.select()
        .from(nilaiSantri)
        .where(and(
          eq(nilaiSantri.santriId, item.santriId),
          eq(nilaiSantri.kitabMapelId, item.kitabMapelId),
          eq(nilaiSantri.semesterId, targetSemesterId),
          eq(nilaiSantri.tahunAjaranId, targetYearId),
          eq(nilaiSantri.jenis, data.jenis || "UAS")
        ))
        .limit(1);

      if (existing.length > 0) {
        // Update existing row
        await db.update(nilaiSantri)
          .set({ nilai: item.nilai })
          .where(eq(nilaiSantri.id, existing[0].id));
        updatedCount++;
      } else {
        // Insert new row
        const id = "NLI-" + Math.random().toString(36).substring(2, 11).toUpperCase();
        await db.insert(nilaiSantri).values({
          id,
          santriId: item.santriId,
          kitabMapelId: item.kitabMapelId,
          nilai: item.nilai,
          tahunAjaranId: targetYearId,
          semesterId: targetSemesterId,
          jenis: data.jenis || "UAS"
        });
        insertedCount++;
      }
    }

    await logAudit(ustadzId, "BATCH_SAVE_NILAI", `Menyimpan batch nilai semester ${targetSemesterId}: ${insertedCount} baru, ${updatedCount} diperbarui.`);
    return { success: true, message: `Berhasil menyimpan nilai: ${insertedCount} baru dimasukkan, ${updatedCount} diperbarui.` };
  } catch (error: any) {
    console.error("saveGradesBatch error:", error);
    return { error: error.message || "Gagal menyimpan nilai secara batch." };
  }
}

export async function deleteNilai(id: string, operatorId?: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    await db.delete(nilaiSantri).where(eq(nilaiSantri.id, id));
    if (operatorId) {
      await logAudit(operatorId, "DELETE_NILAI", `Menghapus nilai ID ${id}`);
    }
    return { success: true, message: "Nilai berhasil dihapus." };
  } catch (error: any) {
    return { error: error.message || "Gagal menghapus nilai." };
  }
}

export async function getCatatanList(santriId?: string) {
  const db = getDb();
  if (!db) return [];
  try {
    if (santriId) {
      return await db.select().from(catatanSantri).where(eq(catatanSantri.santriId, santriId)).orderBy(desc(catatanSantri.tanggal));
    }
    return await db.select().from(catatanSantri).orderBy(desc(catatanSantri.tanggal));
  } catch (error) {
    console.error("getCatatanList error:", error);
    return [];
  }
}

export async function createCatatan(data: any, userId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    const id = "CTN-" + Math.random().toString(36).substring(2, 11).toUpperCase();
    
    // 1. Get real ustadzId from users table
    const userDetail = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    let resolvedUstadzId = userDetail[0]?.ustadzId;

    // 2. Fallback to student's homeroom teacher (wali kelas) if user is not linked to an ustadz
    if (!resolvedUstadzId) {
      const studentDetail = await db.select().from(santri).where(eq(santri.id, data.santriId)).limit(1);
      if (studentDetail[0]?.kelasId) {
        const classDetail = await db.select().from(kelas).where(eq(kelas.id, studentDetail[0].kelasId)).limit(1);
        resolvedUstadzId = classDetail[0]?.waliKelasId;
      }
    }

    // 3. Last fallback: use the first ustadz in the database
    if (!resolvedUstadzId) {
      const firstUstadz = await db.select().from(ustadz).limit(1);
      resolvedUstadzId = firstUstadz[0]?.id;
    }

    if (!resolvedUstadzId) {
      return { error: "Pencatatan gagal: Tidak ada data Ustadz yang valid di sistem." };
    }

    await db.insert(catatanSantri).values({
      id,
      santriId: data.santriId,
      catatanUstadz: data.catatanUstadz,
      tanggal: new Date().toISOString().split("T")[0],
      ustadzId: resolvedUstadzId
    });
    await logAudit(userId, "CREATE_CATATAN", `Menyimpan catatan santri ID ${data.santriId}`);
    return { success: true, message: "Catatan perkembangan berhasil ditambahkan." };
  } catch (error: any) {
    return { error: error.message || "Gagal menyimpan catatan." };
  }
}

export async function deleteCatatan(id: string, ustadzId?: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    await db.delete(catatanSantri).where(eq(catatanSantri.id, id));
    if (ustadzId) {
      await logAudit(ustadzId, "DELETE_CATATAN", `Menghapus catatan ID ${id}`);
    }
    return { success: true, message: "Catatan berhasil dihapus." };
  } catch (error: any) {
    return { error: error.message || "Gagal menghapus catatan." };
  }
}

// ==========================================
// 10. HAFALAN NADZOM (KITAB & SETORAN)
// ==========================================

export async function createKitabNadzom(data: any, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    const id = "NZM-" + Math.random().toString(36).substring(2, 11).toUpperCase();
    await db.insert(kitabNadzom).values({
      id,
      namaKitab: data.namaKitab,
      jumlahBait: parseInt(data.jumlahBait)
    });
    await logAudit(operatorId, "CREATE_KITAB_NADZOM", `Menambahkan kitab nadzom: ${data.namaKitab}`);
    return { success: true, message: "Kitab Nadzom berhasil ditambahkan." };
  } catch (e: any) {
    return { error: e.message || "Gagal menambahkan kitab." };
  }
}

export async function deleteKitabNadzom(id: string, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    // Delete targets and setoran records referencing this kitab nadzom
    await db.delete(targetHafalanNadzom).where(eq(targetHafalanNadzom.kitabNadzomId, id));
    await db.delete(setoranNadzom).where(eq(setoranNadzom.kitabNadzomId, id));

    await db.delete(kitabNadzom).where(eq(kitabNadzom.id, id));
    await logAudit(operatorId, "DELETE_KITAB_NADZOM", `Menghapus kitab nadzom ID ${id}`);
    return { success: true, message: "Kitab Nadzom berhasil dihapus." };
  } catch (e: any) {
    console.error("Failed to delete kitab nadzom:", e);
    return { error: e.message || "Gagal menghapus kitab." };
  }
}

export async function getKitabNadzomList() {
  const db = getDb();
  if (!db) return [];
  try {
    return await db.select().from(kitabNadzom);
  } catch (e) {
    console.error("Failed to get kitab nadzom list:", e);
    return [];
  }
}

export async function updateKitabNadzom(id: string, data: any, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    await db.update(kitabNadzom).set({
      namaKitab: data.namaKitab,
      jumlahBait: parseInt(data.jumlahBait)
    }).where(eq(kitabNadzom.id, id));
    await logAudit(operatorId, "UPDATE_KITAB_NADZOM", `Mengubah kitab nadzom ID ${id}`);
    return { success: true, message: "Kitab Nadzom berhasil diubah." };
  } catch (e: any) {
    return { error: e.message || "Gagal mengubah kitab." };
  }
}

export async function getTargetHafalanList() {
  const db = getDb();
  if (!db) return [];
  try {
    const targets = await db.select().from(targetHafalanNadzom);
    const kelasList = await db.select().from(kelas);
    const kitabs = await db.select().from(kitabNadzom);
    return targets.map((t: any) => {
      const cls = kelasList.find((c: any) => c.id === t.kelasId);
      const kit = kitabs.find((k: any) => k.id === t.kitabNadzomId);
      return {
        ...t,
        kelas: cls || null,
        kitab: kit || null
      };
    });
  } catch (e) {
    console.error("Failed to get target hafalan list:", e);
    return [];
  }
}

export async function createTargetHafalan(data: any, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    const id = "TGT-" + Math.random().toString(36).substring(2, 11).toUpperCase();
    await db.insert(targetHafalanNadzom).values({
      id,
      kelasId: data.kelasId,
      kitabNadzomId: data.kitabNadzomId,
      baitMulai: parseInt(data.baitMulai),
      baitSelesai: parseInt(data.baitSelesai)
    });
    await logAudit(operatorId, "CREATE_TARGET_HAFALAN", `Menambahkan target hafalan untuk kelas ID ${data.kelasId}`);
    return { success: true, message: "Target Hafalan berhasil ditambahkan." };
  } catch (e: any) {
    return { error: e.message || "Gagal menambahkan target hafalan." };
  }
}

export async function updateTargetHafalan(id: string, data: any, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    await db.update(targetHafalanNadzom).set({
      kelasId: data.kelasId,
      kitabNadzomId: data.kitabNadzomId,
      baitMulai: parseInt(data.baitMulai),
      baitSelesai: parseInt(data.baitSelesai)
    }).where(eq(targetHafalanNadzom.id, id));
    await logAudit(operatorId, "UPDATE_TARGET_HAFALAN", `Mengubah target hafalan ID ${id}`);
    return { success: true, message: "Target Hafalan berhasil diubah." };
  } catch (e: any) {
    return { error: e.message || "Gagal mengubah target hafalan." };
  }
}

export async function deleteTargetHafalan(id: string, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    await db.delete(targetHafalanNadzom).where(eq(targetHafalanNadzom.id, id));
    await logAudit(operatorId, "DELETE_TARGET_HAFALAN", `Menghapus target hafalan ID ${id}`);
    return { success: true, message: "Target Hafalan berhasil dihapus." };
  } catch (e: any) {
    return { error: e.message || "Gagal menghapus target hafalan." };
  }
}

export async function createSetoranNadzom(data: any, userId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    const id = "STR-" + Math.random().toString(36).substring(2, 11).toUpperCase();
    const period = await getActiveAcademicPeriod();
    
    // 1. Get real ustadzId from users table
    const userDetail = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    let resolvedUstadzId = userDetail[0]?.ustadzId;

    // 2. Fallback to student's homeroom teacher (wali kelas) if user is not linked to an ustadz
    if (!resolvedUstadzId) {
      const studentDetail = await db.select().from(santri).where(eq(santri.id, data.santriId)).limit(1);
      if (studentDetail[0]?.kelasId) {
        const classDetail = await db.select().from(kelas).where(eq(kelas.id, studentDetail[0].kelasId)).limit(1);
        resolvedUstadzId = classDetail[0]?.waliKelasId;
      }
    }

    // 3. Last fallback: use the first ustadz in the database
    if (!resolvedUstadzId) {
      const firstUstadz = await db.select().from(ustadz).limit(1);
      resolvedUstadzId = firstUstadz[0]?.id;
    }

    if (!resolvedUstadzId) {
      return { error: "Pencatatan gagal: Tidak ada data Ustadz yang valid di sistem." };
    }
    
    await db.insert(setoranNadzom).values({
      id,
      santriId: data.santriId,
      kitabNadzomId: data.kitabNadzomId,
      baitMulai: parseInt(data.baitMulai),
      baitSelesai: parseInt(data.baitSelesai),
      status: data.status,
      tanggal: new Date().toISOString().split("T")[0],
      ustadzId: resolvedUstadzId,
      semesterId: period.semesterId,
      tahunAjaranId: period.yearId
    });
    await logAudit(userId, "CREATE_SETORAN_NADZOM", `Mencatat setoran nadzom santri ID ${data.santriId}`);
    return { success: true, message: "Setoran Hafalan berhasil dicatat." };
  } catch (e: any) {
    return { error: e.message || "Gagal mencatat setoran." };
  }
}

export async function deleteSetoranNadzom(id: string, ustadzId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    await db.delete(setoranNadzom).where(eq(setoranNadzom.id, id));
    await logAudit(ustadzId, "DELETE_SETORAN_NADZOM", `Menghapus setoran nadzom ID ${id}`);
    return { success: true, message: "Setoran Hafalan berhasil dihapus." };
  } catch (e: any) {
    return { error: e.message || "Gagal menghapus setoran." };
  }
}

// ==========================================
// 12. NOTIFICATION ACTIONS
// ==========================================

export async function getNotificationsList(userId: string, roleId: string) {
  const db = getDb();
  if (!db) return [];
  try {
    return await db.select()
      .from(notifications)
      .where(or(
        eq(notifications.userId, userId),
        eq(notifications.roleId, roleId)
      ))
      .orderBy(desc(notifications.createdAt))
      .limit(30);
  } catch {
    return [];
  }
}

export async function markNotificationAsRead(id: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
    return { success: true };
  } catch (e: any) {
    return { error: e.message || "Gagal memperbarui notifikasi" };
  }
}

// Compatibility getters/setters for legacy components
export async function getHafalanList() {
  const db = getDb();
  if (!db) return [];
  try {
    const raw = await db.select({
      id: setoranNadzom.id,
      santriId: setoranNadzom.santriId,
      tanggal: setoranNadzom.tanggal,
      namaKitab: kitabNadzom.namaKitab,
      baitMulai: setoranNadzom.baitMulai,
      baitSelesai: setoranNadzom.baitSelesai,
      status: setoranNadzom.status
    })
    .from(setoranNadzom)
    .innerJoin(kitabNadzom, eq(setoranNadzom.kitabNadzomId, kitabNadzom.id))
    .orderBy(desc(setoranNadzom.tanggal));

    return raw.map((h: any) => ({
      id: h.id,
      santriId: h.santriId,
      tanggal: h.tanggal,
      jenisHafalan: h.namaKitab,
      keteranganHafalan: `Bait ${h.baitMulai} s.d ${h.baitSelesai} (${h.status})`
    }));
  } catch (error) {
    console.error("getHafalanList error:", error);
    return [];
  }
}

export async function getAbsensiSantriList() {
  const db = getDb();
  if (!db) return [];
  try {
    return await db.select().from(absensiSantri);
  } catch (error) {
    console.error("getAbsensiSantriList error:", error);
    return [];
  }
}

export async function getAbsensiUstadzList() {
  const db = getDb();
  if (!db) return [];
  try {
    return await db.select().from(absensiUstadz);
  } catch (error) {
    console.error("getAbsensiUstadzList error:", error);
    return [];
  }
}

export async function createHafalan(data: any, ustadzId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    const id = "STR-" + Math.random().toString(36).substring(2, 11).toUpperCase();
    const period = await getActiveAcademicPeriod();
    
    // Find matching kitab
    const kitabs = await db.select().from(kitabNadzom);
    let kitabId = kitabs[0]?.id || "NZM-DEFAULT";
    const searchName = (data.jenisHafalan || "").toLowerCase();
    const found = kitabs.find((k: any) => k.namaKitab.toLowerCase().includes(searchName) || searchName.includes(k.namaKitab.toLowerCase()));
    if (found) {
      kitabId = found.id;
    }
    
    // Try to parse bait numbers from keteranganHafalan, e.g. "Bait 1 s.d 10" or "1 - 10"
    let baitMulai = 1;
    let baitSelesai = 10;
    const matches = (data.keteranganHafalan || "").match(/(\d+)\s*(?:s\.?d|sampai|-|ke)\s*(\d+)/i);
    if (matches && matches.length >= 3) {
      baitMulai = parseInt(matches[1]);
      baitSelesai = parseInt(matches[2]);
    } else {
      const singleMatch = (data.keteranganHafalan || "").match(/(\d+)/);
      if (singleMatch) {
        baitSelesai = parseInt(singleMatch[1]);
        baitMulai = Math.max(1, baitSelesai - 9);
      }
    }

    await db.insert(setoranNadzom).values({
      id,
      santriId: data.santriId,
      kitabNadzomId: kitabId,
      baitMulai,
      baitSelesai,
      status: "Lancar",
      tanggal: new Date().toISOString().split("T")[0],
      ustadzId,
      semesterId: period.semesterId,
      tahunAjaranId: period.yearId
    });
    
    await logAudit(ustadzId, "CREATE_HAFALAN_LEGACY", `Mencatat hafalan legacy santri ID ${data.santriId}`);
    return { success: true, message: "Hafalan berhasil disimpan." };
  } catch (error: any) {
    return { error: error.message || "Gagal menyimpan hafalan." };
  }
}

export async function deleteHafalan(id: string, ustadzId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    await db.delete(setoranNadzom).where(eq(setoranNadzom.id, id));
    await logAudit(ustadzId, "DELETE_HAFALAN_LEGACY", `Menghapus hafalan legacy ID ${id}`);
    return { success: true, message: "Hafalan berhasil dihapus." };
  } catch (error: any) {
    return { error: error.message || "Gagal menghapus hafalan." };
  }
}

export async function updateKelas(id: string, data: any, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    await db.update(kelas).set({
      namaKelas: data.namaKelas,
      tingkatan: data.tingkatan,
      waliKelasId: data.waliKelasId || null
    }).where(eq(kelas.id, id));
    await logAudit(operatorId, "UPDATE_KELAS", `Mengubah kelas: ${data.namaKelas}`);
    return { success: true, message: "Kelas berhasil diubah." };
  } catch (error: any) {
    return { error: error.message || "Gagal mengubah kelas." };
  }
}

export async function updateKamar(id: string, data: any, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    await db.update(kamar).set({
      namaKamar: data.namaKamar,
      kapasitas: parseInt(data.kapasitas)
    }).where(eq(kamar.id, id));
    await logAudit(operatorId, "UPDATE_KAMAR", `Mengubah kamar: ${data.namaKamar}`);
    return { success: true, message: "Kamar berhasil diubah." };
  } catch (error: any) {
    return { error: error.message || "Gagal mengubah kamar." };
  }
}

export async function updateKitab(id: string, data: any, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    await db.update(kitabMapel).set({
      namaKitabMapel: data.namaKitabMapel,
      keterangan: data.keterangan || null
    }).where(eq(kitabMapel.id, id));
    await logAudit(operatorId, "UPDATE_KITAB", `Mengubah kitab: ${data.namaKitabMapel}`);
    return { success: true, message: "Kitab/Mapel berhasil diubah." };
  } catch (error: any) {
    return { error: error.message || "Gagal mengubah kitab." };
  }
}

export async function updateJadwal(id: string, data: any, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung" };
  try {
    await db.update(jadwal).set({
      hari: data.hari,
      jamMulai: data.jamMulai,
      jamSelesai: data.jamSelesai,
      kelasId: data.kelasId,
      kitabMapelId: data.kitabMapelId,
      ustadzId: data.ustadzId
    }).where(eq(jadwal.id, id));
    await logAudit(operatorId, "UPDATE_JADWAL", `Mengubah jadwal ID ${id}`);
    return { success: true, message: "Jadwal berhasil diubah." };
  } catch (error: any) {
    return { error: error.message || "Gagal mengubah jadwal." };
  }
}
