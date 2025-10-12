
declare global {
    interface Window {
        Razorpay: any,
    }
}

export const createSubscription = async (planId: string, name?: string, email?: string) => {
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
            key: process.env.RAZORPAY_LIVE_KEY,
            subscription_id: id,
            name: "Euno",
            description: "Your AI Companion for Life's Moments",
            image: "/logo.svg",
            // callback_url: "http://localhost:3000",
            handler: function (response: any) {
                fetch("/api/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_subscription_id: response.razorpay_subscription_id,
                        razorpay_signature: response.razorpay_signature,
                    }),
                }).then(() => {
                    window.location.href = "/";
                });
            },
            prefill: {
                name: name || "",
                email: email || "",
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
