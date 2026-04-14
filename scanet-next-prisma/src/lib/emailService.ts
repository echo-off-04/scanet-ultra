import { Resend } from "resend";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { emailTemplates } from "./emailTemplates";
import { randomUUID } from "crypto";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!);
}
const FROM_EMAIL =
  process.env.EMAIL_FROM || "ScaNetwork <noreply@scanetwork.com>";

export type EmailTemplateType =
  | "welcome"
  | "opportunity_won"
  | "event_reminder"
  | "password_reset"
  | "offer_individual"
  | "offer_pack"
  | "follow_up"
  | "custom";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  userId: string;
  templateType?: string;
  metadata?: Record<string, unknown>;
}

interface SendEmailResult {
  success: boolean;
  error?: string;
  trackingToken?: string;
  emailLogId?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  userId,
  templateType,
  metadata,
}: SendEmailParams): Promise<SendEmailResult> {
  const trackingToken = randomUUID();

  try {
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      const log = await prisma.emailLog.create({
        data: {
          userId,
          toEmail: to,
          fromEmail: FROM_EMAIL,
          subject,
          templateType: templateType || "custom",
          status: "failed",
          trackingToken,
          metadata: (metadata ?? undefined) as
            | Prisma.InputJsonValue
            | undefined,
          sentAt: new Date(),
        },
      });

      return { success: false, error: error.message, emailLogId: log.id };
    }

    const log = await prisma.emailLog.create({
      data: {
        userId,
        toEmail: to,
        fromEmail: FROM_EMAIL,
        subject,
        templateType: templateType || "custom",
        status: "sent",
        resendId: data?.id,
        trackingToken,
        metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        sentAt: new Date(),
      },
    });

    return { success: true, trackingToken, emailLogId: log.id };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendWelcomeEmail(
  userId: string,
  to: string,
  name: string,
): Promise<SendEmailResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const html = emailTemplates.welcome({
    userName: name,
    loginUrl: `${appUrl}/auth`,
  });
  return sendEmail({
    to,
    subject: "Bienvenue sur ScaNetwork !",
    html,
    userId,
    templateType: "welcome",
    metadata: { name },
  });
}

export async function sendOpportunityWonEmail(
  userId: string,
  to: string,
  userName: string,
  opportunityTitle: string,
  value: number,
  opportunityId: string,
): Promise<SendEmailResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const html = emailTemplates.opportunityWon({
    userName,
    opportunityTitle,
    value,
    opportunityUrl: `${appUrl}/opportunities/${opportunityId}`,
  });
  return sendEmail({
    to,
    subject: `🎉 Opportunité gagnée : ${opportunityTitle}`,
    html,
    userId,
    templateType: "opportunity_won",
    metadata: { opportunityTitle, value, opportunityId },
  });
}

export async function sendEventReminderEmail(
  userId: string,
  to: string,
  userName: string,
  eventName: string,
  eventDate: string,
  location: string,
  eventId: string,
): Promise<SendEmailResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const html = emailTemplates.eventReminder({
    userName,
    eventName,
    eventDate,
    eventLocation: location,
    eventUrl: `${appUrl}/events/${eventId}`,
  });
  return sendEmail({
    to,
    subject: `📅 Rappel : ${eventName}`,
    html,
    userId,
    templateType: "event_reminder",
    metadata: { eventName, eventDate, location, eventId },
  });
}

export async function sendPasswordResetEmail(
  to: string,
  resetToken: string,
): Promise<SendEmailResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const html = emailTemplates.passwordReset({
    resetUrl: `${appUrl}/reset-password?token=${resetToken}`,
  });
  return sendEmail({
    to,
    subject: "🔐 Réinitialisation de votre mot de passe",
    html,
    userId: "system",
    templateType: "password_reset",
  });
}

export async function sendOfferEmail(
  userId: string,
  to: string,
  data: {
    title: string;
    description?: string;
    price: number;
    originalPrice?: number;
    currency?: string;
    imageUrl?: string;
    features?: string[];
    billingType?: string;
    senderName: string;
    message: string;
    offerSendId?: string;
  },
): Promise<SendEmailResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const trackingToken = randomUUID();

  const html = emailTemplates.offerIndividual({
    ...data,
    trackingUrl: `${appUrl}/api/email/track?token=${trackingToken}&action=open`,
    acceptUrl: `${appUrl}/api/email/track?token=${trackingToken}&action=accept`,
    declineUrl: `${appUrl}/api/email/track?token=${trackingToken}&action=decline`,
  });

  const result = await sendEmail({
    to,
    subject: `💼 Offre : ${data.title}`,
    html,
    userId,
    templateType: "offer_individual",
    metadata: data,
  });

  if (result.success && data.offerSendId) {
    await prisma.offerEmailTracking.create({
      data: {
        offerSendId: data.offerSendId,
        emailLogId: result.emailLogId,
        trackingToken,
      },
    });
  }

  return result;
}

export async function sendOfferPackEmail(
  userId: string,
  to: string,
  data: {
    title: string;
    description?: string;
    totalPrice: number;
    totalOriginalPrice?: number;
    discountPercentage?: number;
    currency?: string;
    items: Array<{
      title: string;
      description?: string;
      price: number;
      quantity?: number;
    }>;
    senderName: string;
    message: string;
    offerSendId?: string;
  },
): Promise<SendEmailResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const trackingToken = randomUUID();

  const html = emailTemplates.offerPack({
    ...data,
    trackingUrl: `${appUrl}/api/email/track?token=${trackingToken}&action=open`,
    acceptUrl: `${appUrl}/api/email/track?token=${trackingToken}&action=accept`,
    declineUrl: `${appUrl}/api/email/track?token=${trackingToken}&action=decline`,
  });

  const result = await sendEmail({
    to,
    subject: `📦 Pack : ${data.title}`,
    html,
    userId,
    templateType: "offer_pack",
    metadata: data,
  });

  if (result.success && data.offerSendId) {
    await prisma.offerEmailTracking.create({
      data: {
        offerSendId: data.offerSendId,
        emailLogId: result.emailLogId,
        trackingToken,
      },
    });
  }

  return result;
}

export async function getEmailLogs(userId: string) {
  return prisma.emailLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getEmailPreferences(userId: string) {
  return prisma.emailPreference.findUnique({
    where: { userId },
  });
}

export async function updateEmailPreferences(
  userId: string,
  preferences: {
    welcomeEmails?: boolean;
    notificationEmails?: boolean;
    marketingEmails?: boolean;
    opportunityEmails?: boolean;
    eventEmails?: boolean;
    digestFrequency?: string;
  },
) {
  return prisma.emailPreference.upsert({
    where: { userId },
    update: preferences,
    create: { userId, ...preferences },
  });
}
