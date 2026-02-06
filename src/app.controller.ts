import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

type EncryptData = {
	data1: string;
	data2: string;
};
type GetEncryptDataResponse = {
	successful: boolean;
	error_code: string;
	data: EncryptData | null;
};

type DecryptData = {
	payload: string;
};
type GetDecryptDataResponse = {
	successful: boolean;
	error_code: string;
	data: DecryptData | null;
};

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Post('get-encrypt-data')
	@ApiBody({
		schema: {
		type: 'object',
		properties: {
			payload: { type: 'string', maxLength: 2000 },
		},
		required: ['payload'],
		},
	})
	@ApiResponse({
		status: 200,
		description: 'Successful encryption',
		schema: {
		type: 'object',
		properties: {
			successful: { type: 'boolean', example: true },
			error_code: { type: 'string', example: '' },
			data: {
			type: 'object',
			properties: {
				data1: { type: 'string', example: 'encrypted1' },
				data2: { type: 'string', example: 'encrypted2' },
			},
			},
		},
		},
	})
	@ApiResponse({
		status: 400,
		description: 'Validation failed (BadRequestException)',
		schema: {
		type: 'object',
		properties: {
			statusCode: { type: 'number', example: 400 },
			message: {
				type: 'array',
				items: { type: 'string' },
				example: [
					'payload must be a string',
					'payload cannot be empty',
					'payload must not exceed 2000 characters',
				],
			},
			error: { type: 'string', example: 'Bad Request' },
		},
		},
	})
	getEncryptData(@Body() body: any): GetEncryptDataResponse {
		const payload = body.payload

		// Validate payload
		if (typeof payload !== 'string') {
			throw new BadRequestException('payload must be a string');
		}

		if (payload.length === 0) {
			throw new BadRequestException('payload cannot be empty');
		}

		if (payload.length > 2000) {
			throw new BadRequestException('payload must not exceed 2000 characters');
		}

		try {
			const result = this.appService.getEncryptData(payload)

			return {
				successful: true,
				error_code: '',
				data: result,
			};
		} catch (err) {
			return {
				successful: false,
				error_code: 'ENCRYPTION_FAILED',
				data: null,
			};
		}
	}

	@Post('get-decrypt-data')
	@ApiBody({
		schema: {
		type: 'object',
		properties: {
			data1: { type: 'string' },
			data2: { type: 'string' },
		},
		required: ['payload'],
		},
	})
	@ApiResponse({
		status: 200,
		description: 'Successful decryption',
		schema: {
		type: 'object',
		properties: {
			successful: { type: 'boolean', example: true },
			error_code: { type: 'string', example: '' },
			data: {
			type: 'object',
				properties: {
					payload: { type: 'string', example: 'original text' },
				},
			},
		},
		},
	})
	@ApiResponse({
		status: 400,
		description: 'Validation failed (BadRequestException)',
		schema: {
		type: 'object',
		properties: {
			statusCode: { type: 'number', example: 400 },
			message: {
				type: 'array', 
				items: { type: 'string' }, 
				example: ['data1 is required', 'data1 is required']
			},
			error: { type: 'string', example: 'Bad Request' },
		},
		},
	})
	getDecryptData(@Body() body: { data1: string; data2: string }): GetDecryptDataResponse {
		const { data1, data2 } = body;

		// Validate data1, data2
		if (typeof data1 !== 'string') {
			throw new BadRequestException('data1 must be a string');
		} 

		if (typeof data2 !== 'string') {
			throw new BadRequestException('data2 must be a string');
		}

		try {
			const result = this.appService.getDecryptData(data1, data2)

			return {
				successful: true,
				error_code: '',
				data: result,
			};
		} catch (err) {
			return {
				successful: false,
				error_code: 'DECRYPTION_FAILED',
				data: null,
			};
		}
	}
}
