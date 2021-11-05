<script>
  import Icon from "./Icon.svelte";
</script>

<Icon>
  <title>Icon: Printer</title>
  <g fill="none" stroke="black">
    <!-- Paper -->
    <path
      d="M7,8
        v-7
        h10
        v7"
    />
    <!-- Printer body -->
    <path
      d="M1,23
        h22
        v-10
        q0,-4 -4,-4
        h-14
        q-4,0 -4,4
        Z"
    />
    <!-- Printer tray -->
    <path
      d="M5,17
        h14
        v6
        h-14
        Z"
    />
  </g>
</Icon>
