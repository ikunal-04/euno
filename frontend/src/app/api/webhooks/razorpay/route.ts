import { type NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils";
import { db } from "@/lib/db/server";

type RazorpaySubscriptionPayload = {
  id?: string;
  status?: string;
  customer?: string;
  customer_id?: string;
  notes?: {
    userId?: string;
  };
};

type RazorpayPaymentPayload = {
  subscription_id?: string;
};

type RazorpayWebhook = {
  event?: string;
  payload?: {
    payment?: {
      entity?: RazorpayPaymentPayload;
    };
    subscription?: {
      entity?: RazorpaySubscriptionPayload;
    };
  };
};

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
    const bodyText = await req.text();
    const sig = req.headers.get("x-razorpay-signature");

    if (!sig) {
      return NextResponse.json(
        { error: "Missing Razorpay signature" },
        { status: 400 },
      );
    }

    const isValid = validateWebhookSignature(
      bodyText,
      sig,
      requiredEnv("RAZORPAY_WEBHOOK_SECRET"),
    );
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 },
      );
    }

    let webhook: RazorpayWebhook;
    try {
      webhook = JSON.parse(bodyText) as RazorpayWebhook;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const eventType = webhook.event;
    const payload = webhook.payload || {};

    switch (eventType) {
      case "subscription.activated":
      case "subscription.created": {
        const subscription = payload.subscription?.entity;

        console.log("calll cammeeeee");

        if (subscription?.notes?.userId) {
          const userId = subscription.notes.userId;
          const customerId =
            subscription.customer_id ?? subscription.customer ?? null;
          const subscriptionId = subscription.id ?? null;
          const subscriptionStatus = subscription.status ?? null;

          const sql = db();
          await sql`
            UPDATE users
            SET
              plans = ${"PRO"}::user_plan,
              "razorpayCustomerId" = ${customerId},
              "razorpaySubscriptionId" = ${subscriptionId},
              "subscriptionStatus" = ${subscriptionStatus}
            WHERE "userId" = ${userId}
          `;
        }
        break;
      }

      case "subscription.cancelled": {
        const subscription = payload.subscription?.entity;

        if (subscription?.notes?.userId) {
          const userId = subscription.notes.userId;
          const subscriptionStatus = subscription.status ?? null;
          const sql = db();
          await sql`
            UPDATE users
            SET plans = ${"FREE"}::user_plan, "subscriptionStatus" = ${subscriptionStatus}
            WHERE "userId" = ${userId}
          `;
        }
        break;
      }

      case "subscription.charged":
      case "subscription.charged.success": {
        const payment = payload.payment?.entity;

        console.log("calll cammeeeee 2");

        if (!payment?.subscription_id) {
          break;
        }

        console.log("calll cammeeeee 3");

        try {
          const subscription = await getRazorpayClient().subscriptions.fetch(
            payment.subscription_id,
          );

          const userId = subscription.notes?.userId;
          if (!userId) {
            break;
          }

          const sql = db();
          await sql`
            UPDATE users
            SET
              "razorpayCustomerId" = ${subscription.customer_id ?? null},
              "razorpaySubscriptionId" = ${subscription.id ?? null},
              "subscriptionStatus" = ${subscription.status ?? null}
            WHERE "userId" = ${userId}
          `;
        } catch (err) {
          console.error("❌ Error fetching subscription from Razorpay:", err);
        }
        break;
      }

      case "subscription.updated": {
        const subscription = payload.subscription?.entity;

        console.log("calll cammeeeee 3");

        if (subscription?.notes?.userId) {
          const userId = subscription.notes.userId;
          const subscriptionStatus = subscription.status ?? null;
          const sql = db();
          await sql`
            UPDATE users
            SET "subscriptionStatus" = ${subscriptionStatus}
            WHERE "userId" = ${userId}
          `;
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ message: "Webhook processed" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
