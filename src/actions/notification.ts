"use server";

import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { sendFcmMessage } from "@/lib/fcm";

/**
 * Server Action: Save FCM Registration Token for the logged-in user
 */
export async function saveFcmToken(token: string) {
  if (!token) return { error: "Token tidak valid." };

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Akses ditolak: User belum login." };
    }

    const db = getDb();
    if (!db) return { error: "Database tidak terhubung." };

    // Update FCM token for current user
    await db
      .update(users)
      .set({ fcmToken: token })
      .where(eq(users.id, session.user.id));

    return { success: true, message: "Token FCM berhasil didaftarkan." };
  } catch (error: any) {
    console.error("Failed to save FCM token:", error);
    return { error: error.message || "Gagal menyimpan token FCM." };
  }
}

/**
 * Server Action: Send Push Notification to a specific user
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  try {
    const db = getDb();
    if (!db) return { error: "Database tidak terhubung." };

    // Find target user
    const userList = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const targetUser = userList[0];

    if (!targetUser || !targetUser.fcmToken) {
      return { error: "User tidak ditemukan atau belum mendaftarkan token FCM." };
    }

    const fcmResult = await sendFcmMessage({
      token: targetUser.fcmToken,
      notification: { title, body },
      data,
      android: {
        notification: {
          sound: "default",
          click_action: "/dashboard" // Direct deep link
        }
      }
    });

    if (!fcmResult.success) {
      return { error: fcmResult.error || "Gagal mengirim notifikasi via FCM." };
    }

    return { success: true, messageId: fcmResult.messageId };
  } catch (error: any) {
    console.error("Failed to send push notification:", error);
    return { error: error.message || "Gagal memproses pengiriman notifikasi." };
  }
}

/**
 * Server Action: Send Broadcast Push Notification to all users in a specific role
 */
export async function sendBroadcastNotification(
  role: "SUPER_ADMIN" | "OPERATOR" | "PENGASUH" | "MUSTAHIQ" | "MUNAWIB" | "WALI_SANTRI",
  title: string,
  body: string,
  data?: Record<string, string>
) {
  try {
    const db = getDb();
    if (!db) return { error: "Database tidak terhubung." };

    // Find all users in role who have an active FCM token
    const usersInRole = await db
      .select()
      .from(users)
      .where(and(eq(users.roleId, role), sql`${users.fcmToken} IS NOT NULL`));

    if (usersInRole.length === 0) {
      return { success: true, count: 0, message: "Tidak ada user dengan token FCM aktif di role ini." };
    }

    let successCount = 0;
    const promises = usersInRole.map(async (u: any) => {
      if (u.fcmToken) {
        const res = await sendFcmMessage({
          token: u.fcmToken,
          notification: { title, body },
          data,
          android: {
            notification: {
              sound: "default",
              click_action: "/dashboard"
            }
          }
        });
        if (res.success) {
          successCount++;
        }
      }
    });

    await Promise.all(promises);

    return {
      success: true,
      count: usersInRole.length,
      successCount,
      message: `Berhasil mengirim broadcast ke ${successCount}/${usersInRole.length} perangkat.`
    };
  } catch (error: any) {
    console.error("Failed to send broadcast notification:", error);
    return { error: error.message || "Gagal memproses pengiriman broadcast." };
  }
}
