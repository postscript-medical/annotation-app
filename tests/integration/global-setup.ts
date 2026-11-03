import { execFileSync } from 'node:child_process';
import type { TestProject } from 'vitest/node';

/**
 * Reads the local Supabase stack's URL and keys from `supabase status` and hands them to the
 * integration tests. Only the local stack is ever used: the URL must be on 127.0.0.1/localhost.
 */
export default function setup(project: TestProject) {
	let status: Record<string, string>;
	try {
		const output = execFileSync('npx', ['supabase', 'status', '-o', 'json'], {
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'pipe']
		});
		status = JSON.parse(output.slice(output.indexOf('{')));
	} catch (error) {
		throw new Error(
			'Integration tests need the local Supabase stack. Run `npx supabase start` first.',
			{ cause: error }
		);
	}

	const apiUrl = status.API_URL;
	const host = new URL(apiUrl).hostname;
	if (host !== '127.0.0.1' && host !== 'localhost') {
		throw new Error(`Refusing to run integration tests against a non-local Supabase: ${host}`);
	}

	project.provide('supabase', {
		url: apiUrl,
		publishableKey: status.PUBLISHABLE_KEY,
		secretKey: status.SECRET_KEY,
		mailpitUrl: status.MAILPIT_URL
	});
}

declare module 'vitest' {
	export interface ProvidedContext {
		supabase: { url: string; publishableKey: string; secretKey: string; mailpitUrl: string };
	}
}
