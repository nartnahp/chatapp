<script lang="ts">
    import { goto } from '$app/navigation';
    import { session } from '$lib/stores/session';
    import { onMount } from 'svelte';

    onMount(() => {
        if ($session) {
            goto('/messages');
        } else {
            goto('/auth/log-in');
        }
    })
</script>

<style lang="postcss">
  :global(html) {
    background-color: #000;
  }
</style>