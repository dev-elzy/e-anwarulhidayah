/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { Printer, ArrowLeft, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function toArabicDigits(num: number | string | null | undefined): string {
  if (num === null || num === undefined || num === "") return "-";
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(num).replace(/[0-9]/g, (w) => arabicDigits[+w]);
}

export interface ClassicRaportProps {
  data: {
    student: {
      namaLengkap: string;
      nis: string;
    };
    kelas: {
      namaKelas: string;
      tingkatan?: string;
    };
    bagian?: string;
    semesterName: string;
    academicYearName: string;
    hijriYear: string;
    pengasuhName: string;
    waliKelasName: string;
    namaPondok: string;
    alamatPondok: string;
    logoUrl?: string | null;
    grades: {
      no: number;
      kitabName: string;
      fanName: string;
      nilaiKhusus: number | null;
      nilaiUmum: number | null;
    }[];
    totalKhusus: number;
    totalUmum: number;
    absenIzin: number;
    absenAlpha: number;
    nilaiAkhlaqHuruf: string;
    rataRata: number;
    predikatBayan: string;
  };
  backUrl?: string;
}

export function RaportPesantrenClassic({ data, backUrl = "/dashboard/mustahiq/nilai" }: ClassicRaportProps) {
  const [useArabicNumbers, setUseArabicNumbers] = useState(true);

  const formatNumber = (num: number | string | null | undefined) => {
    if (num === null || num === undefined || num === "") return "-";
    if (useArabicNumbers) {
      return toArabicDigits(num);
    }
    return String(num);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 py-8 px-4 flex flex-col items-center">
      {/* Top Action Bar (Hidden when Printing) */}
      <div className="w-full max-w-[210mm] mb-6 flex flex-wrap items-center justify-between gap-4 no-print bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
        <Link href={backUrl}>
          <Button variant="ghost" size="sm" className="font-semibold gap-2">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUseArabicNumbers(!useArabicNumbers)}
            className="gap-2 font-medium"
          >
            <Languages className="h-4 w-4 text-blue-600" />
            {useArabicNumbers ? "Mode Angka: Arab (١ ٢ ٣)" : "Mode Angka: Latin (1 2 3)"}
          </Button>

          <Button
            onClick={handlePrint}
            className="bg-blue-gradient text-white hover:opacity-95 gap-2 shadow-sm font-semibold"
          >
            <Printer className="h-4 w-4" /> Cetak Raport (A4)
          </Button>
        </div>
      </div>

      {/* Raport Sheet (A4 Dimensions with Double Border) */}
      <div 
        id="raport-print-area"
        className="raport-classic-page bg-white text-slate-900 w-full max-w-[210mm] min-h-[297mm] p-[10mm] md:p-[14mm] shadow-xl border border-slate-300 relative box-border"
        style={{ color: "#111827", backgroundColor: "#ffffff" }}
      >
        {/* Double Outline Border Frame */}
        <div className="border-[2px] border-slate-900 p-1 h-full flex flex-col justify-between">
          <div className="border border-slate-900 p-5 md:p-6 h-full flex flex-col justify-between">
            
            {/* Header / Kop Raport */}
            <div>
              <div className="text-center flex flex-col items-center">
                {data.logoUrl ? (
                  <img
                    src={data.logoUrl}
                    alt="Logo Pesantren"
                    className="h-16 w-16 object-contain mb-2"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full border border-slate-800 flex items-center justify-center text-[10px] font-bold mb-2">
                    شعار
                  </div>
                )}
                
                <h1 className="font-arabic text-2xl md:text-3xl font-bold tracking-wide" dir="rtl">
                  كشف الدرجات الدراسية
                </h1>
                <h2 className="font-arabic text-lg md:text-xl font-bold mt-0.5" dir="rtl">
                  {data.namaPondok}
                </h2>
                <p className="font-arabic text-sm text-slate-700 mt-0.5" dir="rtl">
                  {data.alamatPondok}
                </p>
                <div className="w-48 h-[1px] bg-slate-900 my-1.5 mx-auto" />
                <p className="font-arabic text-xs font-semibold text-slate-800" dir="rtl">
                  سنة : {useArabicNumbers ? toArabicDigits(data.hijriYear) : data.hijriYear} هـ / {useArabicNumbers ? toArabicDigits(data.academicYearName) : data.academicYearName} م
                </p>
              </div>

              {/* Student Metadata (Left: Nama & No. Stambuk | Right: Kelas, Bagian, Semester) - STRICTLY NO KAMAR */}
              <div className="mt-5 text-xs md:text-sm font-medium flex justify-between border-t border-slate-300 pt-3">
                <div className="space-y-1">
                  <div className="flex">
                    <span className="w-24 text-slate-700">Nama</span>
                    <span className="font-bold">: {data.student.namaLengkap}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-slate-700">No. Stambuk</span>
                    <span className="font-bold">: {formatNumber(data.student.nis)}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex">
                    <span className="w-20 text-slate-700">Kelas</span>
                    <span className="font-bold">: {data.kelas.namaKelas}</span>
                  </div>
                  <div className="flex">
                    <span className="w-20 text-slate-700">Bagian</span>
                    <span className="font-bold">: {data.bagian || "-"}</span>
                  </div>
                  <div className="flex">
                    <span className="w-20 text-slate-700">Semester</span>
                    <span className="font-bold">: {data.semesterName}</span>
                  </div>
                </div>
              </div>

              {/* Main Grades Table (Classical Pesantren Arabic Table) */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full border-collapse border border-slate-900 text-xs md:text-sm" dir="rtl">
                  <thead>
                    <tr className="bg-slate-50 text-center font-bold">
                      <th className="border border-slate-900 py-2 px-1 w-10 font-arabic text-sm" rowSpan={2}>
                        النمرة
                      </th>
                      <th className="border border-slate-900 py-2 px-3 font-arabic text-sm text-right" rowSpan={2}>
                        الكتب الدراسية
                      </th>
                      <th className="border border-slate-900 py-2 px-3 font-arabic text-sm text-center" rowSpan={2}>
                        الفنون
                      </th>
                      <th className="border border-slate-900 py-1.5 px-2 font-arabic text-sm text-center" colSpan={2}>
                        أرقام الدرجات الدراسية الخاصة والعامة
                      </th>
                    </tr>
                    <tr className="bg-slate-50 text-center font-bold">
                      <th className="border border-slate-900 py-1.5 px-2 w-16 font-arabic text-xs">
                        الخاصة
                      </th>
                      <th className="border border-slate-900 py-1.5 px-2 w-16 font-arabic text-xs">
                        العامة
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.grades.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="border border-slate-900 py-1.5 px-1 text-center font-arabic font-semibold">
                          {formatNumber(idx + 1)}
                        </td>
                        <td className="border border-slate-900 py-1.5 px-3 font-arabic text-sm font-bold text-slate-900">
                          {item.kitabName}
                        </td>
                        <td className="border border-slate-900 py-1.5 px-3 font-arabic text-xs text-center font-medium text-slate-800">
                          {item.fanName}
                        </td>
                        <td className="border border-slate-900 py-1.5 px-2 text-center font-arabic text-sm font-bold">
                          {item.nilaiKhusus !== null ? formatNumber(item.nilaiKhusus) : "-"}
                        </td>
                        <td className="border border-slate-900 py-1.5 px-2 text-center font-arabic text-sm font-bold">
                          {item.nilaiUmum !== null ? formatNumber(item.nilaiUmum) : "-"}
                        </td>
                      </tr>
                    ))}

                    {/* Footer Row 1: Total Jumlah Nilai */}
                    <tr className="bg-slate-50/80 font-bold">
                      <td colSpan={3} className="border border-slate-900 py-2 px-3 text-center font-arabic text-sm">
                        جمل أرقام الدرجات الدراسية
                      </td>
                      <td className="border border-slate-900 py-2 px-2 text-center font-arabic text-sm">
                        {formatNumber(data.totalKhusus)}
                      </td>
                      <td className="border border-slate-900 py-2 px-2 text-center font-arabic text-sm">
                        {formatNumber(data.totalUmum)}
                      </td>
                    </tr>

                    {/* Footer Row 2: Absensi (أيام التأخر) */}
                    <tr>
                      <td colSpan={2} rowSpan={2} className="border border-slate-900 py-2 px-3 text-center font-arabic text-sm font-bold">
                        أيام التأخر
                      </td>
                      <td className="border border-slate-900 py-1 px-3 text-center font-arabic text-xs font-semibold">
                        بإذن
                      </td>
                      <td colSpan={2} className="border border-slate-900 py-1 px-2 text-center font-arabic text-sm font-bold">
                        {formatNumber(data.absenIzin)}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 py-1 px-3 text-center font-arabic text-xs font-semibold">
                        بغيره
                      </td>
                      <td colSpan={2} className="border border-slate-900 py-1 px-2 text-center font-arabic text-sm font-bold">
                        {formatNumber(data.absenAlpha)}
                      </td>
                    </tr>

                    {/* Footer Row 3: Nilai Akhlaq (الأخلاق) */}
                    <tr className="font-bold">
                      <td colSpan={3} className="border border-slate-900 py-2 px-3 text-center font-arabic text-sm">
                        الأخلاق
                      </td>
                      <td colSpan={2} className="border border-slate-900 py-2 px-2 text-center font-arabic text-base">
                        {data.nilaiAkhlaqHuruf || "ج"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Summary & Statement Box (الخلاصة والبيان) */}
              <div className="mt-4 border border-slate-900 grid grid-cols-1 md:grid-cols-2 text-xs md:text-sm font-medium" dir="rtl">
                {/* Right / Arab Right: Bayan / Status Kelulusan */}
                <div className="p-3 border-b md:border-b-0 md:border-l border-slate-900 flex flex-col justify-center">
                  <div className="flex items-center gap-2">
                    <span className="font-arabic font-bold text-sm">البيان :</span>
                    <span className="font-arabic font-bold text-base text-slate-900 underline decoration-slate-400 underline-offset-4">
                      {data.predikatBayan || "المتوسط الأول"}
                    </span>
                  </div>
                </div>

                {/* Left / Arab Left: Khulashoh (Rekapitulasi) */}
                <div className="p-3 space-y-1.5 bg-slate-50/50">
                  <div className="font-arabic font-bold text-center border-b border-slate-300 pb-1 mb-1.5">
                    الخلاصة
                  </div>
                  <div className="flex justify-between font-arabic">
                    <span>خلاصة الدرجات :</span>
                    <span className="font-bold text-sm">{formatNumber(data.rataRata)}</span>
                  </div>
                  <div className="flex justify-between font-arabic text-xs">
                    <span>خلاصة أيام التأخر :</span>
                    <span>
                      بإذن: <strong className="font-bold">{formatNumber(data.absenIzin)}</strong> | بغيره: <strong className="font-bold">{formatNumber(data.absenAlpha)}</strong>
                    </span>
                  </div>
                  <div className="flex justify-between font-arabic">
                    <span>خلاصة الأخلاق :</span>
                    <span className="font-bold text-sm">{data.nilaiAkhlaqHuruf || "ج"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Signature & Seal Stamp Section */}
            <div className="mt-8 pt-4 border-t border-slate-300 grid grid-cols-3 items-end text-center text-xs md:text-sm">
              {/* Left: Mudir / Pengasuh */}
              <div className="flex flex-col items-center">
                <span className="font-arabic font-bold text-sm">المدير</span>
                <div className="h-16 flex items-center justify-center">
                  <span className="text-[10px] text-slate-400 italic">(Tanda Tangan)</span>
                </div>
                <div className="border-b border-slate-900 w-36 pb-0.5 font-bold text-xs md:text-sm">
                  {data.pengasuhName}
                </div>
              </div>

              {/* Center: Official Seal / Stempel */}
              <div className="flex flex-col items-center justify-center">
                <div className="h-20 w-20 rounded-full border border-dashed border-slate-400 flex items-center justify-center text-[10px] text-slate-500 font-semibold text-center p-1">
                  ختم المدرسة
                  <br />
                  (Stempel)
                </div>
              </div>

              {/* Right: Mudarris / Wali Kelas */}
              <div className="flex flex-col items-center">
                <span className="font-arabic font-bold text-sm">المدرس</span>
                <div className="h-16 flex items-center justify-center">
                  <span className="text-[10px] text-slate-400 italic">(Tanda Tangan)</span>
                </div>
                <div className="border-b border-slate-900 w-36 pb-0.5 font-bold text-xs md:text-sm">
                  {data.waliKelasName}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
