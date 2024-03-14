<script lang="ts">
    import { postWithBody } from '$lib/api/apiGateway';
    import type { Users, User } from '$lib/stores/auth'
    import { session } from '$lib/stores/session';
    import Fa from 'svelte-fa'
    import { handleFindUser, handleAddFriend } from '$lib/stores/functionStorage'
    import { faMessage, faUser, faContactBook, faMagnifyingGlass, faPlus, faArrowLeft, faEllipsis, faUserPlus } from '@fortawesome/free-solid-svg-icons'

    let inputEmail: string = '';
    let isFinding: boolean = true;
    let findOutUser: User;
    async function onHandleFindUser() {
        findOutUser = await handleFindUser(inputEmail);
        isFinding = false;
    };
    
    // async function onHandleAddFriend(id: string) {
    //     try {
    //         const res = await postWithBody('api/auth/update', {contacts: id, email: $session?.user.email});
    //         if (res.ok) {
    //             session.set(await res.json());
    //             console.log('success!');
    //         }
    //     } catch (error) {
    //         console.log(error);
    //     }
    // }
</script>
{#if isFinding}
    <div class="h-full w-full p-4">
        <form class="" on:submit|preventDefault={onHandleFindUser}>
            <label class="form-control w-full flex flex-col items-center justify-center">
                <div class="label mb-2 w-full">
                <span class="label-text">Nhập email cần tìm kiếm</span>
                </div>
                <input type="email" placeholder="Email..." class="input focus:outline-none input-bordered w-full" bind:value={inputEmail}/>
                <button class="btn bg-accent text-accent-content w-32 mt-4" type=submit>Tìm</button>
            </label>
        </form>
    </div>
{:else}
    <div class="h-full w-full p-4">
        <div class="avatar pt-12 pb-4 flex justify-center">
            <div class="w-24 rounded-full">
                <img src={findOutUser.avatar} alt={findOutUser.displayName || findOutUser.email}/>
            </div>
        </div>
        <h1 class=" text-center font-bold text-lg">{findOutUser?.displayName || findOutUser?.email}</h1>
        <div class="flex flex-row action-button justify-center mt-4 ">
            <button class="btn btn-info w-36 text-info-content mr-2">
                <Fa icon={faMessage} class="!bg-transparent" size="lg"/>
                Nhắn tin
            </button>
            <button class="btn btn-accent text-accent-content" on:click={() => handleAddFriend(findOutUser?._id)}>
                <Fa icon={faUserPlus} class="!bg-transparent" size="lg"/>
            </button>
        </div>
    </div>
{/if}