import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as any).role === "LEADER") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { editMode, title, description, location, startTime, endTime, responsible, minister, worship, ministryIds, date, recurrenceRule } = body;

    const baseEvent = await prisma.event.findUnique({ where: { id } });
    if (!baseEvent) return new NextResponse("Not Found", { status: 404 });

    // Anchor the date to Noon UTC to prevent timezone offsets from shifting the day backwards
    const baseDateString = date.includes("T") ? date.split("T")[0] : date;
    const safeDate = new Date(`${baseDateString}T12:00:00Z`);

    const updatedData = {
      title, description, location, startTime, endTime, responsible, minister, worship, recurrenceRule
    };

    if (editMode === "series" && baseEvent.groupId) {
      // Find all future events in the series EXCEPT this current base one
      const futureEvents = await prisma.event.findMany({
        where: { groupId: baseEvent.groupId, date: { gt: baseEvent.date } }
      });

      // Update them one by one to ensure Ministry Relationships are synchronized
      await prisma.$transaction(
        futureEvents.map((fe: any) => prisma.event.update({
          where: { id: fe.id },
          data: {
            ...updatedData,
            requirements: {
              deleteMany: {},
              create: ministryIds.map((mId: string) => ({ ministryId: mId }))
            }
          }
        }))
      );
    } // Removed early exit to ensure the target event's date is still modified below!

    // Always update the specific single event and its relations
    const updatedSingle = await prisma.event.update({
      where: { id },
      data: {
        ...updatedData,
        date: safeDate,
        requirements: {
          deleteMany: {},
          create: ministryIds.map((mId: string) => ({ ministryId: mId }))
        }
      }
    });

    return NextResponse.json(updatedSingle);
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as any).role === "LEADER") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  
  // To get the deleteMode from query string
  const url = new URL(req.url);
  const deleteMode = url.searchParams.get("mode") || "single"; // "single" or "series"

  try {
    if (deleteMode === "series") {
      const baseEvent = await prisma.event.findUnique({ where: { id } });
      if (baseEvent && baseEvent.groupId) {
        // Delete all future events in the series including this one
        await prisma.event.deleteMany({
          where: { groupId: baseEvent.groupId, date: { gte: baseEvent.date } }
        });
        return new NextResponse(null, { status: 204 });
      }
    }

    // Single delete or fallback
    await prisma.event.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
