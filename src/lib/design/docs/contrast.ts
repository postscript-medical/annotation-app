// WCAG 2 contrast between two opaque sRGB colours, for the Colors page.

export type Rgb = [number, number, number];

/** Parses a colour as getComputedStyle reports it: `rgb(r, g, b)` or `rgba(r, g, b, a)`. */
export function parseRgb(color: string): Rgb | null {
	const match = color.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
	return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
}

function luminance(color: Rgb): number {
	const [r, g, b] = color.map((channel) => {
		const value = channel / 255;
		return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: Rgb, b: Rgb): number {
	const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (lighter + 0.05) / (darker + 0.05);
}

/** AA needs 4.5:1 for normal text, 3:1 for large text (at least 24px, or 18.66px bold). */
export function wcagLevel(ratio: number): 'AAA' | 'AA' | 'AA large only' | 'Fails' {
	if (ratio >= 7) return 'AAA';
	if (ratio >= 4.5) return 'AA';
	if (ratio >= 3) return 'AA large only';
	return 'Fails';
}
