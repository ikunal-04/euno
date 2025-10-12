"use server"

import { createClient } from "@/lib/db/server";
import { GoogleGenAI } from "@google/genai";
import { SUMMARY_PROMPT } from "./prompt";

async function getUserMessages(userId: string): Promise<string | undefined> {
    try {
        const supabase = await createClient();

        const { data: userMessages } = await supabase
        .from("messages")
        .select("*")
        .eq("userId", userId)
        .order("createdAt", { ascending: false })
        .limit(15)

        if (!userMessages || !Array.isArray(userMessages)) {
            return undefined;
        }

        const userOnlyMessages = userMessages
            .filter(msg => msg.role === "user")
            .map((msg) => msg.message)
            .join(" ");

        return userOnlyMessages;
    } catch (error) {
        console.error("Error fetching user messages from db!");
        return undefined;
    }
}

export async function generateSummary({userId}: {userId: string}) {
    try {
        const userConversation = await getUserMessages(userId);

        if (!userConversation || userConversation.trim().length === 0) {
            console.log("No user messages found for summary generation");
            return null;
        }

        // Check if we already have a recent summary (within last hour)
        const supabase = await createClient();
        const { data: existingSummary } = await supabase
            .from("summary")
            .select("summary, createdAt")
            .eq("userId", userId)
            .order("createdAt", { ascending: false })
            .limit(1);

        if (existingSummary && existingSummary.length > 0) {
            const lastSummary = existingSummary[0];
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const summaryDate = new Date(lastSummary.createdAt);
            
            if (summaryDate > oneHourAgo) {
                console.log("Recent summary already exists, skipping generation");
                return lastSummary.summary;
            }
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userConversation,
            config: {
                systemInstruction: SUMMARY_PROMPT
            }
        });

        if (response && response.text) {
            const summary = response.text.trim();
            
            // Store the summary in the database
            const { error } = await supabase
                .from("summary")
                .insert({
                    userId: userId,
                    summary: summary
                });

            if (error) {
                console.error("Error storing summary:", error);
                return null;
            }

            console.log("Summary generated and stored successfully");
            return summary;
        }

        return null;
    } catch (error) {
        console.error("Error generating summary:", error);
        return null;
    }
}
