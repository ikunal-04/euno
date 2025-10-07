
export type Users = {
    id: number;
    userId: string;
    name: string;
    email: string;
    imageUrl: string;
    razorpayCustomerId: string;
    plans: "FREE" | "PRO" | "ULTRA";
    createdAt: Date;
}
