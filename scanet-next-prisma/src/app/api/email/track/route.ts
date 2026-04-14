import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/email/track - Email open tracking pixel
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sendId = searchParams.get("id");

  if (sendId) {
    try {
      await prisma.offerEmailTracking.updateMany({
        where: { id: sendId },
        data: {
          opened: true,
        },
      });
    } catch (error) {
      console.error("Tracking error:", error);
    }
  }

  // Return 1x1 transparent pixel
  const pixel = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64",
  );

  return new NextResponse(pixel, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
