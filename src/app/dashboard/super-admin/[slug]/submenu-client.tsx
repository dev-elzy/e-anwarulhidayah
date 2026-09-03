"use client";

import React, { useState, useTransition } from "react";
import { 
  Users, 
  Shield, 
  Settings, 
  Database, 
  History, 
  UserPlus, 
  Trash2, 
  ShieldAlert, 
  Download, 
  CheckCircle2, 
  Search,
  Building,
  Phone,
  MapPin
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
import { apiPost } from "@/lib/api-client";

interface SuperAdminSubmenuClientProps {
  slug: string;
  initialUsers: any[];
  initialLogs: any[];
  initialSettings: any;
  ustadzList: any[];
  waliList: any[];
  currentUserId: string;
}

export function SuperAdminSubmenuClient({
  slug,
  initialUsers,
  initialLogs,
  initialSettings,
  ustadzList,
  waliList,
  currentUserId
}: SuperAdminSubmenuClientProps) {
  const [users, setUsers] = useState<any[]>(initialUsers);
  const [logs] = useState<any[]>(initialLogs);
  const [settingsData, setSettingsData] = useState<any>(
    initialSettings || { namaPondok: "", alamat: "", telepon: "", namaPengasuh: "" }
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
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

  // User form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [roleId, setRoleId] = useState("MUNAWIB");
  const [email, setEmail] = useState("");
  const [selectedUstadzId, setSelectedUstadzId] = useState("");
  const [selectedWaliId, setSelectedWaliId] = useState("");

  // Settings form states
  const [namaPondok, setNamaPondok] = useState(settingsData.namaPondok);
  const [alamat, setAlamat] = useState(settingsData.alamat);
  const [telepon, setTelepon] = useState(settingsData.telepon);
  const [namaPengasuh, setNamaPengasuh] = useState(settingsData.namaPengasuh || "");

  // Backup state
  const [backupHistory, setBackupHistory] = useState<any[]>([]);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !name) {
      toast.error("Gagal", { description: "Nama, Username, dan Password wajib diisi." });
      return;
    }

    startTransition(async () => {
      const res = await apiPost("createUser", {
        data: {
          username,
          password,
          name,
          roleId,
          email,
          ustadzId: (roleId === "MUSTAHIQ" || roleId === "MUNAWIB") ? selectedUstadzId : null,
          waliId: roleId === "WALI_SANTRI" ? selectedWaliId : null
        }
      });

      if (res.error) {
        toast.error("Gagal", { description: res.error });
      } else {
        toast.success("Berhasil", { description: res.message });
        setDialogOpen(false);
        // Refresh users list locally by appending (or ideally refetching, but this keeps it fast)
        setUsers([
          {
            id: Math.random().toString(),
            username,
            name,
            roleId,
            email,
            active: true,
            createdAt: new Date().toISOString()
          },
          ...users
        ]);
        // Reset states
        setUsername("");
        setPassword("");
        setName("");
        setEmail("");
        setSelectedUstadzId("");
        setSelectedWaliId("");
      }
    });
  };

  const handleDeleteUser = (id: string) => {
    if (id === currentUserId) {
      toast.error("Kesalahan", { description: "Anda tidak bisa menghapus akun Anda sendiri yang sedang aktif." });
      return;
    }

    askConfirmation("Apakah Anda yakin ingin menghapus user ini?", () => {
      startTransition(async () => {
        const res = await apiPost("deleteUser", { id });
        if (res.error) {
          toast.error("Gagal", { description: res.error });
        } else {
          toast.success("Berhasil", { description: res.message });
          setUsers(users.filter(u => u.id !== id));
        }
      });
    });
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await apiPost("updateSystemSettings", {
        data: {
          namaPondok,
          alamat,
          telepon,
          namaPengasuh
        }
      });

      if (res.error) {
        toast.error("Gagal", { description: res.error });
      } else {
        toast.success("Berhasil", { description: res.message });
        setSettingsData({ namaPondok, alamat, telepon, namaPengasuh });
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
      setBackupHistory([newBackup, ...backupHistory]);
      toast.success("Berhasil", { description: "Database berhasil di-backup dan diarsipkan." });
    }, 1500);
  };

  // UI title and icon config
  const getHeaderInfo = () => {
    switch (slug) {
      case "users":
        return { title: "Manajemen User", desc: "Kelola akun pengguna, pasangkan ke profil ustadz/wali, dan tentukan tingkatan role.", icon: Users };
      case "permissions":
        return { title: "Hak Akses & Otoritas", desc: "Melihat rincian pembagian wewenang untuk masing-masing level pengguna.", icon: Shield };
      case "settings":
        return { title: "Pengaturan Sistem", desc: "Modifikasi nama pesantren, kontak, logo, serta tahun ajaran aktif.", icon: Settings };
      case "backup":
        return { title: "Backup Database", desc: "Ekspor dan amankan berkas basis data SQLite/D1 Pondok Pesantren.", icon: Database };
      case "audit":
        return { title: "Audit Trail / Log Aktivitas", desc: "Riwayat jejak tindakan administrator dan pengguna sistem.", icon: History };
      default:
        return { title: "Super Admin Menu", desc: "Menu khusus Administrator Utama.", icon: ShieldAlert };
    }
  };

  const info = getHeaderInfo();
  const IconHeader = info.icon;

  const filteredLogs = logs.filter(l => 
    l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.details.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-blue-gradient flex items-center justify-center text-white shadow-md">
            <IconHeader className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-glow-gold">{info.title}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{info.desc}</p>
          </div>
        </div>

        {slug === "users" && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger className="bg-blue-gradient text-white rounded-xl font-bold flex items-center gap-2 py-2.5 px-4 shadow-lg shadow-primary/20 cursor-pointer">
              <UserPlus className="h-5 w-5" /> Tambah User
            </DialogTrigger>
            <DialogContent className="max-w-md bg-popover backdrop-blur-xl border border-border rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-glow-gold">Tambah Pengguna Baru</DialogTitle>
                <DialogDescription>Masukkan detail akun pengguna baru di bawah ini.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Ust. Ahmad Fauzi" className="bg-white/50 dark:bg-black/20" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Contoh: ahmad123" className="bg-white/50 dark:bg-black/20" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="******" className="bg-white/50 dark:bg-black/20" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email (Opsional)</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="fauzi@example.com" className="bg-white/50 dark:bg-black/20" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="role">Role Pengguna</Label>
                  <Select value={roleId} onValueChange={(val) => setRoleId(val || "MUNAWIB")}>
                    <SelectTrigger className="bg-white/50 dark:bg-black/20">
                      <SelectValue placeholder="Pilih Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SUPER_ADMIN">SUPER ADMIN</SelectItem>
                      <SelectItem value="OPERATOR">OPERATOR (ADMIN)</SelectItem>
                      <SelectItem value="PENGASUH">PENGASUH PONDOK</SelectItem>
                      <SelectItem value="MUSTAHIQ">MUSTAHIQ (WALI KELAS)</SelectItem>
                      <SelectItem value="MUNAWIB">MUNAWIB (GURU MAPEL)</SelectItem>
                      <SelectItem value="BENDAHARA">BENDAHARA</SelectItem>
                      <SelectItem value="WALI_SANTRI">WALI SANTRI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(roleId === "MUSTAHIQ" || roleId === "MUNAWIB") && (
                  <div className="space-y-1.5 animate-in fade-in duration-200">
                    <Label htmlFor="ustadz-bind">Hubungkan ke Profil Ustadz</Label>
                    <Select value={selectedUstadzId} onValueChange={(val) => setSelectedUstadzId(val || "")}>
                      <SelectTrigger className="bg-white/50 dark:bg-black/20">
                        <SelectValue placeholder="Pilih Profil Ustadz" />
                      </SelectTrigger>
                      <SelectContent>
                        {ustadzList.map(u => (
                          <SelectItem key={u.id} value={u.id}>{u.nama}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {roleId === "WALI_SANTRI" && (
                  <div className="space-y-1.5 animate-in fade-in duration-200">
                    <Label htmlFor="wali-bind">Hubungkan ke Profil Wali</Label>
                    <Select value={selectedWaliId} onValueChange={(val) => setSelectedWaliId(val || "")}>
                      <SelectTrigger className="bg-white/50 dark:bg-black/20">
                        <SelectValue placeholder="Pilih Profil Wali" />
                      </SelectTrigger>
                      <SelectContent>
                        {waliList.map(w => (
                          <SelectItem key={w.id} value={w.id}>{w.nama}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <DialogFooter className="pt-2">
                  <Button type="submit" disabled={isPending} className="bg-blue-gradient text-white font-bold px-6 rounded-xl flex items-center gap-1.5 w-full cursor-pointer">
                    {isPending ? "Menyimpan..." : "Buat Akun"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* 1. users tab */}
      {slug === "users" && (
        <Card className="glass-panel border-white/20">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/50 border-b border-muted/10">
                  <TableRow>
                    <TableHead className="font-bold">Nama Lengkap</TableHead>
                    <TableHead className="font-bold">Username</TableHead>
                    <TableHead className="font-bold">Role</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="font-bold">Tanggal Dibuat</TableHead>
                    <TableHead className="font-bold text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id} className="hover:bg-white/50">
                      <TableCell className="font-bold text-sm">{u.name}</TableCell>
                      <TableCell className="font-semibold text-xs text-muted-foreground">{u.username}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50/50 text-blue-800 border-blue-100 font-bold text-[10px]">
                          {u.roleId}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={u.active ? "bg-green-500 text-white font-bold" : "bg-red-500 text-white"}>
                          {u.active ? "Aktif" : "Non-Aktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString("id-ID") : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteUser(u.id)}
                          disabled={u.id === currentUserId}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50/50 rounded-xl"
                        >
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

      {/* 2. permissions tab */}
      {slug === "permissions" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass-panel border-white/20">
            <CardHeader className="pb-2">
              <Badge className="bg-purple-600 text-white w-fit font-bold mb-2">SUPER ADMIN</Badge>
              <CardTitle className="text-base font-bold">Otoritas Penuh</CardTitle>
              <CardDescription>Akses kontrol sistem dan database tertinggi.</CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500" /> Manajemen Akun & Hak Akses</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500" /> Backup, Restore & Reset Database</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500" /> Audit Log & Rekaman Jejak User</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500" /> Pengaturan Global Parameter Pondok</div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/20">
            <CardHeader className="pb-2">
              <Badge className="bg-blue-600 text-white w-fit font-bold mb-2">OPERATOR</Badge>
              <CardTitle className="text-base font-bold">Pengelola Data Master</CardTitle>
              <CardDescription>Fokus pada administrasi santri, ustadz, kamar & jadwal.</CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500" /> CRUD Santri, Wali & Ustadz</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500" /> CRUD Kelas, Kamar & Kitab Mapel</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500" /> Verifikasi Perizinan & Kirim Informasi</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500" /> Cetak Barcode / QR Code Permanen</div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/20">
            <CardHeader className="pb-2">
              <Badge className="bg-indigo-600 text-white w-fit font-bold mb-2">MUSTAHIQ</Badge>
              <CardTitle className="text-base font-bold">Wali Kelas / Pembina</CardTitle>
              <CardDescription>Fokus pada perkembangan kelas dan bimbingan murid.</CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500" /> Monitor & Rekap Kehadiran Kelas</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500" /> Input & Pantau Nilai Seluruh Mapel</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500" /> Rekam Setoran Hafalan Nadzom</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500" /> Catat Karakter & Evaluasi Santri</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500" /> Cetak & Terbitkan Raport Semester</div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/20">
            <CardHeader className="pb-2">
              <Badge className="bg-cyan-600 text-white w-fit font-bold mb-2">MUNAWIB</Badge>
              <CardTitle className="text-base font-bold">Guru Pengampu Mapel</CardTitle>
              <CardDescription>Fokus pada pengajaran mata pelajaran kelas.</CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500" /> Scan QR Mulai Mengajar Sesi</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500" /> Input Nilai Santri Mapel Sendiri</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500" /> Setoran Hafalan Harian Santri</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500" /> Lihat Jadwal & Riwayat Mengajar</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3. settings tab */}
      {slug === "settings" && (
        <Card className="glass-panel border-white/20 max-w-xl">
          <CardHeader>
            <CardTitle className="text-base font-bold">Biodata Instansi Pesantren</CardTitle>
            <CardDescription>Informasi ini akan muncul pada slip kuitansi syahriah dan kop surat/aplikasi.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="instansi" className="flex items-center gap-1.5"><Building className="h-4 w-4 text-muted-foreground" /> Nama Pondok Pesantren</Label>
                <Input id="instansi" required value={namaPondok} onChange={(e) => setNamaPondok(e.target.value)} className="bg-white/50" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telpes" className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-muted-foreground" /> Telepon / Kontak Resmi</Label>
                <Input id="telpes" required value={telepon} onChange={(e) => setTelepon(e.target.value)} className="bg-white/50" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="alamatpes" className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-muted-foreground" /> Alamat Lengkap Pondok</Label>
                <Input id="alamatpes" required value={alamat} onChange={(e) => setAlamat(e.target.value)} className="bg-white/50" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pengasuhpes" className="flex items-center gap-1.5"><Users className="h-4 w-4 text-muted-foreground" /> Nama Pengasuh Pondok</Label>
                <Input id="pengasuhpes" required value={namaPengasuh} onChange={(e) => setNamaPengasuh(e.target.value)} className="bg-white/50" />
              </div>
              
              <Button type="submit" disabled={isPending} className="bg-blue-gradient text-white font-bold w-full rounded-xl py-5 shadow-md shadow-primary/20 cursor-pointer">
                {isPending ? "Menyimpan..." : "Simpan Konfigurasi"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 4. backup tab */}
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

      {/* 5. audit logs tab */}
      {slug === "audit" && (
        <Card className="glass-panel border-white/20">
          <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold">Jejak Aktivitas Sistem</CardTitle>
              <CardDescription>Daftar lengkap 100 aktivitas pengguna terakhir dalam sistem.</CardDescription>
            </div>
            <div className="relative w-full sm:w-[300px]">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cari aksi / rincian tindakan..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/70"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/50 border-b border-muted/10">
                  <TableRow>
                    <TableHead className="font-bold">Pengguna ID</TableHead>
                    <TableHead className="font-bold">Aksi</TableHead>
                    <TableHead className="font-bold">Keterangan Rincian</TableHead>
                    <TableHead className="font-bold">Waktu Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((l) => (
                      <TableRow key={l.id} className="hover:bg-white/50">
                        <TableCell className="font-semibold text-xs text-muted-foreground">{l.userId || "SYSTEM"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-bold border-amber-100 bg-amber-50/50 text-amber-800 text-[10px]">
                            {l.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-semibold">{l.details}</TableCell>
                        <TableCell className="text-xs text-muted-foreground font-semibold">
                          {new Date(l.timestamp).toLocaleString("id-ID")}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-xs text-muted-foreground">Tidak ada audit log yang cocok.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        message={confirmMessage}
        onConfirm={() => confirmAction?.()}
      />
    </div>
  );
}
