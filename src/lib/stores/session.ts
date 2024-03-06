import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { Users, Auth, OnlineUsers } from './auth';
import type { Conversation, Conversations } from './conversation';
export let checkLastUsername: string | undefined;
export let checkLastPassWords: string | undefined;
export let checkLastAvatar: string | undefined;

if (browser) {
    checkLastUsername = localStorage.lastUsername
    checkLastPassWords = localStorage.lastPasswords
    checkLastAvatar = localStorage.lastAvatar
}

export const session = writable<Auth | undefined>(undefined);
export const conversationsData = writable<Conversations | []>([]);
export const currentConversation = writable<Conversation | undefined>(undefined);
export const recentContact = writable<Users | undefined>(undefined);
export const socket = writable();
export const onlineUsersStore = writable<OnlineUsers | []>([]);
export const isOpenUserProfile = writable<boolean>(false);

export const lastUsername = writable<string | undefined>(checkLastUsername);
export const lastPasswords = writable<string | undefined>(checkLastPassWords);
export const lastAvatar = writable<string | undefined>(checkLastAvatar);


if (browser) {
    lastUsername.subscribe((value) => localStorage.lastUsername = value)
    lastPasswords.subscribe((value) => localStorage.lastPasswords = value)
    lastAvatar.subscribe((value) => localStorage.lastAvatar = value)
}