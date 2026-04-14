import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    // Look up the token
    const result = await prisma.$queryRaw<
      Array<{ user_id: string; expires_at: Date }>
    >`
      SELECT user_id, expires_at FROM password_reset_tokens
      WHERE token = ${token} AND used = FALSE AND expires_at > NOW()
      LIMIT 1
    `;

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 },
      );
    }

    const { user_id } = result[0];
    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user_id },
      data: { hashedPassword },
    });

    // Mark token as used
    await prisma.$executeRaw`
      UPDATE password_reset_tokens SET used = TRUE WHERE token = ${token}
    `;

    return NextResponse.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
