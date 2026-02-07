import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';

export const PRIVATE_KEY = readFileSync(
	join(process.cwd(), 'key/private.pem'),
	'utf8',
);

export const PUBLIC_KEY = readFileSync(
	join(process.cwd(), 'key/public.pem'),
	'utf8',
);

@Injectable()
export class AppService {
	generateAESKey(): Buffer {
		// Generate random AES-256 key (32 bytes)
		return crypto.randomBytes(32);
	}

	encryptAES(payload: string, key: Buffer): string {
		const iv = crypto.randomBytes(12); // 12-byte IV for GCM
		// Create the AES-256-GCM cipher by AES key and IV
		const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

		// Encrypt payload
		const encrypted = Buffer.concat([cipher.update(payload, 'utf8'), cipher.final()]);

		// In case encrypt by GCM, create auth tag to verify when decrypt that data is not modified
		const tag = cipher.getAuthTag();

		// Combine and convert to base64
		// IV (12 bytes), auth tag (16 bytes), cipher text (N bytes)
		return Buffer.concat([iv, tag, encrypted]).toString('base64');
	}

	encryptAESKeyWithPrivateKey(aesKey: Buffer): string {
		const encryptedKey = crypto.privateEncrypt(PRIVATE_KEY, aesKey);
		return encryptedKey.toString('base64');
	}

	getEncryptData(payload: string): { data1: string, data2: string } {
		// Create AES key by Generate random string
		const aesKey = this.generateAESKey();

		// For data2, encrypt payload with AES key from step2.
		const data2: string = this.encryptAES(payload, aesKey)

		// For data1, encrypt key from step2 with private key
		const data1: string = this.encryptAESKeyWithPrivateKey(aesKey)

		return { data1, data2 }
	}

	decryptAESKeyWithPublicKey(encryptedAESKeyBase64: string): Buffer {
		const encryptedKey = Buffer.from(encryptedAESKeyBase64, 'base64');

		return crypto.publicDecrypt(PUBLIC_KEY, encryptedKey);
	}

	decryptAES(encryptedBase64: string, key: Buffer): string {
		const buffer = Buffer.from(encryptedBase64, 'base64');

		const iv = buffer.slice(0, 12);      // 12-byte IV
		const tag = buffer.slice(12, 28);    // 16-byte auth tag
		const encrypted = buffer.slice(28);  // ciphertext

		// Create AES-256-GCM decipher from AES key and iv
		const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);

		// Verify that data is not modified
		decipher.setAuthTag(tag);

		// Convert binary to UTF-8
		return decipher.update(encrypted, undefined, 'utf8') + decipher.final('utf8');
	}

	getDecryptData(data1: string, data2: string): { payload: string } {
		// Get AES Key, Decrypt data1 with public key
		const aesKey = this.decryptAESKeyWithPublicKey(data1);

		// Get Payload, Decrypt data2 with AES key from step2
		const payload = this.decryptAES(data2, aesKey);

		return { payload }
	}
}
