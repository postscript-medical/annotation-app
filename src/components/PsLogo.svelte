
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
  .small {
    width: 3rem;
    height: 3.125rem;
  }

  .medium {
    width: 5.4375rem;
    height: 5.125rem;
  }

  .large {
    width: 7.875rem;
    height: 7.125rem;
  }
</style>