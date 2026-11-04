import { z } from 'zod';
import {
	PASSWORD_MAX_INPUT_CHARS,
	PASSWORD_MESSAGES,
	charCount,
	checkPasswordLength,
	normalizePassword
} from './password';

/**
 * Shared zod schemas for server input (every form action and endpoint validates with these).
 * Schemas check shape only. The breached-password and personal-word checks need the network and
 * the email, so actions run `checkNewPassword` (password.ts) after parsing.
 */

/** Trimmed and lower-cased only; `+tags` and dots are kept (auth-spec §4.1). */
export const emailSchema = z
	.string({ error: 'Enter your email address.' })
	.trim()
	.toLowerCase()
	.max(254, 'That email address is too long.')
	.pipe(z.email({ error: 'Enter a valid email address.' }));

/**
 * A new password (sign-up, reset, change): NFKC-normalised, then the length rules (G5).
 * The output is the normalised password.
 */
export const newPasswordSchema = z
	.string({ error: 'Enter a password.' })
	.refine((value) => charCount(value) <= PASSWORD_MAX_INPUT_CHARS, PASSWORD_MESSAGES.too_long)
	.transform(normalizePassword)
	.superRefine((password, ctx) => {
		const problem = checkPasswordLength(password);
		if (problem) ctx.addIssue({ code: 'custom', message: PASSWORD_MESSAGES[problem] });
	});

/**
 * An existing password (sign-in, current password, account deletion). No policy checks, since
 * it was set under whatever rules applied then, but normalised the same way it was stored.
 */
export const currentPasswordSchema = z
	.string({ error: 'Enter your password.' })
	.min(1, 'Enter your password.')
	.refine((value) => charCount(value) <= PASSWORD_MAX_INPUT_CHARS, 'Enter your password.')
	.transform(normalizePassword);

export const uuidSchema = z.uuid();

/** An HTML checkbox: present ("on") or absent. */
export const checkboxSchema = z
	.string()
	.optional()
	.transform((value) => value !== undefined && value !== '' && value !== 'off');

const BASE = 'https://placeholder.invalid';

/**
 * A `next` redirect target, limited to a path on this site (no scheme, no host, no `//` or
 * `/\`), so it can't become an open redirect. Anything else gives null; callers use a default.
 */
export function safeNextPath(value: unknown): string | null {
	if (typeof value !== 'string' || value.length === 0 || value.length > 2048) return null;
	if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return null;
	// eslint-disable-next-line no-control-regex
	if (/[\u0000-\u001f\u007f\\]/.test(value)) return null;
	let url: URL;
	try {
		url = new URL(value, BASE);
	} catch {
		return null;
	}
	if (url.origin !== BASE) return null;
	return url.pathname + url.search + url.hash;
}

export type ParseResult<T> =
	{ ok: true; data: T } | { ok: false; fieldErrors: Record<string, string> };

/**
 * Parses a form submission. Only string fields are read (files are ignored); one message per
 * field. Field errors never echo the submitted value.
 */
export function parseForm<S extends z.ZodType>(
	schema: S,
	formData: FormData
): ParseResult<z.output<S>> {
	const input: Record<string, string> = {};
	for (const [key, value] of formData) {
		if (typeof value === 'string' && !(key in input)) input[key] = value;
	}
	const result = schema.safeParse(input);
	if (result.success) return { ok: true, data: result.data };
	const fieldErrors: Record<string, string> = {};
	for (const issue of result.error.issues) {
		const field = String(issue.path[0] ?? 'form');
		fieldErrors[field] ??= issue.message;
	}
	return { ok: false, fieldErrors };
}
