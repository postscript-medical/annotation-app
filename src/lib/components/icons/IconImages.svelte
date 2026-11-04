<script lang="ts">
	import Icon from './Icon.svelte';
</script>

<Icon title="Icon: Images">
	<g fill="none" stroke="black">
		<!-- Frame -->
		<path
			d="M6,1
          H21
          Q23,1 23,3
          V18
          Q23,20 21,20
          H5
          Q4,20 4,18
          V3
          Q4,1 6,1
          Z"
		/>

		<!-- Under frame -->
		<path
			d="M1,3
          V22
          Q1,23 3,23
          H22
        "
		/>

		<!-- Mountain -->
		<path
			d="M4,16
          l6,-3
          l13,5"
		/>

		<!-- Sun -->
		<circle cx="15" cy="7" r="2" />
	</g>
</Icon>
