"use client";

import React, { useEffect, useState, useTransition, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { apiGet, apiPost } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, UserCheck, CheckCircle, ShieldAlert, AlertTriangle, Clock } from "lucide-react";
import Link from "next/link";

interface StudentRecord {
  student: {
    id: string;
    nis: string;
    namaLengkap: string;
  };
  status: string; // 'Masuk' | 'Terlambat' | 'Izin' | 'Alpha'
}

function AbsensiSantriForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kelasId = searchParams.get("kelasId");
  const sessionId = searchParams.get("sessionId");
  const { data: session } = useSession();

  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [materi, setMateri] = useState("");
  const [catatan, setCatatan] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!kelasId || !sessionId) return;

    const loadRecords = async () => {
      setLoading(true);
      try {
        const data = await apiGet("students-attendance", { kelasId, sessionId });
        setRecords(data);
      } catch (err: any) {
        console.error(err);
      }
      setLoading(false);
    };

    loadRecords();
  }, [kelasId, sessionId]);

  const handleStatusChange = (studentId: string, newStatus: string) => {
    setRecords((prev) =>
      prev.map((rec) =>
        rec.student.id === studentId ? { ...rec, status: newStatus } : rec
      )
    );
  };

  const handleSave = () => {
    if (!sessionId || !session?.user?.ustadzId) return;

    startTransition(async () => {
      const formattedRecords = records.map((rec) => ({
        studentId: rec.student.id,
        status: rec.status,
      }));

      const res = await apiPost("saveStudentsAttendance", {
        params: {
          sessionId,
          records: formattedRecords,
          ustadzId: session.user.ustadzId as string,
          materi,
          catatan,
        }
      });

      if (res.error) {
        toast.error("Gagal", { description: res.error });
      } else {
        toast.success("Berhasil", { description: res.message });
        router.push(session?.user?.role === "MUSTAHIQ" ? "/dashboard/mustahiq" : "/dashboard/munawib");
      }
    });
  };

  if (!kelasId || !sessionId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
        <h3 className="font-bold text-lg text-red-500">Akses Ditolak</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Halaman absensi santri hanya dapat dibuka setelah Anda membuka sesi pelajaran kelas.
        </p>
        <Link href={session?.user?.role === "MUSTAHIQ" ? "/dashboard/mustahiq" : "/dashboard/munawib"} className="mt-4">
          <Button className="rounded-xl font-bold bg-blue-gradient text-white min-h-[44px]">Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto px-2">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link href={session?.user?.role === "MUSTAHIQ" ? "/dashboard/mustahiq" : "/dashboard/munawib"}>
          <Button variant="ghost" className="rounded-xl flex items-center gap-2 font-semibold min-h-[44px]">
            <ArrowLeft className="h-4.5 w-4.5" /> Batal
          </Button>
        </Link>
        <span className="text-xs font-bold text-muted-foreground uppercase">Marking Absensi Santri</span>
      </div>

      <Card className="glass-panel border-white/20 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-gradient" />
        
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-bold text-glow-gold">Sesi Kelas: {kelasId}</CardTitle>
              <CardDescription>Catat kehadiran santri dan materi pembelajaran sesi hari ini</CardDescription>
            </div>
            <Badge className="bg-green-500 text-white font-bold px-3 py-1 rounded-full text-xs animate-pulse">
              Sesi Terbuka (Open)
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 px-4 md:px-6">
          {/* Lesson Notes */}
          <div className="bg-white/40 p-4 rounded-2xl border border-white/30 space-y-4">
            <h3 className="font-bold text-sm text-primary flex items-center gap-1.5">Jurnal Pembelajaran Sesi</h3>
            <div className="space-y-1.5">
              <Label htmlFor="materi" className="text-xs font-bold">Materi Bahasan</Label>
              <Input
                id="materi"
                value={materi}
                onChange={(e) => setMateri(e.target.value)}
                placeholder="Contoh: Bab Isim Fa'il s.d Isim Maf'ul"
                className="bg-white/60 min-h-[44px] rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="catatan" className="text-xs font-bold">Catatan Kelas / Hambatan</Label>
              <Input
                id="catatan"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: 15 santri paham, 2 santri butuh pengulangan"
                className="bg-white/60 min-h-[44px] rounded-xl text-sm"
              />
            </div>
          </div>

          {/* Roster list */}
          <div>
            <h3 className="font-bold text-sm text-primary mb-3">Kehadiran Santri</h3>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <span className="text-sm font-semibold">Memuat daftar santri...</span>
              </div>
            ) : records.length > 0 ? (
              <div className="space-y-4">
                {records.map((rec) => (
                  <div 
                    key={rec.student.id} 
                    className="bg-white/50 border border-white/20 p-4 rounded-2xl flex flex-col gap-3 md:flex-row md:items-center md:justify-between hover:shadow-sm transition-all"
                  >
                    <div>
                      <h4 className="font-bold text-sm leading-snug">{rec.student.namaLengkap}</h4>
                      <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">NIS: {rec.student.nis}</p>
                    </div>
                    
                    {/* Buttons set at 44px Touch Targets, Card layout on mobile */}
                    <div className="flex flex-wrap gap-1.5 p-1 bg-white/70 border border-muted/15 rounded-xl w-full md:w-auto justify-between md:justify-start">
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(rec.student.id, "Masuk")}
                        className={`flex-1 md:flex-initial min-h-[44px] font-bold rounded-lg px-4 transition-all ${
                          rec.status === "Masuk"
                            ? "bg-green-500 hover:bg-green-600 text-white shadow-md shadow-green-500/10"
                            : "bg-transparent text-muted-foreground hover:text-green-600 hover:bg-green-50/50"
                        }`}
                      >
                        <CheckCircle className="h-4 w-4 mr-1.5" /> Masuk
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(rec.student.id, "Terlambat")}
                        className={`flex-1 md:flex-initial min-h-[44px] font-bold rounded-lg px-4 transition-all ${
                          rec.status === "Terlambat"
                            ? "bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/10"
                            : "bg-transparent text-muted-foreground hover:text-amber-600 hover:bg-amber-50/50"
                        }`}
                      >
                        <Clock className="h-4 w-4 mr-1.5" /> Terlambat
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(rec.student.id, "Izin")}
                        className={`flex-1 md:flex-initial min-h-[44px] font-bold rounded-lg px-4 transition-all ${
                          rec.status === "Izin"
                            ? "bg-blue-500 hover:bg-blue-600 text-white shadow-md shadow-blue-500/10"
                            : "bg-transparent text-muted-foreground hover:text-blue-600 hover:bg-blue-50/50"
                        }`}
                      >
                        <ShieldAlert className="h-4 w-4 mr-1.5" /> Izin
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(rec.student.id, "Alpha")}
                        className={`flex-1 md:flex-initial min-h-[44px] font-bold rounded-lg px-4 transition-all ${
                          rec.status === "Alpha"
                            ? "bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/10"
                            : "bg-transparent text-muted-foreground hover:text-red-600 hover:bg-red-50/50"
                        }`}
                      >
                        <AlertTriangle className="h-4 w-4 mr-1.5" /> Alpha
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm py-12 text-muted-foreground">
                Tidak ada santri yang terdaftar di kelas ini.
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="bg-white/20 border-t border-white/10 px-6 py-4 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isPending || records.length === 0}
            className="bg-blue-gradient text-white hover:opacity-95 font-bold px-6 py-6 rounded-xl shadow-md flex items-center gap-2 min-h-[44px] w-full md:w-auto justify-center"
          >
            {isPending ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <UserCheck className="h-4.5 w-4.5" /> Simpan & Tutup Sesi Kelas
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function MunawibAbsensiPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    }>
      <AbsensiSantriForm />
    </Suspense>
  );
}
