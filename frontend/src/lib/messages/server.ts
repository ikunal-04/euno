"use server";

import { createClient } from "@/lib/db/server";
import { Messages } from "@/types/messages";

export async function createMessage({userId, message, role}: {userId: string, message: string, role: "user" | "assistant"}) {
    const supabase = await createClient();
    const { data, error } = await supabase
    .from("messages")
    .insert({userId, message, role})
    .select()
    .single();

    if (error) throw error;
    return data as Messages;
}

