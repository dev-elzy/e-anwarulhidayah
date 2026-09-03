"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";

import type { RaportData } from "@/lib/pdf-generator";

export function PrintButton({ autoPrint, hideButton }: { autoPrint?: boolean, hideButton?: boolean }) {
  React.useEffect(() => {
    if (autoPrint) {
      // Tunggu sebentar agar render selesai sebelum dialog print muncul
      const timer = setTimeout(() => {
        window.onafterprint = () => {
          setTimeout(() => {
            window.close();
          }, 300);
        };
        window.print();
      }, 500);
      return () => {
        clearTimeout(timer);
        window.onafterprint = null;
      };
    }
  }, [autoPrint]);

  if (hideButton) return null;

  return (
    <Button 
      onClick={() => window.print()}
      className="bg-linear-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center gap-2 font-bold rounded-xl shadow-lg shadow-blue-500/30 cursor-pointer hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all w-full sm:w-auto"
    >
      <Printer className="h-4 w-4" /> Cetak / Preview
    </Button>
  );
}

export function DownloadPdfButton({ autoDownload, data, hideButton }: { filename?: string; autoDownload?: boolean; data?: RaportData; hideButton?: boolean }) {
  const [downloadState, setDownloadState] = React.useState<"idle" | "loading" | "success" | "error">("idle");

  const handleDownload = React.useCallback(async () => {
    if (!data) return;
    setDownloadState("loading");
    try {
      // Tunggu sebentar agar UI update status loading
      await new Promise(r => setTimeout(r, 100));
      const { generateRaportPdf } = await import("@/lib/pdf-generator");
      generateRaportPdf(data);
      setDownloadState("success");
      
      // Auto close the tab if auto downloaded
      if (autoDownload) {
        setTimeout(() => {
          window.close();
        }, 1500);
      }
    } catch (error) {
      console.error("Gagal mengunduh PDF:", error);
      setDownloadState("error");
    }
  }, [data, autoDownload]);

  React.useEffect(() => {
    if (autoDownload && data) {
      const timer = setTimeout(() => {
        handleDownload();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoDownload, data, handleDownload]);

  return (
    <>
      {!hideButton && (
        <Button
          onClick={handleDownload}
          disabled={downloadState === "loading" || !data}
          className="bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white flex items-center justify-center gap-2 font-bold rounded-xl shadow-lg shadow-emerald-500/30 cursor-pointer w-full sm:w-auto min-h-[40px] px-4 hover:-translate-y-0.5 transition-all"
        >
          <Download className="h-4 w-4" /> {downloadState === "loading" ? "Memproses..." : "Download PDF"}
        </Button>
      )}

      {/* Glassmorphic Loading & Success Overlay */}
      {downloadState !== "idle" && (
        <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md text-white p-6 text-center animate-in fade-in duration-200 print:hidden">
          <div className="bg-white/10 dark:bg-black/45 border border-white/20 p-8 rounded-2xl max-w-sm w-full shadow-2xl flex flex-col items-center gap-5">
            {downloadState === "loading" && (
              <>
                <div className="h-12 w-12 rounded-full border-4 border-t-green-500 border-r-transparent border-b-green-500 border-l-transparent animate-spin" />
                <div>
                  <h3 className="text-lg font-bold text-green-400">Menyiapkan File PDF</h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    Sedang mengubah dokumen menjadi PDF asli. Mohon tunggu sejenak, proses ini memakan waktu hingga 30 detik...
                  </p>
                </div>
                <Button 
                  onClick={() => setDownloadState("idle")} 
                  variant="outline"
                  className="mt-2 w-full bg-transparent hover:bg-white/10 text-white border-white/20"
                >
                  Batal / Tutup Paksa
                </Button>
              </>
            )}

            {downloadState === "success" && (
              <>
                <div className="h-12 w-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xl font-bold border border-green-500/30">
                  ✓
                </div>
                <div>
                  <h3 className="text-lg font-bold text-green-400">Unduhan Selesai</h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    Dokumen PDF berhasil diunduh ke perangkat Anda.
                  </p>
                </div>
                <Button 
                  onClick={() => {
                    setDownloadState("idle");
                    if (autoDownload) window.close();
                  }} 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md cursor-pointer min-h-[40px]"
                >
                  Tutup Notifikasi
                </Button>
              </>
            )}

            {downloadState === "error" && (
              <>
                <div className="h-12 w-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-xl font-bold border border-red-500/30">
                  ✕
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-400">Proses Gagal / Timeout</h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    Terjadi kesalahan saat membuat file PDF. Silakan coba lagi atau gunakan tombol Cetak / Preview.
                  </p>
                </div>
                <Button 
                  onClick={() => setDownloadState("idle")} 
                  className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold rounded-xl shadow-md cursor-pointer min-h-[40px]"
                >
                  Tutup
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

