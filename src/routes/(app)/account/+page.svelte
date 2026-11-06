<script lang="ts">
	import Button from '#lib/components/Button.svelte';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import AuthPage from '#lib/components/auth/AuthPage.svelte';
	import Notice from '#lib/components/auth/Notice.svelte';
	import PasswordField from '#lib/components/auth/PasswordField.svelte';
	import TextField from '#lib/components/auth/TextField.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const deleteErrors = $derived(
		form && 'deleteErrors' in form ? (form.deleteErrors as Record<string, string>) : {}
	);

	// UTC, so the server render and the browser agree.
	const format = new Intl.DateTimeFormat('en-GB', {
		dateStyle: 'medium',
		timeStyle: 'short',
		timeZone: 'UTC'
	});
	const when = (iso: string) => `${format.format(new Date(iso))} UTC`;
</script>

<AuthPage title="Your account" signedIn>
	{#if data.passwordChanged && !form}
		<Notice><p>Your password has been changed. Other devices have been signed out.</p></Notice>
	{/if}
	{#if form && 'revoked' in form}
		<Notice><p>That session has been signed out.</p></Notice>
	{/if}
	{#if form?.error && form.error.code !== 'VALIDATION_FAILED'}
		<Notice tone="error"><p>{form.error.message}</p></Notice>
	{/if}

	<section aria-labelledby="email-heading">
		<h2 id="email-heading">Email address</h2>
		<p>{data.email}</p>
		<p class="small">
			To use a different address, delete this account and sign up again with the new one.
		</p>
	</section>

	<section aria-labelledby="password-heading">
		<h2 id="password-heading">Password</h2>
		<p><a href={resolve('/(app)/account/password')}>Change your password</a></p>
	</section>

	<section aria-labelledby="sessions-heading">
		<h2 id="sessions-heading">Where you're signed in</h2>
		<ul class="sessions">
			{#each data.sessions as session (session.id)}
				<li>
					<div>
						<strong>{session.mode === 'shared' ? 'Shared device' : 'Personal device'}</strong>
						{#if session.current}<span class="tag">This device</span>{/if}
						<div class="small">
							Signed in {when(session.createdAt)} · last active {when(session.lastSeenAt)}
						</div>
					</div>
					<form method="POST" action="?/signOutSession" use:enhance>
						<input type="hidden" name="sessionId" value={session.id} />
						<Button type="submit" style="secondary">Sign out</Button>
					</form>
				</li>
			{/each}
		</ul>
		<form method="POST" action="?/signOutEverywhere">
			<Button type="submit" style="secondary">Sign out of all devices</Button>
		</form>
	</section>

	<section aria-labelledby="data-heading">
		<h2 id="data-heading">Your data</h2>
		<p class="small">
			A file with everything we hold about you: your email address, sign-in dates, workspace,
			settings and sessions.
		</p>
		<form method="POST" action="/account/export">
			<Button type="submit" style="secondary">Download my data</Button>
		</form>
	</section>

	<section aria-labelledby="delete-heading">
		<h2 id="delete-heading">Delete your account</h2>
		<p class="small">
			This deletes your account and everything we hold about it, straight away. It can't be undone.
		</p>
		<form
			method="POST"
			action="?/delete"
			use:enhance={() =>
				async ({ update }) =>
					update({ reset: false })}
		>
			<PasswordField
				label="Current password"
				name="password"
				autocomplete="current-password"
				error={deleteErrors.password}
			/>
			<TextField
				label="Type your email address to confirm"
				name="confirmEmail"
				type="email"
				autocomplete="off"
				required
				error={deleteErrors.confirmEmail}
			/>
			<Button type="submit" style="danger">Delete my account</Button>
		</form>
	</section>

	<form method="POST" action="/logout">
		<Button type="submit" style="secondary">Sign out</Button>
	</form>
</AuthPage>

<style>
	section {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	h2 {
		margin: 0;
		font-size: var(--font-size-lg);
	}

	.sessions {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.sessions li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-4);
		padding-bottom: var(--space-3);
		border-bottom: 1px solid var(--color-white-divider);
	}

	.tag {
		margin-left: var(--space-2);
		font-size: var(--font-size-xs);
		padding: var(--space-0-5) var(--space-2);
		border: 1px solid currentColor;
		border-radius: 999px;
	}
</style>
