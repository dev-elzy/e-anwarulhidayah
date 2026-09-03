import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { santri, kelas, kamar } from "@/lib/db/schema";
import * as XLSX from "xlsx";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";


export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "OPERATOR" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database tidak terhubung." }, { status: 500 });
  }

  const santriList = await db.select().from(santri).where(eq(santri.statusAktif, true));
  const kelasList = await db.select().from(kelas);
  const kamarList = await db.select().from(kamar);

  const kelasMap = Object.fromEntries(kelasList.map((k: any) => [k.id, k.namaKelas]));
  const kamarMap = Object.fromEntries(kamarList.map((k: any) => [k.id, k.namaKamar]));

  const headers = [
    "NIS",
    "Nama Lengkap",
    "Jenis Kelamin (L/P)",
    "Tempat Lahir",
    "Tanggal Lahir (YYYY-MM-DD)",
    "Alamat",
    "Nama Ayah",
    "Nama Ibu",
    "No HP Wali",
    "Kelas",
    "Kamar",
    "Tahun Masuk",
    "Status Aktif",
  ];

  const rows = santriList.map((s: any) => [
    s.nis,
    s.namaLengkap,
    s.jenisKelamin,
    s.tempatLahir,
    s.tanggalLahir,
    s.alamat,
    s.namaAyah,
    s.namaIbu,
    s.nomorHpWali,
    kelasMap[s.kelasId] || "",
    kamarMap[s.kamarId] || "",
    s.tahunMasuk,
    s.statusAktif ? "Aktif" : "Non-Aktif",
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data Santri");

  // Generate Excel buffer in Edge-compatible mode (array buffer)
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  
  const filename = `data-santri-${new Date().toISOString().split("T")[0]}.xlsx`;

  return new NextResponse(excelBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
