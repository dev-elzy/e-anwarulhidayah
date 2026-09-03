"use client";

import React from "react";
import { 
  BookOpen, 
  Users, 
  GraduationCap, 
  FileCheck
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface PengasuhSubmenuClientProps {
  slug: string;
  kelasList: any[];
  ustadzList: any[];
  santriList: any[];
  perizinanList?: any[];
  hafalanList: any[];
  catatanList: any[];
  absensiSantriList: any[];
  absensiUstadzList: any[];
}

export function PengasuhSubmenuClient({
  slug,
  kelasList,
  ustadzList,
  santriList,
  hafalanList,
  catatanList,
  absensiSantriList,
  absensiUstadzList
}: PengasuhSubmenuClientProps) {
  const todayStr = new Date().toISOString().split("T")[0];

  // Header configuration based on slug
  const getHeaderDetails = () => {
    switch (slug) {
      case "monitoring-kelas":
        return { title: "Monitoring Kehadiran Kelas", desc: "Pantau tingkat kehadiran santri di kelas-kelas hari ini secara real-time.", icon: BookOpen };
      case "monitoring-ustadz":
        return { title: "Monitoring Kehadiran Ustadz", desc: "Pantau catatan jam masuk ustadz dalam mengampu kelas hari ini.", icon: Users };
      case "monitoring-santri":
        return { title: "Monitoring Kegiatan Santri", desc: "Tinjau data hafalan dan catatan perkembangan pembinaan santri.", icon: GraduationCap };
      default:
        return { title: "Monitoring Pondok", desc: "Portal monitoring pengasuh pondok pesantren.", icon: GraduationCap };
    }
  };

  const header = getHeaderDetails();
  const Icon = header.icon;

  return (
    <div className="space-y-6">
      {/* Top Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-blue-gradient flex items-center justify-center text-white shadow-md">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-glow-gold">{header.title}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{header.desc}</p>
          </div>
        </div>
      </div>

      {/* VIEW CASES */}

      {/* 1. Monitoring Kelas */}
      {slug === "monitoring-kelas" && (
        <div className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass-panel border-green-100 bg-green-50/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-green-800">Total Hadir Hari Ini</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-green-700">
                  {absensiSantriList.filter(a => a.tanggal === todayStr && a.status === "Masuk").length} Santri
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel border-blue-100 bg-blue-50/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-blue-800">Total Izin Hari Ini</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-blue-700">
                  {absensiSantriList.filter(a => a.tanggal === todayStr && a.status === "Izin").length} Santri
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel border-red-100 bg-red-50/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-red-800">Total Mangkir (Alpha)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-red-700">
                  {absensiSantriList.filter(a => a.tanggal === todayStr && a.status === "Alpha").length} Santri
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-panel border-white/20">
            <CardHeader>
              <CardTitle className="text-base font-bold text-glow-gold">Daftar Kehadiran per Kelas</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold">Nama Kelas</TableHead>
                      <TableHead className="font-bold">Total Santri</TableHead>
                      <TableHead className="font-bold">Hadir</TableHead>
                      <TableHead className="font-bold">Izin</TableHead>
                      <TableHead className="font-bold">Alpha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kelasList.map(k => {
                      const total = santriList.filter(s => s.kelasId === k.id).length;
                      const classSantriIds = santriList.filter(s => s.kelasId === k.id).map(s => s.id);
                      const classAbsensi = absensiSantriList.filter(a => a.tanggal === todayStr && classSantriIds.includes(a.santriId));
                      
                      const hadir = classAbsensi.filter(a => a.status === "Masuk").length;
                      const izin = classAbsensi.filter(a => a.status === "Izin").length;
                      const alpha = classAbsensi.filter(a => a.status === "Alpha").length;

                      return (
                        <TableRow key={k.id}>
                          <TableCell className="font-bold text-sm">{k.namaKelas}</TableCell>
                          <TableCell className="text-xs font-semibold">{total} Santri</TableCell>
                          <TableCell className="text-xs text-green-600 font-bold">{hadir}</TableCell>
                          <TableCell className="text-xs text-blue-600 font-bold">{izin}</TableCell>
                          <TableCell className="text-xs text-red-600 font-bold">{alpha}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 2. Monitoring Ustadz */}
      {slug === "monitoring-ustadz" && (
        <Card className="glass-panel border-white/20">
          <CardHeader>
            <CardTitle className="text-base font-bold">Log Scan Absensi Ustadz Kelas</CardTitle>
            <CardDescription>Mencatat kehadiran jam kedatangan asatidzah di dalam kelas hari ini.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Ustadz</TableHead>
                    <TableHead className="font-bold">Tanggal</TableHead>
                    <TableHead className="font-bold">Waktu Scan Masuk</TableHead>
                    <TableHead className="font-bold">Jadwal ID</TableHead>
                    <TableHead className="font-bold">Status Kehadiran</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {absensiUstadzList.length > 0 ? (
                    absensiUstadzList.map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="font-bold text-sm">
                          {ustadzList.find(u => u.id === a.ustadzId)?.nama || "Ustadz ID: " + a.ustadzId}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-semibold">{a.tanggal}</TableCell>
                        <TableCell className="font-mono text-xs font-bold text-primary">{a.waktuScan}</TableCell>
                        <TableCell className="text-xs font-semibold">{a.jadwalId}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-500 text-white font-bold">{a.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground">Belum ada absen ustadz masuk kelas hari ini.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. Monitoring Santri */}
      {slug === "monitoring-santri" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hafalan Santri */}
          <Card className="glass-panel border-white/20">
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-sm font-bold text-glow-gold">Hafalan Santri Terbaru</CardTitle>
                <CardDescription>Catatan setoran hafalan Quran/Kitab dari seluruh kelas.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold">Santri</TableHead>
                      <TableHead className="font-bold">Kategori</TableHead>
                      <TableHead className="font-bold">Target Hafalan</TableHead>
                      <TableHead className="font-bold">Tanggal Setor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hafalanList.map(h => (
                      <TableRow key={h.id}>
                        <TableCell className="font-bold text-xs">
                          {santriList.find(s => s.id === h.santriId)?.namaLengkap || "Santri ID: " + h.santriId}
                        </TableCell>
                        <TableCell className="text-xs font-bold">{h.jenisHafalan}</TableCell>
                        <TableCell className="text-xs text-muted-foreground font-semibold">{h.keteranganHafalan}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{h.tanggal}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Catatan Pembinaan */}
          <Card className="glass-panel border-white/20">
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <FileCheck className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-sm font-bold text-glow-gold">Catatan Pembinaan Ustadz</CardTitle>
                <CardDescription>Catatan kedisiplinan dan kendala belajar santri.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold">Santri</TableHead>
                      <TableHead className="font-bold">Tanggal</TableHead>
                      <TableHead className="font-bold">Catatan / Keterangan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {catatanList.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-bold text-xs">
                          {santriList.find(s => s.id === c.santriId)?.namaLengkap || "Santri ID: " + c.santriId}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{c.tanggal}</TableCell>
                        <TableCell className="text-xs text-muted-foreground font-semibold leading-relaxed">{c.catatanUstadz}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
