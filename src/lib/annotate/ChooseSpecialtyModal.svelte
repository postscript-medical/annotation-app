<script lang="ts">
	import ErrorMessage from '#lib/components/ErrorMessage.svelte';
	import Modal from '#lib/components/Modal.svelte';
	import type { Catalogue } from '#lib/catalogue/types.ts';

	// First visit (legacy ChooseSpecialtyModal): pick a specialty before anything else. It can't be
	// dismissed; `onconfirm` saves the choice and shows `error` if that fails.
	let {
		catalogue,
		saving = false,
		error = null,
		onconfirm
	}: {
		catalogue: Catalogue;
		saving?: boolean;
		error?: string | null;
		onconfirm: (specialtyId: string) => void;
	} = $props();

	let specialtyId = $state<string | null>(null);
</script>

<Modal
	disableConfirmButton={!specialtyId || saving}
	loading={saving}
	hideCancelButton
	hideCloseButton
	onconfirm={() => specialtyId && onconfirm(specialtyId)}
>
	{#snippet header()}Welcome to PostScript{/snippet}

	<p>Please choose your desired specialty:</p>

	<ul class="plain">
		{#each catalogue as specialty (specialty.id)}
			<li>
				<input
					id="specialty-{specialty.id}"
					type="radio"
					name="specialty"
					value={specialty.id}
					bind:group={specialtyId}
				/>
				<label for="specialty-{specialty.id}">{specialty.name}</label>
			</li>
		{/each}
	</ul>

	<ErrorMessage message={error} />
</Modal>

<style>
	ul {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding-bottom: var(--space-1);
	}

	label {
		border: 2px solid var(--color-black);
		border-radius: var(--radius-lg);
		display: block;
		padding: var(--space-2);
	}

	input[type='radio']:checked + label,
	label:hover {
		background-color: var(--color-brand);
		border-color: var(--color-brand);
		color: var(--color-white);
	}

	input[type='radio']:focus-visible + label {
		outline: 2px solid var(--color-ink);
		outline-offset: 2px;
	}
</style>
