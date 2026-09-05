"use server";

import { getDb } from "@/lib/db";
import { auth } from "@/auth";
import { 
  absensiUstadz, 
  guruPengganti, 
  jadwal, 
  kelas, 
  santri,
  absensiSantri,
  classSessions,
  catatanPembelajaran,
  users,
  ustadz,
  auditLogs
} from "@/lib/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";

interface ScanParams {
  kelasId: string;
  ustadzId: string;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

function getJakartaParts(date: Date = new Date()) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  });
  const parts = dtf.formatToParts(date);
  const partMap: Record<string, string> = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }
  let hour = parseInt(partMap.hour || '0', 10);
  if (hour === 24) hour = 0;
  const minute = parseInt(partMap.minute || '0', 10);
  const second = parseInt(partMap.second || '0', 10);
  const year = parseInt(partMap.year || '2026', 10);
  const month = parseInt(partMap.month || '1', 10);
  const day = parseInt(partMap.day || '1', 10);

  return { year, month, day, hour, minute, second };
}

export async function processClassScan({ kelasId, ustadzId }: ScanParams) {
  const db = getDb();
  if (!db) {
    return { error: "Database tidak terhubung." };
  }

  try {
    const { year, month, day, hour: nowHour, minute: nowMin } = getJakartaParts();
    const nowMinutes = nowHour * 60 + nowMin;
    const nowTimeStr = `${String(nowHour).padStart(2, '0')}:${String(nowMin).padStart(2, '0')}:00`;

    // Create a date object representing local Jakarta time
    const jktDateObj = new Date(year, month - 1, day);

    // Shift date if >= 18:00 (Pesantren Logic: Maghrib shifts day to tomorrow)
    if (nowHour >= 18) {
      jktDateObj.setDate(jktDateObj.getDate() + 1);
    }

    const today = `${jktDateObj.getFullYear()}-${String(jktDateObj.getMonth() + 1).padStart(2, '0')}-${String(jktDateObj.getDate()).padStart(2, '0')}`;
    const daysIndo = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const currentDayName = daysIndo[jktDateObj.getDay()];
    
    // Find class to ensure it's valid
    const classExists = await db.select().from(kelas).where(eq(kelas.id, kelasId)).limit(1);
    if (classExists.length === 0) {
      return { error: "Kelas tidak terdaftar." };
    }

    // Find all schedules for this class today
    const classSchedules = await db.select().from(jadwal)
      .where(and(
        eq(jadwal.kelasId, kelasId),
        eq(jadwal.hari, currentDayName)
      ));

    if (classSchedules.length === 0) {
      return { error: `Tidak ada jadwal pelajaran untuk kelas ini pada hari ${currentDayName}.` };
    }

    // Validate schedule time: find schedule where current time is within [jamMulai - 30 mins, jamSelesai]
    let activeSchedule = null;
    for (const sched of classSchedules) {
      const startMin = timeToMinutes(sched.jamMulai);
      const endMin = timeToMinutes(sched.jamSelesai);
      if (nowMinutes >= startMin - 30 && nowMinutes <= endMin) {
        activeSchedule = sched;
        break;
      }
    }

    if (!activeSchedule) {
      return { 
        error: `Tidak ada jam pelajaran aktif untuk kelas ini saat ini. Jadwal hari ${currentDayName}: ` +
          classSchedules.map((s: any) => `${s.jamMulai}-${s.jamSelesai}`).join(", ") 
      };
    }

    // Check if class has already been scanned today
    const existingSession = await db.select().from(classSessions)
      .where(and(
        eq(classSessions.kelasId, kelasId),
        eq(classSessions.tanggal, today)
      )).limit(1);

    if (existingSession.length > 0) {
      return { 
        error: "Kelas Anda sudah melakukan absensi pada hari ini."
      };
    }

    // Check if the ustadz has already scanned any class today
    const existingUstadz = await db.select().from(absensiUstadz)
      .where(and(
        eq(absensiUstadz.ustadzId, ustadzId),
        eq(absensiUstadz.tanggal, today)
      )).limit(1);
    
    if (existingUstadz.length > 0) {
      return { 
        error: "Anda sudah melakukan absensi pada hari ini. Scan tidak dapat dilakukan kembali."
      };
    }


    // Determine teacher type (PRIMARY vs SUBSTITUTE)
    const isPrimary = activeSchedule.ustadzId === ustadzId;
    const teacherType = isPrimary ? "PRIMARY" : "SUBSTITUTE";

    // Determine attendance status based on timing (jam 20:15 default)
    // Hadir = scan <= jamMulai + 5 menit
    // Terlambat = scan > jamMulai + 5 menit
    // Izin = guru pengganti hadir (original teacher marked Izin automatically)
    const scheduleStartMin = timeToMinutes(activeSchedule.jamMulai);
    let attendanceStatus: string;
    if (isPrimary) {
      attendanceStatus = nowMinutes <= scheduleStartMin ? "Hadir" : "Terlambat";
    } else {
      // Guru pengganti always marked as Hadir (Pengganti)
      attendanceStatus = "Hadir (Pengganti)";
    }

    // Open a new Class Session
    const sessionId = "SESS-" + Math.random().toString(36).substring(2, 11).toUpperCase();
    await db.insert(classSessions).values({
      id: sessionId,
      kelasId: kelasId,
      jadwalId: activeSchedule.id,
      tanggal: today,
      jamMulai: activeSchedule.jamMulai,
      jamSelesai: activeSchedule.jamSelesai,
      status: "OPEN",
      tahunAjaranId: activeSchedule.tahunAjaranId,
      semesterId: activeSchedule.semesterId
    });

    // Record Guru Pengganti if needed
    // Original teacher is automatically marked as Izin when a substitute scans
    if (!isPrimary) {
      const substitutionId = "SUB-" + Math.random().toString(36).substring(2, 11).toUpperCase();
      await db.insert(guruPengganti).values({
        id: substitutionId,
        ustadzAsliId: activeSchedule.ustadzId,
        ustadzPenggantiId: ustadzId,
        jadwalId: activeSchedule.id,
        tanggal: today,
        waktu: nowTimeStr
      });

      // Mark the original teacher as "Izin" (they sent a substitute)
      const originalAttId = "ABS-UST-" + Math.random().toString(36).substring(2, 11).toUpperCase();
      await db.insert(absensiUstadz).values({
        id: originalAttId,
        ustadzId: activeSchedule.ustadzId,
        jadwalId: activeSchedule.id,
        sessionId: sessionId,
        tanggal: today,
        waktuScan: nowTimeStr,
        status: "Izin",
        teacherType: "PRIMARY"
      });
    }

    // Record scanning teacher's own attendance linked to session
    const attendanceId = "ABS-UST-" + Math.random().toString(36).substring(2, 11).toUpperCase();
    await db.insert(absensiUstadz).values({
      id: attendanceId,
      ustadzId: ustadzId,
      jadwalId: activeSchedule.id,
      sessionId: sessionId,
      tanggal: today,
      waktuScan: nowTimeStr,
      status: attendanceStatus,
      teacherType: teacherType
    });

    return {
      success: true,
      message: isPrimary 
        ? `Sesi mengajar dibuka. Presensi Kehadiran berhasil dicatat di ${classExists[0].namaKelas}.`
        : `Sesi mengajar dibuka sebagai Guru Pengganti untuk ${classExists[0].namaKelas}.`,
      scheduleId: activeSchedule.id,
      kelasId: kelasId,
      sessionId: sessionId
    };
  } catch (error) {
    console.error("Scan processing error:", error);
    return { error: "Terjadi kesalahan sistem saat menyimpan presensi." };
  }
}

