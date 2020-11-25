<script>
  import { View } from 'svench';
  import PsButton from './PsButton.svelte';

  const BUTTON_COPY = 'Button';
  const CLICK_TO_SIMULATE = 'Click to simulate load';
  const LOADING_1 = 'loading1';
  const LOADING_2 = 'loading2';
  const LOADING_3 = 'loading3';
  const LOADING_4 = 'loading4';

  let loading = false;

  function fakeLoading (target) {
    loading = target;

    setTimeout(() => {
      loading = '';
    }, 1663);
  }

</script>

<View name="Primary button">
  <PsButton>
   { BUTTON_COPY }
  </PsButton>
</View>

<View name="Primary button - disabled">
  <PsButton
    disabled
  >
   { BUTTON_COPY }
  </PsButton>
</View>

<View name="Primary button - loading">
  <PsButton
    loading={ loading === LOADING_1 }
    on:click={ () => fakeLoading(LOADING_1) }
  >
   { CLICK_TO_SIMULATE }
  </PsButton>
</View>

<View name="Primary button - inline">
  <PsButton
    inline
  >
   { BUTTON_COPY }
  </PsButton>
</View>

<View name="Primary button - inline disabled">
  <PsButton
    disabled
    inline
  >
   { BUTTON_COPY }
  </PsButton>
</View>

<View name="Primary button - inline loading">
  <PsButton
    inline
    loading={ loading === LOADING_2 }
    on:click={ () => fakeLoading(LOADING_2) }
  >
   { CLICK_TO_SIMULATE }
  </PsButton>
</View>


<View name="Secondary button">
  <PsButton
    style="secondary"
  >
   { BUTTON_COPY }
  </PsButton>
</View>

<View name="Secondary button - disabled">
  <PsButton
    disabled
    style="secondary"
  >
   { BUTTON_COPY }
  </PsButton>
</View>

<View name="Secondary button - loading">
  <PsButton
    style="secondary"
    loading={ loading === LOADING_3 }
    on:click={ () => fakeLoading(LOADING_3) }
  >
   { CLICK_TO_SIMULATE }
  </PsButton>
</View>

<View name="Secondary button - inline">
  <PsButton
    inline
    style="secondary"
  >
   { BUTTON_COPY }
  </PsButton>
</View>


<View name="Secondary button - inline disabled">
  <PsButton
    disabled
    inline
    style="secondary"
  >
   { BUTTON_COPY }
  </PsButton>
</View>

<View name="Secondary button - inline loading">
  <PsButton
    inline
    style="secondary"
    loading={ loading === LOADING_4 }
    on:click={ () => fakeLoading(LOADING_4) }
  >
   { CLICK_TO_SIMULATE }
  </PsButton>
</View>