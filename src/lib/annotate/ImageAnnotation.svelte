<!-- From legacy screens/ImageAnnotation. Browser only: the page mounts it under `{#if browser}`.
     Changes from legacy: the catalogue and selection come from the page load, by id; choosing a
     specialty or an illustration saves through a form action and only takes effect once saved, with
     an error shown otherwise (legacy updated the screen and saved fire-and-forget). Sharing is
     device-only (2.5): share sheet, download or print; email sharing is gone (scope change).
     Feedback (2.6) goes to staff by email through `?/feedback`. -->
<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import type { Catalogue, Illustration } from '../catalogue/types.ts';
	import { resolveSelection, type SelectionIds } from '../catalogue/selection.ts';
	import {
		DEFAULT_COLOR,
		DEFAULT_SHAPE,
		DEFAULT_SIZE,
		ERASER_SIZES,
		IMAGE_CATALOGUE,
		PEN_COLORS,
		PEN_SIZES,
		SHAPES,
		TOOL_CHANGE_IMAGE,
		TOOL_ERASE_ALL,
		TOOL_ERASER,
		TOOL_PEN,
		TOOL_SHAPE,
		TOOL_TEXT
	} from '../sketchpad/constants.ts';
	import generateAnnotatedImage from '../sketchpad/generate-annotated-image.ts';
	import { actions, selectedIllustration } from '../sketchpad/stores.ts';
	import type {
		EraserTool,
		PenTool,
		SelectedTool,
		ShapeTool,
		ShapeType
	} from '../sketchpad/types.ts';
	import { toJpegBlob } from '../share/share.ts';
	import SketchPad from '../sketchpad/SketchPad.svelte';
	import SketchPadUi from '../sketchpad/SketchPadUi.svelte';
	import ChooseSpecialtyModal from './ChooseSpecialtyModal.svelte';
	import FeedbackModal from './FeedbackModal.svelte';
	import ImageCatalogue from './ImageCatalogue.svelte';
	import ShareModal from './ShareModal.svelte';
	import { saveChoice } from './post-action.ts';

	/** From the page load: the catalogue, the saved selection (ids) and the menu initial. */
	type Props = {
		catalogue: Catalogue;
		selection: SelectionIds;
		accountInitial?: string;
	};

	let { catalogue, selection, accountInitial = '' }: Props = $props();

	const CHOOSE_A_SPECIALTY = 'chooseASpecialty';
	const MODAL_SHARE = 'share';
	const MODAL_FEEDBACK = 'feedback';

	const defaultColor = PEN_COLORS.find(({ id }) => id === DEFAULT_COLOR)!.value;
	const defaultPenSize = PEN_SIZES.find(({ id }) => id === DEFAULT_SIZE)!.value as number;

	let activeModal = $state('');
	let saving = $state(false);
	let saveError = $state<string | null>(null);
	let eraser = $state.raw<EraserTool>({
		name: TOOL_ERASER,
		lineWidth: ERASER_SIZES.find(({ id }) => id === DEFAULT_SIZE)!.value as number,
		color: defaultColor
	});
	let pen = $state.raw<PenTool>({
		name: TOOL_PEN,
		lineWidth: defaultPenSize,
		color: defaultColor
	});
	let selectedToolId = $state<string>();
	let sketchPad = $state<ReturnType<typeof SketchPad>>();
	let shape = $state.raw<ShapeTool>({
		name: TOOL_SHAPE,
		lineWidth: defaultPenSize,
		color: defaultColor,
		type: SHAPES.find(({ id }) => id === DEFAULT_SHAPE)!.id
	});

	// The saved illustration, before SketchPad mounts (it records it as its first action).
	const initial = untrack(() => resolveSelection(catalogue, selection));
	selectedIllustration.set(initial.illustration);

	const selectedTool: SelectedTool | null = $derived.by(() => {
		switch (selectedToolId) {
			case TOOL_ERASER:
				return eraser;

			case TOOL_SHAPE:
				return shape;

			case TOOL_TEXT:
				return null;

			default:
				return pen;
		}
	});

	function changeLineThickness({ thickness, toolId }: { thickness: number; toolId: string }) {
		if (toolId === TOOL_PEN) {
			pen = { ...pen, lineWidth: Number(thickness) };
		} else {
			eraser = { ...eraser, lineWidth: Number(thickness) };
		}
	}

	function changePenColor(color: string) {
		pen = { ...pen, color };
	}

	function changeShapeType(type: ShapeType) {
		shape = { ...shape, type };
	}

	function openModal(name: string) {
		saveError = null;
		activeModal = name;
	}

	function closeModal() {
		saveError = null;
		activeModal = '';
	}

	function eraseAnnotation() {
		actions.push([...sketchPad!.clearCanvas(), { name: TOOL_ERASE_ALL }]);
	}

	async function chooseSpecialty(specialtyId: string) {
		saving = true;
		saveError = null;
		const outcome = await saveChoice('chooseSpecialty', { specialtyId });
		saving = false;

		if (outcome.kind === 'failed') saveError = outcome.message;
		if (outcome.kind !== 'saved') return;

		selection = outcome.selection;
		if (selection.illustrationId) closeModal();
		else openModal(IMAGE_CATALOGUE);
	}

	async function selectIllustration({
		specialtyId,
		subSpecialtyId,
		illustration
	}: {
		specialtyId: string;
		subSpecialtyId: string;
		illustration: Illustration;
	}) {
		saving = true;
		saveError = null;
		const outcome = await saveChoice('chooseIllustration', {
			specialtyId,
			subSpecialtyId,
			illustrationId: illustration.id
		});
		saving = false;

		if (outcome.kind === 'failed') saveError = outcome.message;
		if (outcome.kind !== 'saved') return;

		selection = outcome.selection;
		actions.push([...sketchPad!.clearCanvas(), { name: TOOL_CHANGE_IMAGE, illustration }]);
		selectedIllustration.set(illustration);
		closeModal();
	}

	async function prepareImage() {
		return toJpegBlob(await generateAnnotatedImage());
	}

	async function printImage() {
		// Close the modal first, so only the annotated page prints (print rules hide the tools).
		closeModal();
		await tick();
		window.print();
	}

	function selectTool(toolId: string) {
		selectedToolId = toolId;
	}

	onMount(() => {
		selectTool(TOOL_PEN);

		if (!selection.specialtyId) openModal(CHOOSE_A_SPECIALTY);
		else if (!selection.illustrationId) openModal(IMAGE_CATALOGUE);
	});
