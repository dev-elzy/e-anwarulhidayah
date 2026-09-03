import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { 
  getKelasList, 
  getSantriList 
} from "@/actions/master";
import { 
  getKitabList, 
  getJadwalList, 
  getNilaiList 
} from "@/actions/additional";
import { getDb } from "@/lib/db";
import { kitabNadzom, setoranNadzom, settings, semester } from "@/lib/db/schema";
import { MunawibSubmenuClient } from "./submenu-client";

export default async function MunawibSubmenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();

  // Protect the route
  if (!session || session.user.role !== "MUNAWIB" || !session.user.ustadzId) {
    redirect("/login");
  }

  const { slug } = await params;
  if (slug !== "nilai") {
    redirect("/dashboard/munawib");
  }

  const ustadzId = session.user.ustadzId;

  const db = getDb();

  const [
    fullJadwalList,
    kelasList,
    kitabList,
    santriList,
    nilaiList,
    nadzomList,
    setoranList,
    semesterList,
    sysSettings
  ] = await Promise.all([
    getJadwalList(),
    getKelasList(),
    getKitabList(),
    getSantriList(),
    getNilaiList(),
    db ? db.select().from(kitabNadzom) : Promise.resolve([]),
    db ? db.select().from(setoranNadzom) : Promise.resolve([]),
    db ? db.select().from(semester) : Promise.resolve([]),
    db ? db.select().from(settings).limit(1) : Promise.resolve([])
  ]);

  const ustadzJadwal = fullJadwalList.filter((j: any) => j.ustadzId === ustadzId);
  const activeSemesterId = sysSettings[0]?.semesterAktifId || "";

  return (
    <MunawibSubmenuClient
      slug={slug}
      ustadzId={ustadzId}
      jadwalList={ustadzJadwal}
      kelasList={kelasList}
      kitabList={kitabList}
      nadzomList={nadzomList}
      santriList={santriList}
      nilaiList={nilaiList}
      setoranList={setoranList}
      semesterList={semesterList}
      activeSemesterId={activeSemesterId}
      currentUserId={session.user.id || ""}
    />
  );
}

