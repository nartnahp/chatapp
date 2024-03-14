import { postWithBody, getFullField } from "$lib/api/apiGateway";
import { conversationsData, socket, session, currentConversation, usersStore, getUser, contactsData } from "./session";
import type { Message } from "./message";
import type { Conversation, Conversations } from "./conversation";
import type { Auth, Users, User } from "./auth";
import type { MessageStatus } from "./message";
import { goto } from '$app/navigation';
import type { AutocompleteOption } from '@skeletonlabs/skeleton';

let socketIo;
let user: Auth;
let currentChat: Conversation | undefined;
let chatData: Conversations;
let usersStorage: Users;
socket.subscribe((s) => {
    socketIo = s;
})
session.subscribe((u) => {
    user = u;
})
currentConversation.subscribe((c) => {
    currentChat = c;
})
conversationsData.subscribe((c) => {
    chatData = c;
})
usersStore.subscribe((u) => {
    usersStorage = u;
})


function getElapsedTime(time: string, getForTicket?: boolean, getForCheckStatus?: boolean, isConversationInfo? : boolean) {
    const startTime = new Date(time);
    const currentTime = Date.now();
    const elapsedTime = currentTime - startTime;
    const seconds = Math.trunc(elapsedTime / 1000);
    const minutes = Math.trunc(seconds / 60);
    const hours = Math.trunc(minutes / 60);
    const days = Math.trunc(hours / 24);
    const months = Math.trunc(days / 30);
    const years = Math.trunc(months / 12);
    if (isConversationInfo) {
        if (time !== 'offline' && time !== 'disable' && time !== 'online') {
            const status = 'Hoạt động '
            if (hours < 1) return `${status} ${minutes} phút trước`;
            else if (days < 1) return `${status} ${hours} giờ trước`;
            else if (months < 1) return `${status} ${days} ngày trước`;
            else if (years < 1) return `${status} ${months} tháng trước`;
            else if (years > 0) return `${status} ${years} năm trước`;
        } else if (time === 'online') return 'Đang hoạt động';
    }
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
    try {
        if (message !== '') {
            await postWithBody('api/messages', {
                conversationId: currentChat?._id,
                receivers: getReceivers(currentChat?.members),
                sender: user?.user._id,
                status: createMessageStatus(currentChat?.members),
                text: message,
            })
            .then(async (res) => {
                const sendedMessage = await res.json();
                socketIo.emit('sendMessage', {
                    messageId: sendedMessage._id,
                    conversationId: currentChat?._id,
                    receivers: sendedMessage.receivers,
                    status: sendedMessage.status,
                    sender: user?.user._id,
                    text: message,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                })
                return true;
            })
            .catch(err => {
                console.log(err);
            })
        }
    }   catch (error) {
        console.log(error);
    }
}

if (socketIo) {
    socketIo.on('getMessage', data => {
        console.log('ooo')
        if (data) {
            const updateStatus = data.status.map((r) => {
                if (r.receiverId == user?.user._id) {
                    r.status = 'delivered';
                    return r;
                } else return r;
            });
            data.status = updateStatus;
            updatedMessage(data);
            if (data.sender._id != user?.user._id) socketIo.emit('deliveredMessage', data);
        }
    });
    socketIo.on('updateDeliveredMessage', data => {
        if (data) updatedMessage(data, true);
    })
};

// update arrival message
const updatedMessage = (message: Message | undefined, isUpdateDeliveredMessage?: boolean) => {
    let updated: Conversations | undefined = chatData?.map((c) => {
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
    } else return [];
};

function getReceivers(members: string[]) {
    if (members.length > 0) return members.filter((u) => u != user?.user._id);
}

function createMessageStatus(members: Users) {
    let messageStatus: MessageStatus = [];
    if (members.length > 0) {
        const receivers = members.filter((u) => u._id != user?.user._id);
        if (receivers.length > 0) receivers.map((u) => messageStatus.push({
            receiverId : u._id,
            status: 'sent'
        }))
    }
    return messageStatus;
}

async function handleCreateConversation(id: string | undefined, members: (string | undefined)[]) {
    try {
        const res = await postWithBody('api/conversations', {
            members: members,
            createdBy: id
        })
        if (res.ok) {
            const newConversation = await res.json();
            if (typeof newConversation == 'string') {
                const redirectConversation = chatData.find((c) => c._id == newConversation);
                currentConversation.set(redirectConversation);
                goto(`/messages/${redirectConversation?._id}`);
            } else {
                const avatar = getConversationAvatar(members, id);
                if (avatar) newConversation.avatar = avatar;
                const displayName = getConversationDisplayName(newConversation, user?.user);
                if (displayName) newConversation.displayName = displayName;
                const updatedConversations = [...chatData, newConversation];
                conversationsData.set(sortConversations(updatedConversations));
                currentConversation.set(newConversation);
                goto(`/messages/${newConversation._id}`)
            }
            return true;
        } else return false;
    } catch (error) {
        console.log(error)
    }
}

async function getAllConversationData(userId: string) {
    try {
        const res = await getFullField(`api/conversations/${userId}`);
        if (res.ok) {
            const data = await res.json();
            if (usersStorage?.length) {
                console.log('usersStorage', usersStorage)
                const updateUsersStore = [...usersStorage, ...data.relatedUsers].filter((item, index) => {
                    return [...usersStorage, ...data.relatedUsers].indexOf(item) === index;
                  });
                console.log('check update user', updateUsersStore)
                usersStore.set(updateUsersStore);
            } else {
                usersStore.set(data.relatedUsers);
            };
            const modifiedData = data.data?.map((c: Conversation) => {
                socketIo.emit('joinsRoom', c._id);
                const avatar = getConversationAvatar(c.members, userId);
                if (avatar) c.avatar = avatar;
                const displayName = getConversationDisplayName(c, user?.user);
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

async function handleGetContacts() {
    try {
        const res = await postWithBody(`api/auth/contacts/${user?.user._id}`)
        if (res.ok) {
            const users = await res.json();
            usersStore.set(users);
            contactsData.set(users);
            const options: AutocompleteOption<string>[] = [];
            const receivers: Users = [];
            users.map((u: User) => {
                options.push({
                    label: u.displayName || u.email,
                    value: u.email,
                    keywords: u.email || u.displayName,
                    meta: { healthy: true }
                });
                receivers.push(u);
            });
            return {options, receivers};
        };
    } catch (error) {
        console.log(error);
    };
};

async function handleFindUser(email: string) {
    try {
        const res = await postWithBody('api/auth/find', {email});
        if (res.ok) {
            return await res.json();
        }
    } catch (error) {
        console.log(error);
    }
};

async function handleAddFriend(id: string) {
    try {
        const res = await postWithBody('api/auth/update', {contacts: id, email: user?.user.email});
        if (res.ok) {
            session.set(await res.json());
            console.log('Add friend Success!');
        }
    } catch (error) {
        console.log(error);
    }
}

export { getElapsedTime, handleSendMessage, handleCreateConversation, getAllConversationData, handleGetContacts, handleAddFriend, handleFindUser }
