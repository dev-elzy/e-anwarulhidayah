import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { NotificationPopover } from "@/components/notification-popover";
import { ChangePasswordModal } from "@/components/change-password-modal";

export const dynamic = "force-dynamic";

// Roles that use bottom grid nav on mobile — need extra bottom padding
const BOTTOM_NAV_ROLES = ["MUSTAHIQ", "MUNAWIB", "BENDAHARA", "WALI_SANTRI"];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  const user = {
    id: session.user.id || "",
    name: session.user.name || "User",
    role: session.user.role || "UNKNOWN",
    username: session.user.email || "",
  };

  const useBottomNav = BOTTOM_NAV_ROLES.includes(user.role);

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <DashboardSidebar user={user} />
      <main className={`flex-1 min-w-0 p-3 pt-4 md:p-8 w-full relative ${useBottomNav ? "pb-24 md:pb-8" : "pb-8"} print:p-0 print:m-0`}>
        {children}
        <NotificationPopover userId={session.user.id || ""} role={session.user.role || ""} />
      </main>
      <ChangePasswordModal />
    </div>
  );
}

