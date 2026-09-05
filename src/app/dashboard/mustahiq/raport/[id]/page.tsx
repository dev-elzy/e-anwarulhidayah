import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { 
  santri, 
  kelas, 
  ustadz, 
  settings, 
  semester, 
  tahunAjaran, 
  nilaiSantri, 
  kitabMapel, 
  absensiSantri, 
  classSessions, 
  rekapAbsensiBulanHijriah,
  jadwal
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { RaportPesantrenClassic } from "@/components/raport-pesantren-classic";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ semesterId?: string; mode?: string }>;
}

function getHijriYear(gregorian: string) {
  if (!gregorian) return "١٤٤٧ - ١٤٤٨";
  const years = gregorian.split(/[\/\-]/);
  if (years.length >= 2) {
    const y1 = parseInt(years[0]);
    const y2 = parseInt(years[1]);
    if (!isNaN(y1) && !isNaN(y2)) {
      return `${y1 - 579} - ${y2 - 579}`;
    }
  }
  const y = parseInt(gregorian);
  if (!isNaN(y)) {
    return `${y - 579}`;
  }
  return "١٤٤٧ - ١٤٤٨";
}

function getPredikatBayan(rataRata: number): string {
  // Normalisasi jika skala nilai menggunakan 0-100 (misal 85 -> 8.5)
  const val = rataRata > 10 ? rataRata / 10 : rataRata;

  if (val >= 8.5) return "جيد الأولى";
  if (val >= 6.5) return "جيد الثاني";
  if (val >= 5.5) return "المتوسط الأولى";
  if (val >= 4.0) return "المتوسط الثاني";
  return "رديء";
}

function getAkhlaqHuruf(nilaiRata: number) {
  const val = nilaiRata > 10 ? nilaiRata / 10 : nilaiRata;
  if (val >= 8.5) return "أ";
  if (val >= 6.5) return "ج";
  return "م";
}

