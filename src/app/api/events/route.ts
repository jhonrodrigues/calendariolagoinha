import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const revalidate = 0;
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { addWeeks, addMonths, startOfDay, parseISO } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const ministryId = searchParams.get("ministryId");

  try {
    const events = await prisma.event.findMany({
      where: ministryId ? {
        requirements: {
          some: { ministryId }
        }
      } : {},
      include: {
        requirements: {
          include: { ministry: true }
        }
      },
      orderBy: { date: "asc" },
    });
    return NextResponse.json(events);
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any).role === "LEADER") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { 
      title, description, date, startTime, endTime, 
      location, responsible, ministryIds, recurrence 
    } = body;

    const baseDate = parseISO(date);
    const eventsToCreate = [];

    // Recurrence logic: multiplication of events
    if (recurrence && recurrence.type !== "none") {
      const count = recurrence.count || 10; // Default to 10 instances if not specified
      for (let i = 0; i < count; i++) {
        let eventDate = baseDate;
        if (recurrence.type === "weekly") {
          eventDate = addWeeks(baseDate, i);
        } else if (recurrence.type === "monthly") {
          eventDate = addMonths(baseDate, i);
        }
        
        eventsToCreate.push({
          title,
          description,
          date: eventDate,
          startTime,
          endTime,
          location,
          responsible,
          isRecurring: true,
        });
      }
    } else {
      eventsToCreate.push({
        title,
        description,
        date: baseDate,
        startTime,
        endTime,
        location,
        responsible,
        isRecurring: false,
      });
    }

    // Since we want to associate ministries, we need to do this carefully.
    // Prisma createMany doesn't return created IDs for SQLite, so we'll do them in a loop or transaction.
    const createdEvents = await prisma.$transaction(
      eventsToCreate.map(event => prisma.event.create({
        data: {
          ...event,
          requirements: {
            create: ministryIds.map((mId: string) => ({
              ministryId: mId
            }))
          }
        }
      }))
    );

    return NextResponse.json(createdEvents);
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
