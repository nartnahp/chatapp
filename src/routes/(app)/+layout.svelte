<script lang="ts">
    import '../../app.css';
    import { page } from '$app/stores';
    import { session, 
        isOpenConversation, 
        currentContact, 
        isOpenContact, 
        onlineUsersStore, 
        conversationsData, 
        isOpenUserProfile, 
        isOpenConversationInfo, 
        currentConversation, 
        isOpenAddFriend,
        isCreateNewConversation } from '$lib/stores/session';
    import type { OnlineUsers, Users } from '$lib/stores/auth'
    import Fa from 'svelte-fa'
    import { faMessage, faUser, faContactBook, faMagnifyingGlass, faPlus, faArrowLeft, faEllipsis, faUserPlus } from '@fortawesome/free-solid-svg-icons'
    import { Avatar } from '@skeletonlabs/skeleton';
    import { onMount } from 'svelte';
    import '$lib/firebase';
    import { goto } from '$app/navigation';
    import { fly, fade } from 'svelte/transition'
    import ContactTicket from '$lib/components/contactComponents/contactTicket.svelte'

    $: if ($onlineUsersStore) $conversationsData?.map((c) => c.onlineStatus = getOnlineStatus(c.members, $onlineUsersStore));
    $: console.log('$onlineUsersStore',$onlineUsersStore)    
    $: console.log('$conversationsData',$conversationsData)    

    function getOnlineStatus(members: string[], usersStore: OnlineUsers) {
        console.log('members', members)
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
        }
        return status;
    }
    function handleSelectMenu(path: string) {
        if ($page.url.pathname !== path) goto(path);;
        isOpenUserProfile.set(false);
        isOpenConversation.set(false);
        isOpenContact.set(false);
    }
    
    let avatarSource: string | undefined = '/images/default-avatar.png';
    
    onMount(() => {
        if ($session?.user.avatar && $session?.user.avatar != '') avatarSource = $session?.user.avatar;
    })
    $: avatarSource = $session?.user.avatar
    function onClickBack() {
        if (!$isOpenConversationInfo) isOpenConversation.set(false);
        if ($isOpenContact) isOpenContact.set(false);
        if ($isOpenAddFriend) isOpenAddFriend.set(false);
        else isOpenConversationInfo.set(false);
    };

    function onClickDetail() {
        isOpenConversationInfo.set(true);
    };

    function onClickAddFriend() {
        isOpenAddFriend.set(true);
    }

    function onClickCreateNewConversation() {
        isCreateNewConversation.set(true)
    }
</script>

