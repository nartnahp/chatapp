<script lang="ts">
    import "../../../app.css";
    import { page } from '$app/stores';
    import { session, socket, onlineUsersStore, conversationsData, isOpenUserProfile } from '$lib/stores/session';
    import type { OnlineUsers, Users } from '$lib/stores/auth'
    import Fa from 'svelte-fa'
    import { faMessage, faUser, faContactBook, faMagnifyingGlass, faPlus } from '@fortawesome/free-solid-svg-icons'
    import { Avatar } from '@skeletonlabs/skeleton';
    import { onMount } from 'svelte';
    import { postWithBody } from '$lib/api/apiGateway';
    import '$lib/firebase';
    import { getAuth } from 'firebase/auth';
    import { browser } from '$app/environment';
	import { io } from 'socket.io-client';
    import { apiUrl } from "$lib/env"
    import { goto } from '$app/navigation';


</script>

<div class="relative overflow-hidden">
    <slot />
</div>