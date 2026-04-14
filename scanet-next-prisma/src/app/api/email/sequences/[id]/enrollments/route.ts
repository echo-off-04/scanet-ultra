import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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

    return NextResponse.json(enrollments);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
