<script lang="ts">
    import { session, 
        isOpenConversation, 
        currentConversation, 
        isClickedTicket, 
        conversationsData, 
        onlineUsersStore, 
        isOpenUserProfile, 
        isCreateNewConversation } from '$lib/stores/session';
	import { Avatar } from '@skeletonlabs/skeleton';
    import Fa from 'svelte-fa'
    import { faUser, faClose, faEdit } from '@fortawesome/free-solid-svg-icons'
    import { getElapsedTime } from '$lib/stores/functionStorage'
    import type { Messages } from '$lib/stores/message'
    import { goto } from '$app/navigation';
    import { fly, fade } from 'svelte/transition'

    export let selectedReceivers: string[] = [];

    let q = '';

    $: ticketData = $onlineUsersStore && $conversationsData;

    function getConversationLastMessage(messages: Messages, isGetElapsedTime?: boolean, isGetStatus?: boolean) {
        if (messages && messages.length > 0) {
            const messageData = messages[messages.length -1];
            if (isGetElapsedTime) {
                return getElapsedTime(messageData.createdAt, true);
            } else if (isGetStatus) {
                if (messageData.receivers.length == 1) {
                    if (messageData.sender == $session?.user._id) {
                        const status = messageData.status.find((s) => s.receiverId != $session?.user._id)?.status;
                        if (status == 'sent') return 'Chưa nhận';
                        if (status == 'delivered') return 'Đã nhận';
                        if (status == 'received') return 'Đã xem';
                    } else {
                        const status = messageData.status.find((s) => s.receiverId == $session?.user._id)?.status;
                        if (status == 'delivered') return 'Đã nhận';
                        if (status == 'received') return 'disable';
                    }
                } else if (messageData.receivers.length > 1) {
                    if (messageData.sender == $session?.user._id) {
                        const modifiedMessageData = messageData.status.filter((s) => s.receiverId != $session?.user._id);
                        const checkStatus = modifiedMessageData.some((status) => status.status == 'delivered') 
                        if (checkStatus) return 'Đã nhận';
                        const received = modifiedMessageData.filter((s) => s.status == 'received');
                        if (received) return received;
                    } else {
                        const status = messageData.status.find((s) => s.receiverId == $session?.user._id)?.status;
                    }
                }
            } else {
                if (messageData.sender == $session?.user._id) return `Bạn: ${messageData.text}`;
                else return messageData.text
            }
        }
    }

    function onSelectConversation(conversationId: string) {
        const findConversation = $conversationsData?.find((c) => c._id == conversationId);
        if (findConversation) currentConversation.set(findConversation);
        goto(`/messages/${conversationId}`);
        isOpenConversation.set(true);
        isClickedTicket.set(true);
        isOpenUserProfile.set(false);
    }

    function getNewMessagesDisplayName() {
        const displayName = 'Trò chuyện với '
        if (selectedReceivers.length == 1) return displayName + selectedReceivers[0];
        else if (selectedReceivers.length > 1) return displayName + selectedReceivers.toString().replaceAll(',', ' và ');
        else if (!selectedReceivers.length) return 'Hội thoại mới';
    }

</script>

