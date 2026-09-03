"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Users,
  Shield,
  Settings,
  Database,
  History,
  GraduationCap,
  BookOpen,
  DoorOpen,
  Calendar,
  QrCode,
  FileCheck,
  Megaphone,
  LogOut,
  Menu,
  X,
  ClipboardList,
  UserCheck,
  ChevronDown,
  KeyRound,
  Search,
  Sun,
  Moon,
  Laptop
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificationPopover } from "@/components/notification-popover";

// Roles that use bottom grid nav on mobile
const BOTTOM_NAV_ROLES = ["MUSTAHIQ", "MUNAWIB", "WALI_SANTRI"];

interface SidebarProps {
  user: {
    id: string;
    name: string;
    role: string;
    username: string;
  };
}

interface SubMenuItem {
  title: string;
  href: string;
  icon: React.ComponentType<any>;
}

interface MenuItem {
  title: string;
  mobileLabel?: string; // short label for bottom nav
  href?: string;
  icon: React.ComponentType<any>;
  children?: SubMenuItem[];
}

export function DashboardSidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const useBottomNav = BOTTOM_NAV_ROLES.includes(user.role);

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => ({
      [title]: !prev[title]
    }));
  };

  const getMenuItems = (role: string): MenuItem[] => {
    switch (role) {
      case "SUPER_ADMIN":
        return [
          { title: "Dashboard", href: "/dashboard/super-admin", icon: LayoutDashboard },
          { title: "Manajemen User", href: "/dashboard/super-admin/users", icon: Users },
          { title: "Hak Akses", href: "/dashboard/super-admin/permissions", icon: Shield },
          { title: "Pengaturan Sistem", href: "/dashboard/super-admin/settings", icon: Settings },
          { title: "Backup Database", href: "/dashboard/super-admin/backup", icon: Database },
          { title: "Audit Log", href: "/dashboard/super-admin/audit", icon: History },
        ];
      case "OPERATOR":
        return [
          { title: "Dashboard", href: "/dashboard/operator", icon: LayoutDashboard },
          {
            title: "Data Master",
            icon: GraduationCap,
            children: [
              { title: "Data Santri", href: "/dashboard/operator/santri", icon: GraduationCap },
              { title: "Data Ustadz", href: "/dashboard/operator/ustadz", icon: Users },
              { title: "Data Kelas", href: "/dashboard/operator/kelas", icon: BookOpen },
              { title: "Data Kamar", href: "/dashboard/operator/kamar", icon: DoorOpen },
              { title: "Data Kitab/Mapel", href: "/dashboard/operator/kitab", icon: BookOpen },
              { title: "Kitab & Target Nadzom", href: "/dashboard/operator/nadzom", icon: BookOpen },
              { title: "Data Alumni", href: "/dashboard/operator/alumni", icon: Users },
            ]
          },
          {
            title: "Akademik & Layanan",
            icon: Calendar,
            children: [
              { title: "Jadwal Madrasah", href: "/dashboard/operator/jadwal", icon: Calendar },
              { title: "QR Kelas (Sesi)", href: "/dashboard/operator/qr-kelas", icon: QrCode },
              { title: "Pengumuman", href: "/dashboard/operator/pengumuman", icon: Megaphone },
              { title: "Kehadiran Asatidz", href: "/dashboard/operator/kehadiran-ustadz", icon: UserCheck },
              { title: "Kehadiran Santri", href: "/dashboard/operator/kehadiran-santri", icon: UserCheck },
              { title: "Cetak & Arsip Raport", href: "/dashboard/operator/arsip", icon: FileCheck },
            ]
          },
          {
            title: "Keamanan & Sistem",
            icon: Shield,
            children: [
              { title: "Akun Pengguna", href: "/dashboard/operator/akun", icon: KeyRound },
              { title: "Daftar Peran", href: "/dashboard/operator/roles", icon: Shield },
              { title: "Daftar Izin Akses", href: "/dashboard/operator/permissions", icon: Shield },
              { title: "Pemetaan Peran", href: "/dashboard/operator/mapping", icon: Shield },
              { title: "Backup & Restore", href: "/dashboard/operator/backup", icon: Database },
              { title: "Pengaturan Sistem", href: "/dashboard/operator/settings", icon: Settings },
            ]
          }
        ];
      case "PENGASUH":
        return [
          { title: "Dashboard Pondok", href: "/dashboard/pengasuh", icon: LayoutDashboard },
          { title: "Monitoring Kelas", href: "/dashboard/pengasuh/monitoring-kelas", icon: BookOpen },
          { title: "Monitoring Ustadz", href: "/dashboard/pengasuh/monitoring-ustadz", icon: Users },
          { title: "Monitoring Santri", href: "/dashboard/pengasuh/monitoring-santri", icon: GraduationCap },
        ];
      case "MUSTAHIQ":
        return [
          { title: "Dashboard", mobileLabel: "Home", href: "/dashboard/mustahiq", icon: LayoutDashboard },
          { title: "Scan QR Sesi", mobileLabel: "Scan QR", href: "/dashboard/munawib/scan", icon: QrCode },
          { title: "Absensi Kelas", mobileLabel: "Absensi", href: "/dashboard/mustahiq/kehadiran", icon: Calendar },
          { title: "Nilai Kelas", mobileLabel: "Nilai", href: "/dashboard/mustahiq/nilai", icon: GraduationCap },
          { title: "Hafalan Nadzom", mobileLabel: "Hafalan", href: "/dashboard/mustahiq/hafalan", icon: BookOpen },
          { title: "Catatan Santri", mobileLabel: "Catatan", href: "/dashboard/mustahiq/catatan", icon: ClipboardList },
          { title: "Cetak Raport", mobileLabel: "Raport", href: "/dashboard/mustahiq/raport", icon: FileCheck },
        ];
      case "MUNAWIB":
        return [
          { title: "Dashboard Mengajar", mobileLabel: "Home", href: "/dashboard/munawib", icon: LayoutDashboard },
          { title: "Scan QR Sesi", mobileLabel: "Scan QR", href: "/dashboard/munawib/scan", icon: QrCode },
          { title: "Input Nilai", mobileLabel: "Nilai", href: "/dashboard/munawib/nilai", icon: GraduationCap },
        ];
      case "WALI_SANTRI":
        return [
          { title: "Dashboard Anak", mobileLabel: "Home", href: "/dashboard/wali", icon: LayoutDashboard },
          { title: "Kehadiran", mobileLabel: "Kehadiran", href: "/dashboard/wali/kehadiran", icon: UserCheck },
          { title: "Hafalan", mobileLabel: "Hafalan", href: "/dashboard/wali/hafalan", icon: BookOpen },
          { title: "Catatan Ustadz", mobileLabel: "Catatan", href: "/dashboard/wali/catatan", icon: ClipboardList },
          { title: "Pengumuman", mobileLabel: "Pengumuman", href: "/dashboard/wali/pengumuman", icon: Megaphone },
        ];
      default:
        return [];
    }
  };

  const menuItems = useMemo(() => getMenuItems(user.role), [user.role]);

  // Helper: is item active?
  const isItemActive = React.useCallback((href: string) => {
    const dashboardRoots = [
      "/dashboard/super-admin", "/dashboard/operator", "/dashboard/pengasuh",
      "/dashboard/mustahiq", "/dashboard/munawib", "/dashboard/wali"
    ];
    const isDashboard = dashboardRoots.includes(href);
    return isDashboard
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");
  }, [pathname]);

  useEffect(() => {
    const initialOpenGroups: Record<string, boolean> = {};
    menuItems.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some((child) => isItemActive(child.href));
        if (hasActiveChild) {
          initialOpenGroups[item.title] = true;
        }
      }
    });
    setOpenGroups(initialOpenGroups);
  }, [pathname, menuItems, isItemActive]);

  return (
    <>
      {/* ============================================================ */}
      {/* MOBILE HEADER BAR                                            */}
      {/* ============================================================ */}
      {useBottomNav ? (
        /* Simple header for bottom-nav roles — no hamburger */
        <header className="print:hidden md:hidden flex items-center justify-between px-4 py-2 bg-card/95 backdrop-blur-lg border-b border-border/80 sticky top-0 z-40 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-xs">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="font-bold text-sm text-foreground tracking-tight">e-AnwarulHidayah</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <Search className="h-4 w-4" />
            </Button>
            <button
              onClick={() => setIsOpen(true)}
              className="h-8 w-8 rounded-lg border border-border/60 overflow-hidden cursor-pointer flex items-center justify-center"
            >
              <Avatar className="h-full w-full">
                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                  {user.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
          </div>
        </header>
      ) : (
        /* Hamburger header for drawer roles */
        <header className="print:hidden md:hidden flex items-center justify-between px-4 py-2.5 bg-card/95 backdrop-blur-lg border-b border-border/80 sticky top-0 z-40 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-xs">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="font-bold text-sm text-foreground tracking-tight">e-AnwarulHidayah</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setIsOpen(true)} className="cursor-pointer">
              <Menu className="h-5 w-5 text-primary" />
            </Button>
          </div>
        </header>
      )}

      {/* ============================================================ */}
      {/* DESKTOP SIDEBAR (semua role)                                 */}
      {/* ============================================================ */}
      <aside className="print:hidden hidden md:flex flex-col w-64 h-screen sticky top-0 bg-card border-r border-border/80 p-4 z-30 shadow-xs overflow-hidden">
        <div className="flex flex-col flex-1 overflow-hidden space-y-6">
          <div className="flex items-center gap-2.5 px-2 shrink-0">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <GraduationCap className="h-5.5 w-5.5" />
            </div>
            <div>
              <h1 className="font-bold text-base leading-none text-foreground tracking-tight">e-AnwarulHidayah</h1>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mt-1">Sistem Administrasi</p>
            </div>
          </div>

          <nav className="space-y-1.5 flex-1 overflow-y-auto overscroll-contain pr-1 pb-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              if (item.children) {
                const hasActiveChild = item.children.some((child) => isItemActive(child.href));
                const isGroupOpen = !!openGroups[item.title];
                return (
                  <div key={item.title} className="space-y-1">
                    <button
                      onClick={() => toggleGroup(item.title)}
                      className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer group ${
                        hasActiveChild
                          ? "bg-primary/10 text-primary border border-primary/15"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 transition-colors ${hasActiveChild ? "text-primary" : "text-muted-foreground/80 group-hover:text-foreground"}`} />
                        <span>{item.title}</span>
                      </div>
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isGroupOpen ? "rotate-180" : ""} ${hasActiveChild ? "text-primary" : "text-muted-foreground"}`} />
                    </button>
                    <AnimatePresence initial={false}>
                      {isGroupOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="overflow-hidden pl-4 space-y-1"
                        >
                          {item.children.map((child) => {
                            const isChildActive = isItemActive(child.href);
                            const ChildIcon = child.icon;
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                prefetch={true}
                                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                                  isChildActive
                                    ? "bg-primary/10 text-primary border border-primary/15 font-bold"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <ChildIcon className={`h-4 w-4 transition-colors ${isChildActive ? "text-primary" : "text-muted-foreground/80 group-hover:text-foreground"}`} />
                                  <span>{child.title}</span>
                                </div>
                                {isChildActive && <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 animate-pulse" />}
                              </Link>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              const isActive = isItemActive(item.href || "");
              return (
                <Link
                  key={item.href}
                  href={item.href || "#"}
                  prefetch={true}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/15 font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 transition-colors ${isActive ? "text-primary" : "text-muted-foreground/80 group-hover:text-foreground"}`} />
                    <span>{item.title}</span>
                  </div>
                  {isActive && <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 animate-pulse" />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-4 border-t border-border/60 pt-4 shrink-0 mt-auto">
          {/* Global Search Button */}
          <Button
            variant="outline"
            onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
            className="w-full justify-between items-center gap-2 border-border/80 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40 text-xs font-semibold py-2 px-3 rounded-xl mb-2 flex cursor-pointer transition-all duration-150 h-9"
          >
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5" />
              <span>Cari Halaman...</span>
            </div>
            <kbd className="pointer-events-none inline-flex h-4.5 select-none items-center gap-0.5 rounded border bg-card px-1.5 font-mono text-[8px] font-medium opacity-100">
              Ctrl+K
            </kbd>
          </Button>

          {/* Theme switcher */}
          {mounted && (
            <div className="flex items-center justify-between gap-1 p-1 rounded-xl bg-muted/20 border border-border/60 mb-2">
              <button
                onClick={() => setTheme("light")}
                className={`grow flex justify-center items-center py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${theme === "light" ? "bg-card shadow-xs text-primary font-bold border border-border/40" : "text-muted-foreground hover:text-foreground"}`}
                title="Mode Terang"
              >
                <Sun className="h-3.5 w-3.5 mr-1" />
                <span className="text-[10px]">Terang</span>
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`grow flex justify-center items-center py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${theme === "dark" ? "bg-card shadow-xs text-primary font-bold border border-border/40" : "text-muted-foreground hover:text-foreground"}`}
                title="Mode Gelap"
              >
                <Moon className="h-3.5 w-3.5 mr-1" />
                <span className="text-[10px]">Gelap</span>
              </button>
              <button
                onClick={() => setTheme("system")}
                className={`grow flex justify-center items-center py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${theme === "system" ? "bg-card shadow-xs text-primary font-bold border border-border/40" : "text-muted-foreground hover:text-foreground"}`}
                title="Ikut Sistem"
              >
                <Laptop className="h-3.5 w-3.5 mr-1" />
                <span className="text-[10px]">Sistem</span>
              </button>
            </div>
          )}

          <div className="flex items-center gap-3 px-2">
            <Avatar className="h-10 w-10 border border-border/60 shadow-xs">
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {user.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate leading-tight text-foreground/90">{user.name}</p>
              <p className="text-[10px] text-muted-foreground truncate font-semibold uppercase tracking-wider mt-0.5">{user.role.replace("_", " ")}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-500/10 hover:shadow-xs rounded-xl font-bold py-2.5 cursor-pointer h-9"
          >
            <LogOut className="h-4 w-4" />
            <span>Keluar</span>
          </Button>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* MOBILE BOTTOM GRID NAV (Mustahiq, Munawib, Bendahara, Wali) */}
      {/* ============================================================ */}
      {useBottomNav && (
        <nav className="print:hidden md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border/80 shadow-md">
          {/* Safe area padding for iOS */}
          <div className="flex flex-row items-center justify-start min-[400px]:justify-around overflow-x-auto no-scrollbar gap-1 px-2 pt-1 pb-safe"
            style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
          >
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item.href || "");
              const label = item.mobileLabel || item.title;
              return (
                <Link
                  key={item.href}
                  href={item.href || "#"}
                  prefetch={true}
                  className={`flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl transition-all duration-200 min-h-[52px] min-w-[68px] shrink-0 relative cursor-pointer ${
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className={`flex items-center justify-center h-8 w-11 rounded-xl transition-all duration-200 ${
                    isActive ? "bg-primary/10" : "active:bg-muted/30"
                  }`}>
                    <Icon className={`h-4.5 w-4.5 transition-all duration-200 ${isActive ? "text-primary scale-105" : "text-muted-foreground/80"}`} />
                  </div>
                  <span className={`text-[9px] font-bold leading-none text-center max-w-full truncate ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* ============================================================ */}
      {/* MOBILE DRAWER (Operator, Pengasuh, Super Admin)             */}
      {/* ============================================================ */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black z-40 md:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", bounce: 0.05, duration: 0.35 }}
              className="fixed right-0 top-0 bottom-0 w-72 bg-card/95 backdrop-blur-lg z-50 p-4 flex flex-col md:hidden border-l border-border shadow-2xl overflow-hidden"
            >
              <div className="flex flex-col flex-1 overflow-hidden space-y-6">
                <div className="flex items-center justify-between border-b border-border/80 pb-3 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                      <GraduationCap className="h-4.5 w-4.5" />
                    </div>
                    <span className="font-bold text-sm tracking-tight text-foreground">e-AnwarulHidayah</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="cursor-pointer">
                    <X className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </div>

                {!useBottomNav && (
                  <nav className="space-y-1.5 flex-1 overflow-y-auto overscroll-contain pr-1 pb-4">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      if (item.children) {
                        const hasActiveChild = item.children.some((child) => isItemActive(child.href));
                        const isGroupOpen = !!openGroups[item.title];
                        return (
                          <div key={item.title} className="space-y-1">
                            <button
                              onClick={() => toggleGroup(item.title)}
                              className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer group ${
                                hasActiveChild
                                  ? "bg-primary/10 text-primary border border-primary/15"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Icon className={`h-4 w-4 transition-colors ${hasActiveChild ? "text-primary" : "text-muted-foreground/80 group-hover:text-foreground"}`} />
                                <span>{item.title}</span>
                              </div>
                              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isGroupOpen ? "rotate-180" : ""} ${hasActiveChild ? "text-primary" : "text-muted-foreground"}`} />
                            </button>
                            <AnimatePresence initial={false}>
                              {isGroupOpen && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2, ease: "easeInOut" }}
                                  className="overflow-hidden pl-4 space-y-1"
                                >
                                  {item.children.map((child) => {
                                    const isChildActive = isItemActive(child.href);
                                    const ChildIcon = child.icon;
                                    return (
                                      <Link
                                        key={child.href}
                                        href={child.href}
                                        prefetch={true}
                                        onClick={() => setIsOpen(false)}
                                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                                          isChildActive
                                            ? "bg-primary/10 text-primary border border-primary/15 font-bold"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                                        }`}
                                      >
                                        <div className="flex items-center gap-3">
                                          <ChildIcon className={`h-4 w-4 transition-colors ${isChildActive ? "text-primary" : "text-muted-foreground/80 group-hover:text-foreground"}`} />
                                          <span>{child.title}</span>
                                        </div>
                                        {isChildActive && <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 animate-pulse" />}
                                      </Link>
                                    );
                                  })}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      }

                      const isActive = isItemActive(item.href || "");
                      return (
                        <Link
                          key={item.href}
                          href={item.href || "#"}
                          prefetch={true}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                            isActive
                              ? "bg-primary/10 text-primary border border-primary/15 font-bold"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`h-4 w-4 transition-colors ${isActive ? "text-primary" : "text-muted-foreground/80 group-hover:text-foreground"}`} />
                            <span>{item.title}</span>
                          </div>
                          {isActive && <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 animate-pulse" />}
                        </Link>
                      );
                    })}
                  </nav>
                )}
              </div>

              <div className="space-y-4 border-t border-border/80 pt-4 shrink-0 mt-auto">
                <div className="flex items-center gap-3 px-2">
                  <Avatar className="h-10 w-10 border border-border/60 shadow-xs">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {user.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-bold truncate leading-tight text-foreground/90">{user.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate font-semibold uppercase tracking-wider mt-0.5">{user.role.replace("_", " ")}</p>
                  </div>
                </div>

                {/* Inline Notification Center for Mobile Viewports */}
                <div className="px-2">
                  <NotificationPopover userId={user.id} role={user.role} inline />
                </div>

                {/* Theme switcher inside mobile drawer */}
                {mounted && (
                  <div className="flex items-center justify-between gap-1 p-1 rounded-xl bg-muted/20 border border-border/60 mb-2">
                    <button
                      onClick={() => setTheme("light")}
                      className={`grow flex justify-center items-center py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${theme === "light" ? "bg-card shadow-xs text-primary font-bold border border-border/40" : "text-muted-foreground hover:text-foreground"}`}
                      title="Mode Terang"
                    >
                      <Sun className="h-3.5 w-3.5 mr-1" />
                      <span className="text-[10px]">Terang</span>
                    </button>
                    <button
                      onClick={() => setTheme("dark")}
                      className={`grow flex justify-center items-center py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${theme === "dark" ? "bg-card shadow-xs text-primary font-bold border border-border/40" : "text-muted-foreground hover:text-foreground"}`}
                      title="Mode Gelap"
                    >
                      <Moon className="h-3.5 w-3.5 mr-1" />
                      <span className="text-[10px]">Gelap</span>
                    </button>
                    <button
                      onClick={() => setTheme("system")}
                      className={`grow flex justify-center items-center py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${theme === "system" ? "bg-card shadow-xs text-primary font-bold border border-border/40" : "text-muted-foreground hover:text-foreground"}`}
                      title="Ikut Sistem"
                    >
                      <Laptop className="h-3.5 w-3.5 mr-1" />
                      <span className="text-[10px]">Sistem</span>
                    </button>
                  </div>
                )}

                <Button
                  variant="ghost"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-500/10 hover:shadow-xs rounded-xl font-bold py-2.5 cursor-pointer h-9"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Keluar</span>
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
