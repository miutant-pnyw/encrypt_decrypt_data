import { AppService } from './app.service';
import * as crypto from 'crypto';

jest.mock('crypto', () => ({
	...jest.requireActual('crypto'),
	randomBytes:jest.fn(),
	publicDecrypt: jest.fn(),
	privateEncrypt: jest.fn(),
	createCipheriv: jest.fn(),
	createDecipheriv: jest.fn(),
}));

describe('AppService', () => {
	let appService: AppService;

	beforeEach(() => {
		appService = new AppService();
		jest.clearAllMocks();
	});

	describe('generateAESKey', () => {
		it('should return a 32-byte AES key', () => {
			(crypto.randomBytes as jest.Mock).mockReturnValue(Buffer.from('a'.repeat(32)));
			const key = appService.generateAESKey();

			expect(crypto.randomBytes).toHaveBeenCalledWith(32)
			expect(key.length).toBe(32);
		});
	})

	describe('encryptAES', () => {
		it('should return base64 encrypt payload with vi, authTag, payload', () => {
			const payload = 'hello world';
			const key = Buffer.from('a'.repeat(32))
			const mockIv = Buffer.from('a'.repeat(12))
			const mockEncrypted = Buffer.from('encryptedPayloadWithAESKey')
			const mockTag = Buffer.from('a'.repeat(16))
			const cipher = {
				update: jest.fn().mockReturnValue(mockEncrypted),
				final: jest.fn().mockReturnValue(Buffer.alloc(0)),
				getAuthTag: jest.fn().mockReturnValue(mockTag),
			};
			(crypto.createCipheriv as jest.Mock).mockReturnValue(cipher);
			(crypto.randomBytes as jest.Mock).mockReturnValue(mockIv);

			const result = appService.encryptAES(payload, key);
			const buffer = Buffer.concat([mockIv, mockTag, mockEncrypted]).toString('base64');

			expect(crypto.createCipheriv).toHaveBeenCalledWith('aes-256-gcm', key, mockIv)
			expect(cipher.update).toHaveBeenCalledWith(payload, 'utf8')
			expect(cipher.final).toHaveBeenCalled()
			expect(cipher.getAuthTag).toHaveBeenCalled()
			expect(result).toEqual(buffer)
		});
	})

	describe('encryptAESKeyWithPrivateKey', () => {
		it('should return encrypt AES key with private key', () => {
			const encryptedAESKeyBase64 = 'encryptedAESWithPrivateKey';
			(crypto.privateEncrypt as jest.Mock).mockReturnValue(encryptedAESKeyBase64);

			const key = crypto.randomBytes(32);
			const result = appService.encryptAESKeyWithPrivateKey(key);

			expect(result).toEqual(encryptedAESKeyBase64)
		});
	})

	describe('getEncryptData', () => {
		const data1 = 'encryptedPayloadWithAESKey'
		const data2 = 'encryptedAESWithPrivateKey'
		beforeEach(() => {
			appService.generateAESKey = jest.fn()
			appService.encryptAES = jest.fn().mockReturnValue(data2)
			appService.encryptAESKeyWithPrivateKey = jest.fn().mockReturnValue(data1)
		});

		it('should return encrypted data', () => {
			const payload = 'hello'
			const result = appService.getEncryptData(payload);

			expect(result).toEqual({ data1, data2 })
		})
	})

	describe('decryptAESKeyWithPublicKey', () => {
		it('should return decrypt AES key with public key', () => {
			const key = crypto.randomBytes(32);
			(crypto.publicDecrypt as jest.Mock).mockReturnValue(key);

			const encryptedAESKeyBase64 = 'encryptedAESWithPrivateKey'
			const result = appService.decryptAESKeyWithPublicKey(encryptedAESKeyBase64);

			expect(result).toEqual(key)
		});
	})

	describe('decryptAES', () => {
		it('should return decrypted data', () => {
			const mockDecrypted = 'hello'
			const decipher = {
				update: jest.fn().mockReturnValue(mockDecrypted),
				final: jest.fn().mockReturnValue(Buffer.alloc(0)),
				setAuthTag: jest.fn(),
			};
			(crypto.createDecipheriv as jest.Mock).mockReturnValue(decipher);

			const encryptedBase64 = 'encryptedPayloadWithAESKey'
			const key = Buffer.from('a'.repeat(32))
			const result = appService.decryptAES(encryptedBase64, key);

			expect(result).toEqual(mockDecrypted)
		})
	})

	describe('getDecryptData', () => {
		const key = Buffer.from('a'.repeat(32))
		beforeEach(() => {
			appService.decryptAESKeyWithPublicKey = jest.fn().mockReturnValue(key)
			appService.decryptAES = jest.fn().mockReturnValue('hello')
		});

		it('should return decrypted data', () => {
			const data1 = 'encryptedPayloadWithAESKey'
			const data2 = 'encryptedAESWithPrivateKey'
			const result = appService.getDecryptData(data1, data2);

			expect(appService.decryptAESKeyWithPublicKey).toHaveBeenCalledWith(data1)
			expect(appService.decryptAES).toHaveBeenCalledWith(data2, key)
			expect(result).toEqual({ payload: 'hello'})
		})
	})
});
