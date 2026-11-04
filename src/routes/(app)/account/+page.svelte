<script lang="ts">
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

<AuthPage title="Your account">
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
						<button type="submit">Sign out</button>
					</form>
				</li>
			{/each}
		</ul>
		<form method="POST" action="?/signOutEverywhere">
			<button type="submit">Sign out of all devices</button>
		</form>
	</section>

	<section aria-labelledby="data-heading">
		<h2 id="data-heading">Your data</h2>
		<p class="small">
			A file with everything we hold about you: your email address, sign-in dates, workspace,
			settings and sessions.
		</p>
		<form method="POST" action="/account/export">
			<button type="submit">Download my data</button>
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
			<button type="submit" class="danger">Delete my account</button>
		</form>
	</section>

	<form method="POST" action="/logout">
		<button type="submit">Sign out</button>
	</form>
</AuthPage>

<style>
	section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	h2 {
		margin: 0;
		font-size: 1.125rem;
	}

	.sessions {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.sessions li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.2);
	}

	.tag {
		margin-left: 0.5rem;
		font-size: 0.75rem;
		padding: 0.125rem 0.5rem;
		border: 1px solid currentColor;
		border-radius: 999px;
	}

	.danger {
		background-color: rgb(170, 40, 40);
		border-color: rgb(170, 40, 40);
	}
</style>
