import { writable } from 'svelte/store';
import type { Users, User, Auth, OnlineUsers } from './auth';
import type { Conversation, Conversations } from './conversation';

export const session = writable<Auth | undefined>(undefined);
export const conversationsData = writable<Conversations | []>([]);
export const currentConversation = writable<Conversation | undefined>(undefined);
export const recentContact = writable<Users | undefined>(undefined);
export const socket = writable();
export const onlineUsersStore = writable<OnlineUsers | []>([]);
export const isOpenUserProfile = writable<boolean>(false);
export const usersStore = writable<Users | []>([]);

function getUser(id: string | string[] | undefined) {
    let users: Users | [] = [];
    const unsubscribe = usersStore.subscribe((value) => {
        users = value;
    });
    if (Array.isArray(id)) {
        const user = users.filter((user) => id.includes(user._id));
        return user;
    } else {
        const user = users.find((user) => user._id === id);
        return user;
    }
}

export default {
    store: usersStore,
    add(user: User) {
        usersStore.update((users) => [...users, user]);
    },
  };

export { getUser }
