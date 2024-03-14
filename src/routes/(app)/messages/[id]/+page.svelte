<script lang="ts">
    import { goto } from '$app/navigation';
    import { session, currentConversation, isClickedTicket, conversationsData, getUser, isOpenConversationInfo } from '$lib/stores/session';
    import { handleSendMessage } from '$lib/stores/functionStorage'
    import { onMount } from 'svelte';
    import Fa from 'svelte-fa'
    import { faPaperPlane } from '@fortawesome/free-solid-svg-icons'
    import type { Users } from '$lib/stores/auth'
    import { fly } from 'svelte/transition'
    import ConversationInfo from '$lib/components/conversationComponents/conversationInfo.svelte'

    onMount(() => {
        setTimeout(() => {
            if (!$session) goto('/auth/log-in');
        }, 1000); 
        if ($isClickedTicket) setTimeout(() => {
            scrollToBottom(elemChat, 'auto');
        }, 100) 
    })

    let inputMessage = '';

    let selectedReceivers: string[] = [];
    let selectedReceiversId: string[] = [];
    let receivers: Users = [];
	let elemChat: HTMLElement;

    const scrollToBottom = async (node:HTMLElement, behavior: ScrollBehavior) => {
        node.scroll({ top: node.scrollHeight, behavior});
        isClickedTicket.set(false);
    }; 
    $: if (selectedReceivers.length > 0) selectedReceiversId = receivers.filter((u) => selectedReceivers.includes(u.email)).map((u) => u._id);
    $: currentConversationData = $conversationsData && $currentConversation;

	function onSendMessage(message: string) {
        handleSendMessage(message);
        inputMessage = '';
        setTimeout(() => {
            scrollToBottom(elemChat, 'smooth');
        }, 100);
    }

	function onPromptKeydown(event: KeyboardEvent): void {
		if (['Enter'].includes(event.code)) {
			event.preventDefault();
			onSendMessage(inputMessage);
		};
	};

    function getMessageAvatar(userId: string) {
        if (userId) return getUser(userId);
    }

</script>

<div class="flex flex-col max-h-dvh h-full overflow-hidden flex-1">
    <section bind:this={elemChat} 
        class="flex-1 border-y border-solid border-y-neutral p-4 sm:min-h-[calc(100dvh-72px)] max-h-[calc(100%-136px)] sm:max-h-full sm:pt-24 overflow-y-auto space-y-4"
        out:fly={{x: 500, duration: 100}} in:fly={{x: 500, duration: 100, delay: 100}}
    >
        {#await currentConversationData}
            <h1>Loading messages</h1>
        {:then conversations} 
            {#if conversations && conversations.messages.length}
                {#each conversations.messages as message, i}
                    {#if message.sender !== $session?.user._id}
                        <div class="chat chat-start !mt-0 !pt-0">
                            <div class="chat-image avatar">
                                <div class="w-10 rounded-full">
                                    <img alt={message.sender} src={getMessageAvatar(message.sender)?.avatar} />
                                </div>
                            </div>
                            {#if i == 0 || conversations.members.length > 2 && conversations.messages[i - 1] && conversations.messages[i].sender !== conversations.messages[i - 1].sender}
                                <div class="chat-header">
                                    {getMessageAvatar(message.sender)?.displayName || getMessageAvatar(message.sender)?.email}
                                    <time class="text-xs opacity-50">12:45</time>
                                </div>
                            {/if}
                            <div class="chat-bubble text-neutral-content">{message.text}</div>
                            <div class="chat-footer opacity-50">
                            <!-- Delivered -->
                            </div>
                        </div>
                    {:else}
                        <div class="chat chat-end !mt-0 !pt-0">
                            <div class="chat-image avatar">
                                <div class="w-10 rounded-full">
                                    <img alt={$session?.user.displayName} src={$session?.user.avatar} />
                                </div>
                            </div>
                            {#if conversations.members.length > 2 && conversations.messages[i - 1] && 
                                conversations.messages[i].sender !== conversations.messages[i - 1].sender
                            }
                                <div class="chat-header">
                                    {$session?.user.displayName || $session?.user.email}
                                    <time class="text-xs opacity-50">12:46</time>
                                </div>
                            {/if}
                            <div class="chat-bubble chat-bubble-accent text-accent-content">{message.text}</div>
                            {#if !conversations.messages[i + 1] || 
                                conversations.messages[i].sender !== conversations.messages[i + 1].sender
                            }
                                <div class="chat-footer opacity-50">
                                Seen at 12:46
                                </div>
                            {/if}
                        </div>
                    {/if}
                {/each}
            {/if}
        {/await}
    </section>
    <section class=" p-4" out:fly={{y: 100, duration: 100}} in:fly={{y: 100, duration: 100, delay: 100}}>
        <div class="flex">
            <button class="!bg-transparent  input-group-shim">+</button>
            <input
                bind:value={inputMessage}
                class="focus:outline-none bg-neutral border-0 h-10  flex-1 mx-4 px-2 ring-0  rounded-3xl"
                name="prompt"
                id="prompt"
                placeholder="Nhập tin nhắn..."
                on:keydown={onPromptKeydown}
            />
            <button class="!bg-transparent {inputMessage ? 'text-accent' : ''}" on:click={() => onSendMessage(inputMessage)}>
                <Fa icon={faPaperPlane} class="!bg-transparent"/>
            </button>
        </div>
    </section>
</div>
{#if $isOpenConversationInfo}
    <div class="sm:hidden absolute w-full z-10 top-0 left-0">
        <ConversationInfo />
    </div>
{/if}
