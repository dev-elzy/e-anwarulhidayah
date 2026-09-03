import { Capacitor } from "@capacitor/core";
import { Camera, CameraResultType, CameraSource, CameraDirection } from "@capacitor/camera";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

/**
 * Check if the application is running inside a native mobile container (Capacitor)
 */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Trigger native haptic/vibration feedback
 */
export function vibrate(pattern: number | number[] = 200) {
  if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
    try {
      window.navigator.vibrate(pattern);
    } catch (e) {
      console.warn("Vibration failed:", e);
    }
  }
}

// Helper: Convert Blob to clean Base64 string (without headers)
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const cleanBase64 = base64String.split(",")[1];
      resolve(cleanBase64 || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Download a file from a URL, save it natively using Filesystem, and open/share it
 */
export async function downloadAndOpenFile(url: string, filename: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isNativePlatform()) {
      // Browser fallback download
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return { success: true };
    }

    // 1. Fetch file as blob
    const response = await fetch(url);
    if (!response.ok) throw new Error("Gagal mengunduh file dari server.");
    const blob = await response.blob();

    // 2. Convert to base64
    const base64Data = await blobToBase64(blob);

    // 3. Write file to Android Documents directory
    const fileResult = await Filesystem.writeFile({
      path: filename,
      data: base64Data,
      directory: Directory.Documents,
    });

    // 4. Trigger native Share intent to open/send the file (allows WhatsApp, PDF opener, etc.)
    await Share.share({
      title: filename,
      text: `Membuka berkas: ${filename}`,
      url: fileResult.uri,
      dialogTitle: `Buka berkas ${filename}`
    });

    return { success: true };
  } catch (error: any) {
    console.error("Native download and share failed:", error);
    return { success: false, error: error.message || "Gagal menyimpan berkas." };
  }
}

/**
 * Capture a photo using native camera or select it from the gallery, and upload to Next.js API
 */
export async function takePhotoAndUpload(options: {
  source: "CAMERA" | "PHOTOS";
  direction?: "FRONT" | "BACK";
  folder?: "santri" | "ustadz";
}): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    if (!isNativePlatform()) {
      return { success: false, error: "Kamera native hanya tersedia di aplikasi Android/iOS." };
    }

    // 1. Trigger native camera UI
    const photo = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: options.source === "CAMERA" ? CameraSource.Camera : CameraSource.Photos,
      direction: options.direction === "FRONT" ? CameraDirection.Front : CameraDirection.Rear
    });

    if (!photo.webPath) {
      return { success: false, error: "Tangkapan kamera kosong." };
    }

    // 2. Fetch the temporary file from the web path to get a Blob
    const response = await fetch(photo.webPath);
    const blob = await response.blob();
    const file = new File([blob], `photo_${Date.now()}.${photo.format}`, { type: blob.type });

    // 3. Prepare FormData for server-side upload
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", options.folder || "santri");

    // 4. Post to Next.js API upload endpoint
    const uploadResponse = await fetch("/api/upload", {
      method: "POST",
      body: formData
    });

    if (!uploadResponse.ok) {
      const errJson = await uploadResponse.json() as { error?: string };
      throw new Error(errJson.error || "Gagal mengunggah berkas ke server.");
    }

    const resJson = await uploadResponse.json() as { url: string };
    return { success: true, url: resJson.url };
  } catch (error: any) {
    console.error("Camera capture & upload failed:", error);
    return { success: false, error: error.message || "Gagal mengambil/mengunggah foto." };
  }
}
