import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { refreshAllObjectives } from "@/lib/objectiveCalculator";
import { createNotification } from "@/lib/notifications";

// POST /api/objectives/refresh - Refresh all objectives for current user
export async function POST() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const updated = await refreshAllObjectives(session.user.id);

    // Check for newly achieved objectives and create notifications
    for (const obj of updated) {
      if (obj.status === "achieved" && !obj.notified) {
        await createNotification({
          userId: session.user.id,
          type: "objective_achieved",
          category: "system",
          title: "Objectif atteint !",
          message: `Félicitations ! Vous avez atteint votre objectif "${obj.title}"`,
          priority: "high",
          metadata: { objective_id: obj.id, objective_title: obj.title },
        });

        await prisma.personalObjective.update({
          where: { id: obj.id },
          data: { notified: true },
        });
      }
    }

    return NextResponse.json({ objectives: updated, refreshed: true });
  } catch (error) {
    console.error("Error refreshing objectives:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
