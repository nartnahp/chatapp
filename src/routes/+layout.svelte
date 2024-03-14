<script lang="ts">
    import '../app.css';  
    import { goto } from '$app/navigation';
    import { session, socket, onlineUsersStore } from '$lib/stores/session';
    import { currentTheme } from '$lib/stores/localStorage';
    import { onMount } from 'svelte';
    import { postWithBody } from '$lib/api/apiGateway';
    import '$lib/firebase';
    import { getAuth } from 'firebase/auth';
    import { browser } from '$app/environment';
	  import { io } from 'socket.io-client';
    import { apiUrl } from "$lib/env"
    import { page } from '$app/stores';
    let selectedTheme: string;

    onMount(() => {
      setTimeout(() => {
        if ($session) {
          if ($page.route.id == '/') goto('/messages');
        } else {
          goto('/auth/log-in');
        }
      }, 1000)
    })

    if (browser) {
        const auth = getAuth();
        auth.onAuthStateChanged(function(user) {
            if (user) {
                autoLogin(user.email);
            }
        });
        selectedTheme  = localStorage.getItem('currentTheme');
    }
    
    async function autoLogin(email: string | null) {
        try {
            const res = await postWithBody('api/auth/get-auth', {email});
            if (res.ok) {
                const authRes = await res.json();
                session.update((u) => u = authRes);
                $socket = io(apiUrl);
                if ($socket) {
                    $socket?.emit('addUser', $session?.user._id);
                    $socket?.on('getUsers', users => onlineUsersStore.set(users));
                };
            } else {
                session.set(undefined);
                goto('/auth/log-in');
                let errMsg = await res.json();
                console.log(errMsg);
            }
        } catch (error) {
            console.log(error)
        }
    }
</script>
<div data-theme={$currentTheme ? $currentTheme : selectedTheme}>
  <slot />
</div>

<style lang="postcss">
  :global(html) {
    background-color: #000;
  }
</style>