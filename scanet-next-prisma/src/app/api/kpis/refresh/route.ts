import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { refreshAllObjectives } from "@/lib/objectiveCalculator";

// POST /api/kpis/refresh - Refresh all KPIs for current user
export async function POST() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Refresh objectives
    const objectives = await refreshAllObjectives(session.user.id);

    // Get key stats
    const [contactCount, eventCount, opportunityCount, wonOpportunities] =
      await Promise.all([
        prisma.contact.count({ where: { userId: session.user.id } }),
        prisma.event.count({ where: { userId: session.user.id } }),
        prisma.contactOpportunity.count({ where: { userId: session.user.id } }),
        prisma.contactOpportunity.findMany({
          where: { userId: session.user.id, status: "won" },
          select: { amount: true },
        }),
      ]);

    const totalRevenue = wonOpportunities.reduce(
      (sum: number, o: { amount: number | null }) => sum + (o.amount || 0),
      0,
    );

    return NextResponse.json({
      success: true,
      stats: {
        contacts: contactCount,
        events: eventCount,
        opportunities: opportunityCount,
        revenue: totalRevenue,
      },
      objectives,
    });
  } catch (error) {
    console.error("Error refreshing KPIs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
