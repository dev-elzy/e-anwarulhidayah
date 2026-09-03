"use server";

import { getDb } from "@/lib/db";
import { absensiSantri } from "@/lib/db/schema";

export async function saveAbsensiManual(
  jadwalId: string,
  tanggal: string,
  ustadzId: string,
  records: { santriId: string; status: string }[]
) {
  const db = getDb();
  if (!db) return { error: "Database not available" };

  try {
    const insertData = records.map((rec) => ({
      id: crypto.randomUUID(),
      santriId: rec.santriId,
      jadwalId,
      tanggal,
      status: rec.status,
      ustadzId,
    }));

    if (insertData.length > 0) {
      await db.insert(absensiSantri).values(insertData);
    }

    return { success: true, message: "Absensi manual berhasil disimpan." };
  } catch (error: any) {
    console.error("Failed to save manual absensi:", error);
    return { error: error.message || "Gagal menyimpan absensi manual." };
  }
}
