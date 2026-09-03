

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// Master actions
import {
  getSantriList, createSantri, updateSantri, deleteSantri, importSantri,
  getUstadzList, createUstadz, updateUstadz, deleteUstadz,
  getKelasList, getKamarList,
  getUsersWithUstadz, getUsersWithWali,
  createUstadzAccount, resetUserPassword, autoGenerateAccounts, createWaliAccount,
  getAlumniList, changeSantriStatus,
} from "@/actions/master";

import {
  getStudentsForAttendance,
  saveStudentsAttendance,
  processClassScan
} from "@/actions/absensi";

// Additional actions
import {
  createKelas, updateKelas, deleteKelas,
  createKamar, updateKamar, deleteKamar,
  getKitabList, createKitab, updateKitab, deleteKitab,
  getJadwalList, createJadwal, updateJadwal, deleteJadwal,
  createPengumuman, deletePengumuman,
  createNilai, deleteNilai, saveGradesBatch,
  createCatatan, deleteCatatan,
  createSetoranNadzom, deleteSetoranNadzom,
  getKitabNadzomList, createKitabNadzom, updateKitabNadzom, deleteKitabNadzom,
  getTargetHafalanList, createTargetHafalan, updateTargetHafalan, deleteTargetHafalan,
  getWaliList, createWali,
  getHafalanList,
  createUser, deleteUser, updateSystemSettings, updateRolePermissions,
} from "@/actions/additional";

