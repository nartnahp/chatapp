<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton';
    import Fa from 'svelte-fa'
    import { faSquarePlus, faSearch, faBell, faPaperPlane, faUser, faClose, faEdit, faInfoCircle } from '@fortawesome/free-solid-svg-icons'
    import { session, currentConversation, socket, conversationsData, onlineUsersStore, isOpenUserProfile, usersStore, getUser } from '$lib/stores/session';
    import { postWithBody, getFullField, postWithFile } from '$lib/api/apiGateway';

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
        inputDisplayName = $session?.user.displayName;
        inputBiography = $session?.user.bio;
        inputFirstName = $session?.user.firstName;
        inputLastName = $session?.user.lastName;
        inputPhoneNumber = $session?.user.phoneNumber;
        inputEmail = $session?.user.email;
        inputAddress = $session?.user.address;
    }
    
    async function onHandleUpdateUser() {
		await postWithBody('api/auth/update', {
			userName: $session?.user.userName,
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
                const res = await postWithFile(`api/upload/${$session?.user._id}`, formData);
                if (res.ok) {
                    const updatedUser = await res.json();
                    session.set(updatedUser.data);
                } else {
                    throw new Error(`Error: ${await res.text()}`);
                }
            } catch (error) {
                console.error('Update avatar false', error);
            }
        }
    }

</script>


