import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/config/auth";
import { createClient } from "@/lib/db/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_TEST_KEY, key_secret: process.env.RAZORPAY_TEST_SECRET });

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { planId } = await req.json();
        
        // Get user from database
        const supabase = await createClient();
        const { data: userData, error } = await supabase
            .from("users")
            .select("userId, email")
            .eq("email", session.user.email)
            .single();

        if (error || !userData) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        console.log("🔄 Creating subscription for userId:", userData.userId);

        const response = await razorpay.subscriptions.create({
            plan_id: planId,
            customer_notify: true,
            quantity: 1,
            total_count: 12,
            notes: {
                userId: userData.userId,
                userEmail: userData.email
            }
        });

        console.log("✅ Subscription created with userId in notes");
        return NextResponse.json(response);
    } catch (error) {
        console.error("❌ Create subscription error:", error);
        return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
    }
}
