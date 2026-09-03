"use client";

import React, { useState, useMemo } from "react";
import {
  Users,
  UserCheck,
  Clock,
  ShieldAlert,
  Filter,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  Eye
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteAbsensiUstadz, updateAbsensiUstadz } from "@/actions/absensi";

interface KehadiranUstadzClientProps {
  ustadzList: any[];
  absensiList: any[];
  jadwalList: any[];
  currentUserId?: string;
}

export function KehadiranUstadzClient({
  ustadzList,
  absensiList,
  jadwalList,
  currentUserId = "OPERATOR"
}: KehadiranUstadzClientProps) {
  const [localAbsensiList, setLocalAbsensiList] = useState(absensiList);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("semua");
  const [filterBulan, setFilterBulan] = useState(() => (new Date().getMonth() + 1).toString());
  const [filterTahun, setFilterTahun] = useState(() => new Date().getFullYear().toString());

  // Detail states
  const [selectedUstadz, setSelectedUstadz] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Edit & Delete states
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [isPending, setIsPending] = useState(false);

  const bulanNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  // Compute rekap per ustadz filtered by month/year
  const rekapData = useMemo(() => {
    const monthNum = parseInt(filterBulan);
    const yearNum = parseInt(filterTahun);

    return ustadzList
      .filter((u) => u.statusAktif)
      .map((u) => {
        // Filter attendance entries for this ustadz in the selected month/year
        const entries = localAbsensiList.filter((a: any) => {
          if (a.ustadzId !== u.id) return false;
          if (!a.tanggal) return false;
          const [y, m] = a.tanggal.split("-").map(Number);
          return y === yearNum && m === monthNum;
        });

        const hadir = entries.filter((e: any) => e.status === "Hadir").length;
        const terlambat = entries.filter((e: any) => e.status === "Terlambat").length;
        const izin = entries.filter((e: any) => e.status === "Izin").length;
        const alpha = entries.filter((e: any) => e.status === "Alpha").length;
        const pengganti = entries.filter((e: any) => e.status === "Hadir (Pengganti)").length;

        const totalJadwal = jadwalList.filter((j: any) => j.ustadzId === u.id).length;

        // Calculate attendance percentage
        const totalActive = hadir + terlambat + pengganti;
        const totalAll = hadir + terlambat + izin + alpha + pengganti;
        const pct = totalAll > 0 ? Math.round((totalActive / totalAll) * 100) : 0;

        return {
          id: u.id,
          nama: u.nama,
          nomorHp: u.nomorHp,
          hadir,
          terlambat,
          izin,
          alpha,
          pengganti,
          totalJadwal,
          totalEntries: totalAll,
          pct,
        };
      })
      .filter((u) => {
        if (searchQuery) {
          return u.nama.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return true;
      })
      .filter((u) => {
        if (filterStatus === "hadir") return u.hadir > 0;
        if (filterStatus === "terlambat") return u.terlambat > 0;
        if (filterStatus === "izin") return u.izin > 0;
        if (filterStatus === "alpha") return u.alpha > 0;
        return true;
      });
  }, [ustadzList, localAbsensiList, jadwalList, searchQuery, filterStatus, filterBulan, filterTahun]);

  // Summary stats
  const totalHadir = rekapData.reduce((s, r) => s + r.hadir, 0);
  const totalTerlambat = rekapData.reduce((s, r) => s + r.terlambat, 0);
  const totalIzin = rekapData.reduce((s, r) => s + r.izin, 0);
  const totalAlpha = rekapData.reduce((s, r) => s + r.alpha, 0);

  const getStatusColor = (pct: number) => {
    if (pct >= 90) return "bg-emerald-500";
    if (pct >= 70) return "bg-amber-500";
    if (pct >= 50) return "bg-orange-500";
    return "bg-red-500";
  };

  const handleOpenDetail = (r: any) => {
    setSelectedUstadz(r);
    setDialogOpen(true);
  };

  const askConfirmation = (action: () => void) => {
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  const handleDeleteLog = (id: string) => {
    askConfirmation(async () => {
      setIsPending(true);
      const res = await deleteAbsensiUstadz(id, currentUserId);
      if (res.error) {
        toast.error("Gagal", { description: res.error });
      } else {
        toast.success("Berhasil", { description: res.message });
        setLocalAbsensiList((prev) => prev.filter((a) => a.id !== id));
      }
      setIsPending(false);
    });
  };

  const handleSaveEdit = async (id: string) => {
    setIsPending(true);
    const res = await updateAbsensiUstadz(id, editingStatus, currentUserId);
    if (res.error) {
      toast.error("Gagal", { description: res.error });
    } else {
      toast.success("Berhasil", { description: res.message });
      setLocalAbsensiList((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: editingStatus } : a))
      );
      setEditingLogId(null);
    }
    setIsPending(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-blue-gradient flex items-center justify-center text-white shadow-md">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-glow-gold">Kehadiran Asatidz</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Monitoring rekap kehadiran seluruh ustadz/asatidz per bulan.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-panel border-white/20 hover:shadow-lg transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Hadir</p>
              <p className="text-2xl font-extrabold text-emerald-600">{totalHadir}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-panel border-white/20 hover:shadow-lg transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Terlambat</p>
              <p className="text-2xl font-extrabold text-amber-600">{totalTerlambat}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-panel border-white/20 hover:shadow-lg transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Izin</p>
              <p className="text-2xl font-extrabold text-blue-600">{totalIzin}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-panel border-white/20 hover:shadow-lg transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Alpha</p>
              <p className="text-2xl font-extrabold text-red-600">{totalAlpha}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-panel border-white/20">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama ustadz..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white/60 rounded-xl"
              />
            </div>
            <div className="flex gap-2 flex-col md:flex-row w-full md:w-auto">
              <Select value={filterBulan} onValueChange={(val) => setFilterBulan(val || filterBulan)}>
                <SelectTrigger className="w-full md:w-[140px] bg-white/70 rounded-xl">
                  <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Bulan" />
                </SelectTrigger>
                <SelectContent>
                  {bulanNames.map((b, i) => (
                    <SelectItem key={i} value={(i + 1).toString()}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterTahun} onValueChange={(val) => setFilterTahun(val || filterTahun)}>
                <SelectTrigger className="w-full md:w-[100px] bg-white/70 rounded-xl">
                  <SelectValue placeholder="Tahun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2027">2027</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val || "semua")}>
                <SelectTrigger className="w-full md:w-[130px] bg-white/70 rounded-xl">
                  <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua</SelectItem>
                  <SelectItem value="hadir">Ada Hadir</SelectItem>
                  <SelectItem value="terlambat">Ada Terlambat</SelectItem>
                  <SelectItem value="izin">Ada Izin</SelectItem>
                  <SelectItem value="alpha">Ada Alpha</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid Cards per Ustadz */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rekapData.length === 0 && (
          <div className="col-span-full text-center py-16">
            <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-semibold">
              Tidak ada data kehadiran ustadz untuk bulan {bulanNames[parseInt(filterBulan) - 1]} {filterTahun}.
            </p>
          </div>
        )}

        {rekapData.map((r) => (
          <Card
            key={r.id}
            className="glass-panel border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 group"
          >
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-xl bg-blue-gradient flex items-center justify-center text-white text-sm font-extrabold shadow-md">
                    {r.nama.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <CardTitle className="text-sm font-extrabold leading-tight">{r.nama}</CardTitle>
                    <CardDescription className="text-[10px] font-mono mt-0.5">{r.nomorHp}</CardDescription>
                  </div>
                </div>
                <Badge
                  className={`${getStatusColor(r.pct)} text-white font-bold text-[10px] px-2 py-0.5 shadow-sm`}
                >
                  {r.pct}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full ${getStatusColor(r.pct)} transition-all duration-500`}
                  style={{ width: `${r.pct}%` }}
                />
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-emerald-50/80 rounded-xl p-2 border border-emerald-100/50">
                  <p className="text-lg font-extrabold text-emerald-600">{r.hadir}</p>
                  <p className="text-[9px] text-emerald-600/70 font-bold uppercase tracking-wider">Hadir</p>
                </div>
                <div className="bg-amber-50/80 rounded-xl p-2 border border-amber-100/50">
                  <p className="text-lg font-extrabold text-amber-600">{r.terlambat}</p>
                  <p className="text-[9px] text-amber-600/70 font-bold uppercase tracking-wider">Terlambat</p>
                </div>
                <div className="bg-blue-50/80 rounded-xl p-2 border border-blue-100/50">
                  <p className="text-lg font-extrabold text-blue-600">{r.izin}</p>
                  <p className="text-[9px] text-blue-600/70 font-bold uppercase tracking-wider">Izin</p>
                </div>
                <div className="bg-red-50/80 rounded-xl p-2 border border-red-100/50">
                  <p className="text-lg font-extrabold text-red-600">{r.alpha}</p>
                  <p className="text-[9px] text-red-600/70 font-bold uppercase tracking-wider">Alpha</p>
                </div>
              </div>

              {/* Meta info */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100/60">
                <div className="flex gap-2">
                  {r.pengganti > 0 && (
                    <Badge variant="outline" className="text-[9px] font-bold border-purple-200 bg-purple-50/50 text-purple-700">
                      {r.pengganti}x Pengganti
                    </Badge>
                  )}
                  <span className="text-[10px] text-muted-foreground font-semibold flex items-center">
                    {r.totalJadwal} jadwal/minggu
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleOpenDetail(r)}
                  className="h-7 text-[10px] px-2"
                >
                  <Eye className="h-3 w-3 mr-1" /> Detail
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ConfirmDialog 
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={() => {
          if (confirmAction) confirmAction();
        }}
        title="Konfirmasi Tindakan"
        message="Apakah Anda yakin ingin menghapus data absensi ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus"
        cancelText="Batal"
      />

      {/* Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl bg-white/90 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Detail Kehadiran - {selectedUstadz?.nama}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2 rounded-xl border border-slate-100">
            <Table>
              <TableHeader className="bg-slate-50/50 sticky top-0 backdrop-blur-sm z-10">
                <TableRow>
                  <TableHead className="font-bold">Tanggal</TableHead>
                  <TableHead className="font-bold">Waktu Scan</TableHead>
                  <TableHead className="font-bold">Tipe Guru</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedUstadz && localAbsensiList
                  .filter((a: any) => {
                    if (a.ustadzId !== selectedUstadz.id) return false;
                    const [y, m] = a.tanggal.split("-").map(Number);
                    return y === parseInt(filterTahun) && m === parseInt(filterBulan);
                  })
                  .sort((a: any, b: any) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
                  .map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium text-sm">{log.tanggal}</TableCell>
                      <TableCell className="text-sm">{log.waktuScan}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={log.teacherType === "SUBSTITUTE" ? "border-purple-200 text-purple-700 bg-purple-50" : "border-blue-200 text-blue-700 bg-blue-50"}>
                          {log.teacherType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {editingLogId === log.id ? (
                          <Select value={editingStatus} onValueChange={(v) => setEditingStatus(v || "")}>
                            <SelectTrigger className="w-[120px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Hadir">Hadir</SelectItem>
                              <SelectItem value="Terlambat">Terlambat</SelectItem>
                              <SelectItem value="Izin">Izin</SelectItem>
                              <SelectItem value="Alpha">Alpha</SelectItem>
                              <SelectItem value="Hadir (Pengganti)">Hadir (Pengganti)</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={
                            log.status.includes("Hadir") ? "bg-emerald-500" :
                            log.status === "Terlambat" ? "bg-amber-500" :
                            log.status === "Izin" ? "bg-blue-500" : "bg-red-500"
                          }>
                            {log.status}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {editingLogId === log.id ? (
                          <>
                            <Button size="icon" variant="ghost" onClick={() => handleSaveEdit(log.id)} disabled={isPending} className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setEditingLogId(null)} disabled={isPending} className="h-8 w-8 text-slate-400 hover:text-slate-600">
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="icon" variant="ghost" onClick={() => { setEditingLogId(log.id); setEditingStatus(log.status); }} disabled={isPending} className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDeleteLog(log.id)} disabled={isPending} className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                {(!localAbsensiList.some((a: any) => {
                  const [y, m] = a.tanggal?.split("-").map(Number) || [0, 0];
                  return a.ustadzId === selectedUstadz?.id && y === parseInt(filterTahun) && m === parseInt(filterBulan);
                })) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Tidak ada detail riwayat untuk bulan ini.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
