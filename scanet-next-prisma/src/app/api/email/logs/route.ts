import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { toSnakeCase } from "@/lib/apiMappers";

// GET /api/email/logs
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50");
  const status = searchParams.get("status");

  try {
    const where: Record<string, unknown> = { userId: session.user.id };
    if (status) where.status = status;

    const logs = await prisma.emailLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(
      logs.map((log) => {
        const metadata =
          log.metadata && typeof log.metadata === "object" && !Array.isArray(log.metadata)
            ? (log.metadata as Record<string, unknown>)
            : {};

        return {
          ...toSnakeCase(log),
          body_html:
            typeof metadata.body_html === "string" ? metadata.body_html : null,
          body_text:
            typeof metadata.body_text === "string" ? metadata.body_text : null,
          email_type:
            typeof metadata.email_type === "string"
              ? metadata.email_type
              : log.templateType ?? "direct",
          error_message:
            typeof metadata.error_message === "string"
              ? metadata.error_message
              : null,
        };
      }),
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
