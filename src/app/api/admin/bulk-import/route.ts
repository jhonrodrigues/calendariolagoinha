import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN_MASTER") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { type, items } = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Lista de itens vazia ou inválida." }, { status: 400 });
    }

    let createdCount = 0;

    if (type === "ministry") {
      // Bulk create ministries (ignore duplicates if possible, or just skip)
      for (const item of items) {
        if (!item.name) continue;
        await prisma.ministry.upsert({
          where: { name: item.name },
          update: {},
          create: { name: item.name }
        });
        createdCount++;
      }
    } else if (type === "space") {
      for (const item of items) {
        if (!item.name) continue;
        await prisma.space.create({
          data: { name: item.name, description: item.description || "" }
        });
        createdCount++;
      }
    } else if (type === "event") {
      for (const item of items) {
        if (!item.title || !item.date) continue;
        await prisma.event.create({
          data: {
            title: item.title,
            description: item.description || "",
            date: new Date(item.date),
            startTime: item.startTime || null,
            endTime: item.endTime || null,
            location: item.location || item.local || "",
            responsible: item.responsible || "",
            minister: item.minister || "",
            worship: item.worship || "",
            isRecurring: false
          }
        });
        createdCount++;
      }
    } else {
      return NextResponse.json({ error: "Tipo de importação inválido." }, { status: 400 });
    }

    return NextResponse.json({ success: true, count: createdCount });
  } catch (error: any) {
    console.error("Bulk Import Error:", error);
    return NextResponse.json({ error: "Erro interno no servidor: " + error.message }, { status: 500 });
  }
}
