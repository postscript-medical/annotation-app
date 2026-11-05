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
