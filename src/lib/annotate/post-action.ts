import { deserialize, type ActionResult } from '$app/forms';
import type { SelectionIds } from '#lib/catalogue/selection.ts';

/** An action result, or `network_error` for a request that failed or got an unreadable answer. */
export type PostResult = ActionResult | { type: 'network_error' };

/**
 * Calls a form action of the current page from script, the way `use:enhance` does, without
 * re-running the load (the canvas page keeps its own state).
 */
export async function postAction(
	name: string,
	fields: Record<string, string>,
	fetcher: typeof fetch = fetch
): Promise<PostResult> {
	const body = new FormData();
	for (const [key, value] of Object.entries(fields)) body.set(key, value);
	try {
		const response = await fetcher(`?/${name}`, {
			method: 'POST',
			body,
			headers: { accept: 'application/json', 'x-sveltekit-action': 'true' }
		});
		return deserialize(await response.text());
	} catch {
		return { type: 'network_error' };
	}
}

const SAVE_FAILED = "We couldn't save your choice. Please try again.";

/** What a save came to: the saved selection, an error to show, or a redirect being followed. */
export type SaveOutcome =
	| { kind: 'saved'; selection: SelectionIds }
	| { kind: 'failed'; message: string }
	| { kind: 'redirected' };

/** Reads a `chooseSpecialty` / `chooseIllustration` result. */
export function saveOutcome(result: PostResult): SaveOutcome {
	if (result.type === 'success') {
		const selection = (result.data as { selection?: SelectionIds } | undefined)?.selection;
		if (selection) return { kind: 'saved', selection };
	}
	if (result.type === 'redirect') return { kind: 'redirected' };
	const requestId =
		result.type === 'failure'
			? (result.data as { error?: { requestId?: string } } | undefined)?.error?.requestId
			: undefined;
	return {
		kind: 'failed',
		message: requestId ? `${SAVE_FAILED} (Reference: ${requestId})` : SAVE_FAILED
	};
}

/**
 * Saves a choice through a form action. A redirect (the session ended and the guard sends the
 * user to sign in) is followed with a full page load, and only to a path on this site.
 */
export async function saveChoice(name: string, fields: Record<string, string>) {
	const result = await postAction(name, fields);
	const outcome = saveOutcome(result);
	if (result.type === 'redirect' && /^\/(?!\/)/.test(result.location)) {
		window.location.assign(result.location);
	}
	return outcome;
}

const FEEDBACK_FAILED = "We couldn't send your feedback. Please try again later.";

/** What sending feedback came to. */
export type FeedbackOutcome =
	| { kind: 'sent' }
	| { kind: 'invalid'; message: string }
	| { kind: 'failed'; message: string }
	| { kind: 'redirected' };

type FailureData = {
	error?: { code?: string; message?: string; requestId?: string };
	fieldErrors?: Record<string, string>;
};

/** Reads a `?/feedback` result. Server messages are the app's own generic ones (errors.ts). */
export function feedbackOutcome(result: PostResult): FeedbackOutcome {
	if (result.type === 'success') return { kind: 'sent' };
	if (result.type === 'redirect') return { kind: 'redirected' };
	if (result.type !== 'failure') return { kind: 'failed', message: FEEDBACK_FAILED };

	const data = (result.data ?? {}) as FailureData;
	const fieldError = data.fieldErrors?.message;
	if (fieldError) return { kind: 'invalid', message: fieldError };
	if (data.error?.code === 'RATE_LIMITED') {
		return {
			kind: 'failed',
			message: "You've sent several messages today. Please try again tomorrow."
		};
	}
	const reference = data.error?.requestId ? ` (Reference: ${data.error.requestId})` : '';
	return { kind: 'failed', message: FEEDBACK_FAILED + reference };
}

/** Sends feedback through `?/feedback`; a redirect (session ended) is followed. */
export async function sendFeedback(message: string): Promise<FeedbackOutcome> {
	const result = await postAction('feedback', { message });
	if (result.type === 'redirect' && /^\/(?!\/)/.test(result.location)) {
		window.location.assign(result.location);
	}
	return feedbackOutcome(result);
}
