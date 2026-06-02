import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import Razorpay from "razorpay";
import { authOptions } from "@/config/auth";
import { db } from "@/lib/db/server";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

function getRazorpayClient() {
  return new Razorpay({
    key_id: requiredEnv("RAZORPAY_LIVE_KEY"),
    key_secret: requiredEnv("RAZORPAY_LIVE_SECRET"),
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId } = await req.json();

    // Get user from database
    const sql = db();
    const [userData] = await sql<{ userId: string; email: string }[]>`
            SELECT "userId", email
            FROM users
            WHERE email = ${session.user.email}
            LIMIT 1
        `;

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("🔄 Creating subscription for userId:", userData.userId);

    const response = await getRazorpayClient().subscriptions.create({
      plan_id: planId,
      customer_notify: true,
      quantity: 1,
      total_count: 12,
      notes: {
        userId: userData.userId,
        userEmail: userData.email,
      },
    });

    console.log("✅ Subscription created with userId in notes");
    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ Create subscription error:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 },
    );
  }
}