export default async function RaportDetailPage({ params, searchParams }: PageProps) {
  const session = await auth();

  // Validate session and role (allow Mustahiq, Operator, Super Admin, Wali)
  if (!session || (session.user.role !== "MUSTAHIQ" && session.user.role !== "SUPER_ADMIN" && session.user.role !== "WALI_SANTRI" && session.user.role !== "OPERATOR")) {
    redirect("/login");
  }

  const { id: studentId } = await params;
  const { semesterId } = await searchParams;

  const db = getDb();
  if (!db) {
    return <div className="p-8 text-center text-red-500 font-bold">Database tidak terhubung</div>;
  }

  // 1. Fetch student info
  const studentData = await db.select({
    id: santri.id,
    nis: santri.nis,
    namaLengkap: santri.namaLengkap,
    jenisKelamin: santri.jenisKelamin,
    kelasId: santri.kelasId,
    waliId: santri.waliId,
  })
  .from(santri)
  .where(eq(santri.id, studentId))
  .limit(1);

  if (studentData.length === 0) {
    return <div className="p-8 text-center text-red-500 font-bold">Data santri tidak ditemukan</div>;
  }

  const activeStudent = studentData[0];

  // Prevent IDOR: Wali Santri may only view raport for their own children
  if (session.user.role === "WALI_SANTRI" && activeStudent.waliId !== session.user.waliId) {
    redirect("/dashboard/wali");
  }

  const classId = activeStudent.kelasId || "NONE";

  // 2. Fetch Settings
  const settingRows = await db.select().from(settings).limit(1);
  const activeSettings = settingRows[0] || {
    id: "system",
    namaPondok: "Pondok Pesantren Anwarul Hidayah",
    alamat: "Jl. Pesantren No. 01, Jawa Timur",
    telepon: "081234567890",
    logoUrl: null,
    tahunAjaranAktifId: null,
    semesterAktifId: null,
    tampilkanRanking: true,
    namaPengasuh: "K.H. M. Anwarul Hidayah"
  };

  // 3. Determine active Semester & Year
  let activeSemesterId = semesterId || activeSettings.semesterAktifId;
  let activeSemester: any = null;
  
  if (activeSemesterId) {
    const sem = await db.select().from(semester).where(eq(semester.id, activeSemesterId)).limit(1);
    if (sem.length > 0) activeSemester = sem[0];
  }

  if (!activeSemester) {
    const sem = await db.select().from(semester).where(eq(semester.aktif, true)).limit(1);
    if (sem.length > 0) activeSemester = sem[0];
  }

  if (!activeSemester) {
    const anySem = await db.select().from(semester).limit(1);
    if (anySem.length > 0) activeSemester = anySem[0];
  }

  activeSemesterId = activeSemester ? activeSemester.id : "NONE";
  const activeYearId = activeSemester ? activeSemester.tahunAjaranId : "NONE";

  // Fetch Academic Year details
  let academicYearName = "2026/2027";
  let hijriYear = "١٤٤٧ - ١٤٤٨";
  if (activeYearId !== "NONE") {
    const y = await db.select().from(tahunAjaran).where(eq(tahunAjaran.id, activeYearId)).limit(1);
    if (y.length > 0) {
      academicYearName = y[0].nama;
      hijriYear = getHijriYear(y[0].nama);
    }
  }

  const semesterName = activeSemester ? activeSemester.nama : "Ganjil";

  // Fetch Class and Wali Kelas info
  let activeClass: any = null;
  let waliKelasName = "Ust. Pembimbing";
  if (classId !== "NONE") {
    const c = await db.select().from(kelas).where(eq(kelas.id, classId)).limit(1);
    if (c.length > 0) {
      activeClass = c[0];
      if (activeClass.waliKelasId) {
        const u = await db.select().from(ustadz).where(eq(ustadz.id, activeClass.waliKelasId)).limit(1);
        if (u.length > 0) {
          waliKelasName = u[0].nama;
        }
      }
    }
  }

  // 4. Fetch Grades and Kitab
  const allKitab = await db.select().from(kitabMapel);
  const grades = await db.select({
    id: nilaiSantri.id,
    mapelId: nilaiSantri.kitabMapelId,
    nilai: nilaiSantri.nilai,
    jenis: nilaiSantri.jenis,
  })
  .from(nilaiSantri)
  .where(and(
    eq(nilaiSantri.santriId, studentId),
    eq(nilaiSantri.semesterId, activeSemesterId),
    eq(nilaiSantri.tahunAjaranId, activeYearId)
  ));

  // Fetch subjects scheduled for this specific class
  const classJadwals = await db.select({ mapelId: jadwal.kitabMapelId })
    .from(jadwal)
    .where(and(
      eq(jadwal.kelasId, classId),
      eq(jadwal.semesterId, activeSemesterId),
      eq(jadwal.tahunAjaranId, activeYearId)
    ));
    
  const classMapelIds = new Set(classJadwals.map((j: any) => j.mapelId));

  // Initialize mapel grades
  const mapelGradesMap: Record<string, { mapelName: string; keterangan: string; tamrin: number | null; uas: number | null }> = {};
  for (const k of allKitab) {
    const hasGrade = grades.some((g: any) => g.mapelId === k.id);
    if (classMapelIds.has(k.id) || hasGrade) {
      mapelGradesMap[k.id] = {
        mapelName: k.namaKitabMapel,
        keterangan: k.keterangan || "عام",
        tamrin: null,
        uas: null
      };
    }
  }

  // Populate actual grades
  for (const g of grades) {
    if (!mapelGradesMap[g.mapelId]) continue;
    if (g.jenis === "TAMRIN" || g.jenis === "TAMRIN_1" || g.jenis === "TAMRIN_2") {
      mapelGradesMap[g.mapelId].tamrin = g.nilai;
    } else {
      mapelGradesMap[g.mapelId].uas = g.nilai;
    }
  }

  const tableGrades = Object.values(mapelGradesMap).map((data, index) => {
    return {
      no: index + 1,
      kitabName: data.mapelName,
      fanName: data.keterangan,
      nilaiKhusus: data.tamrin,
      nilaiUmum: data.uas
    };
  });

  const totalKhusus = tableGrades.reduce((sum, g) => sum + (g.nilaiKhusus || 0), 0);
  const totalUmum = tableGrades.reduce((sum, g) => sum + (g.nilaiUmum || 0), 0);

  const gradedItemsCount = tableGrades.filter(g => g.nilaiUmum !== null || g.nilaiKhusus !== null).length;
  const grandTotal = totalKhusus + totalUmum;
  const divisor = gradedItemsCount > 0 ? (gradedItemsCount * (totalKhusus > 0 && totalUmum > 0 ? 2 : 1)) : 1;
  const averageGrade = parseFloat((grandTotal / divisor).toFixed(1));

  // 5. Fetch Attendance
  const attendanceLogs = await db.select({
    status: absensiSantri.status
  })
  .from(absensiSantri)
  .innerJoin(classSessions, eq(absensiSantri.sessionId, classSessions.id))
  .where(and(
    eq(absensiSantri.santriId, studentId),
    eq(classSessions.semesterId, activeSemesterId),
    eq(classSessions.tahunAjaranId, activeYearId)
  ));

  const countDailyIzin = attendanceLogs.filter((a: any) => a.status === "Izin" || a.status === "Sakit").length;
  const countDailyAlpha = attendanceLogs.filter((a: any) => a.status === "Alpha").length;

  const monthlyLogs = await db.select()
    .from(rekapAbsensiBulanHijriah)
    .where(and(
      eq(rekapAbsensiBulanHijriah.santriId, studentId),
      eq(rekapAbsensiBulanHijriah.semesterId, activeSemesterId)
    ));

  const totalMonthlySakit = monthlyLogs.reduce((sum: number, log: any) => sum + log.sakit, 0);
  const totalMonthlyIzin = monthlyLogs.reduce((sum: number, log: any) => sum + log.izin, 0);
  const totalMonthlyAlpha = monthlyLogs.reduce((sum: number, log: any) => sum + log.alpha, 0);

  const finalIzin = countDailyIzin + totalMonthlySakit + totalMonthlyIzin;
  const finalAlpha = countDailyAlpha + totalMonthlyAlpha;

  // 6. Calculate Predikat Bayan & Nilai Akhlaq
  const predikatBayan = getPredikatBayan(averageGrade);
  const nilaiAkhlaqHuruf = getAkhlaqHuruf(averageGrade);

  const backUrl = session.user.role === "WALI_SANTRI" 
    ? "/dashboard/wali" 
    : (session.user.role === "OPERATOR" || session.user.role === "SUPER_ADMIN")
    ? "/dashboard/operator/arsip"
    : "/dashboard/mustahiq/raport";

  const raportData = {
    student: {
      namaLengkap: activeStudent.namaLengkap,
      nis: activeStudent.nis
    },
    kelas: {
      namaKelas: activeClass?.namaKelas || "Kelas I'dadiyah",
      tingkatan: activeClass?.tingkatan || ""
    },
    bagian: activeClass?.tingkatan || "Madrasah",
    semesterName,
    academicYearName,
    hijriYear,
    pengasuhName: activeSettings.namaPengasuh || "K.H. M. Anwarul Hidayah",
    waliKelasName,
    namaPondok: activeSettings.namaPondok || "Pondok Pesantren Anwarul Hidayah",
    alamatPondok: activeSettings.alamat || "Jawa Timur",
    logoUrl: activeSettings.logoUrl,
    grades: tableGrades,
    totalKhusus,
    totalUmum,
    absenIzin: finalIzin,
    absenAlpha: finalAlpha,
    nilaiAkhlaqHuruf,
    rataRata: averageGrade,
    predikatBayan
  };

  return <RaportPesantrenClassic data={raportData} backUrl={backUrl} />;
}
