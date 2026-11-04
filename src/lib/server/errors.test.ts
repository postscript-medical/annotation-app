import { isActionFailure, isHttpError } from '@sveltejs/kit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	ERROR_CODES,
	actionFailure,
	failAndLog,
	httpError,
	messageFor,
	newRequestId,
	statusFor,
	toClientError
} from './errors';

afterEach(() => vi.restoreAllMocks());

describe('error codes', () => {
	it('every code has a status and a generic message', () => {
		for (const code of Object.values(ERROR_CODES)) {
			expect(statusFor(code)).toBeGreaterThanOrEqual(400);
			expect(messageFor(code).length).toBeGreaterThan(0);
		}
	});

	it('request ids are UUIDs', () => {
		expect(newRequestId()).toMatch(/^[0-9a-f-]{36}$/);
		expect(newRequestId()).not.toBe(newRequestId());
	});
});

describe('httpError', () => {
	it('throws a SvelteKit HTTP error with the code', () => {
		try {
			httpError('NOT_FOUND', 'req-1');
			expect.unreachable();
		} catch (thrown) {
			expect(isHttpError(thrown, 404)).toBe(true);
			if (!isHttpError(thrown)) return;
			expect(thrown.body).toMatchObject({
				message: messageFor('NOT_FOUND'),
				code: 'NOT_FOUND',
				requestId: 'req-1'
			});
		}
	});
});

describe('actionFailure', () => {
	it('returns a form failure with the code, message and extra data', () => {
		const failure = actionFailure('VALIDATION_FAILED', {
			fieldErrors: { email: 'Enter a valid email address.' },
			email: 'a@example.com'
		});
		expect(isActionFailure(failure)).toBe(true);
		expect(failure.status).toBe(400);
		expect(failure.data).toEqual({
			error: { code: 'VALIDATION_FAILED', message: messageFor('VALIDATION_FAILED') },
			fieldErrors: { email: 'Enter a valid email address.' },
			email: 'a@example.com'
		});
	});

	it('uses 429 for rate limits', () => {
		expect(actionFailure('RATE_LIMITED').status).toBe(429);
	});
});

describe('unexpected errors', () => {
	const cause = new Error('duplicate key value violates unique constraint "users_auth_id_key"');

	it('toClientError logs the detail and returns only a generic body', () => {
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const body = toClientError(cause, { requestId: 'req-9', route: '/annotate' });

		expect(body).toEqual({
			status: 500,
			message: messageFor('SERVER_ERROR'),
			code: 'SERVER_ERROR',
			requestId: 'req-9'
		});
		expect(JSON.stringify(body)).not.toContain('users_auth_id_key');
		expect(String(spy.mock.calls[0][0])).toContain('users_auth_id_key');
		expect(String(spy.mock.calls[0][0])).toContain('req-9');
	});

	it('failAndLog returns a failure with the request id, not the cause', () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const failure = failAndLog('choose_specialty_failed', cause, { requestId: 'req-3' });
		expect(failure.status).toBe(500);
		expect(failure.data).toEqual({
			error: {
				code: 'OPERATION_FAILED',
				message: messageFor('OPERATION_FAILED'),
				requestId: 'req-3'
			}
		});
	});
});
