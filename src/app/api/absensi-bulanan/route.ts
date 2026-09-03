import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { rekapAbsensiBulanHijriah, santri } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "MUSTAHIQ" && session.user.role !== "OPERATOR" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    if (!db) return NextResponse.json({ error: "Database not available" }, { status: 500 });

    const { searchParams } = new URL(request.url);
    const kelasId = searchParams.get("kelasId");
    const semesterId = searchParams.get("semesterId");
    const bulanHijriah = searchParams.get("bulanHijriah");

    if (!kelasId || !semesterId || !bulanHijriah) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // Ambil daftar santri di kelas ini
    const studentsInClass = await db
      .select({
        santriId: santri.id,
        nis: santri.nis,
        namaLengkap: santri.namaLengkap,
      })
      .from(santri)
      .where(eq(santri.kelasId, kelasId))
      .orderBy(santri.namaLengkap);

    // Ambil rekap absen yang sudah ada
    const existingAbsensi = await db
      .select()
      .from(rekapAbsensiBulanHijriah)
      .where(
        and(
          eq(rekapAbsensiBulanHijriah.kelasId, kelasId),
          eq(rekapAbsensiBulanHijriah.semesterId, semesterId),
          eq(rekapAbsensiBulanHijriah.bulanHijriah, bulanHijriah)
        )
      );

    // Gabungkan data
    const records = studentsInClass.map((s: any) => {
      const existing = existingAbsensi.find((a: any) => a.santriId === s.santriId);
      return {
        student: s,
        sakit: existing?.sakit || 0,
        izin: existing?.izin || 0,
        alpha: existing?.alpha || 0,
      };
    });

    return NextResponse.json(records);
  } catch (error: any) {
    console.error("Error GET absensi bulanan:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "MUSTAHIQ" && session.user.role !== "OPERATOR" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    if (!db) return NextResponse.json({ error: "Database not available" }, { status: 500 });

    const body: any = await request.json();
    const { kelasId, semesterId, bulanHijriah, records } = body;

    if (!kelasId || !semesterId || !bulanHijriah || !Array.isArray(records)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    // Hapus data lama untuk kelas, semester, dan bulan ini
    await db
      .delete(rekapAbsensiBulanHijriah)
      .where(
        and(
          eq(rekapAbsensiBulanHijriah.kelasId, kelasId),
          eq(rekapAbsensiBulanHijriah.semesterId, semesterId),
          eq(rekapAbsensiBulanHijriah.bulanHijriah, bulanHijriah)
        )
      );

    // Masukkan data baru
    const insertData = records.map((rec: any) => ({
      id: crypto.randomUUID(),
      santriId: rec.studentId,
      kelasId,
      semesterId,
      bulanHijriah,
      sakit: parseInt(rec.sakit) || 0,
      izin: parseInt(rec.izin) || 0,
      alpha: parseInt(rec.alpha) || 0,
    }));

    if (insertData.length > 0) {
      await db.insert(rekapAbsensiBulanHijriah).values(insertData);
    }

    return NextResponse.json({ success: true, message: "Rekap absensi berhasil disimpan" });
  } catch (error: any) {
    console.error("Error POST absensi bulanan:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
