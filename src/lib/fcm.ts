/**
 * FCM Push Notification Sender for Cloudflare Workers (Edge Runtime compatible)
 * Uses Web Crypto API (crypto.subtle) for JWT RS256 signing to obtain Google OAuth2 token.
 */

// Helper to convert array buffer to base64url string
function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

// Helper to convert string to base64url
function stringToBase64Url(str: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  let binary = "";
  for (let i = 0; i < data.byteLength; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

// Convert PEM PKCS#8 private key into ArrayBuffer
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const cleanPem = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  
  const binaryString = atob(cleanPem);
  const buffer = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    buffer[i] = binaryString.charCodeAt(i);
  }
  return buffer.buffer;
}

// Generate Google Access Token using Service Account JWT Assertion
async function getGoogleAccessToken(
  clientEmail: string,
  privateKeyPem: string
): Promise<string> {
  const tokenUri = "https://oauth2.googleapis.com/token";
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600; // 1 hour expiration

  const header = {
    alg: "RS256",
    typ: "JWT"
  };

  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: tokenUri,
    exp: exp,
    iat: iat
  };

  const headerBase64 = stringToBase64Url(JSON.stringify(header));
  const payloadBase64 = stringToBase64Url(JSON.stringify(payload));
  const jwtInput = `${headerBase64}.${payloadBase64}`;

  // Load private key
  const privateKeyBuffer = pemToArrayBuffer(privateKeyPem);
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyBuffer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: { name: "SHA-256" }
    },
    false,
    ["sign"]
  );

  // Sign JWT
  const encoder = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(jwtInput)
  );

  const signatureBase64 = arrayBufferToBase64Url(signatureBuffer);
  const assertion = `${jwtInput}.${signatureBase64}`;

  // Exchange JWT for Access Token
  const response = await fetch(tokenUri, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: assertion
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google OAuth token exchange failed: ${errorText}`);
  }

  const result = (await response.json()) as { access_token: string };
  return result.access_token;
}

export interface PushMessagePayload {
  token: string;
  notification: {
    title: string;
    body: string;
  };
  data?: Record<string, string>;
  android?: {
    notification?: {
      sound?: string;
      click_action?: string;
      notification_count?: number;
    };
  };
}

/**
 * Send push notification to a device token using Firebase v1 REST API
 */
export async function sendFcmMessage(payload: PushMessagePayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const clientEmail = process.env.FCM_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.FCM_PRIVATE_KEY;
  const projectId = process.env.FCM_PROJECT_ID;

  if (!clientEmail || !privateKey || !projectId) {
    console.warn("⚠️ FCM Skip: Firebase environment credentials are not configured.");
    return { success: false, error: "Firebase credentials not set in environment." };
  }

  try {
    // 1. Get access token
    const accessToken = await getGoogleAccessToken(clientEmail, privateKey);

    // 2. Send request to Firebase FCM v1 API
    const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: {
          token: payload.token,
          notification: payload.notification,
          data: payload.data,
          android: {
            priority: "high",
            notification: {
              sound: payload.android?.notification?.sound || "default",
              clickAction: payload.android?.notification?.click_action || "OPEN_ACTIVITY",
              ...payload.android?.notification
            }
          }
        }
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("FCM Send request failed:", errBody);
      return { success: false, error: errBody };
    }

    const resJson = (await response.json()) as { name: string };
    return { success: true, messageId: resJson.name };
  } catch (error: any) {
    console.error("FCM Send Exception:", error);
    return { success: false, error: error.message || "Unknown error during FCM delivery." };
  }
}
