import { isActionFailure } from '@sveltejs/kit';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { actions } from '../../src/routes/(app)/annotate/+page.server';
import { rateLimiter } from '../../src/lib/server/rate-limit';
import { flowHelpers, redirectTo } from './flow-helpers';
import { adminClient, ensureAccount, env, sqlClient } from './helpers';
import { Jar, requestHelpers } from './request-helpers';

// `?/feedback` (2.6) behind the real hook, sending to the local Mailpit over SMTP.

// Real sending by default; a test can make the SMTP send fail.
const smtp = vi.hoisted(() => ({ fail: false }));
vi.mock('../../src/lib/server/email', async (importOriginal) => {
	const original = await importOriginal<typeof import('../../src/lib/server/email')>();
	return {
		...original,
		sendMail: async (...args: Parameters<typeof original.sendMail>) => {
			if (smtp.fail) throw new Error('SMTP refused the message');
			return original.sendMail(...args);
		}
	};
});

const admin = adminClient();
const sql = sqlClient();
const created: string[] = [];
const { signedInJar, addPolicy } = requestHelpers(admin, sql, created);
const { call } = flowHelpers(admin, sql, created, 'feedback');

afterEach(() => {
	smtp.fail = false;
});
afterAll(async () => {
	for (const id of created) await admin.auth.admin.deleteUser(id).catch(() => {});
	await sql.end();
});

async function me() {
	const signedIn = await signedInJar();
	const user = await ensureAccount(admin, signedIn.authId);
	await addPolicy(user.id, signedIn.sessionId, 'personal', '1 hour', '1 minute');
	const { data } = await admin.auth.admin.getUserById(signedIn.authId);
	return { jar: signedIn.jar, userId: user.id, email: data.user!.email! };
}

function send(jar: Jar, message: string) {
	return call(jar, '/annotate?/feedback', actions.feedback as never, { message });
}

type MailpitMessage = {
	Subject: string;
	Text: string;
	HTML: string;
	From: { Address: string; Name: string };
	To: { Address: string }[];
	ReplyTo: { Address: string }[];
};

async function mailpitSearch(query: string) {
	const search = await fetch(
		`${env.mailpitUrl}/api/v1/search?query=${encodeURIComponent(query)}`
	).then((r) => r.json());
	return (search.messages ?? []) as { ID: string }[];
}

/** The one feedback email containing `marker`, waiting for it to arrive. */
async function feedbackEmail(marker: string): Promise<MailpitMessage> {
	for (let attempt = 0; attempt < 40; attempt++) {
		const [found] = await mailpitSearch(`"${marker}"`);
		if (found) return fetch(`${env.mailpitUrl}/api/v1/message/${found.ID}`).then((r) => r.json());
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
	throw new Error(`no feedback email containing ${marker}`);
}

function failure(result: unknown) {
	expect(isActionFailure(result), 'an action failure').toBe(true);
	return result as {
		status: number;
		data: { error: { code: string; requestId?: string }; fieldErrors?: Record<string, string> };
	};
}

describe('?/feedback', () => {
	it('emails staff, replying to the account, with the message escaped in HTML', async () => {
		const user = await me();
		const marker = `marker-${crypto.randomUUID()}`;

		const { result, thrown } = await send(
			user.jar,
			`  ${marker} <b>bold</b> & "quoted"\nsecond line  `
		);

		expect(thrown).toBeUndefined();
		expect(result).toEqual({ sent: true });
		const mail = await feedbackEmail(marker);
		expect(mail.To.map((to) => to.Address)).toEqual(['feedback@example.com']);
		expect(mail.From).toEqual({ Name: 'PostScript', Address: 'no-reply@postscriptmedical.com' });
		expect(mail.ReplyTo.map((to) => to.Address)).toEqual([user.email]);
		expect(mail.Subject).toBe('[PostScript] Feedback');
		expect(mail.HTML).toContain(
			`${marker} &lt;b&gt;bold&lt;/b&gt; &amp; &quot;quoted&quot;<br>second line`
		);
		expect(mail.HTML).not.toContain('<b>bold</b>');
		// Trimmed, as typed otherwise (SMTP sends line breaks as CRLF).
		expect(mail.Text.replaceAll('\r\n', '\n')).toContain(
			`${marker} <b>bold</b> & "quoted"\nsecond line\n`
		);
	});

	it.each([
		['an empty message', '', 'Please write a message.'],
		['only spaces', '   \n  ', 'Please write a message.'],
		['a message over 5,000 characters', 'x'.repeat(5001), 'Please keep it under 5,000 characters.']
	])('refuses %s, sending nothing and not counting it', async (_label, message, fieldError) => {
		const user = await me();

		const outcome = failure((await send(user.jar, message)).result);

		expect(outcome.status).toBe(400);
		expect(outcome.data.fieldErrors?.message).toBe(fieldError);
		expect(await rateLimiter().count('feedbackUser', user.userId)).toBe(0);
	});

	it('accepts exactly 5,000 characters', async () => {
		const user = await me();
		const marker = `marker-${crypto.randomUUID()}`;

		const { result } = await send(user.jar, marker + 'y'.repeat(5000 - marker.length));

		expect(result).toEqual({ sent: true });
	});

	it('allows 5 messages a day per user, then refuses without sending', async () => {
		const user = await me();
		const other = await me();
		const run = crypto.randomUUID();

		for (let n = 1; n <= 5; n++) {
			expect((await send(user.jar, `limit-${run} number ${n}`)).result).toEqual({ sent: true });
		}
		const sixth = failure((await send(user.jar, `limit-${run} number 6`)).result);

		expect(sixth.status).toBe(429);
		expect(sixth.data.error.code).toBe('RATE_LIMITED');
		await feedbackEmail(`limit-${run} number 5`);
		expect(await mailpitSearch(`"limit-${run} number 6"`)).toEqual([]);
		// Per user: someone else can still write.
		expect((await send(other.jar, `limit-${run} other`)).result).toEqual({ sent: true });
	});

	it('a failed send is logged and reported with a reference, and still counts', async () => {
		const user = await me();
		smtp.fail = true;

		const outcome = failure((await send(user.jar, 'this will not arrive')).result);

		expect(outcome.status).toBe(500);
		expect(outcome.data.error.code).toBe('OPERATION_FAILED');
		expect(outcome.data.error.requestId).toMatch(/^[0-9a-f-]{36}$/);
		expect(await rateLimiter().count('feedbackUser', user.userId)).toBe(1);
	});

	it('sends a signed-out caller to sign in', async () => {
		const outcome = await send(new Jar(), 'hello');

		expect(redirectTo(outcome)).toBe('/sign-in?next=%2Fannotate');
	});
});
