<script lang="ts">
    import { session, isClickedTicket, isOpenContact, currentContact, socket, contactsData, onlineUsersStore, isOpenUserProfile, usersStore, getUser, isOpenAddFriend } from '$lib/stores/session';
    import { afterUpdate } from 'svelte';
    import { postWithBody, getFullField, postWithFile } from '$lib/api/apiGateway';
    import { handleFindUser, handleAddFriend, getAllConversationData, handleGetContacts } from '$lib/stores/functionStorage'
    import type { Users, User } from '$lib/stores/auth'
    import type { Conversation } from '$lib/stores/conversation'
    import type { AutocompleteOption } from '@skeletonlabs/skeleton';
    import ContactTicket from '$lib/components/contactComponents/contactTicket.svelte'
    import UserProfile from '$lib/components/userProfile.svelte'
    import { page } from '$app/stores';
    import { onMount } from 'svelte';

    let inputSearchContact = '';
    let isAddContact: boolean = false;
    let findOutUser: User;

    let receivers: Users = [];
    let options: AutocompleteOption<string>[] = [];

    onMount(() => {
    })
    $: if ($page.params.id && $contactsData) currentContact.set($contactsData.find((c) => c._id == $page.params.id));
    
    if ($session) {
        getContacts();
        getAllConversationData($session?.user?._id);
    }

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
    async function onHandleFindUser() {
        findOutUser = await handleFindUser(inputSearchContact);
    }
    $: console.log('isAddContact', isAddContact)
    $: console.log('findOutUser', findOutUser)
</script>

<div class="w-full min-h-screen">
    <!-- Desktop -->
    <div class="w-full hidden min-h-screen sm:flex flex-row">
        <ContactTicket bind:isAddContact />
        <div class="flex flex-col w-full h-full">
            {#if isAddContact}
                <div class="w-full bg-neutral text-neutral-content min-h-20 max-h-20">
                    {#if findOutUser}
                        <div class="w-full h-20 flex justify-center items-center">
                            <h1 class="font-bold text-lg">{findOutUser?.displayName || findOutUser?.email}</h1>
                        </div>
                    {:else}
                        <form on:submit={() => onHandleFindUser()} class="h-full w-full">
                            <div class="w-full h-full p-4 flex flex-row justify-center items-center">
                                <div class="">
                                    <h2>Tìm kiếm:</h2>
                                </div>
                                <div class="flex-1 mx-4"> 
                                    <input type="text" placeholder="Nhập email người dùng cần tìm kiếm" class="input w-full focus:outline-none" bind:value={inputSearchContact} />
                                </div>
                                <button 
                                    type="submit" 
                                    class="btn-icon {inputSearchContact != '' ? 'text-base-content' : 'text-neutral-content'}"
                                >
                                    Tìm
                                </button>
                            </div>
                        </form>
                    {/if}
                </div>
                {#if findOutUser}
                    <UserProfile isFindUser={true} user={findOutUser} isContact={true}/>
                {/if}
            {/if}
            {#if !findOutUser}
                <slot />
            {/if}
        </div>
    </div>
    <!-- Mobile -->
    <div class="sm:hidden min-h-screen flex-row h-full">
        {#if !$isOpenContact}
            <ContactTicket bind:isAddContact />
        {:else}
            <slot />
        {/if}
    </div>
</div>