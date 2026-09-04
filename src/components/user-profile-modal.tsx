"use client";

import React, { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { User, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiPost } from "@/lib/api-client";

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileModal({ open, onOpenChange }: UserProfileModalProps) {
  const { data: session, update } = useSession();
  const [username, setUsername] = useState((session?.user as any)?.username || session?.user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  // Keep username synced when session changes or modal opens
  React.useEffect(() => {
    const currentUsername = (session?.user as any)?.username || session?.user?.name || "";
    if (currentUsername) {
      setUsername(currentUsername);
    }
    if (open) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [open, session]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      toast.error("Username tidak boleh kosong");
      return;
    }

    if (newPassword) {
      if (!currentPassword) {
        toast.error("Password saat ini diperlukan untuk mengubah password");
        return;
      }
      if (newPassword.length < 6) {
        toast.error("Password baru minimal 6 karakter");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("Konfirmasi password baru tidak cocok");
        return;
      }
    }

    startTransition(async () => {
      const res = await apiPost("updateSelfProfile", {
        data: {
          username: username.trim(),
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }
      });

      if (res.error) {
        toast.error("Gagal memperbarui profil", { description: res.error });
      } else {
        toast.success("Profil berhasil diperbarui", { description: res.message });
        if (update) {
          await update({
            ...session,
            user: {
              ...session?.user,
              username: username.trim(),
            },
          });
        }
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-popover/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-blue-gradient flex items-center justify-center text-white shadow-sm">
              <User className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-glow-gold text-lg">Pengaturan Akun Saya</DialogTitle>
              <DialogDescription className="text-xs">
                Ubah username dan password akun Anda
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Info user & role */}
          <div className="bg-muted/40 rounded-xl p-3 border border-border/50 flex items-center justify-between text-xs">
            <div>
              <span className="text-muted-foreground">Nama:</span> <b>{session?.user?.name || "-"}</b>
            </div>
            <div>
              <span className="text-muted-foreground">Peran:</span>{" "}
              <b className="text-primary">{session?.user?.role || "-"}</b>
            </div>
          </div>

          {/* Ganti Username */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" /> Username Akun
            </Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
              placeholder="contoh: khulal"
              required
              className="font-mono bg-background/50"
            />
            <p className="text-[11px] text-muted-foreground">
              Username digunakan untuk login ke sistem. Gunakan huruf kecil tanpa spasi.
            </p>
          </div>

          <div className="border-t border-border/60 my-2 pt-2 space-y-3">
            <div className="text-xs font-bold flex items-center gap-1.5 text-foreground">
              <Lock className="h-3.5 w-3.5 text-primary" /> Ubah Password (Opsional)
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Password Saat Ini</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Masukkan password saat ini jika ingin ganti password"
                className="bg-background/50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Password Baru</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 karakter"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Ulangi Password Baru</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Konfirmasi password"
                  className="bg-background/50"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isPending || !username.trim()}
              className="bg-blue-gradient text-white font-bold rounded-xl cursor-pointer"
            >
              {isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
