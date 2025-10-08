
export type Users = {
    id: number;
    userId: string;
    name: string;
    email: string;
    imageUrl: string;
    razorpayCustomerId: string;
    razorpaySubscriptionId: string;
    subscriptionStatus: string;
    plans: "FREE" | "PRO";
    createdAt: Date;
}
