<script lang="ts">
    import { contactsData, 
        currentContact, 
        isOpenContact, 
        onlineUsersStore, 
        isCreateNewConversation,  } from '$lib/stores/session';
	import { Avatar } from '@skeletonlabs/skeleton';
    import Fa from 'svelte-fa'
    import { faUserPlus } from '@fortawesome/free-solid-svg-icons'
    import { goto } from '$app/navigation';
    import { fly, fade} from 'svelte/transition'
    import { InputChip } from '@skeletonlabs/skeleton';
    export let isAddContact: boolean = false;

    let q = '';
    let searchMemberInput = ''
    let selectedMembers: string[] = [];
    let inputChip: InputChip;

    $: ticketData = $onlineUsersStore && $contactsData;
    $: members = $contactsData.map((c) => c.email);
    $: console.log('selectedMembers', selectedMembers)
    $: console.log('members', members)

    function onSelectContact(contactId: string) {
        goto(`/contacts/${contactId}`);
        const findContact = $contactsData?.find((c) => c._id == contactId);
        if (findContact) currentContact.set(findContact);
        isOpenContact.set(true);
    }
    
    function isValidMember(value: string): boolean {
        return members.includes(value);
    }
    
</script>

{#if $isCreateNewConversation}
    <div class="sm:hidden h-dvh max-h-[calc(100vh-128px)] flex flex-col flex-1" in:fade={{duration: 200}}>
        <InputChip bind:input={searchMemberInput} bind:value={selectedMembers} name="chips" validation={isValidMember} chips="bg-neutral px-2 rounded-xl"/>
        {#await ticketData}
            <h1>Loading contacts ticket</h1>
        {:then tickets}    
            {#each tickets as ticket}
                <div class="flex flex-col px-4">
                    <button class="form-control">
                        <label class="label cursor-pointer p-0  w-full">
                            <input type="checkbox" checked="checked" class="checkbox" />
                            <div class="flex flex-row h-full w-full my-2 justify-center items-center">
                                <div class="avatar mx-4 relative">
                                    <div class="h-16 rounded-full">
                                        <img src={ticket?.avatar} alt={ticket?.displayName || ticket?.email}/>
                                    </div>
                                </div>
                                <div class="flex flex-1 w-full border-t h-full border-t-neutral py-2">
                                    <div class="ticket-info w-full max-w-[calc(100%-80px)] flex flex-col items-start justify-center overflow-hidden">
                                        <span class="text-start line-clamp-1 {ticket._id === $currentContact?._id ? '' : 'text-neutral-content'} mb-2 text-lg ">
                                            {ticket.displayName || ticket.email}
                                        </span>
                                        <span class="text-start opacity-50 line-clamp-2 font-medium {ticket._id === $currentContact?._id ? '' : 'text-neutral-content'}">
                                            {ticket.bio || ''}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </label>
                    </button>
                    <!-- <button 
                        class="btn border-none w-full pr-0 btn-mobile h-20" 
                        on:click={() => onSelectContact(ticket._id)}
                    >
                        <div class="flex flex-row h-full w-full justify-center items-center">
                            <div class="avatar mr-2 relative">
                                <div class="h-16 rounded-full">
                                    <img src={ticket?.avatar} alt={ticket?.displayName || ticket?.email}/>
                                </div>
                            </div>
                            <div class="flex flex-1 pr-4 max-w-[calc(100%-80px)] border-t py-4 h-full border-t-neutral">
                                <div class="ticket-info w-full max-w-[calc(100%-80px)] flex flex-col items-start justify-between overflow-hidden">
                                    <span class="text-start line-clamp-1 {ticket._id === $currentContact?._id ? '' : 'text-neutral-content'} mb-2 text-lg ">
                                        {ticket.displayName || ticket.email}
                                    </span>
                                    <span class="text-start opacity-50 line-clamp-2 font-medium {ticket._id === $currentContact?._id ? '' : 'text-neutral-content'}">
                                        {ticket.bio || ''}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </button> -->
                </div>
            {/each}
        {/await}
    </div>
{:else}
<!-- Desktop -->
    <div class="contact-listing-screen overflow-y-scroll h-dvh hidden sm:block p-4 pt-2 min-w-28 max-w-28 lg:min-w-80 lg:max-w-80 border-r border-solid border-r-neutral">
        <div class="header h-20 flex flex-row justify-center lg:justify-between items-center">
            <h1 class=" hidden lg:block font-bold text-lg">Danh bạ</h1>
            <button 
                type="button" 
                class="btn btn-ghost px-0 lg:!bg-transparent h-16" 
                on:click={() => isAddContact = true}
            >
                <Fa icon={faUserPlus} size="lg" />
            </button>
        </div>
        <div class="search-input">
            <label class="label px-0">
                <input class="input w-full bg-neutral h-10 border-0 focus:outline-none px-2  rounded-md" type="email" placeholder="Tìm kiếm" bind:value={q}/>
            </label>
        </div>
        <div class="contact-listing">
            <div class="space-y-4 overflow-y-auto">
                <div class="flex flex-col space-y-1">
                    {#await ticketData}
                        <h1>Loading contacts</h1>
                    {:then tickets}    
                        {#each tickets as ticket}
                            <button
                                type="button"
                                class="btn max-w-full h-full rounded-md p-2 flex items-center {ticket._id === $currentContact?._id
                                    ? ''
                                    : 'bg-neutral'}"
                                on:click={() => onSelectContact(ticket._id)}
                            >
                                <div class="relative avatar">
                                    <Avatar src={ticket.avatar} width="w-16" />
                                </div>
                                <div class="flex-1 hidden lg:flex flex-col h-full text-start w-full overflow-hidden">
                                    <span class="text-start line-clamp-2 {ticket._id === $currentContact?._id ? '' : 'text-neutral-content'} mb-2 font-medium text-ellipsis overflow-hidden ">
                                        {ticket.displayName || ticket.email}
                                    </span>
                                    <span class="text-start opacity-50 line-clamp-2 {ticket._id === $currentContact?._id ? '' : 'text-neutral-content'}">
                                        {ticket.bio || ''}
                                    </span>
                                </div>
                            </button>
                        {/each}
                    {/await}
                </div>
            </div>
        </div>
    </div>
<!-- Mobile -->
    <div class="sm:hidden h-full flex flex-col flex-1" in:fade={{duration: 200}}>
        {#await ticketData}
            <h1>Loading contacts ticket</h1>
        {:then tickets}    
            {#each tickets as ticket}
                <div class="flex flex-col">
                    <button 
                        class="btn border-none w-full pr-0 btn-mobile h-20" 
                        on:click={() => onSelectContact(ticket._id)}
                    >
                        <div class="flex flex-row h-full w-full justify-center items-center">
                            <div class="avatar mr-2 relative">
                                <div class="h-16 rounded-full">
                                    <img src={ticket?.avatar} alt={ticket?.displayName || ticket?.email}/>
                                </div>
                            </div>
                            <div class="flex flex-1 pr-4 max-w-[calc(100%-80px)] border-t py-4 h-full border-t-neutral">
                                <div class="ticket-info w-full max-w-[calc(100%-80px)] flex flex-col items-start justify-between overflow-hidden">
                                    <span class="text-start line-clamp-1 {ticket._id === $currentContact?._id ? '' : 'text-neutral-content'} mb-2 text-lg ">
                                        {ticket.displayName || ticket.email}
                                    </span>
                                    <span class="text-start opacity-50 line-clamp-2 font-medium {ticket._id === $currentContact?._id ? '' : 'text-neutral-content'}">
                                        {ticket.bio || ''}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </button>
                </div>
            {/each}
        {/await}
    </div>
{/if}