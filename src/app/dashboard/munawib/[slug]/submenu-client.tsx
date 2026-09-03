"use client";

import React, { useState, useTransition } from "react";
import { 
  Calendar, 
  GraduationCap, 
  BookOpen, 
  PlusCircle 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiPost } from "@/lib/api-client";

interface MunawibSubmenuClientProps {
  slug: string;
  ustadzId: string;
  jadwalList: any[];
  kelasList: any[];
  kitabList: any[];
  nadzomList: any[];
  santriList: any[];
  nilaiList: any[];
  setoranList: any[];
  semesterList?: any[];
  activeSemesterId?: string;
  currentUserId: string;
}

export function MunawibSubmenuClient({
  slug,
  ustadzId,
  jadwalList,
  kelasList,
  kitabList,
  nadzomList,
  santriList,
  nilaiList,
  setoranList,
  semesterList = [],
  activeSemesterId = ""
}: MunawibSubmenuClientProps) {
  const [nilais, setNilais] = useState<any[]>(nilaiList);
  const [setorans, setSetorans] = useState<any[]>(setoranList);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // 2. Chained Setoran Nadzom Form State
  const [setoranKelasId, setSetoranKelasId] = useState("");
  const [setoranSantriId, setSetoranSantriId] = useState("");
  const [setoranNadzomId, setSetoranNadzomId] = useState("");
  const [setoranBaitMulai, setSetoranBaitMulai] = useState("");
  const [setoranJumlahBait, setSetoranJumlahBait] = useState("");
  const [setoranStatus, setSetoranStatus] = useState("Lancar");

  // Get distinct classes this teacher teaches
  const distinctKelas = React.useMemo(() => {
    return Array.from(new Set(jadwalList.map(j => j.kelasId)))
      .map(id => kelasList.find(k => k.id === id))
      .filter(Boolean);
  }, [jadwalList, kelasList]);

  // Semester filter state & Class filter state for guru nilai inputs
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>(activeSemesterId);
  const [selectedKelasId, setSelectedKelasId] = useState<string>(() => {
    return distinctKelas[0]?.id || "";
  });

  // Edit Mode states for Grade Sheet
  const [isEditingGrades, setIsEditingGrades] = useState(false);
  const [editedGrades, setEditedGrades] = useState<Record<string, string>>({});
  const [selectedGradeType, setSelectedGradeType] = useState<"TAMRIN_1" | "TAMRIN_2" | "UAS">("UAS");

  // Get active subjects taught by this ustadz in the selected class
  const ustadzClassSubjects = React.useMemo(() => {
    if (!selectedKelasId) return [];
    const classSchedules = jadwalList.filter(j => j.kelasId === selectedKelasId && j.ustadzId === ustadzId);
    const subjectIds = new Set<string>(classSchedules.map(j => j.kitabMapelId));
    return Array.from(subjectIds)
      .map(id => kitabList.find(k => k.id === id))
      .filter(Boolean);
  }, [selectedKelasId, jadwalList, ustadzId, kitabList]);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");

  React.useEffect(() => {
    if (ustadzClassSubjects.length > 0) {
      setSelectedSubjectId(ustadzClassSubjects[0].id);
    } else {
      setSelectedSubjectId("");
    }
  }, [selectedKelasId, ustadzClassSubjects]);

  // Filter students for selected class in grade sheet
  const classStudents = React.useMemo(() => {
    if (!selectedKelasId) return [];
    return santriList.filter(s => s.kelasId === selectedKelasId);
  }, [selectedKelasId, santriList]);

  const handleStartGradeEdit = () => {
    if (!selectedSubjectId) return;
    const initial: Record<string, string> = {};
    classStudents.forEach(s => {
      const key = `${s.id}_${selectedSubjectId}`;
      const existing = nilais.find(g => 
        g.santriId === s.id && 
        g.kitabMapelId === selectedSubjectId && 
        g.semesterId === selectedSemesterId &&
        (g.jenis === selectedGradeType || (!g.jenis && selectedGradeType === "UAS") || (g.jenis === "TAMRIN" && selectedGradeType === "TAMRIN_1"))
      );
      initial[key] = existing ? String(existing.nilai) : "";
    });
    setEditedGrades(initial);
    setIsEditingGrades(true);
  };

  const handleGradeValChange = (studentId: string, subjectId: string, value: string) => {
    if (value !== "") {
      const num = parseFloat(value);
      if (isNaN(num) || num < 0 || num > 100) return;
    }
    setEditedGrades(prev => ({
      ...prev,
      [`${studentId}_${subjectId}`]: value
    }));
  };

  const handleCancelGradeEdit = () => {
    setEditedGrades({});
    setIsEditingGrades(false);
  };

  const handleSaveGradesBatch = () => {
    if (!selectedSubjectId) return;
    const gradeUpdates: { santriId: string; kitabMapelId: string; nilai: number }[] = [];
    
    classStudents.forEach(s => {
      const key = `${s.id}_${selectedSubjectId}`;
      const valStr = editedGrades[key];
      if (valStr !== undefined && valStr !== "") {
        const num = parseFloat(valStr);
        if (!isNaN(num)) {
          gradeUpdates.push({
            santriId: s.id,
            kitabMapelId: selectedSubjectId,
            nilai: num
          });
        }
      }
    });

    if (gradeUpdates.length === 0) {
      toast.error("Peringatan", { description: "Tidak ada data nilai valid untuk disimpan." });
      return;
    }

    startTransition(async () => {
      const res = await apiPost("saveGradesBatch", {
        data: { 
          jenis: selectedGradeType,
          semesterId: selectedSemesterId,
          grades: gradeUpdates 
        }
      });
      if (res.error) {
        toast.error("Gagal", { description: res.error });
      } else {
        toast.success("Berhasil", { description: res.message });
        
        const updatedNilais = [...nilais];
        gradeUpdates.forEach(up => {
          const idx = updatedNilais.findIndex(g => 
            g.santriId === up.santriId && 
            g.kitabMapelId === up.kitabMapelId && 
            g.semesterId === selectedSemesterId &&
            (g.jenis === selectedGradeType || (!g.jenis && selectedGradeType === "UAS") || (g.jenis === "TAMRIN" && selectedGradeType === "TAMRIN_1"))
          );
          if (idx !== -1) {
            updatedNilais[idx] = { ...updatedNilais[idx], nilai: up.nilai };
          } else {
            updatedNilais.push({
              id: "TEMP-" + Math.random().toString(),
              santriId: up.santriId,
              kitabMapelId: up.kitabMapelId,
              nilai: up.nilai,
              semesterId: selectedSemesterId,
              jenis: selectedGradeType
            });
          }
        });
        setNilais(updatedNilais);
        setIsEditingGrades(false);
      }
    });
  };

  // Filter students for selected class in setoran form
  const filteredSetoranStudents = setoranKelasId 
    ? santriList.filter(s => s.kelasId === setoranKelasId)
    : [];

  // Submit Setoran Nadzom
  const handleAddSetoran = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setoranSantriId || !setoranNadzomId || !setoranBaitMulai || !setoranJumlahBait) {
      toast.error("Peringatan", { description: "Lengkapi semua data setoran." });
      return;
    }

    startTransition(async () => {
      const baitMulaiNum = parseInt(setoranBaitMulai);
      const jumlahBaitNum = parseInt(setoranJumlahBait);
      const baitSelesaiNum = baitMulaiNum + jumlahBaitNum - 1;

      const res = await apiPost("createSetoranNadzom", {
        data: { santriId: setoranSantriId, kitabNadzomId: setoranNadzomId, baitMulai: baitMulaiNum, baitSelesai: baitSelesaiNum, status: setoranStatus }
      });
      if (res.error) {
        toast.error("Gagal", { description: res.error });
      } else {
        toast.success("Berhasil", { description: res.message });
        setDialogOpen(false);
        setSetorans([{ id: Math.random().toString(), santriId: setoranSantriId, kitabNadzomId: setoranNadzomId, baitMulai: baitMulaiNum, baitSelesai: baitSelesaiNum, status: setoranStatus, tanggal: new Date().toISOString().split("T")[0], ustadzId }, ...setorans]);
        setSetoranBaitMulai(""); setSetoranJumlahBait("");
      }
    });
  };

  // Get info header
  const getHeaderInfo = () => {
    switch (slug) {
      case "jadwal": return { title: "Jadwal Mengajar Saya", desc: "Tabel penugasan jam pelajaran dan kelas mengajar Anda.", icon: Calendar };
      case "nilai": return { title: "Nilai Akademik Santri", desc: "Tampilkan rekapitulasi dan input nilai per mapel.", icon: GraduationCap };
      case "hafalan": return { title: "Hafalan Kitab Nadzom", desc: "Catat dan monitor setoran bait nadzom santri.", icon: BookOpen };
      default: return { title: "Munawib Menu", desc: "Operasional pengajaran guru.", icon: Calendar };
    }
  };

  const info = getHeaderInfo();
  const Icon = info.icon;

  return (
    <div className="space-y-6 px-1">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-blue-gradient flex items-center justify-center text-white shadow-md">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-glow-gold">{info.title}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{info.desc}</p>
          </div>
        </div>

        {slug === "hafalan" && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger className="bg-blue-gradient text-white rounded-xl font-bold flex items-center gap-2 py-2.5 px-4 shadow-lg shadow-primary/20 cursor-pointer min-h-[44px]">
              <PlusCircle className="h-5 w-5" /> Catat Setoran
            </DialogTrigger>
            <DialogContent className="max-w-md bg-popover backdrop-blur-xl border border-border rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-glow-gold">Tambah Setoran Nadzom</DialogTitle>
                <DialogDescription>Gunakan drop-down berantai untuk menghindari salah input kelas/murid.</DialogDescription>
              </DialogHeader>

              {/* B. Setoran Nadzom Form with Dropdown Chain */}
              <form onSubmit={handleAddSetoran} className="space-y-4 pt-2">
                {/* 1. Select Class */}
                <div className="space-y-1.5">
                  <Label htmlFor="h-kelas">1. Pilih Kelas</Label>
                  <Select value={setoranKelasId} onValueChange={(val) => { setSetoranKelasId(val || ""); setSetoranSantriId(""); }}>
                    <SelectTrigger className="bg-white/50 dark:bg-black/20 min-h-[44px]">
                      <SelectValue placeholder="Pilih Kelas">
                        {setoranKelasId ? distinctKelas.find(k => k.id === setoranKelasId)?.namaKelas : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {distinctKelas.map(k => (
                        <SelectItem key={k.id} value={k.id}>{k.namaKelas}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 2. Select Student (Filtered by Class) */}
                <div className="space-y-1.5">
                  <Label htmlFor="h-santri">2. Pilih Santri</Label>
                  <Select value={setoranSantriId} disabled={!setoranKelasId} onValueChange={(val) => setSetoranSantriId(val || "")}>
                    <SelectTrigger className="bg-white/50 dark:bg-black/20 min-h-[44px]">
                      <SelectValue placeholder={setoranKelasId ? "Pilih Santri" : "Pilih kelas dahulu"}>
                        {setoranSantriId ? filteredSetoranStudents.find(s => s.id === setoranSantriId)?.namaLengkap : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSetoranStudents.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.namaLengkap}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 3. Select Kitab Nadzom (Dynamic from DB!) */}
                <div className="space-y-1.5">
                  <Label htmlFor="h-nadzom">3. Kitab Nadzom</Label>
                  <Select value={setoranNadzomId} onValueChange={(val) => setSetoranNadzomId(val || "")}>
                    <SelectTrigger className="bg-white/50 dark:bg-black/20 min-h-[44px]">
                      <SelectValue placeholder="Pilih Kitab Nadzom">
                        {setoranNadzomId ? (() => {
                          const n = nadzomList.find(n => n.id === setoranNadzomId);
                          return n ? `${n.namaKitab} (Total: ${n.jumlahBait} Bait)` : undefined;
                        })() : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {nadzomList.map(n => (
                        <SelectItem key={n.id} value={n.id}>{n.namaKitab} (Total: {n.jumlahBait} Bait)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 4. Range Bait */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="h-mulai">Bait Mulai</Label>
                      <Input id="h-mulai" type="number" required value={setoranBaitMulai} onChange={(e) => setSetoranBaitMulai(e.target.value)} placeholder="1" className="bg-white/50 dark:bg-black/20 min-h-[44px]" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="h-jumlah">Jumlah Setoran Baru</Label>
                      <Input id="h-jumlah" type="number" required value={setoranJumlahBait} onChange={(e) => setSetoranJumlahBait(e.target.value)} placeholder="10" className="bg-white/50 dark:bg-black/20 min-h-[44px]" />
                    </div>
                  </div>
                  <p className="text-[11px] italic bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 p-2 rounded-lg border border-amber-200 dark:border-amber-900/50">
                    💡 <strong>Penting:</strong> Input jumlah bait yang <u className="font-bold">baru disetor hari ini</u>, bukan total keseluruhan. Sistem akan otomatis menghitung posisi akhir.
                  </p>
                </div>

                {/* 5. Status Kejelasan */}
                <div className="space-y-1.5">
                  <Label htmlFor="h-status">Kualitas Hafalan</Label>
                  <Select value={setoranStatus} onValueChange={(val) => setSetoranStatus(val || "Lancar")}>
                    <SelectTrigger className="bg-white/50 dark:bg-black/20 min-h-[44px]">
                      <SelectValue placeholder="Pilih Kualitas">
                        {setoranStatus || undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lancar">Lancar</SelectItem>
                      <SelectItem value="Cukup">Cukup</SelectItem>
                      <SelectItem value="Mengulang">Mengulang</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter className="pt-2">
                  <Button type="submit" disabled={isPending || !setoranSantriId || !setoranNadzomId} className="bg-blue-gradient text-white font-bold w-full rounded-xl cursor-pointer min-h-[44px]">Simpan Setoran</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* RENDER VIEW CASES */}

      {/* 1. Jadwal Ustadz (Dibatasi) */}
      {slug === "jadwal" && (
        <Card className="glass-panel border-white/20 p-8 text-center max-w-md mx-auto">
          <CardContent className="space-y-4 pt-6">
            <h2 className="text-xl font-bold text-red-600">Akses Terbatas</h2>
            <p className="text-sm text-muted-foreground font-semibold">
              Peran Anda saat ini (Munawib/Guru Mapel) hanya diperbolehkan melakukan Scan Kehadiran dan Input Nilai Mapel.
            </p>
          </CardContent>
        </Card>
      )}

      {/* 2. Nilai Ustadz */}
      {slug === "nilai" && (
        <div className="space-y-4">
          {/* Filters & Actions bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/50 backdrop-blur-md p-4 rounded-xl border border-white/20 shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              {/* Category Toggle */}
              <div className="flex items-center gap-2 bg-slate-100/80 p-1 rounded-xl">
                <button
                  disabled={isEditingGrades}
                  onClick={() => setSelectedGradeType("TAMRIN_1")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedGradeType === "TAMRIN_1"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 disabled:opacity-50 cursor-pointer"
                  }`}
                >
                  Tamrin 1
                </button>
                <button
                  disabled={isEditingGrades}
                  onClick={() => setSelectedGradeType("TAMRIN_2")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedGradeType === "TAMRIN_2"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 disabled:opacity-50 cursor-pointer"
                  }`}
                >
                  Tamrin 2
                </button>
                <button
                  disabled={isEditingGrades}
                  onClick={() => setSelectedGradeType("UAS")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedGradeType === "UAS"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 disabled:opacity-50 cursor-pointer"
                  }`}
                >
                  UAS (Semester)
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor="class-filter" className="text-xs font-bold text-slate-500 uppercase">Kelas:</Label>
                <Select value={selectedKelasId} onValueChange={(val) => { setSelectedKelasId(val || ""); setIsEditingGrades(false); }}>
                  <SelectTrigger className="w-[150px] bg-white min-h-[40px] text-xs font-semibold border-slate-200">
                    <SelectValue placeholder="Pilih Kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {distinctKelas.map((k) => (
                      <SelectItem key={k.id} value={k.id} className="text-xs">
                        {k.namaKelas}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor="subject-filter" className="text-xs font-bold text-slate-500 uppercase">Mata Pelajaran:</Label>
                <Select value={selectedSubjectId} disabled={ustadzClassSubjects.length === 0} onValueChange={(val) => { setSelectedSubjectId(val || ""); setIsEditingGrades(false); }}>
                  <SelectTrigger className="w-[200px] bg-white min-h-[40px] text-xs font-semibold border-slate-200">
                    <SelectValue placeholder={ustadzClassSubjects.length === 0 ? "Tidak ada mapel" : "Pilih Mapel"} />
                  </SelectTrigger>
                  <SelectContent>
                    {ustadzClassSubjects.map((sub: any) => (
                      <SelectItem key={sub.id} value={sub.id} className="text-xs">
                        {sub.namaKitabMapel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor="semester-filter" className="text-xs font-bold text-slate-500 uppercase">Semester:</Label>
                <Select value={selectedSemesterId} onValueChange={(val) => { setSelectedSemesterId(val || ""); setIsEditingGrades(false); }}>
                  <SelectTrigger className="w-[180px] bg-white min-h-[40px] text-xs font-semibold border-slate-200">
                    <SelectValue placeholder="Pilih Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesterList.map((sem) => (
                      <SelectItem key={sem.id} value={sem.id} className="text-xs">
                        {sem.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 self-end lg:self-auto">
              {!isEditingGrades ? (
                <Button 
                  onClick={handleStartGradeEdit}
                  disabled={!selectedKelasId || !selectedSubjectId}
                  className="bg-blue-gradient text-white rounded-xl font-bold flex items-center gap-2 py-2 px-4 shadow-lg shadow-primary/20 cursor-pointer min-h-[40px] text-xs"
                >
                  Edit Nilai
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={handleCancelGradeEdit}
                    variant="outline"
                    className="border-slate-300 font-bold rounded-xl cursor-pointer min-h-[40px] text-xs"
                    disabled={isPending}
                  >
                    Batal
                  </Button>
                  <Button 
                    onClick={handleSaveGradesBatch}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center gap-2 py-2 px-4 shadow-lg shadow-green-600/20 cursor-pointer min-h-[40px] text-xs"
                    disabled={isPending}
                  >
                    {isPending ? "Menyimpan..." : "Simpan Nilai"}
                  </Button>
                </>
              )}
            </div>
          </div>

          <Card className="glass-panel border-white/20">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-white/50">
                    <TableRow>
                      <TableHead className="font-bold w-[60px] text-center">No</TableHead>
                      <TableHead className="font-bold min-w-[200px]">Nama Lengkap</TableHead>
                      <TableHead className="font-bold text-center min-w-[150px] uppercase">
                        Nilai (Mapel: {kitabList.find(k => k.id === selectedSubjectId)?.namaKitabMapel || "-"})
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classStudents.length > 0 ? (
                      classStudents.map((s, idx) => {
                        const key = `${s.id}_${selectedSubjectId}`;
                        const val = isEditingGrades ? (editedGrades[key] || "") : (() => {
                          const existing = nilais.find(g => 
                            g.santriId === s.id && 
                            g.kitabMapelId === selectedSubjectId && 
                            g.semesterId === selectedSemesterId &&
                            (g.jenis === selectedGradeType || (!g.jenis && selectedGradeType === "UAS") || (g.jenis === "TAMRIN" && selectedGradeType === "TAMRIN_1"))
                          );
                          return existing ? String(existing.nilai) : "-";
                        })();
                        return (
                          <TableRow key={s.id}>
                            <TableCell className="text-center font-semibold text-xs">{idx + 1}</TableCell>
                            <TableCell className="font-bold text-sm text-slate-800">{s.namaLengkap}</TableCell>
                            <TableCell className="text-center p-2">
                              {isEditingGrades ? (
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  className="w-24 mx-auto text-center font-bold bg-white min-h-[36px]"
                                  value={val}
                                  onChange={(e) => handleGradeValChange(s.id, selectedSubjectId, e.target.value)}
                                  placeholder="-"
                                />
                              ) : (
                                <span className="font-bold text-slate-700">{val}</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <td colSpan={3} className="text-center py-8 text-xs text-muted-foreground">
                          {!selectedKelasId 
                            ? "Silakan pilih kelas terlebih dahulu." 
                            : "Tidak ada data santri terdaftar untuk kelas ini."
                          }
                        </td>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3. Hafalan Ustadz (Dibatasi) */}
      {slug === "hafalan" && (
        <Card className="glass-panel border-white/20 p-8 text-center max-w-md mx-auto">
          <CardContent className="space-y-4 pt-6">
            <h2 className="text-xl font-bold text-red-600">Akses Terbatas</h2>
            <p className="text-sm text-muted-foreground font-semibold">
              Peran Anda saat ini (Munawib/Guru Mapel) hanya diperbolehkan melakukan Scan Kehadiran dan Input Nilai Mapel.
            </p>
          </CardContent>
        </Card>
      )}


    </div>
  );
}
