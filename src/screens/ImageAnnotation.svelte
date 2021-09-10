<script>
  import { onMount } from "svelte";
  import {
    annotatedImage,
    protectedContent,
    showFeedbackModal,
    showShareModal,
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
    TOOL_ERASER,
    TOOL_PEN,
    TOOL_SHAPE,
    TOOL_TEXT,
  } from "../constants/defaults.js";
  import FeedbackModal from "../modals/FeedbackModal.svelte";
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

  function clearErrors() {
    errorMessage = "";
  }

  function closeFeedbackModal() {
    $showFeedbackModal = false;
  }

  function closeShareModal() {
    $showShareModal = false;
  }

  function downloadImage() {
    const fileName = "myImage.jpg";
    // IE11
    if (window.navigator.msSaveBlob) {
      window.navigator.msSaveBlob($annotatedImage.msToBlob(), fileName);
    } else {
      const encodedImage = $annotatedImage.toDataURL("image/jpg", 0.7);
      const hiddenLink = document.createElement("a");

      hiddenLink.setAttribute("href", encodedImage);
      hiddenLink.setAttribute("download", fileName);
      hiddenLink.click();
    }
  }

  function selectIllustration({ detail: illustration }) {
    updateAppState(illustration.name);

    if (illustration.name !== $selectedIllustrationTitle) {
      tweenOut(() => {
        $selectedIllustrationTitle = illustration.name;
      });
    }
  }

  function selectTool({ detail: toolId }) {
    selectedToolId = toolId;
  }

  async function sendImageViaEmail({ detail: email }) {
    loading = true;

    const encodedImage = $annotatedImage.toDataURL();
    const response = await emailjs
      .send("5609467", "annotated_img", {
        image: encodedImage,
        to_email: email,
      })
      .catch((err) => {
        errorMessage = err.text;
      });

    if (response && response.status === 200) {
      emailSent = true;
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
    }).catch((error) =>
      console.error("::: Error updating app state :::", error)
    );
  }

  onMount(() => {
    selectTool({ detail: TOOL_PEN });
  });
</script>

<main>
  <SketchPad
    {pen}
    {shape}
    {selectedTool}
    {selectedToolId}
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
    on:select-illustration={selectIllustration}
    on:select-tool={selectTool}
  />
</main>

{#if $showShareModal}
  <ShareModal
    {loading}
    {emailSent}
    {errorMessage}
    on:clear-errors={clearErrors}
    on:close={closeShareModal}
    on:send-email={sendImageViaEmail}
    on:download-image={downloadImage}
  />
{/if}

{#if $showFeedbackModal}
  <FeedbackModal on:close={closeFeedbackModal} />
{/if}

<style>
  main {
    background: rgb(250, 250, 250);
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
    overflow-y: auto;
  }
</style>
