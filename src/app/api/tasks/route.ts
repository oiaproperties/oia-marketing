import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getRole(session: any): string {
  return session?.user?.role || "CONTENT_CREATOR";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = getRole(session);
  const where = role === "ADMIN" ? {} : { assignedTo: role };
  const tasks = await prisma.task.findMany({ where, orderBy: { createdAt: "desc" } });
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const task = await prisma.task.create({
    data: {
      title: body.title,
      description: body.description || null,
      assignedTo: body.assignedTo || "CONTENT_CREATOR",
      status: body.status || "NEW",
      priority: body.priority || "MEDIUM",
      dueDate: body.dueDate || null,
      documentLink: body.documentLink || null,
      contentLink: body.contentLink || null,
      creativeLink: body.creativeLink || null,
      createdLink: body.createdLink || null,
      publishedLink: body.publishedLink || null,
      createdBy: session.user?.email || null,
    },
  });
  return NextResponse.json(task);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, ...data } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const task = await prisma.task.update({ where: { id }, data });
  return NextResponse.json(task);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || getRole(session) !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await req.json();
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
