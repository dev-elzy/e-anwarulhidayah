export interface UploadResult {
  secure_url: string;
  public_id: string;
}

async function generateSignature(params: Record<string, string>, secret: string): Promise<string> {
  const sortedKeys = Object.keys(params).sort();
  const sortedParams = sortedKeys.map((key) => `${key}=${params[key]}`).join("&");
  const stringToSign = `${sortedParams}${secret}`;

  const encoder = new TextEncoder();
  const data = encoder.encode(stringToSign);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function uploadImage(
  fileBuffer: ArrayBuffer,
  subFolder: "santri" | "ustadz" | "wali" | "pengumuman" | "pondok" | "profile"
): Promise<UploadResult> {
  // Baca env vars di dalam fungsi (bukan module scope) agar tersedia di Cloudflare Workers runtime
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  // Check file size (Max 5MB)
  const sizeInMB = fileBuffer.byteLength / (1024 * 1024);
  if (sizeInMB > 5) {
    throw new Error("Ukuran file gambar melebihi batas maksimal 5 MB.");
  }

  // Jika konfigurasi Cloudinary belum diisi (pengembangan lokal / offline)
  if (!cloudName || !apiKey || !apiSecret) {
    const base64 = Buffer.from(fileBuffer).toString("base64");
    return {
      secure_url: `data:image/jpeg;base64,${base64}`,
      public_id: `local_${Date.now()}`,
    };
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = `e-anwarulhidayah/${subFolder}`;
  const allowed_formats = "jpg,jpeg,png,webp";
  const transformation = "f_auto,q_auto,c_limit,h_1200,w_1200";

  const paramsToSign = {
    allowed_formats,
    folder,
    timestamp,
    transformation,
  };

  const signature = await generateSignature(paramsToSign, apiSecret);

  const formData = new FormData();
  formData.append("file", new Blob([fileBuffer]), "image.jpg");
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  formData.append("folder", folder);
  formData.append("allowed_formats", allowed_formats);
  formData.append("transformation", transformation);

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Cloudinary REST upload failed:", errorText);
    throw new Error("Gagal mengunggah gambar ke penyimpanan Cloudinary.");
  }

  const result = await response.json() as { secure_url?: string; public_id?: string };
  if (result && result.secure_url && result.public_id) {
    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
    };
  } else {
    throw new Error("Hasil upload Cloudinary kosong atau tidak valid.");
  }
}
