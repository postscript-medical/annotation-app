import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	HIBP_RANGE_URL,
	PASSWORD_MESSAGES,
	byteCount,
	checkBreached,
	checkNewPassword,
	checkPasswordLength,
	isCommonPassword,
	isPersonal,
	normalizePassword,
	rangeContains,
	sha1Hex
} from './password';

// A password that passes the length and personal-word rules.
const GOOD = 'correct horse battery staple';

/** A fake HIBP that answers with the given suffix lines and records what it was asked. */
function fakeHibp(lines: (password: string) => string[], status = 200) {
	const calls: { url: string; init?: RequestInit }[] = [];
	const fetchFn = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
		calls.push({ url: String(url), init });
		return new Response(status === 200 ? lines('').join('\r\n') : 'error', { status });
	}) as unknown as typeof fetch;
	return { fetchFn, calls };
}

function suffixOf(password: string) {
	return sha1Hex(normalizePassword(password)).slice(5);
}

afterEach(() => vi.restoreAllMocks());

describe('length rules', () => {
	it('rejects 14 characters and accepts 15', () => {
		expect(checkPasswordLength('a'.repeat(14))).toBe('too_short');
		expect(checkPasswordLength('a'.repeat(15))).toBeNull();
	});

	it('counts code points, not UTF-16 units', () => {
		// 15 emoji: 15 characters, 60 bytes.
		expect(checkPasswordLength('😀'.repeat(15))).toBeNull();
		// 14 emoji are 28 UTF-16 units but only 14 characters.
		expect(checkPasswordLength('😀'.repeat(14))).toBe('too_short');
	});

	it('limits UTF-8 bytes to 72 (bcrypt)', () => {
		expect(checkPasswordLength('a'.repeat(72))).toBeNull();
		expect(checkPasswordLength('a'.repeat(73))).toBe('too_long');
		expect(byteCount('😀'.repeat(18))).toBe(72);
		expect(checkPasswordLength('😀'.repeat(18))).toBeNull();
		expect(checkPasswordLength('😀'.repeat(19))).toBe('too_long');
	});
});

describe('NFKC normalisation', () => {
	it('makes composed and decomposed accents equal', () => {
		const composed = 'café au lait every morning';
		const decomposed = 'café au lait every morning';
		expect(composed).not.toBe(decomposed);
		expect(normalizePassword(composed)).toBe(normalizePassword(decomposed));
	});

	it('folds compatibility characters such as full-width letters', () => {
		expect(normalizePassword('ｃｏｒｒｅｃｔ horse')).toBe('correct horse');
	});

	it('returns the normalised password from the full check', async () => {
		const { fetchFn } = fakeHibp(() => []);
		const result = await checkNewPassword('ｃｏｒｒｅｃｔ horse battery staple', { fetchFn });
		expect(result).toEqual({ ok: true, password: 'correct horse battery staple' });
	});

	it('counts length after normalising', async () => {
		// U+FB01 (ﬁ ligature) is one character that NFKC expands to two ("fi").
		expect(checkPasswordLength(normalizePassword('ﬁ'.repeat(8)))).toBeNull();
	});
});

describe('personal words', () => {
	const email = 'john.smith@nhs.net';

	it('rejects the email address as the password, in any case', () => {
		expect(isPersonal('john.smith@nhs.net', email)).toBe(true);
		expect(isPersonal('JOHN.SMITH@NHS.NET', email)).toBe(true);
	});

	it('rejects a password that contains the whole email address', () => {
		expect(isPersonal('my login is john.smith@nhs.net', email)).toBe(true);
	});

	it('rejects passwords built from the email parts or app words', () => {
		expect(isPersonal('johnsmith johnsmith', email)).toBe(true);
		expect(isPersonal('postscriptpostscript!!')).toBe(true);
		expect(isPersonal('PostScript Medical 2026')).toBe(true);
	});

	it('accepts passphrases that merely include one of those words', () => {
		expect(isPersonal('smith family holiday in crete', email)).toBe(false);
		expect(isPersonal('postscript is my favourite app')).toBe(false);
	});

	it('is reported with its own message', async () => {
		const { fetchFn } = fakeHibp(() => []);
		const result = await checkNewPassword('john.smith@nhs.net', { email, fetchFn });
		expect(result).toEqual({
			ok: false,
			problem: 'personal',
			message: PASSWORD_MESSAGES.personal
		});
	});
});

