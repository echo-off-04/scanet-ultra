import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/emailService";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: "If the email exists, a reset link has been sent.",
      });
    }

    const token = randomUUID();
    const expires = new Date(Date.now() + 3600000); // 1 hour

    // Store reset token in profile metadata or a dedicated table
    await prisma.profile.update({
      where: { userId: user.id },
      data: {
        // We'll use the bio field temporarily or create a proper token system
        // For production, use a dedicated password_reset_tokens table
      },
    });

    // Store token in a simple way - we'll use a JSON field approach
    // In production, create a dedicated table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await prisma.$executeRaw`
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES (${user.id}, ${token}, ${expires})
    `;

    await sendPasswordResetEmail(email, token);

    return NextResponse.json({
      message: "If the email exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
