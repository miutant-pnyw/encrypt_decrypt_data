import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BadRequestException } from '@nestjs/common';

describe('AppController', () => {
	let appController: AppController;
	let appService: AppService;
	const getEncryptData = jest.fn()
	const getDecryptData = jest.fn()

	beforeEach(async () => {
		const app: TestingModule = await Test.createTestingModule({
			controllers: [AppController],
			providers: [
				{
					provide: AppService,
					useValue: {
						getEncryptData,
						getDecryptData,
					},
				},
			],
		}).compile();

		appController = app.get<AppController>(AppController);
		appService = app.get<AppService>(AppService);
	});

	describe('getEncryptData', () => {
		it('should throw BadRequestException if payload is not a string', () => {
			expect(() => appController.getEncryptData({ payload: 123 }))
			.toThrow(new BadRequestException('payload must be a string'));
		});

		it('should throw BadRequestException if payload is empty', () => {
			expect(() => appController.getEncryptData({ payload: '' }))
			.toThrow(new BadRequestException('payload cannot be empty'));
		});

		it('should throw BadRequestException if payload is exceed 2000 chars', () => {
			const text = 'a'.repeat(2001)
			expect(() => appController.getEncryptData({ payload: text }))
			.toThrow(new BadRequestException('payload must not exceed 2000 characters'));
		});

		it('should return success response when encrypt payload successfully', () => {
			const data1 = 'encryptedPayloadWithAESKey'
			const data2 = 'encryptedAESWithPrivateKey'
			getEncryptData.mockReturnValue({ data1, data2 });
			const result = appController.getEncryptData({ payload: 'hello' });

			expect(appService.getEncryptData).toHaveBeenCalledWith('hello');
			expect(result).toEqual({
				successful: true,
				error_code: '',
				data: { data1, data2 },
			});
		});

		it('should return failed response when encrypt failed', () => {
			getEncryptData.mockImplementation(() => { throw new Error('ERROR') });
			const result = appController.getEncryptData({ payload: 'hello' });

			expect(appService.getEncryptData).toHaveBeenCalledWith('hello');
			expect(result).toEqual({
				successful: false,
				error_code: 'ENCRYPTION_FAILED',
				data: null,
			});
		});
	});

	describe('getDecryptData', () => {
		it('should throw BadRequestException if data1 is not a string', () => {
			expect(() => appController.getDecryptData({ data1: 123 as any, data2: 'abc', }))
			.toThrow(new BadRequestException('data1 must be a string'));
		});

		it('should throw BadRequestException if data2 is not a string', () => {
			expect(() => appController.getDecryptData({ data1: 'abc', data2: 123 as any }))
			.toThrow(new BadRequestException('data2 must be a string'));
		});

		it('should return success response when decrypt payload successfully', () => {
			getDecryptData.mockReturnValue('hello');
			const data1 = 'encryptedPayloadWithAESKey'
			const data2 = 'encryptedAESWithPrivateKey'
			const result = appController.getDecryptData({ data1, data2 });

			expect(appService.getDecryptData).toHaveBeenCalledWith( data1, data2 );
			expect(result).toEqual({
				successful: true,
				error_code: '',
				data: 'hello',
			});
		});

		it('should return failed response when encrypt failed', () => {
			getDecryptData.mockImplementation(() => { throw new Error('ERROR') });
			const data1 = 'encryptedPayloadWithAESKey'
			const data2 = 'encryptedAESWithPrivateKey'
			const result = appController.getDecryptData({ data1, data2 });

			expect(appService.getDecryptData).toHaveBeenCalledWith( data1, data2 );
			expect(result).toEqual({
				successful: false,
				error_code: 'DECRYPTION_FAILED',
				data: null,
			});
		});
	})
});
