"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { BookOpen, PlusCircle, Trash2, Pencil, Search, Award, BookMarked } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { apiGet, apiPost } from "@/lib/api-client";


export default function KitabNadzomPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("kitab");
  const [isPending, startTransition] = useTransition();

  // Data States
  const [kitabList, setKitabList] = useState<any[]>([]);
  const [targetList, setTargetList] = useState<any[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);
  
  // Loading States
  const [loadingKitab, setLoadingKitab] = useState(true);
  const [loadingTarget, setLoadingTarget] = useState(true);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"kitab" | "target">("kitab");
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Form States - Kitab Nadzom
  const [kitabNama, setKitabNama] = useState("");
  const [kitabBait, setKitabBait] = useState("");

  // Form States - Target Hafalan
  const [targetKelasId, setTargetKelasId] = useState("");
  const [targetKitabId, setTargetKitabId] = useState("");
  const [targetBaitMulai, setTargetBaitMulai] = useState("1");
  const [targetBaitSelesai, setTargetBaitSelesai] = useState("");

  // Confirmation States
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  const loadData = async () => {
    setLoadingKitab(true);
    setLoadingTarget(true);
    try {
      const [kitabs, targets, classes] = await Promise.all([
        apiGet("kitab-nadzom"),
        apiGet("target-hafalan"),
        apiGet("kelas"),
      ]);
      setKitabList(kitabs);
      setTargetList(targets);
      setKelasList(classes);
    } catch (e) {
      console.error(e);
      toast.error("Gagal memuat data");
    } finally {
      setLoadingKitab(false);
      setLoadingTarget(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const askConfirmation = (message: string, action: () => void) => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  // Open Dialogs
  const handleOpenAddKitab = () => {
    setDialogType("kitab");
    setEditingItem(null);
    setKitabNama("");
    setKitabBait("");
    setDialogOpen(true);
  };

  const handleOpenEditKitab = (item: any) => {
    setDialogType("kitab");
    setEditingItem(item);
    setKitabNama(item.namaKitab);
    setKitabBait(item.jumlahBait.toString());
    setDialogOpen(true);
  };

  const handleOpenAddTarget = () => {
    setDialogType("target");
    setEditingItem(null);
    setTargetKelasId(kelasList[0]?.id || "");
    setTargetKitabId(kitabList[0]?.id || "");
    setTargetBaitMulai("1");
    setTargetBaitSelesai("");
    setDialogOpen(true);
  };

  const handleOpenEditTarget = (item: any) => {
    setDialogType("target");
    setEditingItem(item);
    setTargetKelasId(item.kelasId);
    setTargetKitabId(item.kitabNadzomId);
    setTargetBaitMulai(item.baitMulai.toString());
    setTargetBaitSelesai(item.baitSelesai.toString());
    setDialogOpen(true);
  };

  // Submit Handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    startTransition(async () => {
      if (dialogType === "kitab") {
        if (!kitabNama || !kitabBait) {
          toast.error("Semua kolom wajib diisi");
          return;
        }

        const data = { namaKitab: kitabNama, jumlahBait: kitabBait };
        let res;
        if (editingItem) {
          res = await apiPost("updateKitabNadzom", { id: editingItem.id, data });
        } else {
          res = await apiPost("createKitabNadzom", { data });
        }

        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success(res.message);
          setDialogOpen(false);
          loadData();
        }
      } else {
        if (!targetKelasId || !targetKitabId || !targetBaitMulai || !targetBaitSelesai) {
          toast.error("Semua kolom wajib diisi");
          return;
        }

        const data = {
          kelasId: targetKelasId,
          kitabNadzomId: targetKitabId,
          baitMulai: targetBaitMulai,
          baitSelesai: targetBaitSelesai
        };
        let res;
        if (editingItem) {
          res = await apiPost("updateTargetHafalan", { id: editingItem.id, data });
        } else {
          res = await apiPost("createTargetHafalan", { data });
        }

        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success(res.message);
          setDialogOpen(false);
          loadData();
        }
      }
    });
  };

  // Delete Handlers
  const handleDeleteKitab = (id: string, name: string) => {
    if (!session?.user?.id) return;
    askConfirmation(
      `Apakah Anda yakin ingin menghapus Kitab Nadzom "${name}"? Seluruh data target kelas dan setoran santri yang merujuk ke kitab ini juga akan dihapus secara permanen!`,
      () => {
        startTransition(async () => {
          const res = await apiPost("deleteKitabNadzom", { id });
          if (res.error) { toast.error(res.error); }
          else { toast.success(res.message); loadData(); }
        });
      }
    );
  };

  const handleDeleteTarget = (id: string) => {
    if (!session?.user?.id) return;
    askConfirmation(
      "Apakah Anda yakin ingin menghapus target hafalan kelas ini?",
      () => {
        startTransition(async () => {
          const res = await apiPost("deleteTargetHafalan", { id });
          if (res.error) { toast.error(res.error); }
          else { toast.success(res.message); loadData(); }
        });
      }
    );
  };

  // Filtered List
  const filteredKitabs = kitabList.filter(k => 
    k.namaKitab.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTargets = targetList.filter(t => 
    t.kelas?.namaKelas.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.kitab?.namaKitab.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-blue-gradient flex items-center justify-center text-white shadow-md">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-glow-gold">Kitab & Target Nadzom</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Kelola daftar master Kitab Nadzom dan target hafalan per kelas.</p>
          </div>
        </div>
        <div className="shrink-0">
          {activeTab === "kitab" ? (
            <Button
              onClick={handleOpenAddKitab}
              className="h-8.5 px-3 text-xs font-bold rounded-lg bg-primary text-primary-foreground shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="h-3.5 w-3.5" /> Tambah Kitab
            </Button>
          ) : (
            <Button
              onClick={handleOpenAddTarget}
              className="h-8.5 px-3 text-xs font-bold rounded-lg bg-primary text-primary-foreground shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="h-3.5 w-3.5" /> Tambah Target
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Layout */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
          <TabsList className="grid grid-cols-2 w-full sm:max-w-md bg-card/70 p-1 rounded-xl border border-border/60">
            <TabsTrigger value="kitab" className="rounded-lg text-xs font-bold py-1.5">📖 Master Kitab</TabsTrigger>
            <TabsTrigger value="target" className="rounded-lg text-xs font-bold py-1.5">🎯 Target Hafalan</TabsTrigger>
          </TabsList>
          
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari data nadzom / kelas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8.5 h-8.5 text-xs rounded-lg bg-card/80 border-border/60"
            />
          </div>
        </div>

        {/* Tab 1: Master Kitab Nadzom */}
        <TabsContent value="kitab" className="space-y-6">
          <Card className="glass-panel border-white/20">
            <CardContent className="p-0">
              {loadingKitab ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mr-3" />
                  Memuat data...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-white/40">
                        <TableHead className="font-semibold">Nama Kitab Nadzom</TableHead>
                        <TableHead className="font-semibold">Jumlah Bait</TableHead>
                        <TableHead className="font-semibold text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredKitabs.map((item) => (
                        <TableRow key={item.id} className="hover:bg-white/30 transition-colors">
                          <TableCell className="font-semibold text-glow-gold flex items-center gap-2">
                            <BookMarked className="h-4.5 w-4.5 text-primary" />
                            <span className="font-arabic text-base font-bold text-slate-900 dark:text-slate-100">{item.namaKitab}</span>
                          </TableCell>
                          <TableCell className="font-medium">{item.jumlahBait} bait</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
                                onClick={() => handleOpenEditKitab(item)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                                onClick={() => handleDeleteKitab(item.id, item.namaKitab)}
                                disabled={isPending}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredKitabs.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-12">
                            Tidak ada data Master Kitab Nadzom.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Target Hafalan Kelas */}
        <TabsContent value="target" className="space-y-6">
          <Card className="glass-panel border-white/20">
            <CardContent className="p-0">
              {loadingTarget ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mr-3" />
                  Memuat data...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-white/40">
                        <TableHead className="font-semibold">Kelas</TableHead>
                        <TableHead className="font-semibold">Kitab Nadzom</TableHead>
                        <TableHead className="font-semibold">Target Bait (Mulai - Selesai)</TableHead>
                        <TableHead className="font-semibold text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTargets.map((item) => {
                        const totalBait = item.kitab?.jumlahBait || 100;
                        const targetBaitSpan = item.baitSelesai - item.baitMulai + 1;
                        const pct = Math.min(100, Math.round((targetBaitSpan / totalBait) * 100));
                        return (
                          <TableRow key={item.id} className="hover:bg-white/30 transition-colors">
                            <TableCell className="font-semibold">{item.kelas?.namaKelas || item.kelasId}</TableCell>
                            <TableCell className="font-semibold text-glow-gold">
                              <span className="font-arabic text-base font-bold text-slate-900 dark:text-slate-100">
                                {item.kitab?.namaKitab || item.kitabNadzomId}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1.5 max-w-[220px]">
                                <Badge className="bg-blue-100 text-blue-700 border-blue-200 rounded-lg py-0.5 px-2.5 flex items-center gap-1.5 w-fit">
                                  <Award className="h-3.5 w-3.5" />
                                  Bait {item.baitMulai} s.d {item.baitSelesai} ({targetBaitSpan} bait)
                                </Badge>
                                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
                                  onClick={() => handleOpenEditTarget(item)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                                  onClick={() => handleDeleteTarget(item.id)}
                                  disabled={isPending}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredTargets.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                            Tidak ada data Target Hafalan Kelas.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* CRUD Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg bg-card/95 backdrop-blur-2xl border border-border/80 shadow-2xl rounded-2xl p-6">
          <DialogHeader className="space-y-2 border-b border-border/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold tracking-tight text-foreground">
                  {editingItem ? "Edit Data" : "Tambah Data"} {dialogType === "kitab" ? "Kitab Nadzom" : "Target Hafalan"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Silakan isi formulir di bawah ini dengan lengkap dan benar.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {dialogType === "kitab" ? (
              // Form Kitab Nadzom
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="kitabNama" className="text-xs font-bold text-foreground">Nama Kitab Nadzom (Teks Arab / Latin)</Label>
                  <Input
                    id="kitabNama"
                    placeholder="Contoh: منظومة البيقونية / العمريطي"
                    value={kitabNama}
                    onChange={(e) => setKitabNama(e.target.value)}
                    className="h-10 rounded-xl bg-muted/40 border-border/60 font-arabic text-base"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="kitabBait" className="text-xs font-bold text-foreground">Jumlah Total Bait</Label>
                  <Input
                    id="kitabBait"
                    type="number"
                    min="1"
                    placeholder="Contoh: 254"
                    value={kitabBait}
                    onChange={(e) => setKitabBait(e.target.value)}
                    className="h-10 rounded-xl bg-muted/40 border-border/60"
                    required
                  />
                </div>
              </>
            ) : (
              // Form Target Hafalan
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Kelas Target</Label>
                  <Select value={targetKelasId} onValueChange={(v) => setTargetKelasId(v || "")}>
                    <SelectTrigger className="h-10 rounded-xl bg-muted/40 border-border/60">
                      <SelectValue placeholder="Pilih Kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      {kelasList.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.namaKelas}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Kitab Nadzom</Label>
                  <Select value={targetKitabId} onValueChange={(v) => setTargetKitabId(v || "")}>
                    <SelectTrigger className="h-10 rounded-xl bg-muted/40 border-border/60">
                      <SelectValue placeholder="Pilih Kitab" />
                    </SelectTrigger>
                    <SelectContent>
                      {kitabList.map((k) => (
                        <SelectItem key={k.id} value={k.id} className="font-arabic">{k.namaKitab} ({k.jumlahBait} bait)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="baitMulai" className="text-xs font-bold text-foreground">Bait Mulai</Label>
                    <Input
                      id="baitMulai"
                      type="number"
                      min="1"
                      placeholder="1"
                      value={targetBaitMulai}
                      onChange={(e) => setTargetBaitMulai(e.target.value)}
                      className="h-10 rounded-xl bg-muted/40 border-border/60"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="baitSelesai" className="text-xs font-bold text-foreground">Bait Selesai</Label>
                    <Input
                      id="baitSelesai"
                      type="number"
                      min="1"
                      placeholder="Contoh: 50"
                      value={targetBaitSelesai}
                      onChange={(e) => setTargetBaitSelesai(e.target.value)}
                      className="h-10 rounded-xl bg-muted/40 border-border/60"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <DialogFooter className="pt-3 border-t border-border/60 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="rounded-xl h-10 px-4 font-semibold"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-primary text-primary-foreground font-bold rounded-xl h-10 px-6 cursor-pointer shadow-sm"
              >
                {isPending ? "Menyimpan..." : "Simpan Data"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        message={confirmMessage}
        onConfirm={() => { confirmAction?.(); setConfirmOpen(false); }}
        variant="destructive"
      />
    </div>
  );
}