<div class="relative overflow-hidden">
    {#if $session}
    <!-- Desktop -->
        <div class=" hidden sm:flex min-w-screen max-w-unset min-h-screen max-h-screen flex-row">
            <div class="menu bg-neutral flex flex-1 flex-col justify-between py-4 px-2 max-w-20">
                <div class="navigation text-neutral-content">
                    <div class="btn icon mb-4 flex rounded-md justify-center h-16 {$page.url.pathname.startsWith('/messages') ?
                        'bg-accent text-accent-content' : 
                        ''}
                    ">
                        <button class="" on:click={() => handleSelectMenu('/messages')}>
                            <Fa icon={faMessage} size="2x" />
                        </button>
                    </div>
                    <div class="btn icon flex rounded-md justify-center h-16 {$page.url.pathname.startsWith('/contacts') ?
                        'bg-accent text-accent-content' : 
                        ''}
                    ">
                        <button on:click={() => handleSelectMenu('/contacts')}>
                            <Fa icon={faContactBook} size="2x" />
                        </button>
                    </div>
                </div>
                <div class="setting">
                    <div class="avatar flex justify-center">
                        <button on:click={() => handleSelectMenu('/user')}>
                            <Avatar src={$session?.user.avatar} rounded="rounded-full" />
                        </button>
                    </div>
                </div>
            </div>
            <div class="main-screen flex-1 h-full w-full">
                <slot />
            </div>
        </div>
    <!-- Mobile -->
        <div class="sm:hidden">
            {#if !($page.url.pathname === '/user')}
                <div class="navbar fixed bg-neutral z-10">
                    <div class="flex-none">
                        {#if $isOpenConversation || $isOpenAddFriend || $isOpenContact}
                            <button class="btn btn-square btn-ghost"
                                in:fade={{duration: 100}}
                                on:click={onClickBack}
                            >
                                <Fa icon={faArrowLeft} size="lg" />
                            </button>
                        {:else}
                            <button class="btn btn-square btn-ghost"
                                in:fade={{duration: 100}}>
                                <Fa icon={faMagnifyingGlass} size="lg" />
                            </button>
                        {/if}
                    </div>
                    <div class="flex-1 flex justify-center">
                        {#if !$isOpenConversation && !$isOpenAddFriend && !$isOpenContact}
                            <input type="text" placeholder="Tìm kiếm" class="input focus:outline-none input-ghost w-full max-w-xs" />
                        {:else if $isOpenAddFriend}
                            <p class="text-neutral-content mr-8">Thêm bạn bè</p>
                        {:else if $isOpenContact}
                            <p class="text-neutral-content">{$currentContact?.displayName || $currentContact?.email}</p>
                        {:else}
                            <p class="text-neutral-content line-clamp-1">{$currentConversation?.displayName}</p>
                        {/if}
                    </div>
                    <div class="flex-none">
                        {#if !$isOpenConversation && !$isOpenAddFriend && !$isOpenContact}
                            <div class="dropdown dropdown-end">
                                <div tabindex="0" role="button" class="btn bg-neutral text-neutral-content border-none">
                                    <Fa icon={faPlus} size="lg" />
                                </div>
                                <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
                                <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow rounded-box w-52 bg-neutral text-neutral-content">
                                    <li>
                                        <button class="btn bg-neutral text-neutral-content border-none !flex flex-row px-2 justify-start"
                                            on:click={onClickCreateNewConversation}
                                        >
                                            <Fa icon={faMessage} size="lg" class="mr-2"/>
                                            Trò chuyện mới
                                        </button>    
                                    </li>
                                    <li>
                                        <button class="btn bg-neutral text-neutral-content border-none !flex flex-row px-2 justify-start"
                                            on:click={(onClickAddFriend)}
                                        >
                                            <Fa icon={faUserPlus} size="lg" class="mr-2"/>
                                            Thêm bạn bè
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        {:else}
                            {#if !$isOpenConversationInfo && !$isOpenAddFriend || $isOpenContact}
                                <button class="btn btn-square btn-ghost"
                                    on:click={onClickDetail}
                                    in:fade={{duration: 100}}>
                                    <Fa icon={faEllipsis} size="lg" />
                                </button>
                            {/if}
                        {/if}
                    </div>
                </div>
            {/if}
            <div class="sm:hidden block h-16"/>
            <div class="main-screen flex flex-1 max-h-[calc(100vh-64px)] h-full w-full relative">
                {#if $isCreateNewConversation}
                    <div class="h-full w-full">
                        <ContactTicket />
                    </div>
                {:else if $isOpenAddFriend}
                {:else}
                    <slot />
                {/if}
            </div>
            <div class="sm:hidden">
                {#if !$isOpenConversation && !$isOpenContact}
                    <div class="btm-nav bg-neutral" out:fly={{y: 100, duration: 100}} in:fly={{y: 100, duration: 100}}>
                        <button 
                            class="{$page.url.pathname === '/messages' ? 'active': ''}"
                            on:click={() => handleSelectMenu('/messages')}
                        >
                            <Fa icon={faMessage} size="lg" />
                            <span class="btm-nav-label text-neutral-content text-sm ">Trò chuyện</span>
                        </button>
                        <button 
                            class="{$page.url.pathname === '/contacts' ? 'active': ''}"
                            on:click={() => handleSelectMenu('/contacts')}
                        >
                            <Fa icon={faContactBook} size="lg" />
                            <span class="btm-nav-label text-neutral-content text-sm ">Danh bạ</span>
                        </button>
                        <button 
                            class="{$page.url.pathname === '/user' ? 'active': ''}"
                            on:click={() => handleSelectMenu('/user')}
                        >
                            <Fa icon={faUser} size="lg" />
                            <span class="btm-nav-label text-neutral-content text-sm ">Tôi</span>
                        </button>
                    </div>
                {/if}
            </div>
        </div>
    {:else}
        <!-- <slot /> -->
    {/if}
</div>