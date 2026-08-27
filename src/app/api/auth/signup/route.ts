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
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    await connectDB();

    const normalized = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalized });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists — sign in instead." },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email: normalized, passwordHash });
    await Profile.create({ userId: user._id });

    await createSession(String(user._id));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not create account" }, { status: 500 });
  }
}
