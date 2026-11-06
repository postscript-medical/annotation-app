import source from '../tokens.css?raw';
import { parseTokens } from './parse-tokens.ts';

export const tokens = parseTokens(source);

export function tokensInGroup(group: string) {
	return tokens.filter((token) => token.group === group);
}
