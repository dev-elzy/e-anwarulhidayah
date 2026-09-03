"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Printer, Search, Archive, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { apiGet } from "@/lib/api-client";

interface ArsipClientProps {
  kelasList: any[];
  semesterList: any[];
  activeSemesterId: string;
  initialNilaiList: any[];
}

export function ArsipClient({
  kelasList,
  semesterList,
  activeSemesterId,
  initialNilaiList,
}: ArsipClientProps) {
  const [selectedKelasId, setSelectedKelasId] = useState<string>(() => kelasList[0]?.id || "");
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>(activeSemesterId);
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch students for selected class (including alumni)
  const loadStudents = useCallback(async () => {
    if (!selectedKelasId) return;
    setLoading(true);
    try {
      const res = await apiGet("santri", {
        kelasId: selectedKelasId,
        includeAlumni: "true",
      });
      setStudents(res);
    } catch (e) {
      console.error("Failed to load class students:", e);
    }
    setLoading(false);
  }, [selectedKelasId]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // Filter students by search input
  const filteredStudents = React.useMemo(() => {
    return students.filter(s =>
      s.namaLengkap.toLowerCase().includes(search.toLowerCase()) ||
      s.nis.includes(search)
    );
  }, [students, search]);

  // Calculate student average grade for selected semester (with fallback to all semesters)
  const getAverageGrade = (studentId: string): { avg: string; isFallback: boolean } => {
    let grades = initialNilaiList.filter(g =>
      g.santriId === studentId && g.semesterId === selectedSemesterId
    );
    let isFallback = false;
    if (grades.length === 0) {
      grades = initialNilaiList.filter(g => g.santriId === studentId);
      isFallback = true;
    }
    if (grades.length === 0) return { avg: "-", isFallback: false };
    const sum = grades.reduce((acc, curr) => acc + curr.nilai, 0);
    return { avg: (sum / grades.length).toFixed(1), isFallback };
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-blue-gradient flex items-center justify-center text-white shadow-md">
            <Archive className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-glow-gold">Arsip Nilai & Raport Santri</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Cari dan cetak dokumen Transkrip Nilai (Lembar Nilai) atau Raport Formal Lengkap untuk setiap santri per kelas.
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Search Toolbar - Ultra Compact */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 bg-card/70 border border-border/70 p-2 rounded-xl shadow-xs backdrop-blur-md justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari santri berdasarkan nama / NIS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs rounded-lg bg-background/80 border-border/60"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Class Select */}
          <Select value={selectedKelasId} onValueChange={(val) => setSelectedKelasId(val || "")}>
            <SelectTrigger className="h-9 px-3 rounded-lg bg-background/80 border-border/60 text-xs font-semibold w-auto min-w-[140px]">
              <SelectValue placeholder="Pilih Kelas">
                {kelasList.find(k => k.id === selectedKelasId)?.namaKelas || "Pilih Kelas"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-border/80 shadow-lg">
              {kelasList.map(k => (
                <SelectItem key={k.id} value={k.id} className="text-xs font-semibold cursor-pointer">{k.namaKelas}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Semester Select */}
          <Select value={selectedSemesterId} onValueChange={(val) => setSelectedSemesterId(val || "")}>
            <SelectTrigger className="h-9 px-3 rounded-lg bg-background/80 border-border/60 text-xs font-semibold w-auto min-w-[160px]">
              <SelectValue placeholder="Pilih Semester">
                {semesterList.find(s => s.id === selectedSemesterId)?.nama ? `Semester ${semesterList.find(s => s.id === selectedSemesterId)?.nama}` : "Pilih Semester"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-border/80 shadow-lg">
              {semesterList.map(sem => (
                <SelectItem key={sem.id} value={sem.id} className="text-xs font-semibold cursor-pointer">
                  Semester {sem.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Students Archive Table */}
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
                  <TableHead className="font-bold text-center">Status</TableHead>
                  <TableHead className="font-bold text-center">Rata-rata Nilai</TableHead>
                  <TableHead className="font-bold text-center">Cetak Arsip</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-sm text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Memuat data santri...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((s) => {
                    const avgResult = getAverageGrade(s.id);
                    return (
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
                        <TableCell className="text-center">
                          {s.statusAktif ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">Aktif</Badge>
                          ) : (
                            <Badge className={s.statusBoyongLulus === "LULUS" ? "bg-blue-100 text-blue-800 border-blue-200" : "bg-amber-100 text-amber-800 border-amber-200"}>
                              {s.statusBoyongLulus === "LULUS" ? "Lulus (Alumni)" : "Boyong (Alumni)"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <Badge className="bg-slate-100 text-slate-800 font-extrabold text-xs">
                              {avgResult.avg}
                            </Badge>
                            {avgResult.isFallback && avgResult.avg !== "-" && (
                              <span className="text-[9px] text-muted-foreground font-semibold">(semua smt)</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                            {/* 1. View / Pratinjau Raport di Layar */}
                            <a 
                              href={`/dashboard/mustahiq/raport/${s.id}?semesterId=${selectedSemesterId}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-2.5 rounded-lg border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-bold text-xs gap-1 cursor-pointer shrink-0"
                                title="Lihat Tampilan Raport di Layar"
                              >
                                <Eye className="h-3.5 w-3.5" /> Lihat
                              </Button>
                            </a>

                            {/* 2. PDF Nilai (Transkrip) */}
                            <a 
                              href={`/dashboard/mustahiq/raport/${s.id}?semesterId=${selectedSemesterId}&mode=nilai&download=true`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-2.5 rounded-lg border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 font-bold text-xs gap-1 cursor-pointer shrink-0"
                                title="Unduh Lembar Nilai Transkrip"
                              >
                                <FileText className="h-3.5 w-3.5" /> Nilai
                              </Button>
                            </a>

                            {/* 3. PDF Raport */}
                            <a 
                              href={`/dashboard/mustahiq/raport/${s.id}?semesterId=${selectedSemesterId}&download=true`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-2.5 rounded-lg border-blue-300 text-blue-700 dark:border-blue-800 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 font-bold text-xs gap-1 cursor-pointer shrink-0"
                                title="Unduh / Cetak Raport PDF"
                              >
                                <Printer className="h-3.5 w-3.5" /> Cetak
                              </Button>
                            </a>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-sm text-muted-foreground">
                      Tidak ada data santri ditemukan.
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
