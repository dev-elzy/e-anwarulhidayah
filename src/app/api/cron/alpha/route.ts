import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { 
  jadwal, 
  classSessions, 
  izinGuru, 
  absensiUstadz, 
  ustadz, 
  kelas, 
  notifications 
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { sendBroadcastNotification } from "@/actions/notification";

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export async function GET(request: Request) {
  // Verifikasi secret header untuk mencegah akses tidak sah
  const cronSecret = (request as NextRequest).headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database not connected" }, { status: 500 });
  }

  try {
    // 1. Get current date & time in Asia/Jakarta timezone
    const todayStr = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
    const timeStr = new Date().toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour12: false }).substring(0, 5);
    const dayName = new Intl.DateTimeFormat("id-ID", { weekday: "long", timeZone: "Asia/Jakarta" }).format(new Date());

    const nowMin = timeToMinutes(timeStr);

    // Check if there's any active session today across all classes (meaning school is open)
    const sessionsToday = await db.select().from(classSessions).where(eq(classSessions.tanggal, todayStr));
    const isSchoolActiveToday = sessionsToday.length > 0;

    const dayJadwals = await db.select().from(jadwal).where(eq(jadwal.hari, dayName));

    const processed = [];

    for (const sched of dayJadwals) {
      const endMin = timeToMinutes(sched.jamSelesai);
      
      // Check if schedule has already ended
      if (nowMin >= endMin) {
        // Check if class session already exists for this schedule today
        const existingSession = await db.select()
          .from(classSessions)
          .where(and(
            eq(classSessions.jadwalId, sched.id),
            eq(classSessions.tanggal, todayStr)
          ))
          .limit(1);

        if (existingSession.length === 0) {
          // No session logged!
          // Check if teacher has an approved leave request for today
          const approvedLeave = await db.select()
            .from(izinGuru)
            .where(and(
              eq(izinGuru.guruId, sched.ustadzId),
              eq(izinGuru.tanggal, todayStr),
              eq(izinGuru.status, "Disetujui")
            ))
            .limit(1);

          const sessionId = "SESS-AUTO-" + Math.random().toString(36).substring(2, 11).toUpperCase();
          
          // Create class session as TIDAK_BERJALAN
          await db.insert(classSessions).values({
            id: sessionId,
            kelasId: sched.kelasId,
            jadwalId: sched.id,
            tanggal: todayStr,
            jamMulai: sched.jamMulai,
            jamSelesai: sched.jamSelesai,
            status: "TIDAK_BERJALAN",
            tahunAjaranId: sched.tahunAjaranId,
            semesterId: sched.semesterId
          });

          // Jika ustadz lain masuk (sekolah aktif), default IZIN. Jika sekolah libur (tidak ada masuk satupun), default ALPHA.
          let attendanceStatus = isSchoolActiveToday ? "Izin" : "Alpha";
          if (approvedLeave.length > 0) {
            attendanceStatus = "Izin";
          }

          // Create ustadz attendance record
          const abuId = "ABU-" + Math.random().toString(36).substring(2, 11).toUpperCase();
          await db.insert(absensiUstadz).values({
            id: abuId,
            ustadzId: sched.ustadzId,
            jadwalId: sched.id,
            sessionId: sessionId,
            tanggal: todayStr,
            waktuScan: "00:00:00",
            status: attendanceStatus,
            teacherType: "PRIMARY"
          });

          // Fetch names for notifications
          const ustadzInfo = await db.select().from(ustadz).where(eq(ustadz.id, sched.ustadzId)).limit(1);
          const kelasInfo = await db.select().from(kelas).where(eq(kelas.id, sched.kelasId)).limit(1);
          const ustadzName = ustadzInfo[0]?.nama || sched.ustadzId;
          const kelasName = kelasInfo[0]?.namaKelas || sched.kelasId;

          // Trigger notifications to Pengasuh and Operator
          if (attendanceStatus === "Alpha") {
            const notifRoles = ["PENGASUH", "OPERATOR"];
            for (const role of notifRoles) {
              const notifId = "NTF-" + Math.random().toString(36).substring(2, 11).toUpperCase();
              await db.insert(notifications).values({
                id: notifId,
                roleId: role,
                title: "Guru Mangkir (Alpha)",
                message: `Ustadz ${ustadzName} tidak hadir mengajar kelas ${kelasName} di jadwal ${sched.jamMulai} - ${sched.jamSelesai}. Sesi ditutup otomatis.`,
                type: "GURU_ALPHA",
                isRead: false,
                createdAt: new Date().toISOString()
              });

              // Send actual FCM push notification to devices in this role
              await sendBroadcastNotification(
                role as any,
                "Guru Mangkir (Alpha)",
                `Ustadz ${ustadzName} tidak hadir mengajar kelas ${kelasName} di jadwal ${sched.jamMulai} - ${sched.jamSelesai}. Sesi ditutup otomatis.`,
                { click_action: `/dashboard/${role.toLowerCase().replace('_', '-')}` }
              ).catch(err => console.error(`Failed to send cron broadcast push notification for role ${role}:`, err));
            }
          }

          processed.push({
            jadwalId: sched.id,
            kelasId: sched.kelasId,
            status: attendanceStatus
          });
        }
      }
    }

    return NextResponse.json({ success: true, processed });
  } catch (error: any) {
    console.error("Cron alpha check failed:", error);
    return NextResponse.json({ error: error.message || "Failed to execute cron" }, { status: 500 });
  }
}