// Fetch class student roster for attendance
export async function getStudentsForAttendance(kelasId: string, sessionId: string) {
  const db = getDb();
  if (!db) return [];

  try {
    // Check if students have already been attended for today's session
    const currentAttendance = await db.select().from(absensiSantri)
      .where(eq(absensiSantri.sessionId, sessionId));

    // Get all students in the class
    const classStudents = await db.select().from(santri).where(eq(santri.kelasId, kelasId));

    if (currentAttendance.length > 0) {
      return classStudents.map((student: any) => {
        const studentAbsen = currentAttendance.find((a: any) => a.santriId === student.id);
        return {
          student,
          status: studentAbsen ? studentAbsen.status : "Masuk"
        };
      });
    }

    return classStudents.map((student: any) => ({
      student,
      status: "Masuk"
    }));
  } catch (error) {
    console.error("Failed to load class students:", error);
    return [];
  }
}

// Save student attendance, write lesson notes, and close session
export async function saveStudentsAttendance(
  sessionId: string,
  records: { studentId: string; status: string }[],
  userId: string,
  materi?: string,
  catatan?: string
) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung." };

  try {
    // Get current Jakarta time & date
    const { year, month, day, hour: nowHour } = getJakartaParts();

    const jktDateObj = new Date(year, month - 1, day);
    if (nowHour >= 18) {
      jktDateObj.setDate(jktDateObj.getDate() + 1);
    }
    const today = `${jktDateObj.getFullYear()}-${String(jktDateObj.getMonth() + 1).padStart(2, '0')}-${String(jktDateObj.getDate()).padStart(2, '0')}`;

    // Fetch session to retrieve schedule details
    const sessionList = await db.select().from(classSessions).where(eq(classSessions.id, sessionId)).limit(1);
    if (sessionList.length === 0) {
      return { error: "Sesi kelas tidak ditemukan." };
    }
    const session = sessionList[0];

    // 1. Get real ustadzId from users table
    const userDetail = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    let resolvedUstadzId = userDetail[0]?.ustadzId;

    // 2. Fallback to session's schedule teacher if user is not linked to an ustadz
    if (!resolvedUstadzId) {
      const scheduleDetail = await db.select().from(jadwal).where(eq(jadwal.id, session.jadwalId)).limit(1);
      resolvedUstadzId = scheduleDetail[0]?.ustadzId;
    }

    // 3. Last fallback: use the first ustadz in database
    if (!resolvedUstadzId) {
      const firstUstadz = await db.select().from(ustadz).limit(1);
      resolvedUstadzId = firstUstadz[0]?.id;
    }

    if (!resolvedUstadzId) {
      return { error: "Simpan absensi gagal: Tidak ada data Ustadz yang valid di sistem." };
    }

    // Delete existing student attendance for this session
    await db.delete(absensiSantri).where(eq(absensiSantri.sessionId, sessionId));

    // Insert new student attendance records
    for (const record of records) {
      const attendanceId = "ABS-SNT-" + Math.random().toString(36).substring(2, 11).toUpperCase();
      await db.insert(absensiSantri).values({
        id: attendanceId,
        santriId: record.studentId,
        jadwalId: session.jadwalId,
        sessionId: sessionId,
        tanggal: today,
        status: record.status,
        ustadzId: resolvedUstadzId
      });
    }

    // Set class session status to CLOSED
    await db.update(classSessions).set({
      status: "CLOSED"
    }).where(eq(classSessions.id, sessionId));

    // Insert Catatan Pembelajaran if filled
    if (materi || catatan) {
      // Clear existing first
      await db.delete(catatanPembelajaran).where(eq(catatanPembelajaran.sessionId, sessionId));
      
      const noteId = "CTP-" + Math.random().toString(36).substring(2, 11).toUpperCase();
      await db.insert(catatanPembelajaran).values({
        id: noteId,
        sessionId: sessionId,
        materi: materi || "Pembahasan materi harian",
        catatan: catatan || "Berjalan tertib"
      });
    }

    return { success: true, message: "Absensi kelas dan catatan pembelajaran berhasil disimpan." };
  } catch (error) {
    console.error("Save attendance error:", error);
    return { error: "Terjadi kesalahan sistem saat menyimpan absensi santri." };
  }
}

