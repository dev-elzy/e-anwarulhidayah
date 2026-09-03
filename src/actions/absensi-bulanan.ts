"use server";

import { getDb } from "@/lib/db";
import { rekapAbsensiBulanHijriah, santri } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";

export async function getAbsensiBulananRecords(kelasId: string, semesterId: string, bulanHijriah: string) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "MUSTAHIQ" && session.user.role !== "OPERATOR" && session.user.role !== "SUPER_ADMIN")) {
    return [];
  }

  const db = getDb();
  if (!db) return [];

  try {
    const studentsInClass = await db
      .select({
        santriId: santri.id,
        nis: santri.nis,
        namaLengkap: santri.namaLengkap,
      })
      .from(santri)
      .where(eq(santri.kelasId, kelasId))
      .orderBy(santri.namaLengkap);

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

    return studentsInClass.map((s: any) => {
      const existing = existingAbsensi.find((a: any) => a.santriId === s.santriId);
      return {
        santriId: s.santriId,
        student: s,
        sakit: existing?.sakit || 0,
        izin: existing?.izin || 0,
        alpha: existing?.alpha || 0,
      };
    });
  } catch (error) {
    console.error("Failed to load absensi bulanan:", error);
    return [];
  }
}

export async function saveAbsensiBulananRecords(kelasId: string, semesterId: string, bulanHijriah: string, records: any[]) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "MUSTAHIQ" && session.user.role !== "OPERATOR" && session.user.role !== "SUPER_ADMIN")) {
    return { error: "Akses ditolak: Anda tidak memiliki izin untuk menyimpan rekap bulanan." };
  }

  const db = getDb();
  if (!db) return { error: "Database not available" };

  try {
    await db
      .delete(rekapAbsensiBulanHijriah)
      .where(
        and(
          eq(rekapAbsensiBulanHijriah.kelasId, kelasId),
          eq(rekapAbsensiBulanHijriah.semesterId, semesterId),
          eq(rekapAbsensiBulanHijriah.bulanHijriah, bulanHijriah)
        )
      );

    const insertData = records.map((rec: any) => ({
      id: crypto.randomUUID(),
      santriId: rec.santriId,
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

    return { success: true, message: "Rekap absensi berhasil disimpan" };
  } catch (error: any) {
    console.error("Failed to save absensi bulanan:", error);
    return { error: error.message || "Failed to save data" };
  }
}
