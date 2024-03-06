import type { Users } from '$lib/stores/auth'
import type { Messages } from './message';

export type Conversation = {
    _id: string,
    createdAt: string,
    updatedAt: string,
    lastUpdatedBy: string,
    chanelName: string | undefined,
    displayName: string | undefined,
    members: Users | [],
    admins: object,
    messagesData: Messages,
    avatar: string | (string | undefined)[] | undefined,
    activityTime: string | undefined,
    onlineStatus: string | undefined
};

export type Ticket = {
    id: number,
    conversation: Conversation,
    avatar: string | (string | undefined)[] | undefined,
    displayName: string | undefined
};

export type Tickets = Ticket[];

export type Conversations = Conversation[];