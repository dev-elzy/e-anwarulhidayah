"use client";

import React, { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { KeyRound, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { changeUserPassword } from "@/actions/master";

export function ChangePasswordModal() {
  const { data: session, update } = useSession();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const mustChange = (session?.user as any)?.mustChangePassword;

  if (!mustChange) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Password terlalu pendek", { description: "Minimal 8 karakter." });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok", { description: "Pastikan kedua password sama." });
      return;
    }
    startTransition(async () => {
      const userId = (session?.user as any)?.id;
      if (!userId) return;
      const res = await changeUserPassword(userId, newPassword);
      if (res.error) {
        toast.error("Gagal", { description: res.error });
      } else {
        toast.success("Password berhasil diubah!", { description: "Anda kini menggunakan password baru." });
        // Refresh session to clear mustChangePassword flag
        await update({ mustChangePassword: false });
        setNewPassword("");
        setConfirmPassword("");
      }
    });
  };

  return (
    <Dialog open={true} onOpenChange={() => {}} disablePointerDismissal={true}>
      <DialogContent
        className="max-w-md bg-popover backdrop-blur-xl border border-border rounded-2xl shadow-2xl"
        showCloseButton={false}
      >
        <DialogHeader>
          <div className="flex justify-center mb-3">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-300/40">
              <KeyRound className="h-8 w-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl font-bold text-glow-gold">
            Buat Password Baru
          </DialogTitle>
          <DialogDescription className="text-center text-sm leading-relaxed mt-1">
            Akun Anda menggunakan password default. Demi keamanan, harap buat password baru sebelum melanjutkan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Password Baru */}
          <div className="space-y-1.5">
            <Label htmlFor="new-pass">Password Baru</Label>
            <div className="relative">
              <Input
                id="new-pass"
                type={showNew ? "text" : "password"}
                placeholder="Minimal 8 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-white/60 dark:bg-black/20 pr-10"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowNew((v) => !v)}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Konfirmasi Password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirm-pass">Konfirmasi Password</Label>
            <div className="relative">
              <Input
                id="confirm-pass"
                type={showConfirm ? "text" : "password"}
                placeholder="Ulangi password baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-white/60 dark:bg-black/20 pr-10"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowConfirm((v) => !v)}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Strength indicator */}
          {newPassword.length > 0 && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      i < Math.min(Math.floor(newPassword.length / 3), 4)
                        ? newPassword.length >= 12
                          ? "bg-green-500"
                          : newPassword.length >= 8
                          ? "bg-amber-400"
                          : "bg-red-400"
                        : "bg-muted/30"
                    }`}
                  />
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {newPassword.length < 8 ? "Terlalu pendek" : newPassword.length < 12 ? "Sedang" : "Kuat"}
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-amber-300/30 min-h-[44px] flex items-center gap-2"
          >
            <ShieldCheck className="h-5 w-5" />
            {isPending ? "Menyimpan..." : "Simpan Password Baru"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
