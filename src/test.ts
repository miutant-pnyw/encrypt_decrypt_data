import * as crypto from 'crypto';

/**
 * Encrypt a string with AES-256-GCM
 * @param text - plaintext string to encrypt
 * @param key - AES key (32 bytes for AES-256)
 * @returns Base64 encoded string (iv + tag + ciphertext)
 */
export function encryptAES(text: string, key: Buffer): string {
  const iv = crypto.randomBytes(12); // 12 bytes recommended for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Return as Base64: iv + tag + ciphertext
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

/**
 * Decrypt a string encrypted with AES-256-GCM
 * @param encryptedBase64 - Base64 string from encryptAES
 * @param key - AES key (same as used in encryption)
 * @returns Decrypted string
 */
export function decryptAES(encryptedBase64: string, key: Buffer): string {
  const buffer = Buffer.from(encryptedBase64, 'base64');

  const iv = buffer.slice(0, 12);
  const tag = buffer.slice(12, 28);
  const encrypted = buffer.slice(28);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  return decipher.update(encrypted, undefined, 'utf8') + decipher.final('utf8');
}

// Generate random AES-256 key
const key = crypto.randomBytes(32);

const plaintext = 'Hello world!';
const encrypted = encryptAES(plaintext, key);
console.log('Encrypted:', encrypted);

const decrypted = decryptAES(encrypted, key);
console.log('Decrypted:', decrypted);

