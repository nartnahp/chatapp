<script lang="ts">
    import { session, currentConversation, socket, conversationsData, onlineUsersStore, isOpenUserProfile, usersStore, getUser } from '$lib/stores/session';
	import { Avatar } from '@skeletonlabs/skeleton';
    import Fa from 'svelte-fa'
    import { faImages, 
        faSearch, 
        faBell, 
        faFont, 
        faUser, 
        faThumbsUp, 
        faPalette, 
        faThumbTack, 
        faArrowUp, 
        faArrowDown, 
        faFile, 
        faLink,
        faBellSlash, 
        faBan,
        faArrowRightFromBracket,
        faEllipsis } from '@fortawesome/free-solid-svg-icons'
    import { getElapsedTime } from '$lib/stores/functionStores';

    let isOpenMoreInfo = false;
    let isOpenConfig = false;
    let isOpenSharedFile = false;
    let isOpenPrivacy = false;
    let isShowMembers = false;

    function getPermissionOfMember(member: string) {
        if ($currentConversation?.admins.includes(member)) return 'Quản trị viên';
        return 'Thành viên';
    }

</script>

<div class="conversation-info max-h-dvh overflow-hidden flex items-center py-4 px-2 flex-col flex-1 min-w-80 max-w-80 border-l border-solid border-l-zinc-700">
    <div class="avatar pt-12 pb-4">
        {#if $currentConversation}
            {#if $currentConversation.members.length > 2}
                <div class="relative flex justify-between w-24 h-24">
                    <div class="absolute top-0 right-0 avatar">
                        <Avatar border="border-2 border-zinc-800" src={$currentConversation?.avatar[0]} width="w-16" />
                    </div>
                    <div class="absolute bottom-0 left-0 avatar">
                        <Avatar border="border-2 border-zinc-800" src={$currentConversation?.avatar[1]} width="w-16" />
                    </div>
                </div>
            {:else}
                <Avatar src={$currentConversation?.avatar} width="w-24" />
            {/if}
        {/if}
    </div>
    <h1 class="text-white text-center font-bold text-lg">{$currentConversation?.displayName || ''}</h1>
    {#if $currentConversation && $currentConversation.onlineStatus}
        <p class="text-white text-sm opacity-50 px-1">{getElapsedTime($currentConversation?.onlineStatus, false, false, true) || ''}</p>
    {/if}
    <div class="action flex row mt-4">
        <div class="flex flex-col items-center w-full">
            <button class="button user mb-1 bg-zinc-500 rounded-full w-10 h-10 flex items-center justify-center">
                <Fa icon={faUser} size="lg" color="#ffffff" />
            </button>
            <p class="text-white text-center text-sm px-1">Trang cá nhân</p>
        </div>
        <div class="flex flex-col items-center  w-full">
            <button class="button noti mb-1 bg-zinc-500 rounded-full w-10 h-10 flex items-center justify-center">
                <Fa icon={faBell} size="lg" color="#ffffff" />
            </button>
            <p class="text-white text-center text-sm px-1">Tắt thông báo</p>
        </div>
        <div class="flex flex-col items-center  w-full">
            <button class="button search mb-1 bg-zinc-500 rounded-full w-10 h-10 flex items-center justify-center">
                <Fa icon={faSearch} size="lg" color="#ffffff" />
            </button>
            <p class="text-white text-center text-sm px-1">Tìm kiếm</p>
        </div>
    </div>
    <div class="info flex flex-col px-2 flex-1 lg:max-h-[calc(100%-396px)] w-full overflow-y-auto mt-6">
        <div class="conversation-info w-full">
            <button class="flex flex-row w-full h-12 mt-1 rounded-lg items-center px-2 justify-between button bg-surface-hover-token text-white"
                on:click={() => isOpenMoreInfo = !isOpenMoreInfo}
            >
                <p>Thông tin về đoạn chat</p>
                {#if isOpenMoreInfo}
                    <Fa icon={faArrowUp} size="1x" color="#ffffff" />
                {:else}
                    <Fa icon={faArrowDown} size="1x" color="#ffffff" />
                {/if}
            </button>
            {#if isOpenMoreInfo}
                <button class="flex flex-row w-full h-12 mt-1 rounded-lg items-center px-2 justify-start button bg-surface-hover-token text-white"
                    on:click={() => {}}
                >
                    <div class="icon ml-1 mr-4">
                        <Fa icon={faThumbTack} size="1x" color="#ffffff" />
                    </div>
                    <p>Xem tin nhắn đã ghim</p>
                </button>
            {/if}
        </div>
        <div class="conversation-info w-full">
            <button class="flex flex-row w-full h-12 mt-1 rounded-lg items-center px-2 justify-between button bg-surface-hover-token text-white"
                on:click={() => isOpenConfig = !isOpenConfig}
            >
                <p>Tuỳ chỉnh đoạn chat</p>
               {#if isOpenConfig}
                    <Fa icon={faArrowUp} size="1x" color="#ffffff" />
                {:else}
                    <Fa icon={faArrowDown} size="1x" color="#ffffff" />
                {/if}
            </button>
            {#if isOpenConfig}
                <button class="flex flex-row w-full h-12 mt-1 rounded-lg items-center px-2 justify-start button bg-surface-hover-token text-white"
                    on:click={() => {}}
                >
                    <div class="icon ml-1 mr-4">
                        <Fa icon={faPalette} size="1x" color="#ffffff" />
                    </div>
                    <p>Đổi chủ đề</p>
                </button>
                <button class="flex flex-row w-full h-12 mt-1 rounded-lg items-center px-2 justify-start button bg-surface-hover-token text-white"
                    on:click={() => {}}
                >
                    <div class="icon ml-1 mr-4">
                        <Fa icon={faThumbsUp} size="1x" color="#ffffff" />
                    </div>
                    <p>Thay đổi biểu tượng cảm xúc</p>
                </button>
                <button class="flex flex-row w-full h-12 mt-1 rounded-lg items-center px-2 justify-start button bg-surface-hover-token text-white"
                    on:click={() => {}}
                >
                    <div class="icon ml-1 mr-4">
                        <Fa icon={faFont} size="1x" color="#ffffff" />
                    </div>
                    <p>Chỉnh sửa biệt danh</p>
                </button>
            {/if}
        </div>
        {#if $currentConversation?.members?.length > 2}
            <div class="conversation-info w-full">
                <button class="flex flex-row w-full h-12 mt-1 rounded-lg items-center px-2 justify-between button bg-surface-hover-token text-white"
                    on:click={() => isShowMembers = !isShowMembers}
                >
                    <p>Thành viên trong nhóm chat</p>
                    {#if isShowMembers}
                        <Fa icon={faArrowUp} size="1x" color="#ffffff" />
                    {:else}
                        <Fa icon={faArrowDown} size="1x" color="#ffffff" />
                    {/if}
                </button>
                {#if isShowMembers}
                    {#each getUser($currentConversation?.members) as member}
                        <div class="ticket flex flex-row items-center justify-between p-2">
                            <div class="flex max-w-[calc(100%-48px)] flex-row items-center justify-center">
                                <button class="button avatar mr-2">
                                    <Avatar src={member.avatar} width="w-12" />
                                </button>
                                <div class="flex-1  overflow-hidden text-ellipsis member-info text-white">
                                    <h1 class="max-w-full text-nowrap max-h-7 overflow-hidden pb-1 text-ellipsis">{member.displayName || member.email || ''}</h1>
                                    <p class="opacity-50 text-ellipsis text-sm">{getPermissionOfMember(member._id) || ''}</p>
                                </div>
                            </div>
                            <div class="setting-button">
                                <button class="flex justify-center items-center button bg-surface-hover-token h-12 w-12 rounded-full">
                                    <Fa icon={faEllipsis} size="lg" color="#ffffff" />
                                </button>
                            </div>
                        </div>
                    {/each}
                {/if}
            </div>
        {/if}
        <div class="conversation-info w-full">
            <button class="flex flex-row w-full h-12 mt-1 rounded-lg items-center px-2 justify-between button bg-surface-hover-token text-white"
                on:click={() => isOpenSharedFile = !isOpenSharedFile}
            >
                <p>File phương tiện, liên kết</p>
               {#if isOpenSharedFile}
                    <Fa icon={faArrowUp} size="1x" color="#ffffff" />
                {:else}
                    <Fa icon={faArrowDown} size="1x" color="#ffffff" />
                {/if}
            </button>
            {#if isOpenSharedFile}
                <button class="flex flex-row w-full h-12 mt-1 rounded-lg items-center px-2 justify-start button bg-surface-hover-token text-white"
                    on:click={() => {}}
                >
                    <div class="icon ml-1 mr-4">
                        <Fa icon={faImages} size="1x" color="#ffffff" />
                    </div>
                    <p>File phương tiện</p>
                </button>
                <button class="flex flex-row w-full h-12 mt-1 rounded-lg items-center px-2 justify-start button bg-surface-hover-token text-white"
                    on:click={() => {}}
                >
                    <div class="icon ml-1 mr-4">
                        <Fa icon={faFile} size="1x" color="#ffffff" />
                    </div>
                    <p>File</p>
                </button>
                <button class="flex flex-row w-full h-12 mt-1 rounded-lg items-center px-2 justify-start button bg-surface-hover-token text-white"
                    on:click={() => {}}
                >
                    <div class="icon ml-1 mr-4">
                        <Fa icon={faLink} size="1x" color="#ffffff" />
                    </div>
                    <p>Liên kết</p>
                </button>
            {/if}
        </div>
        <div class="conversation-info w-full">
            <button class="flex flex-row w-full h-12 mt-1 rounded-lg items-center px-2 justify-between button bg-surface-hover-token text-white"
                on:click={() => isOpenPrivacy = !isOpenPrivacy}
            >
                <p>Quyền riêng tư và hỗ trợ</p>
               {#if isOpenPrivacy}
                    <Fa icon={faArrowUp} size="1x" color="#ffffff" />
                {:else}
                    <Fa icon={faArrowDown} size="1x" color="#ffffff" />
                {/if}
            </button>
            {#if isOpenPrivacy}
                <button class="flex flex-row w-full h-12 mt-1 rounded-lg items-center px-2 justify-start button bg-surface-hover-token text-white"
                    on:click={() => {}}
                >
                    <div class="icon ml-1 mr-4">
                        <Fa icon={faBellSlash} size="1x" color="#ffffff" />
                    </div>
                    <p>Tắt thông báo</p>
                </button>
                <button class="flex flex-row w-full h-12 mt-1 rounded-lg items-center px-2 justify-start button bg-surface-hover-token text-white"
                    on:click={() => {}}
                >
                    <div class="icon ml-1 mr-4">
                        <Fa icon={faBan} size="1x" color="#ffffff" />
                    </div>
                    <p>Chặn</p>
                </button>
                {#if $currentConversation.members.length > 2}
                    <button class="flex flex-row w-full h-12 mt-1 rounded-lg items-center px-2 justify-start button bg-surface-hover-token text-white"
                        on:click={() => {}}
                    >
                        <div class="icon ml-1 mr-4">
                            <Fa icon={faArrowRightFromBracket} size="1x" color="#ffffff" />
                        </div>
                        <p>Rời nhóm</p>
                    </button>
                {/if}
            {/if}
        </div>
    </div>
</div>