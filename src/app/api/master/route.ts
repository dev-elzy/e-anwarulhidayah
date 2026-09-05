

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// Master actions
import {
  getSantriList, createSantri, updateSantri, deleteSantri, importSantri,
  getUstadzList, createUstadz, updateUstadz, deleteUstadz,
  getKelasList, getKamarList,
  getUsersWithUstadz, getUsersWithWali,
  createUstadzAccount, resetUserPassword, autoGenerateAccounts, createWaliAccount,
  updateUserAccount, updateSelfProfile,
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
  const userRole = session.user.role || "";
  const body = await request.json() as any;
  const { action, data, id, params } = body;

  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const isOperatorOrAdmin = userRole === "SUPER_ADMIN" || userRole === "OPERATOR";
  const isMustahiqOrAbove = ["SUPER_ADMIN", "OPERATOR", "MUSTAHIQ"].includes(userRole);
  const isMunawibOrAbove = ["SUPER_ADMIN", "OPERATOR", "MUSTAHIQ", "MUNAWIB"].includes(userRole);

  try {
    let result: any;

    switch (action) {
      // ── Super Admin Only ──
      case "createUser":
        if (!isSuperAdmin) return NextResponse.json({ error: "Akses ditolak: Hanya Super Admin." }, { status: 403 });
        result = await createUser(data, userId);
        break;
      case "deleteUser":
        if (!isSuperAdmin) return NextResponse.json({ error: "Akses ditolak: Hanya Super Admin." }, { status: 403 });
        result = await deleteUser(id, userId);
        break;
      case "updateSystemSettings":
        if (!isSuperAdmin) return NextResponse.json({ error: "Akses ditolak: Hanya Super Admin." }, { status: 403 });
        result = await updateSystemSettings(data, userId);
        break;
      case "updateRolePermissions":
        if (!isSuperAdmin) return NextResponse.json({ error: "Akses ditolak: Hanya Super Admin." }, { status: 403 });
        result = await updateRolePermissions(params.roleId, params.permissionIds, userId);
        break;

      // ── Operator & Super Admin ──
      case "createSantri":
        if (!isOperatorOrAdmin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await createSantri(data, userId);
        break;
      case "updateSantri":
        if (!isOperatorOrAdmin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await updateSantri(id, data, userId);
        break;
      case "deleteSantri":
        if (!isOperatorOrAdmin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await deleteSantri(id, userId);
        break;
      case "importSantri":
        if (!isOperatorOrAdmin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await importSantri(data, userId);
        break;
      case "changeSantriStatus":
        if (!isOperatorOrAdmin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await changeSantriStatus(id, params.status, params.tahunKeluar, userId);
        break;

      case "createUstadz":
        if (!isOperatorOrAdmin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await createUstadz(data, userId);
        break;
      case "updateUstadz":
        if (!isOperatorOrAdmin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await updateUstadz(id, data, userId);
        break;
      case "deleteUstadz":
        if (!isOperatorOrAdmin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await deleteUstadz(id, userId);
        break;

      case "createKelas":
        if (!isOperatorOrAdmin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await createKelas(data, userId);
        break;
      case "updateKelas":
        if (!isOperatorOrAdmin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await updateKelas(id, data, userId);
        break;
      case "deleteKelas":
        if (!isOperatorOrAdmin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await deleteKelas(id, userId);
        break;

      case "createKamar":
        if (!isOperatorOrAdmin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await createKamar(data, userId);
        break;
      case "updateKamar":
        if (!isOperatorOrAdmin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await updateKamar(id, data, userId);
        break;
      case "deleteKamar":
        if (!isOperatorOrAdmin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await deleteKamar(id, userId);
        break;

      case "createKitab":
        if (!isOperatorOrAdmin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await createKitab(data, userId);
        break;
      case "updateKitab":
        if (!isOperatorOrAdmin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await updateKitab(id, data, userId);
        break;
      case "deleteKitab":
        if (!isOperatorOrAdmin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await deleteKitab(id, userId);
        break;

      case "createJadwal":
        if (!isOperatorOrAdmin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await createJadwal(data, userId);
        break;
      case "updateJadwal":
        if (!isOperatorOrAdmin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await updateJadwal(id, data, userId);
        break;
      case "deleteJadwal":
        if (!isOperatorOrAdmin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await deleteJadwal(id, userId);
        break;

      case "createPengumuman":
        if (!isOperatorOrAdmin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await createPengumuman(data, userId);
        break;
      case "deletePengumuman":
        if (!isOperatorOrAdmin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await deletePengumuman(id, userId);
        break;

      case "createUstadzAccount":
        if (!isOperatorOrAdmin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await createUstadzAccount(params.ustadzId, params.roleId, userId, params.username, params.password);
        break;
      case "createWaliAccount":
        if (!isOperatorOrAdmin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await createWaliAccount(params.waliId, userId);
        break;
      case "updateUserAccount":
        if (!isOperatorOrAdmin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await updateUserAccount(id, data, userId);
        break;
      case "resetUserPassword":
        if (!isOperatorOrAdmin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await resetUserPassword(id, userId);
        break;
      case "autoGenerateAccounts":
        if (!isOperatorOrAdmin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await autoGenerateAccounts(userId);
        break;
      case "createWali":
        if (!isOperatorOrAdmin) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await createWali(data, userId);
        break;

      // ── Self Profile Update ──
      case "updateSelfProfile":
        result = await updateSelfProfile(userId, data);
        break;

      // ── Nilai, Catatan, Hafalan (Mustahiq / Operator / Super Admin) ──
      case "createNilai":
        if (!isMustahiqOrAbove) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await createNilai(data, userId);
        break;
      case "deleteNilai":
        if (!isMustahiqOrAbove) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await deleteNilai(id, userId);
        break;
      case "saveGradesBatch":
        if (!isMustahiqOrAbove) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await saveGradesBatch(data, userId);
        break;

      case "createCatatan":
        if (!isMustahiqOrAbove) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await createCatatan(data, userId);
        break;
      case "deleteCatatan":
        if (!isMustahiqOrAbove) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await deleteCatatan(id, userId);
        break;

      case "createSetoranNadzom":
        if (!isMustahiqOrAbove) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await createSetoranNadzom(data, userId);
        break;
      case "deleteSetoranNadzom":
        if (!isMustahiqOrAbove) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await deleteSetoranNadzom(id, userId);
        break;

      case "createKitabNadzom":
        if (!isMustahiqOrAbove) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await createKitabNadzom(data, userId);
        break;
      case "updateKitabNadzom":
        if (!isMustahiqOrAbove) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await updateKitabNadzom(id, data, userId);
        break;
      case "deleteKitabNadzom":
        if (!isMustahiqOrAbove) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await deleteKitabNadzom(id, userId);
        break;

      case "createTargetHafalan":
        if (!isMustahiqOrAbove) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await createTargetHafalan(data, userId);
        break;
      case "updateTargetHafalan":
        if (!isMustahiqOrAbove) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await updateTargetHafalan(id, data, userId);
        break;
      case "deleteTargetHafalan":
        if (!isMustahiqOrAbove) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await deleteTargetHafalan(id, userId);
        break;

      // ── Absensi (Munawib / Mustahiq / Operator / Super Admin) ──
      case "saveStudentsAttendance":
        if (!isMunawibOrAbove) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
        result = await saveStudentsAttendance(
          params.sessionId,
          params.records,
          params.ustadzId,
          params.materi,
          params.catatan
        );
        break;
      case "processClassScan":
        if (!isMunawibOrAbove) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
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
