<script lang="ts">
    import UserProfile from '$lib/components/userProfile.svelte'
    import { session } from '$lib/stores/session';
    import type { User } from '$lib/stores/auth'

    let user: User;
    session.subscribe((u) => {
        user = u?.user;
    })

</script>

<UserProfile bind:user />
