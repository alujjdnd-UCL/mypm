import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';

const ADMIN_ROLES = ['ADMIN', 'SENIOR_MENTOR', 'SUPERADMIN'];

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get('session')?.value;
  if (!sessionToken) {
    return NextResponse.json({ error: 'No session' }, { status: 401 });
  }
  const user = await verifySession(sessionToken);
  if (!user || !ADMIN_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const groups = await db.group.findMany({
    include: { mentor: true, mentees: true },
    orderBy: { groupNumber: 'asc' },
  });
  return NextResponse.json({ groups });
}

// POST /api/admin/groups - Create a new group
export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get('session')?.value;
  if (!sessionToken) {
    return NextResponse.json({ error: 'No session' }, { status: 401 });
  }
  const user = await verifySession(sessionToken);
  if (!user || !ADMIN_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get the next available group number
  const lastGroup = await db.group.findFirst({
    orderBy: { groupNumber: 'desc' },
  });
  const nextGroupNumber = (lastGroup?.groupNumber || 0) + 1;

  const group = await db.group.create({
    data: {
      groupNumber: nextGroupNumber,
      category: 'CS_BSC_MENG', // Default category
    },
    include: { mentor: true, mentees: true },
  });
  return NextResponse.json({ group });
}

export async function PUT(request: NextRequest) {
  const sessionToken = request.cookies.get('session')?.value;
  if (!sessionToken) {
    return NextResponse.json({ error: 'No session' }, { status: 401 });
  }
  const user = await verifySession(sessionToken);
  if (!user || !ADMIN_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id, mentorId, menteeIds, category, info } = await request.json();
  const group = await db.group.update({
    where: { id },
    data: {
      mentorId,
      category,
      info,
      mentees: {
        set: menteeIds.map((id: string) => ({ id })),
      },
    },
    include: { mentor: true, mentees: true },
  });
  return NextResponse.json({ group });
}

export async function DELETE(request: NextRequest) {
  const sessionToken = request.cookies.get('session')?.value;
  if (!sessionToken) {
    return NextResponse.json({ error: 'No session' }, { status: 401 });
  }
  const user = await verifySession(sessionToken);
  if (!user || !ADMIN_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await request.json();
  await db.group.delete({ where: { id } });
  return NextResponse.json({ success: true });
}