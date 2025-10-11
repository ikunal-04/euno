
export type Messages = {
    id: string;
    userId: string;
    role: "user" | "assistant";
    message: string;
    createdAt: Date;
}

export type NewUserMessage = Partial<Omit<Messages, 'role' | 'message'>> & {
    role: "user";
    message: string;
}

export type NewAssistantMessage = Partial<Omit<Messages, 'role' | 'message'>> & {
    role: "assistant";
    message: string;
}
