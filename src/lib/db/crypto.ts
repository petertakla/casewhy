// Application-level encryption for sensitive columns (e.g. receipt numbers)
// at rest. AES-256-GCM: authenticated, so tampering with stored ciphertext
// is detected rather than silently decrypting to garbage.

import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // recommended nonce size for GCM

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("Missing required env var ENCRYPTION_KEY.");
  }
  const buf = Buffer.from(key, "base64");
  if (buf.length !== 32) {
    throw new Error("ENCRYPTION_KEY must decode to exactly 32 bytes (AES-256).");
  }
  return buf;
}

/** Encrypt a string for storage. Output is iv + authTag + ciphertext, base64-encoded. */
export function encryptField(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64");
}

/** Decrypt a value produced by encryptField(). Throws if the value is malformed or tampered with. */
export function decryptField(stored: string): string {
  const raw = Buffer.from(stored, "base64");
  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + 16);
  const ciphertext = raw.subarray(IV_LENGTH + 16);
  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
