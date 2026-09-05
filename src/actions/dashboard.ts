"use server";

import { getDb } from "@/lib/db";
import { auth } from "@/auth";
import { 
  santri, 
  ustadz, 
  kelas, 
  kamar, 
  absensiSantri, 
  absensiUstadz, 
  auditLogs,
  users,
  jadwal,
  guruPengganti,
  setoranNadzom,
  kitabNadzom,
  catatanSantri,
  pengumuman,
  nilaiSantri,
  settings
} from "@/lib/db/schema";
import { count, eq, and, sql, desc, inArray } from "drizzle-orm";

function getJakartaTodayStr(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
}

// 1. Operator Stats
export async function getOperatorDashboardStats() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "OPERATOR" && session.user.role !== "SUPER_ADMIN")) {
    return null;
  }

  const db = getDb();
  if (!db) return null;

  try {
    const today = getJakartaTodayStr();
    
    // Concurrent parallel counts in a single network round-trip
    const [
      totalSantriResult,
      totalUstadzResult,
      totalKelasResult,
      totalKamarResult,
      hadirResult,
      izinResult,
      alphaResult
    ] = await Promise.all([
      db.select({ count: count() }).from(santri).where(eq(santri.statusAktif, true)).catch(() => [{ count: 0 }]),
      db.select({ count: count() }).from(ustadz).catch(() => [{ count: 0 }]),
      db.select({ count: count() }).from(kelas).catch(() => [{ count: 0 }]),
      db.select({ count: count() }).from(kamar).catch(() => [{ count: 0 }]),
      db.select({ count: count() }).from(absensiSantri)
        .where(and(eq(absensiSantri.tanggal, today), eq(absensiSantri.status, "Masuk"))).catch(() => [{ count: 0 }]),
      db.select({ count: count() }).from(absensiSantri)
        .where(and(eq(absensiSantri.tanggal, today), eq(absensiSantri.status, "Izin"))).catch(() => [{ count: 0 }]),
      db.select({ count: count() }).from(absensiSantri)
        .where(and(eq(absensiSantri.tanggal, today), eq(absensiSantri.status, "Alpha"))).catch(() => [{ count: 0 }])
    ]);

    return {
      totalSantri: totalSantriResult[0]?.count || 0,
      totalUstadz: totalUstadzResult[0]?.count || 0,
      totalKelas: totalKelasResult[0]?.count || 0,
      totalKamar: totalKamarResult[0]?.count || 0,
      santriHadir: hadirResult[0]?.count || 0,
      santriIzin: izinResult[0]?.count || 0,
      santriAlpha: alphaResult[0]?.count || 0,
    };
  } catch (error) {
    console.error("Failed to get operator stats:", error);
    return null;
  }
}

// 2. Pengasuh Stats (Realtime Monitoring)
export async function getPengasuhDashboardStats() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "PENGASUH" && session.user.role !== "SUPER_ADMIN")) {
    return null;
  }

  const db = getDb();
  if (!db) return null;

  try {
    const today = getJakartaTodayStr();

    // Concurrent parallel queries in a single network round-trip
    const [
      activeUstadzResult,
      substitutionResult,
      totalSantriResult,
      santriHadirResult,
      santriIzinResult,
      santriAlphaResult,
      totalKelasResult
    ] = await Promise.all([
      db.select({ count: count() }).from(absensiUstadz).where(eq(absensiUstadz.tanggal, today)).catch(() => [{ count: 0 }]),
      db.select({ count: count() }).from(guruPengganti).where(eq(guruPengganti.tanggal, today)).catch(() => [{ count: 0 }]),
      db.select({ count: count() }).from(santri).where(eq(santri.statusAktif, true)).catch(() => [{ count: 0 }]),
      db.select({ count: count() }).from(absensiSantri).where(and(eq(absensiSantri.tanggal, today), eq(absensiSantri.status, "Masuk"))).catch(() => [{ count: 0 }]),
      db.select({ count: count() }).from(absensiSantri).where(and(eq(absensiSantri.tanggal, today), eq(absensiSantri.status, "Izin"))).catch(() => [{ count: 0 }]),
      db.select({ count: count() }).from(absensiSantri).where(and(eq(absensiSantri.tanggal, today), eq(absensiSantri.status, "Alpha"))).catch(() => [{ count: 0 }]),
      db.select({ count: count() }).from(kelas).catch(() => [{ count: 0 }])
    ]);

    const kelasAktif = activeUstadzResult[0]?.count || 0;
    const kelasKosong = Math.max(0, (totalKelasResult[0]?.count || 0) - kelasAktif);

    return {
      kelasAktif,
      kelasKosong,
      ustadzHadir: activeUstadzResult[0]?.count || 0,
      guruPengganti: substitutionResult[0]?.count || 0,
      santriHadir: santriHadirResult[0]?.count || 0,
      santriIzin: santriIzinResult[0]?.count || 0,
      santriAlpha: santriAlphaResult[0]?.count || 0,
      totalSantri: totalSantriResult[0]?.count || 0
    };
  } catch (error) {
    console.error("Failed to get pengasuh stats:", error);
    return null;
  }
}

