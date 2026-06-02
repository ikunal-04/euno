"use server";

import { GoogleGenAI } from "@google/genai";
import { db } from "@/lib/db/server";
import { SUMMARY_PROMPT } from "./prompt";

async function getUserMessages(userId: string): Promise<string | undefined> {
  try {
    const sql = db();

    const userMessages = await sql<{ role: string; message: string }[]>`
            SELECT role, message
            FROM messages
            WHERE "userId" = ${userId}
            ORDER BY "createdAt" DESC
            LIMIT 15
        `;

    if (!userMessages || !Array.isArray(userMessages)) {
      return undefined;
    }

    const userOnlyMessages = userMessages
      .filter((msg) => msg.role === "user")
      .map((msg) => msg.message)
      .join(" ");

    return userOnlyMessages;
  } catch {
    console.error("Error fetching user messages from db!");
    return undefined;
  }
}

export async function generateSummary({ userId }: { userId: string }) {
  try {
    const userConversation = await getUserMessages(userId);

    if (!userConversation || userConversation.trim().length === 0) {
      console.log("No user messages found for summary generation");
      return null;
    }

    // Check if we already have a recent summary (within last hour)
    const sql = db();
    const existingSummary = await sql<{ summary: string; createdAt: Date }[]>`
            SELECT summary, "createdAt"
            FROM summary
            WHERE "userId" = ${userId}
            ORDER BY "createdAt" DESC
            LIMIT 1
        `;

    if (existingSummary && existingSummary.length > 0) {
      const lastSummary = existingSummary[0];
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const summaryDate = new Date(lastSummary.createdAt);

      if (summaryDate > oneHourAgo) {
        console.log("Recent summary already exists, skipping generation");
        return lastSummary.summary;
      }
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      console.error("GEMINI_API_KEY is not configured");
      return null;
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userConversation,
      config: {
        systemInstruction: SUMMARY_PROMPT,
      },
    });

    if (response?.text) {
      const summary = response.text.trim();

      // Store the summary in the database
      await sql`
                INSERT INTO summary ("userId", summary)
                VALUES (${userId}, ${summary})
            `;

      console.log("Summary generated and stored successfully");
      return summary;
    }

    return null;
  } catch (error) {
    console.error("Error generating summary:", error);
    return null;
  }
}
