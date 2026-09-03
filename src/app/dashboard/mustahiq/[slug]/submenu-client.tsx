/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useTransition } from "react";
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  ClipboardList, 
  PlusCircle, 
  Trash2, 
  Search,
  FileCheck,
  Eye,
  Printer,
  Download,
  FileText
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiPost } from "@/lib/api-client";
import Link from "next/link";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getAbsensiBulananRecords, saveAbsensiBulananRecords } from "@/actions/absensi-bulanan";


const BULAN_HIJRIAH = [
  "Muharram", "Safar", "Rabiul Awal", "Rabiul Akhir",
  "Jumadil Awal", "Jumadil Akhir", "Rajab", "Sya'ban",
  "Ramadhan", "Syawal", "Dzulqa'dah", "Dzulhijjah"
];

const CATATAN_TEMPLATES = [
  // A. Catatan Positif
  "Menunjukkan kedisiplinan yang baik dalam mengikuti kegiatan pembelajaran dan tata tertib pesantren.",
  "Aktif dalam mengikuti pelajaran serta memiliki semangat belajar yang baik dan konsisten.",
  "Memiliki akhlak yang baik terhadap guru dan teman, serta menjadi teladan dalam bersikap.",
  "Menunjukkan perkembangan yang baik dalam pemahaman materi dan hafalan yang dipelajari.",
  "Rajin mengikuti kegiatan pesantren dan mampu menjaga tanggung jawab dengan baik.",
  // B. Catatan Cukup / Perlu Bimbingan
  "Perlu meningkatkan kedisiplinan dalam mengikuti kegiatan pembelajaran dan kehadiran di kelas.",
  "Memiliki potensi yang baik, namun perlu meningkatkan fokus dan kesungguhan dalam belajar.",
  "Perlu lebih aktif dalam mengikuti pembelajaran dan berpartisipasi selama kegiatan berlangsung.",
  "Perlu meningkatkan ketekunan dalam murojaah dan mengulang kembali materi yang telah dipelajari.",
  "Menunjukkan perkembangan yang cukup baik, namun masih memerlukan bimbingan dan pendampingan secara berkelanjutan.",
  // C. Catatan Motivasi
  "Teruslah semangat dalam menuntut ilmu, karena setiap usaha yang dilakukan akan membawa manfaat di masa depan.",
  "Tingkatkan rasa percaya diri dan jangan ragu untuk bertanya ketika mengalami kesulitan dalam belajar.",
  "Jadikan setiap hari sebagai kesempatan untuk memperbaiki diri dan meningkatkan kualitas ibadah serta belajar.",
  "Dengan kedisiplinan dan kesungguhan yang lebih baik, insyaAllah hasil belajar akan semakin meningkat.",
  "Pertahankan semangat belajar dan terus berusaha menjadi santri yang berilmu, berakhlak, dan bermanfaat bagi masyarakat."
];

interface MustahiqSubmenuClientProps {
  slug: string;
  kelas: any;
  students: any[];
  attendanceList: any[];
  gradesList: any[];
  setoranList: any[];
  notesList: any[];
  nadzomList: any[];
  mapelList: any[];
  semesterList?: any[];
  classJadwal?: any[];
  tampilkanRanking: boolean;
  currentUstadzId: string;
  targetList?: any[];
}

