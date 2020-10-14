
<script>
  export let showName = false;

  const mainLogo = 'images/v1602670400/postscript-medical/annotation-app/main_logo.svg';
  const mainLogoNoTitle = 'images/v1602670400/postscript-medical/annotation-app/main_logo_no_title.svg'

  $: src = showName ? mainLogo : mainLogoNoTitle;
  $: className = 'main-logo ' + (showName ? '' : 'no-title');
</script>

<img
  { src }
  alt="PostScript"
  class={ className }
/>

<style>
  .main-logo {
    height: 114px;
    width: 136px;
  }
</style>