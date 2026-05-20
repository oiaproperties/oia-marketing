import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// GET /api/team — list all users (admin only)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true, emailVerified: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(users);
}

// POST /api/team — invite a new user
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { email, role, name } = await req.json();
  if (!email || !role) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // Create or update user with the assigned role
  const user = await prisma.user.upsert({
    where: { email },
    update: { role, name: name || undefined, invitedBy: session.user?.email },
    create: { email, role, name: name || null, invitedBy: session.user?.email },
  });

  // Send invite email with sign-in link
  const signInUrl = `${process.env.NEXTAUTH_URL}/login`;
  await resend.emails.send({
    from: "OIA — Marketing <noreply@oiadubai.com>",
    to: email,
    subject: "You're invited to OIA — Marketing",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
        <div style="background:#B8860B;color:#fff;padding:12px 20px;border-radius:8px;display:inline-block;font-weight:700;font-size:18px;margin-bottom:24px;">OIA</div>
        <h2 style="margin:0 0 8px;color:#111;">You're invited!</h2>
        <p style="color:#555;margin:0 0 8px;">You've been added to the OIA — Marketing as <strong>${role.replace(/_/g, " ")}</strong>.</p>
        <p style="color:#555;margin:0 0 24px;">Click below to sign in and access your dashboard.</p>
        <a href="${signInUrl}" style="background:#B8860B;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Access Dashboard</a>
      </div>
    `,
  });

  return NextResponse.json(user);
}

// PATCH /api/team — update a user's role
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id, role } = await req.json();
  if (!id || !role) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const user = await prisma.user.update({ where: { id }, data: { role } });
  return NextResponse.json(user);
}

// DELETE /api/team — remove a user
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await req.json();
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
