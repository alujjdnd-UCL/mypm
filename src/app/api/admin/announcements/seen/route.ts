import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get('session')?.value;
  if (!sessionToken) return NextResponse.json({ error: 'No session' }, { status: 401 });
  const user = await verifySession(sessionToken);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { announcementId } = await request.json();
  if (!announcementId) return NextResponse.json({ error: 'Missing announcementId' }, { status: 400 });
  await db.announcementSeen.upsert({
    where: { userId_announcementId: { userId: user.id, announcementId } },
    update: { seenAt: new Date() },
    create: { userId: user.id, announcementId },
  });
  return NextResponse.json({ success: true });
} 