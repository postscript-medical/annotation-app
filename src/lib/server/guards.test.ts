import { isRedirect, type RequestEvent } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';
import { load } from '../../routes/(app)/+layout.server';
import { requireUser, returnPath } from './guards';

const session = {
	id: '00000000-0000-4000-8000-000000000001',
	authId: '00000000-0000-4000-8000-000000000002',
	mode: 'personal' as const,
	amr: ['password'],
	recoveryVerifiedAt: null
};
const profile = {
	userId: '00000000-0000-4000-8000-000000000003',
	workspaceId: '00000000-0000-4000-8000-000000000004',
	workspaceRole: 'owner' as const
};

function event(
	path: string,
	locals: Partial<App.Locals> = { session: null, profile: null },
	method = 'GET'
) {
	const url = new URL(path, 'https://app.postscriptmedical.com');
	return {
		url,
		request: new Request(url, { method }),
		locals: locals as App.Locals
	} as RequestEvent;
}

/** The Location of the redirect `fn` throws. */
function redirectedTo(fn: () => unknown): string {
	try {
		fn();
	} catch (thrown) {
		if (isRedirect(thrown)) {
			expect(thrown.status).toBe(303);
			return thrown.location;
		}
		throw thrown;
	}
	throw new Error('expected a redirect');
}

describe('requireUser', () => {
	it('returns the session and profile when signed in', () => {
		expect(requireUser(event('/annotate', { session, profile }))).toEqual({ session, profile });
	});

	it('sends a signed-out visitor to sign in, remembering the page', () => {
		expect(redirectedTo(() => requireUser(event('/annotate')))).toBe('/sign-in?next=%2Fannotate');
		expect(redirectedTo(() => requireUser(event('/account?tab=sessions')))).toBe(
			'/sign-in?next=%2Faccount%3Ftab%3Dsessions'
		);
	});

	it('refuses a session without a profile, and a profile without a session', () => {
		expect(redirectedTo(() => requireUser(event('/annotate', { session, profile: null })))).toBe(
			'/sign-in?next=%2Fannotate'
		);
		expect(redirectedTo(() => requireUser(event('/annotate', { session: null, profile })))).toBe(
			'/sign-in?next=%2Fannotate'
		);
	});

	it('does not carry an action over to after sign-in', () => {
		expect(
			redirectedTo(() => requireUser(event('/annotate?/chooseSpecialty', undefined, 'POST')))
		).toBe('/sign-in?next=%2Fannotate');
	});

	it('omits next for the home page', () => {
		expect(redirectedTo(() => requireUser(event('/')))).toBe('/sign-in');
	});
});

describe('returnPath', () => {
	it('keeps only same-site paths', () => {
		expect(returnPath(event('/annotate'))).toBe('/annotate');
		// A path starting with `//` would be read as another host once used in a redirect: dropped.
		expect(returnPath(event('https://app.postscriptmedical.com//evil.example/x'))).toBeNull();
	});
});

describe('(app) layout', () => {
	it('redirects a signed-out visitor', () => {
		expect(redirectedTo(() => load(event('/annotate') as never))).toBe('/sign-in?next=%2Fannotate');
	});

	it('lets a signed-in user through and sends nothing about them to the page', () => {
		expect(load(event('/annotate', { session, profile }) as never)).toEqual({});
	});
});
