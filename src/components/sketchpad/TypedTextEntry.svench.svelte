<script>
  import { View } from "svench";
  import TypedTextEntry from "./TypedTextEntry.svelte";

  let content = "";
  let x = 50;
  let y = 50;
  let color = "#0000ff";
</script>

<View>
  <TypedTextEntry {x} {y} {content} {color} />
</View>
