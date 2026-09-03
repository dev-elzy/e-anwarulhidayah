import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUstadzList } from "@/actions/master";
import { getAbsensiUstadzList, getJadwalList } from "@/actions/additional";
import { KehadiranUstadzClient } from "./kehadiran-ustadz-client";

export const dynamic = "force-dynamic";

export default async function KehadiranUstadzPage() {
  const session = await auth();

  if (!session || (session.user.role !== "OPERATOR" && session.user.role !== "SUPER_ADMIN")) {
    redirect("/login");
  }

  const [ustadzList, absensiUstadzList, jadwalList] = await Promise.all([
    getUstadzList(),
    getAbsensiUstadzList(),
    getJadwalList()
  ]);

  return (
    <KehadiranUstadzClient
      ustadzList={ustadzList}
      absensiList={absensiUstadzList}
      jadwalList={jadwalList}
    />
  );
}
