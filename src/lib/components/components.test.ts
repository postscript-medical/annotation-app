import { createRawSnippet, type Component } from 'svelte';
import { compile } from 'svelte/compiler';
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Button from './Button.svelte';
import Dropdown from './Dropdown.svelte';
import ErrorMessage from './ErrorMessage.svelte';
import Link from './Link.svelte';
import Logo from './Logo.svelte';
import Modal from './Modal.svelte';
import TagsInput from './TagsInput.svelte';
import TextInput from './TextInput.svelte';
import Tooltip from './Tooltip.svelte';

// The ported design system (1.13), rendered on the server: structure, attributes and
// accessibility hooks. Behaviour in a browser (dialog focus, Escape, the loading animation) is
// covered end to end once the components are used (2.4).

const text = (value: string) => createRawSnippet(() => ({ render: () => `<span>${value}</span>` }));

function html<P extends Record<string, unknown>>(component: Component<P>, props: P) {
	return render(component, { props }).body;
}

describe('Button', () => {
	it('is a plain button by default, with the label and a hidden spinner', () => {
		const out = html(Button, { children: text('Save') });
		expect(out).toMatch(/<button[^>]*type="button"/);
		expect(out).toMatch(/class="primary/);
		expect(out).toContain('<span>Save</span>');
		expect(out).toMatch(/class="loading-content[^"]*"[^>]*aria-hidden="true"/);
		expect(out).not.toMatch(/<button[^>]*disabled/);
	});

	it('passes type, style and other attributes through', () => {
		const out = html(Button, {
			children: text('Go'),
			type: 'submit',
			style: 'secondary on-dark',
			name: 'intent'
		});
		expect(out).toMatch(/<button[^>]*type="submit"/);
		expect(out).toMatch(/class="secondary on-dark/);
		expect(out).toMatch(/name="intent"/);
	});

	it('has a danger style for destructive actions', () => {
		expect(html(Button, { children: text('Delete'), style: 'danger' })).toMatch(/class="danger/);
	});

	it('is disabled while loading or when disabled', () => {
		expect(html(Button, { children: text('Go'), loading: true })).toMatch(/<button[^>]*disabled/);
		expect(html(Button, { children: text('Go'), disabled: true })).toMatch(/<button[^>]*disabled/);
	});
});

describe('ErrorMessage', () => {
	it('renders nothing without a message', () => {
		expect(html(ErrorMessage, { message: null })).not.toContain('<div');
	});

	it('announces a message', () => {
		expect(html(ErrorMessage, { message: 'Something failed' })).toMatch(
			/<div[^>]*role="alert"[^>]*>Something failed<\/div>/
		);
	});
});

describe('Link', () => {
	it('adds rel="noopener noreferrer" to a new-tab link', () => {
		const out = html(Link, { href: 'https://example.com/', target: '_blank', children: text('x') });
		expect(out).toMatch(/rel="noopener noreferrer"/);
	});

	it('leaves same-tab links alone', () => {
		const out = html(Link, { href: '/account', style: 'on-dark', children: text('x') });
		expect(out).not.toContain('rel=');
		expect(out).toMatch(/class="on-dark/);
	});
});

describe('Logo', () => {
	it('draws the name only when asked', () => {
		expect(html(Logo, { showName: true })).toContain('viewBox="0 0 880 737"');
		expect(html(Logo, { showName: false })).not.toContain('viewBox="0 0 880 737"');
		expect(html(Logo, { showName: true, style: 'large white' })).toMatch(
			/class="main-logo large white/
		);
	});
});

describe('Modal', () => {
	const base = { header: text('Choose a specialty'), children: text('Body') };

	it('is a dialog labelled by its header, with Cancel and Confirm', () => {
		const out = html(Modal, base);
		const labelledBy = /<dialog[^>]*aria-labelledby="([^"]+)"/.exec(out)?.[1];
		expect(labelledBy).toBeTruthy();
		expect(out).toContain(`id="${labelledBy}"`);
		expect(out).toContain('<span>Choose a specialty</span>');
		expect(out).toMatch(/<form[^>]*method="dialog"/);
		expect(out).toMatch(/aria-label="Close"/);
		expect(out).toContain('Cancel');
		expect(out).toMatch(/<button[^>]*type="submit"[\s\S]*Confirm/);
	});

	it('uses the given labels and hides what it is told to', () => {
		const out = html(Modal, {
			...base,
			confirmLabel: 'Send link',
			hideCancelButton: true,
			hideCloseButton: true
		});
		expect(out).toContain('Send link');
		expect(out).not.toContain('Cancel');
		expect(out).not.toContain('aria-label="Close"');
	});

	it('extends to the large size', () => {
		expect(html(Modal, { ...base, size: 'extend' })).toMatch(
			/<dialog[^>]*class="modal shadow extend/
		);
	});
});

describe('form controls', () => {
	it('TextInput labels its input', () => {
		const out = html(TextInput, {
			children: text('Search'),
			value: 'heart',
			style: 'inline',
			placeholder: 'Find'
		});
		expect(out).toMatch(/<label class="container inline/);
		expect(out).toContain('<span>Search</span>');
		expect(out).toMatch(/<input[^>]*type="text"/);
		expect(out).toMatch(/value="heart"/);
		expect(out).toMatch(/placeholder="Find"/);
	});

	it('TagsInput shows the list comma-separated', () => {
		expect(html(TagsInput, { tags: ['heart', 'valve'] })).toMatch(/value="heart,valve"/);
	});

	it('Dropdown lists the options, or shows the chosen label when not editable', () => {
		const options = [
			{ label: 'Cardiology', value: 'c' },
			{ label: 'Urology', value: 'u' }
		];
		const editable = html(Dropdown, { options, value: 'u', children: text('Specialty') });
		expect(editable).toMatch(/<select/);
		expect(editable).toContain('Cardiology');
		const readOnly = html(Dropdown, { options, value: 'u', editable: false });
		expect(readOnly).not.toMatch(/<select/);
		expect(readOnly).toContain('Urology');
	});
});

describe('Tooltip', () => {
	it('sits just right of the point', () => {
		const out = html(Tooltip, { x: 100, y: 40, children: text('Close') });
		expect(out).toMatch(/role="tooltip"/);
		expect(out).toMatch(/translate\(104px, 40px\)/);
		expect(out).toContain('<span>Close</span>');
	});
});

describe('icons', () => {
	const icons = import.meta.glob<{ default: Component }>('./icons/Icon?*.svelte', { eager: true });

	it('ports all 18 legacy icons', () => {
		expect(Object.keys(icons)).toHaveLength(18);
	});

	it.each(Object.entries(icons))('%s draws an svg with a title', (_path, module) => {
		const out = html(module.default, {});
		expect(out).toMatch(/<svg[^>]*viewBox="0 0 24 24"/);
		expect(out).toMatch(/<title>Icon: [^<]+<\/title>/);
	});

	// A server render can't show this: the browser parses the HTML string inside <svg> and puts the
	// elements in the SVG namespace. In the browser, Svelte builds an icon's children from a
	// template and infers its namespace from the elements; a `<title>` (an HTML element name too)
	// among them made it an HTML template, so the shapes drew nothing (found in 2.1).
	const sources = import.meta.glob<string>('./icons/Icon?*.svelte', {
		eager: true,
		query: '?raw',
		import: 'default'
	});

	it.each(Object.entries(sources))('%s builds its shapes as SVG in the browser', (path, source) => {
		const { js } = compile(source, { generate: 'client', filename: path, runes: true });
		expect(js.code).toMatch(/\$\.from_svg\(/);
		expect(js.code).not.toMatch(/\$\.from_html\(/);
	});
});