// 3. Super Admin Audit Logs and System Metrics
export async function getSuperAdminDashboardStats() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return null;
  }

  const db = getDb();
  if (!db) return null;

  try {
    const totalUsersResult = await db.select({ count: count() }).from(users);
    const logs = await db.select().from(auditLogs).orderBy(sql`${auditLogs.timestamp} DESC`).limit(10);
    
    return {
      totalUsers: totalUsersResult[0]?.count || 0,
      recentLogs: logs
    };
  } catch (error) {
    console.error("Failed to get superadmin stats:", error);
    return null;
  }
}

// 4. Ustadz Stats (schedule, class sessions)
export async function getUstadzDashboardStats(ustadzId: string) {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role !== "SUPER_ADMIN" && session.user.ustadzId !== ustadzId) {
    return null;
  }

  const db = getDb();
  if (!db) return null;

  try {
    const scheduleList = await db.select().from(jadwal).where(eq(jadwal.ustadzId, ustadzId));
    return {
      schedules: scheduleList
    };
  } catch (error) {
    console.error("Failed to get ustadz stats:", error);
    return null;
  }
}

// 5. Wali Santri Stats (child academic & attendance data)
export async function getWaliDashboardStats(waliId: string) {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role !== "SUPER_ADMIN" && session.user.waliId !== waliId) {
    return null;
  }

  const db = getDb();
  if (!db) return null;

  try {
    // Find all children linked to this Wali
    const children = await db.select().from(santri).where(eq(santri.waliId, waliId));
    
    if (children.length === 0) return { children: [], announcements: [] };

    // Get active semester from settings
    const systemSettings = await db.select().from(settings).limit(1);
    const activeSemesterId = systemSettings[0]?.semesterAktifId || null;

    // Fetch master kitabs once outside the loop to prevent N+1 queries
    const allNads = await db.select().from(kitabNadzom);
    const today = getJakartaTodayStr();

    const childDataList = [];

    for (const child of children) {
      // Get class and kamar name
      const childKelas = child.kelasId ? await db.select().from(kelas).where(eq(kelas.id, child.kelasId)).limit(1) : [];
      const childKamar = child.kamarId ? await db.select().from(kamar).where(eq(kamar.id, child.kamarId)).limit(1) : [];

      // Get attendance count
      const childTodayAbsensi = await db.select().from(absensiSantri)
        .where(and(eq(absensiSantri.santriId, child.id), eq(absensiSantri.tanggal, today))).limit(1);

      // Get recent hafalan from setoranNadzom
      const recentHafalanRaw = await db.select({
        id: setoranNadzom.id,
        tanggal: setoranNadzom.tanggal,
        namaKitab: kitabNadzom.namaKitab,
        baitMulai: setoranNadzom.baitMulai,
        baitSelesai: setoranNadzom.baitSelesai,
        status: setoranNadzom.status
      })
      .from(setoranNadzom)
      .innerJoin(kitabNadzom, eq(setoranNadzom.kitabNadzomId, kitabNadzom.id))
      .where(eq(setoranNadzom.santriId, child.id))
      .orderBy(desc(setoranNadzom.tanggal))
      .limit(5);

      const recentHafalan = recentHafalanRaw.map((h: any) => ({
        id: h.id,
        tanggal: h.tanggal,
        jenisHafalan: h.namaKitab,
        keteranganHafalan: `Bait ${h.baitMulai} s.d ${h.baitSelesai} (${h.status})`
      }));

      // Calculate overall progress pct
      const childSetorans = await db.select().from(setoranNadzom).where(eq(setoranNadzom.santriId, child.id));
      const highestSetorans: Record<string, number> = {};
      for (const s of childSetorans) {
        if (!highestSetorans[s.kitabNadzomId] || highestSetorans[s.kitabNadzomId] < s.baitSelesai) {
          highestSetorans[s.kitabNadzomId] = s.baitSelesai;
        }
      }
      let totalNadzomPct = 0;
      let countActiveNadzom = 0;
      for (const nzm of allNads) {
        const highestBait = highestSetorans[nzm.id] || 0;
        if (highestBait > 0) {
          totalNadzomPct += Math.round((highestBait / nzm.jumlahBait) * 100);
          countActiveNadzom++;
        }
      }
      const nadzomProgressPct = countActiveNadzom > 0 ? Math.round(totalNadzomPct / countActiveNadzom) : 0;

      // Get recent catatan
      const recentCatatan = await db.select().from(catatanSantri)
        .where(eq(catatanSantri.santriId, child.id)).orderBy(sql`${catatanSantri.tanggal} DESC`).limit(5);

      // Check if raport is available (nilai has been entered for active semester)
      let hasPublishedRaport = false;
      if (activeSemesterId) {
        const nilaiCheck = await db.select({ id: nilaiSantri.id })
          .from(nilaiSantri)
          .where(and(
            eq(nilaiSantri.santriId, child.id),
            eq(nilaiSantri.semesterId, activeSemesterId)
          ))
          .limit(1);
        hasPublishedRaport = nilaiCheck.length > 0;
      }

      childDataList.push({
        child,
        kelasName: childKelas[0]?.namaKelas || "Belum ada kelas",
        kamarName: childKamar[0]?.namaKamar || "Belum ada kamar",
        todayAttendance: childTodayAbsensi[0]?.status || "Belum Absen",
        hafalan: recentHafalan,
        catatan: recentCatatan,
        nadzomProgressPct,
        hasPublishedRaport,
        activeSemesterId
      });
    }

    // Get current announcements
    const announcements = await db.select().from(pengumuman).limit(5);

    return {
      children: childDataList,
      announcements
    };
  } catch (error) {
    console.error("Failed to get wali stats:", error);
    return null;
  }
}

