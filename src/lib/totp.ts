/**
 * TOTP generation via Web Crypto API (RFC 6238).
 * No external libraries — pure Web Crypto + manual Base32.
 */

const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Decode a Base32-encoded string to Uint8Array.
 */
export function base32Decode(input: string): Uint8Array {
  const cleaned = input.replace(/[\s=-]/g, "").toUpperCase();
  const bits: number[] = [];

  for (const char of cleaned) {
    const val = BASE32_CHARS.indexOf(char);
    if (val === -1) throw new Error(`Invalid Base32 character: ${char}`);
    // Each Base32 char represents 5 bits
    for (let i = 4; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  }

  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | bits[i * 8 + j];
    }
    bytes[i] = byte;
  }

  return bytes;
}

/**
 * Encode Uint8Array to Base32 string.
 */
export function base32Encode(input: Uint8Array): string {
  const bits: number[] = [];
  for (const byte of input) {
    for (let i = 7; i >= 0; i--) {
      bits.push((byte >> i) & 1);
    }
  }

  let result = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    let val = 0;
    for (let j = 0; j < 5; j++) {
      val = (val << 1) | bits[i + j];
    }
    result += BASE32_CHARS[val];
  }

  return result;
}

type TOTPAlgorithm = "SHA-1" | "SHA-256" | "SHA-512";

interface TOTPOptions {
  algorithm?: TOTPAlgorithm;
  digits?: 6 | 7 | 8;
  period?: number;
  timestamp?: number;
}

/**
 * Map TOTP algorithm names to Web Crypto HMAC hash names.
 */
function mapAlgorithm(alg: TOTPAlgorithm): string {
  switch (alg) {
    case "SHA-1":
      return "SHA-1";
    case "SHA-256":
      return "SHA-256";
    case "SHA-512":
      return "SHA-512";
    default:
      return "SHA-1";
  }
}

/**
 * Generate a TOTP code from a Base32-encoded secret.
 *
 * 1. base32Decode(secret) → bytes
 * 2. counter = floor(timestamp / period)
 * 3. HMAC(secretBytes, counterAs8Bytes) via Web Crypto
 * 4. Dynamic truncation → N-digit code
 */
export async function generateTOTP(
  secret: string,
  options?: TOTPOptions
): Promise<string> {
  const algorithm = options?.algorithm ?? "SHA-1";
  const digits = options?.digits ?? 6;
  const period = options?.period ?? 30;
  const timestamp = options?.timestamp ?? Math.floor(Date.now() / 1000);

  const secretBytes = base32Decode(secret);
  const counter = Math.floor(timestamp / period);

  // Convert counter to 8-byte big-endian buffer
  const counterBuffer = new ArrayBuffer(8);
  const counterView = new DataView(counterBuffer);
  // JavaScript numbers can handle up to 2^53, counter fits in 8 bytes
  counterView.setUint32(0, Math.floor(counter / 0x100000000));
  counterView.setUint32(4, counter & 0xffffffff);

  // Import secret as HMAC key
  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes.buffer as ArrayBuffer,
    { name: "HMAC", hash: mapAlgorithm(algorithm) },
    false,
    ["sign"]
  );

  // HMAC
  const hmacResult = await crypto.subtle.sign("HMAC", key, counterBuffer);
  const hmacBytes = new Uint8Array(hmacResult);

  // Dynamic truncation (RFC 4226 section 5.4)
  const offset = hmacBytes[hmacBytes.length - 1] & 0x0f;
  const code =
    ((hmacBytes[offset] & 0x7f) << 24) |
    ((hmacBytes[offset + 1] & 0xff) << 16) |
    ((hmacBytes[offset + 2] & 0xff) << 8) |
    (hmacBytes[offset + 3] & 0xff);

  const otp = (code % Math.pow(10, digits)).toString().padStart(digits, "0");
  return otp;
}

/**
 * Format a TOTP code with a space in the middle (e.g. "123 456").
 */
export function formatCode(code: string): string {
  const mid = Math.ceil(code.length / 2);
  return code.slice(0, mid) + " " + code.slice(mid);
}

/**
 * Get remaining seconds until the next TOTP period.
 */
export function getRemainingSeconds(period: number = 30): number {
  return period - (Math.floor(Date.now() / 1000) % period);
}

/**
 * Parse an otpauth:// URI into token parameters.
 */
export function parseOtpAuthUri(uri: string): {
  issuer: string;
  account: string;
  secret: string;
  algorithm: TOTPAlgorithm;
  digits: 6 | 7 | 8;
  period: number;
} {
  const url = new URL(uri);

  if (url.protocol !== "otpauth:") {
    throw new Error("Invalid otpauth URI");
  }

  if (url.host !== "totp") {
    throw new Error("Only TOTP is supported");
  }

  // Path format: /Issuer:account or /account
  const path = decodeURIComponent(url.pathname.slice(1)); // remove leading /
  let issuer = "";
  let account = path;

  if (path.includes(":")) {
    const colonIdx = path.indexOf(":");
    issuer = path.slice(0, colonIdx);
    account = path.slice(colonIdx + 1);
  }

  const params = url.searchParams;
  const secret = params.get("secret");
  if (!secret) throw new Error("Missing secret in otpauth URI");

  // Issuer from query overrides path-based issuer
  if (params.has("issuer")) {
    issuer = params.get("issuer")!;
  }

  const algorithmParam = (params.get("algorithm") || "SHA1").toUpperCase();
  let algorithm: TOTPAlgorithm = "SHA-1";
  if (algorithmParam === "SHA256") algorithm = "SHA-256";
  else if (algorithmParam === "SHA512") algorithm = "SHA-512";

  const digitsParam = parseInt(params.get("digits") || "6", 10);
  const digits = ([6, 7, 8].includes(digitsParam) ? digitsParam : 6) as
    | 6
    | 7
    | 8;

  const period = parseInt(params.get("period") || "30", 10);

  return { issuer, account, secret, algorithm, digits, period };
}

/**
 * Build an otpauth:// URI from token parameters.
 */
export function buildOtpAuthUri(token: {
  issuer: string;
  account: string;
  secret: string;
  algorithm: TOTPAlgorithm;
  digits: 6 | 7 | 8;
  period: number;
}): string {
  const label = token.issuer
    ? `${encodeURIComponent(token.issuer)}:${encodeURIComponent(token.account)}`
    : encodeURIComponent(token.account);

  const algorithmMap: Record<TOTPAlgorithm, string> = {
    "SHA-1": "SHA1",
    "SHA-256": "SHA256",
    "SHA-512": "SHA512",
  };

  const params = new URLSearchParams({
    secret: token.secret,
    issuer: token.issuer,
    algorithm: algorithmMap[token.algorithm],
    digits: String(token.digits),
    period: String(token.period),
  });

  return `otpauth://totp/${label}?${params.toString()}`;
}
