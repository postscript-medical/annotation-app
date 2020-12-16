<script>
  export let showName = false;
  export let size = "medium";

  const mainLogo = "images/postscript-medical/annotation-app/main_logo.svg";
  const mainLogoNoTitle =
    "images/postscript-medical/annotation-app/main_logo_no_title.svg";

  $: src = showName ? mainLogo : mainLogoNoTitle;
  $: logoSize = ["small", "medium", "large"].find((entry) => entry === size);
  $: className = `main-logo ${logoSize}`;
</script>

<img {src} alt="PostScript" class={className} />

<style>
  .x-small {
    width: 2rem;
    height: 2.125rem;
  }

  .small {
    width: 2.75rem;
    height: 3rem;
  }

  .medium,
  .large {
    width: 4.125rem;
    height: 4.4375rem;
  }

  @media screen and (min-width: 600px) {
    .large {
      width: 6.125rem;
      height: 6.875rem;
    }
  }
</style>
