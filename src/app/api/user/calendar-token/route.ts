import { NextRequest, NextResponse } from 'next/server';
import { verifySession, ensureCalendarToken, generateCalendarToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const sessionToken = req.cookies.get('session')?.value;
  if (!sessionToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const user = await verifySession(sessionToken);
  if (!user) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
  const token = await ensureCalendarToken(user.id);
  return NextResponse.json({ token });
}

export async function POST(req: NextRequest) {
  const sessionToken = req.cookies.get('session')?.value;
  if (!sessionToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const user = await verifySession(sessionToken);
  if (!user) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
  const newToken = generateCalendarToken();
  await db.user.update({ where: { id: user.id }, data: { calendarToken: newToken } });
  return NextResponse.json({ token: newToken });
}