"use server";

import { db } from "@/lib/db/server";

export interface MessageLimitInfo {
  canSendMessage: boolean;
  currentCount: number;
  limit: number;
  isPro: boolean;
  remainingMessages: number;
}

function toDateOnly(value: Date | string | null | undefined) {
  if (!value) return null;
  if (typeof value === "string") return value.split("T")[0];
  return value.toISOString().split("T")[0];
}

/**
 * Checks user's daily message limit based on their plan.
 */
export async function checkMessageLimit(
  userId: string,
): Promise<MessageLimitInfo> {
  try {
    const sql = db();

    const [userData] = await sql<
      {
        plans: "FREE" | "PRO";
        messageCount: number | null;
        lastMessageDate: Date | string | null;
      }[]
    >`
            SELECT plans, "messageCount", "lastMessageDate"
            FROM users
            WHERE "userId" = ${userId}
            LIMIT 1
        `;

    const isPro = userData?.plans === "PRO";
    const limit = isPro ? Infinity : 5; // 🔥 FREE = 5/day, PRO = unlimited
    const today = new Date().toISOString().split("T")[0];

    let currentCount = 0;

    if (toDateOnly(userData?.lastMessageDate) === today) {
      // Same day → use existing count
      currentCount = userData?.messageCount || 0;
    } else {
      // New day → reset count
      currentCount = 0;
    }

    const canSendMessage = isPro || currentCount < limit;
    const remainingMessages = isPro
      ? Infinity
      : Math.max(0, limit - currentCount);

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
    const sql = db();
    const today = new Date().toISOString().split("T")[0];

    const [userData] = await sql<
      {
        messageCount: number | null;
        lastMessageDate: Date | string | null;
        plans: "FREE" | "PRO";
      }[]
    >`
            SELECT "messageCount", "lastMessageDate", plans
            FROM users
            WHERE "userId" = ${userId}
            LIMIT 1
        `;

    if (!userData) return;

    const isPro = userData.plans === "PRO";
    if (isPro) return; // no limits for pro users

    const lastMessageDate = userData.lastMessageDate;
    let newCount = 1;

    if (toDateOnly(lastMessageDate) === today) {
      newCount = (userData.messageCount ?? 0) + 1;
    }

    await sql`
            UPDATE users
            SET "messageCount" = ${newCount}, "lastMessageDate" = ${today}
            WHERE "userId" = ${userId}
        `;
  } catch (err) {
    console.error("❌ incrementMessageCount failed:", err);
  }
}

/**
 * Utility for plan retrieval if needed elsewhere
 */
export async function getUserPlan(userId: string): Promise<"FREE" | "PRO"> {
  try {
    const sql = db();

    const [userData] = await sql<{ plans: "FREE" | "PRO" }[]>`
            SELECT plans
            FROM users
            WHERE "userId" = ${userId}
            LIMIT 1
        `;

    return userData?.plans || "FREE";
  } catch (error) {
    console.error("Error getting user plan:", error);
    return "FREE";
  }
}
