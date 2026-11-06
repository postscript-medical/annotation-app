<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import EmailRequest from './EmailRequest.svelte';

	const { Story } = defineMeta({
		title: 'Layouts/EmailRequest',
		component: EmailRequest,
		render: template,
		args: { title: 'Forgot password', button: 'Send reset link', form: null },
		globals: { backgrounds: { value: 'brand' } },
		parameters: {
			layout: 'fullscreen',
			docs: {
				description: {
					component:
						'The email-only request pages (forgot password, resend confirmation). The answer after sending is the same whether or not an account exists.'
				}
			}
		}
	});
</script>

{#snippet template(args: {
	title: string;
	button: string;
	form: { sent?: boolean; email?: string; fieldErrors?: Record<string, string> } | null;
})}
	<EmailRequest {...args}>
		{#snippet intro()}<p>
				Enter your email and we'll send you a link to set a new password.
			</p>{/snippet}
		{#snippet sent(email)}<p>If {email} has an account, a link is on its way.</p>{/snippet}
	</EmailRequest>
{/snippet}

<Story name="Request" />
<Story
	name="Invalid email"
	args={{ form: { fieldErrors: { email: 'Please enter a valid email address.' } } }}
/>
<Story name="Sent" args={{ form: { sent: true, email: 'someone@example.com' } }} />
