import type { User } from "./auth"

export type Message = {
    messageId: string | undefined
    conversationId: string | undefined,
    createdAt: string,
    updatedAt: string | undefined,
    sender: string | User,
    text: string | undefined,
    receivers: string[],
    status: MessageStatus,
};

export type MessageStatus = [{
    receiverId: string;
    status: string;
}] | [];

export type Messages = Message[] | [];