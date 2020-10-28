
<script>
  export let showName = false;
  export let size = 'medium';

  const mainLogo = 'images/postscript-medical/annotation-app/main_logo.svg';
  const mainLogoNoTitle = 'images/postscript-medical/annotation-app/main_logo_no_title.svg'

  $: src = showName ? mainLogo : mainLogoNoTitle;
  $: logoSize = ['small', 'medium', 'large'].find(entry => entry === size);
  $: className = `main-logo ${logoSize}`;
</script>

<img
  { src }
  alt="PostScript"
  class={ className }
/>

<style>

  img {
    /* Visually align with the copy */
    margin-left: 0.15rem;
  }

  .small {
    width: 2rem;
    height: 2.125rem;
  }

  .medium,
  .large {
    width: 4.4375rem;
    height: 4.125rem;
  }

@media screen and (min-width: 600px) {
    .small {
      width: 2rem;
      height: 2.125rem;
    }

    .medium {
      width: 4.4375rem;
      height: 4.125rem;
    }

    .large {
      width: 6.875rem;
      height: 6.125rem;
    }
  }
</style>