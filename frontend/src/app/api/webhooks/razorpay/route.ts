import { NextRequest, NextResponse } from "next/server";
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils";
import Razorpay from "razorpay";
import { createClient } from "@/lib/db/server";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_LIVE_KEY!,
  key_secret: process.env.RAZORPAY_LIVE_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    const sig = req.headers.get("x-razorpay-signature");

    if (!sig) {
      return NextResponse.json({ error: "Missing Razorpay signature" }, { status: 400 });
    }

    const isValid = validateWebhookSignature(bodyText, sig, process.env.RAZORPAY_WEBHOOK_SECRET!);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    let webhook;
    try {
      webhook = JSON.parse(bodyText);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const eventType = webhook.event;
    const payload = webhook.payload || {};
    const entity =
      payload.payment?.entity ||
      payload.subscription?.entity ||
      payload.order?.entity ||
      null;

    switch (eventType) {
      case "subscription.activated":
      case "subscription.created": {
        const subscription = payload.subscription?.entity;

        if (subscription?.notes?.userId) {
          const userId = subscription.notes.userId;
          const customerId = subscription.customer_id || subscription.customer;

          const supabase = await createClient();
          await supabase
            .from("users")
            .update({
              plans: "PRO",
              razorpayCustomerId: customerId,
              razorpaySubscriptionId: subscription.id,
              subscriptionStatus: subscription.status,
            })
            .eq("userId", userId);
        }
        break;
      }

      case "subscription.cancelled": { 
        const subscription = payload.subscription?.entity;

        if (subscription?.notes?.userId) { 
          const userId = subscription.notes.userId; 
          const supabase = await createClient(); 
          await supabase .from("users") 
          .update({ 
            plans: "FREE", 
            subscriptionStatus: 
            subscription.status, 
          }) 
          .eq("userId", userId); 
        } 
        break; 
      }

      case "subscription.charged":
      case "subscription.charged.success": {
        const payment = payload.payment?.entity;

        if (!payment?.subscription_id) {
          break;
        }

        try {
          const subscription = await razorpay.subscriptions.fetch(payment.subscription_id);

          const userId = subscription.notes?.userId;
          if (!userId) {
            break;
          }

          const supabase = await createClient();
          await supabase
            .from("users")
            .update({
              razorpayCustomerId: subscription.customer_id,
              razorpaySubscriptionId: subscription.id,
              subscriptionStatus: subscription.status,
            })
            .eq("userId", userId);

        } catch (err) {
          console.error("❌ Error fetching subscription from Razorpay:", err);
        }
        break;
      }

      case "subscription.updated": {
        const subscription = payload.subscription?.entity;

        if (subscription?.notes?.userId) {
          const userId = subscription.notes.userId;
          const supabase = await createClient();
          const { error } = await supabase
            .from("users")
            .update({
              subscriptionStatus: subscription.status,
            })
            .eq("userId", userId);
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ message: "Webhook processed" }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