// 6. Mustahiq Class Stats
export async function getMustahiqDashboardStats(ustadzId: string) {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role !== "SUPER_ADMIN" && (session.user.role !== "MUSTAHIQ" || session.user.ustadzId !== ustadzId)) {
    return null;
  }

  const db = getDb();
  if (!db) return null;

  try {
    const today = getJakartaTodayStr();

    // Find class perwalian
    const kelasList = await db.select().from(kelas).where(eq(kelas.waliKelasId, ustadzId)).limit(1);
    if (kelasList.length === 0) {
      return { kelas: null };
    }
    const myKelas = kelasList[0];

    // Find all students in this class
    const students = await db.select().from(santri).where(eq(santri.kelasId, myKelas.id));
    const totalSantri = students.length;

    if (totalSantri === 0) {
      return { 
        kelas: myKelas, 
        totalSantri: 0, 
        santriHadir: 0, 
        santriTerlambat: 0, 
        santriIzin: 0, 
        santriAlpha: 0, 
        kelasRataRata: 0, 
        kelasProgresHafalan: 0 
      };
    }

    const studentIds = students.map((s: any) => s.id);

    // Get today's attendance for these students
    const attendance = await db.select().from(absensiSantri)
      .where(and(
        inArray(absensiSantri.santriId, studentIds),
        eq(absensiSantri.tanggal, today)
      ));

    const santriHadir = attendance.filter((a: any) => a.status === "Masuk").length;
    const santriTerlambat = attendance.filter((a: any) => a.status === "Terlambat").length;
    const santriIzin = attendance.filter((a: any) => a.status === "Izin").length;
    const santriAlpha = attendance.filter((a: any) => a.status === "Alpha").length;

    // Get average grades for this class
    // Join nilaiSantri and calculate average
    const grades = await db.select({
      nilai: nilaiSantri.nilai
    }).from(nilaiSantri)
      .where(inArray(nilaiSantri.santriId, studentIds));

    const totalGrades = grades.reduce((acc: number, curr: any) => acc + curr.nilai, 0);
    const kelasRataRata = grades.length > 0 ? parseFloat((totalGrades / grades.length).toFixed(1)) : 0;

    // Get average hafalan progress
    // Get master kitabs to know total bait
    const nadzoms = await db.select().from(kitabNadzom);
    
    // Batch query: Get all setorans for all students in this class in ONE single network round-trip
    const allClassSetorans = await db.select().from(setoranNadzom)
      .where(inArray(setoranNadzom.santriId, studentIds))
      .orderBy(desc(setoranNadzom.baitSelesai));

    const studentSetoransMap = new Map<string, any[]>();
    for (const set of allClassSetorans) {
      if (!studentSetoransMap.has(set.santriId)) {
        studentSetoransMap.set(set.santriId, []);
      }
      studentSetoransMap.get(set.santriId)!.push(set);
    }

    let totalProgressPct = 0;
    let studentSetoranCount = 0;

    for (const sId of studentIds) {
      const studentSetorans = studentSetoransMap.get(sId) || [];
      
      if (studentSetorans.length > 0) {
        // Find highest setoran per nadzom
        const highestSetorans: Record<string, number> = {};
        for (const set of studentSetorans) {
          if (!highestSetorans[set.kitabNadzomId] || highestSetorans[set.kitabNadzomId] < set.baitSelesai) {
            highestSetorans[set.kitabNadzomId] = set.baitSelesai;
          }
        }
        
        let subProgress = 0;
        let activeNadCount = 0;
        for (const [nzmId, val] of Object.entries(highestSetorans)) {
          const kit = nadzoms.find((n: any) => n.id === nzmId);
          if (kit) {
            subProgress += (val / kit.jumlahBait);
            activeNadCount++;
          }
        }
        
        if (activeNadCount > 0) {
          totalProgressPct += (subProgress / activeNadCount);
          studentSetoranCount++;
        }
      }
    }

    const kelasProgresHafalan = studentSetoranCount > 0 
      ? Math.round((totalProgressPct / totalSantri) * 100) 
      : 0;

    return {
      kelas: myKelas,
      totalSantri,
      santriHadir,
      santriTerlambat,
      santriIzin,
      santriAlpha,
      kelasRataRata,
      kelasProgresHafalan,
      students
    };
  } catch (error) {
    console.error("Failed to get mustahiq stats:", error);
    return null;
  }
}
