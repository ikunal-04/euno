import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_TEST_KEY, key_secret: process.env.RAZORPAY_TEST_SECRET });

export async function POST(req: NextRequest) {
    const { planId } = await req.json();
    
    try {
        const response = await razorpay.subscriptions.create({
            plan_id: planId,
            customer_notify: true,
            quantity: 1,
            total_count: 12,
    })

        return NextResponse.json(response);
    } catch (error) {
        console.error(error);
        throw new Error("Failed to create the subscription for the user!!");
    }
}
