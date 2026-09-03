import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPengasuhDashboardStats } from "@/actions/dashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, UserCheck, AlertTriangle, Clock, HelpCircle } from "lucide-react";

export default async function PengasuhDashboard() {
  const session = await auth();

  if (!session || session.user.role !== "PENGASUH") {
    redirect("/login");
  }

  const stats = await getPengasuhDashboardStats();

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="page-banner">
        <div>
          <h1 className="page-title text-glow-gold">Monitoring Pengasuh</h1>
          <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
            Selamat datang, {session.user.name}. Berikut adalah laporan aktivitas pondok pesantren realtime hari ini.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 bg-amber-100/70 backdrop-blur-sm border border-amber-200 px-3 py-1.5 rounded-xl text-amber-800 text-xs font-bold self-start md:self-auto">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" /> Hak Akses: Read-Only
        </div>
      </div>

      {/* Realtime Classroom Monitoring */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6">
        <Card className="border-green-500/20 bg-green-500/5 dark:bg-green-500/10 hover:border-green-500/30">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 pt-4 px-4">
            <CardTitle className="text-[11px] md:text-sm font-bold text-green-600 dark:text-green-400 leading-tight">Kelas Sedang Berlangsung</CardTitle>
            <Clock className="h-4 w-4 md:h-5 md:w-5 text-green-500 flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-extrabold text-green-600 dark:text-green-400">{stats?.kelasAktif || 0} Kelas</div>
            <p className="text-xs text-muted-foreground mt-1">Ustadz telah melakukan scan kehadiran</p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10 hover:border-blue-500/30">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 pt-4 px-4">
            <CardTitle className="text-[11px] md:text-sm font-bold text-blue-600 dark:text-blue-400 leading-tight">Kelas Belum Dimulai</CardTitle>
            <Clock className="h-4 w-4 md:h-5 md:w-5 text-blue-500 flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{stats?.kelasKosong || 0} Kelas</div>
            <p className="text-xs text-muted-foreground mt-1">Sesi terjadwal belum di-scan</p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10 hover:border-amber-500/30">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 pt-4 px-4">
            <CardTitle className="text-[11px] md:text-sm font-bold text-amber-600 dark:text-amber-400 leading-tight">Guru Pengganti</CardTitle>
            <Users className="h-4 w-4 md:h-5 md:w-5 text-amber-500 flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{stats?.guruPengganti || 0} Sesi</div>
            <p className="text-xs text-muted-foreground mt-1">Ustadz pengganti aktif mengajar hari ini</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-panel border-white/20">
          <CardHeader>
            <CardTitle className="text-base font-bold">Laporan Ustadz & Akademik</CardTitle>
            <CardDescription>Status kehadiran guru & kelas hari ini</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center border-b border-muted/10 pb-3">
              <span className="text-sm font-medium">Ustadz Mengajar Hari Ini</span>
              <span className="text-sm font-bold text-primary">{stats?.ustadzHadir || 0} Orang Hadir</span>
            </div>
            <div className="flex justify-between items-center border-b border-muted/10 pb-3">
              <span className="text-sm font-medium">Jumlah Kelas Terjadwal</span>
              <span className="text-sm font-bold text-primary">3 Kelas</span>
            </div>
            <div className="flex justify-between items-center pb-1">
              <span className="text-sm font-medium">Kitab Diampu</span>
              <span className="text-sm font-bold text-primary">2 Kitab (Fiqih, Nahwu)</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/20">
          <CardHeader>
            <CardTitle className="text-base font-bold">Laporan Kehadiran Santri</CardTitle>
            <CardDescription>Persentase kehadiran santri aktif</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4.5 w-4.5 text-green-500" />
                <span className="text-sm font-semibold">Siswa Hadir</span>
              </div>
              <span className="text-sm font-bold text-green-600">{stats?.santriHadir || 0} Santri</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4.5 w-4.5 text-blue-500" />
                <span className="text-sm font-semibold">Siswa Izin</span>
              </div>
              <span className="text-sm font-bold text-blue-600">{stats?.santriIzin || 0} Santri</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4.5 w-4.5 text-red-500" />
                <span className="text-sm font-semibold">Siswa Alpha</span>
              </div>
              <span className="text-sm font-bold text-red-600">{stats?.santriAlpha || 0} Santri</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
