import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getKelasList } from "@/actions/master";
import { getSemesterList, getNilaiList, getSystemSettings } from "@/actions/additional";
import { ArsipClient } from "./arsip-client";

export const dynamic = "force-dynamic";

export default async function OperatorArsipPage() {
  const session = await auth();

  // Validate session and role
  if (!session || (session.user.role !== "OPERATOR" && session.user.role !== "SUPER_ADMIN")) {
    redirect("/login");
  }

  // Load data for archives concurrently in parallel
  const [kelasList, semesterList, systemSettings, nilaiList] = await Promise.all([
    getKelasList(),
    getSemesterList(),
    getSystemSettings(),
    getNilaiList()
  ]);

  const activeSemesterId = systemSettings?.semesterAktifId || "";

  return (
    <ArsipClient
      kelasList={kelasList}
      semesterList={semesterList}
      activeSemesterId={activeSemesterId}
      initialNilaiList={nilaiList}
    />
  );
}
