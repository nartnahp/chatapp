<script lang="ts">
    import { goto } from '$app/navigation';
    import { session, currentConversation, socket, conversationsData, onlineUsersStore, isOpenUserProfile } from '$lib/stores/session';
    import { onMount, afterUpdate } from 'svelte';
    import Fa from 'svelte-fa'
    import { faSquarePlus, faPaperPlane, faUser, faClose, faEdit } from '@fortawesome/free-solid-svg-icons'
    import { InputChip } from '@skeletonlabs/skeleton';
    import { postWithBody, getFullField, postWithFile } from '$lib/api/apiGateway';
    import type { Users, User } from '$lib/stores/auth'
    import type { Conversations, Conversation } from '$lib/stores/conversation'
    import type { Message, Messages, MessageStatus } from '$lib/stores/message'
    import { Autocomplete } from '@skeletonlabs/skeleton';
    import type { AutocompleteOption } from '@skeletonlabs/skeleton';
	import { Avatar } from '@skeletonlabs/skeleton';
    onMount(() => {
        setTimeout(() => {
            if (!$session) goto('/auth/log-in');
        }, 1000); 
    })

    let inputSearchReceiver = '';
    let q = '';
    let inputMessage = '';
    let isCreateNewConversation: boolean = false;
    let isOpenEditAvatar: boolean = false;
    let isOpenEditInfo: boolean = false;
    let selectedReceivers: string[] = [];
    let selectedReceiversId: string[] = [];
    let receivers: Users = [];
    let options: AutocompleteOption<string>[] = [];
    let selectedFile: string | undefined;
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
        getAllUser();
        getAllConversationData($session?.user?._id);
        inputDisplayName = $session?.user.nickName;
        inputBiography = $session?.user.bio;
        inputFirstName = $session?.user.firstName;
        inputLastName = $session?.user.lastName;
        inputPhoneNumber = $session?.user.phoneNumber;
        inputEmail = $session?.user.email;
        inputAddress = $session?.user.address;
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
    $: ticketData = $onlineUsersStore && $conversationsData;
    

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
            const res = await getFullField(`api/conversations/${userId}`)
            if (res.ok) {
                const conversations = await res.json();
                const fetchConversationsData = await Promise.all(conversations.map(async (c: Conversation) => {
                    //connect to socket io room
                    $socket.emit('joinsRoom', c._id)

                    // Changes members from array of ._id to array of full data
                    const fetchMemberData = await Promise.all(c.members.map((u) => getUserData(u)));
                    c.members = fetchMemberData;

                    // get Avatar for conversation
                    const avatarData = getConversationAvatar(fetchMemberData);
                    c.avatar = avatarData;

                    //get displayName for conversation
                    const displayName = getConversationDisplayName(c);
                    c.displayName = displayName;

                    // get full Messages data and put it into fetchConversationsData
                    const fetchMessagesData = await getMessageData(c._id);
                    const messagesData = await Promise.all(fetchMessagesData.map(async (m: Message) => {
                        const fetchMessageSender = await getMessageSender(m.sender);
                        m.sender = fetchMessageSender;
                        return m;
                    }));
                    c.messagesData = messagesData;
                    return c;
                })).then((res) => {
                    return sortConversations(res);
                });
                conversationsData.set(fetchConversationsData);
            };
        } catch (error) {
            console.log(error);
        }
    }

    async function getMessageData(conversationId: string) {
        try {
            const res = await postWithBody(`api/messages/${conversationId}`, {_id: $session?.user._id});
            if (res.ok) return await res.json();
        } catch (error) {
            console.log(error);
        }
    }

    async function getMessageSender(id: string) {
        try {
            const res = await postWithBody('api/auth/get-user-data', {_id : id});
            if (res.ok) return await res.json();
        } catch (error) {
            console.log(error);
        }
    }

    async function getUserData(userId: string | User) {
        try {
            const res = await postWithBody(`api/auth/get-user-data`, {_id: userId});
            if (res.ok) return await res.json();
        }   catch (error) {
            console.log(error);
        }
    }
    
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

    function onSelectConversation(conversationId: string) {
        const findConversation = $conversationsData?.find((c) => c._id == conversationId);
        if (findConversation) currentConversation.set(findConversation);
        if (elemChat) scrollToBottom(elemChat);
        isOpenUserProfile.set(false);
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

    function getElapsedTime(time: string, getForTicket?: boolean, getForCheckStatus?: boolean) {
        const startTime = new Date(time);
        const currentTime = Date.now();
        const elapsedTime = currentTime - startTime;
        const seconds = Math.trunc(elapsedTime / 1000);
        const minutes = Math.trunc(seconds / 60);
        const hours = Math.trunc(minutes / 60);
        const days = Math.trunc(hours / 24);
        const months = Math.trunc(days / 30);
        const years = Math.trunc(months / 12);
        if (getForCheckStatus) {
            if (hours > 0) return 'disable';
        } else {
            if (hours < 1) return `${getForTicket ? `${minutes} phút`: `${minutes}m`}`;
            else if (days < 1) return `${getForTicket ? `${hours} giờ`: `${hours}h`}`;
            else if (months < 1) return `${getForTicket ? `${days} ngày`: `${days}d`}`;
            else if (years < 1) return `${getForTicket ? `${months} tháng`: `${months}m`}`;
            else if (years > 0) return `${getForTicket ? `${years} năm`: `${years}y`}`;
        }
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
                        sender: $session?.user,
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
                    c.messagesData.map((m) => {
                        if (m.messageId === message.messageId) return m = message;
                        return m;
                    })
                } else {
                    c.messagesData?.push(message);
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

    function getConversationAvatar(members: Users, index?: string) {
        if (members.length == 1) return members[0].avatar || '/images/default-avatar.png';
        if (members.length == 2) {
            const checkMembers = members.find((u) => u._id != $session?.user._id);
            if (checkMembers) return checkMembers.avatar || '/images/default-avatar.png';
            else return members[0].avatar || '/images/default-avatar.png';
        }
        if (members.length > 2) return members.map((u) => u.avatar || '/images/default-avatar.png');
    }

    function getConversationDisplayName(conversation: Conversation) {
        if (conversation.chanelName) return conversation.chanelName;
        else if (conversation.members.length == 1) return $session?.user.displayName || $session?.user.email;
        else if (conversation.members.length == 2) {
            const findUser = conversation.members.find((u) => u._id != $session?.user._id);
            if (findUser) return findUser.displayName || findUser.email;
        } else if (conversation.members.length > 2) return conversation.members.map((u) => u.displayName ? u.displayName : u.email).toString().replaceAll(',', ' và ');
    }

    function getConversationLastMessage(messages: Messages, isGetElapsedTime?: boolean, isGetStatus?: boolean) {
        if (messages.length > 0) {
            const messageData = messages[messages.length -1];
            if (isGetElapsedTime) {
                const elapsedTime = getElapsedTime(messageData.createdAt, true);
                return '· ' + elapsedTime;
            } else if (isGetStatus) {
                if (messageData.receivers.length == 2) {
                    if (messageData.sender._id == $session?.user._id) {
                        const status = messageData.status.find((s) => s.receiverId != $session?.user._id)?.status;
                        if (status == 'sent') return 'Chưa nhận';
                        if (status == 'delivered') return 'Đã nhận';
                        if (status == 'received') return 'Đã xem';
                    } else {
                        const status = messageData.status.find((s) => s.receiverId == $session?.user._id)?.status;
                        if (status == 'delivered') return 'Đã nhận';
                        if (status == 'received') return 'disable';
                    }
                } else if (messageData.receivers.length > 2) {
                    if (messageData.sender._id == $session?.user._id) {
                        const modifiedMessageData = messageData.status.filter((s) => s.receiverId != $session?.user._id);
                        const checkStatus = modifiedMessageData.some((status) => status.status == 'delivered') 
                        if (checkStatus) return 'Đã nhận';
                        const received = modifiedMessageData.filter((s) => s.status == 'received');
                        if (received) return received;
                    } else {

                    }
                    const status = messageData.status.find((s) => s.receiverId == $session?.user._id)?.status;
                }
            } else {
                if (messageData.sender._id == $session?.user._id) return `Bạn: ${messageData.text}`;
                else return messageData.text
            }
        }
    }

    function getReceivers(members: Users) {
        if (members.length > 0) return members.filter((u) => u._id != $session?.user._id).map((u) => u._id);
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

    function getNewMessagesDisplayName() {
        const displayName = 'Trò chuyện với '
        if (selectedReceivers.length == 1) return displayName + selectedReceivers[0];
        else if (selectedReceivers.length > 1) return displayName + selectedReceivers.toString().replaceAll(',', ' và ');
        else if (!selectedReceivers.length) return 'Hội thoại mới';
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

<div class="bg-zinc-800 w-full min-h-screen flex flex-row">
    <div class="conversation-listing-screen p-4 pt-2 min-w-80 max-w-80 border-r border-solid border-r-zinc-700">
        <div class="header h-20 flex flex-row justify-between items-center">
            <h1 class="text-white font-bold text-lg">Chats</h1>
            <button 
                type="button" 
                class="btn-icon !bg-transparent" 
                on:click={() => isCreateNewConversation = true}
            >
                <Fa icon={faSquarePlus} size="2x" color="#ffffff" />
            </button>
        </div>
        <div class="search-input my-2">
            <label class="label">
                <input class="input bg-[#3a3b3c] h-10 border-0 focus:outline-none px-2 text-white rounded-md" type="email" placeholder="Tìm kiếm" bind:value={q}/>
            </label>
        </div>
        <div class="conversation-listing">
            <div class="space-y-4 overflow-y-auto">
                <div class="flex flex-col space-y-1">
                    {#if isCreateNewConversation}
                        <div class="card flex justify-center items-center bg-zinc-800 brightness-125 p-2 mt-1">
                            <div class="avatar flex justify-center items-center rounded-full bg-zinc-700 bg-opacity-40 w-16 h-16">
                                <Fa icon={faUser} size="2x" color="#ffffff" />
                            </div>
                            <div class="flex-1 overflow-hidden max-h-16 text-ellipsis px-2">
                                {#key selectedReceivers}
                                    <span class="text-white max-h-16 text-ellipsis font-medium">{getNewMessagesDisplayName()}</span>
                                {/key}
                            </div>
                            <div class="butt flex justify-center items-center p-2 rounded-full bg-zinc-700 brightness-150 w-8 h-8">
                                <button class="button" on:click={() => isCreateNewConversation = false}>
                                    <Fa icon={faClose} size="1x" color="#ffffff" />
                                </button>
                            </div>
                            <!-- <button class="button bg-transparent">
                            </button> -->
                        </div>
                    {/if}
                    {#await ticketData}
                        <h1>Loading chats ticket</h1>
                    {:then tickets}    
                        {#each tickets as ticket}
                            <button
                                type="button"
                                class="btn max-w-full rounded-md px-2 flex items-center {ticket._id === $currentConversation?._id
                                    ? 'variant-filled-primary'
                                    : 'bg-surface-hover-token'}"
                                on:click={() => onSelectConversation(ticket._id)}
                            >
                                {#if Array.isArray(ticket.avatar) && ticket.avatar.length > 1}
                                    <div class="relative flex justify-between w-16 h-16">
                                        <div class="absolute top-0 right-0 avatar">
                                            <Avatar border="border-2 border-zinc-800" src={ticket.avatar[0]} width="w-12" />
                                        </div>
                                        <div class="absolute bottom-0 left-0 avatar">
                                            <Avatar border="border-2 border-zinc-800" src={ticket.avatar[1]} width="w-12" />
                                        </div>
                                        {#if ticket.onlineStatus && ticket.onlineStatus !== 'offline'}
                                            <div class="online-status bottom-0 right-0 absolute rounded-full bg-[#30a24c] h-4 w-4"/>
                                            {#if ticket.onlineStatus !== 'online'}
                                                <div class="online-status bottom-0 border-2 border-zinc-800 right-[-5px] absolute rounded-full bg-[#284a2c]">
                                                    {#if ticket.onlineStatus !== 'online'}
                                                        <p class="text-[#30a24c] font-bold text-xs px-1">{getElapsedTime(ticket.onlineStatus) || ''}</p>
                                                    {/if}
                                                </div>
                                            {/if}
                                        {/if}
                                    </div>
                                {:else}    
                                    <div class="relative avatar">
                                        <Avatar src={ticket.avatar} width="w-16" />
                                        {#if ticket.onlineStatus && ticket.onlineStatus !== 'offline'}
                                            {#if ticket.onlineStatus === 'online'}
                                                <div class="online-status bottom-0 right-0 absolute rounded-full bg-[#30a24c] h-4 w-4"/>
                                            {:else if ticket.onlineStatus !== 'online' && getElapsedTime(ticket.onlineStatus, false, true) !== 'disable'}
                                                <div class="online-status bottom-0 border-2 border-zinc-800 right-[-5px] absolute rounded-full bg-[#284a2c]">
                                                    {#if ticket.onlineStatus !== 'online'}
                                                        <p class="text-[#30a24c] font-bold text-xs px-1">{getElapsedTime(ticket.onlineStatus) || ''}</p>
                                                    {/if}
                                                </div>
                                            {/if}
                                        {/if}
                                    </div>
                                {/if}
                                <div class="flex-1 flex flex-col h-full text-start w-full overflow-hidden">
                                    <span class="text-start mb-2 font-medium text-ellipsis overflow-hidden text-white">
                                        {ticket.displayName}
                                    </span>
                                    <div>
                                        <span class="text-white opacity-50 text-sm">{getConversationLastMessage(ticket.messagesData)  || ''}</span>
                                        <span class="text-white opacity-50 text-sm">{getConversationLastMessage(ticket.messagesData, true)  || ''}</span>
                                        <span class="text-white opacity-50 text-sm">{getConversationLastMessage(ticket.messagesData, false, true)  || ''}</span>
                                    </div>
                                </div>
                            </button>
                        {/each}
                    {/await}
                </div>
            </div>
        </div>
    </div>
    <div class="relative conversation-screen w-full h-full max-w-[calc(100%-320px)] max-h-dvh flex flex-col flex-1">
        {#if $isOpenUserProfile}
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
                    <div class="flex flex-rol flex-1 items-center">
                        {#if $currentConversation}
                            {#if $currentConversation.members.length > 2}
                                <div class="relative flex justify-between w-12 h-12">
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
                {/if}   
            </div>
            <div class="conversation h-full flex flex-1">
                <div class="flex flex-col max-h-dvh h-full overflow-hidden flex-1">
                    <!-- Conversation -->
                    <section bind:this={elemChat} class="flex-1 p-4 min-h-[calc(100dvh-72px)] pt-24 overflow-y-auto space-y-4">
                        {#await currentConversationData}
                            <h1>Loading messages</h1>
                        {:then conversations} 
                            {#if conversations}
                                {#each conversations.messagesData as message, i}
                                    {#if message.sender._id !== $session?.user._id}
                                        <div class="flex flex-row !my-px items-end">
                                            <div class="sender-avatar {conversations.members.length > 2 ? 'w-8 mr-2 mb-6' : 'w-0'}">
                                                {#if conversations.members.length > 2 &&
                                                    conversations.messagesData[i].sender._id !== conversations.messagesData[i + 1]?.sender._id
                                                }
                                                    <Avatar src={message.sender.avatar || '/images/default-avatar.png'} width="w-8" />
                                                {/if}
                                            </div>
                                            <div class="">
                                                {#if conversations.messagesData[i - 1] && 
                                                    conversations.messagesData[i].sender._id !== conversations.messagesData[i - 1].sender._id &&
                                                    conversations.members.length > 2 || i == 0
                                                }
                                                    <p class="opacity-50 text-white">{message.sender.displayName || message.sender.email}</p>
                                                {/if}
                                                <div class="flex justify-start">
                                                    <div class="bg-zinc-500 card px-4 py-2 rounded-3xl variant-soft
                                                        {conversations.messagesData[i - 1] && conversations.messagesData[i].sender._id == conversations.messagesData[i - 1].sender._id ? 'rounded-tl': '' }
                                                        {conversations.messagesData[i + 1] && conversations.messagesData[i].sender._id == conversations.messagesData[i + 1].sender._id ? 'rounded-bl': '' }
                                                    ">
                                                        <p class="text-white">{message.text}</p>
                                                    </div>
                                                </div>
                                                {#if (conversations.messagesData[i].sender._id !== conversations.messagesData[i + 1]?.sender._id) ||
                                                    conversations.messagesData[i - 1] && 
                                                    conversations.messagesData[i].sender._id !== conversations.messagesData[i - 1].sender._id &&
                                                    conversations.messagesData[i].sender._id !== conversations.messagesData[i + 1]?.sender._id
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
                                                        {conversations.messagesData[i - 1] && conversations.messagesData[i].sender._id == conversations.messagesData[i - 1].sender._id ? 'rounded-tr': '' }
                                                        {conversations.messagesData[i + 1] && conversations.messagesData[i].sender._id == conversations.messagesData[i + 1].sender._id ? 'rounded-br': '' }
                                                    ">
                                                        <p class="text-white">{message.text}</p>
                                                    </div>
                                                </div>
                                                {#if (conversations.messagesData[i].sender._id !== conversations.messagesData[i + 1]?.sender._id) ||
                                                    conversations.messagesData[i - 1] && 
                                                    conversations.messagesData[i].sender._id !== conversations.messagesData[i - 1].sender._id &&
                                                    conversations.messagesData[i].sender._id !== conversations.messagesData[i + 1]?.sender._id
                                                }
                                                    <div class="flex flex-row justify-end">
                                                        <small class="opacity-50 text-white">{getTimestamp(message.createdAt) || ''}</small>
                                                        
                                                    </div>
                                                {/if}
                                            </div>
                                            <div class="message-status w-6">
                                                {#key conversations}
                                                    <!-- {#if getMyLastMessagesIndex(conversations.messagesData, i)} -->
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
</div>