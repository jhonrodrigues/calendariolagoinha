import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN_MASTER") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const includeEvents = searchParams.get("events") === "true";
  const includeMinistries = searchParams.get("ministries") === "true";
  const includeUsers = searchParams.get("users") === "true";
  const includeSpaces = searchParams.get("spaces") === "true";
  const includeReservations = searchParams.get("reservations") === "true";

  try {
    const backupData: any = {};

    if (includeEvents) {
      backupData.events = await prisma.event.findMany({
        include: { requirements: true }
      });
    }

    if (includeMinistries) {
      backupData.ministries = await prisma.ministry.findMany();
    }

    if (includeUsers) {
      backupData.users = await prisma.user.findMany({
        where: { email: { not: "admin@lagoinha.com" } } 
      });
    }

    if (includeSpaces) {
      backupData.spaces = await prisma.space.findMany();
    }

    if (includeReservations) {
      backupData.reservations = await prisma.spaceReservation.findMany({
        include: { user: { select: { email: true } } }
      });
    }

    return NextResponse.json(backupData);
  } catch (error) {
    console.error("Selective Export Error:", error);
    return new NextResponse("Erro ao gerar arquivo de configuração.", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN_MASTER") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const importData = await req.json();

    await prisma.$transaction(async (tx) => {
      // 1. Restaurar Ministérios
      if (importData.ministries && Array.isArray(importData.ministries)) {
        for (const m of importData.ministries) {
          await tx.ministry.upsert({
            where: { id: m.id },
            create: { id: m.id, name: m.name },
            update: { name: m.name }
          });
        }
      }

      // 2. Restaurar Eventos
      if (importData.events && Array.isArray(importData.events)) {
        for (const e of importData.events) {
          await tx.event.upsert({
            where: { id: e.id },
            create: {
              id: e.id,
              title: e.title,
              description: e.description,
              date: e.date,
              startTime: e.startTime,
              endTime: e.endTime,
              location: e.location,
              responsible: e.responsible,
              minister: e.minister,
              worship: e.worship,
              groupId: e.groupId,
              isRecurring: e.isRecurring,
              recurrenceRule: e.recurrenceRule,
              requirements: {
                create: (e.requirements || []).map((req: any) => ({
                  ministryId: req.ministryId
                }))
              }
            },
            update: {
              title: e.title,
              description: e.description,
              date: e.date,
              startTime: e.startTime,
              endTime: e.endTime,
              location: e.location,
              responsible: e.responsible,
              minister: e.minister,
              worship: e.worship,
              groupId: e.groupId,
              isRecurring: e.isRecurring,
              recurrenceRule: e.recurrenceRule
            }
          });
        }
      }

      // 3. Restaurar Usuários
      if (importData.users && Array.isArray(importData.users)) {
        for (const u of importData.users) {
          await tx.user.upsert({
            where: { email: u.email },
            create: {
              id: u.id,
              name: u.name,
              email: u.email,
              password: u.password,
              role: u.role
            },
            update: {
              name: u.name,
              password: u.password,
              role: u.role
            }
          });
        }
      }

      // 4. Restaurar Espaços
      if (importData.spaces && Array.isArray(importData.spaces)) {
        for (const s of importData.spaces) {
          await tx.space.upsert({
            where: { id: s.id },
            create: { id: s.id, name: s.name, description: s.description },
            update: { name: s.name, description: s.description }
          });
        }
      }

      // 5. Restaurar Reservas
      if (importData.reservations && Array.isArray(importData.reservations)) {
        // Carregar mapeamento de usuários por email para garantir IDs corretos
        const allUsers = await tx.user.findMany({ select: { id: true, email: true } });
        const userMap = new Map(allUsers.map(u => [u.email, u.id]));
        
        for (const r of importData.reservations) {
          // Tentar encontrar o ID do usuário no sistema atual se tiver o email no backup
          let targetUserId = r.userId;
          if (r.user?.email && userMap.has(r.user.email)) {
            targetUserId = userMap.get(r.user.email);
          }

          // Verificar se o usuário existe
          const userExists = await tx.user.findUnique({ where: { id: targetUserId } });
          const spaceExists = await tx.space.findUnique({ where: { id: r.spaceId } });

          if (!userExists || !spaceExists) {
            console.warn(`Pulando reserva ${r.id} pois o usuário ou espaço não existe.`);
            continue;
          }

          await tx.spaceReservation.upsert({
            where: { id: r.id },
            create: {
              id: r.id,
              spaceId: r.spaceId,
              userId: targetUserId,
              date: r.date,
              startTime: r.startTime,
              endTime: r.endTime,
              title: r.title,
              status: r.status
            },
            update: {
              spaceId: r.spaceId,
              userId: targetUserId,
              date: r.date,
              startTime: r.startTime,
              endTime: r.endTime,
              title: r.title,
              status: r.status
            }
          });
        }
      }

    });

    return new NextResponse("Restauração Concluída", { status: 200 });
  } catch (error) {
    console.error("Selective Import Error:", error);
    return new NextResponse("Falha ao injetar dados no sistema.", { status: 500 });
  }
}
