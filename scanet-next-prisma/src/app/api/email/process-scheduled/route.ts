import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/emailService";
import { buildTemplateVariables, renderTemplate } from "@/lib/emailSequences";

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
              templateType: "scheduled",
              metadata: {
                email_type: "scheduled",
                body_html: email.body,
                body_text: email.body,
                scheduled_email_id: email.id,
                recipient_id: recipient.id,
              },
            });

            if (result.success) {
              await prisma.scheduledEmailRecipient.update({
                where: { id: recipient.id },
                data: {
                  status: "sent",
                  sentAt: new Date(),
                  emailLogId: result.emailLogId,
                  errorMessage: null,
                },
              });
              sent++;
            } else {
              await prisma.scheduledEmailRecipient.update({
                where: { id: recipient.id },
                data: {
                  status: "failed",
                  errorMessage: result.error ?? "Unknown error",
                },
              });
              failed++;
            }
          } catch {
            await prisma.scheduledEmailRecipient.update({
              where: { id: recipient.id },
              data: { status: "failed", errorMessage: "Unknown error" },
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
                    profile: { select: { fullName: true, email: true, company: true } },
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

        const senderName =
          send.enrollment.sequence.user?.profile?.fullName || "";
        const senderCompany =
          send.enrollment.sequence.user?.profile?.company || "";
        const templateVariables = buildTemplateVariables({
          contact: {
            fullName: contact.fullName,
            email: contact.email,
            company: contact.company,
            jobTitle: contact.jobTitle,
            source: contact.source,
          },
          senderName,
          senderCompany,
        });
        const subject = renderTemplate(send.step.subject, templateVariables);
        const body = renderTemplate(send.step.body, templateVariables);

        const result = await sendEmail({
          to: contact.email,
          subject,
          html: body,
          userId: send.enrollment.sequence.userId,
          templateType: "follow_up",
          metadata: {
            email_type: "sequence",
            body_html: body,
            body_text: body,
            sequence_id: send.enrollment.sequenceId,
            enrollment_id: send.enrollmentId,
            step_order: send.step.stepOrder,
          },
        });

        if (result.success) {
          await prisma.emailSequenceSend.update({
            where: { id: send.id },
            data: {
              status: "sent",
              sentAt: new Date(),
              emailLogId: result.emailLogId,
              errorMessage: null,
            },
          });

          await prisma.emailSequenceEnrollment.update({
            where: { id: send.enrollmentId },
            data: { currentStep: send.step.stepOrder },
          });

          const remainingSends = await prisma.emailSequenceSend.count({
            where: { enrollmentId: send.enrollmentId, status: "pending" },
          });

          if (remainingSends === 0) {
            await prisma.emailSequenceEnrollment.update({
              where: { id: send.enrollmentId },
              data: { status: "completed", completedAt: new Date() },
            });
          }

          sent++;
        } else {
          await prisma.emailSequenceSend.update({
            where: { id: send.id },
            data: {
              status: "failed",
              errorMessage: result.error ?? "Unknown error",
            },
          });
          failed++;
        }
      } catch (error) {
        console.error(`Error processing sequence send ${send.id}:`, error);
        await prisma.emailSequenceSend.update({
          where: { id: send.id },
          data: {
            status: "failed",
            errorMessage:
              error instanceof Error ? error.message : "Unknown error",
          },
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
