import nodemailer, { type Transporter } from 'nodemailer';
import { optionalServerEnv, serverEnv } from './env';

/**
 * Email the app sends itself (2.6): only feedback to staff. Auth emails go through Supabase's own
 * SMTP settings. Lettermint SMTP on Netlify; the local Mailpit in development and tests.
 */

const FROM = { name: 'PostScript', address: 'no-reply@postscriptmedical.com' };

export type Mail = {
	to: string;
	replyTo: string;
	subject: string;
	text: string;
	html: string;
	headers: Record<string, string>;
};

const HTML_ESCAPES: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;'
};

export function escapeHtml(text: string): string {
	return text.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

/**
 * The feedback email. The user's text is escaped in the HTML part (legacy inserted it raw) and
 * kept as typed in the text part. The account email is the reply-to and appears in the body,
 * never in the subject.
 */
export function feedbackMail({
	to,
	accountEmail,
	message
}: {
	to: string;
	accountEmail: string;
	message: string;
}): Mail {
	const paragraphs = message
		.split(/\r?\n/)
		.map((line) => escapeHtml(line))
		.join('<br>');
	return {
		to,
		replyTo: accountEmail,
		subject: '[PostScript] Feedback',
		text: `Feedback from ${accountEmail} (reply to answer):\n\n${message}\n`,
		html:
			`<p>Feedback from ${escapeHtml(accountEmail)} (reply to answer):</p>` +
			`<p>${paragraphs}</p>`,
		// Lettermint's transactional route (0.6); the project's default too.
		headers: { 'X-Lettermint-Route': 'outgoing' }
	};
}

function isLocalHost(host: string) {
	return host === '127.0.0.1' || host === 'localhost' || host === '::1';
}

let transport: Transporter | undefined;

function smtp(): Transporter {
	if (transport) return transport;
	const host = serverEnv('SMTP_HOST');
	const port = Number(serverEnv('SMTP_PORT'));
	const user = optionalServerEnv('SMTP_USER');
	const local = isLocalHost(host);
	if (!local && !user) throw new Error('SMTP_USER and SMTP_PASSWORD are needed for a remote host');
	transport = nodemailer.createTransport({
		host,
		port,
		secure: port === 465,
		// Anything but the local Mailpit must upgrade to TLS (Lettermint: STARTTLS on 587).
		requireTLS: !local,
		auth: user ? { user, pass: serverEnv('SMTP_PASSWORD') } : undefined,
		connectionTimeout: 10_000,
		greetingTimeout: 10_000,
		socketTimeout: 15_000
	});
	return transport;
}

/** Sends one message. Throws if the SMTP server doesn't accept it. */
export async function sendMail(mail: Mail): Promise<void> {
	await smtp().sendMail({ from: FROM, ...mail });
}

/** The staff inbox feedback goes to. */
export function feedbackRecipient(): string {
	return serverEnv('FEEDBACK_TO');
}
