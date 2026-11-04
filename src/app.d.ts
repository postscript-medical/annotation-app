// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { ErrorCode } from './lib/server/errors';

declare global {
	namespace App {
		/** What a client sees for any error: a generic message, a code and maybe a request id. */
		interface Error {
			code?: ErrorCode;
			requestId?: string;
		}
		// interface Locals {}  (1.8)
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
