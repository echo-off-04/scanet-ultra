import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/emailService";

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Email, password, and full name are required" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        hashedPassword,
        profile: {
          create: {
            email,
            fullName,
          },
        },
        notificationPreferences: {
          create: {
            contactsEnabled: true,
            opportunitiesEnabled: true,
            remindersEnabled: true,
            teamActivityEnabled: true,
            quietHoursEnabled: false,
            emailDigest: "daily",
          },
        },
        emailPreferences: {
          create: {
            welcomeEmails: true,
            notificationEmails: true,
            marketingEmails: true,
            opportunityEmails: true,
            eventEmails: true,
            digestFrequency: "daily",
          },
        },
      },
      include: { profile: true },
    });

    try {
      await sendWelcomeEmail(user.id, email, fullName);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        profile: user.profile,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
