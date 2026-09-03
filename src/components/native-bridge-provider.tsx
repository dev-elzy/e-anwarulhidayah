"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { isNativePlatform } from "@/utils/native-bridge";
import { saveFcmToken } from "@/actions/notification";
import { toast } from "sonner";

export function NativeBridgeProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    if (!isNativePlatform()) return;

    // Initialize Native UI (Status Bar & Splash Screen)
    const initNativeUI = async () => {
      try {
        const { StatusBar } = await import("@capacitor/status-bar");
        const { SplashScreen } = await import("@capacitor/splash-screen");

        // Style the Android Status Bar to fit the Islamic dark green primary theme
        await StatusBar.setBackgroundColor({ color: "#064e3b" });
        await StatusBar.setOverlaysWebView({ overlay: false });

        // Hide Splash Screen after layout is ready
        await SplashScreen.hide();
      } catch (err) {
        console.warn("Failed to initialize native UI:", err);
      }
    };

    initNativeUI();
  }, []);

  // Handle FCM registration only when the user is logged in (to associate token with user account)
  useEffect(() => {
    if (!isNativePlatform() || !session?.user?.id) return;

    const initPushNotifications = async () => {
      try {
        const { PushNotifications } = await import("@capacitor/push-notifications");

        // 1. Request notification permission (Required for Android 13+)
        let permission = await PushNotifications.checkPermissions();
        if (permission.receive !== "granted") {
          permission = await PushNotifications.requestPermissions();
        }

        if (permission.receive !== "granted") {
          console.warn("Push Notification permissions were denied.");
          return;
        }

        // 2. Register for push notifications (Triggers registration listener)
        await PushNotifications.register();

        // 3. Set up listeners
        await PushNotifications.addListener("registration", async (token) => {
          console.log("FCM registration success, token obtained.");
          
          // Send token to backend
          const result = await saveFcmToken(token.value);
          if (result.error) {
            console.error("Failed to save FCM token to backend:", result.error);
          } else {
            console.log("FCM Token saved to database successfully.");
          }
        });

        await PushNotifications.addListener("registrationError", (err) => {
          console.error("FCM Registration Error:", err);
        });

        // 4. Handle notification received while the app is in the foreground
        await PushNotifications.addListener("pushNotificationReceived", (notification) => {
          console.log("Notification received in foreground:", notification);
          toast.success(notification.title || "Notifikasi Baru", {
            description: notification.body,
            duration: 5000,
            action: {
              label: "Buka",
              onClick: () => {
                if (notification.data?.click_action) {
                  window.location.href = notification.data.click_action;
                }
              }
            }
          });
        });

        // 5. Handle action performed (app opened by clicking the notification)
        await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
          console.log("Notification action performed:", action);
          const clickAction = action.notification.data?.click_action;
          if (clickAction) {
            window.location.href = clickAction;
          }
        });

      } catch (error) {
        console.error("Error setting up push notifications:", error);
      }
    };

    initPushNotifications();
  }, [session]);

  return <>{children}</>;
}