describe('HIBP range check', () => {
	it('sends only the 5-character hash prefix, with Add-Padding', async () => {
		const { fetchFn, calls } = fakeHibp(() => []);
		await checkBreached(GOOD, fetchFn);

		const hash = sha1Hex(GOOD);
		expect(calls).toHaveLength(1);
		expect(calls[0].url).toBe(HIBP_RANGE_URL + hash.slice(0, 5));
		expect(calls[0].url).not.toContain(hash.slice(5));
		expect(calls[0].url).not.toContain(GOOD);
		expect(new Headers(calls[0].init?.headers).get('Add-Padding')).toBe('true');
		expect(calls[0].init?.signal).toBeInstanceOf(AbortSignal);
	});

	it('reports a hit', async () => {
		const suffix = suffixOf(GOOD);
		const { fetchFn } = fakeHibp(() => ['0018A45C4D1DEF81644B54AB7F969B88D65:1', `${suffix}:42`]);
		expect(await checkBreached(GOOD, fetchFn)).toEqual({ breached: true, source: 'hibp' });

		const result = await checkNewPassword(GOOD, { fetchFn });
		expect(result).toEqual({
			ok: false,
			problem: 'breached',
			message: PASSWORD_MESSAGES.breached
		});
	});

	it('reports a miss', async () => {
		const { fetchFn } = fakeHibp(() => ['0018A45C4D1DEF81644B54AB7F969B88D65:1']);
		expect(await checkBreached(GOOD, fetchFn)).toEqual({ breached: false, source: 'hibp' });
	});

	it('ignores padding rows (count 0)', () => {
		const suffix = suffixOf(GOOD);
		expect(rangeContains(`${suffix}:0\r\nABC:3`, suffix)).toBe(false);
		expect(rangeContains(`${suffix.toLowerCase()}:3`, suffix)).toBe(true);
	});

	it('is not asked about passwords that fail the cheaper rules', async () => {
		const { fetchFn, calls } = fakeHibp(() => []);
		await checkNewPassword('too short', { fetchFn });
		await checkNewPassword('postscriptpostscript', { fetchFn });
		expect(calls).toHaveLength(0);
	});
});

describe('fallback when HIBP is unavailable', () => {
	const common = '1q2w3e4r5t6y7u8i'; // in data/common-passwords.txt

	it('the bundled list holds long common passwords, case-insensitively', () => {
		expect(isCommonPassword(common)).toBe(true);
		expect(isCommonPassword(common.toUpperCase())).toBe(true);
		expect(isCommonPassword(GOOD)).toBe(false);
	});

	it('falls back on a timeout', async () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const timeout = vi.fn(async () => {
			throw new DOMException('The operation timed out.', 'TimeoutError');
		}) as unknown as typeof fetch;

		expect(await checkBreached(common, timeout)).toEqual({ breached: true, source: 'fallback' });
		expect(await checkBreached(GOOD, timeout)).toEqual({ breached: false, source: 'fallback' });
		expect(console.warn).toHaveBeenCalled();
	});

	it('aborts a slow HIBP after 2 seconds', async () => {
		vi.useFakeTimers();
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const hanging = vi.fn(
			(_url: string, init?: RequestInit) =>
				new Promise<Response>((_resolve, reject) => {
					init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
				})
		) as unknown as typeof fetch;

		const pending = checkBreached(common, hanging);
		await vi.advanceTimersByTimeAsync(1999);
		let settled = false;
		void pending.then(() => (settled = true));
		await Promise.resolve();
		expect(settled).toBe(false);
		await vi.advanceTimersByTimeAsync(1);
		expect(await pending).toEqual({ breached: true, source: 'fallback' });
		vi.useRealTimers();
	});

	it('falls back on an HTTP error', async () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { fetchFn } = fakeHibp(() => [], 503);
		expect(await checkBreached(common, fetchFn)).toEqual({ breached: true, source: 'fallback' });
	});

	it('the warning names no password or hash', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { fetchFn } = fakeHibp(() => [], 503);
		await checkBreached(GOOD, fetchFn);
		const logged = warn.mock.calls.flat().join(' ');
		expect(logged).not.toContain(GOOD);
		expect(logged).not.toContain(sha1Hex(GOOD).slice(0, 5));
	});
});