<div class="flex flex-col justify-center items-center max-h-dvh h-1/3 w-full flex-1 px-20">
    <div class="avatar flex relative h-60 mt-20">
        <Avatar src={$session?.user.avatar || '/images/default-avatar.png'} width="w-60" />
        <div class="absolute flex justify-center items-center bottom-0 rounded-full hover:bg-[#3D82F6] bg-zinc-700 bg-opacity-40 right-0 h-16 w-16">
            {#if isOpenEditAvatar}
                <button class="button" on:click={() => isOpenEditAvatar = false}>
                    <Fa icon={faClose} size="2x" color="#ffffff" />
                </button>
            {:else}
                <button class="button" on:click={() => isOpenEditAvatar = true}>
                    <Fa icon={faEdit} size="2x" color="#ffffff" />
                </button>
            {/if}
        </div>
    </div>
    {#if isOpenEditAvatar}
        <form action="http://localhost:6868/api/upload" method="post" enctype="multipart/form-data" class="mt-4 p-4 text-white rounded-3xl bg-zinc-700 brightness-125" on:submit|preventDefault={handleUpdateAvatar}>
            <input type="file" name="image" id="file-input" bind:value={selectedFile}>
            <button 
                type="submit" 
                class="{selectedFile && selectedFile !== '' ? 'variant-filled-primary' : '!bg-transparent'} 
                    rounded-3xl px-2 py-1 text-white
                    "> Upload
            </button>
        </form>
    {/if}
    <div class="flex-1 flex-col flex w-full border-b max-w-2xl px-10 max-w-full border-b-zinc-700 my-4">
        <div class="relative w-full flex flex-1 justify-center items-center mx-30">
            {#if isOpenEditInfo}
                <div class="text-white flex justify-center items-center">
                    <p class="min-w-28">Tên hiển thị: </p>
                </div>
                <input type="text" class="input mt-4 mr-16 text-white border-none text-2xl focus:outline-none bg-[#3a3b3c] py-2 px-4" bind:value={inputDisplayName}>
            {:else}
                <h1 class="my-4 flex text-white text-wrap text-ellipsis overflow-hidden text-4xl">{$session?.user.displayName || $session?.user.email}</h1>
            {/if}
            <div class="absolute flex justify-center items-center bottom-[30px] rounded-full hover:bg-[#3D82F6] bg-zinc-700 bg-opacity-40 right-0 h-12 w-12">
                {#if isOpenEditInfo}
                    <button class="button" on:click={() => isOpenEditInfo = false}>
                        <Fa icon={faClose} size="lg" color="#ffffff" />
                    </button>
                {:else}
                    <button class="button" on:click={() => isOpenEditInfo = true}>
                        <Fa icon={faEdit} size="lg" color="#ffffff" />
                    </button>
                {/if}
            </div>
        </div>
        {#if isOpenEditInfo}
            <div class="flex flex-row">
                <div class="text-white flex justify-center items-center">
                    <p class="min-w-28">Bio: </p>
                </div>
                <input type="text" class="input my-4 mr-16 text-white border-none text-2xl focus:outline-none bg-[#3a3b3c] py-2 px-2" bind:value={inputBiography}>
            </div>
        {:else}
            {#if $session?.user.bio}
                <h1 class="my-4 text-white opacity-50 text-center text-wrap text-ellipsis overflow-hidden text-xlg">{$session?.user.bio || ''}</h1>
            {/if}
        {/if}
    </div>
    <div class="user-infomation {isOpenEditInfo ? 'px-10' : ''} w-full max-w-2xl flex-1 my-8">
        <div class="info-table flex {isOpenEditInfo ? 'flex-col' : 'flex-row'} justify-center items-center text-white">
            {#if isOpenEditInfo}
                <div class="flex flex-row flex-1 w-full">
                    <div class="text-white flex justify-center items-center">
                        <p class="min-w-28">Họ: </p>
                    </div>
                    <input type="text" class="input my-2 mr-16 text-white border-none text-1xl flex-1 w-full focus:outline-none bg-[#3a3b3c] py-2 px-2" bind:value={inputFirstName}>
                </div>
                <div class="flex flex-row flex-1 w-full">
                    <div class="text-white flex justify-center items-center">
                        <p class="min-w-28">Tên: </p>
                    </div>
                    <input type="text" class="input my-2 mr-16 text-white border-none text-1xl flex-1 w-full focus:outline-none bg-[#3a3b3c] py-2 px-2" bind:value={inputLastName}>
                </div>
                <div class="flex flex-row flex-1 w-full">
                    <div class="text-white flex justify-center items-center">
                        <p class="min-w-28">Số điện thoại: </p>
                    </div>
                    <input type="text" class="input my-2 mr-16 text-white border-none text-1xl flex-1 w-full focus:outline-none bg-[#3a3b3c] py-2 px-2" bind:value={inputPhoneNumber}>
                </div>
                <div class="flex flex-row flex-1 w-full">
                    <div class="text-white flex justify-center items-center">
                        <p class="min-w-28">Email: </p>
                    </div>
                    <input type="text" disabled={true} class="input my-2 mr-16 text-white border-none text-1xl flex-1 w-full focus:outline-none bg-[#3a3b3c] py-2 px-2" bind:value={inputEmail}>
                </div>
                <div class="flex flex-row flex-1 w-full">
                    <div class="text-white flex justify-center items-center">
                        <p class="min-w-28">Ngày sinh: </p>
                    </div>
                    <input type="text" class="input my-2 mr-16 text-white border-none text-1xl flex-1 w-full focus:outline-none bg-[#3a3b3c] py-2 px-2" bind:value={inputDisplayName}>
                </div>
                <div class="flex flex-row flex-1 w-full">
                    <div class="text-white flex justify-center items-center">
                        <p class="min-w-28">Giới tính: </p>
                    </div>
                    <input type="text" class="input my-2 mr-16 text-white border-none text-1xl flex-1 w-full focus:outline-none bg-[#3a3b3c] py-2 px-2" bind:value={inputDisplayName}>
                </div>
                <div class="flex flex-row flex-1 w-full">
                    <div class="text-white flex justify-center items-center">
                        <p class="min-w-28">Địa chỉ: </p>
                    </div>
                    <input type="text" class="input my-2 mr-16 text-white border-none text-1xl flex-1 w-full focus:outline-none bg-[#3a3b3c] py-2 px-2" bind:value={inputAddress}>
                </div>
                <div class="button">
                    <button class="button" on:click={() => onHandleUpdateUser()}>Cập nhật</button>
                </div>
            {:else}
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
                    <p class="my-4">{$session?.user.firstName || '/'}</p>
                    <p class="my-4">{$session?.user.lastName || '/'}</p>
                    <p class="my-4">{$session?.user.phoneNumber || '/'}</p>
                    <p class="my-4">{$session?.user.email || '/'}</p>
                    <p class="my-4">{$session?.user.birthday || '/'}</p>
                    <p class="my-4">{$session?.user.gender || '/'}</p>
                    <p class="my-4">{$session?.user.address || '/'}</p>
                </div>
            {/if}
        </div>
    </div>
</div>