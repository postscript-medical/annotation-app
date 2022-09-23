<script>
  import { onMount } from "svelte";
  import {
    actions,
    activeModal,
    annotatedImage,
    illustrationSearchQuery,
    protectedContent,
    selectedIllustrationTitle,
    selectedSpecialty,
    selectedSubSpecialty,
    user,
  } from "../stores.js";
  import {
    ERASER_SIZES,
    PEN_COLORS,
    PEN_SIZES,
    SHAPES,
  } from "../constants/sketch-pad.js";
  import {
    DEFAULT_COLOR,
    DEFAULT_SHAPE,
    DEFAULT_SIZE,
    MODAL_CATALOGUE,
    MODAL_FEEDBACK,
    MODAL_SHARE,
    TOOL_CHANGE_IMAGE,
    TOOL_ERASE_ALL,
    TOOL_ERASER,
    TOOL_PEN,
    TOOL_SHAPE,
    TOOL_TEXT,
  } from "../constants/defaults.js";
  import clone from "../methods/clone.js";
  import FeedbackModal from "../modals/FeedbackModal.svelte";
  import ImageCatalogueModal from "../modals/ImageCatalogueModal.svelte";
  import SketchPad from "../components/sketchpad/SketchPad.svelte";
  import SketchPadUi from "../components/sketchpad/SketchPadUi.svelte";
  import ShareModal from "../modals/ShareModal.svelte";
  import { tweenOut } from "../components/sketchpad/Illustration.svelte";

  let emailSent = false;
  let eraser = {
    name: TOOL_ERASER,
    lineWidth: ERASER_SIZES.find(({ id }) => id === DEFAULT_SIZE).value,
    color: PEN_COLORS.find(({ id }) => id === DEFAULT_COLOR).value,
  };
  let errorMessage = "";
  let loading = false;
  let pen = {
    name: TOOL_PEN,
    lineWidth: PEN_SIZES.find(({ id }) => id === DEFAULT_SIZE).value,
    color: PEN_COLORS.find(({ id }) => id === DEFAULT_COLOR).value,
  };
  let selectedTool;
  let selectedToolId;
  let sketchPad;
  let shape = {
    name: TOOL_SHAPE,
    lineWidth: PEN_SIZES.find(({ id }) => id === DEFAULT_SIZE).value,
    color: PEN_COLORS.find(({ id }) => id === DEFAULT_COLOR).value,
    type: SHAPES.find(({ id }) => id === DEFAULT_SHAPE).id,
  };
  let tempAppState = {};

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
      pen = {
        ...pen,
        lineWidth: Number(thickness),
      };
    } else {
      eraser = {
        ...eraser,
        lineWidth: Number(thickness),
      };
    }
  }

  function changePenColor({ detail: color }) {
    pen = {
      ...pen,
      color,
    };
  }

  function changeShapeType({ detail: type }) {
    shape = {
      ...shape,
      type,
    };
  }

  function clearErrors() {
    errorMessage = "";
  }

  function closeModal() {
    $activeModal = "";
  }

  function closeCatalogueModal() {
    $protectedContent.appState = { ...tempAppState };

    $selectedSpecialty = tempAppState.selectedSpecialty;
    $selectedSubSpecialty = tempAppState.selectedSubSpecialty;

    closeModal();
  }

  function downloadImage() {
    const fileName = "myImage.jpg";
    /**
     * IE11
     */
    if (window.navigator.msSaveBlob) {
      window.navigator.msSaveBlob($annotatedImage.msToBlob(), fileName);
    } else {
      const hiddenLink = document.createElement("a");
      hiddenLink.setAttribute("href", generateAnnotatedImage());
      hiddenLink.setAttribute("download", fileName);
      hiddenLink.click();
    }
  }

  function eraseAnnotation() {
    actions.push([
      ...sketchPad.clearCanvas(),
      {
        name: TOOL_ERASE_ALL,
      },
    ]);
  }

  function generateAnnotatedImage() {
    return $annotatedImage.toDataURL("image/jpeg", 0.9);
  }

  function openCatalogueModal({ detail: modalName }) {
    tempAppState = { ...$protectedContent.appState };

    $illustrationSearchQuery = "";

    openModal({ detail: modalName });
  }

  function openModal({ detail: modalName }) {
    $activeModal = modalName;
  }

  function printImage() {
    window.print();
  }

  function selectIllustration({ detail: illustration }) {
    updateAppState(illustration.name);

    actions.push([
      ...sketchPad.clearCanvas(),
      {
        name: TOOL_CHANGE_IMAGE,
        illustrationTitle: illustration.name,
      },
    ]);

    if (illustration.name !== $selectedIllustrationTitle) {
      tweenOut(() => {
        $selectedIllustrationTitle = illustration.name;
      });
    }

    closeModal();
  }

  function selectTool({ detail: toolId }) {
    selectedToolId = toolId;
  }

  async function sendImageViaEmail({ detail: email }) {
    loading = true;

    const encodedImage = generateAnnotatedImage();
    const response = await fetch("/.netlify/functions/send-annotation-email", {
      method: "POST",
      body: JSON.stringify({
        image: encodedImage,
        to_email: email,
      }),
    }).catch((err) => {
      errorMessage = err;
    });

    if (response && response.status === 200) {
      emailSent = true;
    } else {
      errorMessage =
        "Error sending email. Verify the address and if the problem persists, contact us.";
    }

    loading = false;
  }

  async function updateAppState(illustrationTitle) {
    const token = $user ? await $user.jwt(true) : false;

    if (!token) {
      return Promise.reject(
        new Error("Could not validate your token. Please contact support.")
      );
    }

    await fetch("/.netlify/functions/update-app-state", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: $protectedContent.appState.id,
        selectedIllustrationTitle: illustrationTitle,
        selectedSpecialty: $selectedSpecialty,
        selectedSubSpecialty: $selectedSubSpecialty,
      }),
    })
      .then((response) => response.json())
      .then(({ data }) => {
        $protectedContent.appState.selectedIllustrationTitle =
          data.selectedIllustrationTitle;
        $protectedContent.appState.selectedSpecialty = data.selectedSpecialty;
        $protectedContent.appState.selectedSubSpecialty =
          data.selectedSubSpecialty;
      })
      .catch((error) =>
        console.error("::: Error updating app state :::", error)
      );
  }

  function redoAction() {
    sketchPad.redo();
  }

  function undoAction() {
    sketchPad.undo();
  }

  onMount(() => {
    selectTool({ detail: TOOL_PEN });
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
    on:change-thickness={changeLineThickness}
    on:change-color={changePenColor}
    on:change-shape={changeShapeType}
    on:erase-annotation={eraseAnnotation}
    on:open-catalogue={openCatalogueModal}
    on:redo={redoAction}
    on:select-illustration={selectIllustration}
    on:select-tool={selectTool}
    on:undo={undoAction}
  />
</div>

{#if $activeModal === MODAL_SHARE}
  <ShareModal
    {loading}
    {emailSent}
    {errorMessage}
    on:clear-errors={clearErrors}
    on:close={closeModal}
    on:download-image={downloadImage}
    on:print-image={printImage}
    on:send-email={sendImageViaEmail}
  />
{/if}

{#if $activeModal === MODAL_FEEDBACK}
  <FeedbackModal on:close={closeModal} />
{/if}

{#if $activeModal === MODAL_CATALOGUE}
  <ImageCatalogueModal
    on:close={closeCatalogueModal}
    on:select-illustration={selectIllustration}
  />
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
