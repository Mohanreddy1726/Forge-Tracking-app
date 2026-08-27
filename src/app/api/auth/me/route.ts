import { NextResponse } from "next/server";
import { connectDB } from "@/server/db";
import { User } from "@/server/models";
import { getUserId } from "@/server/session";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ user: null });

  try {
    await connectDB();
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ user: null });
    return NextResponse.json({ user: { id: String(user._id), email: user.email } });
  } catch {
    return NextResponse.json({ user: null });
  }
}
