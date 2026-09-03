import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getMustahiqDashboardStats } from "@/actions/dashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, CheckCircle, GraduationCap, BookOpen, FileCheck, ClipboardList, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function MustahiqDashboard() {
  const session = await auth();

  if (!session || session.user.role !== "MUSTAHIQ" || !session.user.ustadzId) {
    redirect("/login");
  }

  const ustadzId = session.user.ustadzId;
  const stats = await getMustahiqDashboardStats(ustadzId);

  if (!stats || !stats.kelas) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center max-w-md mx-auto">
        <AlertCircle className="h-16 w-16 text-yellow-500 mb-4 animate-bounce" />
        <h1 className="text-xl font-bold text-glow-gold">Wali Kelas Belum Ditunjuk</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Akun Anda belum ditunjuk sebagai Wali Kelas di kelas manapun. Silakan hubungi Operator Pondok Pesantren untuk mengatur kelas perwalian Anda.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="page-banner">
        <div>
          <h1 className="page-title text-glow-gold">Dashboard Wali Kelas: {stats.kelas.namaKelas}</h1>
          <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
            Pantau perkembangan kehadiran, nilai akademik, hafalan nadzom, dan cetak raport perwalian santri.
          </p>
        </div>
        <Link href="/dashboard/mustahiq/raport" className="self-start md:self-auto">
          <Button className="bg-blue-gradient text-white rounded-xl font-bold py-2.5 px-4 flex items-center gap-2 shadow-md shadow-primary/20 min-h-[40px] text-sm">
            <FileCheck className="h-4 w-4" /> Proses &amp; Cetak Raport
          </Button>
        </Link>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <Card className="glass-panel border-white/20">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 pt-4 px-4">
            <CardTitle className="text-[11px] md:text-sm font-semibold leading-tight">Total Anak Didik</CardTitle>
            <Users className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-extrabold">{stats.totalSantri}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Santri aktif di kelas Anda</p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/20">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 pt-4 px-4">
            <CardTitle className="text-[11px] md:text-sm font-semibold leading-tight">Kehadiran Hari Ini</CardTitle>
            <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500 shrink-0" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-extrabold text-green-600">
              {stats.totalSantri > 0 ? Math.round(((stats.santriHadir + stats.santriTerlambat) / stats.totalSantri) * 100) : 0}%
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Hadir: {stats.santriHadir} | Telat: {stats.santriTerlambat}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/20">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 pt-4 px-4">
            <CardTitle className="text-[11px] md:text-sm font-semibold leading-tight">Rata-rata Nilai</CardTitle>
            <GraduationCap className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-extrabold">{stats.kelasRataRata}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Nilai kumulatif semua mapel</p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/20">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 pt-4 px-4">
            <CardTitle className="text-[11px] md:text-sm font-semibold leading-tight">Progres Hafalan</CardTitle>
            <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-accent shrink-0" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-extrabold text-glow-gold">{stats.kelasProgresHafalan}%</div>
            <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div className="h-full bg-blue-600" style={{ width: `${stats.kelasProgresHafalan}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Menu Links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
        <Link href="/dashboard/mustahiq/kehadiran">
          <Card className="glass-panel border-white/20 hover:border-primary/40 hover:shadow-md transition-all p-4 text-center cursor-pointer h-[100px] md:h-[110px] flex flex-col justify-center items-center">
            <Users className="h-6 w-6 text-primary mb-2" />
            <span className="font-bold text-xs">Monitoring Absensi</span>
          </Card>
        </Link>
        <Link href="/dashboard/mustahiq/nilai">
          <Card className="glass-panel border-white/20 hover:border-primary/40 hover:shadow-md transition-all p-4 text-center cursor-pointer h-[100px] md:h-[110px] flex flex-col justify-center items-center">
            <GraduationCap className="h-6 w-6 text-primary mb-2" />
            <span className="font-bold text-xs">Monitoring Nilai</span>
          </Card>
        </Link>
        <Link href="/dashboard/mustahiq/hafalan">
          <Card className="glass-panel border-white/20 hover:border-primary/40 hover:shadow-md transition-all p-4 text-center cursor-pointer h-[100px] md:h-[110px] flex flex-col justify-center items-center">
            <BookOpen className="h-6 w-6 text-accent mb-2" />
            <span className="font-bold text-xs text-glow-gold">Hafalan Nadzom</span>
          </Card>
        </Link>
        <Link href="/dashboard/mustahiq/catatan">
          <Card className="glass-panel border-white/20 hover:border-primary/40 hover:shadow-md transition-all p-4 text-center cursor-pointer h-[100px] md:h-[110px] flex flex-col justify-center items-center">
            <ClipboardList className="h-6 w-6 text-primary mb-2" />
            <span className="font-bold text-xs">Catatan Santri</span>
          </Card>
        </Link>
        <Link href="/dashboard/mustahiq/raport" className="col-span-2 sm:col-span-1 md:col-span-1">
          <Card className="glass-panel border-white/20 hover:border-primary/40 hover:shadow-md transition-all p-4 text-center cursor-pointer h-[100px] md:h-[110px] flex flex-col justify-center items-center">
            <FileCheck className="h-6 w-6 text-primary mb-2" />
            <span className="font-bold text-xs">Raport Siswa</span>
          </Card>
        </Link>
      </div>

      {/* Kehadiran Santri Hari Ini */}
      <Card className="glass-panel border-white/20">
        <CardHeader>
          <CardTitle className="text-base font-bold">Log Absensi Santri Hari Ini</CardTitle>
          <CardDescription>Rangkuman ketidakhadiran santri di kelas perwalian Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-50/50 border border-green-100 p-4 rounded-xl flex items-center justify-between">
              <span className="text-sm font-bold text-green-800">Masuk</span>
              <span className="text-lg font-black text-green-700">{stats.santriHadir} Santri</span>
            </div>
            <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-xl flex items-center justify-between">
              <span className="text-sm font-bold text-amber-800 flex items-center gap-1"><Clock className="h-4 w-4" /> Terlambat</span>
              <span className="text-lg font-black text-amber-700">{stats.santriTerlambat} Santri</span>
            </div>
            <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex items-center justify-between">
              <span className="text-sm font-bold text-blue-800">Izin</span>
              <span className="text-lg font-black text-blue-700">{stats.santriIzin} Santri</span>
            </div>
            <div className="bg-red-50/50 border border-red-100 p-4 rounded-xl flex items-center justify-between">
              <span className="text-sm font-bold text-red-800">Alpha</span>
              <span className="text-lg font-black text-red-700">{stats.santriAlpha} Santri</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
