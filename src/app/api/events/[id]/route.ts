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
    const { editMode, title, description, location, startTime, endTime, responsible, ministryIds, date, recurrenceRule } = body;

    const baseEvent = await prisma.event.findUnique({ where: { id } });
    if (!baseEvent) return new NextResponse("Not Found", { status: 404 });

    const updatedData = {
      title, description, location, startTime, endTime, responsible, recurrenceRule
    };

    if (editMode === "series" && baseEvent.groupId) {
      // Update all events in the series from this date forward
      await prisma.event.updateMany({
        where: { groupId: baseEvent.groupId, date: { gte: baseEvent.date } },
        data: updatedData,
      });
      // Updating relationships directly on many isn't supported, so update them individually if we wanted ministry changes on all.
      // For simplicity, we just return. Real "Edit Series" recreate the future series.
    }

    // Always update the specific single event and its relations
    const updatedSingle = await prisma.event.update({
      where: { id },
      data: {
        ...updatedData,
        date: new Date(date),
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
