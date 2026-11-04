/**
 * Structured server logs (data-protection §2, risk S17): one JSON line per entry.
 *
 * Only the fields below are ever written: ids, codes and timings. Never passwords, email
 * addresses, IP addresses or tokens. The field type enforces that at compile time, the allow-list
 * enforces it at run time, and error text is scrubbed because library messages can quote input.
 */
export type LogFields = {
	requestId?: string;
	userId?: string;
	/** An app error code or a library error code such as `invalid_credentials`. */
	code?: string;
	status?: number;
	/** The route id, e.g. `/sign-in`, never the URL (its query could hold a token). */
	route?: string;
	method?: string;
	durationMs?: number;
	count?: number;
};

const ALLOWED_FIELDS = new Set<string>([
	'requestId',
	'userId',
	'code',
	'status',
	'route',
	'method',
	'durationMs',
	'count'
]);

type Level = 'info' | 'warn' | 'error';

const REDACTIONS: [RegExp, string][] = [
	// JWTs (three base64url parts, header starts with `eyJ`).
	[/eyJ[\w-]*\.[\w-]+\.[\w-]*/g, '[jwt]'],
	// Supabase API keys and bearer tokens.
	[/\bsb_(?:secret|publishable)_[\w-]+/g, '[key]'],
	[/\bBearer\s+[\w.~+/-]+=*/gi, 'Bearer [token]'],
	// Email addresses.
	[/[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(?:\.[\w-]+)+/g, '[email]'],
	// IPv4 addresses.
	[/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[ip]'],
	// IPv6 addresses: four or more groups, or a group followed by `::`. (Three groups would also
	// match times like 12:30:45 and file:line:column in stack traces.)
	[/\b(?:[0-9a-f]{1,4}:){3,7}[0-9a-f]{1,4}\b/gi, '[ip]'],
	[/\b(?:[0-9a-f]{1,4}:)+:(?:[0-9a-f]{1,4}(?::[0-9a-f]{1,4})*)?/gi, '[ip]'],
	// Long hex or base64url runs (token hashes, secrets).
	[/\b[a-f0-9]{32,}\b/gi, '[hex]']
];

/** Removes anything that looks like personal data or a secret from free text. */
export function redact(text: string): string {
	let result = text;
	for (const [pattern, replacement] of REDACTIONS) result = result.replace(pattern, replacement);
	return result;
}

function safeFields(fields: LogFields | undefined): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	if (!fields) return out;
	for (const [key, value] of Object.entries(fields)) {
		if (!ALLOWED_FIELDS.has(key) || value === undefined) continue;
		out[key] = typeof value === 'string' ? redact(value).slice(0, 200) : value;
	}
	return out;
}

function describeError(error: unknown): Record<string, unknown> | undefined {
	if (error === undefined || error === null) return undefined;
	if (error instanceof Error) {
		const described: Record<string, unknown> = {
			name: error.name,
			message: redact(error.message).slice(0, 500)
		};
		const code = (error as { code?: unknown }).code;
		if (typeof code === 'string' && /^[\w.-]{1,64}$/.test(code)) described.code = code;
		const status = (error as { status?: unknown }).status;
		if (typeof status === 'number') described.status = status;
		if (error.stack) described.stack = redact(error.stack).slice(0, 2000);
		return described;
	}
	// Not an Error: record only its type, never its contents.
	return { name: typeof error };
}

function write(level: Level, event: string, fields?: LogFields, error?: unknown) {
	const entry: Record<string, unknown> = {
		level,
		time: new Date().toISOString(),
		event: redact(event).slice(0, 100),
		...safeFields(fields)
	};
	const described = describeError(error);
	if (described) entry.error = described;
	const line = JSON.stringify(entry);
	if (level === 'error') console.error(line);
	else if (level === 'warn') console.warn(line);
	else console.log(line);
}

export const log = {
	info: (event: string, fields?: LogFields) => write('info', event, fields),
	warn: (event: string, fields?: LogFields, error?: unknown) => write('warn', event, fields, error),
	error: (event: string, error?: unknown, fields?: LogFields) =>
		write('error', event, fields, error)
};
