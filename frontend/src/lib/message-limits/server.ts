"use server";

import { createClient } from "@/lib/db/server";

export interface MessageLimitInfo {
    canSendMessage: boolean;
    currentCount: number;
    limit: number;
    isPro: boolean;
    remainingMessages: number;
}

/**
 * Checks user's daily message limit based on their plan.
 */
export async function checkMessageLimit(userId: string): Promise<MessageLimitInfo> {
    try {
        const supabase = await createClient();

        // Fetch user data from Supabase
        const { data: userData, error } = await supabase
            .from("users")
            .select("plans, messageCount, lastMessageDate")
            .eq("userId", userId)
            .single();

        if (error) throw error;

        const isPro = userData?.plans === "PRO";
        const limit = isPro ? Infinity : 5; // 🔥 FREE = 5/day, PRO = unlimited
        const today = new Date().toISOString().split("T")[0];

        let currentCount = 0;

        if (userData?.lastMessageDate === today) {
            // Same day → use existing count
            currentCount = userData?.messageCount || 0;
        } else {
            // New day → reset count
            currentCount = 0;
        }

        const canSendMessage = isPro || currentCount < limit;
        const remainingMessages = isPro ? Infinity : Math.max(0, limit - currentCount);

        return {
            canSendMessage,
            currentCount,
            limit,
            isPro,
            remainingMessages,
        };
    } catch (error) {
        console.error("Error checking message limit:", error);

        // Default: allow 5 free messages in case of error
        return {
            canSendMessage: true,
            currentCount: 0,
            limit: 5,
            isPro: false,
            remainingMessages: 5,
        };
    }
}

/**
 * Increments the user's message count and resets if new day.
 */
export async function incrementMessageCount(userId: string): Promise<void> {
    try {
        const supabase = await createClient();
        const today = new Date().toISOString().split("T")[0];

        const { data: userData, error: fetchError } = await supabase
            .from("users")
            .select("messageCount, lastMessageDate, plans")
            .eq("userId", userId)
            .single();

        if (fetchError) throw fetchError;
        if (!userData) return;

        const isPro = userData.plans === "PRO";
        if (isPro) return; // no limits for pro users

        const lastMessageDate = userData.lastMessageDate;
        let newCount = 1;

        if (lastMessageDate === today) {
            newCount = (userData.messageCount ?? 0) + 1;
        }

        const { error: updateError } = await supabase
            .from("users")
            .update({
                messageCount: newCount,
                lastMessageDate: today,
            })
            .eq("userId", userId);

        if (updateError) throw updateError;
    } catch (err) {
        console.error("❌ incrementMessageCount failed:", err);
    }
}

/**
 * Utility for plan retrieval if needed elsewhere
 */
export async function getUserPlan(userId: string): Promise<"FREE" | "PRO"> {
    try {
        const supabase = await createClient();

        const { data: userData } = await supabase
            .from("users")
            .select("plans")
            .eq("userId", userId)
            .single();

        return userData?.plans || "FREE";
    } catch (error) {
        console.error("Error getting user plan:", error);
        return "FREE";
    }
}
