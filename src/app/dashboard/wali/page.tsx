import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getWaliDashboardStats } from "@/actions/dashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, BookOpen, Megaphone, Calendar, Download, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function WaliDashboard() {
  const session = await auth();

  if (!session || session.user.role !== "WALI_SANTRI" || !session.user.waliId) {
    redirect("/login");
  }

  const waliId = session.user.waliId;
  const stats = await getWaliDashboardStats(waliId);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-white/20 dark:border-white/5 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-glow-gold">Portal Wali Santri</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Selamat datang, {session.user.name}. Pantau perkembangan akademik dan kepondokan anak Anda di sini.
          </p>
        </div>
      </div>

      {/* Children List */}
      {stats?.children && stats.children.length > 0 ? (
        stats.children.map(({ child, kelasName, kamarName, todayAttendance, hafalan, catatan, nadzomProgressPct, hasPublishedRaport, activeSemesterId }) => (
          <div key={child.id} className="space-y-6">
            {/* Child Profile Details Card */}
            <Card className="glass-panel border-white/20 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-gradient" />
              <CardContent className="pt-6 flex flex-col sm:flex-row items-center gap-6">
                <Avatar className="h-20 w-20 border-2 border-white shadow-md">
                  {child.fotoUrl && (
                    <AvatarImage src={child.fotoUrl} alt={child.namaLengkap} className="object-cover" />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                    {child.namaLengkap.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center sm:text-left space-y-1">
                  <h3 className="text-xl font-bold">{child.namaLengkap}</h3>
                  <p className="text-xs text-muted-foreground font-semibold">NIS: {child.nis}</p>
                  <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                    <Badge variant="outline" className="bg-white/50 dark:bg-slate-800/50 border-white/40 dark:border-white/10 font-bold">
                      Kelas: {kelasName}
                    </Badge>
                    <Badge variant="outline" className="bg-white/50 dark:bg-slate-800/50 border-white/40 dark:border-white/10 font-bold">
                      Kamar: {kamarName}
                    </Badge>
                    <Badge className={child.statusAktif ? "bg-green-500 hover:bg-green-600 text-white font-bold" : "bg-red-500 text-white font-bold"}>
                      Status: {child.statusAktif ? "Aktif" : "Non-Aktif"}
                    </Badge>
                  </div>

                  {/* Progress Hafalan Nadzom */}
                  <div className="mt-4 flex flex-col items-center sm:items-start gap-1">
                    <div className="flex justify-between w-full max-w-[220px] text-[10px] uppercase font-bold text-muted-foreground">
                      <span>Progres Hafalan Nadzom</span>
                      <span className="text-primary font-black">{nadzomProgressPct || 0}%</span>
                    </div>
                    <div className="w-full max-w-[220px] bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${nadzomProgressPct || 0}%` }} />
                    </div>
                  </div>

                  {/* Raport Action */}
                  <div className="mt-4 pt-1 flex justify-center sm:justify-start">
                    {hasPublishedRaport && activeSemesterId ? (
                      <a
                        href={`/dashboard/mustahiq/raport/${child.id}?semesterId=${activeSemesterId}&download=true`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" className="bg-blue-gradient text-white font-bold rounded-xl flex items-center gap-1.5 min-h-[40px] px-4 shadow-md cursor-pointer hover:opacity-90">
                          <Download className="h-4 w-4" /> Download Raport PDF
                        </Button>
                      </a>
                    ) : (
                      <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2">
                        <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                          Raport belum dipublikasikan
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="sm:ml-auto flex flex-col items-center sm:items-end gap-2 mt-4 sm:mt-0">
                  <div className="text-center sm:text-right">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Absensi Hari Ini</span>
                    <div className="mt-1">
                      <Badge className={
                        todayAttendance === "Masuk" 
                          ? "bg-green-100 text-green-800 border-green-200" 
                          : todayAttendance === "Izin" 
                          ? "bg-blue-100 text-blue-800 border-blue-200"
                          : todayAttendance === "Alpha"
                          ? "bg-red-100 text-red-800 border-red-200"
                          : "bg-gray-100 text-gray-800 border-gray-200"
                      }>
                        {todayAttendance}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Child Details: Kehadiran, Hafalan & Catatan Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Hafalan */}
              <Card className="glass-panel border-white/20">
                <CardHeader className="flex flex-row items-center gap-2 pb-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-sm font-bold">Hafalan Terbaru</CardTitle>
                    <CardDescription>Catatan hafalan Al-Qur'an dan kitab</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="border border-muted/15 rounded-xl overflow-hidden bg-white/30 dark:bg-black/20">
                    <Table>
                      <TableHeader className="bg-white/50 dark:bg-slate-800/50">
                        <TableRow>
                          <TableHead className="font-bold">Tanggal</TableHead>
                          <TableHead className="font-bold">Jenis</TableHead>
                          <TableHead className="font-bold">Keterangan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {hafalan.length > 0 ? (
                          hafalan.map((h: any) => (
                            <TableRow key={h.id}>
                              <TableCell className="text-xs font-semibold text-muted-foreground">{new Date(h.tanggal).toLocaleDateString("id-ID")}</TableCell>
                              <TableCell className="text-xs font-bold">{h.jenisHafalan}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{h.keteranganHafalan}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-4 text-xs text-muted-foreground">Belum ada catatan hafalan.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Catatan Ustadz */}
              <Card className="glass-panel border-white/20">
                <CardHeader className="flex flex-row items-center gap-2 pb-3">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-sm font-bold">Catatan Perkembangan Ustadz</CardTitle>
                    <CardDescription>Feedback langsung dari ustadz pengampu kelas</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="border border-muted/15 rounded-xl overflow-hidden bg-white/30 dark:bg-black/20">
                    <Table>
                      <TableHeader className="bg-white/50 dark:bg-slate-800/50">
                        <TableRow>
                          <TableHead className="font-bold">Tanggal</TableHead>
                          <TableHead className="font-bold">Catatan Ustadz</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {catatan.length > 0 ? (
                          catatan.map((c: any) => (
                            <TableRow key={c.id}>
                              <TableCell className="text-xs font-semibold text-muted-foreground">{new Date(c.tanggal).toLocaleDateString("id-ID")}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{c.catatanUstadz}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center py-4 text-xs text-muted-foreground">Belum ada catatan perkembangan.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ))
      ) : (
        <Card className="glass-panel border-white/20 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Tidak ada data anak yang dikaitkan dengan akun Wali Santri ini. Silakan hubungi Operator Pondok.
          </p>
        </Card>
      )}

      {/* Announcements */}
      <Card className="glass-panel border-white/20">
        <CardHeader className="flex flex-row items-center gap-2">
          <Megaphone className="h-5 w-5 text-accent" />
          <div>
            <CardTitle className="text-base font-bold text-glow-gold">Pengumuman Terbaru</CardTitle>
            <CardDescription>Informasi terbaru dari pengasuh dan pengurus pesantren</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats?.announcements && stats.announcements.length > 0 ? (
            stats.announcements.map((ann: any) => (
              <div key={ann.id} className="border-b border-muted/15 pb-4 last:border-b-0 last:pb-0">
                <h4 className="font-bold text-sm text-primary">{ann.judul}</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{ann.konten}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold mt-2">
                  <Calendar className="h-3 w-3" />
                  {new Date(ann.tanggal).toLocaleDateString("id-ID")}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">Belum ada pengumuman baru.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
