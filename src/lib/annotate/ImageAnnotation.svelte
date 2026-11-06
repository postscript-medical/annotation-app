<svelte:options runes={false} />

<!-- Ported (2.4) from legacy screens/ImageAnnotation; legacy (non-runes) mode until 2.9, like the
     sketchpad it drives. Browser only (the page has ssr = false).
     Changes from legacy: the catalogue and selection come from the page load, by id; choosing a
     specialty or an illustration saves through a form action and only takes effect once saved, with
     an error shown otherwise (legacy updated the screen and saved fire-and-forget). Sharing is
     device-only (2.5): share sheet, download or print; email sharing is gone (scope change).
     Feedback (2.6) goes to staff by email through `?/feedback`. -->
<script>
	// @ts-nocheck -- legacy JavaScript ported (2.4); typed in the runes conversion (2.9).
	import { onMount, tick } from 'svelte';
	import { resolveSelection } from '../catalogue/selection.ts';
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
	} from '../sketchpad/constants.js';
	import generateAnnotatedImage from '../sketchpad/generate-annotated-image.js';
	import { actions, selectedIllustration, selectedIllustrationTitle } from '../sketchpad/stores.js';
	import { toJpegBlob } from '../share/share.ts';
	import SketchPad from '../sketchpad/SketchPad.svelte';
	import SketchPadUi from '../sketchpad/SketchPadUi.svelte';
	import ChooseSpecialtyModal from './ChooseSpecialtyModal.svelte';
	import FeedbackModal from './FeedbackModal.svelte';
	import ImageCatalogue from './ImageCatalogue.svelte';
	import ShareModal from './ShareModal.svelte';
	import { saveChoice } from './post-action.ts';

	/** From the page load: the catalogue, the saved selection (ids) and the menu initial. */
	export let catalogue;
	export let selection;
	export let accountInitial = '';

	const CHOOSE_A_SPECIALTY = 'chooseASpecialty';
	const MODAL_SHARE = 'share';
	const MODAL_FEEDBACK = 'feedback';

	let activeModal = '';
	let saving = false;
	let saveError = null;
	let eraser = {
		name: TOOL_ERASER,
		lineWidth: ERASER_SIZES.find(({ id }) => id === DEFAULT_SIZE).value,
		color: PEN_COLORS.find(({ id }) => id === DEFAULT_COLOR).value
	};
	let pen = {
		name: TOOL_PEN,
		lineWidth: PEN_SIZES.find(({ id }) => id === DEFAULT_SIZE).value,
		color: PEN_COLORS.find(({ id }) => id === DEFAULT_COLOR).value
	};
	let selectedTool;
	let selectedToolId;
	let sketchPad;
	let shape = {
		name: TOOL_SHAPE,
		lineWidth: PEN_SIZES.find(({ id }) => id === DEFAULT_SIZE).value,
		color: PEN_COLORS.find(({ id }) => id === DEFAULT_COLOR).value,
		type: SHAPES.find(({ id }) => id === DEFAULT_SHAPE).id
	};

	// The saved illustration, before SketchPad mounts (it records the title as its first action).
	const initial = resolveSelection(catalogue, selection);
	selectedIllustration.set(initial.illustration);
	selectedIllustrationTitle.set(initial.illustration?.name ?? '');

	$: {
		switch (selectedToolId) {
			case TOOL_ERASER:
				selectedTool = eraser;
				break;

			case TOOL_SHAPE:
				selectedTool = shape;
				break;

			case TOOL_TEXT:
				selectedTool = {};
				break;

			default:
				selectedTool = pen;
				break;
		}
	}

	function changeLineThickness({ detail }) {
		const { thickness, toolId } = detail;
		if (toolId === TOOL_PEN) {
			pen = { ...pen, lineWidth: Number(thickness) };
		} else {
			eraser = { ...eraser, lineWidth: Number(thickness) };
		}
	}

	function changePenColor({ detail: color }) {
		pen = { ...pen, color };
	}

	function changeShapeType({ detail: type }) {
		shape = { ...shape, type };
	}

	function openModal(name) {
		saveError = null;
		activeModal = name;
	}

	function closeModal() {
		saveError = null;
		activeModal = '';
	}

	function eraseAnnotation() {
		actions.push([...sketchPad.clearCanvas(), { name: TOOL_ERASE_ALL }]);
	}

	async function chooseSpecialty(specialtyId) {
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

	async function selectIllustration({ specialtyId, subSpecialtyId, illustration }) {
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
		actions.push([
			...sketchPad.clearCanvas(),
			{ name: TOOL_CHANGE_IMAGE, illustrationTitle: illustration.name }
		]);
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

	function selectTool({ detail: toolId }) {
		selectedToolId = toolId;
	}

	onMount(() => {
		selectTool({ detail: TOOL_PEN });

		if (!selection.specialtyId) openModal(CHOOSE_A_SPECIALTY);
		else if (!selection.illustrationId) openModal(IMAGE_CATALOGUE);
	});
</script>

<div class="main-content">
	<SketchPad
		{pen}
		{shape}
		{selectedTool}
		{selectedToolId}
		bind:this={sketchPad}
		on:select-tool={selectTool}
	/>
	<SketchPadUi
		{eraser}
		{pen}
		{selectedToolId}
		{shape}
		{accountInitial}
		on:change-thickness={changeLineThickness}
		on:change-color={changePenColor}
		on:change-shape={changeShapeType}
		on:erase-annotation={eraseAnnotation}
		on:open-catalogue={() => openModal(IMAGE_CATALOGUE)}
		on:open-share={() => openModal(MODAL_SHARE)}
		on:open-feedback={() => openModal(MODAL_FEEDBACK)}
		on:redo={() => sketchPad.redo()}
		on:select-tool={selectTool}
		on:undo={() => sketchPad.undo()}
	/>
</div>

{#if activeModal === IMAGE_CATALOGUE}
	<ImageCatalogue
		{catalogue}
		specialtyId={selection.specialtyId}
		subSpecialtyId={selection.subSpecialtyId}
		activeIllustrationId={selection.illustrationId}
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
		background: rgb(250, 250, 250);
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
