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
        where: { email: { not: "admin@lagoinha.com" } } // Preserva admin supremo
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
            create: { id: m.id, name: m.name, description: m.description },
            update: { name: m.name, description: m.description }
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
                create: e.requirements.map((req: any) => ({
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
    });

    return new NextResponse("Restauração Concluída", { status: 200 });
  } catch (error) {
    console.error("Selective Import Error:", error);
    return new NextResponse("Falha ao injetar dados no sistema.", { status: 500 });
  }
}