// =====================================
// OPERATOR ACTIONS
// =====================================

export async function deleteAbsensiSantri(id: string, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung." };

  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== "OPERATOR" && session.user.role !== "SUPER_ADMIN")) {
      return { error: "Akses ditolak: Anda tidak memiliki izin untuk menghapus data absensi." };
    }
    const verifiedOperatorId = session.user.id || operatorId;

    const log = await db.select().from(absensiSantri).where(eq(absensiSantri.id, id)).limit(1);
    if (!log.length) return { error: "Data absensi santri tidak ditemukan." };

    await db.delete(absensiSantri).where(eq(absensiSantri.id, id));

    const auditId = "AUD-" + Math.random().toString(36).substring(2, 11).toUpperCase();
    await db.insert(auditLogs).values({
      id: auditId,
      userId: verifiedOperatorId,
      action: "DELETE_ABSENSI_SANTRI",
      details: `Operator menghapus absensi santri ID: ${id}, Tanggal: ${log[0].tanggal}, Status: ${log[0].status}`,
      timestamp: new Date().toISOString()
    });

    return { success: true, message: "Data absensi santri berhasil dihapus." };
  } catch (error) {
    console.error("Delete absensi santri error:", error);
    return { error: "Gagal menghapus absensi santri." };
  }
}

