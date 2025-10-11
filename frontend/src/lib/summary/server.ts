import { createClient } from "@/lib/db/server";
import { GoogleGenAI } from "@google/genai";
import { SUMMARY_PROMPT } from "./prompt";

async function getUserMessage(userId: string): Promise<string | undefined> {
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

        const summaryText = userMessages.map((msg) => msg.content).join(" ");

        return summaryText;
    } catch (error) {
        console.error("Error fetching user messages from db!");
        return undefined;
    }

// export async function generateSummary({userId}: {userId: string}) {
//     const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
//     const messages = getUserMessage(userId);

//     const response = await ai.models.generateContent({
//         model: "gemini-2.5-pro",
//         contents: messages,
//         config: {
//             systemInstruction: SUMMARY_PROMPT
//         }
//     });
}