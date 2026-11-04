// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { ErrorCode } from './lib/server/errors';
import type { SessionMode, WorkspaceRole } from './lib/server/session';
import type { Db } from './lib/server/supabase';

declare global {
	namespace App {
		/** What a client sees for any error: a generic message, a code and maybe a request id. */
		interface Error {
			code?: ErrorCode;
			requestId?: string;
		}

		/** Set by hooks.server.ts on every request (auth-spec §3.2). */
		interface Locals {
			requestId: string;
			/** The per-request client acting as the signed-in user (cookies). */
			supabase: Db;
			/** The verified session, or null when signed out. */
			session: {
				/** JWT `session_id`; the session_policies key. */
				id: string;
				/** JWT `sub`: the auth.users id. */
				authId: string;
				mode: SessionMode;
				/** JWT `amr` methods, e.g. `password` or `otp`. */
				amr: string[];
				recoveryVerifiedAt: string | null;
			} | null;
			/** The app account and active workspace, or null when signed out. */
			profile: {
				userId: string;
				workspaceId: string;
				workspaceRole: WorkspaceRole;
			} | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
