<script lang="ts">
    import { session, 
        isOpenConversation, 
        currentConversation, 
        conversationsData, 
        isCreateNewConversation, 
        isOpenAddFriend } from '$lib/stores/session';
    import { handleCreateConversation, getAllConversationData, handleGetContacts } from '$lib/stores/functionStorage'
    import type { Users, User } from '$lib/stores/auth'
    import type { Conversation } from '$lib/stores/conversation'
    import type { AutocompleteOption } from '@skeletonlabs/skeleton';
    import ConversationTicket from '$lib/components/conversationComponents/conversationTicket.svelte'
    import { InputChip } from '@skeletonlabs/skeleton';
    import { Autocomplete } from '@skeletonlabs/skeleton';   
	import { Avatar } from '@skeletonlabs/skeleton';
    import Fa from 'svelte-fa'
    import { faInfoCircle } from '@fortawesome/free-solid-svg-icons'
    import ConversationInfo from '$lib/components/conversationComponents/conversationInfo.svelte'
    import AddFriend from '$lib/components/addFriend.svelte'
    import { page } from '$app/stores';
    import { onMount } from 'svelte';

    let inputSearchReceiver = '';

    let isOpenConversationInfo: boolean = false;
    let selectedReceivers: string[] = [];
    let selectedReceiversId: string[] = [];
    let receivers: Users = [];
    let options: AutocompleteOption<string>[] = [];

    onMount(() => {
    })
    $: if ($page.params.id && $conversationsData) currentConversation.set($conversationsData.find((c) => c._id == $page.params.id));
    
    if ($session) {
        getContacts();
        getAllConversationData($session?.user?._id);
    }

    // $: if ($currentConversation) onSelectConversation($currentConversation._id);

    type FlavorOption = AutocompleteOption<string, { healthy: boolean }>
    function onSelection(event: CustomEvent<FlavorOption>): void {
		if (selectedReceivers.includes(event.detail.value) === false) {
			selectedReceivers = [...selectedReceivers, event.detail.value];
			inputSearchReceiver = '';
            if (selectedReceivers.length) {
                selectedReceivers.filter((u) => {
                    const selectedConversation = $conversationsData?.find((c) => c.members.includes(u._id))
                    if (selectedConversation) currentConversation.set(selectedConversation);
                    console.log('$currentConversation', $currentConversation)
                })
            }
		}
        
	}
    $: if (selectedReceivers.length > 0) selectedReceiversId = receivers.filter((u) => selectedReceivers.includes(u.email)).map((u) => u._id);
    $: console.log('Page', $page)

    async function getContacts() {
        try {
            const res = await handleGetContacts();
            if (res) {
                options = res.options;
                receivers = res.receivers
            }
        } catch (error) {
            console.log(error);
        }
    }

    async function onCreateConversation() {
        const members = [...selectedReceiversId, $session?.user._id];
        const res = await handleCreateConversation($session?.user._id, members);
        if (res) {
            selectedReceivers = [];
            isCreateNewConversation.set(false);
        } else console.log('false');
    }
</script>

<div class="w-full min-h-screen">
    <!-- Desktop -->
    <div class="w-full hidden sm:min-h-screen sm:flex flex-row">
        <ConversationTicket bind:selectedReceivers/>
        <div class="w-full min-h-screen">
            <div class="w-full hidden sm:flex flex-row">
                <div class="relative conversation-screen w-full h-full max-w-[calc(100%-111px) ]lg:max-w-[calc(100%-320px)] max-h-dvh flex flex-col flex-1">
                    <div class="z-10 p-4 text-neutral-content absolute w-full bg-neutral header min-h-20 flex flex-col justify-end">
                        {#if $isCreateNewConversation}
                            <form on:submit={onCreateConversation}>
                                <div class="flex flex-row justify-center items-center">
                                    <div class="">
                                        <h2>Gửi đến:</h2>
                                    </div>
                                    <div class="flex-1 mx-4">      
                                        <InputChip 
                                            allowDuplicates={false} 
                                            bind:input={inputSearchReceiver}
                                            bind:value={selectedReceivers}
                                            name="chips" 
                                            placeholder="Nhập email người nhận" 
                                            chips="bg-neutral px-2 rounded-xl"
                                        />
                                        <div class="relative">
                                            {#if selectedReceivers.length < options.length}
                                                <div class="absolute bg-neutral rounded-md w-fit max-w-sm max-h-48 p-4 overflow-y-auto" tabindex="-1">
                                                    <Autocomplete
                                                        bind:input={inputSearchReceiver}
                                                        options={options}
                                                        denylist={selectedReceivers}
                                                        on:selection={onSelection}
                                                        regionList="w-fit"
                                                        regionNav="w-fit"
                                                        regionButton="btn my-1 w-full max-w-60 text-start bg-base-100 text-base-content"
                                                        emptyState="Không tìm thấy người nhận, hãy thêm bạn trước"
                                                        regionEmpty="text-error"
                                                        limit={3}
                                                    />
                                                </div>
                                            {/if}
                                        </div>
                                    </div>
                                    <button 
                                        type="button" 
                                        class="btn-icon {selectedReceivers.length ? 'text-base-content' : 'text-neutral-content'} " 
                                        on:click={onCreateConversation}
                                    >
                                        Tạo
                                    </button>
                                </div>
                            </form>
                        {:else}
                            <div class="flex flex-rol flex-1 justify-between items-center">
                                <div class="flex flex-rol items-center">
                                    {#if $currentConversation}
                                        {#if $currentConversation.members.length > 2}
                                            <div class="relative flex justify-between min-h-12 min-w-12">
                                                <div class="absolute top-0 right-0 avatar">
                                                    <Avatar border="border-2 border-zinc-800" src={$currentConversation?.avatar[0]} width="w-8" />
                                                </div>
                                                <div class="absolute bottom-0 left-0 avatar">
                                                    <Avatar border="border-2 border-zinc-800" src={$currentConversation?.avatar[1]} width="w-8" />
                                                </div>
                                            </div>
                                        {:else}
                                            <Avatar src={$currentConversation?.avatar} width="w-12" />
                                        {/if}
                                    {/if}
                                    <h1 class="ml-3  font-bold text-lg">{$currentConversation?.displayName || 'Chọn cuộc hội thoại để tiếp tục'}</h1>
                                </div>
                                {#if $currentConversation}
                                    <div class="conversation-active flex justify-center items-center">
                                        <button class="text-accent hover:brightness-125" on:click={() => isOpenConversationInfo = !isOpenConversationInfo}>
                                            <Fa icon={faInfoCircle} size="lg" />
                                        </button>
                                    </div>
                                {/if}
                            </div>
                        {/if}
                    </div>
                    <slot />   
                </div>
                {#if isOpenConversationInfo}
                    <ConversationInfo />
                {/if}
            </div>
        </div>
    </div>
    <!-- Mobile -->
    <div class="sm:hidden h-full">
        {#if !$isOpenConversation}
            {#if $isOpenAddFriend}
                <AddFriend />
            {:else}
                <ConversationTicket bind:selectedReceivers/>
            {/if}

        {:else}        
            <slot />
        {/if}
    </div>
</div>