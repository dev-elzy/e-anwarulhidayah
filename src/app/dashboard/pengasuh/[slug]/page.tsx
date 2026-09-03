import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { 
  getKelasList, 
  getUstadzList, 
  getSantriList, 
} from "@/actions/master";
import { 
  getHafalanList, 
  getCatatanList, 
  getAbsensiSantriList, 
  getAbsensiUstadzList 
} from "@/actions/additional";
import { PengasuhSubmenuClient } from "./submenu-client";

export default async function PengasuhSubmenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();

  // Protect the route
  if (!session || (session.user.role !== "PENGASUH" && session.user.role !== "SUPER_ADMIN")) {
    redirect("/login");
  }

  const { slug } = await params;

  const [
    kelasList,
    ustadzList,
    santriList,
    hafalanList,
    catatanList,
    absensiSantriList,
    absensiUstadzList
  ] = await Promise.all([
    getKelasList(),
    getUstadzList(),
    getSantriList(),
    getHafalanList(),
    getCatatanList(),
    getAbsensiSantriList(),
    getAbsensiUstadzList()
  ]);

  return (
    <PengasuhSubmenuClient
      slug={slug}
      kelasList={kelasList}
      ustadzList={ustadzList}
      santriList={santriList}
      hafalanList={hafalanList}
      catatanList={catatanList}
      absensiSantriList={absensiSantriList}
      absensiUstadzList={absensiUstadzList}
    />
  );
}
