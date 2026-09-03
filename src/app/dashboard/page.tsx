import { auth } from "@/auth";
import { redirect } from "next/navigation";


export default async function DashboardPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  const role = session.user.role;

  switch (role) {
    case "SUPER_ADMIN":
      redirect("/dashboard/super-admin");
    case "OPERATOR":
      redirect("/dashboard/operator");
    case "PENGASUH":
      redirect("/dashboard/pengasuh");
    case "MUSTAHIQ":
      redirect("/dashboard/mustahiq");
    case "MUNAWIB":
      redirect("/dashboard/munawib");
    case "WALI_SANTRI":
      redirect("/dashboard/wali");
    default:
      redirect("/login");
  }
}
