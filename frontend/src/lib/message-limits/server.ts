"use server"

import { createClient } from "@/lib/db/server";

export interface MessageLimitInfo {
    canSendMessage: boolean;
    currentCount: number;
    limit: number;
    isPro: boolean;
    remainingMessages: number;
}

export async function checkMessageLimit(userId: string): Promise<MessageLimitInfo> {
    try {
        const supabase = await createClient();
        
        // Get user's plan and message count
        const { data: userData } = await supabase
            .from("users")
            .select("plans, messageCount, lastMessageDate")
            .eq("userId", userId)
            .single();

        const isPro = userData?.plans === "PRO";
        const limit = isPro ? Infinity : 15; // Pro users have unlimited, free users have 15

        if (isPro) {
            return {
                canSendMessage: true,
                currentCount: 0,
                limit: Infinity,
                isPro: true,
                remainingMessages: Infinity
            };
        }

        // Check if it's a new day for free users
        const today = new Date().toISOString().split('T')[0];
        const lastMessageDate = userData?.lastMessageDate;
        
        let currentCount = 0;
        if (lastMessageDate === today) {
            // Same day, use existing count
            currentCount = userData?.messageCount || 0;
        } else {
            // New day, reset count
            currentCount = 0;
        }

        const canSendMessage = currentCount < limit;
        const remainingMessages = Math.max(0, limit - currentCount);

        return {
            canSendMessage,
            currentCount,
            limit,
            isPro: false,
            remainingMessages
        };

    } catch (error) {
        console.error("Error checking message limit:", error);
        // Default to allowing messages if there's an error
        return {
            canSendMessage: true,
            currentCount: 0,
            limit: 15,
            isPro: false,
            remainingMessages: 15
        };
    }
}

export async function incrementMessageCount(userId: string): Promise<void> {
    try {
        const supabase = await createClient();
        const today = new Date().toISOString().split('T')[0];

        // Get current user data
        const { data: userData } = await supabase
            .from("users")
            .select("messageCount, lastMessageDate")
            .eq("userId", userId)
            .single();

        const lastMessageDate = userData?.lastMessageDate;
        const currentCount = userData?.messageCount || 0;

        let newCount = 1;
        if (lastMessageDate === today) {
            // Same day, increment existing count
            newCount = currentCount + 1;
        } else {
            // New day, reset to 1
            newCount = 1;
        }

        // Update user's message count and last message date
        await supabase
            .from("users")
            .update({
                messageCount: newCount,
                lastMessageDate: today
            })
            .eq("userId", userId);

    } catch (error) {
        console.error("Error incrementing message count:", error);
    }
}

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
