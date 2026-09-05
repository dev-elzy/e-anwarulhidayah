import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { 
  kelas, 
  santri, 
  absensiSantri, 
  nilaiSantri, 
  setoranNadzom, 
  kitabNadzom, 
  catatanSantri, 
  settings,
  kitabMapel,
  jadwal,
  semester,
  targetHafalanNadzom
} from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { MustahiqSubmenuClient } from "./submenu-client";
import { GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default async function MustahiqSubmenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();

  // Protect the route
  if (!session || session.user.role !== "MUSTAHIQ" || !session.user.ustadzId) {
    redirect("/login");
  }

  const { slug } = await params;
  const ustadzId = session.user.ustadzId;

  const db = getDb();
  if (!db) {
    redirect("/dashboard/mustahiq");
  }

  // Find Mustahiq's perwalian class
  const kelasList = await db.select().from(kelas).where(eq(kelas.waliKelasId, ustadzId)).limit(1);
  if (kelasList.length === 0) {
    redirect("/dashboard/mustahiq");
  }
  const myKelas = kelasList[0];

  // Load all students in this class
  const classStudents = await db.select().from(santri).where(eq(santri.kelasId, myKelas.id));
  if (classStudents.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-100 p-6">
        <Card className="w-full max-w-md border border-slate-100 bg-white/80 backdrop-blur-md shadow-lg rounded-2xl overflow-hidden">
          <CardContent className="pt-10 pb-8 px-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-6 animate-pulse">
              <GraduationCap className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Kelas Perwalian Kosong</h3>
            <p className="text-sm text-slate-500 max-w-xs leading-relaxed mb-6">
              Belum ada santri yang dimasukkan ke kelas perwalian Anda. Silakan hubungi Operator Pondok untuk memperbarui data kelas Anda.
            </p>
            <div className="w-full pt-4 border-t border-slate-50 flex justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                💡 Info
              </span>
              <span className="text-xs text-slate-400 self-center">
                Perlu koordinasi dengan operator
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const studentIds = classStudents.map((s: any) => s.id);

  // Load all required academic and attendance data for these students
  let attendanceList: any[] = [];
  let gradesList: any[] = [];
  let setoranList: any[] = [];
  let notesList: any[] = [];

  if (studentIds.length > 0) {
    attendanceList = await db.select().from(absensiSantri)
      .where(inArray(absensiSantri.santriId, studentIds))
      .orderBy(desc(absensiSantri.tanggal));

    gradesList = await db.select().from(nilaiSantri)
      .where(inArray(nilaiSantri.santriId, studentIds));

    setoranList = await db.select().from(setoranNadzom)
      .where(inArray(setoranNadzom.santriId, studentIds))
      .orderBy(desc(setoranNadzom.tanggal));

    notesList = await db.select().from(catatanSantri)
      .where(inArray(catatanSantri.santriId, studentIds))
      .orderBy(desc(catatanSantri.tanggal));
  }

  const nadzomList = await db.select().from(kitabNadzom);
  const mapelList = await db.select().from(kitabMapel);
  const sysSettings = await db.select().from(settings).limit(1);
  const tampilkanRanking = sysSettings[0]?.tampilkanRanking ?? true;

  const semesterList = await db.select().from(semester);
  const classJadwal = await db.select().from(jadwal).where(eq(jadwal.kelasId, myKelas.id));
  const targetList = await db.select().from(targetHafalanNadzom).where(eq(targetHafalanNadzom.kelasId, myKelas.id));

  return (
    <MustahiqSubmenuClient
      slug={slug}
      kelas={myKelas}
      students={classStudents}
      attendanceList={attendanceList}
      gradesList={gradesList}
      setoranList={setoranList}
      notesList={notesList}
      nadzomList={nadzomList}
      mapelList={mapelList}
      semesterList={semesterList}
      classJadwal={classJadwal}
      tampilkanRanking={tampilkanRanking}
      currentUstadzId={ustadzId}
      targetList={targetList}
    />
  );
}
