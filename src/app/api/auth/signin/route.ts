import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/server/db";
import { User, Profile } from "@/server/models";
import { createSession } from "@/server/session";

export async function POST(req: Request) {
  try {
    const { email, password } = (await req.json()) as { email?: string; password?: string };
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Backfill a profile row if it's somehow missing.
    const profile = await Profile.findOne({ userId: user._id });
    if (!profile) await Profile.create({ userId: user._id });

    await createSession(String(user._id));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not sign in" }, { status: 500 });
  }
}
