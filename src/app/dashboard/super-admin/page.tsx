import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getSuperAdminDashboardStats } from "@/actions/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Users, Database, Clock, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function SuperAdminDashboard() {
  const session = await auth();

  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const stats = await getSuperAdminDashboardStats();

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-glow-gold">Panel Super Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Selamat datang, {session.user.name}. Kelola seluruh sistem dan audit log e-AnwarulHidayah di sini.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl flex items-center gap-2 font-semibold">
            <Database className="h-4.5 w-4.5 text-accent" /> Backup DB
          </Button>
          <Button className="bg-blue-gradient text-white rounded-xl font-semibold">
            Pengaturan Sistem
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-panel border-white/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold">Total Pengguna</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Pengguna terdaftar di database</p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold">Status Database</CardTitle>
            <Database className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-green-600">Online</div>
            <p className="text-xs text-muted-foreground mt-1">Cloudflare D1 terhubung</p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold">Keamanan Sistem</CardTitle>
            <Shield className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-glow-gold">Aktif</div>
            <p className="text-xs text-muted-foreground mt-1">RBAC & JWT token aktif</p>
          </CardContent>
        </Card>
      </div>

      {/* Audit Logs */}
      <Card className="glass-panel border-white/20">
        <CardHeader className="flex flex-row items-center gap-2">
          <Terminal className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-base font-bold">Audit Log Terbaru</CardTitle>
            <CardDescription>Aktivitas pengguna terbaru yang tercatat oleh sistem</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border border-muted/15 rounded-xl overflow-hidden bg-white/30">
            <Table>
              <TableHeader className="bg-white/50">
                <TableRow>
                  <TableHead className="font-bold">Waktu</TableHead>
                  <TableHead className="font-bold">User ID</TableHead>
                  <TableHead className="font-bold">Aktivitas</TableHead>
                  <TableHead className="font-bold">Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.recentLogs && stats.recentLogs.length > 0 ? (
                  stats.recentLogs.map((log: any) => (
                    <TableRow key={log.id} className="hover:bg-white/50">
                      <TableCell className="font-semibold text-xs flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(log.timestamp).toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="font-semibold text-xs">{log.userId || "Sistem"}</TableCell>
                      <TableCell className="font-bold text-xs text-primary">{log.action}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{log.details}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm py-8 text-muted-foreground">
                      Tidak ada audit log yang ditemukan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
