import { describe, expect, it, vi } from 'vitest';
import { feedbackOutcome, postAction, saveOutcome } from './post-action';

const selection = { specialtyId: 's', subSpecialtyId: 'ss', illustrationId: null };

describe('postAction', () => {
	it('posts the fields to the named action as SvelteKit expects', async () => {
		// The answer is parsed by SvelteKit's client runtime, which unit tests don't have; the browser
		// check and E2E cover it.
		const fetcher = vi.fn<typeof fetch>(async () => new Response('{}'));

		await postAction('chooseSpecialty', { specialtyId: 'abc' }, fetcher);

		const [url, init] = fetcher.mock.calls[0];
		expect(url).toBe('?/chooseSpecialty');
		expect(init?.method).toBe('POST');
		expect((init?.body as FormData).get('specialtyId')).toBe('abc');
		expect(new Headers(init?.headers).get('x-sveltekit-action')).toBe('true');
	});

	it('turns a network failure into network_error', async () => {
		const fetcher = vi.fn(async () => {
			throw new TypeError('offline');
		});

		expect(await postAction('chooseSpecialty', {}, fetcher)).toEqual({ type: 'network_error' });
	});
});

describe('saveOutcome', () => {
	it('returns the saved selection', () => {
		expect(
			saveOutcome({ type: 'success', status: 200, location: '/annotate', data: { selection } })
		).toEqual({
			kind: 'saved',
			selection
		});
	});

	it('reports a redirect (followed by saveChoice)', () => {
		expect(saveOutcome({ type: 'redirect', status: 303, location: '/sign-in' })).toEqual({
			kind: 'redirected'
		});
	});

	it('gives a message with the reference for a server failure', () => {
		const outcome = saveOutcome({
			type: 'failure',
			status: 500,
			location: '/annotate',
			data: { error: { code: 'OPERATION_FAILED', requestId: 'req-123' } }
		});

		expect(outcome).toEqual({
			kind: 'failed',
			message: "We couldn't save your choice. Please try again. (Reference: req-123)"
		});
	});

	it.each([
		['a validation failure', { type: 'failure', status: 400, data: { error: {} } }],
		['an error', { type: 'error', status: 500, error: { requestId: 'r' } }],
		['a network failure', { type: 'network_error' }],
		['a success without a selection', { type: 'success', status: 200, data: {} }]
	] as const)('gives the generic message for %s', (_label, result) => {
		expect(saveOutcome(result as never)).toEqual({
			kind: 'failed',
			message: "We couldn't save your choice. Please try again."
		});
	});
});

describe('feedbackOutcome', () => {
	const location = '/annotate';

	it('is sent on success', () => {
		expect(
			feedbackOutcome({ type: 'success', status: 200, location, data: { sent: true } })
		).toEqual({
			kind: 'sent'
		});
	});

	it("shows the server's field error for an invalid message", () => {
		expect(
			feedbackOutcome({
				type: 'failure',
				status: 400,
				location,
				data: {
					error: { code: 'VALIDATION_FAILED' },
					fieldErrors: { message: 'Please write a message.' }
				}
			})
		).toEqual({ kind: 'invalid', message: 'Please write a message.' });
	});

	it('explains the daily limit', () => {
		expect(
			feedbackOutcome({
				type: 'failure',
				status: 429,
				location,
				data: { error: { code: 'RATE_LIMITED', requestId: 'r1' } }
			})
		).toEqual({
			kind: 'failed',
			message: "You've sent several messages today. Please try again tomorrow."
		});
	});

	it('gives a reference for a failed send', () => {
		expect(
			feedbackOutcome({
				type: 'failure',
				status: 500,
				location,
				data: { error: { code: 'OPERATION_FAILED', requestId: 'req-9' } }
			})
		).toEqual({
			kind: 'failed',
			message: "We couldn't send your feedback. Please try again later. (Reference: req-9)"
		});
	});

	it('reports a redirect, and a generic failure for errors and network failures', () => {
		expect(feedbackOutcome({ type: 'redirect', status: 303, location: '/sign-in' })).toEqual({
			kind: 'redirected'
		});
		expect(feedbackOutcome({ type: 'network_error' })).toEqual({
			kind: 'failed',
			message: "We couldn't send your feedback. Please try again later."
		});
	});
});
