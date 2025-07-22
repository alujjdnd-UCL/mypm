import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/rbac';
import { db } from '@/lib/db';

const MENTOR_ROLES = ['MENTOR', 'SENIOR_MENTOR', 'ADMIN', 'SUPERADMIN'];

// PUT /api/sessions/[id]/attendance - Update attendance for a session
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const sessionToken = request.cookies.get('session')?.value;
    if (!sessionToken) {
        return NextResponse.json({ error: 'No session' }, { status: 401 });
    }

    const user = await verifySession(sessionToken);
    if (!user) {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    if (!MENTOR_ROLES.includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden - Mentors only' }, { status: 403 });
    }

    try {
        const sessionId = params.id;
        const body = await request.json();
        const { attendanceUpdates } = body; // Array of {userId, status}

        // Verify the session belongs to the mentor
        const session = await db.mentoringSession.findUnique({
            where: { id: sessionId },
            include: { mentor: true }
        });

        if (!session || session.mentorId !== user.id) {
            return NextResponse.json({ error: 'Session not found or unauthorized' }, { status: 404 });
        }

        // Update attendance records
        const updates = await Promise.all(
            attendanceUpdates.map(async ({ userId, status }: { userId: string; status: string }) => {
                return db.sessionAttendance.upsert({
                    where: {
                        sessionId_userId: {
                            sessionId,
                            userId
                        }
                    },
                    update: {
                        status: status as unknown as 'REGISTERED' | 'PRESENT' | 'ABSENT'
                    },
                    create: {
                        sessionId,
                        userId,
                        status: status as unknown as 'REGISTERED' | 'PRESENT' | 'ABSENT'
                    }
                });
            })
        );

        return NextResponse.json({ success: true, updates });
    } catch (error) {
        console.error('Error updating attendance:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/sessions/[id]/attendance - Join a session (students)
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const sessionToken = request.cookies.get('session')?.value;
    if (!sessionToken) {
        return NextResponse.json({ error: 'No session' }, { status: 401 });
    }

    const user = await verifySession(sessionToken);
    if (!user) {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    if (!hasPermission(user.role, PERMISSIONS.USER_READ)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const sessionId = params.id;

        // Get the session details
        const session = await db.mentoringSession.findUnique({
            where: { id: sessionId },
            include: {
                group: true,
                _count: {
                    select: { attendances: true }
                }
            }
        });

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // Check if user can join this session
        const userWithGroup = await db.user.findUnique({
            where: { id: user.id },
            include: { menteeOf: true }
        });

        const canJoin = session.isPublic ||
            (userWithGroup?.menteeOf?.id === session.groupId);

        if (!canJoin) {
            return NextResponse.json({ error: 'Not eligible to join this session' }, { status: 403 });
        }

        // Check capacity - maxCapacity now represents extra capacity beyond group members
        if (session.maxCapacity) {
            // Get count of attendances who are NOT part of the session's group
            const nonGroupAttendances = await db.sessionAttendance.count({
                where: {
                    sessionId,
                    user: {
                        NOT: {
                            menteeGroupId: session.groupId
                        }
                    }
                }
            });

            if (nonGroupAttendances >= session.maxCapacity) {
                return NextResponse.json({ error: 'Session is full (extra capacity limit reached)' }, { status: 400 });
            }
        }

        // Create attendance record
        const attendance = await db.sessionAttendance.create({
            data: {
                sessionId,
                userId: user.id,
                status: 'REGISTERED'
            }
        });

        return NextResponse.json({ attendance });
    } catch (error) {
        console.error('Error joining session:', error);
        if (error instanceof Error && error.message.includes('Unique constraint')) {
            return NextResponse.json({ error: 'Already registered for this session' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
