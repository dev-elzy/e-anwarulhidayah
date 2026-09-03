/**
 * Utilitas kriptografi — menggunakan Web Crypto API (kompatibel dengan Cloudflare Workers)
 *
 * PBKDF2 dipilih karena:
 * - Native di Web Crypto API (tanpa library eksternal)
 * - Mendukung salt unik per password (mencegah rainbow table attack)
 * - 100.000 iterasi → memperlambat brute force
 *
 * Format hash: "<saltHex>:<derivedKeyHex>"
 *
 * ⚠️ MIGRASI: Hash lama (format SHA-256, 64 karakter hex tanpa ":") masih
 * didukung via verifyPassword untuk backward-compatibility. Setelah semua
 * user login dan password di-rehash, bisa dihapus blok legacy-nya.
 */

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEY_LENGTH = 256; // bits
const SALT_BYTES = 16;

export async function hashPassword(password: string): Promise<string> {
  // Generate salt acak unik per password
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');

  // Import password sebagai key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // Derive key menggunakan PBKDF2-SHA256
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    PBKDF2_KEY_LENGTH
  );

  const hashHex = Array.from(new Uint8Array(derived)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // Deteksi format lama (SHA-256 tanpa salt — 64 karakter hex tanpa ":")
  if (!storedHash.includes(':')) {
    // Legacy fallback: verifikasi dengan SHA-256 lama
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const legacyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return legacyHash === storedHash;
  }

  // Format baru: "<saltHex>:<derivedKeyHex>"
  const [saltHex, expectedHashHex] = storedHash.split(':');
  if (!saltHex || !expectedHashHex) return false;

  // Decode salt dari hex
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));

  // Import password dan derive ulang
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    PBKDF2_KEY_LENGTH
  );

  const computedHex = Array.from(new Uint8Array(derived)).map(b => b.toString(16).padStart(2, '0')).join('');
  return computedHex === expectedHashHex;
}
