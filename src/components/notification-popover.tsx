"use client";

import React, { useState, useEffect } from "react";
import { Bell, BellOff, X, Check, Clock, AlertCircle, Sparkles, Megaphone, Info } from "lucide-react";
import { getNotificationsList, markNotificationAsRead } from "@/actions/additional";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface NotificationPopoverProps {
  userId: string;
  role: string;
  inline?: boolean;
}

export function NotificationPopover({ userId, role, inline }: NotificationPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permission, setPermission] = useState<string>("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const res = await Notification.requestPermission();
      setPermission(res);
      if (res === "granted") {
        toast.success("Notifikasi Aktif", { description: "Anda akan menerima notifikasi sistem untuk aktivitas pondok." });
      } else if (res === "denied") {
        toast.error("Notifikasi Diblokir", { description: "Izinkan notifikasi di pengaturan browser Anda." });
      }
    }
  };

  useEffect(() => {
    if (!userId || !role) return;
    
    let seenIds = new Set<string>();
    let isFirstRun = true;
 
    const fetchNotifs = async () => {
      const data = await getNotificationsList(userId, role);
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.isRead).length);

      // Trigger native notification if there are new unread notifications
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        if (!isFirstRun) {
          const newUnreads = data.filter((n: any) => !n.isRead && !seenIds.has(n.id));
          newUnreads.forEach((n: any) => {
            new Notification(n.title, {
              body: n.message,
              icon: "/logo.png"
            });
          });
        }
      }

      seenIds = new Set(data.map((n: any) => n.id));
      isFirstRun = false;
    };

    fetchNotifs();
    
    // Silently request permission on mount if not determined yet
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then(res => setPermission(res));
    }
    
    // Poll every 30 seconds for live updates (clean and passive)
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [userId, role]);

  const handleMarkRead = async (id: string) => {
    const res = await markNotificationAsRead(id);
    if (res.success) {
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    for (const n of unread) {
      await markNotificationAsRead(n.id);
    }
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "GURU_ALPHA":
        return <AlertCircle className="h-4.5 w-4.5 text-red-500" />;
      case "GURU_PENGGANTI":
        return <Sparkles className="h-4.5 w-4.5 text-purple-500" />;
      case "RAPORT_TERBIT":
        return <Check className="h-4.5 w-4.5 text-green-500" />;
      case "SYAHRIAH_JATUH_TEMPO":
        return <Megaphone className="h-4.5 w-4.5 text-amber-500" />;
      case "PENGUMUMAN":
        return <Megaphone className="h-4.5 w-4.5 text-blue-500" />;
      default:
        return <Info className="h-4.5 w-4.5 text-blue-500" />;
    }
  };

  if (inline) {
    return (
      <div className="w-full relative">
        {/* Inline trigger button */}
        <Button
          onClick={() => setIsOpen(!isOpen)}
          variant="outline"
          className="w-full justify-between items-center gap-2 border-border/80 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40 text-xs font-semibold py-2 px-3 rounded-xl flex cursor-pointer transition-all duration-150 h-9"
        >
          <div className="flex items-center gap-2">
            <Bell className="h-3.5 w-3.5" />
            <span>Pusat Notifikasi</span>
          </div>
          {unreadCount > 0 ? (
            <Badge className="bg-red-500 hover:bg-red-500 text-white font-black text-[10px] px-1.5 py-0.5 rounded-full">
              {unreadCount} Baru
            </Badge>
          ) : (
            <span className="text-[10px] text-muted-foreground">0 Baru</span>
          )}
        </Button>

        {/* Collapsible card below the button */}
        {isOpen && (
          <Card className="mt-2 w-full bg-card border border-border shadow-md rounded-xl overflow-hidden animate-in slide-in-from-top-2 duration-150">
            <CardHeader className="p-3 border-b border-border flex flex-row items-center justify-between space-y-0">
              <div className="text-[10px] font-bold text-foreground">
                Daftar Notifikasi
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="icon-xs" onClick={handleMarkAllRead} title="Tandai semua dibaca" className="h-6 w-6 text-muted-foreground hover:text-primary rounded-md">
                    <Check className="h-3 w-3" />
                  </Button>
                )}
                <Button variant="ghost" size="icon-xs" onClick={() => setIsOpen(false)} className="h-6 w-6 text-muted-foreground rounded-md">
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-[200px] overflow-y-auto divide-y divide-border/60">
              {notifications.length > 0 ? (
                notifications.map((n: any) => (
                  <div
                    key={n.id}
                    onClick={() => !n.isRead && handleMarkRead(n.id)}
                    className={`p-3 flex gap-2.5 cursor-pointer hover:bg-muted/30 transition-colors ${
                      !n.isRead ? "bg-muted/15 border-l-2 border-primary" : ""
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {getNotifIcon(n.type)}
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex justify-between items-start gap-1">
                        <h4 className={`text-[10px] font-bold leading-tight ${!n.isRead ? "text-foreground font-extrabold" : "text-muted-foreground"}`}>
                          {n.title}
                        </h4>
                        <span className="text-[8px] text-muted-foreground flex items-center gap-0.5 whitespace-nowrap">
                          <Clock className="h-2 w-2" />
                          {new Date(n.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                      <p className="text-[9.5px] text-muted-foreground leading-snug">
                        {n.message}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-muted-foreground space-y-1.5">
                  <BellOff className="h-6 w-6 mx-auto opacity-30" />
                  <p className="text-[10px] font-semibold">Tidak ada notifikasi</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="hidden md:block fixed bottom-6 right-6 z-50 print:hidden">
      
      {/* Floating Bell Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full bg-blue-gradient text-white shadow-2xl flex items-center justify-center relative hover:scale-105 transition-transform duration-200 cursor-pointer"
        size="icon"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </Button>

      {/* Popover Card */}
      {isOpen && (
        <Card className="absolute bottom-16 right-0 w-[420px] max-w-[calc(100vw-2rem)] bg-popover backdrop-blur-xl border border-border shadow-2xl rounded-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                Pusat Notifikasi <Badge className="bg-primary/10 text-primary hover:bg-primary/10 font-bold">{unreadCount} Baru</Badge>
              </CardTitle>
              <CardDescription className="text-[11px] mt-0.5">Informasi & aktivitas terkini pondok</CardDescription>
            </div>
            <div className="flex items-center gap-1">
              {permission !== "granted" && (
                <Button 
                  variant="outline" 
                  size="xs" 
                  onClick={requestPermission}
                  className="text-[10px] font-bold h-7 px-2 border-amber-500/20 text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg flex items-center gap-1 mr-1"
                >
                  <Bell className="h-3 w-3 animate-bounce" /> Aktifkan Notifikasi Desktop
                </Button>
              )}
              {unreadCount > 0 && (
                <Button variant="ghost" size="icon" onClick={handleMarkAllRead} title="Tandai semua dibaca" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-lg">
                  <Check className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 text-muted-foreground rounded-lg">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 max-h-[350px] overflow-y-auto divide-y divide-border/60">
            {notifications.length > 0 ? (
              notifications.map((n: any) => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && handleMarkRead(n.id)}
                  className={`p-4 flex gap-3 cursor-pointer hover:bg-muted/10 transition-colors ${
                    !n.isRead ? "bg-muted/15 border-l-2 border-primary" : ""
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {getNotifIcon(n.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start gap-1">
                      <h4 className={`text-xs font-bold leading-none ${!n.isRead ? "text-foreground font-extrabold" : "text-muted-foreground"}`}>
                        {n.title}
                      </h4>
                      <span className="text-[9px] text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(n.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      {n.message}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground space-y-2">
                <BellOff className="h-8 w-8 mx-auto opacity-40" />
                <p className="text-xs font-semibold">Tidak ada notifikasi aktif</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
