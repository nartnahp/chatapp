<script lang="ts">
    import { session, currentConversation, socket, conversationsData, onlineUsersStore, isOpenUserProfile, usersStore, getUser } from '$lib/stores/session';
    import { currentTheme } from '$lib/stores/localStorage';
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
    import { getElapsedTime } from '$lib/stores/functionStorage';

    let isOpenMoreInfo = false;
    let isOpenConfig = false;
    let isOpenSharedFile = false;
    let isOpenPrivacy = false;
    let isShowMembers = false;
    let selectedTheme = '';
    $: if (selectedTheme) currentTheme.set(selectedTheme);
    function getPermissionOfMember(member: string) {
        if ($currentConversation?.admins.includes(member)) return 'Quản trị viên';
        return 'Thành viên';
    }

</script>

<div class="conversation-info bg-base-100 min-h-dvh min-w-full sm:min-h-full sm:max-h-dvh overflow-scroll sm:overflow-hidden flex items-center py-4 px-2 flex-col flex-1 sm:min-w-80 sm:max-w-80 border-l border-solid border-l-neutral">
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
    <h1 class=" text-center font-bold text-lg">{$currentConversation?.displayName || ''}</h1>
    {#if $currentConversation && $currentConversation.onlineStatus}
        <p class=" text-sm opacity-50 px-1">{getElapsedTime($currentConversation?.onlineStatus, false, false, true) || ''}</p>
    {/if}
    <div class="action flex row mt-4">
        <div class="flex flex-col items-center w-full">
            <button class="btn btn-circle text-neutral-content user mb-1 bg-neutral min-w-10 min-h-10 flex items-center justify-center">
                <Fa icon={faUser} size="lg" />
            </button>
            <p class=" text-center text-sm px-1">Trang cá nhân</p>
        </div>
        <div class="flex flex-col items-center  w-full">
            <button class="btn btn-circle text-neutral-content noti mb-1 bg-neutral min-w-10 min-h-10 flex items-center justify-center">
                <Fa icon={faBell} size="lg" />
            </button>
            <p class=" text-center text-sm px-1">Tắt thông báo</p>
        </div>
        <div class="flex flex-col items-center  w-full">
            <button class="btn btn-circle text-neutral-content search mb-1 bg-neutral min-w-10 min-h-10 flex items-center justify-center">
                <Fa icon={faSearch} size="lg" />
            </button>
            <p class=" text-center text-sm px-1">Tìm kiếm</p>
        </div>
    </div>
    <div class="info flex flex-col px-2 flex-1 lg:max-h-[calc(100%-396px)] w-full overflow-y-auto mt-6">
        <div class="conversation-info text-neutral-content w-full">
            <button class="btn bg-neutral flex flex-row w-full text-neutral-content h-12 mt-1 rounded-lg items-center px-2 justify-between button  "
                on:click={() => isOpenMoreInfo = !isOpenMoreInfo}
            >
                <p>Thông tin về đoạn chat</p>
                {#if isOpenMoreInfo}
                    <Fa icon={faArrowUp} size="1x" />
                {:else}
                    <Fa icon={faArrowDown} size="1x" />
                {/if}
            </button>
            {#if isOpenMoreInfo}
                <button class="btn bg-neutral flex flex-row w-full text-neutral-content h-12 mt-1 rounded-lg items-center px-2 justify-start button  "
                    on:click={() => {}}
                >
                    <div class="icon ml-1 mr-4">
                        <Fa icon={faThumbTack} size="1x" />
                    </div>
                    <p>Xem tin nhắn đã ghim</p>
                </button>
            {/if}
        </div>
        <div class="conversation-info text-neutral-content w-full">
            <button class="btn bg-neutral flex flex-row w-full text-neutral-content h-12 mt-1 rounded-lg items-center px-2 justify-between button  "
                on:click={() => isOpenConfig = !isOpenConfig}
            >
                <p>Tuỳ chỉnh đoạn chat</p>
               {#if isOpenConfig}
                    <Fa icon={faArrowUp} size="1x" />
                {:else}
                    <Fa icon={faArrowDown} size="1x" />
                {/if}
            </button>
            {#if isOpenConfig}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div class="btn bg-neutral dropdown hover:text-default dropdown-bottom flex flex-row w-full h-12 mt-1 rounded-lg items-center px-2 justify-start button  "
                    on:click={() => {}}
                    tabindex="0"
                >
                    <div class="icon ml-1 mr-4">
                        <Fa icon={faPalette} size="1x" />
                    </div>
                    <p>Đổi chủ đề</p>
                    <ul tabindex="0" class="dropdown-content z-[1] p-2 shadow-2xl bg-base-300 rounded-box w-52">
                        <li><input bind:group={selectedTheme} type="radio" name="theme-dropdown" class="theme-controller btn btn-sm btn-block btn-ghost justify-start" aria-label="Cmyk" value="cmyk"/></li>
                        <li><input bind:group={selectedTheme} type="radio" name="theme-dropdown" class="theme-controller btn btn-sm btn-block btn-ghost justify-start" aria-label="Night" value="night"/></li>
                        <li><input bind:group={selectedTheme} type="radio" name="theme-dropdown" class="theme-controller btn btn-sm btn-block btn-ghost justify-start" aria-label="Valentine" value="valentine"/></li>
                        <li><input bind:group={selectedTheme} type="radio" name="theme-dropdown" class="theme-controller btn btn-sm btn-block btn-ghost justify-start" aria-label="Luxury" value="luxury"/></li>
                        <li><input bind:group={selectedTheme} type="radio" name="theme-dropdown" class="theme-controller btn btn-sm btn-block btn-ghost justify-start" aria-label="Lemonade" value="lemonade"/></li>
                        <li><input bind:group={selectedTheme} type="radio" name="theme-dropdown" class="theme-controller btn btn-sm btn-block btn-ghost justify-start" aria-label="Forest" value="forest"/></li>
                        <li><input bind:group={selectedTheme} type="radio" name="theme-dropdown" class="theme-controller btn btn-sm btn-block btn-ghost justify-start" aria-label="Halloween" value="halloween"/></li>
                        <li><input bind:group={selectedTheme} type="radio" name="theme-dropdown" class="theme-controller btn btn-sm btn-block btn-ghost justify-start" aria-label="Aqua" value="aqua"/></li>
                        <li><input bind:group={selectedTheme} type="radio" name="theme-dropdown" class="theme-controller btn btn-sm btn-block btn-ghost justify-start" aria-label="Coffee" value="coffee"/></li>
                    </ul>
                </div>
                <button class="btn bg-neutral flex flex-row w-full text-neutral-content h-12 mt-1 rounded-lg items-center px-2 justify-start button  "
                    on:click={() => {}}
                >
                    <div class="icon ml-1 mr-4">
                        <Fa icon={faThumbsUp} size="1x" />
                    </div>
                    <p>Thay đổi biểu tượng cảm xúc</p>
                </button>
                <button class="btn bg-neutral flex flex-row w-full text-neutral-content h-12 mt-1 rounded-lg items-center px-2 justify-start button  "
                    on:click={() => {}}
                >
                    <div class="icon ml-1 mr-4">
                        <Fa icon={faFont} size="1x" />
                    </div>
                    <p>Chỉnh sửa biệt danh</p>
                </button>
            {/if}
        </div>
        {#if $currentConversation?.members?.length && $currentConversation?.members?.length > 2}
            <div class="conversation-info text-neutral-content w-full">
                <button class="btn bg-neutral flex flex-row w-full text-neutral-content h-12 mt-1 rounded-lg items-center px-2 justify-between button  "
                    on:click={() => isShowMembers = !isShowMembers}
                >
                    <p>Thành viên trong nhóm chat</p>
                    {#if isShowMembers}
                        <Fa icon={faArrowUp} size="1x" />
                    {:else}
                        <Fa icon={faArrowDown} size="1x" />
                    {/if}
                </button>
                {#if isShowMembers}
                    {#each getUser($currentConversation?.members) as member}
                        <div class="ticket flex flex-row items-center justify-between p-2">
                            <div class="flex max-w-[calc(100%-48px)] flex-row items-center justify-center">
                                <button class="btn btn-circle avatar mr-2">
                                    <Avatar src={member.avatar} width="w-12" />
                                </button>
                                <div class="flex-1  overflow-hidden text-ellipsis member-info ">
                                    <h1 class="max-w-full text-nowrap max-h-7 overflow-hidden pb-1 text-ellipsis">{member.displayName || member.email || ''}</h1>
                                    <p class="opacity-50 text-ellipsis text-sm">{getPermissionOfMember(member._id) || ''}</p>
                                </div>
                            </div>
                            <div class="setting-button">
                                <button class="flex justify-center items-center button  h-12 w-12 rounded-full">
                                    <Fa icon={faEllipsis} size="lg" />
                                </button>
                            </div>
                        </div>
                    {/each}
                {/if}
            </div>
        {/if}
        <div class="conversation-info text-neutral-content w-full">
            <button class="btn bg-neutral flex flex-row w-full text-neutral-content h-12 mt-1 rounded-lg items-center px-2 justify-between button  "
                on:click={() => isOpenSharedFile = !isOpenSharedFile}
            >
                <p>File phương tiện, liên kết</p>
               {#if isOpenSharedFile}
                    <Fa icon={faArrowUp} size="1x" />
                {:else}
                    <Fa icon={faArrowDown} size="1x" />
                {/if}
            </button>
            {#if isOpenSharedFile}
                <button class="btn bg-neutral flex flex-row w-full text-neutral-content h-12 mt-1 rounded-lg items-center px-2 justify-start button  "
                    on:click={() => {}}
                >
                    <div class="icon ml-1 mr-4">
                        <Fa icon={faImages} size="1x" />
                    </div>
                    <p>File phương tiện</p>
                </button>
                <button class="btn bg-neutral flex flex-row w-full text-neutral-content h-12 mt-1 rounded-lg items-center px-2 justify-start button  "
                    on:click={() => {}}
                >
                    <div class="icon ml-1 mr-4">
                        <Fa icon={faFile} size="1x" />
                    </div>
                    <p>File</p>
                </button>
                <button class="btn bg-neutral flex flex-row w-full text-neutral-content h-12 mt-1 rounded-lg items-center px-2 justify-start button  "
                    on:click={() => {}}
                >
                    <div class="icon ml-1 mr-4">
                        <Fa icon={faLink} size="1x" />
                    </div>
                    <p>Liên kết</p>
                </button>
            {/if}
        </div>
        <div class="conversation-info text-neutral-content w-full">
            <button class="btn bg-neutral flex flex-row w-full text-neutral-content h-12 mt-1 rounded-lg items-center px-2 justify-between button  "
                on:click={() => isOpenPrivacy = !isOpenPrivacy}
            >
                <p>Quyền riêng tư và hỗ trợ</p>
               {#if isOpenPrivacy}
                    <Fa icon={faArrowUp} size="1x" />
                {:else}
                    <Fa icon={faArrowDown} size="1x" />
                {/if}
            </button>
            {#if isOpenPrivacy}
                <button class="btn bg-neutral flex flex-row w-full text-neutral-content h-12 mt-1 rounded-lg items-center px-2 justify-start button  "
                    on:click={() => {}}
                >
                    <div class="icon ml-1 mr-4">
                        <Fa icon={faBellSlash} size="1x" />
                    </div>
                    <p>Tắt thông báo</p>
                </button>
                <button class="btn bg-neutral flex flex-row w-full text-neutral-content h-12 mt-1 rounded-lg items-center px-2 justify-start button  "
                    on:click={() => {}}
                >
                    <div class="icon ml-1 mr-4">
                        <Fa icon={faBan} size="1x" />
                    </div>
                    <p>Chặn</p>
                </button>
                {#if $currentConversation.members.length > 2}
                    <button class="btn bg-neutral flex flex-row w-full text-neutral-content h-12 mt-1 rounded-lg items-center px-2 justify-start button  "
                        on:click={() => {}}
                    >
                        <div class="icon ml-1 mr-4">
                            <Fa icon={faArrowRightFromBracket} size="1x" />
                        </div>
                        <p>Rời nhóm</p>
                    </button>
                {/if}
            {/if}
        </div>
    </div>
</div>