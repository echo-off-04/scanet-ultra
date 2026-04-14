import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/dashboard/stats - Dashboard statistics
export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const userId = session.user.id;

    const [
      contactCount,
      eventCount,
      opportunityCount,
      wonOpportunities,
      recentContacts,
      upcomingEvents,
      pendingFollowUps,
      unreadNotifications,
    ] = await Promise.all([
      prisma.contact.count({ where: { userId } }),
      prisma.event.count({ where: { userId } }),
      prisma.contactOpportunity.count({ where: { userId } }),
      prisma.contactOpportunity.findMany({
        where: { userId, status: "won" },
        select: { amount: true, currency: true },
      }),
      prisma.contact.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          fullName: true,
          email: true,
          company: true,
          status: true,
          avatarUrl: true,
          createdAt: true,
        },
      }),
      prisma.event.findMany({
        where: { userId, startDate: { gte: new Date() } },
        orderBy: { startDate: "asc" },
        take: 5,
        select: {
          id: true,
          name: true,
          location: true,
          startDate: true,
          endDate: true,
        },
      }),
      prisma.followUp.count({
        where: { userId, completed: false, dueDate: { lte: new Date() } },
      }),
      prisma.notification.count({
        where: { userId, read: false },
      }),
    ]);

    const totalRevenue = wonOpportunities.reduce(
      (sum: number, o: { amount: number | null }) => sum + (o.amount || 0),
      0,
    );

    // Contact status distribution
    const statusDistribution = await prisma.contact.groupBy({
      by: ["status"],
      where: { userId },
      _count: true,
    });

    // Monthly contacts (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyContacts = await prisma.contact.findMany({
      where: { userId, createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    });

    return NextResponse.json({
      stats: {
        contacts: contactCount,
        events: eventCount,
        opportunities: opportunityCount,
        revenue: totalRevenue,
        pendingFollowUps,
        unreadNotifications,
      },
      recentContacts,
      upcomingEvents,
      statusDistribution: statusDistribution.map(
        (s: { status: string | null; _count: number }) => ({
          status: s.status,
          count: s._count,
        }),
      ),
      monthlyContacts: monthlyContacts.map(
        (c: { createdAt: Date }) => c.createdAt,
      ),
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
