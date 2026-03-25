import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  
  const user = session.user as any;
  const isAdmin = ["ADMIN_MASTER", "ADMIN"].includes(user.role);

  try {
    const defaultQuery = {
      include: {
        space: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: [ { date: 'asc' }, { startTime: 'asc' } ]
    };

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter");

    let whereClause: any = {};
    if (filter === "mine") {
      whereClause.userId = user.id;
    } else if (filter === "approved") {
      whereClause.status = "APPROVED";
    } else if (!isAdmin) {
      // Fallback fallback: Leader tries to fetch all, force them to see only their own + global approved
      whereClause.OR = [ { userId: user.id }, { status: "APPROVED" } ];
    }
    
    const reservations = await prisma.spaceReservation.findMany({
      where: whereClause,
      ...(defaultQuery as any)
    });

    return NextResponse.json(reservations);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  
  const user = session.user as any;

  try {
    const { spaceId, date, startTime, endTime, title } = await req.json();
    
    // Check conflicts (Basic string HH:mm overlap check against approved slots)
    const conflicts = await prisma.spaceReservation.findMany({
      where: {
        spaceId,
        date,
        status: "APPROVED",
      }
    });

    const hasConflict = conflicts.some(r => {
      // Overlap formula: NewStart < OldEnd AND NewEnd > OldStart
      return startTime < r.endTime && endTime > r.startTime;
    });

    if (hasConflict) {
      return NextResponse.json({ error: "Este espaço já possui uma reserva aprovada neste horário." }, { status: 409 });
    }

    const res = await prisma.spaceReservation.create({ 
      data: { spaceId, userId: user.id, date, startTime, endTime, title, status: "PENDING" } 
    });
    return NextResponse.json(res);
  } catch (error: any) {
    console.error("Reservation Error:", error);
    return NextResponse.json({ error: `Erro no Servidor: ${error.message}` }, { status: 500 });
  }
}
