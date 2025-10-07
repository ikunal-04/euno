import { useSession } from "next-auth/react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/config/auth";

declare global {
    interface Window {
        Razorpay: any,
    }
}

export const createSubscription = async (planId: string) => {
    // const session = await getServerSession(authOptions);
    // const user = session?.user;

    try {

        const response = await fetch("/api/create-subscription", {
            method: "POST",
            body: JSON.stringify({ planId }),
            headers: {
                "Content-Type": "application/json",
            },
        });

        const { id } = await response.json();

        const options = {
            key: process.env.RAZORPAY_TEST_KEY,
            subscription_id: id,
            name: "Innpae",
            description: "Test transactions",
            image: "/avatar-fallback.png",
            callback_url: "http://localhost:3000",
            prefill: {
                name: "user?.name",
                email: "user?.email",
            },
            notes: {
                note_key_1: "Advance Usage"
            },  
            theme: {
                color: "#141413"
            }
        }

        const rzp1 = new window.Razorpay(options);
        rzp1.open();
    } catch (error) {
        console.error("Payment failed", error)
    }
}
