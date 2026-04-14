import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendEmail as sendEmailService } from "@/lib/emailService";

// POST /api/email/send - Send an email directly
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { to, subject, html, template, templateData, contactId } = body;

    if (!to || !subject) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject" },
        { status: 400 },
      );
    }

    const result = await sendEmailService({
      to,
      subject,
      html: html || "",
      userId: session.user.id,
      templateType: template,
      metadata: templateData,
    });

    // Log the email
    await prisma.emailLog.create({
      data: {
        userId: session.user.id,
        toEmail: to,
        subject,
        status: result.success ? "sent" : "failed",
        sentAt: result.success ? new Date() : null,
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, messageId: result.emailLogId });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
