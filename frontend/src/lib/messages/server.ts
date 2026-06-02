"use server";

import { db } from "@/lib/db/server";
import type { Messages } from "@/types/messages";

export async function createMessage({
  userId,
  message,
  role,
}: {
  userId: string;
  message: string;
  role: "user" | "assistant";
}) {
  const sql = db();
  const [data] = await sql<Messages[]>`
        INSERT INTO messages ("userId", message, role)
        VALUES (${userId}, ${message}, ${role}::message_role)
        RETURNING id, "userId", role, message, "createdAt"
    `;

  return data as Messages;
}
