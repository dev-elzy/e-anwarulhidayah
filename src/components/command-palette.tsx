"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  Search,
  Compass,
  Sun,
  Moon,
  Laptop,
  KeyRound,
  LogOut,
  Command,
  ArrowRight
} from "lucide-react";

interface CommandItem {
  title: string;
  category: string;
  action: () => void;
  icon: React.ComponentType<any>;
}

export function CommandPalette() {
  const router = useRouter();
  const { data: session } = useSession();
  const { setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const role = session?.user?.role || "";

  // Trigger modal on Ctrl+K / Cmd+K or custom open event
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    const handleOpenEvent = () => {
      setIsOpen(true);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-palette", handleOpenEvent);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", handleOpenEvent);
    };
  }, []);

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Map route configurations for search
  const getCommands = (): CommandItem[] => {
    const list: CommandItem[] = [];

    // Navigation items depending on user role
    if (role === "SUPER_ADMIN") {
      list.push(
        { title: "Dashboard Super Admin", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/super-admin") },
        { title: "Manajemen User / Pengguna", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/super-admin/users") },
        { title: "Hak Akses Pengguna", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/super-admin/permissions") },
        { title: "Pengaturan Sistem", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/super-admin/settings") },
        { title: "Backup Database", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/super-admin/backup") },
        { title: "Audit Log / Riwayat", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/super-admin/audit") }
      );
    } else if (role === "OPERATOR") {
      list.push(
        { title: "Dashboard Operator", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/operator") },
        { title: "Data Santri", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/operator/santri") },
        { title: "Data Ustadz", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/operator/ustadz") },
        { title: "Data Kelas", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/operator/kelas") },
        { title: "Data Kamar", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/operator/kamar") },
        { title: "Data Kitab/Mapel", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/operator/kitab") },
        { title: "Kitab & Target Nadzom", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/operator/nadzom") },
        { title: "Data Alumni", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/operator/alumni") },
        { title: "Jadwal Madrasah", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/operator/jadwal") },
        { title: "QR Kelas (Sesi)", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/operator/qr-kelas") },
        { title: "Pengumuman", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/operator/pengumuman") },
        { title: "Kehadiran Asatidz", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/operator/kehadiran-ustadz") },
        { title: "Arsip Nilai & Raport", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/operator/arsip") },
        { title: "Akun Pengguna", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/operator/akun") },
        { title: "Daftar Peran", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/operator/roles") },
        { title: "Daftar Izin Akses", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/operator/permissions") },
        { title: "Pemetaan Peran", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/operator/mapping") },
        { title: "Backup & Restore", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/operator/backup") },
        { title: "Pengaturan Sistem", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/operator/settings") }
      );
    } else if (role === "PENGASUH") {
      list.push(
        { title: "Dashboard Pondok Pengasuh", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/pengasuh") },
        { title: "Monitoring Kelas", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/pengasuh/monitoring-kelas") },
        { title: "Monitoring Ustadz", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/pengasuh/monitoring-ustadz") },
        { title: "Monitoring Santri", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/pengasuh/monitoring-santri") }
      );
    } else if (role === "MUSTAHIQ") {
      list.push(
        { title: "Dashboard Mustahiq", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/mustahiq") },
        { title: "Scan QR Kehadiran", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/munawib/scan") },
        { title: "Kehadiran Kelas", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/mustahiq/kehadiran") },
        { title: "Nilai Kelas", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/mustahiq/nilai") },
        { title: "Hafalan Nadzom", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/mustahiq/hafalan") },
        { title: "Catatan Santri", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/mustahiq/catatan") },
        { title: "Cetak Raport", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/mustahiq/raport") }
      );
    } else if (role === "MUNAWIB") {
      list.push(
        { title: "Dashboard Mengajar Munawib", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/munawib") },
        { title: "Scan QR Sesi", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/munawib/scan") },
        { title: "Input Nilai Santri", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/munawib/nilai") }
      );
    } else if (role === "WALI_SANTRI") {
      list.push(
        { title: "Dashboard Anak Wali Santri", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/wali") },
        { title: "Kehadiran Anak", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/wali/kehadiran") },
        { title: "Hafalan Anak", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/wali/hafalan") },
        { title: "Catatan Ustadz", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/wali/catatan") },
        { title: "Pengumuman", category: "Navigasi", icon: Compass, action: () => router.push("/dashboard/wali/pengumuman") }
      );
    }

    // Theme controls
    list.push(
      { title: "Ganti Tema ke Mode Terang (Light Mode)", category: "Tampilan", icon: Sun, action: () => { setTheme("light"); setIsOpen(false); } },
      { title: "Ganti Tema ke Mode Gelap (Dark Mode)", category: "Tampilan", icon: Moon, action: () => { setTheme("dark"); setIsOpen(false); } },
      { title: "Ganti Tema Mengikuti Sistem", category: "Tampilan", icon: Laptop, action: () => { setTheme("system"); setIsOpen(false); } }
    );

    // Account controls
    if (session) {
      list.push(
        {
          title: "Pengaturan Akun (Ganti Username & Password)",
          category: "Akun",
          icon: KeyRound,
          action: () => {
            setIsOpen(false);
            window.dispatchEvent(new CustomEvent("open-user-profile"));
          }
        },
        { title: "Keluar dari Aplikasi", category: "Akun", icon: LogOut, action: () => signOut({ callbackUrl: "/login" }) }
      );
    }

    return list;
  };

  const filteredCommands = getCommands().filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    }
  };

  if (!isOpen) {
    // Hidden shortcut helper button at bottom-right of viewport for mouse users if desired,
    // or just keyboard-only. Let's make a tiny trigger button overlay.
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 md:flex hidden items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/80 bg-background/90 text-muted-foreground hover:text-foreground text-xs font-medium shadow-sm hover:shadow transition-all duration-200"
        title="Buka Command Palette (Ctrl+K)"
      >
        <Command className="h-3.5 w-3.5" />
        <span>Menu</span>
        <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[9px] font-medium opacity-100">
          Ctrl+K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-[4px] transition-opacity duration-200"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal Box */}
      <div
        ref={containerRef}
        onKeyDown={handleKeyDown}
        className="relative w-full max-w-lg rounded-2xl border border-border/50 bg-background/95 shadow-2xl backdrop-blur-xl flex flex-col max-h-[450px] overflow-hidden transition-all duration-300 transform scale-100"
      >
        {/* Search header */}
        <div className="flex items-center gap-2 border-b border-border/40 px-4 py-3 shrink-0">
          <Search className="h-4.5 w-4.5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Cari halaman, ubah tema, atau keluar..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground text-foreground h-7"
          />
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-muted/30 px-1.5 font-mono text-[9px] font-medium text-muted-foreground opacity-100">
            esc
          </kbd>
        </div>

        {/* Command list */}
        <div className="flex-1 overflow-y-auto p-2 min-h-[150px] max-h-[350px]">
          {filteredCommands.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Compass className="h-8 w-8 text-muted-foreground/60 stroke-[1.5]" />
              <p className="text-sm font-semibold text-foreground/80 mt-2">Tidak menemukan hasil</p>
              <p className="text-xs text-muted-foreground mt-0.5">Cobalah kata kunci lain</p>
            </div>
          ) : (
            <div>
              {/* Group items by category */}
              {Array.from(new Set(filteredCommands.map((c) => c.category))).map((category) => {
                const categoryItems = filteredCommands.filter((c) => c.category === category);
                return (
                  <div key={category} className="mb-2 last:mb-0">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-1.5">
                      {category}
                    </div>
                    <div className="space-y-0.5">
                      {categoryItems.map((cmd) => {
                        const cmdIndex = filteredCommands.indexOf(cmd);
                        const isSelected = cmdIndex === selectedIndex;
                        const Icon = cmd.icon;
                        return (
                          <button
                            key={cmd.title}
                            onClick={cmd.action}
                            onMouseEnter={() => setSelectedIndex(cmdIndex)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-all duration-150 ${
                              isSelected
                                ? "bg-primary/10 text-primary"
                                : "text-foreground/80 hover:bg-muted/50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`flex items-center justify-center h-6 w-6 rounded-lg border border-border/50 ${isSelected ? "bg-primary/15 text-primary border-primary/20" : "bg-muted/40 text-muted-foreground"}`}>
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              <span className="truncate">{cmd.title}</span>
                            </div>
                            {isSelected && (
                              <ArrowRight className="h-3.5 w-3.5 text-primary animate-pulse" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="border-t border-border/40 px-4 py-2 bg-muted/20 flex items-center justify-between text-[10px] text-muted-foreground shrink-0 font-medium">
          <div className="flex items-center gap-1.5">
            <span>Navigasi:</span>
            <span className="flex items-center gap-0.5 bg-background border px-1 rounded font-mono">↑↓</span>
            <span>Pilih:</span>
            <span className="bg-background border px-1 rounded font-mono">Enter</span>
          </div>
          <div>e-AnwarulHidayah Command Center</div>
        </div>
      </div>
    </div>
  );
}
