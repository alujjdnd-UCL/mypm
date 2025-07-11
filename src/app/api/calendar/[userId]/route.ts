import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
// @ts-expect-error: ics types are present but not resolved due to package.json exports
import { createEvents } from 'ics';
import { ensureCalendarToken } from '@/lib/auth';

// NOTE: In production, you should secure this endpoint with a token or signed URL.
// Calendar subscriptions do not support OAuth, so use a secure token in the URL for private feeds.

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { userId } = params;
  const searchParams = req.nextUrl.searchParams;
  const token = searchParams.get('token');
  if (!userId) {
    return new NextResponse('Missing userId', { status: 400 });
  }
  if (!token) {
    return new NextResponse('Missing token', { status: 403 });
  }

  // Ensure the user has a calendarToken (generate if missing)
  const validToken = await ensureCalendarToken(userId);
  if (token !== validToken) {
    return new NextResponse('Invalid token', { status: 403 });
  }

  // Fetch all sessions the user is registered for (future sessions only)
  const attendances = await db.sessionAttendance.findMany({
    where: {
      userId,
      session: {
        date: { gte: new Date() },
      },
    },
    include: {
      session: {
        include: {
          group: true,
          mentor: true,
        },
      },
    },
  });

  const events = attendances.map((attendance) => {
    const s = attendance.session;
    const start = s.startTime ? new Date(s.startTime) : new Date(s.date);
    const end = s.endTime ? new Date(s.endTime) : (s.startTime ? new Date(new Date(s.startTime).getTime() + 60 * 60 * 1000) : new Date(new Date(s.date).getTime() + 60 * 60 * 1000));
    return {
      start: [start.getFullYear(), start.getMonth() + 1, start.getDate(), start.getHours(), start.getMinutes()],
      end: [end.getFullYear(), end.getMonth() + 1, end.getDate(), end.getHours(), end.getMinutes()],
      title: s.title,
      description: s.description || '',
      location: s.location,
      url: `https://yourdomain.com/dashboard/sessions`,
      status: 'CONFIRMED',
      organizer: { name: `${s.mentor.firstName} ${s.mentor.lastName}`, email: s.mentor.email },
      categories: [s.category, s.group ? `Group ${s.group.groupNumber}` : ''],
    };
  });

  const { error, value } = createEvents(events);
  if (error) {
    return new NextResponse(`Error generating calendar: ${error}`, { status: 500 });
  }

  return new NextResponse(value, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="calendar.ics"',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
} 