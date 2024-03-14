<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton';
    import Fa from 'svelte-fa'
    import { faMessage, faClose, faEdit, faUserPlus } from '@fortawesome/free-solid-svg-icons'
    import { session, currentConversation, socket, conversationsData, onlineUsersStore, isOpenUserProfile, usersStore, getUser } from '$lib/stores/session';
    import { postWithBody, getFullField, postWithFile } from '$lib/api/apiGateway';
    import { getAuth } from 'firebase/auth';
    import type { Users, User } from '$lib/stores/auth'
    import { fly, fade} from 'svelte/transition'
    import { handleCreateConversation, handleAddFriend } from '$lib/stores/functionStorage'

    export let user: User;
    export let isContact: boolean = false;
    export let isFindUser: boolean = false;
    let isOpenEditInfo: boolean = false;
    let selectedFile: string | undefined;
    let isOpenEditAvatar: boolean = false;
    let selectedDay = 1
	let selectedMonth = 1
	let selectedYear = 1900
	let selectedBirthday = '';
	let inputDisplayName: string | undefined = '';
	let inputBiography: string | undefined = '';
	let inputFirstName: string | undefined = '';
	let inputLastName: string | undefined = '';
	let inputPhoneNumber: string | undefined = '';
	let inputEmail: string | undefined = '';
	let inputAddress: string | undefined = '';
    let gender: string | undefined = '';
    if ($session) {
        inputDisplayName = user?.displayName;
        inputBiography = user?.bio;
        inputFirstName = user?.firstName;
        inputLastName = user?.lastName;
        inputPhoneNumber = user?.phoneNumber;
        inputEmail = user?.email;
        inputAddress = user?.address;
    }
    
    async function onHandleUpdateUser() {
		await postWithBody('api/auth/update', {
			userName: user?.userName,
			displayName: inputDisplayName,
			bio: inputBiography,
			firstName: inputFirstName,
			lastName: inputLastName,
			birthday: selectedBirthday,
			email: inputEmail,
			phoneNumber: inputPhoneNumber,
			address: inputAddress,
			gender: gender
		})
		.then(async res => {
			if (res.ok) {
				let updated = await res.json();
				session.set(updated);
                isOpenEditInfo = false;
			};
		})
		.catch(err => {
            console.log(err);
        });
	}

    async function handleUpdateAvatar(event) {
        event.preventDefault();
        if (selectedFile) {
            try {
                const uploadFile = document.getElementById('file-input')?.files[0];
                const formData = new FormData();
                formData.append('file', uploadFile);
                const res = await postWithFile(`api/upload/${user?._id}`, formData);
                if (res.ok) {
                    const updatedUser = await res.json();
                    session.set(updatedUser.data);
                    isOpenEditAvatar = false;
                } else {
                    throw new Error(`Error: ${await res.text()}`);
                }
            } catch (error) {
                console.error('Update avatar false', error);
            }
        }
    }

    async function onHandleCreateConversation(id: string) {
        const members = [$session?.user._id, id];
        const res = await handleCreateConversation($session?.user._id, members);
        if (res) console.log('success!');
    }

    function onSignOut() {
        const auth = getAuth();
        auth.signOut().then(()=> {
            window.location.href = "/auth/log-in";
        })
    }

</script>


