"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { Users, UserPlus, RefreshCw, KeyRound, ShieldCheck, CheckCircle2, Zap, Copy, Trash2, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { apiGet, apiPost } from "@/lib/api-client";

import { Input } from "@/components/ui/input";

function getSuggestedUsername(fullName: string): string {
  if (!fullName) return "";
  const clean = fullName
    .replace(/\b(k\.h\.|kh\.|kyai|kiai|habib|gus|ust\.|ustadz|ustad|drs\.|dr\.|lc\.|m\.pd|s\.pd|s\.ag|m\.ag)\b/gi, "")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()'"’]/g, " ")
    .trim();
  const words = clean.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return "ustadz";
  const skipWords = new Set(["m", "muh", "muhammad", "moch", "mochamad", "mohammad", "ahmad", "achmad", "siti", "nur"]);
  let target = words[0];
  if (words.length > 1 && skipWords.has(words[0].toLowerCase())) {
    target = words[1];
  }
  if (words.length > 2 && (target.toLowerCase() === "lulu" || target.toLowerCase() === "lu" || skipWords.has(target.toLowerCase()))) {
    target = words[2];
  }
  return target.toLowerCase().replace(/[^a-z0-9]/g, "") || "ustadz";
}

export default function AkunPenggunaPage() {
  const { data: session } = useSession();
  const [list, setList] = useState<any[]>([]);
  const [waliList, setWaliList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingWali, setLoadingWali] = useState(true);
  const [activeTab, setActiveTab] = useState("ustadz");
  const [isPending, startTransition] = useTransition();

  // Dialog: Buat Akun
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createWaliDialogOpen, setCreateWaliDialogOpen] = useState(false);
  const [selectedUstadz, setSelectedUstadz] = useState<any | null>(null);
  const [selectedWali, setSelectedWali] = useState<any | null>(null);
  const [selectedRole, setSelectedRole] = useState<"MUSTAHIQ" | "MUNAWIB">("MUSTAHIQ");
  const [customUsername, setCustomUsername] = useState("");
  const [customPassword, setCustomPassword] = useState("pesantren123");
  const [newAccountInfo, setNewAccountInfo] = useState<{ username: string; password: string } | null>(null);

  // Dialog: Edit Akun
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editRole, setEditRole] = useState<string>("MUNAWIB");
  const [editPassword, setEditPassword] = useState("");
  const [editActive, setEditActive] = useState(true);

  // Dialog: Konfirmasi Reset
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState("");

  const loadData = async () => {
    setLoading(true);
    setLoadingWali(true);
    try {
      const [ustadzData, waliData] = await Promise.all([
        apiGet("akun-ustadz"),
        apiGet("akun-wali"),
      ]);
      setList(ustadzData);
      setWaliList(waliData);
    } catch (e) {
      console.error(e);
      toast.error("Gagal memuat data akun");
    } finally {
      setLoading(false);
      setLoadingWali(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const askConfirmation = (message: string, action: () => void) => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  const handleOpenCreateDialog = (ustadzItem: any) => {
    setSelectedUstadz(ustadzItem);
    setSelectedRole(ustadzItem.peran || "MUSTAHIQ");
    setCustomUsername(getSuggestedUsername(ustadzItem.nama));
    setCustomPassword("pesantren123");
    setNewAccountInfo(null);
    setCreateDialogOpen(true);
  };

  const handleOpenEditDialog = (item: any) => {
    if (!item.user) return;
    setEditingItem(item);
    setEditUsername(item.user.username);
    setEditRole(item.user.roleId);
    setEditPassword("");
    setEditActive(item.user.active ?? true);
    setEditDialogOpen(true);
  };

  const handleCreateAccount = () => {
    if (!selectedUstadz || !session?.user?.id) return;
    startTransition(async () => {
      const res = await apiPost("createUstadzAccount", {
        params: { 
          ustadzId: selectedUstadz.id, 
          roleId: selectedRole,
          username: customUsername.trim() || undefined,
          password: customPassword.trim() || undefined
        },
      });
      if (res.error) {
        toast.error("Gagal", { description: res.error });
      } else {
        toast.success("Akun berhasil dibuat!");
        setNewAccountInfo({ username: (res as any).username || customUsername, password: customPassword || "pesantren123" });
        loadData();
      }
    });
  };

  const handleSaveEditAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.user?.id || !session?.user?.id) return;
    startTransition(async () => {
      const res = await apiPost("updateUserAccount", {
        id: editingItem.user.id,
        data: {
          username: editUsername.trim(),
          roleId: editRole,
          password: editPassword.trim() || undefined,
          active: editActive
        }
      });
      if (res.error) {
        toast.error("Gagal", { description: res.error });
      } else {
        toast.success("Berhasil", { description: res.message });
        setEditDialogOpen(false);
        setEditingItem(null);
        loadData();
      }
    });
  };

  const handleCreateWaliAccount = (waliId: string, nama: string) => {
    if (!session?.user?.id) return;
    startTransition(async () => {
      const res = await apiPost("createWaliAccount", {
        params: { waliId },
      });
      if (res.error) {
        toast.error("Gagal", { description: res.error });
      } else {
        toast.success("Akun berhasil dibuat!");
        setNewAccountInfo({ username: (res as any).username, password: "pesantren123" });
        setSelectedWali({ nama });
        setCreateWaliDialogOpen(true);
        loadData();
      }
    });
  };

  const handleAutoGenerate = () => {
    if (!session?.user?.id) return;
    askConfirmation(
      "Apakah Anda yakin ingin men-generate akun otomatis untuk semua Ustadz (Mustahiq/Munawwib) dan Wali Santri yang belum memiliki akun?",
      () => {
        startTransition(async () => {
          const res = await apiPost("autoGenerateAccounts");
          if (res.error) {
            toast.error("Gagal", { description: res.error });
          } else {
            toast.success("Berhasil!", { description: res.message });
            loadData();
          }
        });
      }
    );
  };

  const handleResetPassword = (userId: string, nama: string) => {
    if (!session?.user?.id) return;
    askConfirmation(
      `Reset password ${nama} ke "pesantren123"? Pengguna harus mengganti password saat login berikutnya.`,
      () => {
        startTransition(async () => {
          const res = await apiPost("resetUserPassword", { id: userId });
          if (res.error) {
            toast.error("Gagal", { description: res.error });
          } else {
            toast.success("Password direset!", { description: res.message });
            loadData();
          }
        });
      }
    );
  };

  const handleDeleteAccount = (userId: string, nama: string) => {
    if (!session?.user?.id) return;
    askConfirmation(
      `Apakah Anda yakin ingin menghapus akun login untuk ${nama}? Pengguna tidak akan bisa masuk ke sistem sampai akun dibuat kembali.`,
      () => {
        startTransition(async () => {
          const res = await apiPost("deleteUser", { id: userId });
          if (res.error) {
            toast.error("Gagal", { description: res.error });
          } else {
            toast.success("Akun berhasil dihapus!");
            loadData();
          }
        });
      }
    );
  };

  const getStatusBadge = (item: any) => {
    if (!item.user) {
      return <Badge className="bg-red-100 text-red-700 border-red-200 rounded-lg">❌ Belum ada akun</Badge>;
    }
    if (item.user.mustChangePassword) {
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200 rounded-lg">⚠️ Perlu ganti password</Badge>;
    }
    return <Badge className="bg-green-100 text-green-700 border-green-200 rounded-lg">✅ Aktif</Badge>;
  };

  const getRoleBadge = (roleId: string) => {
    if (roleId === "MUSTAHIQ") return <Badge className="bg-blue-100 text-blue-700 border-blue-200 rounded-lg">Mustahiq (Wali Kelas)</Badge>;
    if (roleId === "MUNAWIB") return <Badge className="bg-purple-100 text-purple-700 border-purple-200 rounded-lg">Munawwib (Pengajar)</Badge>;
    return <Badge variant="outline">{roleId}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/50 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-blue-gradient flex items-center justify-center text-white shadow-md">
            <KeyRound className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-glow-gold">Akun Pengguna</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Kelola akun login Mustahiq, Munawwib, dan Wali Santri.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-nowrap">
          <Button
            onClick={handleAutoGenerate}
            disabled={isPending}
            className="h-8.5 px-3 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Zap className="h-3.5 w-3.5" /> Auto-Generate Akun
          </Button>
          <div className="h-8.5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground bg-card/80 px-3 rounded-lg border border-border/60 shrink-0">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span>Default: <b>pesantren123</b></span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 max-w-md mb-6 bg-white/40 dark:bg-black/20 p-1 rounded-xl border border-white/20 dark:border-white/5">
          <TabsTrigger value="ustadz" className="rounded-lg font-semibold py-2.5 flex items-center justify-center gap-2">
            <GraduationCap className="h-4.5 w-4.5" />
            <span>Akun Ustadz ({list.length})</span>
          </TabsTrigger>
          <TabsTrigger value="wali" className="rounded-lg font-semibold py-2.5 flex items-center justify-center gap-2">
            <Users className="h-4.5 w-4.5" />
            <span>Akun Wali Santri ({waliList.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ustadz" className="space-y-6">
          {/* Stats Ustadz */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="glass-panel border-white/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground">Total Ustadz</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold">{list.length}</div>
              </CardContent>
            </Card>
            <Card className="glass-panel border-white/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground">Sudah Punya Akun</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-green-600">{list.filter(u => u.user).length}</div>
              </CardContent>
            </Card>
            <Card className="glass-panel border-white/20 col-span-2 md:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground">Belum Ada Akun</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-red-500">{list.filter(u => !u.user).length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Table Ustadz */}
          <Card className="glass-panel border-white/20">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mr-3" />
                  Memuat data...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-white/40">
                        <TableHead className="font-semibold">Nama Ustadz</TableHead>
                        <TableHead className="font-semibold">No. HP</TableHead>
                        <TableHead className="font-semibold">Username Akun</TableHead>
                        <TableHead className="font-semibold">Role</TableHead>
                        <TableHead className="font-semibold">Status Akun</TableHead>
                        <TableHead className="font-semibold text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {list.map((item) => (
                        <TableRow key={item.id} className="hover:bg-white/30 transition-colors">
                          <TableCell className="font-semibold">{item.nama}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{item.nomorHp}</TableCell>
                          <TableCell>
                            {item.user ? (
                              <span className="font-mono text-sm bg-muted/30 px-2 py-0.5 rounded">{item.user.username}</span>
                            ) : (
                              <span className="text-muted-foreground text-sm italic">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.user ? getRoleBadge(item.user.roleId) : <span className="text-muted-foreground text-sm">—</span>}
                          </TableCell>
                          <TableCell>{getStatusBadge(item)}</TableCell>
                          <TableCell className="text-right">
                            {!item.user ? (
                              <Button
                                size="sm"
                                className="bg-blue-gradient text-white rounded-xl font-semibold shadow-sm"
                                onClick={() => handleOpenCreateDialog(item)}
                              >
                                <UserPlus className="h-4 w-4 mr-1" /> Buat Akun
                              </Button>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/40"
                                  onClick={() => handleOpenEditDialog(item)}
                                >
                                  Edit Akun
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/40"
                                  onClick={() => handleResetPassword(item.user.id, item.nama)}
                                  disabled={isPending}
                                >
                                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> Reset
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="rounded-xl font-semibold shadow-sm flex items-center gap-1"
                                  onClick={() => handleDeleteAccount(item.user.id, item.nama)}
                                  disabled={isPending}
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Hapus
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {list.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                            Tidak ada data ustadz.
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

        <TabsContent value="wali" className="space-y-6">
          {/* Stats Wali */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="glass-panel border-white/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground">Total Wali Santri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold">{waliList.length}</div>
              </CardContent>
            </Card>
            <Card className="glass-panel border-white/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground">Sudah Punya Akun</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-green-600">{waliList.filter(w => w.user).length}</div>
              </CardContent>
            </Card>
            <Card className="glass-panel border-white/20 col-span-2 md:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground">Belum Ada Akun</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-red-500">{waliList.filter(w => !w.user).length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Table Wali */}
          <Card className="glass-panel border-white/20">
            <CardContent className="p-0">
              {loadingWali ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mr-3" />
                  Memuat data...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-white/40">
                        <TableHead className="font-semibold">Nama Wali</TableHead>
                        <TableHead className="font-semibold">No. HP</TableHead>
                        <TableHead className="font-semibold">Santri Terkait</TableHead>
                        <TableHead className="font-semibold">Username Akun</TableHead>
                        <TableHead className="font-semibold">Status Akun</TableHead>
                        <TableHead className="font-semibold text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {waliList.map((item) => (
                        <TableRow key={item.id} className="hover:bg-white/30 transition-colors">
                          <TableCell className="font-semibold">{item.nama}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{item.nomorHp}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 max-w-[220px]">
                              {item.santri && item.santri.length > 0 ? (
                                item.santri.map((s: any) => (
                                  <Badge key={s.id} variant="outline" className="text-xs bg-blue-50/50 truncate py-0.5 justify-start">
                                    🎓 {s.namaLengkap} ({s.nis})
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-muted-foreground text-xs italic">Tidak ada santri</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.user ? (
                              <span className="font-mono text-sm bg-muted/30 px-2 py-0.5 rounded">{item.user.username}</span>
                            ) : (
                              <span className="text-muted-foreground text-sm italic">—</span>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(item)}</TableCell>
                          <TableCell className="text-right">
                            {!item.user ? (
                              <Button
                                size="sm"
                                className="bg-blue-gradient text-white rounded-xl font-semibold shadow-sm flex items-center gap-1"
                                onClick={() => handleCreateWaliAccount(item.id, item.nama)}
                                disabled={isPending}
                              >
                                <UserPlus className="h-4 w-4 mr-1" /> Buat Akun
                              </Button>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/40"
                                  onClick={() => handleOpenEditDialog(item)}
                                >
                                  Edit Akun
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/40"
                                  onClick={() => handleResetPassword(item.user.id, item.nama)}
                                  disabled={isPending}
                                >
                                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> Reset
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="rounded-xl font-semibold shadow-sm flex items-center gap-1"
                                  onClick={() => handleDeleteAccount(item.user.id, item.nama)}
                                  disabled={isPending}
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Hapus
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {waliList.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                            Tidak ada data Wali Santri. Klik tombol <b>Generate Akun Otomatis</b> di atas untuk membuat akun Wali Santri.
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

      {/* Dialog: Buat Akun */}
      <Dialog open={createDialogOpen} onOpenChange={(o) => { setCreateDialogOpen(o); if (!o) setNewAccountInfo(null); }}>
        <DialogContent className="max-w-md bg-popover backdrop-blur-xl border border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-glow-gold">Buat Akun Login Ustadz</DialogTitle>
            <DialogDescription>
              Buat akun login untuk <b>{selectedUstadz?.nama}</b>.
            </DialogDescription>
          </DialogHeader>

          {newAccountInfo ? (
            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-500 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="h-5 w-5" /> Akun Berhasil Dibuat!
                </div>
                <p className="text-sm">Sampaikan informasi ini kepada ustadz bersangkutan:</p>
                <div className="bg-white dark:bg-black/40 rounded-lg p-3 space-y-1 text-sm font-mono border border-green-500/10">
                  <div>🔑 Username: <b>{newAccountInfo.username}</b></div>
                  <div>🔒 Password: <b>{newAccountInfo.password}</b></div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center justify-center gap-1.5 border-green-500/30 text-green-700 dark:text-green-500 hover:bg-green-500/20 font-bold rounded-xl cursor-pointer"
                  onClick={() => {
                    navigator.clipboard.writeText(`Username: ${newAccountInfo.username}\nPassword: ${newAccountInfo.password}`);
                    toast.success("Berhasil disalin!", { description: "Informasi akun berhasil disalin ke clipboard." });
                  }}
                >
                  <Copy className="h-4 w-4" /> Salin Info Akun
                </Button>
                <p className="text-xs opacity-80">⚠️ Pengguna wajib mengganti password saat pertama kali login.</p>
              </div>
              <DialogFooter>
                <Button onClick={() => setCreateDialogOpen(false)} className="bg-blue-gradient text-white rounded-xl w-full">Tutup</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Username Akun</Label>
                <Input
                  value={customUsername}
                  onChange={(e) => setCustomUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                  placeholder="contoh: khulal"
                  className="font-mono bg-white/50 dark:bg-black/20"
                />
                <p className="text-xs text-muted-foreground">Disarankan nama panggilan singkat tanpa spasi.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Password Awal</Label>
                <Input
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  placeholder="pesantren123"
                  className="font-mono bg-white/50 dark:bg-black/20"
                />
                <p className="text-xs text-muted-foreground">Default: <code className="font-mono">pesantren123</code></p>
              </div>
              <div className="space-y-1.5">
                <Label>Peran / Role</Label>
                <Select value={selectedRole} onValueChange={(v: any) => setSelectedRole(v)}>
                  <SelectTrigger className="bg-white/50 dark:bg-black/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MUSTAHIQ">🎓 Mustahiq (Wali Kelas)</SelectItem>
                    <SelectItem value="MUNAWIB">📚 Munawwib (Pengajar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="pt-2">
                <Button
                  onClick={handleCreateAccount}
                  disabled={isPending || !customUsername.trim()}
                  className="bg-blue-gradient text-white font-bold w-full rounded-xl cursor-pointer"
                >
                  {isPending ? "Membuat akun..." : "Buat Akun Sekarang"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Edit Akun */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md bg-popover backdrop-blur-xl border border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-glow-gold">Edit Akun Pengguna</DialogTitle>
            <DialogDescription>
              Perbarui username, role, atau ubah password untuk <b>{editingItem?.nama}</b>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEditAccount} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Username</Label>
              <Input
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                placeholder="contoh: khulal"
                required
                className="font-mono bg-white/50 dark:bg-black/20"
              />
            </div>

            {editingItem?.user?.roleId !== "WALI_SANTRI" && (
              <div className="space-y-1.5">
                <Label>Peran / Role</Label>
                <Select value={editRole} onValueChange={(v: any) => setEditRole(v)}>
                  <SelectTrigger className="bg-white/50 dark:bg-black/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MUSTAHIQ">🎓 Mustahiq (Wali Kelas)</SelectItem>
                    <SelectItem value="MUNAWIB">📚 Munawwib (Pengajar)</SelectItem>
                    <SelectItem value="OPERATOR">⚡ Operator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Password Baru (Opsional)</Label>
              <Input
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="Kosongkan jika tidak ingin mengubah password"
                className="bg-white/50 dark:bg-black/20"
              />
              <p className="text-xs text-muted-foreground">Minimal 6 karakter jika diisi.</p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="editActive"
                checked={editActive}
                onChange={(e) => setEditActive(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
              />
              <Label htmlFor="editActive" className="cursor-pointer text-sm font-normal">
                Akun Aktif (Dapat Login ke Sistem)
              </Label>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                className="rounded-xl"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isPending || !editUsername.trim()}
                className="bg-blue-gradient text-white font-bold rounded-xl cursor-pointer"
              >
                {isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Buat Akun Wali */}
      <Dialog open={createWaliDialogOpen} onOpenChange={(o) => { setCreateWaliDialogOpen(o); if (!o) setNewAccountInfo(null); }}>
        <DialogContent className="max-w-md bg-popover backdrop-blur-xl border border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-glow-gold">Buat Akun Login Wali Santri</DialogTitle>
            <DialogDescription>
              Membuat akun untuk <b>{selectedWali?.nama}</b>. Password default: <b className="font-mono">pesantren123</b>
            </DialogDescription>
          </DialogHeader>

          {newAccountInfo && (
            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-500 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="h-5 w-5" /> Akun Berhasil Dibuat!
                </div>
                <p className="text-sm">Sampaikan informasi ini kepada wali santri bersangkutan:</p>
                <div className="bg-white dark:bg-black/40 rounded-lg p-3 space-y-1 text-sm font-mono border border-green-500/10">
                  <div>🔑 Username: <b>{newAccountInfo.username}</b></div>
                  <div>🔒 Password: <b>{newAccountInfo.password}</b></div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center justify-center gap-1.5 border-green-500/30 text-green-700 dark:text-green-500 hover:bg-green-500/20 font-bold rounded-xl cursor-pointer"
                  onClick={() => {
                    navigator.clipboard.writeText(`Username: ${newAccountInfo.username}\nPassword: ${newAccountInfo.password}`);
                    toast.success("Berhasil disalin!", { description: "Informasi akun berhasil disalin ke clipboard." });
                  }}
                >
                  <Copy className="h-4 w-4" /> Salin Info Akun
                </Button>
                <p className="text-xs opacity-80">⚠️ Pengguna wajib mengganti password saat pertama kali login.</p>
              </div>
              <DialogFooter>
                <Button onClick={() => setCreateWaliDialogOpen(false)} className="bg-blue-gradient text-white rounded-xl w-full">Tutup</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        message={confirmMessage}
        onConfirm={() => { confirmAction?.(); setConfirmOpen(false); }}
        variant="warning"
      />
    </div>
  );
}
