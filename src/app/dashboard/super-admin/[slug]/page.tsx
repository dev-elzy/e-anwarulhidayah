import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUstadzList } from "@/actions/master";
import { 
  getUsersList, 
  getAuditLogsList, 
  getSystemSettings, 
  getWaliList 
} from "@/actions/additional";
import { SuperAdminSubmenuClient } from "./submenu-client";

export default async function SuperAdminSubmenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();

  // Protect the route
  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const { slug } = await params;
  
  let usersList: any[] = [];
  let logsList: any[] = [];
  let settingsData: any = null;
  let ustadzList: any[] = [];
  let waliList: any[] = [];

  switch (slug) {
    case "users":
    case "roles":
    case "permissions":
      [usersList, ustadzList, waliList] = await Promise.all([
        getUsersList(),
        getUstadzList(),
        getWaliList()
      ]);
      break;
    case "audit":
      logsList = await getAuditLogsList();
      break;
    case "settings":
    case "backup":
      settingsData = await getSystemSettings();
      break;
    default:
      usersList = await getUsersList();
      break;
  }

  return (
    <SuperAdminSubmenuClient
      slug={slug}
      initialUsers={usersList}
      initialLogs={logsList}
      initialSettings={settingsData}
      ustadzList={ustadzList}
      waliList={waliList}
      currentUserId={session.user.id || ""}
    />
  );
}
