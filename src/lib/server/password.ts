import { createHash } from 'node:crypto';
import commonPasswordsText from './data/common-passwords.txt?raw';
import { log } from './log';

/**
 * Password policy (G5; auth-spec §1), following NIST SP 800-63B-4 and NCSC guidance.
 * One validator for sign-up, reset and change password.
 *
 * - NFKC-normalised first, so the same password typed on different devices matches. Sign-in
 *   normalises too (validation.ts), or a normalised password could never be entered again.
 * - At least 15 characters (Unicode code points), at most 72 bytes of UTF-8 (bcrypt's limit in
 *   Supabase Auth). No composition rules.
 * - Not built mostly from the user's email address or the app's name.
 * - Not breached: the HIBP range API (k-anonymity; only 5 hex characters of the SHA-1 leave the
 *   server, with `Add-Padding`), or the bundled common-password list if HIBP is unavailable.
 */
export const PASSWORD_MIN_CHARS = 15;
export const PASSWORD_MAX_BYTES = 72;
/** Applied before normalising, to bound work on hostile input. */
export const PASSWORD_MAX_INPUT_CHARS = 1024;

export const HIBP_RANGE_URL = 'https://api.pwnedpasswords.com/range/';
export const HIBP_TIMEOUT_MS = 2000;

/** Words that make a password guessable for this site, beyond the user's email address. */
export const APP_WORDS = ['postscriptmedical', 'postscript'];

/**
 * After removing spaces, the user's email, its parts and the app words, at least this many
 * characters must remain. So "postscriptpostscript!!" fails but "postscript is my
 * favourite app" passes.
 */
export const PERSONAL_REMAINDER_MIN = 10;

export type PasswordProblem = 'too_short' | 'too_long' | 'personal' | 'breached';

export const PASSWORD_MESSAGES: Record<PasswordProblem, string> = {
	too_short: `Use at least ${PASSWORD_MIN_CHARS} characters. Try three random words.`,
	too_long:
		'That password is too long. Use at most 72 characters (fewer if it has accents, symbols or emoji).',
	personal: "Don't build your password from your email address or the name of this site.",
	breached:
		'This password has appeared in a data breach, so it isn’t safe to use. Try three random words.'
};

export function normalizePassword(password: string): string {
	return password.normalize('NFKC');
}

export function charCount(text: string): number {
	return [...text].length;
}

export function byteCount(text: string): number {
	return new TextEncoder().encode(text).length;
}

/** Length rules on an already-normalised password. */
export function checkPasswordLength(password: string): 'too_short' | 'too_long' | null {
	if (charCount(password) < PASSWORD_MIN_CHARS) return 'too_short';
	if (byteCount(password) > PASSWORD_MAX_BYTES) return 'too_long';
	return null;
}

/** The email address, its local part, and the parts of that (split on . _ - +), lower-cased. */
function contextWords(email: string | undefined): string[] {
	const words = new Set(APP_WORDS);
	if (email) {
		const address = email.trim().toLowerCase().normalize('NFKC');
		const local = address.split('@')[0] ?? '';
		words.add(address);
		if (local.length >= 3) words.add(local);
		for (const part of local.split(/[._+-]+/)) if (part.length >= 3) words.add(part);
	}
	// Longest first, so the whole address goes before its parts.
	return [...words].sort((a, b) => b.length - a.length);
}

/** True when the password is mostly the user's email address or the app's name. */
export function isPersonal(password: string, email?: string): boolean {
	// Spaces are dropped first, so "PostScript Medical" matches `postscriptmedical`.
	let rest = password.toLowerCase().replace(/\s+/gu, '');
	const address = email?.trim().toLowerCase();
	if (address && rest.includes(address)) return true;
	for (const word of contextWords(email)) rest = rest.split(word).join('');
	return charCount(rest) < PERSONAL_REMAINDER_MIN;
}

let commonPasswords: Set<string> | undefined;

/** The bundled fallback list (NFKC, lower-case, 15+ characters; see data/README.md). */
export function isCommonPassword(password: string): boolean {
	commonPasswords ??= new Set(commonPasswordsText.split('\n').filter(Boolean));
	return commonPasswords.has(password.toLowerCase());
}

export function sha1Hex(text: string): string {
	return createHash('sha1').update(text, 'utf8').digest('hex').toUpperCase();
}

/** Whether `suffix` appears with a count above 0 in an HIBP range response (padding rows are 0). */
export function rangeContains(body: string, suffix: string): boolean {
	for (const line of body.split('\n')) {
		const [candidate, count] = line.trim().split(':');
		if (candidate?.toUpperCase() === suffix && Number(count) > 0) return true;
	}
	return false;
}

export type BreachCheck = { breached: boolean; source: 'hibp' | 'fallback' };

/**
 * HIBP range lookup with a 2 s timeout; on any failure, the bundled list. Never throws.
 * `fetchFn` is injectable for tests; no test calls the real API.
 */
export async function checkBreached(
	password: string,
	fetchFn: typeof fetch = fetch
): Promise<BreachCheck> {
	const hash = sha1Hex(password);
	const prefix = hash.slice(0, 5);
	const suffix = hash.slice(5);
	// The timeout covers the whole exchange, body included.
	const controller = new AbortController();
	const timer = setTimeout(
		() => controller.abort(new DOMException('HIBP timed out', 'TimeoutError')),
		HIBP_TIMEOUT_MS
	);
	try {
		const response = await fetchFn(HIBP_RANGE_URL + prefix, {
			headers: { 'Add-Padding': 'true', 'User-Agent': 'PostScript-annotation-app' },
			signal: controller.signal
		});
		if (!response.ok) throw new Error(`HIBP responded ${response.status}`);
		return { breached: rangeContains(await response.text(), suffix), source: 'hibp' };
	} catch (cause) {
		log.warn('hibp_unavailable', { code: 'HIBP_FALLBACK' }, cause);
		return { breached: isCommonPassword(password), source: 'fallback' };
	} finally {
		clearTimeout(timer);
	}
}

export type PasswordCheck =
	{ ok: true; password: string } | { ok: false; problem: PasswordProblem; message: string };

/**
 * The full check for a new password. Returns the normalised password to send to Supabase.
 * Cheap rules run first, so HIBP is only asked about passwords that pass them.
 */
export async function checkNewPassword(
	input: string,
	{ email, fetchFn }: { email?: string; fetchFn?: typeof fetch } = {}
): Promise<PasswordCheck> {
	const failure = (problem: PasswordProblem): PasswordCheck => ({
		ok: false,
		problem,
		message: PASSWORD_MESSAGES[problem]
	});
	if (charCount(input) > PASSWORD_MAX_INPUT_CHARS) return failure('too_long');
	const password = normalizePassword(input);
	const length = checkPasswordLength(password);
	if (length) return failure(length);
	if (isPersonal(password, email)) return failure('personal');
	const { breached } = await checkBreached(password, fetchFn);
	if (breached) return failure('breached');
	return { ok: true, password };
}
