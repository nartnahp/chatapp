<script lang="ts">
    import UserProfile from '$lib/components/userProfile.svelte'
    import { currentContact } from '$lib/stores/session';
    import type { User } from '$lib/stores/auth'
    let user: User;
    currentContact.subscribe((u) => {
        user = u;
    })
</script>

<UserProfile bind:user isContact={true}/>