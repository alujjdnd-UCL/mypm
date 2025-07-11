import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';

const ADMIN_ROLES = ['SENIOR_MENTOR', 'ADMIN', 'SUPERADMIN'];

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get('session')?.value;
  let userId: string | null = null;
  if (sessionToken) {
    const user = await verifySession(sessionToken);
    if (user) userId = user.id;
  }
  const announcements = await db.announcement.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true, role: true } },
      seenBy: userId ? { where: { userId }, select: { id: true } } : false,
    },
  });
  return NextResponse.json({ announcements });
}

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get('session')?.value;
  if (!sessionToken) return NextResponse.json({ error: 'No session' }, { status: 401 });
  const user = await verifySession(sessionToken);
  if (!user || !ADMIN_ROLES.includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { title, content } = await request.json();
  if (!title || !content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const announcement = await db.announcement.create({
    data: { title, content, createdById: user.id },
  });
  return NextResponse.json({ announcement });
}

export async function PUT(request: NextRequest) {
  const sessionToken = request.cookies.get('session')?.value;
  if (!sessionToken) return NextResponse.json({ error: 'No session' }, { status: 401 });
  const user = await verifySession(sessionToken);
  if (!user || !ADMIN_ROLES.includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id, title, content } = await request.json();
  if (!id || !title || !content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const announcement = await db.announcement.update({
    where: { id },
    data: { title, content },
  });
  return NextResponse.json({ announcement });
}

export async function DELETE(request: NextRequest) {
  const sessionToken = request.cookies.get('session')?.value;
  if (!sessionToken) return NextResponse.json({ error: 'No session' }, { status: 401 });
  const user = await verifySession(sessionToken);
  if (!user || !ADMIN_ROLES.includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await db.announcement.delete({ where: { id } });
  return NextResponse.json({ success: true });
} 