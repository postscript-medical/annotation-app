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
		gap: 0.5rem;
		padding-bottom: 0.25rem;
	}

	label {
		border: 2px solid black;
		border-radius: 0.5rem;
		display: block;
		padding: 0.5rem;
	}

	input[type='radio']:checked + label,
	label:hover {
		background-color: rgb(55, 154, 70);
		border-color: rgb(55, 154, 70);
		color: white;
	}

	input[type='radio']:focus-visible + label {
		outline: 2px solid rgb(42, 41, 41);
		outline-offset: 2px;
	}
</style>
