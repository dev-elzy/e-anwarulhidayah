import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Data types based on Raport needs
export interface RaportData {
  student: any;
  kelas: any;
  waliName: string;
  pengasuhName: string;
  semesterName: string;
  yearName: string;
  hijriYear: string;
  grades: {
    mapelName: string;
    keterangan: string;
    tamrin: number | null;
    uas: number | null;
    akhir: number;
    huruf: string;
  }[];
  attendance: {
    sakit: number;
    izin: number;
    alpha: number;
  };
  nadzom: {
    namaKitab: string;
    baitMulai: number;
    baitSelesai: number;
    status: string;
  }[];
  catatan: {
    jenis: string;
    isi: string;
  }[];
  totalGrade: number;
  averageGrade: number;
  classRank: number;
  totalStudents: number;
  logoBase64?: string | null;
  namaPondok?: string;
  alamatPondok?: string;
  signatureLocation?: string;
  currentDateText?: string;
}

export function generateRaportPdf(data: RaportData, previewUrlCallback?: (url: string) => void) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const topMargin = 20;
  const bottomMargin = 20;
  const leftMargin = 15;
  const rightMargin = 15;
  
  let currentY = topMargin;

  // Helper function to handle page breaks
  const checkPageBreak = (requiredHeight: number) => {
    if (currentY + requiredHeight > 297 - bottomMargin) {
      doc.addPage();
      currentY = topMargin;
      return true;
    }
    return false;
  };

  // Helper to draw Cover Page (Halaman 1)
  const drawCoverPage = () => {
    // Add border (double outline effect)
    doc.setLineWidth(1);
    doc.rect(10, 10, 190, 277);
    doc.setLineWidth(0.3);
    doc.rect(12, 12, 186, 273);

    currentY = 50;

    doc.setFont("times", "bold");
    doc.setFontSize(22);
    doc.text("LAPORAN HASIL BELAJAR SANTRI", 105, currentY, { align: "center" });
    currentY += 10;
    doc.text("(RAPORT)", 105, currentY, { align: "center" });
    
    currentY += 40;

    if (data.logoBase64) {
      // Draw Logo centered
      const logoWidth = 40;
      const logoHeight = 40;
      doc.addImage(data.logoBase64, "PNG", 105 - (logoWidth / 2), currentY, logoWidth, logoHeight);
      currentY += 60;
    } else {
      // Placeholder if no logo
      doc.setDrawColor(200);
      doc.circle(105, currentY + 20, 20);
      doc.setFontSize(10);
      doc.text("LOGO", 105, currentY + 20, { align: "center", baseline: "middle" });
      currentY += 60;
    }

    doc.setFontSize(18);
    doc.text(data.namaPondok || "", 105, currentY, { align: "center" });
    currentY += 10;
    doc.setFont("times", "normal");
    doc.setFontSize(12);
    doc.text(data.alamatPondok || "", 105, currentY, { align: "center" });

    currentY += 40;

    doc.setFont("times", "normal");
    doc.setFontSize(14);
    doc.text("Nama Santri:", 105, currentY, { align: "center" });
    currentY += 8;
    
    doc.setFont("times", "bold");
    doc.setFontSize(18);
    doc.text(data.student.namaLengkap.toUpperCase(), 105, currentY, { align: "center" });
    currentY += 10;
    doc.setLineWidth(0.5);
    const textWidth = doc.getTextWidth(data.student.namaLengkap.toUpperCase());
    doc.line(105 - (textWidth/2) - 5, currentY - 8, 105 + (textWidth/2) + 5, currentY - 8);

    currentY += 10;
    doc.setFont("times", "normal");
    doc.setFontSize(14);
    doc.text(`NIS: ${data.student.nis}`, 105, currentY, { align: "center" });

    // Add new page for the actual Raport content
    doc.addPage();
    currentY = topMargin;
  };

  // 1. Draw Header
  const drawHeader = () => {
    // If logo exists, draw it on the top left
    if (data.logoBase64) {
      doc.addImage(data.logoBase64, "PNG", leftMargin, currentY - 5, 20, 20);
    }

    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.text(data.namaPondok || "", 105, currentY, { align: "center" });
    currentY += 6;
    doc.setFontSize(10);
    doc.setFont("times", "normal");
    doc.text(data.alamatPondok || "", 105, currentY, { align: "center" });
    currentY += 4;
    
    // Draw line
    doc.setLineWidth(0.5);
    doc.line(leftMargin, currentY, 210 - rightMargin, currentY);
    currentY += 1;
    doc.setLineWidth(1.5);
    doc.line(leftMargin, currentY, 210 - rightMargin, currentY);
    currentY += 8;

    // Title
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text("LAPORAN HASIL BELAJAR SANTRI (RAPORT)", 105, currentY, { align: "center" });
    currentY += 8;
  };

  // 2. Draw Student Info
  const drawStudentInfo = () => {
    doc.setFontSize(10);
    const col1X = leftMargin;
    const col1Colon = leftMargin + 30;
    const col1Value = leftMargin + 33;

    const col2X = 210 / 2 + 10;
    const col2Colon = col2X + 25;
    const col2Value = col2X + 28;

    doc.setFont("times", "normal");
    
    // Row 1
    doc.text("Nama Santri", col1X, currentY);
    doc.text(":", col1Colon, currentY);
    doc.setFont("times", "bold");
    doc.text(data.student.namaLengkap.toUpperCase(), col1Value, currentY);
    doc.setFont("times", "normal");

    doc.text("Kelas", col2X, currentY);
    doc.text(":", col2Colon, currentY);
    doc.text(data.kelas.namaKelas, col2Value, currentY);
    currentY += 6;

    // Row 2
    doc.text("NIS", col1X, currentY);
    doc.text(":", col1Colon, currentY);
    doc.text(data.student.nis, col1Value, currentY);

    doc.text("Semester", col2X, currentY);
    doc.text(":", col2Colon, currentY);
    doc.text(data.semesterName, col2Value, currentY);
    currentY += 6;

    // Row 3
    doc.text("Tahun Ajaran", col1X, currentY);
    doc.text(":", col1Colon, currentY);
    doc.text(data.yearName, col1Value, currentY);

    doc.text("Tahun Hijriyah", col2X, currentY);
    doc.text(":", col2Colon, currentY);
    doc.text(data.hijriYear, col2Value, currentY);
    currentY += 8;
  };

  // 3. Draw Score Table
  const drawScoreTable = () => {
    checkPageBreak(30);

    const tableData = data.grades.map((g, index) => [
      index + 1,
      g.mapelName,
      g.tamrin ?? "-",
      g.uas ?? "-",
      g.akhir,
      g.huruf
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [
        [
          { content: "No", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
          { content: "Mata Pelajaran (Kitab)", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
          { content: "Nilai", colSpan: 4, styles: { halign: "center" } }
        ],
        ["Tamrin", "UAS", "Akhir", "Huruf"]
      ],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], font: "times", fontStyle: "bold", lineWidth: 0.1, lineColor: 0 },
      bodyStyles: { font: "times", textColor: [0, 0, 0], lineWidth: 0.1, lineColor: 0 },
      columnStyles: {
        0: { halign: "center", cellWidth: 10 },
        1: { halign: "left" },
        2: { halign: "center", cellWidth: 15 },
        3: { halign: "center", cellWidth: 15 },
        4: { halign: "center", cellWidth: 15 },
        5: { halign: "center", cellWidth: 20 }
      },
      margin: { left: leftMargin, right: rightMargin },
      styles: { fontSize: 10, cellPadding: 2 },
      didDrawPage: () => {
        // Will handle page break correctly internally
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 5;

    // Draw Averages
    checkPageBreak(20);
    doc.setFont("times", "bold");
    doc.text("Jumlah Nilai Akhir", leftMargin, currentY);
    doc.text(":", leftMargin + 35, currentY);
    doc.text(data.totalGrade.toString(), leftMargin + 40, currentY);
    currentY += 5;

    doc.text("Rata-rata Kelas", leftMargin, currentY);
    doc.text(":", leftMargin + 35, currentY);
    doc.text(data.averageGrade.toString(), leftMargin + 40, currentY);
    currentY += 5;

    doc.text("Peringkat", leftMargin, currentY);
    doc.text(":", leftMargin + 35, currentY);
    doc.text(`${data.classRank} dari ${data.totalStudents} Santri`, leftMargin + 40, currentY);
    currentY += 10;
  };

  // 4. Draw Secondary Tables (Nadzom, Catatan, Absensi)
  const drawSecondaryTables = () => {
    // Nadzom
    if (data.nadzom.length > 0) {
      checkPageBreak(30);
      autoTable(doc, {
        startY: currentY,
        head: [["Pencapaian Hafalan Nadzom", "Keterangan"]],
        body: data.nadzom.map(n => [n.namaKitab, `Bait ${n.baitMulai} - ${n.baitSelesai} (${n.status})`]),
        theme: "grid",
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], font: "times", fontStyle: "bold", lineWidth: 0.1, lineColor: 0 },
        bodyStyles: { font: "times", textColor: [0, 0, 0], lineWidth: 0.1, lineColor: 0 },
        margin: { left: leftMargin, right: rightMargin },
        styles: { fontSize: 10, cellPadding: 2 }
      });
      currentY = (doc as any).lastAutoTable.finalY + 5;
    }

    // Catatan & Absensi side-by-side or stacked
    checkPageBreak(40);
    
    const catatanBody = data.catatan.length > 0 
      ? data.catatan.map(c => [c.isi])
      : [["-"]];

    autoTable(doc, {
      startY: currentY,
      head: [["Catatan Wali Kelas"]],
      body: catatanBody,
      theme: "grid",
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], font: "times", fontStyle: "bold", lineWidth: 0.1, lineColor: 0, halign: "center" },
      bodyStyles: { font: "times", textColor: [0, 0, 0], lineWidth: 0.1, lineColor: 0, minCellHeight: 20 },
      margin: { left: leftMargin, right: 210 / 2 + 5 },
      styles: { fontSize: 10, cellPadding: 2 }
    });

    const catatanFinalY = (doc as any).lastAutoTable.finalY;

    autoTable(doc, {
      startY: currentY,
      head: [["Ketidakhadiran", "Total"]],
      body: [
        ["Sakit", data.attendance.sakit || "-"],
        ["Izin", data.attendance.izin || "-"],
        ["Alpa", data.attendance.alpha || "-"]
      ],
      theme: "grid",
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], font: "times", fontStyle: "bold", lineWidth: 0.1, lineColor: 0, halign: "center" },
      bodyStyles: { font: "times", textColor: [0, 0, 0], lineWidth: 0.1, lineColor: 0 },
      columnStyles: { 1: { halign: "center", cellWidth: 20 } },
      margin: { left: 210 / 2 + 10, right: rightMargin },
      styles: { fontSize: 10, cellPadding: 2 }
    });

    const absensiFinalY = (doc as any).lastAutoTable.finalY;
    currentY = Math.max(catatanFinalY, absensiFinalY) + 15;
  };

  // 5. Draw Signatures
  const drawSignatures = () => {
    checkPageBreak(50);
    doc.setFont("times", "normal");
    doc.setFontSize(10);
    
    // Wali Kelas (Left)
    doc.text("Mengetahui,", leftMargin + 10, currentY, { align: "center" });
    doc.text("Wali Kelas", leftMargin + 10, currentY + 5, { align: "center" });
    doc.setFont("times", "bold");
    doc.text(data.waliName, leftMargin + 10, currentY + 25, { align: "center" });

    // Orang Tua (Center)
    doc.setFont("times", "normal");
    doc.text("Orang Tua/Wali Santri,", 105, currentY + 5, { align: "center" });
    doc.line(105 - 20, currentY + 26, 105 + 20, currentY + 26); // Signature line

    // Pengasuh (Right)
    const sigLocation = data.signatureLocation || "Tempat";
    const sigDate = data.currentDateText || "..........................";
    doc.text(`${sigLocation}, ${sigDate}`, 210 - rightMargin - 20, currentY, { align: "center" });
    doc.text("Pengasuh Pondok,", 210 - rightMargin - 20, currentY + 5, { align: "center" });
    doc.setFont("times", "bold");
    doc.text(data.pengasuhName, 210 - rightMargin - 20, currentY + 25, { align: "center" });
  };

  drawCoverPage();
  drawHeader();
  drawStudentInfo();
  drawScoreTable();
  drawSecondaryTables();
  drawSignatures();

  // Save or preview
  if (previewUrlCallback) {
    const pdfBlob = doc.output("blob");
    const url = URL.createObjectURL(pdfBlob);
    previewUrlCallback(url);
  } else {
    doc.save(`Raport_${data.student.namaLengkap.replace(/\s+/g, "_")}.pdf`);
  }
}
