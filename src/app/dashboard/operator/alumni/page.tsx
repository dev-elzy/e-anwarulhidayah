"use client";

import React, { useEffect, useState, useTransition, useCallback } from "react";
import { useSession } from "next-auth/react";
import { apiGet, apiPost } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, RotateCcw, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/confirm-dialog";

export default function AlumniPage() {
  const { data: session } = useSession();
  const [list, setList] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "LULUS", "BOYONG"
  const [tahunFilter, setTahunFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Confirmation states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState("");

  const askConfirmation = (message: string, action: () => void) => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { resource: "alumni" };
      if (search) params.search = search;
      if (statusFilter && statusFilter !== "all") params.status = statusFilter;
      if (tahunFilter && tahunFilter !== "all") params.tahunKeluar = tahunFilter;
      
      const res = await apiGet("alumni", params);
      setList(res);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [search, statusFilter, tahunFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Extract distinct years from alumni list to show in year filter
  const distinctYears = React.useMemo(() => {
    const years = list
      .map(item => item.tahunKeluar)
      .filter(Boolean);
    return Array.from(new Set(years)).sort((a, b) => b.localeCompare(a));
  }, [list]);

  const handleRestore = (id: string, name: string) => {
    if (!session?.user?.id) return;
    askConfirmation(`Apakah Anda yakin ingin mengaktifkan kembali alumni ${name} menjadi santri aktif?`, () => {
      startTransition(async () => {
        const res = await apiPost("changeSantriStatus", {
          id,
          params: {
            status: "AKTIF"
          }
        });
        if (res.error) {
          toast.error("Gagal", { description: res.error });
        } else {
          toast.success("Berhasil", { description: res.message });
          loadData();
        }
      });
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-glow-gold flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" /> Data Alumni Santri
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola data santri yang sudah Lulus atau Boyong (keluar). Anda dapat memulihkan status mereka jika diperlukan.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white/40 border border-white/40 p-4 rounded-2xl backdrop-blur-sm justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-muted-foreground" />
          <Input 
            placeholder="Cari alumni berdasarkan nama / NIS..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/70"
          />
        </div>

        <div className="flex flex-col md:flex-row flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 w-full md:w-auto justify-center">
            <Button
              variant={statusFilter === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("all")}
              className={`flex-1 md:flex-none rounded-lg text-xs font-bold ${statusFilter === "all" ? "bg-white text-primary shadow-sm hover:bg-white" : "text-slate-600"}`}
            >
              Semua
            </Button>
            <Button
              variant={statusFilter === "LULUS" ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("LULUS")}
              className={`flex-1 md:flex-none rounded-lg text-xs font-bold ${statusFilter === "LULUS" ? "bg-white text-green-700 shadow-sm hover:bg-white" : "text-slate-600"}`}
            >
              Lulus
            </Button>
            <Button
              variant={statusFilter === "BOYONG" ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("BOYONG")}
              className={`flex-1 md:flex-none rounded-lg text-xs font-bold ${statusFilter === "BOYONG" ? "bg-white text-amber-700 shadow-sm hover:bg-white" : "text-slate-600"}`}
            >
              Boyong
            </Button>
          </div>

          {/* Year Filter Dropdown */}
          <div className="flex flex-1 items-center gap-1.5 bg-white/70 px-2.5 py-1.5 rounded-xl border border-muted/15 w-full md:w-auto justify-between md:justify-start">
            <span className="text-xs font-bold text-muted-foreground shrink-0">Tahun Keluar:</span>
            <Select value={tahunFilter} onValueChange={(val) => setTahunFilter(val || "all")}>
              <SelectTrigger className="border-0 shadow-none bg-transparent w-full md:w-[110px] focus:ring-0 p-0 text-xs font-bold h-auto justify-end gap-2">
                <SelectValue placeholder="Pilih Tahun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tahun</SelectItem>
                {distinctYears.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Alumni Table */}
      <Card className="glass-panel border-white/20">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/50 border-b border-muted/10">
                <TableRow>
                  <TableHead className="font-bold w-[60px]">Foto</TableHead>
                  <TableHead className="font-bold">NIS</TableHead>
                  <TableHead className="font-bold">Nama Lengkap</TableHead>
                  <TableHead className="font-bold">Gender</TableHead>
                  <TableHead className="font-bold">Asal Daerah</TableHead>
                  <TableHead className="font-bold text-center">Status Keluar</TableHead>
                  <TableHead className="font-bold text-center">Tahun Keluar</TableHead>
                  <TableHead className="font-bold text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-sm text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Memuat data...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : list.length > 0 ? (
                  list.map((s) => (
                    <TableRow key={s.id} className="hover:bg-white/50">
                      <TableCell className="py-2">
                        <div className="h-10 w-10 rounded-full border border-primary/20 bg-muted overflow-hidden relative shadow-sm flex items-center justify-center">
                          {s.fotoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={s.fotoUrl} alt={s.namaLengkap} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold text-xs">
                              {s.namaLengkap.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-xs">{s.nis}</TableCell>
                      <TableCell className="font-bold text-sm">{s.namaLengkap}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className={s.jenisKelamin === "L" ? "bg-blue-50/50 text-blue-700 border-blue-100" : "bg-pink-50/50 text-pink-700 border-pink-100"}>
                          {s.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-semibold">{s.alamat}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={s.statusBoyongLulus === "LULUS" ? "bg-green-100 text-green-800 border-green-200" : "bg-amber-100 text-amber-800 border-amber-200"}>
                          {s.statusBoyongLulus === "LULUS" ? "Lulus" : "Boyong (Keluar)"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold text-xs">{s.tahunKeluar || "-"}</TableCell>
                      <TableCell className="text-center">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          disabled={isPending}
                          onClick={() => handleRestore(s.id, s.namaLengkap)}
                          className="text-primary hover:text-primary-hover hover:bg-primary/10 rounded-xl font-bold text-xs flex items-center gap-1 mx-auto min-h-[36px]"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Aktifkan Kembali
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-sm text-muted-foreground">
                      Tidak ada data alumni yang cocok.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        message={confirmMessage}
        onConfirm={() => confirmAction?.()}
      />
    </div>
  );
}
