<script lang="ts">
	// A password input with a show/hide toggle (auth-spec §1: paste allowed, password-manager
	// friendly). Without JavaScript it is a plain password field.
	type Props = {
		label: string;
		name: string;
		autocomplete: 'current-password' | 'new-password';
		error?: string;
		hint?: string;
	};

	let { label, name, autocomplete, error, hint }: Props = $props();
	const id = $props.id();
	let visible = $state(false);
</script>

<div class="field">
	<label for={id}>{label}</label>
	<div class="row">
		<input
			{id}
			{name}
			type={visible ? 'text' : 'password'}
			{autocomplete}
			required
			autocapitalize="off"
			spellcheck="false"
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={[error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') ||
				undefined}
		/>
		<button
			type="button"
			class="toggle"
			aria-controls={id}
			aria-pressed={visible}
			onclick={() => (visible = !visible)}
		>
			{visible ? 'Hide' : 'Show'}
		</button>
	</div>
	{#if hint}<span class="hint" id="{id}-hint">{hint}</span>{/if}
	{#if error}<span class="error" id="{id}-error">{error}</span>{/if}
</div>

<style>
	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-1-5);
	}

	label {
		font-size: var(--font-size-md);
	}

	.row {
		display: flex;
		gap: var(--space-2);
	}

	.row input {
		flex: 1;
		min-width: 0;
	}

	.toggle {
		flex-shrink: 0;
		background: transparent;
		border-color: var(--color-white-border);
		min-width: 4.5rem;
	}

	.hint {
		font-size: var(--font-size-sm);
		opacity: 0.85;
	}

	.error {
		font-size: var(--font-size-md);
		color: var(--color-error-text);
	}

	input[aria-invalid='true'] {
		border-color: var(--color-error-border);
	}
</style>
