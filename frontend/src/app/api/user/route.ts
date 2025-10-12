import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/config/auth";
import { createClient } from "@/lib/db/server";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Fetch user details from Supabase
    const { data, error } = await supabase
        .from("users")
        .select("id, userId, name, email, imageUrl, plans")
        .eq("email", session.user.email)
        .single();

    if (error) {
        console.error("Error fetching user from Supabase:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ user: data });
}
