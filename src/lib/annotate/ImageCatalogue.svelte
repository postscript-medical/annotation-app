<script lang="ts">
	import { expoInOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';
	import Dropdown from '#lib/components/Dropdown.svelte';
	import ErrorMessage from '#lib/components/ErrorMessage.svelte';
	import Tooltip from '#lib/components/Tooltip.svelte';
	import IconClose from '#lib/components/icons/IconClose.svelte';
	import { filterIllustrations } from '#lib/catalogue/filter-illustrations.ts';
	import { findIllustrations } from '#lib/catalogue/find-illustrations.ts';
	import type { Catalogue, CatalogueChoice, Illustration } from '#lib/catalogue/types.ts';
	import ImagesGrid from './ImagesGrid.svelte';

	// The illustration catalogue panel (legacy ImageCatalogue): browse by specialty and
	// sub-specialty, search by name or alias, pick an illustration. Works on ids (2.4). The search
	// starts empty each time the panel opens (legacy reset its store on open).
	let {
		catalogue,
		specialtyId: initialSpecialtyId = null,
		subSpecialtyId: initialSubSpecialtyId = null,
		activeIllustrationId = null,
		saving = false,
		error = null,
		onselect,
		onclose
	}: {
		catalogue: Catalogue;
		specialtyId?: string | null;
		subSpecialtyId?: string | null;
		activeIllustrationId?: string | null;
		saving?: boolean;
		error?: string | null;
		onselect: (choice: CatalogueChoice) => void;
		onclose: () => void;
	} = $props();

	// Seeded once from the props: the panel is mounted fresh each time it opens.
	// svelte-ignore state_referenced_locally
	let specialtyId = $state(initialSpecialtyId ?? catalogue[0]?.id ?? null);
	// svelte-ignore state_referenced_locally
	let subSpecialtyId = $state(initialSubSpecialtyId);
	let query = $state('');
	let tooltip = $state<{ x: number; y: number } | null>(null);

	const specialty = $derived(catalogue.find(({ id }) => id === specialtyId) ?? null);
	const subSpecialties = $derived(specialty?.subSpecialties ?? []);

	// Keep the sub-specialty if the new specialty has it too; otherwise its first.
	$effect.pre(() => {
		if (!subSpecialties.some(({ id }) => id === subSpecialtyId)) {
			subSpecialtyId = subSpecialties[0]?.id ?? null;
		}
	});

	const images = $derived(
		filterIllustrations(findIllustrations(subSpecialties, subSpecialtyId), query)
	);

	function select(illustration: Illustration) {
		if (!specialtyId || !subSpecialtyId || saving) return;
		onselect({ specialtyId, subSpecialtyId, illustration });
	}

	function showTooltip(event: PointerEvent) {
		const { left, top, width, height } = (
			event.currentTarget as HTMLElement
		).getBoundingClientRect();
		tooltip = { x: left - width * 4, y: top + height * 0.5 };
	}

	function close() {
		tooltip = null;
		onclose();
	}
</script>

<svelte:window onkeydown={(event) => event.key === 'Escape' && close()} />

<div class="wrapper">
	<div
		class="image-catalogue shadow"
		role="dialog"
		aria-modal="true"
		aria-labelledby="image-catalogue-title"
		transition:fly={{ x: '100%', duration: 1000, easing: expoInOut }}
	>
		<header>
			<h2 id="image-catalogue-title">Illustration catalogue</h2>

			<button
				class="close"
				type="button"
				aria-label="Close"
				data-testid="close-catalogue"
				onclick={close}
				onpointerenter={showTooltip}
				onpointerleave={() => (tooltip = null)}
			>
				<IconClose />
			</button>

			{#if tooltip}
				<Tooltip x={tooltip.x} y={tooltip.y}>Close</Tooltip>
			{/if}
		</header>

		<div class="body">
			<Dropdown
				options={catalogue.map(({ id, name }) => ({ label: name, value: id }))}
				bind:value={specialtyId}
				direction="vertical"
			>
				Specialty
			</Dropdown>

			<Dropdown
				disabled={subSpecialties.length <= 1}
				options={subSpecialties.map(({ id, name }) => ({ label: name, value: id }))}
				bind:value={subSpecialtyId}
				direction="vertical"
			>
				Sub-specialty
			</Dropdown>

			<input
				type="search"
				placeholder="What are you looking for?"
				aria-label="Search illustrations"
				class="image-search"
				bind:value={query}
			/>

			{#if error}
				<ErrorMessage message={error} />
			{/if}

			<ImagesGrid {images} activeId={activeIllustrationId} disabled={saving} onselect={select} />
		</div>
	</div>
</div>

<style>
	.wrapper {
		bottom: 0;
		left: 0;
		overflow: hidden;
		position: absolute;
		right: 0;
		top: 0;
		z-index: 3;
	}

	.image-catalogue {
		background-color: white;
		display: flex;
		flex-direction: column;
		height: 100vh;
		padding: 2rem;
		position: absolute;
		right: 0;
		top: 0;
		width: 100vw;
	}

	header {
		display: grid;
		gap: 2rem;
		grid-template-columns: 1fr min-content;
		margin-bottom: 2rem;
		margin-top: 1rem;
	}

	.close {
		background: transparent;
		border: 0;
		padding: 0;
	}

	.body {
		display: grid;
		gap: 1rem;
		grid-auto-rows: min-content;
		grid-template-columns: 1fr 1fr;
		overflow-y: auto;
	}

	.body > :global(:nth-child(n + 3)) {
		grid-column: 1 / -1;
	}
</style>
