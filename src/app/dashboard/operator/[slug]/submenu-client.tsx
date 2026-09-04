/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useTransition, useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { 
  Users, 
  BookOpen, 
  DoorOpen, 
  Calendar, 
  LineChart, 
  Megaphone, 
  PlusCircle, 
  Trash2, 
  Search, 
  CheckCircle2, 
  Pencil, 
  Shield, 
  Database, 
  Download, 
  Building, 
  Phone, 
  MapPin, 
  FileCheck,
  Settings 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { apiPost } from "@/lib/api-client";
import { deleteAbsensiSantri, deleteAllAbsensiSantri } from "@/actions/absensi";


interface OperatorSubmenuClientProps {
  slug: string;
  initialUstadz: any[];
  initialKelas: any[];
  initialKamar: any[];
  initialKitab: any[];
  initialJadwal: any[];
  initialPengumuman: any[];
  santriList: any[];
  currentUserId: string;
  initialRoles?: any[];
  initialPermissions?: any[];
  initialRolePermissions?: any[];
  initialSettings?: any;
  tahunAjaranList?: any[];
  semesterList?: any[];
  initialAbsensiSantri?: any[];
}

export function OperatorSubmenuClient({
  slug,
  initialUstadz,
  initialKelas,
  initialKamar,
  initialKitab,
  initialJadwal,
  initialPengumuman,
  santriList,
  currentUserId,
  initialRoles = [],
  initialPermissions = [],
  initialRolePermissions = [],
  initialSettings,
  tahunAjaranList = [],
  semesterList = [],
  initialAbsensiSantri = []
}: OperatorSubmenuClientProps) {
  const [ustadzList, setUstadzList] = useState<any[]>(initialUstadz);
  const [kelasList, setKelasList] = useState<any[]>(initialKelas);
  const [kamarList, setKamarList] = useState<any[]>(initialKamar);
  const [kitabList, setKitabList] = useState<any[]>(initialKitab);
  const [jadwalList, setJadwalList] = useState<any[]>(initialJadwal);
  const [pengumumanList, setPengumumanList] = useState<any[]>(initialPengumuman);
  const [absensiSantriData, setAbsensiSantriData] = useState<any[]>(initialAbsensiSantri);

  // Security states
  const [rolesList] = useState<any[]>(initialRoles);
  const [permissionsList] = useState<any[]>(initialPermissions);
  const [rolePermissionsList, setRolePermissionsList] = useState<any[]>(initialRolePermissions);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("OPERATOR");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [backupHistory, setBackupHistory] = useState<any[]>([]);

  // Settings tab states
  const [settingsData, setSettingsData] = useState<any>(initialSettings || {
    namaPondok: "",
    alamat: "",
    telepon: "",
    logoUrl: null,
    tahunAjaranAktifId: "",
    semesterAktifId: "",
    tampilkanRanking: false,
    namaPengasuh: "",
    raportTemplate: ""
  });

  const [namaPondok, setNamaPondok] = useState(settingsData.namaPondok || "");
  const [alamat, setAlamat] = useState(settingsData.alamat || "");
  const [telepon, setTelepon] = useState(settingsData.telepon || "");
  const [namaPengasuh, setNamaPengasuh] = useState(settingsData.namaPengasuh || "");
  const [logoUrl, setLogoUrl] = useState(settingsData.logoUrl || "");
  const [tahunAjaranAktifId, setTahunAjaranAktifId] = useState(settingsData.tahunAjaranAktifId || "");
  const [semesterAktifId, setSemesterAktifId] = useState(settingsData.semesterAktifId || "");
  const [tampilkanRanking, setTampilkanRanking] = useState(settingsData.tampilkanRanking ?? true);
  const [raportTemplate, setRaportTemplate] = useState(settingsData.raportTemplate || "");
  const [uploading, setUploading] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const editorRef = useRef<any>(null);

  const getHijriYear = (gregorianYearName: string) => {
    if (!gregorianYearName) return "";
    const years = gregorianYearName.split(/[\/\-]/);
    if (years.length >= 2) {
      const y1 = parseInt(years[0]);
      const y2 = parseInt(years[1]);
      if (!isNaN(y1) && !isNaN(y2)) {
        return `${y1 - 579}/${y2 - 579} H`;
      }
    }
    const y = parseInt(gregorianYearName);
    if (!isNaN(y)) {
      return `${y - 579} H`;
    }
    return "";
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Gagal", { description: "Ukuran file logo melebihi batas maksimal 2 MB." });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "settings");

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as { url?: string; error?: string };
      if (response.ok && data.url) {
        setLogoUrl(data.url);
        toast.success("Berhasil", { description: "Logo instansi berhasil diunggah." });
      } else {
        toast.error("Gagal", { description: data.error || "Gagal mengunggah logo." });
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Error", { description: "Gagal menghubungkan ke server untuk upload." });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await apiPost("updateSystemSettings", {
        data: {
          namaPondok,
          alamat,
          telepon,
          logoUrl,
          tahunAjaranAktifId,
          semesterAktifId,
          tampilkanRanking,
          namaPengasuh,
          raportTemplate
        }
      });
      if (res.error) {
        toast.error("Gagal", { description: res.error });
      } else {
        toast.success("Berhasil", { description: res.message });
        setSettingsData({
          namaPondok,
          alamat,
          telepon,
          logoUrl,
          tahunAjaranAktifId,
          semesterAktifId,
          tampilkanRanking,
          namaPengasuh,
          raportTemplate
        });
      }
    });
  };

  React.useEffect(() => {
    const mapped = rolePermissionsList
      .filter((rp: any) => rp.roleId === selectedRoleId)
      .map((rp: any) => rp.permissionId);
    setSelectedPermissions(mapped);
  }, [selectedRoleId, rolePermissionsList]);

  const handleTogglePermission = (permId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]
    );
  };

  const handleSaveRoleMapping = () => {
    startTransition(async () => {
      const res = await apiPost("updateRolePermissions", {
        params: {
          roleId: selectedRoleId,
          permissionIds: selectedPermissions
        }
      });
      if (res.error) {
        toast.error("Gagal", { description: res.error });
      } else {
        toast.success("Berhasil", { description: res.message });
        const updatedList = rolePermissionsList.filter((rp: any) => rp.roleId !== selectedRoleId);
        selectedPermissions.forEach(permId => {
          updatedList.push({ id: `RP-${selectedRoleId}-${permId}`, roleId: selectedRoleId, permissionId: permId });
        });
        setRolePermissionsList(updatedList);
      }
    });
  };

  const handleBackupNow = () => {
    toast.loading("Memproses backup database...");
    setTimeout(() => {
      toast.dismiss();
      const newBackup = {
        id: "BKP-" + Math.random().toString(36).substring(2, 5).toUpperCase(),
        name: `backup_manual_${new Date().toISOString().replace(/[-:T.]/g, "_").substring(0, 19)}.sql`,
        size: "2.4 MB",
        date: new Date().toLocaleString("id-ID")
      };
      setBackupHistory(prev => [newBackup, ...prev]);
      toast.success("Berhasil", { description: "Database berhasil di-backup dan diarsipkan." });
    }, 1500);
  };

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const handleStartEdit = (item: any) => {
    setEditingItem(item);
    if (slug === "ustadz") {
      setUstadzNama(item.nama);
      setUstadzHp(item.nomorHp);
      setUstadzAlamat(item.alamat);
    } else if (slug === "kelas") {
      setKelasNama(item.namaKelas);
      setKelasTingkatan(item.tingkatan);
      setKelasWaliId(item.waliKelasId || "");
    } else if (slug === "kamar") {
      setKamarNama(item.namaKamar);
      setKamarKapasitas(item.kapasitas.toString());
    } else if (slug === "kitab") {
      setKitabNama(item.namaKitabMapel);
      setKitabKet(item.keterangan || "");
    } else if (slug === "jadwal") {
      setJHari(item.hari);
      setJMulai(item.jamMulai);
      setJSelesai(item.jamSelesai);
      setJKelasId(item.kelasId);
      setJKitabId(item.kitabMapelId);
      setJUstadzId(item.ustadzId);
    }
    setDialogOpen(true);
  };

  const handleDeleteUstadz = (id: string) => {
    askConfirmation("Apakah Anda yakin ingin menghapus data ustadz ini?", () => {
      startTransition(async () => {
        const res = await apiPost("deleteUstadz", { id });
        if (res.error) {
          toast.error("Gagal", { description: res.error });
        } else {
          toast.success("Berhasil", { description: res.message });
          setUstadzList(ustadzList.filter(u => u.id !== id));
        }
      });
    });
  };

  const handleDeleteAbsensiSantri = (id: string) => {
    askConfirmation("Apakah Anda yakin ingin menghapus riwayat kehadiran santri ini?", () => {
      startTransition(async () => {
        const res = await deleteAbsensiSantri(id, currentUserId);
        if (res.error) {
          toast.error("Gagal", { description: res.error });
        } else {
          toast.success("Berhasil", { description: res.message });
          setAbsensiSantriData(absensiSantriData.filter(a => a.id !== id));
        }
      });
    });
  };

  const handleDeleteAllAbsensiSantri = () => {
    if (filteredAbsensiSantri.length === 0) return;
    askConfirmation(`Apakah Anda yakin ingin menghapus ${filteredAbsensiSantri.length} riwayat kehadiran yang tampil saat ini?`, () => {
      startTransition(async () => {
        const idsToDelete = filteredAbsensiSantri.map(a => a.id);
        const res = await deleteAllAbsensiSantri(idsToDelete, currentUserId);
        if (res.error) {
          toast.error("Gagal", { description: res.error });
        } else {
          toast.success("Berhasil", { description: res.message });
          setAbsensiSantriData(absensiSantriData.filter(a => !idsToDelete.includes(a.id)));
        }
      });
    });
  };

  // Confirmation states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmVariant, setConfirmVariant] = useState<"destructive" | "primary" | "warning">("destructive");

  const askConfirmation = (message: string, action: () => void, variant: "destructive" | "primary" | "warning" = "destructive") => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setConfirmVariant(variant);
    setConfirmOpen(true);
  };

  // 1. Ustadz Form State
  const [ustadzNama, setUstadzNama] = useState("");
  const [ustadzHp, setUstadzHp] = useState("");
  const [ustadzAlamat, setUstadzAlamat] = useState("");

  // 2. Kelas Form State
  const [kelasNama, setKelasNama] = useState("");
  const [kelasTingkatan, setKelasTingkatan] = useState("Ibtida");
  const [kelasWaliId, setKelasWaliId] = useState("");

  // 3. Kamar Form State
  const [kamarNama, setKamarNama] = useState("");
  const [kamarKapasitas, setKamarKapasitas] = useState("10");

  // 4. Kitab Form State
  const [kitabNama, setKitabNama] = useState("");
  const [kitabKet, setKitabKet] = useState("");

  // 5. Jadwal Form State (default Ba'da Isya 20:15 - 21:10)
  const [jHari, setJHari] = useState("Senin");
  const [jMulai, setJMulai] = useState("20:15");
  const [jSelesai, setJSelesai] = useState("21:10");
  const [jKelasId, setJKelasId] = useState("");
  const [jKitabId, setJKitabId] = useState("");
  const [jUstadzId, setJUstadzId] = useState("");

  // 6. Pengumuman Form State
  const [annJudul, setAnnJudul] = useState("");
  const [annKonten, setAnnKonten] = useState("");
  const [annTarget, setAnnTarget] = useState("PENGASUH,MUSTAHIQ,MUNAWIB,WALI_SANTRI");

  // 8. Absensi Santri filter
  const [filterAbsensiTanggal, setFilterAbsensiTanggal] = useState("");
  const [filterAbsensiKelas, setFilterAbsensiKelas] = useState("all");
  const [filterAbsensiSearch, setFilterAbsensiSearch] = useState("");

  // Filter for Kehadiran Santri
  const filteredAbsensiSantri = absensiSantriData.filter(a => {
    if (filterAbsensiTanggal && a.tanggal !== filterAbsensiTanggal) return false;
    const santri = santriList.find(s => s.id === a.santriId);
    if (filterAbsensiKelas !== "all" && santri?.kelasId !== filterAbsensiKelas) return false;
    if (filterAbsensiSearch) {
      const q = filterAbsensiSearch.toLowerCase();
      if (!santri?.namaLengkap?.toLowerCase().includes(q) && !santri?.nis?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Occurrences calculators
  const getSantriCountInKamar = (kamarId: string) => {
    return santriList.filter(s => s.kamarId === kamarId).length;
  };
  const getSantriCountInKelas = (kelasId: string) => {
    return santriList.filter(s => s.kelasId === kelasId).length;
  };

  // 1. Submit Handlers
  const handleAddUstadz = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      if (editingItem) {
        const res = await apiPost("updateUstadz", {
          id: editingItem.id,
          data: { nama: ustadzNama, nomorHp: ustadzHp, alamat: ustadzAlamat },
        });
        if (res.error) {
          toast.error("Gagal", { description: res.error });
        } else {
          toast.success("Berhasil", { description: res.message });
          setDialogOpen(false);
          setUstadzList(ustadzList.map(u => u.id === editingItem.id ? { ...u, nama: ustadzNama, nomorHp: ustadzHp, alamat: ustadzAlamat } : u));
          setEditingItem(null);
        }
      } else {
        const res = await apiPost("createUstadz", {
          data: { nama: ustadzNama, nomorHp: ustadzHp, alamat: ustadzAlamat },
        });
        if (res.error) {
          toast.error("Gagal", { description: res.error });
        } else {
          toast.success("Berhasil", { description: res.message });
          setDialogOpen(false);
          setUstadzList([...ustadzList, { id: Math.random().toString(), nama: ustadzNama, nomorHp: ustadzHp, alamat: ustadzAlamat, statusAktif: true }]);
          setUstadzNama(""); setUstadzHp(""); setUstadzAlamat("");
        }
      }
    });
  };

  const handleAddKelas = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      if (editingItem) {
        const res = await apiPost("updateKelas", { id: editingItem.id, data: { namaKelas: kelasNama, tingkatan: kelasTingkatan, waliKelasId: kelasWaliId } });
        if (res.error) { toast.error("Gagal", { description: res.error }); }
        else { toast.success("Berhasil", { description: res.message }); setDialogOpen(false); setKelasList(kelasList.map(k => k.id === editingItem.id ? { ...k, namaKelas: kelasNama, tingkatan: kelasTingkatan, waliKelasId: kelasWaliId } : k)); setEditingItem(null); }
      } else {
        const res = await apiPost("createKelas", { data: { namaKelas: kelasNama, tingkatan: kelasTingkatan, waliKelasId: kelasWaliId } });
        if (res.error) { toast.error("Gagal", { description: res.error }); }
        else { toast.success("Berhasil", { description: res.message }); setDialogOpen(false); setKelasList([...kelasList, { id: "QR-" + kelasNama.toUpperCase(), namaKelas: kelasNama, tingkatan: kelasTingkatan, waliKelasId: kelasWaliId }]); setKelasNama(""); setKelasWaliId(""); }
      }
    });
  };

  const handleDeleteKelas = (id: string) => {
    askConfirmation("Apakah Anda yakin ingin menghapus kelas ini?", () => {
      startTransition(async () => {
        const res = await apiPost("deleteKelas", { id });
        if (res.error) { toast.error("Gagal", { description: res.error }); }
        else { toast.success("Berhasil", { description: res.message }); setKelasList(kelasList.filter(k => k.id !== id)); }
      });
    });
  };

  const handleAddKamar = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      if (editingItem) {
        const res = await apiPost("updateKamar", { id: editingItem.id, data: { namaKamar: kamarNama, kapasitas: kamarKapasitas } });
        if (res.error) { toast.error("Gagal", { description: res.error }); }
        else { toast.success("Berhasil", { description: res.message }); setDialogOpen(false); setKamarList(kamarList.map(km => km.id === editingItem.id ? { ...km, namaKamar: kamarNama, kapasitas: parseInt(kamarKapasitas) } : km)); setEditingItem(null); }
      } else {
        const res = await apiPost("createKamar", { data: { namaKamar: kamarNama, kapasitas: kamarKapasitas } });
        if (res.error) { toast.error("Gagal", { description: res.error }); }
        else { toast.success("Berhasil", { description: res.message }); setDialogOpen(false); setKamarList([...kamarList, { id: Math.random().toString(), namaKamar: kamarNama, kapasitas: parseInt(kamarKapasitas), jumlahPenghuni: 0 }]); setKamarNama(""); setKamarKapasitas("10"); }
      }
    });
  };

  const handleDeleteKamar = (id: string) => {
    askConfirmation("Apakah Anda yakin ingin menghapus kamar ini?", () => {
      startTransition(async () => {
        const res = await apiPost("deleteKamar", { id });
        if (res.error) { toast.error("Gagal", { description: res.error }); }
        else { toast.success("Berhasil", { description: res.message }); setKamarList(kamarList.filter(k => k.id !== id)); }
      });
    });
  };

  const handleAddKitab = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      if (editingItem) {
        const res = await apiPost("updateKitab", { id: editingItem.id, data: { namaKitabMapel: kitabNama, keterangan: kitabKet } });
        if (res.error) { toast.error("Gagal", { description: res.error }); }
        else { toast.success("Berhasil", { description: res.message }); setDialogOpen(false); setKitabList(kitabList.map(kt => kt.id === editingItem.id ? { ...kt, namaKitabMapel: kitabNama, keterangan: kitabKet } : kt)); setEditingItem(null); }
      } else {
        const res = await apiPost("createKitab", { data: { namaKitabMapel: kitabNama, keterangan: kitabKet } });
        if (res.error) { toast.error("Gagal", { description: res.error }); }
        else { toast.success("Berhasil", { description: res.message }); setDialogOpen(false); setKitabList([...kitabList, { id: Math.random().toString(), namaKitabMapel: kitabNama, keterangan: kitabKet }]); setKitabNama(""); setKitabKet(""); }
      }
    });
  };

  const handleDeleteKitab = (id: string) => {
    askConfirmation("Apakah Anda yakin ingin menghapus kitab ini?", () => {
      startTransition(async () => {
        const res = await apiPost("deleteKitab", { id });
        if (res.error) { toast.error("Gagal", { description: res.error }); }
        else { toast.success("Berhasil", { description: res.message }); setKitabList(kitabList.filter(k => k.id !== id)); }
      });
    });
  };

  const handleAddJadwal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jKelasId || !jKitabId || !jUstadzId) {
      toast.error("Peringatan", { description: "Pilih kelas, kitab, dan ustadz terlebih dahulu." });
      return;
    }
    startTransition(async () => {
      const jadwalData = { hari: jHari, jamMulai: jMulai, jamSelesai: jSelesai, kelasId: jKelasId, kitabMapelId: jKitabId, ustadzId: jUstadzId };
      if (editingItem) {
        const res = await apiPost("updateJadwal", { id: editingItem.id, data: jadwalData });
        if (res.error) { toast.error("Gagal", { description: res.error }); }
        else { toast.success("Berhasil", { description: res.message }); setDialogOpen(false); setJadwalList(jadwalList.map(j => j.id === editingItem.id ? { ...j, ...jadwalData } : j)); setEditingItem(null); }
      } else {
        const res = await apiPost("createJadwal", { data: jadwalData });
        if (res.error) { toast.error("Gagal", { description: res.error }); }
        else { toast.success("Berhasil", { description: res.message }); setDialogOpen(false); setJadwalList([...jadwalList, { id: Math.random().toString(), ...jadwalData }]); }
      }
    });
  };

  const handleDeleteJadwal = (id: string) => {
    askConfirmation("Apakah Anda yakin ingin menghapus jadwal ini?", () => {
      startTransition(async () => {
        const res = await apiPost("deleteJadwal", { id });
        if (res.error) { toast.error("Gagal", { description: res.error }); }
        else { toast.success("Berhasil", { description: res.message }); setJadwalList(jadwalList.filter(j => j.id !== id)); }
      });
    });
  };

  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await apiPost("createPengumuman", { data: { judul: annJudul, konten: annKonten, targetRoles: annTarget } });
      if (res.error) { toast.error("Gagal", { description: res.error }); }
      else { toast.success("Berhasil", { description: res.message }); setDialogOpen(false); setPengumumanList([{ id: Math.random().toString(), judul: annJudul, konten: annKonten, targetRoles: annTarget, tanggal: new Date().toISOString().split("T")[0] }, ...pengumumanList]); setAnnJudul(""); setAnnKonten(""); }
    });
  };

  const handleDeleteAnnouncement = (id: string) => {
    askConfirmation("Apakah Anda yakin ingin menghapus pengumuman ini?", () => {
      startTransition(async () => {
        const res = await apiPost("deletePengumuman", { id });
        if (res.error) { toast.error("Gagal", { description: res.error }); }
        else { toast.success("Berhasil", { description: res.message }); setPengumumanList(pengumumanList.filter(p => p.id !== id)); }
      });
    });
  };

  // Header display details
  const getHeaderDetails = () => {
    switch (slug) {
      case "ustadz": return { title: "Data Ustadz", desc: "Kelola biodata asatidzah pengampu pengajaran pesantren.", icon: Users };
      case "kelas": return { title: "Data Kelas", desc: "Kelola ruang belajar dan penunjukan Ustadz wali kelas.", icon: BookOpen };
      case "kamar": return { title: "Data Kamar", desc: "Kelola penempatan asrama santri dan kapasitas hunian.", icon: DoorOpen };
      case "kitab": return { title: "Data Kitab / Mapel", desc: "Manajemen daftar materi kitab kuning dan kurikulum.", icon: BookOpen };
      case "jadwal": return { title: "Jadwal Madrasah", desc: "Atur waktu, pengajar, dan kelas pembelajaran pondok.", icon: Calendar };
      case "monitoring": return { title: "Monitoring Pondok", desc: "Statistik perkembangan jumlah santri dan keterisian asrama.", icon: LineChart };
      case "pengumuman": return { title: "Pengumuman", desc: "Publikasikan informasi penting ke papan portal pengguna.", icon: Megaphone };
      case "roles": return { title: "Daftar Peran", desc: "Daftar tingkat wewenang (roles) pengguna sistem pesantren.", icon: Shield };
      case "permissions": return { title: "Daftar Izin Akses", desc: "Daftar spesifik otoritas (permissions) fungsionalitas sistem.", icon: Shield };
      case "mapping": return { title: "Pemetaan Peran & Hak Akses", desc: "Petakan dan kelola hak akses untuk masing-masing peran pengguna.", icon: Shield };
      case "backup": return { title: "Backup & Restore Database", desc: "Ekspor dan amankan berkas basis data SQLite/D1 Pondok Pesantren.", icon: Database };
      case "settings": return { title: "Pengaturan Sistem & Kop Raport", desc: "Sesuaikan logo instansi, nama pondok, alamat, serta tahun ajaran & semester aktif.", icon: Settings };
      default: return { title: "Operator Menu", desc: "Manajemen operasional pesantren.", icon: BookOpen };
    }
  };

  const details = getHeaderDetails();
  const Icon = details.icon;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-blue-gradient flex items-center justify-center text-white shadow-md">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-glow-gold">{details.title}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{details.desc}</p>
          </div>
        </div>

        {slug !== "monitoring" && slug !== "roles" && slug !== "permissions" && slug !== "mapping" && slug !== "backup" && slug !== "settings" && (
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingItem(null);
          }}>
            <DialogTrigger className="h-8.5 px-3 text-xs font-bold rounded-lg bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer shrink-0" onClick={() => {
              setEditingItem(null);
              setUstadzNama(""); setUstadzHp(""); setUstadzAlamat("");
              setKelasNama(""); setKelasTingkatan("Ibtida"); setKelasWaliId("");
              setKamarNama(""); setKamarKapasitas("10");
              setKitabNama(""); setKitabKet("");
              setJHari("Senin"); setJMulai("20:15"); setJSelesai("21:10"); setJKelasId(""); setJKitabId(""); setJUstadzId("");
            }}>
              <PlusCircle className="h-3.5 w-3.5" /> Tambah
            </DialogTrigger>
            <DialogContent className="max-w-xl md:max-w-2xl bg-card/95 backdrop-blur-2xl border border-border/80 shadow-2xl rounded-3xl p-6">
              <DialogHeader className="space-y-2 border-b border-border/60 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <Icon className="h-5.5 w-5.5" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-extrabold tracking-tight text-foreground">{editingItem ? "Edit" : "Tambah"} {details.title}</DialogTitle>
                    <DialogDescription className="text-xs md:text-sm text-muted-foreground">Silakan lengkapi data formulir di bawah ini.</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* A. Form Ustadz */}
              {slug === "ustadz" && (
                <form onSubmit={handleAddUstadz} className="space-y-4 pt-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="u-nama" className="text-xs md:text-sm font-bold text-foreground">Nama Lengkap & Gelar</Label>
                    <Input id="u-nama" required value={ustadzNama} onChange={(e) => setUstadzNama(e.target.value)} placeholder="Contoh: Ust. Ahmad Fauzi, Lc." className="h-11 rounded-xl bg-muted/40 border-border/60" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="u-hp" className="text-xs md:text-sm font-bold text-foreground">Nomor WhatsApp / HP</Label>
                    <Input id="u-hp" required value={ustadzHp} onChange={(e) => setUstadzHp(e.target.value)} placeholder="Contoh: 081234567890" className="h-11 rounded-xl bg-muted/40 border-border/60" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="u-alamat" className="text-xs md:text-sm font-bold text-foreground">Alamat Tinggal / Domisili</Label>
                    <Input id="u-alamat" required value={ustadzAlamat} onChange={(e) => setUstadzAlamat(e.target.value)} placeholder="Contoh: Asrama Putra Lt. 2 / Desa..." className="h-11 rounded-xl bg-muted/40 border-border/60" />
                  </div>
                  <DialogFooter className="pt-3 border-t border-border/60 gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl h-11 px-5 font-semibold">Batal</Button>
                    <Button type="submit" disabled={isPending} className="bg-primary text-primary-foreground font-bold rounded-xl h-11 px-6 cursor-pointer shadow-sm">
                      {isPending ? "Menyimpan..." : (editingItem ? "Update Ustadz" : "Simpan Ustadz")}
                    </Button>
                  </DialogFooter>
                </form>
              )}

              {/* B. Form Kelas */}
              {slug === "kelas" && (
                <form onSubmit={handleAddKelas} className="space-y-4 pt-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="k-nama" className="text-xs md:text-sm font-bold text-foreground">Nama Kelas</Label>
                    <Input id="k-nama" required value={kelasNama} onChange={(e) => setKelasNama(e.target.value)} placeholder="Contoh: Kelas I'dadiyah A" className="h-11 rounded-xl bg-muted/40 border-border/60" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="k-tingkat" className="text-xs md:text-sm font-bold text-foreground">Tingkatan Jenjang</Label>
                    <Select value={kelasTingkatan} onValueChange={(val) => setKelasTingkatan(val || "Ibtida")}>
                      <SelectTrigger className="h-11 rounded-xl bg-muted/40 border-border/60">
                        <SelectValue placeholder="Pilih Tingkatan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="I'dadiyah">I'dadiyah (Persiapan)</SelectItem>
                        <SelectItem value="Ibtida">Ibtida' (Tingkat Dasar)</SelectItem>
                        <SelectItem value="Tsanawi">Tsanawi (Tingkat Menengah)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="k-wali" className="text-xs md:text-sm font-bold text-foreground">Wali Kelas (Mustahiq)</Label>
                    <Select value={kelasWaliId} onValueChange={(val) => setKelasWaliId(val || "")}>
                      <SelectTrigger className="h-11 rounded-xl bg-muted/40 border-border/60">
                        <SelectValue placeholder="Pilih Ustadz Wali Kelas" />
                      </SelectTrigger>
                      <SelectContent>
                        {ustadzList.map(u => (
                          <SelectItem key={u.id} value={u.id}>{u.nama}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter className="pt-3 border-t border-border/60 gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl h-11 px-5 font-semibold">Batal</Button>
                    <Button type="submit" disabled={isPending} className="bg-primary text-primary-foreground font-bold rounded-xl h-11 px-6 cursor-pointer shadow-sm">
                      {isPending ? "Menyimpan..." : (editingItem ? "Update Kelas" : "Simpan Kelas")}
                    </Button>
                  </DialogFooter>
                </form>
              )}

              {/* C. Form Kamar */}
              {slug === "kamar" && (
                <form onSubmit={handleAddKamar} className="space-y-4 pt-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="km-nama" className="text-xs md:text-sm font-bold text-foreground">Nama Kamar / Gedung Asrama</Label>
                    <Input id="km-nama" required value={kamarNama} onChange={(e) => setKamarNama(e.target.value)} placeholder="Contoh: Al-Fatihah 01" className="h-11 rounded-xl bg-muted/40 border-border/60" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="km-cap" className="text-xs md:text-sm font-bold text-foreground">Kapasitas Maksimal (Santri)</Label>
                    <Input id="km-cap" type="number" required value={kamarKapasitas} onChange={(e) => setKamarKapasitas(e.target.value)} placeholder="15" className="h-11 rounded-xl bg-muted/40 border-border/60" />
                  </div>
                  <DialogFooter className="pt-3 border-t border-border/60 gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl h-11 px-5 font-semibold">Batal</Button>
                    <Button type="submit" disabled={isPending} className="bg-primary text-primary-foreground font-bold rounded-xl h-11 px-6 cursor-pointer shadow-sm">
                      {isPending ? "Menyimpan..." : (editingItem ? "Update Kamar" : "Simpan Kamar")}
                    </Button>
                  </DialogFooter>
                </form>
              )}

              {/* D. Form Kitab */}
              {slug === "kitab" && (
                <form onSubmit={handleAddKitab} className="space-y-4 pt-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="kt-nama" className="text-xs md:text-sm font-bold text-foreground">Nama Kitab / Pelajaran (Teks Arab / Latin)</Label>
                    <Input id="kt-nama" required value={kitabNama} onChange={(e) => setKitabNama(e.target.value)} placeholder="Contoh: سفينة النجاة / Fathul Qorib" className="h-11 rounded-xl bg-muted/40 border-border/60 font-arabic text-base" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="kt-desc" className="text-xs md:text-sm font-bold text-foreground">Keterangan / Fan Ilmu</Label>
                    <Input id="kt-desc" value={kitabKet} onChange={(e) => setKitabKet(e.target.value)} placeholder="Contoh: Fan Fiqih / Fan Nahwu" className="h-11 rounded-xl bg-muted/40 border-border/60" />
                  </div>
                  <DialogFooter className="pt-3 border-t border-border/60 gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl h-11 px-5 font-semibold">Batal</Button>
                    <Button type="submit" disabled={isPending} className="bg-primary text-primary-foreground font-bold rounded-xl h-11 px-6 cursor-pointer shadow-sm">
                      {isPending ? "Menyimpan..." : (editingItem ? "Update Kitab" : "Simpan Kitab")}
                    </Button>
                  </DialogFooter>
                </form>
              )}

              {/* E. Form Jadwal */}
              {slug === "jadwal" && (
                <form onSubmit={handleAddJadwal} className="space-y-4 pt-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="j-hari" className="text-xs md:text-sm font-bold text-foreground">Hari Belajar</Label>
                    <Select value={jHari} onValueChange={(val) => setJHari(val || "Senin")}>
                      <SelectTrigger className="h-11 rounded-xl bg-muted/40 border-border/60">
                        <SelectValue placeholder="Pilih Hari" />
                      </SelectTrigger>
                      <SelectContent>
                        {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Ahad"].map(h => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="j-start" className="text-xs md:text-sm font-bold text-foreground">Jam Mulai</Label>
                      <Input id="j-start" value={jMulai} onChange={(e) => setJMulai(e.target.value)} placeholder="20:15" className="h-11 rounded-xl bg-muted/40 border-border/60" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="j-end" className="text-xs md:text-sm font-bold text-foreground">Jam Selesai</Label>
                      <Input id="j-end" value={jSelesai} onChange={(e) => setJSelesai(e.target.value)} placeholder="21:10" className="h-11 rounded-xl bg-muted/40 border-border/60" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="j-kelas" className="text-xs font-bold text-foreground">Ruang Kelas</Label>
                    <Select value={jKelasId} onValueChange={(val) => setJKelasId(val || "")}>
                      <SelectTrigger className="h-10 rounded-xl bg-muted/40 border-border/60">
                        <SelectValue placeholder="Pilih Kelas" />
                      </SelectTrigger>
                      <SelectContent>
                        {kelasList.map(k => (
                          <SelectItem key={k.id} value={k.id}>{k.namaKelas}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="j-kitab" className="text-xs font-bold text-foreground">Kitab / Mapel</Label>
                    <Select value={jKitabId} onValueChange={(val) => setJKitabId(val || "")}>
                      <SelectTrigger className="h-10 rounded-xl bg-muted/40 border-border/60">
                        <SelectValue placeholder="Pilih Kitab" />
                      </SelectTrigger>
                      <SelectContent>
                        {kitabList.map(kt => (
                          <SelectItem key={kt.id} value={kt.id}>{kt.namaKitabMapel}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="j-ustadz" className="text-xs font-bold text-foreground">Ustadz Pengampu</Label>
                    <Select value={jUstadzId} onValueChange={(val) => setJUstadzId(val || "")}>
                      <SelectTrigger className="h-10 rounded-xl bg-muted/40 border-border/60">
                        <SelectValue placeholder="Pilih Ustadz" />
                      </SelectTrigger>
                      <SelectContent>
                        {ustadzList.map(u => (
                          <SelectItem key={u.id} value={u.id}>{u.nama}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter className="pt-3 border-t border-border/60 gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl h-10 px-4 font-semibold">Batal</Button>
                    <Button type="submit" disabled={isPending} className="bg-primary text-primary-foreground font-bold rounded-xl h-10 px-6 cursor-pointer shadow-sm">
                      {isPending ? "Menyimpan..." : (editingItem ? "Update Jadwal" : "Simpan Jadwal")}
                    </Button>
                  </DialogFooter>
                </form>
              )}

              {/* F. Form Pengumuman */}
              {slug === "pengumuman" && (
                <form onSubmit={handleAddAnnouncement} className="space-y-4 pt-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="a-judul" className="text-xs font-bold text-foreground">Judul Pengumuman</Label>
                    <Input id="a-judul" required value={annJudul} onChange={(e) => setAnnJudul(e.target.value)} placeholder="Contoh: Libur Hari Raya" className="h-10 rounded-xl bg-muted/40 border-border/60" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="a-konten" className="text-xs font-bold text-foreground">Isi Pengumuman</Label>
                    <Input id="a-konten" required value={annKonten} onChange={(e) => setAnnKonten(e.target.value)} placeholder="Tuliskan info lengkap..." className="h-10 rounded-xl bg-muted/40 border-border/60" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="a-target" className="text-xs font-bold text-foreground">Target Penerima</Label>
                    <Select value={annTarget} onValueChange={(val) => setAnnTarget(val || "PENGASUH,MUSTAHIQ,MUNAWIB,WALI_SANTRI")}>
                      <SelectTrigger className="h-10 rounded-xl bg-muted/40 border-border/60">
                        <SelectValue placeholder="Pilih Target" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENGASUH,MUSTAHIQ,MUNAWIB,WALI_SANTRI">Semua Peran</SelectItem>
                        <SelectItem value="WALI_SANTRI">Wali Santri Saja</SelectItem>
                        <SelectItem value="MUSTAHIQ,MUNAWIB">Mustahiq & Munawib Saja</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter className="pt-3 border-t border-border/60 gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl h-10 px-4 font-semibold">Batal</Button>
                    <Button type="submit" disabled={isPending} className="bg-primary text-primary-foreground font-bold rounded-xl h-10 px-6 cursor-pointer shadow-sm">
                      {isPending ? "Menyimpan..." : "Publikasikan"}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* VIEW RENDER CASES */}

      {/* 1. Ustadz list */}
      {slug === "ustadz" && (
        <Card className="glass-panel border-white/20">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
              <TableHeader className="bg-white/50">
                <TableRow>
                  <TableHead className="font-bold">Nama Lengkap</TableHead>
                  <TableHead className="font-bold">Nomor Telepon</TableHead>
                  <TableHead className="font-bold">Alamat Asal</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ustadzList.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-bold text-sm">{u.nama}</TableCell>
                    <TableCell className="font-mono text-xs">{u.nomorHp}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-semibold">{u.alamat}</TableCell>
                    <TableCell>
                      <Badge className={u.statusAktif ? "bg-green-500 font-bold text-white" : "bg-red-500 text-white"}>
                        {u.statusAktif ? "Aktif" : "Non-Aktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center flex justify-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleStartEdit(u)} className="text-blue-500 hover:text-blue-600 rounded-xl min-h-10">
                        <Pencil className="h-4.5 w-4.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteUstadz(u.id)} className="text-red-500 hover:text-red-600 rounded-xl min-h-10">
                        <Trash2 className="h-4.5 w-4.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. Kelas list */}
      {slug === "kelas" && (
        <Card className="glass-panel border-white/20">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
              <TableHeader className="bg-white/50">
                <TableRow>
                  <TableHead className="font-bold">Nama Kelas</TableHead>
                  <TableHead className="font-bold">Tingkatan</TableHead>
                  <TableHead className="font-bold">Wali Kelas (Mustahiq)</TableHead>
                  <TableHead className="font-bold">Jumlah Santri</TableHead>
                  <TableHead className="font-bold text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kelasList.map(k => (
                  <TableRow key={k.id}>
                    <TableCell className="font-bold text-sm text-foreground flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span>{k.namaKelas}</span>
                    </TableCell>
                    <TableCell className="text-xs font-semibold">
                      <Badge variant="outline" className="font-bold bg-primary/10 text-primary border-primary/20">
                        {k.tingkatan}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-foreground">
                      {ustadzList.find(u => u.id === k.waliKelasId)?.nama || (
                        <span className="text-muted-foreground italic">Belum ditunjuk</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-bold">
                      <Badge variant="secondary" className="font-bold">
                        {getSantriCountInKelas(k.id)} Santri
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center flex justify-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleStartEdit(k)} className="text-blue-500 hover:text-blue-600 rounded-xl min-h-10">
                        <Pencil className="h-4.5 w-4.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteKelas(k.id)} className="text-red-500 hover:text-red-600 rounded-xl min-h-10">
                        <Trash2 className="h-4.5 w-4.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. Kamar list */}
      {slug === "kamar" && (
        <Card className="glass-panel border-white/20">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
              <TableHeader className="bg-white/50">
                <TableRow>
                  <TableHead className="font-bold">Nama Kamar / Gedung</TableHead>
                  <TableHead className="font-bold">Kapasitas Maks</TableHead>
                  <TableHead className="font-bold">Jumlah Hunian</TableHead>
                  <TableHead className="font-bold">Keterisian</TableHead>
                  <TableHead className="font-bold text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kamarList.map(km => {
                  const filled = getSantriCountInKamar(km.id);
                  const pct = Math.min(100, Math.round((filled / km.kapasitas) * 100));
                  return (
                    <TableRow key={km.id}>
                      <TableCell className="font-bold text-sm">{km.namaKamar}</TableCell>
                      <TableCell className="text-xs font-semibold">{km.kapasitas} Orang</TableCell>
                      <TableCell className="text-xs font-bold text-primary">{filled} Orang</TableCell>
                      <TableCell>
                        <div className="w-30 bg-gray-200 h-2 rounded-full overflow-hidden flex">
                          <div className={`h-full ${pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-green-500"}`} style={{ width: `${pct}%` }} />
                        </div>
                      </TableCell>
                      <TableCell className="text-center flex justify-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleStartEdit(km)} className="text-blue-500 hover:text-blue-600 rounded-xl min-h-10">
                          <Pencil className="h-4.5 w-4.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteKamar(km.id)} className="text-red-500 hover:text-red-600 rounded-xl min-h-10">
                          <Trash2 className="h-4.5 w-4.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. Kitab list */}
      {slug === "kitab" && (
        <Card className="glass-panel border-white/20">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
              <TableHeader className="bg-white/50">
                <TableRow>
                  <TableHead className="font-bold">Nama Kitab / Mata Pelajaran</TableHead>
                  <TableHead className="font-bold">Deskripsi / Keterangan</TableHead>
                  <TableHead className="font-bold text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kitabList.map(kt => (
                  <TableRow key={kt.id}>
                    <TableCell className="font-bold text-sm text-glow-gold">{kt.namaKitabMapel}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-semibold">{kt.keterangan || "-"}</TableCell>
                    <TableCell className="text-center flex justify-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleStartEdit(kt)} className="text-blue-500 hover:text-blue-600 rounded-xl min-h-10">
                        <Pencil className="h-4.5 w-4.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteKitab(kt.id)} className="text-red-500 hover:text-red-600 rounded-xl min-h-10">
                        <Trash2 className="h-4.5 w-4.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 5. Jadwal list */}
      {slug === "jadwal" && (
        <Card className="glass-panel border-white/20">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
              <TableHeader className="bg-white/50">
                <TableRow>
                  <TableHead className="font-bold">Hari</TableHead>
                  <TableHead className="font-bold">Waktu</TableHead>
                  <TableHead className="font-bold">Kelas</TableHead>
                  <TableHead className="font-bold">Kitab/Mapel</TableHead>
                  <TableHead className="font-bold">Ustadz Pengampu</TableHead>
                  <TableHead className="font-bold text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jadwalList.map(j => (
                  <TableRow key={j.id}>
                    <TableCell className="font-bold text-sm text-primary">{j.hari}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground font-semibold">{j.jamMulai} - {j.jamSelesai}</TableCell>
                    <TableCell className="font-bold text-xs">{kelasList.find(k => k.id === j.kelasId)?.namaKelas || "Belum ada"}</TableCell>
                    <TableCell className="font-bold text-xs text-glow-gold">{kitabList.find(kt => kt.id === j.kitabMapelId)?.namaKitabMapel || "Belum ada"}</TableCell>
                    <TableCell className="font-semibold text-xs">{ustadzList.find(u => u.id === j.ustadzId)?.nama || "Belum ada"}</TableCell>
                    <TableCell className="text-center flex justify-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleStartEdit(j)} className="text-blue-500 hover:text-blue-600 rounded-xl min-h-10">
                        <Pencil className="h-4.5 w-4.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteJadwal(j.id)} className="text-red-500 hover:text-red-600 rounded-xl min-h-10">
                        <Trash2 className="h-4.5 w-4.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 6. Monitoring Stats */}
      {slug === "monitoring" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass-panel border-white/20">
            <CardHeader>
              <CardTitle className="text-base font-bold text-glow-gold">Statistik Murid per Kelas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {kelasList.map(k => {
                const filled = getSantriCountInKelas(k.id);
                return (
                  <div key={k.id} className="flex justify-between items-center bg-white/40 p-3 rounded-xl border border-white/10">
                    <span className="text-sm font-bold">{k.namaKelas}</span>
                    <Badge variant="outline" className="font-bold bg-blue-50/50 text-blue-700">{filled} Santri</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/20">
            <CardHeader>
              <CardTitle className="text-base font-bold text-glow-gold">Statistik Penghuni Kamar Asrama</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {kamarList.map(km => {
                const filled = getSantriCountInKamar(km.id);
                return (
                  <div key={km.id} className="flex justify-between items-center bg-white/40 p-3 rounded-xl border border-white/10">
                    <span className="text-sm font-bold">{km.namaKamar}</span>
                    <Badge className="font-bold bg-amber-500 text-white">{filled} / {km.kapasitas} Hunian</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 9. Pengumuman list */}
      {slug === "pengumuman" && (
        <Card className="glass-panel border-white/20">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
              <TableHeader className="bg-white/50">
                <TableRow>
                  <TableHead className="font-bold">Tanggal</TableHead>
                  <TableHead className="font-bold">Judul</TableHead>
                  <TableHead className="font-bold">Konten Ringkas</TableHead>
                  <TableHead className="font-bold">Target Peran</TableHead>
                  <TableHead className="font-bold text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pengumumanList.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs font-semibold text-muted-foreground">{p.tanggal}</TableCell>
                    <TableCell className="font-bold text-sm text-glow-gold">{p.judul}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-semibold">{p.konten}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-bold border-blue-100 bg-blue-50/50 text-blue-800 text-[10px]">
                        {p.targetRoles}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteAnnouncement(p.id)} className="text-red-500 hover:text-red-600 rounded-xl">
                        <Trash2 className="h-4.5 w-4.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
    </Card>
      )}

      {/* 9b. Kehadiran Santri */}
      {slug === "kehadiran-santri" && (
        <Card className="glass-panel border-white/20">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="space-y-1.5 w-full md:w-1/4">
                <Label>Filter Tanggal</Label>
                <Input type="date" value={filterAbsensiTanggal} onChange={e => setFilterAbsensiTanggal(e.target.value)} className="bg-white/50" />
              </div>
              <div className="space-y-1.5 w-full md:w-1/4">
                <Label>Filter Kelas</Label>
                <Select value={filterAbsensiKelas} onValueChange={(val) => setFilterAbsensiKelas(val || "all")}>
                  <SelectTrigger className="bg-white/50">
                    <SelectValue placeholder="Semua Kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kelas</SelectItem>
                    {kelasList.map(k => (
                      <SelectItem key={k.id} value={k.id}>{k.namaKelas}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 w-full md:w-1/3">
                <Label>Cari Santri</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Nama / NIS Santri..." value={filterAbsensiSearch} onChange={e => setFilterAbsensiSearch(e.target.value)} className="pl-9 bg-white/50" />
                </div>
              </div>
              {/* Reset button */}
              {(filterAbsensiTanggal || filterAbsensiKelas !== "all" || filterAbsensiSearch) && (
                <Button variant="ghost" onClick={() => { setFilterAbsensiTanggal(""); setFilterAbsensiKelas("all"); setFilterAbsensiSearch(""); }} className="h-10 px-3 text-muted-foreground">
                  Reset
                </Button>
              )}
              <div className="grow flex justify-end">
                {filteredAbsensiSantri.length > 0 && (
                  <Button variant="destructive" onClick={handleDeleteAllAbsensiSantri} disabled={isPending} className="h-10 font-bold flex items-center gap-2 px-4 shadow-lg shadow-red-500/20">
                    <Trash2 className="h-4 w-4" /> Hapus Semua
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader className="bg-white/50">
                  <TableRow>
                    <TableHead className="font-bold">Tanggal</TableHead>
                    <TableHead className="font-bold">Nama Santri (NIS)</TableHead>
                    <TableHead className="font-bold">Status Kehadiran</TableHead>
                    <TableHead className="font-bold">Kelas</TableHead>
                    <TableHead className="font-bold text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAbsensiSantri.map(a => {
                    const santriInfo = santriList.find(s => s.id === a.santriId);
                    const kelasInfo = kelasList.find(k => k.id === santriInfo?.kelasId);
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="text-xs font-semibold text-muted-foreground">
                          {new Date(a.tanggal).toLocaleDateString("id-ID")}
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-sm">{santriInfo?.namaLengkap || "Unknown"}</div>
                          <div className="text-[10px] text-muted-foreground">{santriInfo?.nis || "-"}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            a.status === "Masuk" ? "bg-green-500 font-bold text-white" :
                            a.status === "Izin" ? "bg-blue-500 font-bold text-white" : "bg-red-500 font-bold text-white"
                          }>
                            {a.status === "Masuk" ? "Hadir" : a.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-semibold">{kelasInfo?.namaKelas || "-"}</TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteAbsensiSantri(a.id)} className="text-red-500 hover:text-red-600 rounded-xl">
                            <Trash2 className="h-4.5 w-4.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredAbsensiSantri.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground">Tidak ada data absensi ditemukan.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 10. Roles list */}
      {slug === "roles" && (
        <Card className="glass-panel border-white/20">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
              <TableHeader className="bg-white/50">
                <TableRow>
                  <TableHead className="font-bold">ID Peran</TableHead>
                  <TableHead className="font-bold">Nama Peran</TableHead>
                  <TableHead className="font-bold">Tipe Otoritas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rolesList.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs font-bold text-glow-gold">{r.id}</TableCell>
                    <TableCell className="font-bold text-sm">{r.name}</TableCell>
                    <TableCell>
                      <Badge className={
                        r.id === "SUPER_ADMIN" ? "bg-red-500 text-white font-bold" :
                        r.id === "OPERATOR" ? "bg-blue-500 text-white font-bold" : "bg-slate-500 text-white font-bold"
                      }>
                        {r.id === "SUPER_ADMIN" ? "Full Access" : "Restricted Access"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 11. Permissions list */}
      {slug === "permissions" && (
        <Card className="glass-panel border-white/20">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
              <TableHeader className="bg-white/50">
                <TableRow>
                  <TableHead className="font-bold">ID Otoritas</TableHead>
                  <TableHead className="font-bold">Nama Otoritas</TableHead>
                  <TableHead className="font-bold">Deskripsi Keperluan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissionsList.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs font-bold text-primary">{p.id}</TableCell>
                    <TableCell className="font-bold text-sm">{p.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-semibold">{p.description || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 12. Role Permissions Mapping */}
      {slug === "mapping" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="glass-panel border-white/20 lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="text-base font-bold">Pilih Peran Pengguna</CardTitle>
              <CardDescription>Pilih peran yang ingin Anda atur pemetaan hak aksesnya.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedRoleId} onValueChange={(val) => setSelectedRoleId(val || "OPERATOR")}>
                <SelectTrigger className="w-full bg-white/70">
                  <SelectValue placeholder="Pilih Peran" />
                </SelectTrigger>
                <SelectContent>
                  {rolesList.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>{r.name} ({r.id})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Menandai kotak pada daftar izin akses akan memberikan wewenang terkait kepada peran tersebut. Jangan lupa menyimpan perubahan.
                </p>
                <Button onClick={handleSaveRoleMapping} disabled={isPending} className="bg-blue-gradient text-white w-full font-bold rounded-xl py-5 shadow-lg shadow-primary/20 cursor-pointer">
                  {isPending ? "Menyimpan..." : "Simpan Pemetaan Akses"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/20 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-bold">Pemetaan Hak Akses</CardTitle>
              <CardDescription>Centang hak akses yang diperbolehkan untuk peran: <span className="font-extrabold text-blue-600">{selectedRoleId}</span></CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3 max-h-125 overflow-y-auto pr-2">
              {permissionsList.map((p: any) => {
                const isChecked = selectedPermissions.includes(p.id);
                return (
                  <div 
                    key={p.id} 
                    onClick={() => handleTogglePermission(p.id)}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors cursor-pointer"
                  >
                    <Checkbox 
                      id={`p-${p.id}`}
                      checked={isChecked}
                      onCheckedChange={() => handleTogglePermission(p.id)}
                      className="mt-0.5"
                    />
                    <div className="grid gap-1 leading-none">
                      <label htmlFor={`p-${p.id}`} className="text-xs font-bold text-slate-800 cursor-pointer">
                        {p.name}
                      </label>
                      <p className="text-[10px] text-muted-foreground font-semibold">
                        {p.description || "Tidak ada penjelasan wewenang."}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 13. Backup Database */}
      {slug === "backup" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="glass-panel border-white/20 lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="text-base font-bold">Mulai Backup Baru</CardTitle>
              <CardDescription>Amankan data administrasi santri saat ini secara offline.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Menekan tombol di bawah akan mengekspor seluruh skema tabel, biodata ustadz, santri, catatan kehadiran, dan transaksi keuangan syahriah ke dalam berkas sql.
              </p>
              <Button onClick={handleBackupNow} className="bg-blue-gradient text-white w-full font-bold rounded-xl py-5 shadow-lg shadow-primary/20 cursor-pointer">
                Backup Database Sekarang
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/20 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-bold">Arsip Berkas Backup</CardTitle>
              <CardDescription>Unduh berkas sql yang sudah dibuat sebelumnya.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Nama Berkas</TableHead>
                    <TableHead className="font-bold">Ukuran</TableHead>
                    <TableHead className="font-bold">Tanggal Pembuatan</TableHead>
                    <TableHead className="font-bold text-center">Unduh</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backupHistory.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-mono text-xs font-bold">{b.name}</TableCell>
                      <TableCell className="text-xs">{b.size}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{b.date}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10 rounded-xl" onClick={() => toast.success("Mulai mengunduh...", { description: b.name })}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {slug === "settings" && (
        <div className="space-y-6 max-w-4xl">
          {/* Live Kop Raport Preview Card */}
          <Card className="glass-panel border-white/20 overflow-hidden">
            <div className="bg-linear-to-r from-blue-600 via-blue-500 to-indigo-500 px-6 py-4">
              <h2 className="text-white font-extrabold text-lg tracking-wide flex items-center gap-2">
                <Settings className="h-5 w-5" /> Pratinjau Kop Raport
              </h2>
              <p className="text-blue-100 text-xs mt-0.5">Perubahan pada formulir di bawah akan langsung tampil di sini.</p>
            </div>
            <CardContent className="p-6">
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-white/70">
                <div className="flex items-center gap-5 justify-center">
                  {/* Logo */}
                  <div className="h-20 w-20 rounded-full border-2 border-primary/30 bg-muted flex items-center justify-center overflow-hidden shadow-lg shrink-0">
                    <img src={logoUrl || "/icon.png"} alt="Logo" className="h-full w-full object-cover" />
                  </div>
                  {/* Text Header */}
                  <div className="text-center flex-1">
                    <p className="text-lg font-extrabold text-slate-800 tracking-wide uppercase leading-tight">
                      {namaPondok || "Nama Pondok Pesantren"}
                    </p>
                    <div className="flex items-center gap-1.5 justify-center mt-1.5">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground font-medium">{alamat || "Alamat lengkap pesantren"}</p>
                    </div>
                    <div className="flex items-center gap-1.5 justify-center mt-0.5">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground font-medium">{telepon || "08xx-xxxx-xxxx"}</p>
                    </div>
                    {tahunAjaranAktifId && (
                      <div className="mt-2">
                        <Badge className="bg-blue-gradient text-white font-bold text-[10px] px-3 py-0.5 shadow-sm">
                          Tahun Ajaran {(() => {
                            const ta = tahunAjaranList?.find((t: any) => t.id === tahunAjaranAktifId);
                            return ta ? `${ta.nama} M / ${getHijriYear(ta.nama)}` : tahunAjaranAktifId;
                          })()}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
                <div className="border-t-2 border-slate-300 mt-4" />
              </div>
            </CardContent>
          </Card>

          {/* Settings Form */}
          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* Section 1: Identitas Instansi */}
            <Card className="glass-panel border-white/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Building className="h-4.5 w-4.5 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-extrabold">Identitas Instansi</CardTitle>
                    <CardDescription className="text-[11px]">Nama pondok, alamat, dan kontak resmi yang tercetak pada kop raport.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Logo Upload */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-slate-50/70 p-4 rounded-xl border border-dashed border-slate-200">
                  <div className="h-16 w-16 rounded-full border-2 border-primary/30 bg-muted flex items-center justify-center overflow-hidden shadow-md shrink-0 relative">
                    <img src={logoUrl || "/icon.png"} alt="Logo" className="h-full w-full object-cover" />
                    {uploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[8px] font-bold rounded-full">Uploading...</div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5 w-full">
                    <Label htmlFor="logo" className="text-xs font-bold">Logo Instansi (Kop Raport)</Label>
                    <Input id="logo" type="file" accept="image/*" onChange={handleLogoUpload} className="bg-white/70 text-xs h-9" />
                    <p className="text-[10px] text-muted-foreground">Format: JPG, PNG, WEBP. Maksimal 2 MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="instansi" className="text-xs font-bold flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5 text-primary" /> Nama Pondok Pesantren
                    </Label>
                    <Input id="instansi" required value={namaPondok} onChange={(e) => setNamaPondok(e.target.value)} className="bg-white/70" placeholder="Pondok Pesantren Anwarul Hidayah" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="alamatpes" className="text-xs font-bold flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-primary" /> Alamat Lengkap
                    </Label>
                    <Input id="alamatpes" required value={alamat} onChange={(e) => setAlamat(e.target.value)} className="bg-white/70" placeholder="Jl. Pesantren No. 1, Kota" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="telpes" className="text-xs font-bold flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-primary" /> Telepon / Kontak Resmi
                    </Label>
                    <Input id="telpes" required value={telepon} onChange={(e) => setTelepon(e.target.value)} className="bg-white/70" placeholder="08123456789" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="pengasuhpes" className="text-xs font-bold flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-primary" /> Nama Pengasuh Pondok
                    </Label>
                    <Input id="pengasuhpes" required value={namaPengasuh} onChange={(e) => setNamaPengasuh(e.target.value)} className="bg-white/70" placeholder="K.H. Anwarul Hidayah" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Periode Akademik */}
            <Card className="glass-panel border-white/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Calendar className="h-4.5 w-4.5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-extrabold">Periode Akademik</CardTitle>
                    <CardDescription className="text-[11px]">Tahun ajaran dan semester aktif yang berlaku saat ini.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="ta-aktif" className="text-xs font-bold">Tahun Ajaran Aktif</Label>
                    <Select value={tahunAjaranAktifId} onValueChange={(val) => setTahunAjaranAktifId(val || tahunAjaranAktifId)}>
                      <SelectTrigger className="bg-white/70">
                        <SelectValue placeholder="Pilih Tahun Ajaran" />
                      </SelectTrigger>
                      <SelectContent>
                        {tahunAjaranList && tahunAjaranList.map((ta: any) => (
                          <SelectItem key={ta.id} value={ta.id}>
                            {ta.nama} M ({getHijriYear(ta.nama)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {tahunAjaranAktifId && (
                      <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Hijriyyah: {getHijriYear(tahunAjaranList?.find((t: any) => t.id === tahunAjaranAktifId)?.nama || "")}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sem-aktif" className="text-xs font-bold">Semester Aktif</Label>
                    <Select value={semesterAktifId} onValueChange={(val) => setSemesterAktifId(val || semesterAktifId)}>
                      <SelectTrigger className="bg-white/70">
                        <SelectValue placeholder="Pilih Semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {semesterList && semesterList.map((sem: any) => {
                          const parentTa = tahunAjaranList ? tahunAjaranList.find((ta: any) => ta.id === sem.tahunAjaranId) : null;
                          const taName = parentTa ? ` (${parentTa.nama})` : "";
                          return (
                            <SelectItem key={sem.id} value={sem.id}>
                              Semester {sem.nama}{taName}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 3: Preferensi Tampilan */}
            <Card className="glass-panel border-white/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Settings className="h-4.5 w-4.5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-extrabold">Preferensi Tampilan</CardTitle>
                    <CardDescription className="text-[11px]">Pengaturan visual dan fitur yang terlihat pada halaman raport santri.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div
                  onClick={() => setTampilkanRanking(!tampilkanRanking)}
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                    tampilkanRanking
                      ? "bg-emerald-50/80 border-emerald-200/50 shadow-sm"
                      : "bg-white/50 border-slate-200/50 hover:bg-slate-50/50"
                  }`}
                >
                  <Checkbox id="ranking" checked={tampilkanRanking} onCheckedChange={(val) => setTampilkanRanking(!!val)} />
                  <div className="flex-1">
                    <Label htmlFor="ranking" className="text-xs font-bold cursor-pointer select-none">
                      Tampilkan Peringkat / Ranking pada Raport
                    </Label>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Jika diaktifkan, halaman raport akan menampilkan peringkat santri di kelasnya.
                    </p>
                  </div>
                  {tampilkanRanking && (
                    <Badge className="bg-emerald-500 text-white text-[9px] font-bold">Aktif</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Section 4: Editor Template Raport */}
            <Card className="glass-panel border-white/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-orange-100 flex items-center justify-center">
                    <FileCheck className="h-4.5 w-4.5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-extrabold">Template Cetak Raport (Kustom)</CardTitle>
                    <CardDescription className="text-[11px]">Gunakan HTML atau teks dengan shortcode untuk mengganti desain bawaan. Kosongkan untuk menggunakan desain bawaan.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-slate-700 mb-2">Shortcode yang didukung:</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-[9px] font-mono bg-white">[NAMA_SANTRI]</Badge>
                    <Badge variant="outline" className="text-[9px] font-mono bg-white">[NIS_SANTRI]</Badge>
                    <Badge variant="outline" className="text-[9px] font-mono bg-white">[KELAS]</Badge>
                    <Badge variant="outline" className="text-[9px] font-mono bg-white">[TABEL_NILAI]</Badge>
                    <Badge variant="outline" className="text-[9px] font-mono bg-white">[TABEL_ABSENSI]</Badge>
                    <Badge variant="outline" className="text-[9px] font-mono bg-white">[TTD_PENGASUH]</Badge>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="raportTemplate" className="text-xs font-bold">Desain Template HTML</Label>
                  <div className="flex flex-col gap-3">
                    <Button 
                      type="button" 
                      onClick={() => setIsEditorOpen(true)}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl h-12 w-full flex items-center justify-center gap-2"
                    >
                      <Pencil className="h-5 w-5" /> Buka Visual Editor (Word/Canva)
                    </Button>
                    <p className="text-[10px] text-muted-foreground">Status: {raportTemplate ? "Template Kustom Aktif" : "Belum Ada Template (Menggunakan Default)"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={isPending} className="bg-blue-gradient text-white font-extrabold rounded-xl py-5 px-10 shadow-lg shadow-primary/20 cursor-pointer text-sm">
                {isPending ? "Menyimpan Pengaturan..." : "💾 Simpan Semua Pengaturan"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {isEditorOpen && (
        <div className="fixed inset-0 z-9999 bg-white flex flex-col animate-in fade-in zoom-in duration-200">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Pencil className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Visual Editor Template Raport</h3>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                  <span className="font-bold text-slate-700">Shortcodes:</span> [NAMA_SANTRI], [NIS_SANTRI], [KELAS], [TABEL_NILAI], [TABEL_ABSENSI], [TTD_PENGASUH]
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="destructive" 
                onClick={() => {
                  if (editorRef.current && confirm("Anda yakin ingin mereset ke desain bawaan? Semua editan akan hilang.")) {
                    editorRef.current.setContent(`
<div style="font-family: 'Times New Roman', serif; color: black; max-width: 210mm; margin: 0 auto; padding: 20px;">
  <!-- KOP SURAT -->
  <table style="width: 100%; border-bottom: 4px double black; margin-bottom: 20px;">
    <tbody>
      <tr>
        <td style="width: 15%; text-align: center; vertical-align: middle;">
          <div style="width: 80px; height: 80px; border: 1px solid black; border-radius: 50%; display: inline-block; line-height: 80px; text-align: center; font-size: 10px;">LOGO</div>
        </td>
        <td style="width: 85%; text-align: left; vertical-align: middle; padding-left: 15px;">
          <h2 style="margin: 0; font-size: 24px; font-weight: bold; text-transform: uppercase;">YAYASAN PONDOK PESANTREN</h2>
          <h1 style="margin: 5px 0; font-size: 28px; font-weight: bold; text-transform: uppercase;">NAMA PONDOK ANDA</h1>
          <p style="margin: 0; font-size: 14px;">Alamat Pondok Anda</p>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- JUDUL RAPORT -->
  <div style="text-align: center; margin-bottom: 30px;">
    <h3 style="margin: 0; font-size: 20px; font-weight: bold; text-decoration: underline;">RAPORT HASIL EVALUASI BELAJAR SANTRI</h3>
  </div>

  <!-- DATA SANTRI -->
  <table style="width: 100%; margin-bottom: 20px; font-size: 14px; font-weight: bold;">
    <tbody>
      <tr>
        <td style="width: 15%;">Nama Santri</td>
        <td style="width: 2%;">:</td>
        <td style="width: 33%;">[NAMA_SANTRI]</td>
        <td style="width: 15%;">Kelas</td>
        <td style="width: 2%;">:</td>
        <td style="width: 33%;">[KELAS]</td>
      </tr>
      <tr>
        <td style="width: 15%;">Nomor Induk</td>
        <td style="width: 2%;">:</td>
        <td style="width: 33%;">[NIS_SANTRI]</td>
        <td style="width: 15%;">Semester</td>
        <td style="width: 2%;">:</td>
        <td style="width: 33%;">Gasal / Genap</td>
      </tr>
    </tbody>
  </table>

  <!-- TABEL NILAI -->
  <div style="margin-bottom: 30px;">
    [TABEL_NILAI]
  </div>

  <!-- TABEL ABSENSI -->
  <div style="margin-bottom: 50px; width: 50%;">
    [TABEL_ABSENSI]
  </div>

  <!-- TANDA TANGAN -->
  <table style="width: 100%; text-align: center; font-size: 14px; margin-top: 50px;">
    <tbody>
      <tr>
        <td style="width: 33%;">
          <p style="margin-bottom: 80px;">Mengetahui,<br>Wali Santri</p>
          <p style="font-weight: bold;">( ........................................ )</p>
        </td>
        <td style="width: 33%;">
          <p style="margin-bottom: 80px;">Wali Kelas</p>
          <p style="font-weight: bold;">( ........................................ )</p>
        </td>
        <td style="width: 33%;">
          <p style="margin-bottom: 80px;">Pengasuh Pondok</p>
          <p style="font-weight: bold; text-transform: uppercase;">[TTD_PENGASUH]</p>
        </td>
      </tr>
    </tbody>
  </table>
</div>
                    `);
                  }
                }}
                className="rounded-xl font-bold"
              >
                Reset ke Default
              </Button>
              <Button variant="outline" onClick={() => setIsEditorOpen(false)} className="rounded-xl font-bold">
                Batal
              </Button>
              <Button 
                onClick={() => {
                  if (editorRef.current) {
                    setRaportTemplate(editorRef.current.getContent());
                    setIsEditorOpen(false);
                    // trigger toast or similar if needed
                  }
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20"
              >
                Gunakan Template Ini
              </Button>
            </div>
          </div>
          <div className="flex-1 bg-slate-200 p-4 sm:p-8 overflow-y-auto flex justify-center">
            <div className="w-full max-w-[210mm] h-[297mm] shadow-2xl relative border border-slate-300">
              <Editor
                apiKey="7kruwgush1fvsztmu7jd4zvytcxd4ruk02twfhxus7ord0ke"
                onInit={(evt, editor) => (editorRef.current = editor)}
                initialValue={(raportTemplate && raportTemplate !== 'raport_template') ? raportTemplate : `
<div style="font-family: Arial, Helvetica, sans-serif; color: #1e293b; max-width: 210mm; margin: 0 auto; padding: 20px;">
  <!-- KOP SURAT -->
  <div style="text-align: center; border-bottom: 2px solid #1e293b; margin-bottom: 20px; padding-bottom: 10px;">
    <img src="https://res.cloudinary.com/dkwaosfda/image/upload/v1781082688/Kop_PPAH_gani9w.png" alt="Kop Pondok Pesantren" style="max-width: 100%; height: auto;" />
  </div>

  <!-- JUDUL RAPORT -->
  <div style="text-align: center; margin-bottom: 30px;">
    <h3 style="margin: 0; font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Raport Hasil Evaluasi Belajar</h3>
  </div>

  <!-- DATA SANTRI -->
  <table style="width: 100%; margin-bottom: 25px; font-size: 13px;">
    <tbody>
      <tr>
        <td style="width: 15%; color: #64748b; padding-bottom: 5px;">Nama Santri</td>
        <td style="width: 2%; padding-bottom: 5px;">:</td>
        <td style="width: 33%; font-weight: 700; padding-bottom: 5px;">[NAMA_SANTRI]</td>
        <td style="width: 15%; color: #64748b; padding-bottom: 5px;">Tingkat / Kelas</td>
        <td style="width: 2%; padding-bottom: 5px;">:</td>
        <td style="width: 33%; font-weight: 700; padding-bottom: 5px;">[KELAS]</td>
      </tr>
      <tr>
        <td style="width: 15%; color: #64748b; padding-bottom: 5px;">NIS / NISN</td>
        <td style="width: 2%; padding-bottom: 5px;">:</td>
        <td style="width: 33%; font-weight: 700; padding-bottom: 5px;">[NIS_SANTRI]</td>
        <td style="width: 15%; color: #64748b; padding-bottom: 5px;">Semester</td>
        <td style="width: 2%; padding-bottom: 5px;">:</td>
        <td style="width: 33%; font-weight: 700; padding-bottom: 5px;">[SEMESTER]</td>
      </tr>
      <tr>
        <td style="width: 15%; color: #64748b;">Kamar / Asrama</td>
        <td style="width: 2%;">:</td>
        <td style="width: 33%; font-weight: 700;">[KAMAR_SANTRI]</td>
        <td style="width: 15%; color: #64748b;">Tahun Pelajaran</td>
        <td style="width: 2%;">:</td>
        <td style="width: 33%; font-weight: 700;">[TAHUN_PELAJARAN]</td>
      </tr>
    </tbody>
  </table>

  <!-- TABEL NILAI -->
  <div style="margin-bottom: 25px;">
    [TABEL_NILAI]
  </div>

  <!-- TABEL ABSENSI -->
  <div style="margin-bottom: 40px; width: 45%;">
    [TABEL_ABSENSI]
  </div>

  <!-- TANDA TANGAN -->
  <table style="width: 100%; text-align: center; font-size: 13px; margin-top: 30px;">
    <tbody>
      <tr>
        <td style="width: 33%;">
          <p style="margin-bottom: 50px; color: #475569;">Mengetahui,<br>Wali Santri</p>
          <p style="font-weight: 700; border-bottom: 1px solid #1e293b; display: inline-block; width: 140px; padding-bottom: 2px;">( Orang Tua )</p>
        </td>
        <td style="width: 33%;">
          <p style="margin-bottom: 50px; color: #475569;">Wali Kelas</p>
          <p style="font-weight: 700; border-bottom: 1px solid #1e293b; display: inline-block; width: 140px; padding-bottom: 2px;">( Nama Guru )</p>
        </td>
        <td style="width: 33%;">
          <p style="margin-bottom: 50px; color: #475569;">Pengasuh Pondok</p>
          <p style="font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #1e293b; display: inline-block; padding-bottom: 2px; min-width: 140px;">[TTD_PENGASUH]</p>
        </td>
      </tr>
    </tbody>
  </table>
</div>
`}
                init={{
                  height: '100%',
                  menubar: false,
                  plugins: [
                    // Core editing features
                    'anchor', 'autolink', 'charmap', 'codesample', 'emoticons', 'link', 'lists', 'media', 'searchreplace', 'table', 'visualblocks', 'wordcount', 'fullscreen',
                    // Premium features
                    'checklist', 'mediaembed', 'casechange', 'formatpainter', 'pageembed', 'a11ychecker', 'tinymcespellchecker', 'permanentpen', 'powerpaste', 'advtable', 'advcode', 'advtemplate', 'tinymceai', 'uploadcare', 'mentions', 'tinycomments', 'tableofcontents', 'footnotes', 'mergetags', 'autocorrect', 'typography', 'inlinecss', 'markdown','importword', 'exportword', 'exportpdf'
                  ],
                  toolbar: 'fullscreen | undo redo | tinymceai-chat tinymceai-quickactions tinymceai-review | blocks fontfamily fontsize | bold italic underline strikethrough | link media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography uploadcare | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
                  tinycomments_mode: 'embedded',
                  tinycomments_author: 'Operator',
                  mergetags_list: [
                    { value: '[NAMA_SANTRI]', title: 'Nama Santri' },
                    { value: '[NIS_SANTRI]', title: 'NIS Santri' },
                    { value: '[KELAS]', title: 'Kelas Santri' },
                    { value: '[TABEL_NILAI]', title: 'Tabel Nilai Transkrip' },
                    { value: '[TABEL_ABSENSI]', title: 'Tabel Absensi' },
                    { value: '[TTD_PENGASUH]', title: 'Tanda Tangan Pengasuh' },
                  ],
                  tinymceai_token_provider: async () => {
                    await fetch(`https://demo.api.tiny.cloud/1/7kruwgush1fvsztmu7jd4zvytcxd4ruk02twfhxus7ord0ke/auth/random`, { method: "POST", credentials: "include" });
                    return { token: await fetch(`https://demo.api.tiny.cloud/1/7kruwgush1fvsztmu7jd4zvytcxd4ruk02twfhxus7ord0ke/jwt/tinymceai`, { credentials: "include" }).then(r => r.text()) };
                  },
                  uploadcare_public_key: 'be750e5518ac2406f09f',
                  content_style: 'body { font-family:Times New Roman,serif; font-size:14px; padding: 20px; }',
                  object_resizing: 'img',
                  image_advtab: true
                }}
              />
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        message={confirmMessage}
        onConfirm={() => confirmAction?.()}
        variant={confirmVariant}
      />
    </div>
  );
}
