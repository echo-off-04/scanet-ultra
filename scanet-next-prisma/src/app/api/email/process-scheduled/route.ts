import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/emailService";

// POST /api/email/process-scheduled - Process all pending scheduled emails (cron replacement)
export async function POST(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Also allow authenticated users to trigger manually
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const now = new Date();
    let sent = 0;
    let failed = 0;

    // 1. Process scheduled emails
    const pendingEmails = await prisma.scheduledEmail.findMany({
      where: {
        status: "pending",
        scheduledFor: { lte: now },
      },
      include: {
        recipients: { where: { status: "pending" } },
        user: {
          select: { email: true, profile: { select: { fullName: true } } },
        },
      },
    });

    for (const email of pendingEmails) {
      try {
        for (const recipient of email.recipients) {
          try {
            const result = await sendEmail({
              to: recipient.email,
              subject: email.subject,
              html: email.body,
              userId: email.userId,
            });

            if (result.success) {
              await prisma.scheduledEmailRecipient.update({
                where: { id: recipient.id },
                data: { status: "sent", sentAt: new Date() },
              });
              sent++;
            } else {
              await prisma.scheduledEmailRecipient.update({
                where: { id: recipient.id },
                data: { status: "failed" },
              });
              failed++;
            }
          } catch {
            await prisma.scheduledEmailRecipient.update({
              where: { id: recipient.id },
              data: { status: "failed" },
            });
            failed++;
          }
        }

        // Update email status
        const allRecipients = await prisma.scheduledEmailRecipient.findMany({
          where: { scheduledEmailId: email.id },
        });
        const allSent = allRecipients.every(
          (r: { status: string }) => r.status === "sent",
        );
        const anyFailed = allRecipients.some(
          (r: { status: string }) => r.status === "failed",
        );

        await prisma.scheduledEmail.update({
          where: { id: email.id },
          data: {
            status: allSent ? "sent" : anyFailed ? "failed" : "sent",
            sentAt: new Date(),
          },
        });

        // Log the email
        await prisma.emailLog.create({
          data: {
            userId: email.userId,
            toEmail: email.recipients
              .map((r: { email: string }) => r.email)
              .join(", "),
            subject: email.subject,
            status: allSent ? "sent" : "failed",
            sentAt: new Date(),
          },
        });
      } catch (error) {
        console.error(`Error processing scheduled email ${email.id}:`, error);
        await prisma.scheduledEmail.update({
          where: { id: email.id },
          data: {
            status: "failed",
            errorMessage:
              error instanceof Error ? error.message : "Unknown error",
          },
        });
        failed++;
      }
    }

    // 2. Process email sequence sends
    const pendingSends = await prisma.emailSequenceSend.findMany({
      where: {
        status: "pending",
        scheduledFor: { lte: now },
      },
      include: {
        enrollment: {
          include: {
            contact: true,
            sequence: {
              include: {
                steps: { orderBy: { stepOrder: "asc" } },
                user: {
                  select: {
                    profile: { select: { fullName: true, email: true } },
                  },
                },
              },
            },
          },
        },
        step: true,
      },
    });

    for (const send of pendingSends) {
      try {
        const contact = send.enrollment.contact;
        if (!contact?.email) {
          await prisma.emailSequenceSend.update({
            where: { id: send.id },
            data: { status: "cancelled" },
          });
          continue;
        }

        // Replace template variables
        let subject = send.step.subject;
        let body = send.step.body;
        const firstName =
          contact.fullName?.split(" ")[0] || contact.fullName || "";
        const senderName =
          send.enrollment.sequence.user?.profile?.fullName || "";

        subject = subject.replace(/\{\{prenom\}\}/g, firstName);
        subject = subject.replace(
          /\{\{nom_complet\}\}/g,
          contact.fullName || "",
        );
        body = body.replace(/\{\{prenom\}\}/g, firstName);
        body = body.replace(/\{\{nom_complet\}\}/g, contact.fullName || "");
        body = body.replace(/\{\{entreprise\}\}/g, contact.company || "");
        body = body.replace(/\{\{expediteur\}\}/g, senderName);

        const result = await sendEmail({
          to: contact.email,
          subject,
          html: body,
          userId: send.enrollment.sequence.userId,
        });

        if (result.success) {
          await prisma.emailSequenceSend.update({
            where: { id: send.id },
            data: { status: "sent", sentAt: new Date() },
          });

          // Check if all steps are completed
          const allSteps = send.enrollment.sequence.steps;
          const currentStepIndex = allSteps.findIndex(
            (s: { id: string }) => s.id === send.stepId,
          );
          const nextStep = allSteps[currentStepIndex + 1];

          if (nextStep) {
            // Schedule next step
            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + nextStep.delayDays);
            nextDate.setHours(nextDate.getHours() + nextStep.delayHours);

            await prisma.emailSequenceSend.create({
              data: {
                enrollmentId: send.enrollmentId,
                stepId: nextStep.id,
                status: "pending",
                scheduledFor: nextDate,
              },
            });

            await prisma.emailSequenceEnrollment.update({
              where: { id: send.enrollmentId },
              data: { currentStep: currentStepIndex + 2 },
            });
          } else {
            // Sequence completed
            await prisma.emailSequenceEnrollment.update({
              where: { id: send.enrollmentId },
              data: { status: "completed", completedAt: new Date() },
            });
          }

          sent++;
        } else {
          await prisma.emailSequenceSend.update({
            where: { id: send.id },
            data: { status: "failed" },
          });
          failed++;
        }
      } catch (error) {
        console.error(`Error processing sequence send ${send.id}:`, error);
        await prisma.emailSequenceSend.update({
          where: { id: send.id },
          data: { status: "failed" },
        });
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      failed,
      processed: pendingEmails.length + pendingSends.length,
    });
  } catch (error) {
    console.error("Error processing scheduled emails:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
