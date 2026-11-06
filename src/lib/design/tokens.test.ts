import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrastRatio, parseRgb, wcagLevel } from './docs/contrast.ts';
import { parseTokens } from './docs/parse-tokens.ts';

const css = readFileSync('src/lib/design/tokens.css', 'utf8');
const tokens = parseTokens(css);

const sources = (readdirSync('src', { recursive: true }) as string[])
	.filter((file) => /\.(svelte|css)$/.test(file) && !file.endsWith('.stories.svelte'))
	.map((file) => join('src', file))
	.filter((file) => !file.endsWith('design/tokens.css') && !file.includes('design/docs/'))
	.map((file) => ({ file, text: readFileSync(file, 'utf8') }));

/** The CSS of a file: all of a stylesheet, or a component's <style> block. */
function stylesOf({ file, text }: { file: string; text: string }) {
	if (file.endsWith('.css')) return text;
	return text.match(/<style[^>]*>([\s\S]*?)<\/style>/)?.[1] ?? '';
}

describe('design tokens', () => {
	it('parses every declaration, with its group and description', () => {
		expect(tokens.length).toBe(css.match(/^\s*--[\w-]+:/gm)?.length);
		expect(tokens.find((token) => token.name === '--color-brand')).toEqual({
			group: 'Brand',
			name: '--color-brand',
			value: 'rgb(55, 154, 70)',
			description: 'Page background, primary buttons, selected states'
		});
		expect(tokens.every((token) => token.group && token.description)).toBe(true);
	});

	it('defines every token the app uses', () => {
		const defined = new Set(tokens.map((token) => token.name));
		const unknown = sources.flatMap(({ file, text }) =>
			[...text.matchAll(/var\((--[\w-]+)/g)]
				.map((match) => match[1])
				.filter((name) => !defined.has(name))
				.map((name) => `${file}: ${name}`)
		);
		expect(unknown).toEqual([]);
	});

	it('keeps colour values in tokens, not in component styles', () => {
		const literal = /#[0-9a-f]{3,8}\b|\brgba?\(|:\s*(white|black)\b/i;
		const offenders = sources.flatMap((source) =>
			stylesOf(source)
				.split('\n')
				// The inline SVG arrow of the select can't take a var().
				.filter((line) => literal.test(line) && !line.includes('data:image'))
				.map((line) => `${source.file}: ${line.trim()}`)
		);
		expect(offenders).toEqual([]);
	});
});

describe('contrast', () => {
	it('parses computed colours', () => {
		expect(parseRgb('rgb(55, 154, 70)')).toEqual([55, 154, 70]);
		expect(parseRgb('rgba(1, 2, 3, 0.5)')).toEqual([1, 2, 3]);
		expect(parseRgb('white')).toBeNull();
	});

	it('matches the WCAG reference values', () => {
		expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21);
		expect(contrastRatio([255, 255, 255], [255, 255, 255])).toBe(1);
		expect(wcagLevel(21)).toBe('AAA');
		expect(wcagLevel(4.5)).toBe('AA');
		expect(wcagLevel(3)).toBe('AA large only');
		expect(wcagLevel(2.9)).toBe('Fails');
	});
});
