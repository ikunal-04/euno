import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    // Razorpay sends data as x-www-form-urlencoded, not JSON
    const rawBody = await req.text();

    const data = JSON.parse(rawBody);
    const razorpay_payment_id = data.razorpay_payment_id;
    const razorpay_subscription_id = data.razorpay_subscription_id;
    const razorpay_signature = data.razorpay_signature;

    console.log("kya kya mil raha", rawBody)

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Verify the signature
    const key_secret = process.env.RAZORPAY_LIVE_SECRET!;
    const generatedSignature = crypto
      .createHmac("sha256", key_secret)
      .update(razorpay_payment_id + "|" + razorpay_subscription_id)
      .digest("hex");

    const isValid = generatedSignature === razorpay_signature;

    if (!isValid) {
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
    }

    // ✅ Payment verified
    console.log("✅ Payment verification successful");

    // Redirect or respond
    return NextResponse.redirect(new URL("/", req.url)); 

  } catch (error: any) {
    console.error("❌ Payment verification error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
