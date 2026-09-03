import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { 
  getUstadzList, 
  getKelasList, 
  getKamarList,
  getSantriList
} from "@/actions/master";
import { 
  getKitabList, 
  getJadwalList, 
  getPengumumanList,
  getRolesList,
  getPermissionsList,
  getRolePermissionsList,
  getSystemSettings,
  getTahunAjaranList,
  getSemesterList
} from "@/actions/additional";
import { getAbsensiSantriList } from "@/actions/absensi";
import { OperatorSubmenuClient } from "./submenu-client";

export const dynamic = "force-dynamic";

export default async function OperatorSubmenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();

  // Protect the route
  if (!session || (session.user.role !== "OPERATOR" && session.user.role !== "SUPER_ADMIN")) {
    redirect("/login");
  }

  const { slug } = await params;

  // Optimized targeted data loading per slug (1-3 queries instead of 14)
  let ustadzList: any[] = [];
  let kelasList: any[] = [];
  let kamarList: any[] = [];
  let kitabList: any[] = [];
  let jadwalList: any[] = [];
  let pengumumanList: any[] = [];
  let santriList: any[] = [];
  let rolesList: any[] = [];
  let permissionsList: any[] = [];
  let rolePermissionsList: any[] = [];
  let settingsData: any = null;
  let tahunAjaranList: any[] = [];
  let semesterList: any[] = [];
  let absensiSantriList: any[] = [];

  switch (slug) {
    case "ustadz":
      ustadzList = await getUstadzList();
      break;
    case "kelas":
      [kelasList, ustadzList, santriList] = await Promise.all([
        getKelasList(),
        getUstadzList(),
        getSantriList()
      ]);
      break;
    case "kamar":
      [kamarList, santriList] = await Promise.all([
        getKamarList(),
        getSantriList()
      ]);
      break;
    case "kitab":
      kitabList = await getKitabList();
      break;
    case "jadwal":
      [jadwalList, kelasList, kitabList, ustadzList] = await Promise.all([
        getJadwalList(),
        getKelasList(),
        getKitabList(),
        getUstadzList()
      ]);
      break;
    case "pengumuman":
      pengumumanList = await getPengumumanList();
      break;
    case "roles":
    case "permissions":
    case "mapping":
      [rolesList, permissionsList, rolePermissionsList] = await Promise.all([
        getRolesList(),
        getPermissionsList(),
        getRolePermissionsList()
      ]);
      break;
    case "settings":
      [settingsData, tahunAjaranList, semesterList] = await Promise.all([
        getSystemSettings(),
        getTahunAjaranList(),
        getSemesterList()
      ]);
      break;
    case "kehadiran-santri":
    case "qr-kelas":
      [kelasList, absensiSantriList, santriList, settingsData] = await Promise.all([
        getKelasList(),
        getAbsensiSantriList(),
        getSantriList(),
        getSystemSettings()
      ]);
      break;
    default:
      // Fallback for any other slug
      [ustadzList, kelasList, kamarList, kitabList] = await Promise.all([
        getUstadzList(),
        getKelasList(),
        getKamarList(),
        getKitabList()
      ]);
      break;
  }

  return (
    <OperatorSubmenuClient
      slug={slug}
      initialUstadz={ustadzList}
      initialKelas={kelasList}
      initialKamar={kamarList}
      initialKitab={kitabList}
      initialJadwal={jadwalList}
      initialPengumuman={pengumumanList}
      santriList={santriList}
      currentUserId={session.user.id || ""}
      initialRoles={rolesList}
      initialPermissions={permissionsList}
      initialRolePermissions={rolePermissionsList}
      initialSettings={settingsData}
      tahunAjaranList={tahunAjaranList}
      semesterList={semesterList}
      initialAbsensiSantri={absensiSantriList}
    />
  );
}
