import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { normalizeEnrollment } from "@/lib/emailSequences";

// GET /api/email/sequences/[id]/enrollments
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const sequence = await prisma.emailSequence.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!sequence)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const enrollments = await prisma.emailSequenceEnrollment.findMany({
      where: { sequenceId: id },
      include: {
        contact: {
          select: { fullName: true, email: true, phone: true, company: true },
        },
        sends: {
          select: {
            id: true,
            stepId: true,
            status: true,
            scheduledFor: true,
            sentAt: true,
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
      take: 20,
    });

    return NextResponse.json(enrollments.map(normalizeEnrollment));
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH /api/email/sequences/[id]/enrollments
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const sequence = await prisma.emailSequence.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    });
    if (!sequence)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await request.json();
    const enrollmentId = body.enrollmentId ?? body.enrollment_id;
    const status = body.status;
    const allowedStatuses = ["active", "paused", "completed", "cancelled"] as const;

    if (
      typeof enrollmentId !== "string" ||
      typeof status !== "string" ||
      !allowedStatuses.includes(status as (typeof allowedStatuses)[number])
    ) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const normalizedStatus = status as (typeof allowedStatuses)[number];

    await prisma.emailSequenceEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: normalizedStatus,
        completedAt:
          normalizedStatus === "completed" || normalizedStatus === "cancelled"
            ? new Date()
            : null,
      },
    });

    if (normalizedStatus === "cancelled") {
      await prisma.emailSequenceSend.updateMany({
        where: { enrollmentId, status: "pending" },
        data: { status: "cancelled" },
      });
    }

    const updated = await prisma.emailSequenceEnrollment.findUniqueOrThrow({
      where: { id: enrollmentId },
      include: {
        contact: {
          select: {
            fullName: true,
            email: true,
            phone: true,
            company: true,
          },
        },
        sends: {
          select: {
            id: true,
            stepId: true,
            status: true,
            scheduledFor: true,
            sentAt: true,
          },
        },
      },
    });

    return NextResponse.json(normalizeEnrollment(updated));
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