<!-- Desktop -->
    <div class="conversation-listing-screen overflow-y-scroll h-dvh hidden sm:block p-4 pt-2 min-w-28 max-w-28 lg:min-w-80 lg:max-w-80 border-r border-solid border-r-neutral">
        <div class="header h-20 flex flex-row justify-center lg:justify-between items-center">
            <h1 class=" hidden lg:block font-bold text-lg">Chats</h1>
            <button 
                type="button" 
                class="btn btn-ghost px-0 lg:!bg-transparent h-16" 
                on:click={() => isCreateNewConversation.set(true)}
            >
                <Fa icon={faEdit} size="lg" />
            </button>
        </div>
        <div class="search-input">
            <label class="label px-0">
                <input class="input w-full bg-neutral h-10 border-0 focus:outline-none px-2  rounded-md" type="email" placeholder="Tìm kiếm" bind:value={q}/>
            </label>
        </div>
        <div class="conversation-listing">
            <div class="space-y-4 overflow-y-auto">
                <div class="flex flex-col space-y-1">
                    {#if $isCreateNewConversation}
                        <div class="flex justify-center rounded-md bg-neutral items-center h-full brightness-125 p-2 mt-1">
                            <div class="avatar flex justify-center items-center rounded-full  w-16 h-16">
                                <Fa icon={faUser} size="2x" color="#ffffff" />
                            </div>
                            <div class="flex-1 overflow-hidden max-h-16 text-ellipsis px-2">
                                {#key selectedReceivers}
                                    <span class=" max-h-16 text-ellipsis font-medium">{getNewMessagesDisplayName()}</span>
                                {/key}
                            </div>
                            <div class="butt flex justify-center items-center p-2 rounded-full  brightness-150 w-8 h-8">
                                <button class="button" on:click={() => isCreateNewConversation.set(false)}>
                                    <Fa icon={faClose} size="1x" color="#ffffff" />
                                </button>
                            </div>
                            <!-- <button class="button bg-transparent">
                            </button> -->
                        </div>
                    {/if}
                    {#await ticketData}
                        <h1>Loading chats ticket</h1>
                    {:then tickets}    
                        {#each tickets as ticket}
                            <button
                                type="button"
                                class="btn max-w-full h-full rounded-md p-2 flex items-center {ticket._id === $currentConversation?._id
                                    ? ''
                                    : 'bg-neutral'}"
                                on:click={() => onSelectConversation(ticket._id)}
                            >
                                {#if Array.isArray(ticket.avatar) && ticket.members.length > 2}
                                    <div class="relative flex justify-between text-accent-content w-16 h-16">
                                        <div class="absolute top-0 right-0 avatar">
                                            <Avatar border="border-2 border-zinc-800" src={ticket.avatar[0]} width="w-12" />
                                        </div>
                                        <div class="absolute bottom-0 left-0 avatar">
                                            <Avatar border="border-2 border-zinc-800" src={ticket.avatar[1]} width="w-12" />
                                        </div>
                                        {#if ticket.onlineStatus && ticket.onlineStatus !== 'offline'}
                                            <div class="online-status bottom-0 right-0 absolute rounded-full bg-[#30a24c] h-4 w-4"/>
                                            {#if ticket.onlineStatus !== 'online'}
                                                <div class="online-status bottom-0 border-2 border-zinc-800 right-[-5px] absolute rounded-full bg-[#284a2c]">
                                                    {#if ticket.onlineStatus !== 'online'}
                                                        <p class="text-[#30a24c] font-bold text-xs px-1">{getElapsedTime(ticket.onlineStatus) || ''}</p>
                                                    {/if}
                                                </div>
                                            {/if}
                                        {/if}
                                    </div>
                                {:else}    
                                    <div class="relative avatar">
                                        <Avatar src={ticket.avatar} width="w-16" />
                                        {#if ticket.onlineStatus && ticket.onlineStatus !== 'offline'}
                                            {#if ticket.onlineStatus === 'online'}
                                                <div class="online-status bottom-0 right-0 absolute rounded-full bg-[#30a24c] h-4 w-4"/>
                                            {:else if ticket.onlineStatus !== 'online' && getElapsedTime(ticket.onlineStatus, false, true) !== 'disable'}
                                                <div class="online-status bottom-0 border-2 border-zinc-800 right-[-5px] absolute rounded-full bg-[#284a2c]">
                                                    {#if ticket.onlineStatus !== 'online'}
                                                        <p class="text-[#30a24c] font-bold text-xs px-1">{getElapsedTime(ticket.onlineStatus) || ''}</p>
                                                    {/if}
                                                </div>
                                            {/if}
                                        {/if}
                                    </div>
                                {/if}
                                <div class="flex-1 hidden lg:flex flex-col h-full text-start w-full overflow-hidden">
                                    <span class="text-start line-clamp-2 {ticket._id === $currentConversation?._id ? '' : 'text-neutral-content'} mb-2 font-medium text-ellipsis overflow-hidden ">
                                        {ticket.displayName}
                                    </span>
                                    <div>
                                        <span class=" opacity-50 line-clamp-1 {ticket._id === $currentConversation?._id ? '' : 'text-neutral-content'} text-sm">{getConversationLastMessage(ticket.messages)  || ''}</span>
                                    </div>
                                </div>
                                <div class="flex-1 hidden lg:flex flex-col h-full max-w-fit items-end overflow-hidden justify-between">
                                    <span class="w-fit opacity-50 {ticket._id === $currentConversation?._id ? '' : 'text-neutral-content'} text-sm">{getConversationLastMessage(ticket.messages, true)  || ''}</span>
                                    <span class="w-fit opacity-50 {ticket._id === $currentConversation?._id ? '' : 'text-neutral-content'} text-sm">{getConversationLastMessage(ticket.messages, false, true)  || ''}</span>                               
                                </div>
                            </button>
                        {/each}
                    {/await}
                </div>
            </div>
        </div>
    </div>
<!-- Mobile -->
<div>
    <div class="sm:hidden h-full flex flex-col flex-1" in:fade={{duration: 200}}>
        {#await ticketData}
            <h1>Loading chats ticket</h1>
        {:then tickets}    
            {#each tickets as ticket}
                <div class="flex flex-col" >
                    <button 
                        class="btn border-none w-full pr-0 btn-mobile h-20"
                        on:click={() => onSelectConversation(ticket._id)}
                    >
                        <div class="flex flex-row h-full w-full justify-center items-center">
                            <div class="avatar mr-2 relative">
                                {#if ticket?.members?.length > 2}
                                    <div class=" flex justify-between text-accent-content w-16 h-16">
                                        <div class="absolute top-0 right-0 avatar">
                                            <Avatar border="border-2 border-zinc-800" src={ticket.avatar[0]} width="w-12" />
                                        </div>
                                        <div class="absolute bottom-0 left-0 avatar">
                                            <Avatar border="border-2 border-zinc-800" src={ticket.avatar[1]} width="w-12" />
                                        </div>
                                        {#if ticket.onlineStatus && ticket.onlineStatus !== 'offline'}
                                            <div class="online-status bottom-0 right-0 absolute rounded-full bg-[#30a24c] h-4 w-4"/>
                                            {#if ticket.onlineStatus !== 'online'}
                                                <div class="online-status bottom-0 border-2 border-zinc-800 right-[-5px] absolute rounded-full bg-[#284a2c]">
                                                    {#if ticket.onlineStatus !== 'online'}
                                                        <p class="text-[#30a24c] font-bold text-xs px-1">{getElapsedTime(ticket.onlineStatus) || ''}</p>
                                                    {/if}
                                                </div>
                                            {/if}
                                        {/if}
                                    </div>
                                {:else}
                                    <div class="h-16 rounded-full">
                                        <img src={ticket?.avatar} />
                                        {#if ticket.onlineStatus && ticket.onlineStatus !== 'offline'}
                                            {#if ticket.onlineStatus === 'online'}
                                                <div class="online-status bottom-0 right-0 absolute rounded-full bg-[#30a24c] h-4 w-4"/>
                                            {:else if ticket.onlineStatus !== 'online' && getElapsedTime(ticket.onlineStatus, false, true) !== 'disable'}
                                                <div class="online-status bottom-0 border-2 border-zinc-800 right-[-5px] absolute rounded-full bg-[#284a2c]">
                                                    {#if ticket.onlineStatus !== 'online'}
                                                        <p class="text-[#30a24c] font-bold text-xs px-1">{getElapsedTime(ticket.onlineStatus) || ''}</p>
                                                    {/if}
                                                </div>
                                            {/if}
                                        {/if}
                                    </div>
                                {/if}
                            </div>
                            <div class="flex flex-1 pr-4 max-w-[calc(100%-80px)] border-t py-4 h-full border-t-neutral">
                                <div class="ticket-info w-full max-w-[calc(100%-80px)] flex flex-col items-start justify-between overflow-hidden">
                                    <span class="text-start line-clamp-1 {ticket._id === $currentConversation?._id ? '' : 'text-neutral-content'} mb-2 font-medium ">
                                        {ticket.displayName}
                                    </span>
                                    <span class="font-normal text-start max-w-full line-clamp-1 opacity-50 {ticket._id === $currentConversation?._id ? '' : 'text-neutral-content'} text-sm">{getConversationLastMessage(ticket.messages)  || ''}</span>
                                </div>
                                <div class="min-w-20 flex flex-col items-end justify-between">
                                    <span class="font-normal opacity-50 {ticket._id === $currentConversation?._id ? '' : 'text-neutral-content'} text-sm">{getConversationLastMessage(ticket.messages, true)  || ''}</span>
                                    <span class="font-normal opacity-50 {ticket._id === $currentConversation?._id ? '' : 'text-neutral-content'} text-sm">{getConversationLastMessage(ticket.messages, false, true)  || ''}</span>
                                </div>
                            </div>
                        </div>
                    </button>
                </div>
            {/each}
        {/await}
    </div>
</div>