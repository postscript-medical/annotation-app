import { error, fail } from '@sveltejs/kit';
import { log, type LogFields } from './log';

/**
 * Error codes and generic client messages (port of legacy functions/utils/error-handler.js).
 *
 * Clients get a stable code, a generic message and, for unexpected errors, a request id to quote
 * to support. Details stay in the server log. The legacy organisation, team and permission codes
 * are gone with organisations and staff roles.
 */
export const ERROR_CODES = {
	AUTH_REQUIRED: 'AUTH_REQUIRED',
	SESSION_EXPIRED: 'SESSION_EXPIRED',
	INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
	LINK_INVALID: 'LINK_INVALID',
	NOT_FOUND: 'NOT_FOUND',
	VALIDATION_FAILED: 'VALIDATION_FAILED',
	RATE_LIMITED: 'RATE_LIMITED',
	OPERATION_FAILED: 'OPERATION_FAILED',
	SERVER_ERROR: 'SERVER_ERROR'
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

const DETAILS: Record<ErrorCode, { status: number; message: string }> = {
	AUTH_REQUIRED: { status: 401, message: 'Please sign in to continue.' },
	SESSION_EXPIRED: { status: 401, message: 'Your session has ended. Please sign in again.' },
	INVALID_CREDENTIALS: {
		status: 400,
		message: "That email address and password don't match an account."
	},
	LINK_INVALID: {
		status: 400,
		message: 'This link has expired or has already been used. Please ask for a new one.'
	},
	// Also used for things that exist but belong to someone else, so ids can't be probed.
	NOT_FOUND: { status: 404, message: "We couldn't find that page." },
	VALIDATION_FAILED: { status: 400, message: 'Please check the highlighted fields.' },
	RATE_LIMITED: { status: 429, message: 'Too many attempts. Please wait a while and try again.' },
	OPERATION_FAILED: { status: 500, message: "That didn't work. Please try again." },
	SERVER_ERROR: { status: 500, message: 'Something went wrong on our side. Please try again.' }
};

export function statusFor(code: ErrorCode): number {
	return DETAILS[code].status;
}

export function messageFor(code: ErrorCode): string {
	return DETAILS[code].message;
}

export function newRequestId(): string {
	return crypto.randomUUID();
}

/** Throws a SvelteKit HTTP error with the code's status and generic message. */
export function httpError(code: ErrorCode, requestId?: string): never {
	error(statusFor(code), messageFor(code), requestId ? { code, requestId } : { code });
}

/** The body a failed form action returns: `return actionFailure('VALIDATION_FAILED', {...})`. */
export type FailureBody<T extends Record<string, unknown> = Record<string, never>> = {
	error: { code: ErrorCode; message: string; requestId?: string };
} & T;

/**
 * A form-action failure. `extra` carries data for the form, such as field errors or the email
 * to re-fill; never a password.
 */
export function actionFailure<T extends Record<string, unknown> = Record<string, never>>(
	code: ErrorCode,
	extra?: T,
	requestId?: string
) {
	const body = {
		error: { code, message: messageFor(code), ...(requestId ? { requestId } : {}) },
		...(extra ?? {})
	} as FailureBody<T>;
	return fail(statusFor(code), body);
}

/**
 * Logs an operation that failed unexpectedly and returns the failure to show the user, with a
 * request id they can quote. For form actions; unexpected throws go through `handleError`.
 */
export function failAndLog(
	event: string,
	cause: unknown,
	fields: LogFields & { requestId: string }
) {
	log.error(event, cause, { ...fields, code: ERROR_CODES.OPERATION_FAILED });
	return actionFailure(ERROR_CODES.OPERATION_FAILED, undefined, fields.requestId);
}

/**
 * For `handleError` in hooks.server.ts (1.8): logs an unexpected error and returns the generic
 * body the client sees. Nothing from the error itself reaches the client.
 */
export function toClientError(
	cause: unknown,
	fields: LogFields & { requestId: string }
): App.Error {
	log.error('unexpected_error', cause, { ...fields, code: ERROR_CODES.SERVER_ERROR });
	return {
		status: fields.status ?? 500,
		message: messageFor(ERROR_CODES.SERVER_ERROR),
		code: ERROR_CODES.SERVER_ERROR,
		requestId: fields.requestId
	};
}
