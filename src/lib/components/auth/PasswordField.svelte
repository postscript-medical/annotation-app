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
		gap: 0.375rem;
	}

	label {
		font-size: 0.875rem;
	}

	.row {
		display: flex;
		gap: 0.5rem;
	}

	.row input {
		flex: 1;
		min-width: 0;
	}

	.toggle {
		flex-shrink: 0;
		background: transparent;
		border-color: rgba(255, 255, 255, 0.6);
		min-width: 4.5rem;
	}

	.hint {
		font-size: 0.8125rem;
		opacity: 0.85;
	}

	.error {
		font-size: 0.875rem;
		color: rgb(255, 170, 170);
	}

	input[aria-invalid='true'] {
		border-color: rgb(230, 90, 90);
	}
</style>
