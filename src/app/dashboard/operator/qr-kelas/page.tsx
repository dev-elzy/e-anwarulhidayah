"use client";

import React, { useEffect, useRef, useState } from "react";
import { apiGet } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import QRCode from "qrcode";
import { QrCode, Printer, Download, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { getSystemSettings } from "@/actions/additional";

interface QRCardProps {
  kelas: {
    id: string;
    namaKelas: string;
    tingkatan: string;
  };
  namaPondok: string;
}

function QRCard({ kelas, namaPondok }: QRCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    if (!canvasRef.current) return;
    
    // The decoded scan string is exactly the kelas.id (e.g., 'QR-IDA-A')
    QRCode.toCanvas(canvasRef.current, kelas.id, {
      width: 250,
      margin: 2,
      color: {
        dark: "#2196F3", // Primary Theme color
        light: "#FFFFFF"
      }
    }, (error) => {
      if (error) {
        console.error("QR Code generation error:", error);
      } else {
        // Also save as image data for download
        QRCode.toDataURL(kelas.id, { width: 500, margin: 2 }, (err, url) => {
          if (!err && url) setDataUrl(url);
        });
      }
    });
  }, [kelas]);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak QR - ${kelas.namaKelas}</title>
          <style>
            body {
              font-family: sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 90vh;
              text-align: center;
            }
            .border-box {
              border: 4px solid #2196F3;
              padding: 40px;
              border-radius: 24px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            h1 { color: #2196F3; margin-bottom: 5px; }
            h2 { color: #D4AF37; margin-top: 5px; margin-bottom: 20px; font-weight: normal; }
            img { width: 300px; height: 300px; }
            p { font-size: 14px; color: #666; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="border-box">
            <h1>${namaPondok.toUpperCase()}</h1>
            <h2>QR PRESENSI: ${kelas.namaKelas.toUpperCase()}</h2>
            <img src="${dataUrl}" />
            <p>Tingkatan: ${kelas.tingkatan} | Kode: ${kelas.id}</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Card className="glass-panel border-white/20 relative overflow-hidden flex flex-col justify-between items-center text-center">
      <div className="absolute top-0 left-0 right-0 h-1 bg-blue-gradient" />
      
      <CardHeader className="w-full pb-2">
        <Badge variant="outline" className="mx-auto w-fit bg-primary/10 border-primary/20 text-primary text-[10px] uppercase font-bold">
          {kelas.tingkatan}
        </Badge>
        <CardTitle className="text-base font-bold mt-2 truncate">{kelas.namaKelas}</CardTitle>
        <CardDescription className="text-xs">Kode QR Permanen Kelas</CardDescription>
      </CardHeader>

      <CardContent className="flex justify-center p-4 bg-white/40 border border-white/30 rounded-2xl my-2">
        <canvas ref={canvasRef} className="h-44 w-44 object-contain shadow-sm rounded-xl" />
      </CardContent>

      <CardFooter className="w-full grid grid-cols-2 gap-2 pt-2 pb-4">
        <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-xl font-bold flex items-center justify-center gap-1.5 border-white/40 bg-white/30 backdrop-blur-sm">
          <Printer className="h-4 w-4" /> Cetak
        </Button>
        
        {dataUrl && (
          <a href={dataUrl} download={`QR-${kelas.namaKelas}.png`} className="block">
            <Button size="sm" className="w-full bg-blue-gradient text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md">
              <Download className="h-4 w-4" /> Unduh
            </Button>
          </a>
        )}
      </CardFooter>
    </Card>
  );
}

export default function QRKelasPage() {
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [namaPondok, setNamaPondok] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKelas = async () => {
      setLoading(true);
      const k = await apiGet("kelas");
      setKelasList(k);
      
      const settings = await getSystemSettings();
      if (settings && settings.namaPondok) {
        setNamaPondok(settings.namaPondok);
      }
      
      setLoading(false);
    };
    fetchKelas();
  }, []);

  const handlePrintAll = async () => {
    try {
      toast.loading("Menyiapkan dokumen cetak...", { id: "print-all" });
      
      const listWithQrs = await Promise.all(
        kelasList.map(async (k) => {
          try {
            const dataUrl = await QRCode.toDataURL(k.id, {
              width: 500,
              margin: 2,
              color: {
                dark: "#2196F3",
                light: "#FFFFFF"
              }
            });
            return { ...k, dataUrl };
          } catch (e) {
            console.error("Gagal men-generate QR Code untuk kelas:", k.namaKelas, e);
            return { ...k, dataUrl: "" };
          }
        })
      );

      toast.success("Dokumen siap, membuka dialog cetak...", { id: "print-all" });

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Gagal membuka jendela cetak. Pastikan pop-up tidak diblokir browser.", { id: "print-all" });
        return;
      }

      const itemsHtml = listWithQrs
        .map((k) => `
          <div class="print-page print-card">
            <div class="border-box">
              <h1>${namaPondok.toUpperCase()}</h1>
              <h2>QR PRESENSI: ${k.namaKelas.toUpperCase()}</h2>
              <img src="${k.dataUrl}" />
              <p>Tingkatan: ${k.tingkatan} | Kode: ${k.id}</p>
            </div>
          </div>
        `)
        .join("");

      printWindow.document.write(`
        <html>
          <head>
            <title>Cetak Semua QR Kelas - ${namaPondok}</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                font-family: sans-serif;
                background-color: #FFFFFF;
                color: #000000;
              }
              .print-page {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                box-sizing: border-box;
                page-break-after: always;
                text-align: center;
              }
              .print-page:last-child {
                page-break-after: avoid;
              }
              .border-box {
                border: 4px solid #2196F3;
                padding: 40px;
                border-radius: 24px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                background-color: #FFFFFF;
                width: 80%;
                max-width: 500px;
                margin: auto;
              }
              h1 { font-size: 20px; color: #2196F3; margin-top: 0; margin-bottom: 5px; }
              h2 { font-size: 18px; color: #D4AF37; margin-top: 5px; margin-bottom: 20px; font-weight: normal; }
              img { width: 300px; height: 300px; }
              p { font-size: 14px; color: #666; margin-top: 20px; margin-bottom: 0; }
              
              @media print {
                body {
                  background-color: #FFFFFF;
                }
                .print-page {
                  height: 100vh;
                  page-break-after: always;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                .print-page:last-child {
                  page-break-after: avoid;
                }
                .border-box {
                  border: 4px solid #2196F3 !important;
                  box-shadow: none !important;
                  background-color: #FFFFFF !important;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
              }
            </style>
          </head>
          <body>
            ${itemsHtml}
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.close();
                }, 500);
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan saat menyiapkan cetakan.", { id: "print-all" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-glow-gold flex items-center gap-2">
            <QrCode className="h-7 w-7 text-primary" /> QR Code Kelas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Unduh atau cetak kode QR kelas permanen untuk presensi kehadiran ustadz.
          </p>
        </div>
        {kelasList.length > 0 && (
          <Button
            onClick={handlePrintAll}
            className="w-full md:w-auto bg-blue-gradient text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md hover-lift transition-saas h-11 px-5 cursor-pointer shrink-0"
          >
            <Printer className="h-5 w-5" /> Cetak Semua QR (PDF)
          </Button>
        )}
      </div>

      {/* Info Warning */}
      <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 p-4 rounded-2xl flex gap-3 text-blue-900 dark:text-blue-200">
        <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-sm text-blue-900 dark:text-blue-200 font-sans">Informasi Penggunaan</h4>
          <p className="text-xs text-blue-800/80 dark:text-blue-300/80 mt-1 leading-relaxed font-sans">
            Kode QR di bawah ini bersifat <strong className="font-semibold text-blue-900 dark:text-blue-100">permanen per kelas</strong>. Cetak kode QR ini dan tempelkan di meja ustadz atau pintu masuk kelas masing-masing. Ustadz yang bertugas mengampu jam pelajaran tinggal memindai kode ini dari ponsel mereka untuk membuka daftar absensi santri.
          </p>
        </div>
      </div>

      {/* QR Code Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-sm font-semibold">Memuat daftar kelas...</span>
        </div>
      ) : kelasList.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {kelasList.map((k) => (
            <QRCard key={k.id} kelas={k} namaPondok={namaPondok} />
          ))}
        </div>
      ) : (
        <Card className="glass-panel border-white/20 p-8 text-center">
          <p className="text-sm text-muted-foreground">Belum ada data kelas yang terdaftar.</p>
        </Card>
      )}
    </div>
  );
}