export async function deleteAllAbsensiSantri(ids: string[], operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung." };

  try {
    if (!ids || ids.length === 0) return { error: "Tidak ada data yang dipilih." };

    const session = await auth();
    if (!session?.user || (session.user.role !== "OPERATOR" && session.user.role !== "SUPER_ADMIN")) {
      return { error: "Akses ditolak: Anda tidak memiliki izin untuk menghapus data absensi." };
    }
    const verifiedOperatorId = session.user.id || operatorId;

    await db.delete(absensiSantri).where(inArray(absensiSantri.id, ids));

    const auditId = "AUD-" + Math.random().toString(36).substring(2, 11).toUpperCase();
    await db.insert(auditLogs).values({
      id: auditId,
      userId: verifiedOperatorId,
      action: "DELETE_ALL_ABSENSI_SANTRI",
      details: `Operator menghapus massal ${ids.length} data absensi santri.`,
      timestamp: new Date().toISOString()
    });

    return { success: true, message: `${ids.length} data absensi santri berhasil dihapus.` };
  } catch (error) {
    console.error("Delete all absensi santri error:", error);
    return { error: "Gagal menghapus absensi santri secara massal." };
  }
}

export async function deleteAbsensiUstadz(id: string, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung." };

  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== "OPERATOR" && session.user.role !== "SUPER_ADMIN")) {
      return { error: "Akses ditolak: Anda tidak memiliki izin untuk menghapus data absensi ustadz." };
    }
    const verifiedOperatorId = session.user.id || operatorId;

    const log = await db.select().from(absensiUstadz).where(eq(absensiUstadz.id, id)).limit(1);
    if (!log.length) return { error: "Data absensi ustadz tidak ditemukan." };

    await db.delete(absensiUstadz).where(eq(absensiUstadz.id, id));

    const auditId = "AUD-" + Math.random().toString(36).substring(2, 11).toUpperCase();
    await db.insert(auditLogs).values({
      id: auditId,
      userId: verifiedOperatorId,
      action: "DELETE_ABSENSI_USTADZ",
      details: `Operator menghapus absensi ustadz ID: ${id}, Tanggal: ${log[0].tanggal}, Tipe: ${log[0].teacherType}`,
      timestamp: new Date().toISOString()
    });

    return { success: true, message: "Data absensi ustadz berhasil dihapus." };
  } catch (error) {
    console.error("Delete absensi ustadz error:", error);
    return { error: "Gagal menghapus absensi ustadz." };
  }
}

export async function updateAbsensiUstadz(id: string, newStatus: string, operatorId: string) {
  const db = getDb();
  if (!db) return { error: "Database tidak terhubung." };

  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== "OPERATOR" && session.user.role !== "SUPER_ADMIN")) {
      return { error: "Akses ditolak: Anda tidak memiliki izin untuk mengubah data absensi ustadz." };
    }
    const verifiedOperatorId = session.user.id || operatorId;

    const log = await db.select().from(absensiUstadz).where(eq(absensiUstadz.id, id)).limit(1);
    if (!log.length) return { error: "Data absensi ustadz tidak ditemukan." };

    await db.update(absensiUstadz)
      .set({ status: newStatus })
      .where(eq(absensiUstadz.id, id));

    const auditId = "AUD-" + Math.random().toString(36).substring(2, 11).toUpperCase();
    await db.insert(auditLogs).values({
      id: auditId,
      userId: verifiedOperatorId,
      action: "UPDATE_ABSENSI_USTADZ",
      details: `Operator mengubah status absensi ustadz ID: ${id} dari ${log[0].status} menjadi ${newStatus}.`,
      timestamp: new Date().toISOString()
    });

    return { success: true, message: "Status kehadiran ustadz berhasil diperbarui." };
  } catch (error) {
    console.error("Update absensi ustadz error:", error);
    return { error: "Gagal mengubah status kehadiran ustadz." };
  }
}

export async function getAbsensiSantriList() {
  const db = getDb();
  if (!db) return [];
  try {
    const list = await db.select().from(absensiSantri).orderBy(sql`${absensiSantri.tanggal} DESC`);
    return list;
  } catch (err) {
    console.error("Failed to load absensi santri:", err);
    return [];
  }
}
