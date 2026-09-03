import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { 
  santri, 
  absensiSantri, 
  setoranNadzom, 
  kitabNadzom, 
  catatanSantri, 
  pengumuman,
  jadwal,
  kitabMapel
} from "@/lib/db/schema";
import { eq, or, desc } from "drizzle-orm";
import { WaliSubmenuClient } from "./submenu-client";

export default async function WaliSubmenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();

  // Protect route
  if (!session || session.user.role !== "WALI_SANTRI" || !session.user.waliId) {
    redirect("/login");
  }

  const { slug } = await params;
  const waliId = session.user.waliId;
  const db = getDb();
  if (!db) {
    return <p className="text-center text-red-500 py-10">Database tidak terhubung</p>;
  }

  // Fetch children profiles linked to this Wali
  const children = await db.select({
    id: santri.id,
    nis: santri.nis,
    namaLengkap: santri.namaLengkap,
    kelasId: santri.kelasId,
    kamarId: santri.kamarId,
  })
  .from(santri)
  .where(eq(santri.waliId, waliId));

  const childIds = children.map((c: any) => c.id);

  if (childIds.length === 0) {
    return (
      <WaliSubmenuClient
        slug={slug}
        childrenList={[]}
        attendance={[]}
        hafalan={[]}
        catatan={[]}
        announcements={[]}
        currentWaliId={waliId}
        currentUserId={session.user.id || ""}
      />
    );
  }

  // Fetch attendance for these children
  const attendanceLogsRaw = await db.select({
    id: absensiSantri.id,
    santriId: absensiSantri.santriId,
    tanggal: absensiSantri.tanggal,
    status: absensiSantri.status,
    jadwalId: absensiSantri.jadwalId,
    namaMapel: kitabMapel.namaKitabMapel
  })
  .from(absensiSantri)
  .leftJoin(jadwal, eq(absensiSantri.jadwalId, jadwal.id))
  .leftJoin(kitabMapel, eq(jadwal.kitabMapelId, kitabMapel.id))
  .where(or(...childIds.map((id: string) => eq(absensiSantri.santriId, id))));

  const attendanceLogs = attendanceLogsRaw.map((a: any) => ({
    ...a,
    namaMapel: a.namaMapel || `Jadwal ${a.jadwalId}`
  }));

  // Fetch memorization logs from setoranNadzom
  const hafalanLogsRaw = await db.select({
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
  .where(or(...childIds.map((id: string) => eq(setoranNadzom.santriId, id))))
  .orderBy(desc(setoranNadzom.tanggal));

  const hafalanLogs = hafalanLogsRaw.map((h: any) => ({
    id: h.id,
    santriId: h.santriId,
    tanggal: h.tanggal,
    jenisHafalan: h.namaKitab,
    keteranganHafalan: `Bait ${h.baitMulai} s.d ${h.baitSelesai} (${h.status})`
  }));

  // Fetch teacher notes
  const catatanLogs = await db.select().from(catatanSantri).where(or(...childIds.map((id: string) => eq(catatanSantri.santriId, id)))).orderBy(desc(catatanSantri.tanggal));

  // Fetch announcements
  const annList = await db.select().from(pengumuman).orderBy(desc(pengumuman.tanggal));

  return (
    <WaliSubmenuClient
      slug={slug}
      childrenList={children}
      attendance={attendanceLogs}
      hafalan={hafalanLogs}
      catatan={catatanLogs}
      announcements={annList}
      currentWaliId={waliId}
      currentUserId={session.user.id || ""}
    />
  );
}
