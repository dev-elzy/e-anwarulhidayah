"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Html5Qrcode } from "html5-qrcode";
import { apiPost } from "@/lib/api-client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, QrCode, Camera } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { isNativePlatform, vibrate } from "@/utils/native-bridge";

export default function MunawibScanPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrRegionId = "qr-reader-target";

  useEffect(() => {
    setIsNative(isNativePlatform());
  }, []);

  const playBeep = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = 1000;
      gainNode.gain.setValueAtTime(1, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.15);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.start();
      oscillator.stop(context.currentTime + 0.15);
    } catch (e) {
      console.warn("Audio Context error:", e);
    }
  };

  const handleScanResult = React.useCallback(async (decodedText: string) => {
    playBeep();
    vibrate(200);

    setLoading(true);
    toast.loading("Memproses presensi & membuka sesi...", { id: "scan-loading" });

    const result = await apiPost("processClassScan", {
      params: {
        kelasId: decodedText,
        ustadzId: session?.user?.ustadzId as string,
      }
    });

    toast.dismiss("scan-loading");

    if (result.error) {
      toast.error("Gagal", { description: result.error });
      
      // If web scanner, re-trigger scanning after a short delay
      if (!isNative && scannerRef.current && !scannerActive) {
        try {
          await scannerRef.current.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: 250 },
            () => {},
            () => {}
          );
          setScannerActive(true);
        } catch (e) {
          console.error("Failed to restart scanner:", e);
        }
      }
    } else {
      toast.success("Berhasil", { description: result.message });
      router.push(
        `/dashboard/munawib/absensi?kelasId=${result.kelasId}&scheduleId=${result.scheduleId}&sessionId=${result.sessionId}`
      );
    }
    setLoading(false);
  }, [session, isNative, scannerActive, router]);

  // Google MLKit Native QR Scan Action
  const handleNativeScan = async () => {
    try {
      const { BarcodeScanner, BarcodeFormat } = await import("@capacitor-mlkit/barcode-scanning");
      
      // Request Camera permissions first
      const status = await BarcodeScanner.requestPermissions();
      if (status.camera !== "granted") {
        toast.error("Akses Kamera Ditolak", { description: "Kamera diperlukan untuk membaca QR Code." });
        return;
      }

      // Open Native Google Code Scanner Overlay
      const { barcodes } = await BarcodeScanner.scan({
        formats: [BarcodeFormat.QrCode]
      });

      if (barcodes.length > 0 && barcodes[0].rawValue) {
        handleScanResult(barcodes[0].rawValue);
      }
    } catch (err: any) {
      console.error("Native scanner failed:", err);
      toast.error("Gagal menjalankan Scanner Native", { description: err.message });
    }
  };

  // Web fallback camera loader
  useEffect(() => {
    if (!session?.user?.ustadzId || isNative) return;

    const html5Qrcode = new Html5Qrcode(qrRegionId);
    scannerRef.current = html5Qrcode;
    setScannerActive(true);

    html5Qrcode
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (width, height) => {
            const size = Math.min(width, height) * 0.7;
            return { width: size, height: size };
          },
        },
        async (decodedText) => {
          try {
            await html5Qrcode.stop();
            setScannerActive(false);
          } catch (e) {
            console.error("Stop scanner error:", e);
          }
          handleScanResult(decodedText);
        },
        () => {}
      )
      .catch((err) => {
        console.error("Camera access error:", err);
        setErrorMsg("Gagal mengakses kamera belakang. Pastikan izin kamera telah diberikan.");
        setScannerActive(false);
      });

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current
          .stop()
          .catch((err) => console.error("Scanner cleanup error:", err));
      }
    };
  }, [session, isNative, handleScanResult]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-md flex items-center justify-between mb-4">
        <Link href={session?.user?.role === "MUSTAHIQ" ? "/dashboard/mustahiq" : "/dashboard/munawib"}>
          <Button variant="ghost" className="rounded-xl flex items-center gap-2 font-semibold min-h-[44px]">
            <ArrowLeft className="h-4.5 w-4.5" /> Kembali
          </Button>
        </Link>
        <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
          <QrCode className="h-4 w-4 text-primary" /> Scanner Kelas
        </span>
      </div>

      <Card className="glass-panel border-white/20 shadow-2xl w-full max-w-md overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-gradient" />
        
        <div className="p-6 text-center">
          <h2 className="text-lg font-bold text-glow-gold">Buka Sesi Mengajar</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Posisikan kamera ke arah QR Code permanen kelas untuk mencatat kehadiran Anda dan membuka sesi pelajaran.
          </p>
        </div>

        {isNative ? (
          // Premium Native scanner UI
          <div className="p-8 flex flex-col items-center justify-center gap-6 min-h-[250px] bg-black/40 border-y border-white/5">
            <div className="relative h-28 w-28 rounded-3xl bg-blue-gradient/10 border-2 border-primary/30 flex items-center justify-center shadow-inner">
              <QrCode className="h-16 w-16 text-primary drop-shadow-[0_0_15px_#2196f3]" />
              <div className="absolute inset-0 border border-primary/20 rounded-3xl animate-ping scale-75 opacity-20" />
            </div>

            <Button 
              onClick={handleNativeScan} 
              disabled={loading}
              className="w-full bg-blue-gradient text-white hover:opacity-95 shadow-md py-6 rounded-2xl font-bold flex items-center justify-center gap-3 text-base"
            >
              <Camera className="h-5 w-5" /> 
              {loading ? "Mengecek Hasil..." : "Mulai Scan QR Kelas"}
            </Button>
          </div>
        ) : (
          // Web scanner region (fallback)
          <div className="relative bg-black aspect-square w-full flex items-center justify-center overflow-hidden">
            <div id={qrRegionId} className="w-full h-full object-cover" />
            
            {scannerActive && !loading && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-2/3 h-2/3 max-w-[250px] max-h-[250px] border border-white/10 rounded-2xl flex items-center justify-center shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                  <div className="absolute top-[-2px] left-[-2px] w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <div className="absolute top-[-2px] right-[-2px] w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-[-2px] left-[-2px] w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-[-2px] right-[-2px] w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
                  
                  {/* Smooth, premium laser scanning line */}
                  <motion.div 
                    className="absolute left-2 right-2 h-0.5 bg-primary/80 shadow-[0_0_10px_2px_#2196f3]"
                    initial={{ top: "10%" }}
                    animate={{ top: "90%" }}
                    transition={{
                      repeat: Infinity,
                      repeatType: "reverse",
                      duration: 2.5,
                      ease: "easeInOut"
                    }}
                  />
                </div>
              </div>
            )}

            {loading && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
                <span className="text-sm font-semibold">Mengecek Jadwal & Membuka Sesi...</span>
              </div>
            )}

            {errorMsg && (
              <div className="absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center text-white p-6 text-center gap-4">
                <span className="text-sm font-bold text-red-200">{errorMsg}</span>
                <Button onClick={() => window.location.reload()} size="sm" className="bg-white text-red-900 font-bold hover:bg-white/90 rounded-xl min-h-[44px]">
                  Coba Lagi
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="p-6 text-center bg-white/20 border-t border-white/10">
          <span className="text-xs text-muted-foreground font-semibold flex items-center justify-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-accent animate-pulse" />
            {isNative ? "Kamera Native (Google MLKit)" : "facingMode: environment (Kamera Belakang)"}
          </span>
        </div>
      </Card>
    </div>
  );
}