<div class="flex flex-col justify-center items-center max-h-[calc(100vh-128px)] min-h-[calc(100vh-128px)] overflow-y-scroll sm:max-h-dvh h-1/3 w-full flex-1 px-4 sm:px-20" in:fade={{duration: 200}}>
    <div class="avatar flex relative sm:h-60 sm:mt-20 mt-10">
        <Avatar src={user?.avatar || '/images/default-avatar.png'} width="w-32 sm:w-60" />
        <div class="absolute flex justify-center items-center bottom-0 rounded-full text-base-content right-0 h-8 w-8 sm:h-12 sm:w-12">
            {#if !isContact}
                {#if isOpenEditAvatar}
                    <button class="hidden sm:block bg-neutral text-neutral-content border-none px-[13.5px] w-12 h-12 btn" on:click={() => isOpenEditAvatar = false}>
                        <Fa icon={faClose} size="2x"/>
                    </button>
                    <button class="sm:hidden bg-neutral text-neutral-content border-none w-8 h-8 p-0 !min-h-4 btn" on:click={() => isOpenEditAvatar = false}>
                        <Fa icon={faClose} size="lg"/>
                    </button>
                {:else}
                    <button class="hidden sm:block bg-neutral text-neutral-content border-none px-[10px] w-12 h-12 btn" on:click={() => isOpenEditAvatar = true}>
                        <Fa icon={faEdit} size="2x"/>
                    </button>
                    <button class="sm:hidden bg-neutral text-neutral-content border-none w-8 h-8 p-0 !min-h-4 btn" on:click={() => isOpenEditAvatar = true}>
                        <Fa icon={faEdit} size="lg"/>
                    </button>
                {/if}
            {/if}
        </div>
    </div>
    {#if isOpenEditAvatar}
        <form class="mt-4 p-4 bg-neutral flex flex-col justify-center items-center sm:flex-row text-neutral-content rounded-3xl brightness-125" on:submit|preventDefault={handleUpdateAvatar}>
            <input type="file" name="image" id="file-input" class="rounded-3xl" bind:value={selectedFile}>
            <button 
                type="submit" 
                class="btn {selectedFile && selectedFile !== '' ? 'bg-accent text-accent-content' : 'btn-disabled'} 
                    rounded-3xl px-2 py-1 w-48 mt-2 sm:mt-0 sm:ml-2
                    "> Upload
            </button>
        </form>
    {/if}
    <div class="flex-col flex w-full {isFindUser ? "" : "sm:border-b sm:border-b-neutral"} p-4 pb-0 sm:pb-8 sm:px-10 mt-4 sm:mt-4 max-w-2xl">
        <div class="relative w-full flex flex-1 justify-center items-center mx-30">
            {#if isOpenEditInfo}
                <div class=" flex justify-center items-center">
                    <p class="min-w-28">Tên hiển thị: </p>
                </div>
                <input type="text" class="input w-full sm:mr-16 border-b-neutral focus:border-b-neutral focus:border-t-0 focus:border-x-0 border-b text-2xl rounded-none focus:outline-none p-2" bind:value={inputDisplayName}>
            {:else}
                <h1 class=" flex text-wrap text-ellipsis overflow-hidden text-4xl">{user?.displayName || user?.email}</h1>
            {/if}
            <div class="absolute flex justify-center items-center bottom-[30px] rounded-full right-0 h-12 w-12">
                {#if !isContact}
                    {#if isOpenEditInfo}
                        <button class="hidden sm:block btn bg-transparent border-none w-12 h-12" on:click={() => isOpenEditInfo = false}>
                            <Fa icon={faClose} size="lg" />
                        </button>
                        <button class="sm:hidden btn bg-transparent border-none w-12 h-12" on:click={() => isOpenEditInfo = false}>
                            <Fa icon={faClose} size="lg" />
                        </button>
                    {:else}
                        <button class="hidden sm:block btn bg-transparent border-none w-12 h-12" on:click={() => isOpenEditInfo = true}>
                            <Fa icon={faEdit} size="lg" />
                        </button>
                        <button class="sm:hidden btn bg-transparent border-none w-12 h-12" on:click={() => isOpenEditInfo = true}>
                            <Fa icon={faEdit} size="lg" />
                        </button>
                    {/if}
                {/if}
            </div>
        </div>
        {#if isOpenEditInfo}
            {#if !isContact}
                <div class="flex flex-row justify-center">
                    <div class=" flex justify-center items-center">
                        <p class="min-w-28">Bio: </p>
                    </div>
                    <input type="text" class="input w-full sm:my-4 sm:mr-16 focus:border-b-neutral focus:border-t-0 focus:border-x-0 border-b-neutral rounded-none border-b sm:text-2xl focus:outline-none  p-2" bind:value={inputBiography}>
                </div>
            {/if}
        {:else}
            {#if user?.bio}
                <h1 class="mt-4 opacity-50 text-center text-wrap text-ellipsis overflow-hidden text-xlg">{user?.bio || ''}</h1>
            {/if}
        {/if}
    </div>
    {#if isFindUser}
        <div class="flex flex-row action-button justify-center">
            <button class="btn btn-info w-36 text-info-content mr-2"
                on:click={() =>onHandleCreateConversation(user?._id)}
            >
                <Fa icon={faMessage} class="!bg-transparent" size="lg"/>
                Nhắn tin
            </button>
            <button class="btn btn-accent text-accent-content" on:click={() => handleAddFriend(user?._id)}>
                <Fa icon={faUserPlus} class="!bg-transparent" size="lg"/>
                Thêm bạn
            </button>
        </div>
    {/if}
    <div class="user-infomation {isOpenEditInfo ? 'px-4 sm:px-10' : ''} w-full max-w-2xl flex-1">
        <div class="info-table h-full flex flex-col {isOpenEditInfo ? 'justify-center' : 'justify-between'} items-center ">
            {#if isOpenEditInfo}
                {#if !isContact}
                    <div class="flex flex-row flex-1 w-full mt-1 sm:mt-0">
                        <div class=" flex justify-center items-center">
                            <p class="min-w-28">Họ: </p>
                        </div>
                        <input type="text" class="input sm:my-2 sm:mr-16 focus:border-b-neutral focus:border-t-0 focus:border-x-0 border-b-neutral rounded-none border-bex-1 w-full focus:outline-none py-2 px-2" bind:value={inputFirstName}>
                    </div>
                    <div class="flex flex-row flex-1 w-full mt-1 sm:mt-0">
                        <div class=" flex justify-center items-center">
                            <p class="min-w-28">Tên: </p>
                        </div>
                        <input type="text" class="input sm:my-2 sm:mr-16 focus:border-b-neutral focus:border-t-0 focus:border-x-0 border-b-neutral rounded-none border-bex-1 w-full focus:outline-none py-2 px-2" bind:value={inputLastName}>
                    </div>
                    <div class="flex flex-row flex-1 w-full mt-1 sm:mt-0">
                        <div class=" flex justify-center items-center">
                            <p class="min-w-28">Số điện thoại: </p>
                        </div>
                        <input type="text" class="input sm:my-2 sm:mr-16 focus:border-b-neutral focus:border-t-0 focus:border-x-0 border-b-neutral rounded-none border-bex-1 w-full focus:outline-none py-2 px-2" bind:value={inputPhoneNumber}>
                    </div>
                    <div class="flex flex-row flex-1 w-full mt-1 sm:mt-0">
                        <div class=" flex justify-center items-center">
                            <p class="min-w-28">Email: </p>
                        </div>
                        <input type="text" disabled={true} class="input sm:my-2 sm:mr-16 border-b-neutral border-b flex-1 w-full focus:outline-none py-2" bind:value={inputEmail}>
                    </div>
                    <div class="flex flex-row flex-1 w-full mt-1 sm:mt-0">
                        <div class=" flex justify-center items-center">
                            <p class="min-w-28">Ngày sinh: </p>
                        </div>
                        <input type="text" class="input sm:my-2 sm:mr-16 focus:border-b-neutral focus:border-t-0 focus:border-x-0 border-b-neutral rounded-none border-bex-1 w-full focus:outline-none py-2 px-2" bind:value={inputDisplayName}>
                    </div>
                    <div class="flex flex-row flex-1 w-full mt-1 sm:mt-0">
                        <div class=" flex justify-center items-center">
                            <p class="min-w-28">Giới tính: </p>
                        </div>
                        <input type="text" class="input sm:my-2 sm:mr-16 focus:border-b-neutral focus:border-t-0 focus:border-x-0 border-b-neutral rounded-none border-bex-1 w-full focus:outline-none py-2 px-2" bind:value={inputDisplayName}>
                    </div>
                    <div class="flex flex-row flex-1 w-full mt-1 sm:mt-0">
                        <div class=" flex justify-center items-center">
                            <p class="min-w-28">Địa chỉ: </p>
                        </div>
                        <input type="text" class="input sm:my-2 sm:mr-16 focus:border-b-neutral focus:border-t-0 focus:border-x-0 border-b-neutral rounded-none border-bex-1 w-full focus:outline-none py-2 px-2" bind:value={inputAddress}>
                    </div>
                    <div class="button">
                        <button class="btn bg-accent text-accent-content mt-4 w-48" on:click={() => onHandleUpdateUser()}>Cập nhật</button>
                    </div>
                {/if}
            {:else}
                {#if !isFindUser}
                    <div class="flex py-4 flex-row w-full">
                        <div class="row-left opacity-50 flex-1">
                            <p class="my-4">Họ: </p>
                            <p class="my-4">Tên: </p>
                            <p class="my-4">Số điện thoại:</p>
                            <p class="my-4">Email:</p>
                            <p class="my-4">Ngày sinh:</p>
                            <p class="my-4">Giới tính:</p>
                            <p class="my-4">Địa chỉ:</p>
                        </div>
                        <div class="row-right w-full flex-1">
                            <p class="my-4">{user?.firstName || '/'}</p>
                            <p class="my-4">{user?.lastName || '/'}</p>
                            <p class="my-4">{user?.phoneNumber || '/'}</p>
                            <p class="my-4">{user?.email || '/'}</p>
                            <p class="my-4">{user?.birthday || '/'}</p>
                            <p class="my-4">{user?.gender || '/'}</p>
                            <p class="my-4">{user?.address || '/'}</p>
                        </div>
                    </div>
                    {#if !isContact}
                        <button class="btn w-48 bg-neutral text-neutral-content" on:click={() => onSignOut()}>Đăng xuất</button>
                    {/if}
                {/if}
            {/if}
        </div>
    </div>
</div>