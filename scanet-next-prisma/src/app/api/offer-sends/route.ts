import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendEmail } from "@/lib/emailService";
import { emailTemplates } from "@/lib/emailTemplates";

// POST /api/offer-sends - Send an offer or pack to contacts
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { type, offerId, packId, contactIds, groupId, subject, message } =
      body;

    // Get sender profile
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    let contacts: Array<{
      id: string;
      email: string | null;
      fullName: string | null;
      company: string | null;
    }>;
    if (groupId) {
      const members = await prisma.contactGroupMember.findMany({
        where: { groupId },
        include: { contact: true },
      });
      contacts = members
        .map((m: { contact: any }) => m.contact)
        .filter((c: { email: string | null }) => c.email);
    } else if (contactIds?.length) {
      contacts = await prisma.contact.findMany({
        where: { id: { in: contactIds }, userId: session.user.id },
      });
      contacts = contacts.filter((c: { email: string | null }) => c.email);
    } else {
      return NextResponse.json(
        { error: "No recipients specified" },
        { status: 400 },
      );
    }

    if (!contacts.length) {
      return NextResponse.json(
        { error: "No valid email recipients" },
        { status: 400 },
      );
    }

    let emailHtml: string;
    let emailSubject = subject;

    if (type === "pack" && packId) {
      const pack = await prisma.offerPack.findUnique({
        where: { id: packId },
        include: { items: { include: { offer: true } } },
      });
      if (!pack)
        return NextResponse.json({ error: "Pack not found" }, { status: 404 });

      emailSubject = emailSubject || `Découvrez notre pack ${pack.name}`;
      emailHtml = emailTemplates.offerPack({
        title: pack.name,
        description: pack.description || "",
        items: pack.items.map((i: any) => ({
          title: i.offer.title,
          description: i.offer.description || "",
          price: i.offer.price,
        })),
        discountPercentage: pack.discountPercentage ?? undefined,
        totalPrice: pack.price ?? 0,
        senderName: profile?.fullName || "",
        message: message || "",
      });
    } else if (offerId) {
      const offer = await prisma.offer.findUnique({ where: { id: offerId } });
      if (!offer)
        return NextResponse.json({ error: "Offer not found" }, { status: 404 });

      emailSubject = emailSubject || `Découvrez notre offre : ${offer.title}`;
      emailHtml = emailTemplates.offerIndividual({
        title: offer.title,
        description: offer.description || "",
        price: offer.price ?? 0,
        currency: offer.currency || "EUR",
        features: (offer as any).features || [],
        senderName: profile?.fullName || "",
        message: message || "",
      });
    } else {
      return NextResponse.json(
        { error: "Missing offerId or packId" },
        { status: 400 },
      );
    }

    let sent = 0;
    let failed = 0;

    for (const contact of contacts) {
      try {
        // Create offer send record first
        const offerSend = await prisma.offerSend.create({
          data: {
            offerId: offerId || undefined,
            packId: packId || undefined,
            contactId: contact.id,
            userId: session.user.id,
            sentAt: new Date(),
            status: "sent",
          },
        });

        // Create tracking record
        const tracking = await prisma.offerEmailTracking.create({
          data: {
            offerSendId: offerSend.id,
            trackingToken: randomUUID(),
          },
        });

        // Add tracking pixel
        const trackingPixel = `<img src="${process.env.NEXTAUTH_URL}/api/email/track?id=${tracking.id}" width="1" height="1" style="display:none" />`;
        const htmlWithTracking = emailHtml + trackingPixel;

        // Personalize
        const firstName =
          contact.fullName?.split(" ")[0] || contact.fullName || "";
        const personalizedHtml = htmlWithTracking
          .replace(/\{\{prenom\}\}/g, firstName)
          .replace(/\{\{nom_complet\}\}/g, contact.fullName || "");

        const result = await sendEmail({
          to: contact.email!,
          subject: emailSubject,
          html: personalizedHtml,
          userId: session.user.id,
        });

        if (result.success) {
          // Link email log to tracking
          if (result.emailLogId) {
            await prisma.offerEmailTracking.update({
              where: { id: tracking.id },
              data: { emailLogId: result.emailLogId },
            });
          }

          sent++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    // Log
    await prisma.emailLog.create({
      data: {
        userId: session.user.id,
        toEmail: contacts
          .map((c: { email: string | null }) => c.email)
          .join(", "),
        subject: emailSubject,
        status: failed === 0 ? "sent" : "failed",
        sentAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: contacts.length,
    });
  } catch (error) {
    console.error("Error sending offer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
