import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getOperatorDashboardStats } from "@/actions/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, BookOpen, DoorOpen, CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function OperatorDashboard() {
  const session = await auth();

  if (!session || (session.user.role !== "OPERATOR" && session.user.role !== "SUPER_ADMIN")) {
    redirect("/login");
  }

  const stats = await getOperatorDashboardStats();

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="page-banner">
        <div>
          <h1 className="page-title text-glow-gold">Dashboard Operator</h1>
          <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
            Pesantren Anwarul Hidayah - Akses Cepat Manajemen Data Master &amp; Monitoring.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 self-start md:self-auto">
          <Link href="/dashboard/operator/santri">
            <Button className="bg-blue-gradient text-white rounded-xl font-semibold text-sm py-2 px-3 shadow-md">
              Manajemen Santri
            </Button>
          </Link>
          <Link href="/dashboard/operator/qr-kelas">
            <Button variant="outline" className="rounded-xl font-semibold text-sm py-2 px-3 border-white/40 bg-white/30 backdrop-blur-sm">
              Cetak QR Kelas
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <Card className="hover:border-primary/30">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 pt-4 px-4">
            <CardTitle className="text-[11px] md:text-sm font-semibold leading-tight text-foreground/80">Total Santri</CardTitle>
            <GraduationCap className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-extrabold text-foreground">{stats?.totalSantri || 0}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Santri terdaftar aktif</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/30">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 pt-4 px-4">
            <CardTitle className="text-[11px] md:text-sm font-semibold leading-tight text-foreground/80">Total Ustadz</CardTitle>
            <Users className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-extrabold text-foreground">{stats?.totalUstadz || 0}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Ustadz pengampu aktif</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/30">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 pt-4 px-4">
            <CardTitle className="text-[11px] md:text-sm font-semibold leading-tight text-foreground/80">Total Kelas</CardTitle>
            <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-extrabold text-foreground">{stats?.totalKelas || 0}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Ruang kelas belajar</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/30">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 pt-4 px-4">
            <CardTitle className="text-[11px] md:text-sm font-semibold leading-tight text-foreground/80">Total Kamar</CardTitle>
            <DoorOpen className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-extrabold text-foreground">{stats?.totalKamar || 0}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Kamar asrama santri</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance & Quick Access Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kehadiran Hari Ini */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Kehadiran Santri Hari Ini</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center bg-green-500/5 dark:bg-green-500/10 border border-green-500/10 dark:border-green-500/20 p-3.5 rounded-xl">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm font-bold text-green-600 dark:text-green-400">Hadir</span>
              </div>
              <span className="text-lg font-extrabold text-green-600 dark:text-green-400">{stats?.santriHadir || 0} Santri</span>
            </div>

            <div className="flex justify-between items-center bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 dark:border-blue-500/20 p-3.5 rounded-xl">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">Izin</span>
              </div>
              <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">{stats?.santriIzin || 0} Santri</span>
            </div>

            <div className="flex justify-between items-center bg-red-500/5 dark:bg-red-500/10 border border-red-500/10 dark:border-red-500/20 p-3.5 rounded-xl">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-sm font-bold text-red-600 dark:text-red-400">Alpha</span>
              </div>
              <span className="text-lg font-extrabold text-red-600 dark:text-red-400">{stats?.santriAlpha || 0} Santri</span>
            </div>
          </CardContent>
        </Card>

        {/* Akses Cepat Akademik */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Akses Cepat Akademik</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/operator/jadwal" className="flex items-center justify-between p-3.5 rounded-xl bg-card hover:bg-muted/50 border border-border transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-primary">
                  <BookOpen className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-sm font-bold">Jadwal Madrasah</p>
                  <p className="text-xs text-muted-foreground">Atur waktu dan pengajar kelas</p>
                </div>
              </div>
              <Button variant="ghost" size="xs" className="text-xs font-semibold">Buka &rarr;</Button>
            </Link>

            <Link href="/dashboard/operator/arsip" className="flex items-center justify-between p-3.5 rounded-xl bg-card hover:bg-muted/50 border border-border transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                  <GraduationCap className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-sm font-bold">Arsip Nilai &amp; Raport</p>
                  <p className="text-xs text-muted-foreground">Rekap nilai ujian dan cetak raport</p>
                </div>
              </div>
              <Button variant="ghost" size="xs" className="text-xs font-semibold">Buka &rarr;</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
