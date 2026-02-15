import { argon2id } from "hash-wasm";
import type { VaultData } from "@/types/vault";

/**
 * Generate a random 16-byte salt for KDF.
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Convert Uint8Array to hex string.
 */
export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Convert hex string to Uint8Array.
 */
export function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Derive authKey and encryptionKey from password + salt.
 *
 * 1. Argon2id(password, salt, mem=64MB, iter=3, par=4) → masterKey (32 bytes)
 * 2. HKDF-SHA256(masterKey, info="auth") → authKey (32 bytes hex string)
 * 3. HKDF-SHA256(masterKey, info="encryption") → encryptionKey (CryptoKey)
 */
export async function deriveKeys(
  password: string,
  salt: Uint8Array
): Promise<{ authKey: string; encryptionKey: CryptoKey }> {
  // Step 1: Argon2id → master key (32 bytes)
  const masterKeyHex = await argon2id({
    password,
    salt,
    parallelism: 4,
    iterations: 3,
    memorySize: 65536, // 64 MB
    hashLength: 32,
    outputType: "hex",
  });

  const masterKeyBytes = fromHex(masterKeyHex);

  // Import master key for HKDF
  const masterCryptoKey = await crypto.subtle.importKey(
    "raw",
    masterKeyBytes.buffer as ArrayBuffer,
    "HKDF",
    false,
    ["deriveKey", "deriveBits"]
  );

  // Step 2: HKDF → authKey (32 bytes)
  const authKeyBits = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(0), // no salt for HKDF (salt is already in Argon2)
      info: new TextEncoder().encode("auth"),
    },
    masterCryptoKey,
    256 // 32 bytes
  );
  const authKey = toHex(new Uint8Array(authKeyBits));

  // Step 3: HKDF → encryptionKey (CryptoKey for AES-GCM)
  const encryptionKey = await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(0),
      info: new TextEncoder().encode("encryption"),
    },
    masterCryptoKey,
    { name: "AES-GCM", length: 256 },
    false, // not extractable
    ["encrypt", "decrypt"]
  );

  return { authKey, encryptionKey };
}

/**
 * Encrypt vault data with AES-256-GCM.
 * Returns base64-encoded encryptedData and iv.
 */
export async function encryptVault(
  data: VaultData,
  key: CryptoKey
): Promise<{ encryptedData: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(data));

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintext
  );

  return {
    encryptedData: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
  };
}

/**
 * Decrypt vault data with AES-256-GCM.
 * Takes base64-encoded encryptedData and iv.
 */
export async function decryptVault(
  encryptedData: string,
  iv: string,
  key: CryptoKey
): Promise<VaultData> {
  const ciphertextBuffer = base64ToArrayBuffer(encryptedData);
  const ivBuffer = base64ToArrayBuffer(iv);

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBuffer },
    key,
    ciphertextBuffer
  );

  return JSON.parse(new TextDecoder().decode(plaintext));
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
