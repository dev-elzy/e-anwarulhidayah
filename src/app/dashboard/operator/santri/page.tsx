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
import { PlusCircle, Search, Trash2, GraduationCap, Filter, Pencil, Download, Upload, FileSpreadsheet, FileUp } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SantriPage() {
  const { data: session } = useSession();
  const [list, setList] = useState<any[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [kamarList, setKamarList] = useState<any[]>([]);
  
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState("all");
  const [kelasFilter, setKelasFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Status Alumni Dialog state
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusSantri, setStatusSantri] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState<"BOYONG" | "LULUS">("LULUS");
  const [tahunKeluarInput, setTahunKeluarInput] = useState(new Date().getFullYear().toString());

  const handleOpenStatusDialog = (s: any) => {
    setStatusSantri(s);
    setNewStatus("LULUS");
    setTahunKeluarInput(new Date().getFullYear().toString());
    setStatusDialogOpen(true);
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusSantri || !session?.user?.id) return;
    
    startTransition(async () => {
      const res = await apiPost("changeSantriStatus", {
        id: statusSantri.id,
        params: {
          status: newStatus,
          tahunKeluar: tahunKeluarInput
        }
      });
      if (res.error) {
        toast.error("Gagal", { description: res.error });
      } else {
        toast.success("Berhasil", { description: res.message });
        setStatusDialogOpen(false);
        loadData();
      }
    });
  };

  // Import/Export state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importMode, setImportMode] = useState<"choose" | "importing">("choose");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ inserted: number; errors: string[] } | null>(null);

  const handleStartEdit = (s: any) => {
    setEditingItem(s);
    setNis(s.nis);
    setNamaLengkap(s.namaLengkap);
    setJenisKelamin(s.jenisKelamin);
    setTempatLahir(s.tempatLahir);
    setTanggalLahir(s.tanggalLahir);
    setAlamat(s.alamat);
    setNamaAyah(s.namaAyah);
    setNamaIbu(s.namaIbu);
    setNomorHpWali(s.nomorHpWali);
    setKelasId(s.kelasId || "");
    setKamarId(s.kamarId || "");
    setTahunMasuk(s.tahunMasuk);
    setFotoUrl(s.fotoUrl || "");
    setDialogOpen(true);
  };

  // Confirmation states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState("");

  const askConfirmation = (message: string, action: () => void) => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  // Form states
  const [nis, setNis] = useState("");
  const [namaLengkap, setNamaLengkap] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState("L");
  const [tempatLahir, setTempatLahir] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [alamat, setAlamat] = useState("");
  const [namaAyah, setNamaAyah] = useState("");
  const [namaIbu, setNamaIbu] = useState("");
  const [nomorHpWali, setNomorHpWali] = useState("");
  const [kelasId, setKelasId] = useState("");
  const [kamarId, setKamarId] = useState("");
  const [tahunMasuk, setTahunMasuk] = useState("2026");
  const [fotoUrl, setFotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Gagal", { description: "Ukuran file gambar melebihi batas maksimal 5 MB." });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "santri");

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as { url?: string; error?: string };
      if (response.ok && data.url) {
        setFotoUrl(data.url);
        toast.success("Berhasil", { description: "Foto berhasil diunggah." });
      } else {
        toast.error("Gagal", { description: data.error || "Gagal mengunggah gambar." });
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Error", { description: "Gagal menghubungkan ke server untuk upload." });
    } finally {
      setUploading(false);
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (gender && gender !== "all") params.gender = gender;
      if (kelasFilter && kelasFilter !== "all") params.kelasId = kelasFilter;
      const santriData = await apiGet("santri", params);
      setList(santriData);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [search, gender, kelasFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const fetchDependencies = async () => {
      try {
        const [k, km] = await Promise.all([apiGet("kelas"), apiGet("kamar")]);
        setKelasList(k);
        setKamarList(km);
      } catch (e) {
        console.error(e);
      }
    };
    fetchDependencies();
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    startTransition(async () => {
      const santriData = {
        nis, namaLengkap, jenisKelamin, tempatLahir, tanggalLahir,
        alamat, namaAyah, namaIbu, nomorHpWali, kelasId, kamarId, tahunMasuk, fotoUrl
      };
      if (editingItem) {
        const res = await apiPost("updateSantri", { id: editingItem.id, data: santriData });
        if (res.error) {
          toast.error("Gagal", { description: res.error });
        } else {
          toast.success("Berhasil", { description: res.message });
          setDialogOpen(false); setEditingItem(null); setFotoUrl(""); loadData();
        }
      } else {
        const res = await apiPost("createSantri", { data: santriData });
        if (res.error) {
          toast.error("Gagal", { description: res.error });
        } else {
          toast.success("Berhasil", { description: res.message });
          setDialogOpen(false);
          setNis(""); setNamaLengkap(""); setTempatLahir(""); setTanggalLahir("");
          setAlamat(""); setNamaAyah(""); setNamaIbu(""); setNomorHpWali("");
          setKelasId(""); setKamarId(""); setFotoUrl(""); loadData();
        }
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!session?.user?.id) return;
    askConfirmation("Apakah Anda yakin ingin menghapus data santri ini?", () => {
      startTransition(async () => {
        const res = await apiPost("deleteSantri", { id });
        if (res.error) { toast.error("Gagal", { description: res.error }); }
        else { toast.success("Berhasil", { description: res.message }); loadData(); }
      });
    });
  };

  // ---- Export handler
  const handleExport = () => {
    const link = document.createElement("a");
    link.href = "/api/export/santri";
    link.download = `data-santri-${new Date().toISOString().split("T")[0]}.xlsx`;
    link.click();
  };

  // ---- Download template XLSX
  const handleDownloadTemplate = async () => {
    const XLSX = await import("xlsx");
    const headers = [
      "NIS", "Nama Lengkap", "Jenis Kelamin (L/P)", "Tempat Lahir",
      "Tanggal Lahir (YYYY-MM-DD)", "Alamat", "Nama Ayah", "Nama Ibu",
      "No HP Wali", "Kelas", "Kamar", "Tahun Masuk"
    ];
    const sample = [
      "10001", "Ahmad Fauzi", "L", "Jepara",
      "2008-05-12", "Jl. Mawar No.1", "Bapak Ahmad", "Ibu Siti",
      "08123456789", "Kelas A", "Kamar A", "2026"
    ];
    const worksheet = XLSX.utils.aoa_to_sheet([headers, sample]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template Santri");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "template-import-santri.xlsx";
    link.click();
    URL.revokeObjectURL(url);
  };

  // ---- Import XLSX handler
  const handleImport = async () => {
    if (!importFile || !session?.user?.id) return;
    setImportLoading(true);
    try {
      const XLSX = await import("xlsx");
      const data = await importFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rowsRaw: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (rowsRaw.length < 2) {
        toast.error("File kosong atau tidak ada data.");
        setImportLoading(false);
        return;
      }

      const headers = rowsRaw[0].map((h: any) => String(h || "").trim());
      const dataRows = rowsRaw.slice(1);

      const nisIdx = headers.indexOf("NIS");
      const namaLengkapIdx = headers.indexOf("Nama Lengkap");
      const jenisKelaminIdx = headers.indexOf("Jenis Kelamin (L/P)");
      const tempatLahirIdx = headers.indexOf("Tempat Lahir");
      const tanggalLahirIdx = headers.indexOf("Tanggal Lahir (YYYY-MM-DD)");
      const alamatIdx = headers.indexOf("Alamat");
      const namaAyahIdx = headers.indexOf("Nama Ayah");
      const namaIbuIdx = headers.indexOf("Nama Ibu");
      const nomorHpWaliIdx = headers.indexOf("No HP Wali");

      let kelasIdx = headers.indexOf("Kelas");
      if (kelasIdx === -1) kelasIdx = headers.indexOf("Kelas ID");

      let kamarIdx = headers.indexOf("Kamar");
      if (kamarIdx === -1) kamarIdx = headers.indexOf("Kamar ID");

      const tahunMasukIdx = headers.indexOf("Tahun Masuk");

      const parsedRows = dataRows.map((row: any[]) => {
        return {
          nis: nisIdx !== -1 ? String(row[nisIdx] ?? "").trim() : "",
          namaLengkap: namaLengkapIdx !== -1 ? String(row[namaLengkapIdx] ?? "").trim() : "",
          jenisKelamin: jenisKelaminIdx !== -1 ? String(row[jenisKelaminIdx] ?? "L").trim() : "L",
          tempatLahir: tempatLahirIdx !== -1 ? String(row[tempatLahirIdx] ?? "").trim() : "",
          tanggalLahir: tanggalLahirIdx !== -1 ? String(row[tanggalLahirIdx] ?? "").trim() : "",
          alamat: alamatIdx !== -1 ? String(row[alamatIdx] ?? "").trim() : "",
          namaAyah: namaAyahIdx !== -1 ? String(row[namaAyahIdx] ?? "").trim() : "",
          namaIbu: namaIbuIdx !== -1 ? String(row[namaIbuIdx] ?? "").trim() : "",
          nomorHpWali: nomorHpWaliIdx !== -1 ? String(row[nomorHpWaliIdx] ?? "").trim() : "",
          kelas: kelasIdx !== -1 ? String(row[kelasIdx] ?? "").trim() : "",
          kamar: kamarIdx !== -1 ? String(row[kamarIdx] ?? "").trim() : "",
          tahunMasuk: tahunMasukIdx !== -1 ? String(row[tahunMasukIdx] ?? "").trim() : new Date().getFullYear().toString(),
        };
      }).filter(r => r.nis || r.namaLengkap);

      const res = await apiPost("importSantri", { data: parsedRows });
      if (res.error) {
        toast.error("Gagal", { description: res.error });
      } else {
        setImportResult({ inserted: (res as any).inserted, errors: (res as any).errors });
        toast.success(`Import selesai: ${(res as any).inserted} santri berhasil ditambahkan.`);
        loadData();
      }
    } catch (e: any) {
      toast.error("Error membaca file", { description: e.message });
    }
    setImportLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-glow-gold flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-primary" /> Data Santri
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola data biodata, penempatan kelas, dan kamar santri Anwarul Hidayah.
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Export Button */}
          <Button
            variant="outline"
            className="h-8.5 px-2.5 text-xs font-semibold rounded-lg border-emerald-300/80 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 gap-1.5 shrink-0"
            onClick={handleExport}
          >
            <Download className="h-3.5 w-3.5" /> Ekspor
          </Button>

          {/* Import Button */}
          <Button
            variant="outline"
            className="h-8.5 px-2.5 text-xs font-semibold rounded-lg border-blue-300/80 text-blue-700 dark:border-blue-800 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 gap-1.5 shrink-0"
            onClick={() => { setImportDialogOpen(true); setImportMode("choose"); setImportResult(null); setImportFile(null); }}
          >
            <Upload className="h-3.5 w-3.5" /> Impor
          </Button>

          {/* Tambah Santri Dialog */}
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingItem(null);
          }}>
            <DialogTrigger className="h-8.5 px-3 text-xs font-bold rounded-lg bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer shrink-0" onClick={() => {
              setEditingItem(null);
              setNis("");
              setNamaLengkap("");
              setTempatLahir("");
              setTanggalLahir("");
              setAlamat("");
              setNamaAyah("");
              setNamaIbu("");
              setNomorHpWali("");
              setKelasId("");
              setKamarId("");
              setFotoUrl("");
            }}>
              <PlusCircle className="h-3.5 w-3.5" /> Tambah
            </DialogTrigger>
          <DialogContent className="sm:max-w-4xl lg:max-w-5xl w-[92vw] p-0 overflow-hidden bg-card border border-border/80 shadow-2xl rounded-3xl">
            {/* 1. Fixed Header */}
            <div className="px-6 py-4 bg-linear-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-md shadow-primary/20 shrink-0">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold tracking-tight text-foreground">
                    {editingItem ? "Edit Formulir Santri" : "Pendaftaran Santri Baru"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    {editingItem ? `Perbarui identitas, kontak wali, dan penempatan santri: ${editingItem.namaLengkap}` : "Lengkapi identitas, kontak orang tua, dan penempatan kelas/kamar santri."}
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* 2. Scrollable Body */}
            <form onSubmit={handleCreate}>
              <div className="max-h-[72vh] overflow-y-auto p-6 space-y-5 bg-muted/20">
                
                {/* SECTION 1: Data Pokok & Foto */}
                <div className="bg-card p-5 rounded-2xl border border-border/80 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-border/40 pb-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-bold">1</span>
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Identitas Pokok & Foto Profil</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                    {/* Input Fields (8 Cols on PC, 1 Col on Mobile) */}
                    <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="nis" className="text-xs font-semibold text-foreground flex items-center gap-1">
                          NIS <span className="text-red-500">*</span>
                        </Label>
                        <Input 
                          id="nis" 
                          required 
                          value={nis} 
                          onChange={(e) => setNis(e.target.value)} 
                          placeholder="Contoh: 10003" 
                          className="h-10 rounded-xl bg-slate-50 dark:bg-zinc-900 border-border/80 text-sm font-medium" 
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="tm" className="text-xs font-semibold text-foreground flex items-center gap-1">
                          Tahun Masuk <span className="text-red-500">*</span>
                        </Label>
                        <Input 
                          id="tm" 
                          required 
                          value={tahunMasuk} 
                          onChange={(e) => setTahunMasuk(e.target.value)} 
                          placeholder="2026" 
                          className="h-10 rounded-xl bg-slate-50 dark:bg-zinc-900 border-border/80 text-sm font-medium" 
                        />
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <Label htmlFor="nama" className="text-xs font-semibold text-foreground flex items-center gap-1">
                          Nama Lengkap Santri <span className="text-red-500">*</span>
                        </Label>
                        <Input 
                          id="nama" 
                          required 
                          value={namaLengkap} 
                          onChange={(e) => setNamaLengkap(e.target.value)} 
                          placeholder="Nama lengkap sesuai akta / KK" 
                          className="h-10 rounded-xl bg-slate-50 dark:bg-zinc-900 border-border/80 text-sm font-semibold" 
                        />
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <Label htmlFor="jk" className="text-xs font-semibold text-foreground flex items-center gap-1">
                          Jenis Kelamin <span className="text-red-500">*</span>
                        </Label>
                        <Select value={jenisKelamin} onValueChange={(val) => setJenisKelamin(val || "L")}>
                          <SelectTrigger className="h-10 rounded-xl bg-slate-50 dark:bg-zinc-900 border-border/80 text-sm font-medium">
                            <SelectValue placeholder="Pilih Jenis Kelamin" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border border-border/80">
                            <SelectItem value="L" className="font-medium cursor-pointer">Laki-laki (Santri Putra)</SelectItem>
                            <SelectItem value="P" className="font-medium cursor-pointer">Perempuan (Santri Putri)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Foto Upload Dropzone (4 Cols on PC, 1 Col on Mobile) */}
                    <div className="md:col-span-4 flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-border/80 bg-slate-50/50 dark:bg-zinc-900/50 text-center">
                      <div className="h-24 w-24 rounded-2xl border-2 border-primary/30 bg-muted overflow-hidden relative shadow-md mb-2.5 flex items-center justify-center">
                        {fotoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={fotoUrl} alt="Foto Santri" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-muted-foreground p-2">
                            <GraduationCap className="h-8 w-8 text-muted-foreground/40 mb-1" />
                            <span className="text-[10px] font-bold">Tanpa Foto</span>
                          </div>
                        )}
                        {uploading && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[9px] font-bold">
                            Mengunggah...
                          </div>
                        )}
                      </div>

                      <Label htmlFor="foto" className="text-xs font-bold text-primary cursor-pointer hover:underline bg-primary/10 px-3.5 py-1.5 rounded-xl">
                        {uploading ? "Memproses..." : "Pilih Berkas Foto"}
                      </Label>
                      <Input
                        id="foto"
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1.5 leading-tight">Format: JPG, PNG, WEBP (Maksimal 5MB)</p>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: Kelahiran & Domisili */}
                <div className="bg-card p-5 rounded-2xl border border-border/80 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-border/40 pb-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-bold">2</span>
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Tempat/Tanggal Lahir & Alamat Domisili</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="tl" className="text-xs font-semibold text-foreground flex items-center gap-1">
                        Tempat Kelahiran <span className="text-red-500">*</span>
                      </Label>
                      <Input 
                        id="tl" 
                        required 
                        value={tempatLahir} 
                        onChange={(e) => setTempatLahir(e.target.value)} 
                        placeholder="Contoh: Surabaya / Kediri" 
                        className="h-10 rounded-xl bg-slate-50 dark:bg-zinc-900 border-border/80 text-sm font-medium" 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="tgl" className="text-xs font-semibold text-foreground flex items-center gap-1">
                        Tanggal Lahir <span className="text-red-500">*</span>
                      </Label>
                      <Input 
                        id="tgl" 
                        type="date" 
                        required 
                        value={tanggalLahir} 
                        onChange={(e) => setTanggalLahir(e.target.value)} 
                        className="h-10 rounded-xl bg-slate-50 dark:bg-zinc-900 border-border/80 text-sm font-medium" 
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor="alamat" className="text-xs font-semibold text-foreground flex items-center gap-1">
                        Alamat Asal Lengkap <span className="text-red-500">*</span>
                      </Label>
                      <Input 
                        id="alamat" 
                        required 
                        value={alamat} 
                        onChange={(e) => setAlamat(e.target.value)} 
                        placeholder="Contoh: Jl. Mawar No. 10, RT 02/05, Desa Sukamaju, Kec. Ploso" 
                        className="h-10 rounded-xl bg-slate-50 dark:bg-zinc-900 border-border/80 text-sm font-medium" 
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: Orang Tua & Wali (Stack on Mobile, 3 Cols on PC) */}
                <div className="bg-card p-5 rounded-2xl border border-border/80 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-border/40 pb-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-bold">3</span>
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Data Orang Tua & Kontak WhatsApp Wali</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="ayah" className="text-xs font-semibold text-foreground flex items-center gap-1">
                        Nama Ayah Kandung <span className="text-red-500">*</span>
                      </Label>
                      <Input 
                        id="ayah" 
                        required 
                        value={namaAyah} 
                        onChange={(e) => setNamaAyah(e.target.value)} 
                        placeholder="Nama ayah kandung" 
                        className="h-10 rounded-xl bg-slate-50 dark:bg-zinc-900 border-border/80 text-sm font-medium" 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="ibu" className="text-xs font-semibold text-foreground flex items-center gap-1">
                        Nama Ibu Kandung <span className="text-red-500">*</span>
                      </Label>
                      <Input 
                        id="ibu" 
                        required 
                        value={namaIbu} 
                        onChange={(e) => setNamaIbu(e.target.value)} 
                        placeholder="Nama ibu kandung" 
                        className="h-10 rounded-xl bg-slate-50 dark:bg-zinc-900 border-border/80 text-sm font-medium" 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="hp" className="text-xs font-semibold text-foreground flex items-center gap-1">
                        No. WhatsApp Wali <span className="text-red-500">*</span>
                      </Label>
                      <Input 
                        id="hp" 
                        required 
                        value={nomorHpWali} 
                        onChange={(e) => setNomorHpWali(e.target.value)} 
                        placeholder="Contoh: 081234567890" 
                        className="h-10 rounded-xl bg-slate-50 dark:bg-zinc-900 border-border/80 font-mono text-xs font-bold" 
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 4: Penempatan Kelas & Kamar (Stack on Mobile, 2 Cols on PC) */}
                <div className="bg-card p-5 rounded-2xl border border-border/80 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-border/40 pb-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-bold">4</span>
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Penempatan Madrasah & Kamar Asrama</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="kelas" className="text-xs font-semibold text-foreground">
                        Ruang Kelas Madrasah
                      </Label>
                      <Select value={kelasId} onValueChange={(val) => setKelasId(val || "")}>
                        <SelectTrigger className="h-10 rounded-xl bg-slate-50 dark:bg-zinc-900 border-border/80 font-semibold text-sm">
                          <SelectValue placeholder="Pilih Ruang Kelas">
                            {kelasList.find((k) => k.id === kelasId)?.namaKelas || "Pilih Ruang Kelas"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="max-h-60 rounded-xl border border-border/80 shadow-xl">
                          {kelasList.map((k) => (
                            <SelectItem key={k.id} value={k.id} className="cursor-pointer py-2 font-medium">
                              <span className="font-bold text-foreground">{k.namaKelas}</span>
                              <span className="ml-2 text-xs text-muted-foreground">({k.tingkatan})</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="kamar" className="text-xs font-semibold text-foreground">
                        Kamar / Asrama Pondok
                      </Label>
                      <Select value={kamarId} onValueChange={(val) => setKamarId(val || "")}>
                        <SelectTrigger className="h-10 rounded-xl bg-slate-50 dark:bg-zinc-900 border-border/80 font-semibold text-sm">
                          <SelectValue placeholder="Pilih Kamar Asrama">
                            {kamarList.find((km) => km.id === kamarId)?.namaKamar || "Pilih Kamar Asrama"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="max-h-60 rounded-xl border border-border/80 shadow-xl">
                          {kamarList.map((km) => (
                            <SelectItem key={km.id} value={km.id} className="cursor-pointer py-2 font-medium">
                              <span className="font-bold text-foreground">{km.namaKamar}</span>
                              <span className="ml-2 text-xs text-muted-foreground">(Kapasitas {km.kapasitas} santri)</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

              </div>

              {/* 3. Fixed Footer */}
              <div className="px-6 py-4 bg-card border-t border-border/80 flex items-center justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)} 
                  className="rounded-xl h-10 px-5 font-bold border-border/80 cursor-pointer text-xs"
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={isPending} 
                  className="bg-primary text-primary-foreground font-bold rounded-xl h-10 px-6 cursor-pointer shadow-md shadow-primary/20 flex items-center gap-2 text-xs"
                >
                  {isPending ? "Menyimpan Data..." : (editingItem ? "Perbarui Data Santri" : "Simpan Data Santri")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>

      {/* Filters & Search Toolbar - Ultra Compact & Space-Saving */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 bg-card/70 border border-border/70 p-2 rounded-xl shadow-xs backdrop-blur-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Cari santri berdasarkan nama / NIS..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs rounded-lg bg-background/80 border-border/60"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Gender Filter */}
          <Select value={gender} onValueChange={(val) => setGender(val || "all")}>
            <SelectTrigger className="h-9 px-3 rounded-lg bg-background/80 border-border/60 text-xs font-semibold w-auto min-w-[130px] flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Semua Gender">
                {gender === "L" ? "Laki-laki (Putra)" : gender === "P" ? "Perempuan (Putri)" : "Semua Gender"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-border/80 shadow-lg">
              <SelectItem value="all" className="text-xs font-semibold cursor-pointer">Semua Gender</SelectItem>
              <SelectItem value="L" className="text-xs font-semibold cursor-pointer">Laki-laki (Putra)</SelectItem>
              <SelectItem value="P" className="text-xs font-semibold cursor-pointer">Perempuan (Putri)</SelectItem>
            </SelectContent>
          </Select>

          {/* Kelas Filter */}
          <Select value={kelasFilter} onValueChange={(val) => setKelasFilter(val || "all")}>
            <SelectTrigger className="h-9 px-3 rounded-lg bg-background/80 border-border/60 text-xs font-semibold w-auto min-w-[140px] flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Semua Kelas">
                {kelasFilter === "all" ? "Semua Kelas" : (kelasList.find(k => k.id === kelasFilter)?.namaKelas || "Semua Kelas")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-border/80 shadow-lg max-h-60">
              <SelectItem value="all" className="text-xs font-semibold cursor-pointer">Semua Kelas</SelectItem>
              {kelasList.map(k => (
                <SelectItem key={k.id} value={k.id} className="text-xs font-semibold cursor-pointer">{k.namaKelas}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(search || gender !== "all" || kelasFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearch(""); setGender("all"); setKelasFilter("all"); }}
              className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground font-semibold rounded-lg"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Roster Table */}
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
                  <TableHead className="font-bold">Kelas</TableHead>
                  <TableHead className="font-bold">Kamar</TableHead>
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
                      <TableCell className="text-xs font-bold text-primary">
                        {kelasList.find(k => k.id === s.kelasId)?.namaKelas || "Belum ada"}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-glow-gold">
                        {kamarList.find(km => km.id === s.kamarId)?.namaKamar || "Belum ada"}
                      </TableCell>
                      <TableCell className="text-center flex justify-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleStartEdit(s)}
                          className="text-blue-500 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl min-h-[40px]"
                        >
                          <Pencil className="h-4.5 w-4.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleOpenStatusDialog(s)}
                          title="Lulus / Boyong"
                          className="text-amber-500 hover:text-amber-600 hover:bg-amber-50/50 rounded-xl min-h-[40px]"
                        >
                          <GraduationCap className="h-4.5 w-4.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(s.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50/50 rounded-xl min-h-[40px]"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-sm text-muted-foreground">
                      Tidak ada data santri yang cocok.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={(o) => { setImportDialogOpen(o); if (!o) { setImportResult(null); setImportFile(null); } }}>
        <DialogContent className="max-w-md bg-popover backdrop-blur-xl border border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-glow-gold flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" /> Impor Data Santri
            </DialogTitle>
            <DialogDescription>Pilih cara impor data santri ke dalam sistem.</DialogDescription>
          </DialogHeader>
 
          {importResult ? (
            <div className="space-y-4">
              <div className={`rounded-xl p-4 border ${importResult.errors.length === 0 ? "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-500" : "bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-500"}`}>
                <p className="font-bold text-sm">{importResult.inserted} santri berhasil ditambahkan.</p>
                {importResult.errors.length > 0 && (
                  <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                    {importResult.errors.map((e, i) => (
                      <p key={i} className="text-xs text-red-600">{e}</p>
                    ))}
                  </div>
                )}
              </div>
              <Button onClick={() => setImportDialogOpen(false)} className="bg-blue-gradient text-white rounded-xl w-full">Selesai</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pt-2">
              {/* Option 1: Import Now */}
              <div
                className="group flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer transition-all"
                onClick={() => setImportMode("importing")}
              >
                <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <FileUp className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-sm text-blue-800">Impor Sekarang</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Upload file Excel (.xlsx)</p>
                </div>
              </div>

              {/* Option 2: Download Template */}
              <div
                className="group flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-dashed border-green-300 hover:border-green-500 hover:bg-green-50/50 cursor-pointer transition-all"
                onClick={handleDownloadTemplate}
              >
                <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <FileSpreadsheet className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-sm text-green-800">Unduh Template</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Download template Excel</p>
                </div>
              </div>

              {/* File upload area (shown when importing) */}
              {importMode === "importing" && (
                <div className="col-span-2 space-y-3 border-t border-border pt-4">
                  <Label htmlFor="import-file">Pilih File Excel (.xlsx)</Label>
                  <Input
                    id="import-file"
                    type="file"
                    accept=".xlsx"
                    className="bg-white/60 dark:bg-black/20"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  />
                  {importFile && (
                    <p className="text-xs text-muted-foreground">📄 {importFile.name} ({Math.round(importFile.size / 1024)} KB)</p>
                  )}
                  <Button
                    onClick={handleImport}
                    disabled={!importFile || importLoading}
                    className="bg-blue-gradient text-white font-bold w-full rounded-xl"
                  >
                    {importLoading ? "Mengimpor data..." : "Mulai Import"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Ubah Status Alumni */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="max-w-md bg-popover backdrop-blur-xl border border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-glow-gold">Ubah Status Keluar Santri</DialogTitle>
            <DialogDescription>
              Pindahkan <strong>{statusSantri?.namaLengkap}</strong> ke menu Alumni dengan status Lulus atau Boyong.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveStatus} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Pilih Status Keluar</Label>
              <Select value={newStatus} onValueChange={(val) => setNewStatus(val as any)}>
                <SelectTrigger className="bg-white/50 dark:bg-black/20">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LULUS">Lulus</SelectItem>
                  <SelectItem value="BOYONG">Boyong (Pindah/Keluar)</SelectItem>
                </SelectContent>
              </Select>
            </div>
 
            <div className="space-y-1.5">
              <Label htmlFor="alumni-tahun">Tahun Keluar</Label>
              <Input
                id="alumni-tahun"
                required
                value={tahunKeluarInput}
                onChange={(e) => setTahunKeluarInput(e.target.value)}
                placeholder={new Date().getFullYear().toString()}
                className="bg-white/50 dark:bg-black/20"
              />
            </div>
 
            <DialogFooter className="pt-2">
              <Button type="submit" disabled={isPending} className="bg-blue-gradient text-white font-bold w-full rounded-xl cursor-pointer min-h-[44px]">
                {isPending ? "Memproses..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        message={confirmMessage}
        onConfirm={() => confirmAction?.()}
      />
    </div>
  );
}
