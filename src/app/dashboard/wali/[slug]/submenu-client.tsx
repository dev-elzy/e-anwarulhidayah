"use client";

import React, { useState } from "react";
import { 
  UserCheck, 
  BookOpen, 
  ClipboardList, 
  Megaphone,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface WaliSubmenuClientProps {
  slug: string;
  childrenList: any[];
  attendance: any[];
  hafalan: any[];
  catatan: any[];
  announcements: any[];
  currentWaliId?: string;
  currentUserId?: string;
}

export function WaliSubmenuClient({
  slug,
  childrenList,
  attendance,
  hafalan,
  catatan,
  announcements
}: WaliSubmenuClientProps) {
  const [selectedChildId, setSelectedChildId] = useState(childrenList[0]?.id || "");

  if (childrenList.length === 0) {
    return (
      <Card className="glass-panel border-amber-200 p-8 text-center bg-amber-50/15">
        <h3 className="text-lg font-bold text-amber-600">Belum Ada Data Anak</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Akun Wali Anda belum ditautkan ke data Santri mana pun. Hubungi operator pondok pesantren untuk mendaftarkan NIS anak Anda.
        </p>
      </Card>
    );
  }

  const activeChild = childrenList.find(c => c.id === selectedChildId) || childrenList[0];

  // Filter logs based on child
  const childAttendance = attendance.filter(a => a.santriId === activeChild.id);
  const childHafalan = hafalan.filter(h => h.santriId === activeChild.id);
  const childCatatan = catatan.filter(c => c.santriId === activeChild.id);

  // Header settings
  const getHeaderInfo = () => {
    switch (slug) {
      case "kehadiran": return { title: "Presensi Kehadiran Anak", desc: "Daftar absensi harian kegiatan belajar mengajar anak Anda.", icon: UserCheck };
      case "hafalan": return { title: "Capaian Hafalan Anak", desc: "Laporan rekam jejak hafalan kitab dan setoran Al-Quran anak.", icon: BookOpen };
      case "catatan": return { title: "Catatan Pembimbing Ustadz", desc: "Teguran kedisiplinan atau feedback perkembangan akhlaq anak.", icon: ClipboardList };
      case "pengumuman": return { title: "Pengumuman Pesantren", desc: "Informasi resmi untuk seluruh wali santri pondok pesantren.", icon: Megaphone };
      default: return { title: "Portal Anak", desc: "Portal wali santri e-AnwarulHidayah.", icon: UserCheck };
    }
  };

  const info = getHeaderInfo();
  const Icon = info.icon;

  return (
    <div className="space-y-6">
      {/* Top Header Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-white/20 dark:border-white/5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-blue-gradient flex items-center justify-center text-white shadow-md">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-glow-gold">{info.title}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{info.desc}</p>
          </div>
        </div>

        {/* Child Selector Dropdown */}
        {childrenList.length > 1 && (
          <div className="flex items-center gap-2 bg-white/70 dark:bg-slate-900/50 px-3 py-2 rounded-xl border border-muted/15 dark:border-white/5">
            <span className="text-xs font-bold text-muted-foreground">Santri:</span>
            <Select value={selectedChildId} onValueChange={(val) => setSelectedChildId(val || "")}>
              <SelectTrigger className="border-0 shadow-none bg-transparent w-[180px] focus:ring-0 font-bold p-0 text-sm">
                <SelectValue placeholder="Pilih Anak" />
              </SelectTrigger>
              <SelectContent>
                {childrenList.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.namaLengkap}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* VIEW CASES */}

      {/* 1. Kehadiran */}
      {slug === "kehadiran" && (
        <Card className="glass-panel border-white/20">
          <CardHeader>
            <CardTitle className="text-base font-bold">Jurnal Presensi Kelas: {activeChild.namaLengkap}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/50 dark:bg-slate-800/50">
                  <TableRow>
                    <TableHead className="font-bold">Tanggal</TableHead>
                    <TableHead className="font-bold">Jadwal Matpel</TableHead>
                    <TableHead className="font-bold">Status Kehadiran</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {childAttendance.length > 0 ? (
                    childAttendance.map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="text-xs font-semibold text-muted-foreground">{new Date(a.tanggal).toLocaleDateString("id-ID")}</TableCell>
                        <TableCell className="text-xs font-bold">{a.namaMapel}</TableCell>
                        <TableCell>
                          <Badge className={
                            a.status === "Masuk" ? "bg-green-500 font-bold text-white" :
                            a.status === "Izin" ? "bg-blue-500 font-bold text-white" : "bg-red-500 font-bold text-white"
                          }>
                            {a.status === "Masuk" ? "Hadir" : a.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-xs text-muted-foreground">Belum ada rekaman presensi kehadiran.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. Hafalan */}
      {slug === "hafalan" && (
        <Card className="glass-panel border-white/20">
          <CardHeader>
            <CardTitle className="text-base font-bold">Laporan Hafalan: {activeChild.namaLengkap}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/50 dark:bg-slate-800/50">
                  <TableRow>
                    <TableHead className="font-bold">Tanggal Setoran</TableHead>
                    <TableHead className="font-bold">Kategori Kitab</TableHead>
                    <TableHead className="font-bold">Rincian Capaian Setor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {childHafalan.length > 0 ? (
                    childHafalan.map(h => (
                      <TableRow key={h.id}>
                        <TableCell className="text-xs font-semibold text-muted-foreground">{h.tanggal}</TableCell>
                        <TableCell className="text-xs font-bold text-glow-gold">{h.jenisHafalan}</TableCell>
                        <TableCell className="text-xs font-semibold text-muted-foreground">{h.keteranganHafalan}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-xs text-muted-foreground">Belum ada catatan setoran hafalan masuk.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. Catatan Ustadz */}
      {slug === "catatan" && (
        <Card className="glass-panel border-white/20">
          <CardHeader>
            <CardTitle className="text-base font-bold">Catatan Perkembangan Asuhan Wali Kelas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/50 dark:bg-slate-800/50">
                  <TableRow>
                    <TableHead className="font-bold">Tanggal</TableHead>
                    <TableHead className="font-bold">Isi Masukan Ustadz</TableHead>
                    <TableHead className="font-bold">Ustadz Pengirim</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {childCatatan.length > 0 ? (
                    childCatatan.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="text-xs font-semibold text-muted-foreground">{c.tanggal}</TableCell>
                        <TableCell className="text-xs font-semibold text-muted-foreground leading-relaxed">{c.catatanUstadz}</TableCell>
                        <TableCell className="text-xs font-bold text-primary">Ust. ID {c.ustadzId}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-xs text-muted-foreground">Belum ada catatan perkembangan/bimbingan dari asatidzah.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 6. Pengumuman */}
      {slug === "pengumuman" && (
        <Card className="glass-panel border-white/20">
          <CardHeader>
            <CardTitle className="text-base font-bold text-glow-gold">Mading Digital Pondok Pesantren</CardTitle>
            <CardDescription>Papan pengumuman resmi dari majelis pengasuh.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {announcements.filter(a => a.targetRoles.includes("WALI_SANTRI")).length > 0 ? (
              announcements.filter(a => a.targetRoles.includes("WALI_SANTRI")).map(ann => (
                <div key={ann.id} className="border-b border-muted/15 pb-4 last:border-b-0 last:pb-0">
                  <h4 className="font-bold text-sm text-primary flex items-center gap-1.5"><Megaphone className="h-4 w-4 text-accent" />{ann.judul}</h4>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{ann.konten}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold mt-2.5">
                    <Calendar className="h-3 w-3" />
                    {ann.tanggal}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">Belum ada pengumuman untuk wali santri.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
