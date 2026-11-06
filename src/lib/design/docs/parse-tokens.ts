export type Token = { group: string; name: string; value: string; description: string };

/** Reads tokens.css: a comment on its own line starts a group, a trailing comment describes. */
export function parseTokens(css: string): Token[] {
	const body = css.slice(css.indexOf(':root'));
	const pattern =
		/\/\*\s*([^*]+?)\s*\*\/\s*\n|(--[\w-]+):\s*([^;]+);\s*(?:\/\*\s*([^*]+?)\s*\*\/)?/g;
	const tokens: Token[] = [];
	let group = '';
	for (const [, heading, name, value, description] of body.matchAll(pattern)) {
		if (heading) group = heading;
		else
			tokens.push({
				group,
				name,
				value: value.replace(/\s+/g, ' ').trim(),
				description: description ?? ''
			});
	}
	return tokens;
}
