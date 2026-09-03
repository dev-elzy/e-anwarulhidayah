import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUstadzDashboardStats } from "@/actions/dashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, QrCode, BookOpen, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function MunawibDashboard() {
  const session = await auth();

  if (!session || session.user.role !== "MUNAWIB" || !session.user.ustadzId) {
    redirect("/login");
  }

  const ustadzId = session.user.ustadzId;
  const stats = await getUstadzDashboardStats(ustadzId);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="page-banner">
        <div>
          <h1 className="page-title text-glow-gold">Dashboard Munawib</h1>
          <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
            Selamat datang, {session.user.name}. Lakukan scan QR kelas sebelum mulai mengajar.
          </p>
        </div>
        <Link href="/dashboard/munawib/scan" className="self-start md:self-auto">
          <Button className="bg-blue-gradient text-white rounded-xl font-bold py-2.5 px-4 flex items-center gap-2 shadow-md shadow-primary/20 min-h-[40px] text-sm">
            <QrCode className="h-4 w-4" /> Buka Sesi Kelas (Scan QR)
          </Button>
        </Link>
      </div>

      {/* Quick Access Menu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
        <Link href="/dashboard/munawib/scan" className="block">
          <Card className="glass-panel border-white/20 hover:border-primary/40 transition-all hover:shadow-md h-full flex flex-col justify-between p-4 cursor-pointer min-h-[100px]">
            <QrCode className="h-6 w-6 text-primary" />
            <span className="font-bold text-sm block mt-4">Buka Sesi Mengajar</span>
          </Card>
        </Link>

        <Link href="/dashboard/munawib/nilai" className="block">
          <Card className="glass-panel border-white/20 hover:border-primary/40 transition-all hover:shadow-md h-full flex flex-col justify-between p-4 cursor-pointer min-h-[100px]">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-bold text-sm block mt-4">Input Nilai Mapel</span>
          </Card>
        </Link>
      </div>

      {/* Jadwal Mengajar */}
      <Card className="glass-panel border-white/20">
        <CardHeader className="flex flex-row items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-base font-bold">Jadwal Mengajar Saya</CardTitle>
            <CardDescription>Daftar jadwal kelas Anda pada tahun ajaran aktif</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats?.schedules && stats.schedules.length > 0 ? (
              stats.schedules.map((schedule: any) => (
                <div key={schedule.id} className="bg-white/40 border border-white/50 p-4 rounded-2xl flex flex-col justify-between gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        {schedule.hari}
                      </span>
                      <h3 className="font-bold text-sm mt-2">Kelas: {schedule.kelasId}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Mapel: {schedule.kitabMapelId}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-white/80 border border-muted/10 px-2 py-1 rounded-xl">
                      <Clock className="h-3.5 w-3.5" />
                      {schedule.jamMulai} - {schedule.jamSelesai}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center text-sm py-8 text-muted-foreground">
                Tidak ada jadwal mengajar yang terdaftar.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