// ─── GET: fetch list data ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resource = request.nextUrl.searchParams.get("resource");

  try {
    switch (resource) {
      case "santri": {
        const search = request.nextUrl.searchParams.get("search") || undefined;
        const gender = request.nextUrl.searchParams.get("gender") || undefined;
        const kelasId = request.nextUrl.searchParams.get("kelasId") || undefined;
        const includeAlumni = request.nextUrl.searchParams.get("includeAlumni") === "true";
        return NextResponse.json(await getSantriList(search, gender, kelasId, includeAlumni));
      }
      case "alumni": {
        const search = request.nextUrl.searchParams.get("search") || undefined;
        const gender = request.nextUrl.searchParams.get("gender") || undefined;
        const status = request.nextUrl.searchParams.get("status") || undefined;
        const tahunKeluar = request.nextUrl.searchParams.get("tahunKeluar") || undefined;
        return NextResponse.json(await getAlumniList(search, gender, status, tahunKeluar));
      }
      case "ustadz":
        return NextResponse.json(await getUstadzList());
      case "kelas":
        return NextResponse.json(await getKelasList());
      case "kamar":
        return NextResponse.json(await getKamarList());
      case "kitab":
        return NextResponse.json(await getKitabList());
      case "jadwal":
        return NextResponse.json(await getJadwalList());
      case "akun-ustadz":
        return NextResponse.json(await getUsersWithUstadz());
      case "akun-wali":
        return NextResponse.json(await getUsersWithWali());
      case "kitab-nadzom":
        return NextResponse.json(await getKitabNadzomList());
      case "target-hafalan":
        return NextResponse.json(await getTargetHafalanList());
      case "wali":
        return NextResponse.json(await getWaliList());
      case "hafalan":
        return NextResponse.json(await getHafalanList());
      case "students-attendance": {
        const kelasId = request.nextUrl.searchParams.get("kelasId") || "";
        const sessionId = request.nextUrl.searchParams.get("sessionId") || "";
        return NextResponse.json(await getStudentsForAttendance(kelasId, sessionId));
      }
      default:
        return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
    }
  } catch (e: any) {
    console.error(`[API/master GET] resource=${resource}`, e);
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

// ─── POST: mutations ──────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id || "";
  const body = await request.json() as any;
  const { action, data, id, params } = body;

  try {
    let result: any;

    switch (action) {
      // ── Santri ──
      case "createSantri":    result = await createSantri(data, userId); break;
      case "updateSantri":    result = await updateSantri(id, data, userId); break;
      case "deleteSantri":    result = await deleteSantri(id, userId); break;
      case "importSantri":    result = await importSantri(data, userId); break;
      case "changeSantriStatus": result = await changeSantriStatus(id, params.status, params.tahunKeluar, userId); break;

      // ── Ustadz ──
      case "createUstadz":   result = await createUstadz(data, userId); break;
      case "updateUstadz":   result = await updateUstadz(id, data, userId); break;
      case "deleteUstadz":   result = await deleteUstadz(id, userId); break;

      // ── Kelas ──
      case "createKelas":    result = await createKelas(data, userId); break;
      case "updateKelas":    result = await updateKelas(id, data, userId); break;
      case "deleteKelas":    result = await deleteKelas(id, userId); break;

      // ── Kamar ──
      case "createKamar":    result = await createKamar(data, userId); break;
      case "updateKamar":    result = await updateKamar(id, data, userId); break;
      case "deleteKamar":    result = await deleteKamar(id, userId); break;

      // ── Kitab / Mapel ──
      case "createKitab":    result = await createKitab(data, userId); break;
      case "updateKitab":    result = await updateKitab(id, data, userId); break;
      case "deleteKitab":    result = await deleteKitab(id, userId); break;

      // ── Jadwal ──
      case "createJadwal":   result = await createJadwal(data, userId); break;
      case "updateJadwal":   result = await updateJadwal(id, data, userId); break;
      case "deleteJadwal":   result = await deleteJadwal(id, userId); break;

      // ── Pengumuman ──
      case "createPengumuman": result = await createPengumuman(data, userId); break;
      case "deletePengumuman": result = await deletePengumuman(id, userId); break;

      // ── Akun ──
      case "createUstadzAccount":
        result = await createUstadzAccount(params.ustadzId, params.roleId, userId);
        break;
      case "createWaliAccount":
        result = await createWaliAccount(params.waliId, userId);
        break;
      case "resetUserPassword":   result = await resetUserPassword(id, userId); break;
      case "autoGenerateAccounts": result = await autoGenerateAccounts(userId); break;
      case "createUser":          result = await createUser(data, userId); break;
      case "deleteUser":          result = await deleteUser(id, userId); break;
      case "updateSystemSettings": result = await updateSystemSettings(data, userId); break;
      case "updateRolePermissions":
        result = await updateRolePermissions(params.roleId, params.permissionIds, userId);
        break;

      // ── Nilai ──
      case "createNilai":    result = await createNilai(data, userId); break;
      case "deleteNilai":    result = await deleteNilai(id, userId); break;
      case "saveGradesBatch": result = await saveGradesBatch(data, userId); break;

      // ── Catatan ──
      case "createCatatan":  result = await createCatatan(data, userId); break;
      case "deleteCatatan":  result = await deleteCatatan(id, userId); break;

      // ── Setoran Nadzom ──
      case "createSetoranNadzom": result = await createSetoranNadzom(data, userId); break;
      case "deleteSetoranNadzom": result = await deleteSetoranNadzom(id, userId); break;

      // ── Kitab Nadzom ──
      case "createKitabNadzom": result = await createKitabNadzom(data, userId); break;
      case "updateKitabNadzom": result = await updateKitabNadzom(id, data, userId); break;
      case "deleteKitabNadzom": result = await deleteKitabNadzom(id, userId); break;

      // ── Target Hafalan ──
      case "createTargetHafalan": result = await createTargetHafalan(data, userId); break;
      case "updateTargetHafalan": result = await updateTargetHafalan(id, data, userId); break;
      case "deleteTargetHafalan": result = await deleteTargetHafalan(id, userId); break;

      // ── Wali Santri ──
      case "createWali": result = await createWali(data, userId); break;

      // ── Absensi ──
      case "saveStudentsAttendance":
        result = await saveStudentsAttendance(
          params.sessionId,
          params.records,
          params.ustadzId,
          params.materi,
          params.catatan
        );
        break;
      case "processClassScan":
        result = await processClassScan({
          kelasId: params.kelasId,
          ustadzId: params.ustadzId
        });
        break;

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    return NextResponse.json(result ?? { success: true });
  } catch (e: any) {
    console.error(`[API/master POST] action=${action}`, e);
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
