import { z } from 'zod';
import { describe, expect, it } from 'vitest';
import { PASSWORD_MESSAGES } from './password';
import {
	checkboxSchema,
	currentPasswordSchema,
	emailSchema,
	newPasswordSchema,
	parseForm,
	safeNextPath
} from './validation';

describe('emailSchema', () => {
	it('trims and lower-cases, keeping +tags and dots', () => {
		expect(emailSchema.parse('  Jane.Doe+PS@Example.NHS.uk ')).toBe('jane.doe+ps@example.nhs.uk');
	});

	it.each(['', 'not-an-email', 'a@b', `${'a'.repeat(250)}@x.com`])('rejects %j', (value) => {
		expect(emailSchema.safeParse(value).success).toBe(false);
	});
});

describe('newPasswordSchema', () => {
	it('normalises and enforces length', () => {
		expect(newPasswordSchema.parse('ｃｏｒｒｅｃｔ horse battery')).toBe('correct horse battery');
		const short = newPasswordSchema.safeParse('fourteen chars');
		expect(short.success).toBe(false);
		expect(short.error?.issues[0].message).toBe(PASSWORD_MESSAGES.too_short);
		expect(newPasswordSchema.safeParse('a'.repeat(73)).error?.issues[0].message).toBe(
			PASSWORD_MESSAGES.too_long
		);
	});

	it('refuses huge input before normalising it', () => {
		expect(newPasswordSchema.safeParse('a'.repeat(5000)).success).toBe(false);
	});
});

describe('currentPasswordSchema', () => {
	it('normalises the same way, without policy checks', () => {
		expect(currentPasswordSchema.parse('café')).toBe('café');
		expect(currentPasswordSchema.parse('short')).toBe('short');
		expect(currentPasswordSchema.safeParse('').success).toBe(false);
	});
});

describe('checkboxSchema', () => {
	it('is true only when the box was ticked', () => {
		expect(checkboxSchema.parse('on')).toBe(true);
		expect(checkboxSchema.parse(undefined)).toBe(false);
		expect(checkboxSchema.parse('')).toBe(false);
	});
});

describe('safeNextPath', () => {
	it.each([
		['/annotate', '/annotate'],
		['/account?tab=sessions#top', '/account?tab=sessions#top'],
		['/a/../b', '/b']
	])('allows %j', (value, expected) => {
		expect(safeNextPath(value)).toBe(expected);
	});

	it.each([
		'https://evil.example/',
		'//evil.example',
		'/\\evil.example',
		'\\\\evil.example',
		'/\t/evil.example',
		'javascript:alert(1)',
		'annotate',
		'',
		null,
		42,
		`/${'a'.repeat(3000)}`
	])('refuses %j', (value) => {
		expect(safeNextPath(value)).toBeNull();
	});
});

describe('parseForm', () => {
	const schema = z.object({ email: emailSchema, password: currentPasswordSchema });

	it('returns parsed data', () => {
		const form = new FormData();
		form.set('email', ' A@Example.com ');
		form.set('password', 'secret');
		expect(parseForm(schema, form)).toEqual({
			ok: true,
			data: { email: 'a@example.com', password: 'secret' }
		});
	});

	it('returns one message per field and never echoes the input', () => {
		const form = new FormData();
		form.set('email', 'not-an-email');
		const result = parseForm(schema, form);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(Object.keys(result.fieldErrors).sort()).toEqual(['email', 'password']);
		expect(JSON.stringify(result)).not.toContain('not-an-email');
	});

	it('ignores files and repeated fields', () => {
		const form = new FormData();
		form.append('email', 'a@example.com');
		form.append('email', 'b@example.com');
		form.set('password', new Blob(['x']));
		const result = parseForm(schema, form);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(Object.keys(result.fieldErrors)).toEqual(['password']);
	});
});
