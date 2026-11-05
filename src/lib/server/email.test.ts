import { describe, expect, it } from 'vitest';
import { escapeHtml, feedbackMail } from './email';

describe('escapeHtml', () => {
	it('escapes the five HTML-significant characters', () => {
		expect(escapeHtml(`<a href="x" title='y'>&</a>`)).toBe(
			'&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;'
		);
	});

	it('leaves other text alone', () => {
		expect(escapeHtml('Plain text, ünïcödé, 100% fine.')).toBe('Plain text, ünïcödé, 100% fine.');
	});
});

describe('feedbackMail', () => {
	const mail = feedbackMail({
		to: 'staff@example.com',
		accountEmail: 'doctor@example.com',
		message: 'Line one <script>alert(1)</script>\nLine "two" & more'
	});

	it('goes to staff, with the account email as reply-to and not in the subject', () => {
		expect(mail.to).toBe('staff@example.com');
		expect(mail.replyTo).toBe('doctor@example.com');
		expect(mail.subject).toBe('[PostScript] Feedback');
		expect(mail.subject).not.toContain('doctor@example.com');
	});

	it('escapes the message in the HTML part and keeps line breaks', () => {
		expect(mail.html).not.toContain('<script>');
		expect(mail.html).toContain(
			'Line one &lt;script&gt;alert(1)&lt;/script&gt;<br>Line &quot;two&quot; &amp; more'
		);
	});

	it('keeps the message as typed in the text part', () => {
		expect(mail.text).toContain('Line one <script>alert(1)</script>\nLine "two" & more');
		expect(mail.text).toContain('doctor@example.com');
	});

	it('escapes the account email in the HTML part too', () => {
		const odd = feedbackMail({ to: 's@x', accountEmail: 'a<b>@example.com', message: 'hi' });

		expect(odd.html).toContain('a&lt;b&gt;@example.com');
	});

	it("uses Lettermint's transactional route", () => {
		expect(mail.headers['X-Lettermint-Route']).toBe('outgoing');
	});
});
