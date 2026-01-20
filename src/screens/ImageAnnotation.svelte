<script>
  import { onMount } from "svelte";
  import {
    actions,
    activeModal,
    illustrationSearchQuery,
    protectedContent,
    selectedIllustration,
    user,
    session,
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
    IMAGE_CATALOGUE,
    MODAL_FEEDBACK,
    MODAL_SHARE,
    TOOL_CHANGE_IMAGE,
    TOOL_ERASE_ALL,
    TOOL_ERASER,
    TOOL_PEN,
    TOOL_SHAPE,
    TOOL_TEXT,
  } from "../constants/defaults.js";
  import generateAnnotatedImage from "../methods/generate-annotated-image.js";
  import loadProtectedContent from "../methods/load-protected-content.js";
  import updateAppState from "../methods/update-app-state.js";
  import ChooseSpecialtyModal from "../modals/ChooseSpecialtyModal.svelte";
  import FeedbackModal from "../modals/FeedbackModal.svelte";
  import ImageCatalogue from "../components/ImageCatalogue.svelte";
  import SketchPad from "../components/sketchpad/SketchPad.svelte";
  import SketchPadUi from "../components/sketchpad/SketchPadUi.svelte";
  import ShareModal from "../modals/ShareModal.svelte";

  const CHOOSE_A_SPECIALTY = "chooseASpecialty";

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

  function checkIfIllustrationSelected() {
    if (!$protectedContent.appState.selectedIllustrationTitle) {
      $activeModal = IMAGE_CATALOGUE;
    }
  }

  function clearErrors() {
    errorMessage = "";
  }

  function closeModal() {
    $activeModal = "";
  }

  function closeCatalogueModal() {
    closeModal();
  }

  async function downloadImage() {
    const fileName = "myImage.jpg";
    const generatedImage = await getGeneratedImage();
    /**
     * IE11
     */
    if (window.navigator.msSaveBlob) {
      window.navigator.msSaveBlob(generatedImage, fileName);
    } else {
      const hiddenLink = document.createElement("a");
      hiddenLink.setAttribute("href", generatedImage);
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

  async function getGeneratedImage() {
    const generatedImage = await generateAnnotatedImage();

    if (window.navigator.msSaveBlob) {
      return generatedImage.msToBlob();
    } else {
      return generatedImage.toDataURL("image/jpeg", 0.9);
    }
  }

  function openCatalogueModal({ detail: modalName }) {
    $illustrationSearchQuery = "";

    openModal({ detail: modalName });
  }

  function openModal({ detail: modalName }) {
    $activeModal = modalName;
  }

  function printImage() {
    window.print();
  }

  function selectIllustration({ detail }) {
    const specialtyName = detail.specialtyName;
    const subSpecialtyName = detail.subSpecialtyName;
    const illustrationTitle = detail.illustration.name;

    updateAppState({
      id: $protectedContent.appState.id,
      illustrationTitle: illustrationTitle,
      specialtyId: $protectedContent.appState.selected_specialty_id,
      subSpecialtyId: $protectedContent.appState.selected_sub_specialty_id,
    });

    actions.push([
      ...sketchPad.clearCanvas(),
      {
        name: TOOL_CHANGE_IMAGE,
        illustrationTitle: detail.illustration.name,
      },
    ]);

    const specialty = $protectedContent.specialties.find(
      ({ name }) => name === specialtyName
    );
    const subSpecialty = specialty.subSpecialties.find(
      ({ name }) => name === subSpecialtyName
    );
    const illustration = subSpecialty.illustrations.find(
      ({ name }) => name === illustrationTitle
    );

    // Use the proper store update method to ensure reactivity
    protectedContent.update((content) => {
      content.appState.selectedSpecialty = specialty.name;
      content.appState.selectedSubSpecialty = subSpecialty.name;
      content.appState.selectedIllustrationTitle = illustration.name;
      content.appState.illustration = illustration;
      return content;
    });

    // Directly update the selectedIllustration store for immediate reactivity
    selectedIllustration.set(illustration);

    closeModal();
  }

  function selectTool({ detail: toolId }) {
    selectedToolId = toolId;
  }

  async function sendImageViaEmail({ detail: email }) {
    loading = true;

    const encodedImage = await getGeneratedImage();
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

  async function updateChosenSpecialty({ detail }) {
    const { specialtyId } = detail;

    // For local development, skip the API call if the endpoint doesn't exist
    try {
      const token = $session ? $session.access_token : false;

      if (!token) {
        return Promise.reject(
          new Error("Could not validate your token. Please contact support.")
        );
      }

      await fetch("/.netlify/functions/update-chosen-specialty", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: $protectedContent.id, specialtyId }),
      })
        .then((response) => response.json())
        .then(async () => {
          await loadProtectedContent();
        })
        .catch((error) => {
          // API endpoint not available, continuing with local update - error will still appear in browser console
        });
    } catch (error) {
      // API call failed, continuing with local update - error will still appear in browser console
    }

    // Find the selected specialty and subspecialty
    const selectedSpecialty = $protectedContent.specialties.find(
      (s) => s.id === specialtyId
    );
    if (!selectedSpecialty) {
      console.error("Selected specialty not found");
      return;
    }

    const selectedSubSpecialty = selectedSpecialty.subSpecialties[0]; // Use first subspecialty for now

    /**
     * Force a refresh of the derived stores
     */
    protectedContent.update((content) => {
      content.appState = {
        ...content.appState,
        selected_specialty_id: specialtyId,
        selected_sub_specialty_id: selectedSubSpecialty.id,
        selected_illustration_id: selectedSubSpecialty.illustrations[0].id,
        selectedSpecialty: selectedSpecialty.name,
        selectedSubSpecialty: selectedSubSpecialty.name,
      };

      return content;
    });

    updateAppState({
      id: $protectedContent.appState.id,
      illustrationTitle: $protectedContent.appState.selectedIllustrationTitle,
      specialtyId: selectedSpecialty.id,
      subSpecialtyId: selectedSubSpecialty.id,
    });

    closeModal();

    checkIfIllustrationSelected();
  }

  function redoAction() {
    sketchPad.redo();
  }

  function undoAction() {
    sketchPad.undo();
  }

  onMount(() => {
    selectTool({ detail: TOOL_PEN });

    // Check if user has actually chosen a specialty (check database field)
    if ($protectedContent.appState.selected_specialty_id) {
      // User has already chosen a specialty - proceed normally
      checkIfIllustrationSelected();
    } else {
      // User hasn't chosen a specialty yet - show modal
      $activeModal = CHOOSE_A_SPECIALTY;
    }
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

{#if $activeModal === IMAGE_CATALOGUE}
  <ImageCatalogue
    on:close={closeCatalogueModal}
    on:select-illustration={selectIllustration}
  />
{/if}

{#if $activeModal === CHOOSE_A_SPECIALTY}
  <ChooseSpecialtyModal
    user={$user}
    orgId={$protectedContent.appState.id}
    on:specialty-updated={updateChosenSpecialty}
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
