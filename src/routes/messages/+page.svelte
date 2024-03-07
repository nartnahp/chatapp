<script lang="ts">
    import { goto } from '$app/navigation';
    import { session, currentConversation, socket, conversationsData, onlineUsersStore, isOpenUserProfile, usersStore, getUser } from '$lib/stores/session';
    import { onMount, afterUpdate } from 'svelte';
    import Fa from 'svelte-fa'
    import { faSquarePlus, faSearch, faBell, faPaperPlane, faUser, faClose, faEdit, faInfoCircle } from '@fortawesome/free-solid-svg-icons'
    import { InputChip } from '@skeletonlabs/skeleton';
    import { postWithBody, getFullField, postWithFile } from '$lib/api/apiGateway';
    import type { Users, User } from '$lib/stores/auth'
    import type { Conversations, Conversation } from '$lib/stores/conversation'
    import type { Message, Messages, MessageStatus } from '$lib/stores/message'
    import { Autocomplete } from '@skeletonlabs/skeleton';
    import type { AutocompleteOption } from '@skeletonlabs/skeleton';
	import { Avatar } from '@skeletonlabs/skeleton';
    import ConversationInfo from '$lib/components/conversationComponents/conversationInfo.svelte'
    import ConversationTicket from '$lib/components/conversationComponents/conversationTicket.svelte'
    import UserProfile from '$lib/components/userProfile.svelte'
    onMount(() => {
        setTimeout(() => {
            if (!$session) goto('/auth/log-in');
        }, 1000); 
    })

    let inputSearchReceiver = '';
    let inputMessage = '';
    let isCreateNewConversation: boolean = false;

    let isOpenConversationInfo: boolean = false;
    let selectedReceivers: string[] = [];
    let selectedReceiversId: string[] = [];
    let receivers: Users = [];
    let options: AutocompleteOption<string>[] = [];

    
    if ($session) {
        getAllUser();
        getAllConversationData($session?.user?._id);
    }
    afterUpdate(() => {
        if(elemChat) scrollToBottom(elemChat);
    });
	let elemChat: HTMLElement;

    const scrollToBottom = async (node:HTMLElement) => {
        node.scroll({ top: node.scrollHeight, behavior: 'smooth' });
    }; 
    type FlavorOption = AutocompleteOption<string, { healthy: boolean }>
    function onSelection(event: CustomEvent<FlavorOption>): void {
		if (selectedReceivers.includes(event.detail.value) === false) {
			selectedReceivers = [...selectedReceivers, event.detail.value];
			inputSearchReceiver = '';
		}
	}
    $: if (selectedReceivers.length > 0) selectedReceiversId = receivers.filter((u) => selectedReceivers.includes(u.email)).map((u) => u._id);
    $: currentConversationData = $conversationsData && $currentConversation;

    $: console.log('currentConversationData', currentConversationData)

    async function getAllUser() {
        try {
            const res = await postWithBody('api/auth/get-all', {_id: $session?.user._id})
            if (res.ok) {
                const users = await res.json();
                users.map((u: User) => {
                    options.push({
                        label: u.email,
                        value: u.email,
                        keywords: u.email,
                        meta: { healthy: true }
                    });
                    receivers.push(u);
                })
            }
        } catch (error) {
            console.log(error);
        }
    }

    async function getAllConversationData(userId: string) {
        try {
            const res = await getFullField(`api/conversations/${userId}`);
            if (res.ok) {
                const data = await res.json();
                if ($usersStore.length == 0) {
                    usersStore.set(data.relatedUsers);
                } else {
                    const updateUsersStore = [...new Set([...$usersStore, ...data.relatedUsers])]
                    usersStore.set(updateUsersStore);
                };
                let resData: Users = [];
                usersStore.subscribe((value) => {
                    resData = value;
                });
                const modifiedData = data.data.map((c: Conversation) => {
                    $socket.emit('joinsRoom', c._id);
                    const avatar = getConversationAvatar(c.members, userId);
                    if (avatar) c.avatar = avatar;
                    const displayName = getConversationDisplayName(c, $session?.user);
                    if (displayName) c.displayName = displayName;
                    return c;
                });
                conversationsData.set(modifiedData);
            };
        } catch (error) {
            console.log(error);
        }
    }
    
    function getConversationAvatar(members: string[], fetcherId: string) {
        if (members.length == 1) return getUser(members)?.avatar;
        if (members.length == 2) {
            return getUser(members.find((u) => u != fetcherId))?.avatar;
        } else { 
            const users =  getUser(members);
            if (users?.length) {
                const avatar = [
                    users[0]?.avatar,
                    users[1]?.avatar
                ];
                return avatar;
            }
        }
    };

    function getConversationDisplayName(conversation: Conversation, userMe: User | undefined) {
        if (conversation.displayName) return conversation.displayName;
        else if (conversation.members.length == 1) return userMe?.displayName || userMe?.email;
        else if (conversation.members.length == 2) {
            const findUser = getUser(conversation.members.find((u) => u != userMe?._id));
            if (findUser) return findUser.displayName || findUser.email;
        } else if (conversation.members.length > 2) return conversation.members.map((u) => getUser(u)?.displayName ? getUser(u)?.displayName : getUser(u)?.email).toString().replaceAll(',', ' và ');
    };

    async function onCreateConversation() {
        try {
            const res = await postWithBody('api/conversations', {
                senderId: $session?.user._id,
                members: [...selectedReceiversId, $session?.user._id],
                createdBy: $session?.user._id
            })
            if (res.ok) {
                selectedReceivers = [];
                isCreateNewConversation = false;
            }
        } catch (error) {
            console.log(error)
        }
    }



	function getTimestamp(time: string) {
        const sendedTime = new Date(time);
        const sendedHourMin = sendedTime.toLocaleString('vi-VN', { hour: 'numeric', minute: 'numeric', hour12: true });
        const sendedMonthDayHourMin = sendedTime.toLocaleString('vi-VN', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
        const sendedDay = sendedTime.getDay();
        const today = new Date().getDay();
        if (today - sendedDay == 0) return 'Hôm nay ' + sendedHourMin;
		if (today - sendedDay == 1) return 'Hôm qua ' + sendedHourMin;
		if (today - sendedDay > 1) return sendedMonthDayHourMin;
	}

	async function handleSendMessage(message: string) {
        inputMessage = '';
        try {
            if (message !== '') {
                await postWithBody('api/messages', {
                    conversationId: $currentConversation?._id,
                    receivers: getReceivers($currentConversation?.members),
                    sender: $session?.user._id,
                    status: createMessageStatus($currentConversation?.members),
                    text: message,
                })
                .then(async (res) => {
                    const sendedMessage = await res.json();
                    $socket.emit('sendMessage', {
                        messageId: sendedMessage._id,
                        conversationId: $currentConversation?._id,
                        receivers: sendedMessage.receivers,
                        status: sendedMessage.status,
                        sender: $session?.user._id,
                        text: message,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    })
                })
                .catch(err => {
                    console.log(err);
                })
                setTimeout(() => {
                    scrollToBottom(elemChat);
                }, 0);
            }
        }   catch (error) {
            console.log(error);
        }
	}

    if ($socket) {
        $socket.on('getMessage', data => {
            if (data) {
                const updateStatus = data.status.map((r) => {
                    if (r.receiverId == $session?.user._id) {
                        r.status = 'delivered';
                        return r;
                    } else return r;
                });
                data.status = updateStatus;
                updatedMessage(data);
                if (data.sender._id != $session?.user._id) $socket.emit('deliveredMessage', data);
            }
        });
        $socket.on('updateDeliveredMessage', data => {
            if (data) updatedMessage(data, true);
        })
    };

	function onPromptKeydown(event: KeyboardEvent): void {
		if (['Enter'].includes(event.code)) {
			event.preventDefault();
			handleSendMessage(inputMessage);
		};
	};

    // update arrival message
    const updatedMessage = (message: Message | undefined, isUpdateDeliveredMessage?: boolean) => {
        let updated: Conversations | undefined = $conversationsData?.map((c) => {
            if (message && c._id === message.conversationId) {
                if (isUpdateDeliveredMessage) {
                    c.messages.map((m) => {
                        if (m.messageId === message.messageId) return m = message;
                        return m;
                    })
                } else {
                    c.messages?.push(message);
                    c.activityTime = new Date().toISOString();
                }
                return c;
            } else {
                return c;
            };
        })
        if (!isUpdateDeliveredMessage) sortConversations(updated);
        conversationsData.set(updated);
    }

    const sortConversations = (conversationsData: Conversations) => {
        if (conversationsData) {
            return conversationsData.sort((a, b) => {
                return (new Date(b.activityTime) - (new Date(a.activityTime)));
            });
        };
    };

    function getReceivers(members: string[]) {
        if (members.length > 0) return members.filter((u) => u != $session?.user._id);
    }

    function createMessageStatus(members: Users) {
        let messageStatus: MessageStatus = [];
        if (members.length > 0) {
            const receivers = members.filter((u) => u._id != $session?.user._id);
            if (receivers.length > 0) receivers.map((u) => messageStatus.push({
                receiverId : u._id,
                status: 'sent'
            }))
        }
        return messageStatus;
    }

    function getMessageStatus(message: Message) {
        const status = message.status
        if (status.length > 0) {
            if (status.some((s) => s.status == 'delivered')) return 'Đã nhận';
            if (!status.some((s) => s.status == 'delivered') && !status.some((s) => s.status == 'received')) return 'Đã gửi';
        }
    }

    function getMessageAvatar(userId: string) {
        if (userId) return getUser(userId);
    }

</script>

<div class="bg-zinc-800 w-full min-h-screen flex flex-row">
    <ConversationTicket bind:elemChat bind:isCreateNewConversation on:scrollToBottom={() => scrollToBottom(elemChat)}/>
    <div class="relative conversation-screen w-full h-full max-w-[calc(100%-111px) ]lg:max-w-[calc(100%-320px)] max-h-dvh flex flex-col flex-1">
        {#if $isOpenUserProfile}
            <UserProfile />
        {:else}
            <div class="z-10 p-4 absolute w-full bg-opacity-95 bg-zinc-800 header min-h-20 border-b border-solid border-b-zinc-700 flex flex-col justify-end">
                {#if isCreateNewConversation}
                    <form action="" on:submit={onCreateConversation}>
                        <div class="flex flex-row justify-center items-center">
                            <div class="text-white">
                                <h2>Gửi đến:</h2>
                            </div>
                            <div class="flex-1 mx-4">      
                                <InputChip 
                                    allowDuplicates={false} 
                                    bind:input={inputSearchReceiver}
                                    bind:value={selectedReceivers}
                                    name="chips" 
                                    placeholder="Nhập email người nhận" 
                                />
                                <div class="relative">
                                    {#if selectedReceivers.length < options.length}
                                        <div class="bg-[#3a3b3c] text-white absolute card w-full max-w-sm max-h-48 p-4 overflow-y-auto" tabindex="-1">
                                            <Autocomplete
                                                bind:input={inputSearchReceiver}
                                                options={options}
                                                denylist={selectedReceivers}
                                                on:selection={onSelection}
                                            />
                                        </div>
                                    {/if}
                                </div>
                            </div>
                            <button 
                                type="button" 
                                class="btn-icon {selectedReceivers.length ? 'variant-filled-primary' : '!bg-transparent'} text-white" 
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
                            <h1 class="ml-3 text-white font-bold text-lg">{$currentConversation?.displayName || 'Chọn cuộc hội thoại để tiếp tục'}</h1>
                        </div>
                        {#if $currentConversation}
                            <div class="conversation-active flex justify-center items-center">
                                <button class="button hover:brightness-125" on:click={() => isOpenConversationInfo = !isOpenConversationInfo}>
                                    <Fa icon={faInfoCircle} size="lg" color="#3D82F6" />
                                </button>
                            </div>
                        {/if}
                    </div>
                {/if}   
            </div>
            <div class="conversation h-full flex flex-1">
                <div class="flex flex-col max-h-dvh h-full overflow-hidden flex-1">
                    <!-- Conversation -->
                    <section bind:this={elemChat} class="flex-1 p-4 min-h-[calc(100dvh-72px)] pt-24 overflow-y-auto space-y-4">
                        {#await currentConversationData}
                            <h1>Loading messages</h1>
                        {:then conversations} 
                            {#if conversations && conversations.messages.length}
                                {#each conversations.messages as message, i}
                                    {#if message.sender !== $session?.user._id}
                                        <div class="flex flex-row !my-px items-end">
                                            <div class="sender-avatar {conversations.members.length > 2 ? 'w-8 mr-2 mb-6' : 'w-0'}">
                                                {#if conversations.members.length > 2 &&
                                                    conversations.messages[i].sender !== conversations.messages[i + 1]?.sender
                                                }
                                                    <Avatar src={getMessageAvatar(message.sender)?.avatar} width="w-8" />
                                                {/if}
                                            </div>
                                            <div class="">
                                                {#if conversations.messages[i - 1] && 
                                                    conversations.messages[i].sender !== conversations.messages[i - 1].sender &&
                                                    conversations.members.length > 2 || i == 0
                                                }
                                                    <p class="opacity-50 text-white">{getMessageAvatar(message.sender)?.displayName || getMessageAvatar(message.sender)?.email}</p>
                                                {/if}
                                                <div class="flex justify-start">
                                                    <div class="bg-zinc-500 card px-4 py-2 rounded-3xl variant-soft
                                                        {conversations.messages[i - 1] && conversations.messages[i].sender == conversations.messages[i - 1].sender ? 'rounded-tl': '' }
                                                        {conversations.messages[i + 1] && conversations.messages[i].sender == conversations.messages[i + 1].sender ? 'rounded-bl': '' }
                                                    ">
                                                        <p class="text-white">{message.text}</p>
                                                    </div>
                                                </div>
                                                {#if (conversations.messages[i].sender !== conversations.messages[i + 1]?.sender) ||
                                                    conversations.messages[i - 1] && 
                                                    conversations.messages[i].sender !== conversations.messages[i - 1].sender &&
                                                    conversations.messages[i].sender !== conversations.messages[i + 1]?.sender
                                                }
                                                    <div class="flex flex-row justify-start">
                                                        <small class="opacity-50 text-white">{getTimestamp(message.createdAt)}</small>
                                                    </div>
                                                {/if}
                                            </div>
                                        </div>
                                    {:else}
                                        <div class="!my-px flex flex-row">
                                            <div class="flex-1">
                                                <div class="flex justify-end">
                                                    <div class="card w-fit px-4 py-2 rounded-3xl variant-filled-primary
                                                        {conversations.messages[i - 1] && conversations.messages[i].sender == conversations.messages[i - 1].sender ? 'rounded-tr': '' }
                                                        {conversations.messages[i + 1] && conversations.messages[i].sender == conversations.messages[i + 1].sender ? 'rounded-br': '' }
                                                    ">
                                                        <p class="text-white">{message.text}</p>
                                                    </div>
                                                </div>
                                                {#if (conversations.messages[i].sender !== conversations.messages[i + 1]?.sender) ||
                                                    conversations.messages[i - 1] && 
                                                    conversations.messages[i].sender !== conversations.messages[i - 1].sender &&
                                                    conversations.messages[i].sender !== conversations.messages[i + 1]?.sender
                                                }
                                                    <div class="flex flex-row justify-end">
                                                        <small class="opacity-50 text-white">{getTimestamp(message.createdAt) || ''}</small>
                                                        
                                                    </div>
                                                {/if}
                                            </div>
                                            <div class="message-status w-6">
                                                {#key conversations}
                                                    <!-- {#if getMyLastMessagesIndex(conversations.messages, i)} -->
                                                        <small class="opacity-50 text-white">{getMessageStatus(message) || ''}</small>
                                                    <!-- {/if} -->
                                                {/key}
                                            </div>
                                        </div>
                                    {/if}
                                {/each}
                            {/if}
                        {/await}
                    </section>
                    <section class="border-t bg-zinc-800 border-surface-500/30 p-4">
                        <div class="flex">
                            <button class="!bg-transparent text-white input-group-shim">+</button>
                            <input
                                bind:value={inputMessage}
                                class="focus:outline-none border-0 h-10 text-white flex-1 mx-4 px-2 ring-0 bg-[#3a3b3c] rounded-3xl"
                                name="prompt"
                                id="prompt"
                                placeholder="Nhập tin nhắn..."
                                on:keydown={onPromptKeydown}
                            />
                            <button class="!bg-transparent {inputMessage ? 'variant-filled-primary' : 'input-group-shim'}" on:click={handleSendMessage(inputMessage)}>
                                <Fa icon={faPaperPlane} color={inputMessage ? 'rgba(var(--color-primary-500))' : '#fff'} class="!bg-transparent"/>
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        {/if}
    </div>
    {#if isOpenConversationInfo}
        <ConversationInfo />
    {/if}
</div>