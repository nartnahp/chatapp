<script lang="ts">
    import { session, currentConversation, socket, conversationsData, onlineUsersStore, isOpenUserProfile, usersStore, getUser } from '$lib/stores/session';
	import { Avatar } from '@skeletonlabs/skeleton';
    import Fa from 'svelte-fa'
    import { faSquarePlus, faSearch, faBell, faPaperPlane, faUser, faClose, faEdit, faInfoCircle } from '@fortawesome/free-solid-svg-icons'
    import { getElapsedTime } from '$lib/stores/functionStores'
    import type { Message, Messages, MessageStatus } from '$lib/stores/message'

    export let isCreateNewConversation: boolean = false;
    let selectedReceivers: string[] = [];
    let q = '';
	export let elemChat: HTMLElement;

    $: ticketData = $onlineUsersStore && $conversationsData;

    export function scrollToBottom() {
    }

    function getConversationLastMessage(messages: Messages, isGetElapsedTime?: boolean, isGetStatus?: boolean) {
        // console.log('messages', messages);
        if (messages && messages.length > 0) {
            const messageData = messages[messages.length -1];
            if (isGetElapsedTime) {
                const elapsedTime = getElapsedTime(messageData.createdAt, true);
                return '· ' + elapsedTime;
            } else if (isGetStatus) {
                if (messageData.receivers.length == 2) {
                    if (messageData.sender._id == $session?.user._id) {
                        const status = messageData.status.find((s) => s.receiverId != $session?.user._id)?.status;
                        if (status == 'sent') return 'Chưa nhận';
                        if (status == 'delivered') return 'Đã nhận';
                        if (status == 'received') return 'Đã xem';
                    } else {
                        const status = messageData.status.find((s) => s.receiverId == $session?.user._id)?.status;
                        if (status == 'delivered') return 'Đã nhận';
                        if (status == 'received') return 'disable';
                    }
                } else if (messageData.receivers.length > 2) {
                    if (messageData.sender._id == $session?.user._id) {
                        const modifiedMessageData = messageData.status.filter((s) => s.receiverId != $session?.user._id);
                        const checkStatus = modifiedMessageData.some((status) => status.status == 'delivered') 
                        if (checkStatus) return 'Đã nhận';
                        const received = modifiedMessageData.filter((s) => s.status == 'received');
                        if (received) return received;
                    } else {

                    }
                    const status = messageData.status.find((s) => s.receiverId == $session?.user._id)?.status;
                }
            } else {
                if (messageData.sender._id == $session?.user._id) return `Bạn: ${messageData.text}`;
                else return messageData.text
            }
        }
    }

    function onSelectConversation(conversationId: string) {
        const findConversation = $conversationsData?.find((c) => c._id == conversationId);
        if (findConversation) currentConversation.set(findConversation);
        if (elemChat) scrollToBottom();
        isOpenUserProfile.set(false);
    }

    function getNewMessagesDisplayName() {
        const displayName = 'Trò chuyện với '
        if (selectedReceivers.length == 1) return displayName + selectedReceivers[0];
        else if (selectedReceivers.length > 1) return displayName + selectedReceivers.toString().replaceAll(',', ' và ');
        else if (!selectedReceivers.length) return 'Hội thoại mới';
    }

</script>

<div class="conversation-listing-screen p-4 pt-2 min-w-28 max-w-28 lg:min-w-80 lg:max-w-80 border-r border-solid border-r-zinc-700">
    <div class="header h-20 flex flex-row justify-center lg:justify-between items-center">
        <h1 class="text-white hidden lg:block font-bold text-lg">Chats</h1>
        <button 
            type="button" 
            class="btn-icon lg:!bg-transparent w-16 h-16 input-group-shim" 
            on:click={() => isCreateNewConversation = true}
        >
            <Fa icon={faEdit} size="lg" color="#ffffff" />
        </button>
    </div>
    <div class="search-input my-2">
        <label class="label">
            <input class="input bg-[#3a3b3c] h-10 border-0 focus:outline-none px-2 text-white rounded-md" type="email" placeholder="Tìm kiếm" bind:value={q}/>
        </label>
    </div>
    <div class="conversation-listing">
        <div class="space-y-4 overflow-y-auto">
            <div class="flex flex-col space-y-1">
                {#if isCreateNewConversation}
                    <div class="card flex justify-center items-center bg-zinc-800 brightness-125 p-2 mt-1">
                        <div class="avatar flex justify-center items-center rounded-full bg-zinc-700 bg-opacity-40 w-16 h-16">
                            <Fa icon={faUser} size="2x" color="#ffffff" />
                        </div>
                        <div class="flex-1 overflow-hidden max-h-16 text-ellipsis px-2">
                            {#key selectedReceivers}
                                <span class="text-white max-h-16 text-ellipsis font-medium">{getNewMessagesDisplayName()}</span>
                            {/key}
                        </div>
                        <div class="butt flex justify-center items-center p-2 rounded-full bg-zinc-700 brightness-150 w-8 h-8">
                            <button class="button" on:click={() => isCreateNewConversation = false}>
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
                            class="btn max-w-full rounded-md px-2 flex items-center {ticket._id === $currentConversation?._id
                                ? 'variant-filled-primary'
                                : 'bg-surface-hover-token'}"
                            on:click={() => onSelectConversation(ticket._id)}
                        >
                            {#if Array.isArray(ticket.avatar) && ticket.members.length > 2}
                                <div class="relative flex justify-between w-16 h-16">
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
                                <span class="text-start mb-2 font-medium text-ellipsis overflow-hidden text-white">
                                    {ticket.displayName}
                                </span>
                                <div>
                                    <span class="text-white opacity-50 text-sm">{getConversationLastMessage(ticket.messages)  || ''}</span>
                                    <span class="text-white opacity-50 text-sm">{getConversationLastMessage(ticket.messages, true)  || ''}</span>
                                    <span class="text-white opacity-50 text-sm">{getConversationLastMessage(ticket.messages, false, true)  || ''}</span>
                                </div>
                            </div>
                        </button>
                    {/each}
                {/await}
            </div>
        </div>
    </div>
</div>