export function MustahiqSubmenuClient({
  slug,
  kelas,
  students,
  attendanceList,
  gradesList,
  setoranList,
  notesList,
  nadzomList,
  mapelList,
  semesterList = [],
  classJadwal = [],
  currentUstadzId,
  targetList = []
}: MustahiqSubmenuClientProps) {
  const [notes, setNotes] = useState<any[]>(notesList);
  const [grades, setGrades] = useState<any[]>(gradesList);
  const [setorans, setSetorans] = useState<any[]>(setoranList);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  // Absensi Manual/Bulanan States
  const [bulanHijriah, setBulanHijriah] = useState("");
  const [bulananRecords, setBulananRecords] = useState<{santriId: string, sakit: number, izin: number, alpha: number}[]>([]);
  const [loadingBulanan, setLoadingBulanan] = useState(false);
  const [isEditBulanan, setIsEditBulanan] = useState(false);

  // Fetch Current Hijri Month
  React.useEffect(() => {
    async function fetchHijriMonth() {
      try {
        const res = await fetch("https://api.myquran.com/v2/cal/hijr");
        const json = await res.json() as any;
        if (json.status && json.data?.num?.[5]) {
          const monthIndex = json.data.num[5] - 1;
          if (BULAN_HIJRIAH[monthIndex]) {
            setBulanHijriah(BULAN_HIJRIAH[monthIndex]);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to fetch Hijri date", err);
      }
      setBulanHijriah("Muharram"); // fallback
    }

    if (!bulanHijriah) {
      fetchHijriMonth();
    }
  }, [bulanHijriah]);

  // Semester filter state for printing
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>(() => {
    if (semesterList && semesterList.length > 0) {
      const active = semesterList.find(s => s.aktif);
      return active ? active.id : semesterList[0].id;
    }
    return "";
  });

  // Active semester ID for grade input/editing
  const activeSemesterId = React.useMemo(() => {
    if (semesterList && semesterList.length > 0) {
      const active = semesterList.find(s => s.aktif);
      return active ? active.id : semesterList[0].id;
    }
    return "";
  }, [semesterList]);

  // Edit Mode states for Grade Sheet
  const [isEditingGrades, setIsEditingGrades] = useState(false);
  const [editedGrades, setEditedGrades] = useState<Record<string, string>>({});
  const [selectedGradeType, setSelectedGradeType] = useState<"TAMRIN_1" | "TAMRIN_2" | "UAS">("UAS");

  // Confirmation state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);

  // Notes Form State
  const [noteSantriId, setNoteSantriId] = useState("");
  const [noteText, setNoteText] = useState("");

  // Setoran Form State
  const [setoranSantriId, setSetoranSantriId] = useState("");
  const [setoranNadzomId, setSetoranNadzomId] = useState("");
  const [setoranBaitMulai, setSetoranBaitMulai] = useState("");
  const [setoranJumlahBait, setSetoranJumlahBait] = useState("");
  const [setoranStatus, setSetoranStatus] = useState("Lancar");
  const [deleteSetoranId, setDeleteSetoranId] = useState<string | null>(null);
  const [confirmType, setConfirmType] = useState<"note" | "setoran">("note");

  // Filtered/Mapped nadzoms based on targetList
  const displayedNadzoms = React.useMemo(() => {
    if (targetList && targetList.length > 0) {
      return targetList.map(target => {
        const kit = nadzomList.find(n => n.id === target.kitabNadzomId);
        return {
          id: target.kitabNadzomId,
          namaKitab: kit ? kit.namaKitab : "Kitab",
          jumlahBait: kit ? kit.jumlahBait : 0,
          isTarget: true,
          baitMulai: target.baitMulai,
          baitSelesai: target.baitSelesai
        };
      }).filter(n => n.jumlahBait > 0);
    }
    return nadzomList.map(n => ({
      id: n.id,
      namaKitab: n.namaKitab,
      jumlahBait: n.jumlahBait,
      isTarget: false,
      baitMulai: 1,
      baitSelesai: n.jumlahBait
    }));
  }, [nadzomList, targetList]);

  React.useEffect(() => {
    if (setoranSantriId && setoranNadzomId) {
      const matches = setorans.filter(s => s.santriId === setoranSantriId && s.kitabNadzomId === setoranNadzomId);
      if (matches.length > 0) {
        const highest = matches.reduce((prev, curr) => (prev.baitSelesai > curr.baitSelesai) ? prev : curr);
        setSetoranBaitMulai((highest.baitSelesai + 1).toString());
      } else {
        const target = targetList?.find(t => t.kitabNadzomId === setoranNadzomId);
        setSetoranBaitMulai(target ? target.baitMulai.toString() : "1");
      }
    } else {
      setSetoranBaitMulai("");
    }
  }, [setoranSantriId, setoranNadzomId, setorans, targetList]);

  const lastBaitInfo = React.useMemo(() => {
    if (!setoranSantriId || !setoranNadzomId) return "";
    const matches = setorans.filter(s => s.santriId === setoranSantriId && s.kitabNadzomId === setoranNadzomId);
    const target = targetList?.find(t => t.kitabNadzomId === setoranNadzomId);
    const targetInfo = target ? ` (Target Kelas: Bait ${target.baitMulai} - ${target.baitSelesai})` : "";
    
    if (matches.length > 0) {
      const highest = matches.reduce((prev, curr) => (prev.baitSelesai > curr.baitSelesai) ? prev : curr);
      return `Setoran terakhir: Bait ${highest.baitSelesai} (${highest.status})${targetInfo}`;
    }
    return `Belum ada setoran sebelumnya.${targetInfo}`;
  }, [setoranSantriId, setoranNadzomId, setorans, targetList]);

  // Fetch Bulanan Records
  React.useEffect(() => {
    if (slug === "kehadiran" && activeSemesterId && bulanHijriah) {
      setLoadingBulanan(true);
      getAbsensiBulananRecords(kelas.id, activeSemesterId, bulanHijriah)
        .then(data => {
          // Jika data kosong (belum ada rekap di DB), buat array default dari list santri
          if (data && data.length > 0) {
            setBulananRecords(data);
          } else {
            setBulananRecords(students.map(s => ({
              id: "",
              santriId: s.id,
              semesterId: activeSemesterId,
              bulanHijriah,
              sakit: 0,
              izin: 0,
              alpha: 0
            })));
          }
        })
        .catch(err => console.error("Error fetching bulanan:", err))
        .finally(() => setLoadingBulanan(false));
    }
  }, [slug, kelas.id, activeSemesterId, bulanHijriah, students]);

  const getHijriMonthName = (dateString: string) => {
    try {
      const d = new Date(dateString);
      const formatter = new Intl.DateTimeFormat('id-TN-u-ca-islamic', { month: 'long' });
      const rawMonth = formatter.format(d).toLowerCase();
      
      if (rawMonth.includes("muharam")) return "Muharram";
      if (rawMonth.includes("safar")) return "Safar";
      if (rawMonth.includes("rabiulawal")) return "Rabiul Awal";
      if (rawMonth.includes("rabiulakhir")) return "Rabiul Akhir";
      if (rawMonth.includes("jumadilawal")) return "Jumadil Awal";
      if (rawMonth.includes("jumadilakhir")) return "Jumadil Akhir";
      if (rawMonth.includes("rajab")) return "Rajab";
      if (rawMonth.includes("syakban") || rawMonth.includes("sya'ban")) return "Sya'ban";
      if (rawMonth.includes("ramadan")) return "Ramadhan";
      if (rawMonth.includes("syawal")) return "Syawal";
      if (rawMonth.includes("zulkaidah") || rawMonth.includes("dzulqa")) return "Dzulqa'dah";
      if (rawMonth.includes("zulhijah") || rawMonth.includes("dzulhi")) return "Dzulhijjah";
    } catch {
      // Ignored
    }
    return "";
  };

  const handleAutoSyncBulanan = () => {
    if (!bulanHijriah) {
      toast.error("Pilih bulan Hijriyyah terlebih dahulu");
      return;
    }
    
    setBulananRecords(prev => prev.map(record => {
      // Find all daily attendance for this student that falls into the selected Hijri month
      const studentAbs = attendanceList.filter(a => 
        a.santriId === record.santriId && 
        getHijriMonthName(a.tanggal) === bulanHijriah
      );
      
      const izin = studentAbs.filter(a => a.status === "Izin").length;
      const alpha = studentAbs.filter(a => a.status === "Alpha").length;
      
      // Keep Sakit as is, but update Izin and Alpha
      return {
        ...record,
        izin,
        alpha
      };
    }));
    
    toast.success(`Data Izin & Alpha disinkronisasi dari catatan harian bulan ${bulanHijriah}.`);
  };

  const handleBulananChange = (studentId: string, field: "sakit" | "izin" | "alpha", value: string) => {
    const numValue = parseInt(value) || 0;
    setBulananRecords(prev => prev.map(r => 
      r.santriId === studentId ? { ...r, [field]: numValue } : r
    ));
  };

  const handleSaveBulanan = async () => {
    if (loadingBulanan) return;
    startTransition(async () => {
      try {
        const res = await saveAbsensiBulananRecords(kelas.id, activeSemesterId, bulanHijriah, bulananRecords);
        if (res.success) {
          toast.success("Rekap bulanan berhasil disimpan");
          setIsEditBulanan(false);
        } else {
          toast.error(res.error || "Gagal menyimpan rekap bulanan");
        }
      } catch {
        toast.error("Terjadi kesalahan sistem");
      }
    });
  };

  // 1. Calculate Attendance summary for each student
  const getAttendanceSummary = (studentId: string) => {
    const studentAbs = attendanceList.filter(a => a.santriId === studentId);
    const masuk = studentAbs.filter(a => a.status === "Masuk").length;
    const terlambat = studentAbs.filter(a => a.status === "Terlambat").length;
    const izin = studentAbs.filter(a => a.status === "Izin").length;
    const alpha = studentAbs.filter(a => a.status === "Alpha").length;
    return { masuk, terlambat, izin, alpha, total: studentAbs.length };
  };

  // Get active subjects for the class (must be declared before studentsGrades)
  const classSubjects = React.useMemo(() => {
    const subjectIds = new Set<string>();
    if (classJadwal && classJadwal.length > 0) {
      classJadwal.forEach((j: any) => subjectIds.add(j.kitabMapelId));
    } else {
      grades.filter(g => g.semesterId === activeSemesterId).forEach((g: any) => {
        if (students.some(s => s.id === g.santriId)) {
          subjectIds.add(g.kitabMapelId);
        }
      });
    }
    const list = Array.from(subjectIds)
      .map(id => mapelList.find(m => m.id === id))
      .filter(Boolean);
    if (list.length === 0) {
      return mapelList.slice(0, 3);
    }
    return list;
  }, [classJadwal, grades, mapelList, students, activeSemesterId]);

  // 2. Calculate grades and rankings based on Nilai Akhir (average of Tamrin and UAS per subject)
  const studentsGrades = students.map(s => {
    let totalAkhir = 0;
    let subjectCount = 0;
    
    classSubjects.forEach(sub => {
      // Find Tamrin grade
      const tamrinGrade = grades.find(g => 
        g.santriId === s.id && 
        g.kitabMapelId === sub.id && 
        g.semesterId === selectedSemesterId && 
        g.jenis === "TAMRIN"
      );
      // Find UAS grade
      const uasGrade = grades.find(g => 
        g.santriId === s.id && 
        g.kitabMapelId === sub.id && 
        g.semesterId === selectedSemesterId && 
        (g.jenis === "UAS" || !g.jenis)
      );
      
      const tamrin = tamrinGrade ? tamrinGrade.nilai : null;
      const uas = uasGrade ? uasGrade.nilai : null;
      
      let akhir: number | null = null;
      if (tamrin !== null && uas !== null) {
        akhir = (tamrin + uas) / 2;
      } else if (tamrin !== null) {
        akhir = tamrin;
      } else if (uas !== null) {
        akhir = uas;
      }
      
      if (akhir !== null) {
        totalAkhir += akhir;
        subjectCount++;
      }
    });

    const avg = subjectCount > 0 ? parseFloat((totalAkhir / subjectCount).toFixed(1)) : 0;
    
    return {
      student: s,
      average: avg,
      count: subjectCount
    };
  });


  // Helpers for combined grades
  const getSubjectGrade = (studentId: string, subjectId: string, jenis: "TAMRIN_1" | "TAMRIN_2" | "UAS") => {
    if (isEditingGrades && selectedGradeType === jenis) {
      const valStr = editedGrades[`${studentId}_${subjectId}`];
      return (valStr !== undefined && valStr !== "") ? parseFloat(valStr) : null;
    }
    const existing = grades.find(
      g => g.santriId === studentId && 
           g.kitabMapelId === subjectId && 
           g.semesterId === selectedSemesterId && 
           (g.jenis === jenis || (!g.jenis && jenis === "UAS") || (g.jenis === "TAMRIN" && jenis === "TAMRIN_1"))
    );
    return existing ? existing.nilai : null;
  };

  const getSubjectAkhir = (studentId: string, subjectId: string) => {
    const tamrin1 = getSubjectGrade(studentId, subjectId, "TAMRIN_1");
    const tamrin2 = getSubjectGrade(studentId, subjectId, "TAMRIN_2");
    
    let tamrin: number | null = null;
    if (tamrin1 !== null && tamrin2 !== null) {
      tamrin = parseFloat(((tamrin1 + tamrin2) / 2).toFixed(1));
    } else if (tamrin1 !== null) {
      tamrin = tamrin1;
    } else if (tamrin2 !== null) {
      tamrin = tamrin2;
    }

    const uas = getSubjectGrade(studentId, subjectId, "UAS");
    if (tamrin !== null && uas !== null) {
      return (tamrin + uas) / 2;
    }
    if (tamrin !== null) return tamrin;
    if (uas !== null) return uas;
    return null;
  };

  // Edit actions for Grade Sheet
  const handleStartGradeEdit = () => {
    const initial: Record<string, string> = {};
    students.forEach(s => {
      classSubjects.forEach(sub => {
        const key = `${s.id}_${sub.id}`;
        const existing = grades.find(g => 
          g.santriId === s.id && 
          g.kitabMapelId === sub.id && 
          g.semesterId === selectedSemesterId && 
          (g.jenis === selectedGradeType || (!g.jenis && selectedGradeType === "UAS"))
        );
        initial[key] = existing ? String(existing.nilai) : "";
      });
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
    const gradeUpdates: { santriId: string; kitabMapelId: string; nilai: number }[] = [];
    
    students.forEach(s => {
      classSubjects.forEach(sub => {
        const key = `${s.id}_${sub.id}`;
        const valStr = editedGrades[key];
        if (valStr !== undefined && valStr !== "") {
          const num = parseFloat(valStr);
          if (!isNaN(num)) {
            gradeUpdates.push({
              santriId: s.id,
              kitabMapelId: sub.id,
              nilai: num
            });
          }
        }
      });
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
        
        const updatedGrades = [...grades];
        gradeUpdates.forEach(up => {
          const idx = updatedGrades.findIndex(g => 
            g.santriId === up.santriId && 
            g.kitabMapelId === up.kitabMapelId && 
            g.semesterId === selectedSemesterId &&
            (g.jenis === selectedGradeType || (!g.jenis && selectedGradeType === "UAS") || (g.jenis === "TAMRIN" && selectedGradeType === "TAMRIN_1"))
          );
          if (idx !== -1) {
            updatedGrades[idx] = { ...updatedGrades[idx], nilai: up.nilai };
          } else {
            updatedGrades.push({
              id: "TEMP-" + Math.random().toString(),
              santriId: up.santriId,
              kitabMapelId: up.kitabMapelId,
              nilai: up.nilai,
              semesterId: selectedSemesterId,
              jenis: selectedGradeType
            });
          }
        });
        setGrades(updatedGrades);
        setIsEditingGrades(false);
      }
    });
  };

  const getLiveAverage = (studentId: string) => {
    let total = 0;
    let count = 0;
    classSubjects.forEach(sub => {
      const akhir = getSubjectAkhir(studentId, sub.id);
      if (akhir !== null) {
        total += akhir;
        count++;
      }
    });
    return count > 0 ? parseFloat((total / count).toFixed(1)) : 0;
  };

  // 3. Calculate Nadzom Progress per student
  const getNadzomProgress = (studentId: string) => {
    const studentSetorans = setorans.filter(set => set.santriId === studentId && set.semesterId === selectedSemesterId);
    
    // Find highest setoran per nadzom
    const highestSetorans: Record<string, number> = {};
    for (const set of studentSetorans) {
      if (!highestSetorans[set.kitabNadzomId] || highestSetorans[set.kitabNadzomId] < set.baitSelesai) {
        highestSetorans[set.kitabNadzomId] = set.baitSelesai;
      }
    }
    
    // Calculate total progress pct out of active nadzoms
    let progressStr = "Belum mulai setoran";
    let pct = 0;
    
    if (Object.keys(highestSetorans).length > 0) {
      const parts: string[] = [];
      let totalP = 0;
      let count = 0;
      for (const [nzmId, val] of Object.entries(highestSetorans)) {
        const kit = nadzomList.find(n => n.id === nzmId);
        if (kit) {
          parts.push(`${kit.namaKitab}: ${val}/${kit.jumlahBait} bait`);
          totalP += (val / kit.jumlahBait);
          count++;
        }
      }
      progressStr = parts.join(", ");
      pct = Math.round((totalP / count) * 100);
    }
    
    return { progressStr, pct };
  };

  const handleGenerateCatatan = () => {
    let newNote = noteText;
    let attempts = 0;
    while (newNote === noteText && attempts < 10) {
      const randomIndex = Math.floor(Math.random() * CATATAN_TEMPLATES.length);
      newNote = CATATAN_TEMPLATES[randomIndex];
      attempts++;
    }
    setNoteText(newNote);
  };

  // Notes Form Submit
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteSantriId || !noteText) {
      toast.error("Peringatan", { description: "Isi semua kolom bimbingan." });
      return;
    }
    startTransition(async () => {
      const res = await apiPost("createCatatan", {
        data: {
          santriId: noteSantriId,
          catatanUstadz: noteText
        }
      });

      if (res.error) {
        toast.error("Gagal", { description: res.error });
      } else {
        toast.success("Berhasil", { description: res.message });
        setDialogOpen(false);
        setNotes([{
          id: Math.random().toString(),
          santriId: noteSantriId,
          catatanUstadz: noteText,
          tanggal: new Date().toISOString().split("T")[0]
        }, ...notes]);
        setNoteText("");
      }
    });
  };

  const handleDeleteNote = (id: string) => {
    setDeleteNoteId(id);
    setConfirmType("note");
    setConfirmOpen(true);
  };

  const handleConfirmDeleteNote = () => {
    if (!deleteNoteId) return;
    startTransition(async () => {
      const res = await apiPost("deleteCatatan", { id: deleteNoteId });
      if (res.error) {
        toast.error("Gagal", { description: res.error });
      } else {
        toast.success("Berhasil", { description: res.message });
        setNotes(notes.filter(n => n.id !== deleteNoteId));
      }
    });
  };

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
        data: {
          santriId: setoranSantriId,
          kitabNadzomId: setoranNadzomId,
          baitMulai: baitMulaiNum,
          baitSelesai: baitSelesaiNum,
          status: setoranStatus
        }
      });
      if (res.error) {
        toast.error("Gagal", { description: res.error });
      } else {
        toast.success("Berhasil", { description: res.message });
        setDialogOpen(false);
        setSetorans([{
          id: "TEMP-" + Math.random().toString(),
          santriId: setoranSantriId,
          kitabNadzomId: setoranNadzomId,
          baitMulai: baitMulaiNum,
          baitSelesai: baitSelesaiNum,
          status: setoranStatus,
          tanggal: new Date().toISOString().split("T")[0],
          ustadzId: currentUstadzId,
          semesterId: selectedSemesterId
        }, ...setorans]);
        setSetoranSantriId("");
        setSetoranNadzomId("");
        setSetoranBaitMulai("");
        setSetoranJumlahBait("");
      }
    });
  };

  const handleDeleteSetoran = (id: string) => {
    setDeleteSetoranId(id);
    setConfirmType("setoran");
    setConfirmOpen(true);
  };

  const handleConfirmDeleteSetoran = () => {
    if (!deleteSetoranId) return;
    startTransition(async () => {
      const res = await apiPost("deleteSetoranNadzom", { id: deleteSetoranId });
      if (res.error) {
        toast.error("Gagal", { description: res.error });
      } else {
        toast.success("Berhasil", { description: res.message });
        setSetorans(setorans.filter(s => s.id !== deleteSetoranId));
      }
    });
  };

  const handleConfirmDelete = () => {
    if (confirmType === "note") {
      handleConfirmDeleteNote();
    } else {
      handleConfirmDeleteSetoran();
    }
  };

  // Header display details
  const getHeaderDetails = () => {
    switch (slug) {
      case "kehadiran": return { title: "Kehadiran Kelas " + kelas.namaKelas, desc: "Monitor data absensi santri di kelas perwalian Anda.", icon: Users };
      case "nilai": return { title: "Nilai Akademik Kelas " + kelas.namaKelas, desc: "Rata-rata kumulatif dan peringkat kelas.", icon: GraduationCap };
      case "hafalan": return { title: "Setoran Hafalan Nadzom", desc: "Monitor kemajuan progres hafalan bait nadzom per anak.", icon: BookOpen };
      case "catatan": return { title: "Catatan Perkembangan", desc: "Log pembinaan sikap, akhlak, dan konseling santri.", icon: ClipboardList };
      case "raport": return { title: "Evaluasi & Cetak Raport", desc: "Pemeriksaan data akademik dan pencetakan raport santri.", icon: FileCheck };
      default: return { title: "Mustahiq Wali Kelas", desc: "Manajemen kelas perwalian.", icon: Users };
    }
  };

  const details = getHeaderDetails();
  const Icon = details.icon;

  const filteredStudents = students.filter(s => 
    s.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.nis.includes(searchQuery)
  );

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="page-banner">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-gradient flex items-center justify-center text-white shadow-md shrink-0">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="page-title text-glow-gold leading-tight">{details.title}</h1>
            <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">{details.desc}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(slug === "catatan" || slug === "hafalan") && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              {slug === "catatan" ? (
                <DialogTrigger className="bg-blue-gradient text-white rounded-xl font-bold flex items-center gap-2 py-2.5 px-3 text-sm shadow-md shadow-primary/20 cursor-pointer min-h-[40px]">
                  <PlusCircle className="h-4 w-4" /> Catat Pembinaan
                </DialogTrigger>
              ) : (
                <DialogTrigger className="bg-blue-gradient text-white rounded-xl font-bold flex items-center gap-2 py-2.5 px-3 text-sm shadow-md shadow-primary/20 cursor-pointer min-h-[40px]">
                  <PlusCircle className="h-4 w-4" /> Catat Setoran
                </DialogTrigger>
              )}
            <DialogContent className="max-w-md bg-card/95 backdrop-blur-xl border-border/40 rounded-2xl">
              {slug === "catatan" ? (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-glow-gold">Tambah Catatan Pembinaan</DialogTitle>
                    <DialogDescription>Tulis perkembangan evaluasi santri secara spesifik.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddNote} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="n-santri">Pilih Santri</Label>
                      <Select value={noteSantriId} onValueChange={(val) => setNoteSantriId(val || "")}>
                        <SelectTrigger className="bg-card/50 min-h-[44px]">
                          <SelectValue placeholder="Pilih Santri">
                            {noteSantriId ? students.find(s => s.id === noteSantriId)?.namaLengkap : undefined}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {students.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.namaLengkap}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="n-text">Catatan Evaluasi / Sikap</Label>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={handleGenerateCatatan}
                          className="h-7 text-[11px] font-bold text-primary hover:text-primary hover:bg-primary/10 cursor-pointer px-2"
                        >
                          {noteText ? "🔄 Generate Lagi" : "✨ Buat Otomatis"}
                        </Button>
                      </div>
                      <Input id="n-text" required value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Contoh: Disiplin bagus, antusias dalam belajar Jurumiyah" className="bg-card/50 min-h-[44px]" />
                    </div>
                    <DialogFooter className="pt-2">
                      <Button type="submit" disabled={isPending || !noteSantriId} className="bg-blue-gradient text-white font-bold w-full rounded-xl cursor-pointer min-h-[44px]">Simpan Catatan</Button>
                    </DialogFooter>
                  </form>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-glow-gold">Catat Setoran Nadzom</DialogTitle>
                    <DialogDescription>Input perkembangan hafalan bait nadzom santri per pertemuan.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddSetoran} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="h-santri">Pilih Santri</Label>
                      <Select value={setoranSantriId} onValueChange={(val) => setSetoranSantriId(val || "")}>
                        <SelectTrigger className="bg-card/50 min-h-[44px]">
                          <SelectValue placeholder="Pilih Santri">
                            {setoranSantriId ? students.find(s => s.id === setoranSantriId)?.namaLengkap : undefined}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {students.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.namaLengkap}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="h-nadzom">Kitab Nadzom</Label>
                      <Select value={setoranNadzomId} onValueChange={(val) => setSetoranNadzomId(val || "")}>
                        <SelectTrigger className="bg-card/50 min-h-[44px]">
                          <SelectValue placeholder="Pilih Kitab Nadzom">
                            {setoranNadzomId ? (() => {
                              const n = displayedNadzoms.find(n => n.id === setoranNadzomId);
                              return n ? `${n.namaKitab} ${n.isTarget ? `(Target: Bait ${n.baitMulai} s.d ${n.baitSelesai})` : `(Total: ${n.jumlahBait} Bait)`}` : undefined;
                            })() : undefined}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {displayedNadzoms.map(n => (
                            <SelectItem key={n.id} value={n.id}>
                              {n.namaKitab} {n.isTarget ? `(Target: Bait ${n.baitMulai} s.d ${n.baitSelesai})` : `(Total: ${n.jumlahBait} Bait)`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {lastBaitInfo && (
                      <div className="bg-blue-50/50 text-blue-700 border border-blue-100 rounded-xl p-3 text-xs font-semibold leading-relaxed">
                        💡 {lastBaitInfo}
                      </div>
                    )}
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="h-mulai">Bait Mulai</Label>
                          <Input id="h-mulai" type="number" required value={setoranBaitMulai} onChange={(e) => setSetoranBaitMulai(e.target.value)} placeholder="1" className="bg-card/50 min-h-[44px]" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="h-jumlah">Jumlah Setoran Baru</Label>
                          <Input id="h-jumlah" type="number" required value={setoranJumlahBait} onChange={(e) => setSetoranJumlahBait(e.target.value)} placeholder="10" className="bg-card/50 min-h-[44px]" />
                        </div>
                      </div>
                      <p className="text-[11px] italic bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 p-2 rounded-lg border border-amber-200 dark:border-amber-900/50">
                        💡 <strong>Penting:</strong> Input jumlah bait yang <u className="font-bold">baru disetor hari ini</u>, bukan total keseluruhan. Sistem akan otomatis menghitung posisi akhir.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="h-status">Kualitas Hafalan</Label>
                      <Select value={setoranStatus} onValueChange={(val) => setSetoranStatus(val || "Lancar")}>
                        <SelectTrigger className="bg-card/50 min-h-[44px]">
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
                </>
              )}
            </DialogContent>
          </Dialog>
          )}

          {/* Search filter for students */}
          {slug !== "catatan" && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cari nama santri..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-card/60 min-h-[40px] rounded-xl text-sm w-full sm:w-[220px]"
              />
            </div>
          )}
        </div>
      </div>

      {/* VIEW CASES */}

      {/* 1. Kehadiran */}
      {slug === "kehadiran" && (
        <Tabs defaultValue="harian" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="harian" className="font-bold">Absen Harian</TabsTrigger>
            <TabsTrigger value="bulanan" className="font-bold">Rekap Bulanan</TabsTrigger>
          </TabsList>
          
          <TabsContent value="harian">
            <Card className="glass-panel border-white/20">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/50 pb-4 mb-4 gap-4">
                <div>
                  <CardTitle className="text-base font-bold">Log Absensi Harian</CardTitle>
                  <CardDescription>Ringkasan kehadiran santri pada kelas ini</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-bold w-[44px]">Foto</TableHead>
                        <TableHead className="font-bold">NIS</TableHead>
                        <TableHead className="font-bold">Nama Lengkap</TableHead>
                        <TableHead className="font-bold text-center">Masuk</TableHead>
                        <TableHead className="font-bold text-center">Terlambat</TableHead>
                        <TableHead className="font-bold text-center">Izin</TableHead>
                        <TableHead className="font-bold text-center">Alpha</TableHead>
                        <TableHead className="font-bold text-center">Tingkat Hadir</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map(s => {
                        const abs = getAttendanceSummary(s.id);
                        const pct = abs.total > 0 ? Math.round(((abs.masuk + abs.terlambat) / abs.total) * 100) : 100;
                        return (
                          <TableRow key={s.id}>
                            <TableCell className="py-2">
                              <div className="h-9 w-9 rounded-full border border-primary/20 bg-muted overflow-hidden flex items-center justify-center shadow-sm">
                                {s.fotoUrl ? (
                                  <img src={s.fotoUrl} alt={s.namaLengkap} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold text-xs">
                                    {s.namaLengkap.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{s.nis}</TableCell>
                            <TableCell className="font-bold text-sm">{s.namaLengkap}</TableCell>
                            <TableCell className="text-center font-bold text-green-600">{abs.masuk}</TableCell>
                            <TableCell className="text-center font-bold text-amber-500">{abs.terlambat}</TableCell>
                            <TableCell className="text-center font-bold text-blue-600">{abs.izin}</TableCell>
                            <TableCell className="text-center font-bold text-red-500">{abs.alpha}</TableCell>
                            <TableCell className="text-center font-black">
                              <Badge className={pct > 85 ? "bg-green-500 text-white font-bold" : pct > 75 ? "bg-yellow-500 text-black font-bold" : "bg-red-500 text-white font-bold"}>
                                {pct}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View (Responsive layout) */}
                <div className="block md:hidden divide-y divide-muted/10">
                  {filteredStudents.map(s => {
                    const abs = getAttendanceSummary(s.id);
                    const pct = abs.total > 0 ? Math.round(((abs.masuk + abs.terlambat) / abs.total) * 100) : 100;
                    return (
                      <div key={s.id} className="p-4 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-full border border-primary/20 bg-muted overflow-hidden shrink-0 flex items-center justify-center shadow-sm">
                              {s.fotoUrl ? (
                                <img src={s.fotoUrl} alt={s.namaLengkap} className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold text-xs">
                                  {s.namaLengkap.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <h4 className="font-bold text-sm">{s.namaLengkap}</h4>
                          </div>
                          <Badge className={pct > 85 ? "bg-green-500 text-white font-bold" : pct > 75 ? "bg-yellow-500 text-black font-bold" : "bg-red-500 text-white font-bold"}>
                            Hadir: {pct}%
                          </Badge>
                        </div>
                        <div className="grid grid-cols-4 gap-2 bg-muted/40 p-2 rounded-xl border border-border/40 text-center text-xs">
                          <div>
                            <div className="font-bold text-green-700">{abs.masuk}</div>
                            <div className="text-[10px] text-muted-foreground font-semibold">Masuk</div>
                          </div>
                          <div>
                            <div className="font-bold text-amber-600">{abs.terlambat}</div>
                            <div className="text-[10px] text-muted-foreground font-semibold">Late</div>
                          </div>
                          <div>
                            <div className="font-bold text-blue-700">{abs.izin}</div>
                            <div className="text-[10px] text-muted-foreground font-semibold">Izin</div>
                          </div>
                          <div>
                            <div className="font-bold text-red-600">{abs.alpha}</div>
                            <div className="text-[10px] text-muted-foreground font-semibold">Alpha</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulanan">
            <Card className="glass-panel border-white/20">
              <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold">Rekap Absensi Bulanan</CardTitle>
                  <CardDescription>Masukkan jumlah absensi santri per bulan</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <Select value={bulanHijriah} onValueChange={(val) => setBulanHijriah(val || "")}>
                    <SelectTrigger className="w-full sm:w-[160px] bg-card/80 backdrop-blur-md min-h-[40px] rounded-xl font-bold border-indigo-200 hover:border-indigo-400 transition-colors shadow-sm focus:ring-2 focus:ring-indigo-500/20">
                      <SelectValue placeholder="Pilih Bulan" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-indigo-100 shadow-xl">
                      {BULAN_HIJRIAH.map(b => (
                        <SelectItem key={b} value={b} className="font-bold cursor-pointer rounded-lg hover:bg-indigo-50 focus:bg-indigo-50">{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    {!isEditBulanan ? (
                      <Button onClick={() => setIsEditBulanan(true)} variant="outline" className="flex-1 sm:flex-none border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 font-bold rounded-xl px-4 h-10 shadow-sm cursor-pointer transition-all hover:scale-[1.02] active:scale-95">
                        <PlusCircle className="mr-1.5 h-4 w-4" /> Input Absensi Bulanan
                      </Button>
                    ) : (
                      <>
                        <Button onClick={() => setIsEditBulanan(false)} variant="ghost" className="h-10 px-4 rounded-xl font-bold cursor-pointer hover:bg-muted">Batal</Button>
                        <Button onClick={handleAutoSyncBulanan} disabled={loadingBulanan || isPending || !bulanHijriah} variant="outline" className="flex-1 sm:flex-none border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 font-bold rounded-xl px-4 h-10 shadow-sm cursor-pointer transition-all hover:scale-[1.02] active:scale-95">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
                          Sinkron Otomatis
                        </Button>
                        <Button onClick={handleSaveBulanan} disabled={loadingBulanan || isPending} className="flex-1 sm:flex-none bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl px-6 h-10 shadow-md shadow-indigo-500/20 cursor-pointer hover:shadow-indigo-500/40 transition-all hover:scale-[1.02] active:scale-95 border-0">
                          Simpan Rekap
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Desktop View */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-bold">NIS</TableHead>
                        <TableHead className="font-bold">Nama Lengkap</TableHead>
                        <TableHead className="font-bold text-center w-24">Sakit</TableHead>
                        <TableHead className="font-bold text-center w-24">Izin</TableHead>
                        <TableHead className="font-bold text-center w-24">Alpha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingBulanan ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-8 font-bold text-muted-foreground animate-pulse">Memuat data...</TableCell></TableRow>
                      ) : bulananRecords.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-8 font-bold text-muted-foreground">Belum ada data santri.</TableCell></TableRow>
                      ) : (
                        bulananRecords.filter(r => filteredStudents.some(s => s.id === r.santriId)).map(record => {
                          const s = filteredStudents.find(s => s.id === record.santriId);
                          if (!s) return null;
                          return (
                            <TableRow key={record.santriId}>
                              <TableCell className="font-mono text-xs">{s.nis}</TableCell>
                              <TableCell className="font-bold text-sm">{s.namaLengkap}</TableCell>
                              <TableCell className="text-center">
                                <Input disabled={!isEditBulanan} type="number" min="0" value={record.sakit || ""} onChange={(e) => handleBulananChange(record.santriId, "sakit", e.target.value)} className="w-16 mx-auto text-center font-bold bg-card/50 disabled:opacity-50" />
                              </TableCell>
                              <TableCell className="text-center">
                                <Input disabled={!isEditBulanan} type="number" min="0" value={record.izin || ""} onChange={(e) => handleBulananChange(record.santriId, "izin", e.target.value)} className="w-16 mx-auto text-center font-bold bg-card/50 disabled:opacity-50" />
                              </TableCell>
                              <TableCell className="text-center">
                                <Input disabled={!isEditBulanan} type="number" min="0" value={record.alpha || ""} onChange={(e) => handleBulananChange(record.santriId, "alpha", e.target.value)} className="w-16 mx-auto text-center font-bold bg-card/50 disabled:opacity-50" />
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
                {/* Mobile View */}
                <div className="block md:hidden divide-y divide-muted/10">
                  {loadingBulanan ? (
                    <div className="p-8 text-center font-bold text-muted-foreground animate-pulse">Memuat data...</div>
                  ) : bulananRecords.length === 0 ? (
                    <div className="p-8 text-center font-bold text-muted-foreground">Belum ada data santri.</div>
                  ) : (
                    bulananRecords.filter(r => filteredStudents.some(s => s.id === r.santriId)).map(record => {
                      const s = filteredStudents.find(s => s.id === record.santriId);
                      if (!s) return null;
                      return (
                        <div key={record.santriId} className="p-4 flex flex-col gap-3">
                          <h4 className="font-bold text-sm">{s.namaLengkap} <span className="text-xs text-muted-foreground font-mono ml-2">{s.nis}</span></h4>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground font-semibold flex items-center justify-center">Sakit</Label>
                              <Input disabled={!isEditBulanan} type="number" min="0" value={record.sakit || ""} onChange={(e) => handleBulananChange(record.santriId, "sakit", e.target.value)} className="text-center font-bold h-9 bg-card/50 disabled:opacity-50" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground font-semibold flex items-center justify-center">Izin</Label>
                              <Input disabled={!isEditBulanan} type="number" min="0" value={record.izin || ""} onChange={(e) => handleBulananChange(record.santriId, "izin", e.target.value)} className="text-center font-bold h-9 bg-card/50 disabled:opacity-50" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground font-semibold flex items-center justify-center">Alpha</Label>
                              <Input disabled={!isEditBulanan} type="number" min="0" value={record.alpha || ""} onChange={(e) => handleBulananChange(record.santriId, "alpha", e.target.value)} className="text-center font-bold h-9 bg-card/50 disabled:opacity-50" />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* 2. Nilai Kelas */}
      {slug === "nilai" && (
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card/50 backdrop-blur-md p-4 rounded-xl border border-border/80 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Category Toggle */}
              <div className="flex items-center gap-2 bg-muted/80 p-1 rounded-xl self-start border border-border/40">
                <button
                  disabled={isEditingGrades}
                  onClick={() => setSelectedGradeType("TAMRIN_1")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedGradeType === "TAMRIN_1"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground disabled:opacity-50 cursor-pointer"
                  }`}
                >
                  Tamrin 1
                </button>
                <button
                  disabled={isEditingGrades}
                  onClick={() => setSelectedGradeType("TAMRIN_2")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedGradeType === "TAMRIN_2"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground disabled:opacity-50 cursor-pointer"
                  }`}
                >
                  Tamrin 2
                </button>
                <button
                  disabled={isEditingGrades}
                  onClick={() => setSelectedGradeType("UAS")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedGradeType === "UAS"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground disabled:opacity-50 cursor-pointer"
                  }`}
                >
                  UAS (Semester)
                </button>
              </div>

              {/* Semester Dropdown */}
              <div className="flex items-center gap-2">
                <Label htmlFor="semester-filter" className="text-xs font-bold text-muted-foreground uppercase shrink-0">Semester:</Label>
                <Select 
                  disabled={isEditingGrades}
                  value={selectedSemesterId} 
                  onValueChange={(val) => setSelectedSemesterId(val || "")}
                >
                  <SelectTrigger className="w-[180px] bg-card min-h-[40px] text-xs font-semibold border-border">
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

              <div className="text-xs font-semibold text-muted-foreground">
                {isEditingGrades ? (
                  <span className="text-amber-600 flex items-center gap-1.5 animate-pulse font-bold">
                    ⚠️ Mode Edit Aktif ({selectedGradeType === "UAS" ? "UAS" : (selectedGradeType === "TAMRIN_1" ? "Tamrin 1" : "Tamrin 2")})
                  </span>
                ) : (
                  <span>Pratinjau Nilai {selectedGradeType === "UAS" ? "UAS" : (selectedGradeType === "TAMRIN_1" ? "Tamrin 1" : "Tamrin 2")}. Rata-rata dihitung dari gabungan.</span>
                )}
              </div>
            </div>
            <div className="flex gap-2 self-end lg:self-auto">
              {!isEditingGrades ? (
                <Button 
                  onClick={handleStartGradeEdit}
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
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold w-[40px] text-center">No</TableHead>
                      <TableHead className="font-bold w-[44px]">Foto</TableHead>
                      <TableHead className="font-bold min-w-[180px]">Nama Lengkap</TableHead>
                      {classSubjects.map((sub: any) => (
                        <TableHead key={sub.id} className="font-bold text-center min-w-[120px] uppercase">
                          {sub.namaKitabMapel}
                        </TableHead>
                      ))}
                      <TableHead className="font-bold text-center w-[100px]">Rata-rata</TableHead>
                      <TableHead className="font-bold text-center w-[120px]">Raport</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((s, idx) => {
                      const avg = getLiveAverage(s.id);
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="text-center font-semibold text-xs">{idx + 1}</TableCell>
                          <TableCell className="py-2">
                            <div className="h-9 w-9 rounded-full border border-primary/20 bg-muted overflow-hidden flex items-center justify-center shadow-sm">
                              {s.fotoUrl ? (
                                <img src={s.fotoUrl} alt={s.namaLengkap} className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold text-xs">
                                  {s.namaLengkap.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-bold text-sm text-slate-800">{s.namaLengkap}</TableCell>
                          {classSubjects.map((sub: any) => {
                            const key = `${s.id}_${sub.id}`;
                            const val = isEditingGrades ? (editedGrades[key] || "") : (() => {
                              const existing = grades.find(g => 
                                g.santriId === s.id && 
                                g.kitabMapelId === sub.id && 
                                g.semesterId === selectedSemesterId &&
                                (g.jenis === selectedGradeType || (!g.jenis && selectedGradeType === "UAS") || (g.jenis === "TAMRIN" && selectedGradeType === "TAMRIN_1"))
                              );
                              return existing ? String(existing.nilai) : "-";
                            })();
                            return (
                              <TableCell key={sub.id} className="text-center p-2">
                                {isEditingGrades ? (
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="w-20 mx-auto text-center font-bold bg-card min-h-[36px]"
                                    value={val}
                                    onChange={(e) => handleGradeValChange(s.id, sub.id, e.target.value)}
                                    placeholder="-"
                                  />
                                ) : (
                                  <span className="font-bold text-foreground/80">{val}</span>
                                )}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center">
                            <Badge className="bg-blue-600 text-white font-black text-xs py-1 px-2.5">
                              {avg}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Link href={`/dashboard/mustahiq/raport/${s.id}?semesterId=${selectedSemesterId}`}>
                              <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs font-bold gap-1 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 shadow-xs">
                                <FileText className="h-3.5 w-3.5" /> Raport
                              </Button>
                            </Link>
                          </TableCell>
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

      {/* 3. Hafalan Nadzom */}
      {slug === "hafalan" && (
        <Card className="glass-panel border-white/20">
          <CardContent className="p-0">
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold w-[44px]">Foto</TableHead>
                    <TableHead className="font-bold w-[120px]">NIS</TableHead>
                    <TableHead className="font-bold">Nama Lengkap</TableHead>
                    <TableHead className="font-bold">Rincian Capaian Setoran</TableHead>
                    <TableHead className="font-bold">Progres Akumulatif</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map(s => {
                    const progress = getNadzomProgress(s.id);
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="py-2">
                          <div className="h-9 w-9 rounded-full border border-primary/20 bg-muted overflow-hidden flex items-center justify-center shadow-sm">
                            {s.fotoUrl ? (
                              <img src={s.fotoUrl} alt={s.namaLengkap} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold text-xs">
                                {s.namaLengkap.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{s.nis}</TableCell>
                        <TableCell className="font-bold text-sm">{s.namaLengkap}</TableCell>
                        <TableCell className="text-xs text-muted-foreground font-semibold leading-relaxed max-w-[200px] truncate">{progress.progressStr}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-[120px] bg-gray-200 h-2 rounded-full overflow-hidden flex">
                              <div className="h-full bg-blue-600" style={{ width: `${progress.pct}%` }} />
                            </div>
                            <span className="text-[10px] font-bold text-muted-foreground">{progress.pct}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View (Responsive layout) */}
            <div className="block md:hidden divide-y divide-muted/10">
              {filteredStudents.map(s => {
                const progress = getNadzomProgress(s.id);
                return (
                  <div key={s.id} className="p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-full border border-primary/20 bg-muted overflow-hidden shrink-0 flex items-center justify-center shadow-sm">
                          {s.fotoUrl ? (
                            <img src={s.fotoUrl} alt={s.namaLengkap} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold text-xs">
                              {s.namaLengkap.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <h4 className="font-bold text-sm">{s.namaLengkap}</h4>
                      </div>
                      <span className="text-[10px] font-black text-blue-600 bg-blue-50/50 border border-blue-100 rounded-full px-2 py-0.5">{progress.pct}% Progress</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{progress.progressStr}</p>
                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden flex mt-1">
                      <div className="h-full bg-blue-600" style={{ width: `${progress.pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Riwayat Setoran Terbaru */}
      {slug === "hafalan" && (
        <Card className="glass-panel border-white/20 mt-6">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800">Riwayat Setoran Terbaru</CardTitle>
            <CardDescription>Log pencatatan setoran bait nadzom santri di kelas Anda.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Tanggal</TableHead>
                    <TableHead className="font-bold">Nama Santri</TableHead>
                    <TableHead className="font-bold">Kitab Nadzom</TableHead>
                    <TableHead className="font-bold text-center">Bait</TableHead>
                    <TableHead className="font-bold text-center">Kualitas</TableHead>
                    <TableHead className="font-bold text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {setorans.length > 0 ? (
                    setorans.map(s => {
                      const student = students.find(st => st.id === s.santriId);
                      const kitab = nadzomList.find(n => n.id === s.kitabNadzomId);
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="text-xs text-muted-foreground font-semibold">{s.tanggal}</TableCell>
                          <TableCell className="font-bold text-sm">{student?.namaLengkap || "Santri ID: " + s.santriId}</TableCell>
                          <TableCell className="font-semibold text-xs text-primary">{kitab?.namaKitab || "Kitab ID: " + s.kitabNadzomId}</TableCell>
                          <TableCell className="text-center font-black">{s.baitMulai} s.d {s.baitSelesai}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={s.status === "Lancar" ? "bg-green-500 text-white font-bold" : s.status === "Cukup" ? "bg-amber-500 text-white font-bold" : "bg-red-500 text-white font-bold"}>
                              {s.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteSetoran(s.id)} className="text-red-500 hover:text-red-600 rounded-xl min-h-[44px]">
                              <Trash2 className="h-4.5 w-4.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">Belum ada riwayat setoran diinput.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Mobile View */}
            <div className="block md:hidden divide-y divide-muted/10">
              {setorans.length > 0 ? (
                setorans.map(s => {
                  const student = students.find(st => st.id === s.santriId);
                  const kitab = nadzomList.find(n => n.id === s.kitabNadzomId);
                  return (
                    <div key={s.id} className="p-4 flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-sm">{student?.namaLengkap || "Santri ID: " + s.santriId}</h4>
                        <span className="text-xs text-muted-foreground font-mono">{s.tanggal}</span>
                      </div>
                      <div className="flex justify-between items-center bg-muted/40 p-2.5 rounded-xl border border-border/40 text-xs">
                        <div>
                          <span className="font-semibold text-primary">{kitab?.namaKitab}</span>
                          <span className="ml-1 text-slate-700 font-bold">Bait {s.baitMulai}-{s.baitSelesai}</span>
                        </div>
                        <Badge className={s.status === "Lancar" ? "bg-green-500 text-white font-bold" : s.status === "Cukup" ? "bg-amber-500 text-white font-bold" : "bg-red-500 text-white font-bold"}>
                          {s.status}
                        </Badge>
                      </div>
                      <div className="flex justify-end">
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteSetoran(s.id)} className="text-red-500 hover:text-red-600 flex items-center gap-1.5 font-bold hover:bg-red-50/50 rounded-xl min-h-[44px] px-3 border border-red-100">
                          <Trash2 className="h-4 w-4" /> Hapus Setoran
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center py-8 text-xs text-muted-foreground">Belum ada riwayat setoran diinput.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. Catatan Santri */}
      {slug === "catatan" && (
        <Card className="glass-panel border-white/20">
          <CardContent className="p-0">
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold w-[44px]">Foto</TableHead>
                    <TableHead className="font-bold">Tanggal</TableHead>
                    <TableHead className="font-bold">Nama Santri</TableHead>
                    <TableHead className="font-bold">Log Bimbingan Perkembangan</TableHead>
                    <TableHead className="font-bold text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notes.length > 0 ? (
                    notes.map(c => {
                      const student = students.find(s => s.id === c.santriId);
                      return (
                      <TableRow key={c.id}>
                        <TableCell className="py-2">
                          <div className="h-9 w-9 rounded-full border border-primary/20 bg-muted overflow-hidden flex items-center justify-center shadow-sm">
                            {student?.fotoUrl ? (
                              <img src={student.fotoUrl} alt={student.namaLengkap} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold text-xs">
                                {(student?.namaLengkap || "?").charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-semibold">{c.tanggal}</TableCell>
                        <TableCell className="font-bold text-sm">
                          {student?.namaLengkap || "Santri ID: " + c.santriId}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-semibold leading-relaxed">{c.catatanUstadz}</TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteNote(c.id)} className="text-red-500 hover:text-red-600 rounded-xl min-h-[44px]">
                            <Trash2 className="h-4.5 w-4.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-xs text-muted-foreground">Belum ada catatan perkembangan diinput.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View (Responsive layout) */}
            <div className="block md:hidden divide-y divide-muted/10">
              {notes.length > 0 ? (
                notes.map(c => {
                  const student = students.find(s => s.id === c.santriId);
                  return (
                  <div key={c.id} className="p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-full border border-primary/20 bg-muted overflow-hidden shrink-0 flex items-center justify-center shadow-sm">
                          {student?.fotoUrl ? (
                            <img src={student.fotoUrl} alt={student.namaLengkap} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold text-xs">
                              {(student?.namaLengkap || "?").charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">{student?.namaLengkap || "Santri ID: " + c.santriId}</h4>
                          <span className="text-[10px] text-muted-foreground font-mono">{c.tanggal}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed bg-muted/40 p-2.5 rounded-xl border border-border/40">{c.catatanUstadz}</p>
                    <div className="flex justify-end pt-1">
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteNote(c.id)} className="text-red-500 hover:text-red-600 flex items-center gap-1.5 font-bold hover:bg-red-50/50 rounded-xl min-h-[44px] px-3 border border-red-100">
                        <Trash2 className="h-4 w-4" /> Hapus Catatan
                      </Button>
                    </div>
                  </div>
                  );
                })
              ) : (
                <p className="text-center py-8 text-xs text-muted-foreground">Belum ada catatan perkembangan diinput.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 5. Raport */}
      {slug === "raport" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/50 backdrop-blur-md p-4 rounded-xl border border-border/80 shadow-sm">
            <div className="text-sm font-semibold text-muted-foreground">
              Silakan pilih Semester untuk menyesuaikan data dan tautan cetak raport santri.
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Label htmlFor="semester-filter" className="text-xs font-bold text-muted-foreground uppercase">Pilih Semester:</Label>
              <Select value={selectedSemesterId} onValueChange={(val) => setSelectedSemesterId(val || "")}>
                <SelectTrigger className="w-[180px] bg-card min-h-[40px] text-xs font-semibold border-border">
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

          <Card className="glass-panel border-white/20">
            <CardContent className="p-0">
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold">NIS</TableHead>
                      <TableHead className="font-bold">Nama Lengkap</TableHead>
                      <TableHead className="font-bold">Rata-rata Akademik</TableHead>
                      <TableHead className="font-bold">Progres Hafalan</TableHead>
                      <TableHead className="font-bold text-center">Status Raport</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map(s => {
                      const sg = studentsGrades.find(item => item.student.id === s.id);
                      const progress = getNadzomProgress(s.id);
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="font-mono text-xs">{s.nis}</TableCell>
                          <TableCell className="font-bold text-sm">{s.namaLengkap}</TableCell>
                          <TableCell className="font-bold text-primary">{sg?.average || 0}</TableCell>
                          <TableCell className="text-xs font-semibold">{progress.pct}%</TableCell>
                          <TableCell className="text-center flex justify-center gap-2 pt-2.5">
                            <Link href={`/dashboard/mustahiq/raport/${s.id}?semesterId=${selectedSemesterId}`}>
                              <Button variant="outline" size="icon" className="h-9 w-9 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200" title="View Raport">
                                <Eye className="h-4.5 w-4.5" />
                              </Button>
                            </Link>
                            <Link href={`/dashboard/mustahiq/raport/${s.id}?semesterId=${selectedSemesterId}&print=true`} target="_blank">
                              <Button variant="outline" size="icon" className="h-9 w-9 text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200" title="Print Raport">
                                <Printer className="h-4.5 w-4.5" />
                              </Button>
                            </Link>
                            <Link href={`/dashboard/mustahiq/raport/${s.id}?semesterId=${selectedSemesterId}&download=true`} target="_blank">
                              <Button size="icon" className="h-9 w-9 bg-green-600 hover:bg-green-700 text-white" title="Download Raport">
                                <Download className="h-4.5 w-4.5" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View (Responsive layout) */}
              <div className="block md:hidden divide-y divide-muted/10">
                {filteredStudents.map(s => {
                  const sg = studentsGrades.find(item => item.student.id === s.id);
                  const progress = getNadzomProgress(s.id);
                  return (
                    <div key={s.id} className="p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-sm">{s.namaLengkap}</h4>
                          <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">NIS: {s.nis} | Rata-rata: <span className="font-bold text-primary">{sg?.average || 0}</span></p>
                        </div>
                        <Badge className="bg-blue-50/50 text-blue-600 border border-blue-100 font-bold">{progress.pct}% Hafalan</Badge>
                      </div>
                      <div className="flex justify-end pt-1 gap-2">
                        <Link href={`/dashboard/mustahiq/raport/${s.id}?semesterId=${selectedSemesterId}`} className="flex-1">
                          <Button variant="outline" className="w-full h-10 border-blue-200 text-blue-600 font-bold gap-1.5">
                            <Eye className="h-4 w-4" /> View
                          </Button>
                        </Link>
                        <Link href={`/dashboard/mustahiq/raport/${s.id}?semesterId=${selectedSemesterId}&print=true`} target="_blank" className="flex-1">
                          <Button variant="outline" className="w-full h-10 border-amber-200 text-amber-600 font-bold gap-1.5">
                            <Printer className="h-4 w-4" /> Print
                          </Button>
                        </Link>
                        <Link href={`/dashboard/mustahiq/raport/${s.id}?semesterId=${selectedSemesterId}&download=true`} target="_blank" className="flex-1">
                          <Button className="w-full h-10 bg-green-600 hover:bg-green-700 text-white font-bold gap-1.5">
                            <Download className="h-4 w-4" /> Unduh
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={confirmType === "note" ? "Hapus Catatan Pembinaan" : "Hapus Riwayat Setoran"}
        message={confirmType === "note"
          ? "Apakah Anda yakin ingin menghapus catatan pembinaan ini? Tindakan ini tidak dapat dibatalkan."
          : "Apakah Anda yakin ingin menghapus riwayat setoran ini? Tindakan ini tidak dapat dibatalkan."}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        onConfirm={handleConfirmDelete}
        variant="destructive"
      />
    </div>
  );
}
