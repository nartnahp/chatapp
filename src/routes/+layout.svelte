<script lang="ts">
    import "../app.css";
    import { page } from '$app/stores';
    import { session, socket, onlineUsersStore, conversationsData, isOpenUserProfile } from '$lib/stores/session';
    import type { OnlineUsers, Users } from '$lib/stores/auth'
    import Fa from 'svelte-fa'
    import { faMessage } from '@fortawesome/free-solid-svg-icons'
    import { faContactBook } from '@fortawesome/free-solid-svg-icons'
    import { Avatar } from '@skeletonlabs/skeleton';
    import { onMount } from 'svelte';
    import { postWithBody } from '$lib/api/apiGateway';
    import '$lib/firebase';
    import { getAuth } from 'firebase/auth';
    import { browser } from '$app/environment';
	import { io } from 'socket.io-client';
    import { apiUrl } from "$lib/env"
    import { goto } from '$app/navigation';

    if (browser) {
        const auth = getAuth();
        auth.onAuthStateChanged(function(user) {
            if (user) {
                autoLogin(user.email);
            }
        });
    }
    
    function onSignOut() {
        const auth = getAuth();
        auth.signOut().then(()=> {
            window.location.href = "/auth/log-in";
        })
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
                let errMsg = await res.json();
                console.log(errMsg);
            }
        } catch (error) {
            console.log(error)
        }
    }

    $: if ($onlineUsersStore) $conversationsData.map((c) => c.onlineStatus = getOnlineStatus(c.members, $onlineUsersStore));
    $: console.log('onlineUsersStore', $onlineUsersStore)
    
    function getOnlineStatus(members: string[], usersStore: OnlineUsers) {
        let status: string | undefined = '';
        if (members.length < 2) status = 'online';
        if (members.length == 2) {
            const getUserIdToCheckStatus = members.find((u) => u != $session?.user._id);
            if (getUserIdToCheckStatus) status = usersStore.find((u) => u.userId == getUserIdToCheckStatus)?.status;
        }
        if (members.length > 2) {
            const getUserIdToCheckStatus = members.filter((u) => u != $session?.user._id);
            const membersStatus = usersStore.filter((u) => {
                if (getUserIdToCheckStatus.includes(u.userId)) return u.status;
            });
            if (membersStatus.filter((status) => status.status == 'online')) status = 'online';
            else return status = 'offline';
        }
        else {
            console.log('status end', status)
        }
        return status;
    }
// $: console.log('conversationsData', $conversationsData)
    function handleSelectMenu(path: string) {
        if ($page.url.pathname !== path) goto(path);;
        isOpenUserProfile.set(false);
    }
    
    let avatarSource: string | undefined = '/images/default-avatar.png';
    
    onMount(() => {
        if ($session?.user.avatar && $session?.user.avatar != '') avatarSource = $session?.user.avatar;
    })
    $: avatarSource = $session?.user.avatar
    
</script>

<div class="relative">
    {#if $session}
        <div class="bg-[#3c3c3c] min-w-screen max-w-unset min-h-screen max-h-screen flex flex-row">
            <div class="menu flex flex-1 flex-col justify-between py-4 px-2 max-w-20">
                <div class="navigation">
                    <div class="btn icon mb-4 flex rounded-md justify-center h-16 {$page.url.pathname === '/messages' ?
                        'variant-filled-primary' : 
                        'bg-surface-hover-token'}
                    ">
                        <button class="" on:click={() => handleSelectMenu('/messages')}>
                            <Fa icon={faMessage} size="2x" color="#fff" />
                        </button>
                    </div>
                    <div class="btn icon flex rounded-md justify-center h-16 {$page.url.pathname === '/contacts' ?
                        'variant-filled-primary' : 
                        'bg-surface-hover-token'}
                    ">
                        <button on:click={() => handleSelectMenu('/contacts')}>
                            <Fa icon={faContactBook} size="2x" color="#fff" />
                        </button>
                    </div>
                </div>
                <div class="setting">
                    <div class="avatar flex justify-center">
                        <button on:click={onSignOut}>
                            logout
                        </button>
                    </div>
                    <div class="avatar flex justify-center">
                        <button on:click={() => isOpenUserProfile.set(true)}>
                            <Avatar src={avatarSource} rounded="rounded-full" />
                        </button>
                    </div>
                </div>
            </div>
            <div class="main-screen flex-1 h-full w-full">
                <slot />
            </div>
        </div>
    {:else}
        <slot />
    {/if}
</div>