</script>

<div class="main-content">
	<SketchPad {pen} {shape} {selectedTool} {selectedToolId} bind:this={sketchPad} />
	<SketchPadUi
		{eraser}
		{pen}
		{selectedToolId}
		{shape}
		{accountInitial}
		onchangethickness={changeLineThickness}
		onchangecolor={changePenColor}
		onchangeshape={changeShapeType}
		onerase={eraseAnnotation}
		onopencatalogue={() => openModal(IMAGE_CATALOGUE)}
		onopenshare={() => openModal(MODAL_SHARE)}
		onopenfeedback={() => openModal(MODAL_FEEDBACK)}
		onredo={() => sketchPad!.redo()}
		onselecttool={selectTool}
		onundo={() => sketchPad!.undo()}
	/>
</div>

{#if activeModal === IMAGE_CATALOGUE}
	<ImageCatalogue
		{catalogue}
		specialtyId={selection.specialtyId}
		subSpecialtyId={selection.subSpecialtyId}
		activeIllustrationId={$selectedIllustration?.id ?? null}
		{saving}
		error={saveError}
		onselect={selectIllustration}
		onclose={closeModal}
	/>
{/if}

{#if activeModal === MODAL_SHARE}
	<ShareModal prepare={prepareImage} onprint={printImage} onclose={closeModal} />
{/if}

{#if activeModal === MODAL_FEEDBACK}
	<FeedbackModal onclose={closeModal} />
{/if}

{#if activeModal === CHOOSE_A_SPECIALTY}
	<ChooseSpecialtyModal {catalogue} {saving} error={saveError} onconfirm={chooseSpecialty} />
{/if}

<style>
	.main-content {
		align-items: center;
		background: var(--color-neutral-50);
		display: flex;
		height: 100vh;
		justify-content: center;
		overflow-y: auto;
		padding: 0;
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
	}
</style>
