import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/rbac';
import { db } from '@/lib/db';

const MENTOR_ROLES = ['MENTOR', 'SENIOR_MENTOR', 'ADMIN', 'SUPERADMIN'];

// GET /api/sessions/[id] - Get specific session details
export async function GET(
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

        const session = await db.mentoringSession.findUnique({
            where: { id: sessionId },
            include: {
                group: true,
                mentor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    }
                },
                attendances: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                upi: true,
                            }
                        }
                    }
                },
                _count: {
                    select: { attendances: true }
                }
            }
        });

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // Check if user can view this session
        const userWithGroup = await db.user.findUnique({
            where: { id: user.id },
            include: { menteeOf: true }
        });

        const canView = session.isPublic ||
            session.mentorId === user.id ||
            (userWithGroup?.menteeOf?.id === session.groupId) ||
            MENTOR_ROLES.includes(user.role);

        if (!canView) {
            return NextResponse.json({ error: 'Not authorized to view this session' }, { status: 403 });
        }

        return NextResponse.json({ session });
    } catch (error) {
        console.error('Error fetching session:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/sessions/[id] - Update session details (mentors only)
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
        const { title, description, date, location, isPublic, maxCapacity } = body;

        // Verify the session belongs to the mentor
        const existingSession = await db.mentoringSession.findUnique({
            where: { id: sessionId },
            include: { mentor: true }
        });

        if (!existingSession || existingSession.mentorId !== user.id) {
            return NextResponse.json({ error: 'Session not found or unauthorized' }, { status: 404 });
        }

        // Update the session
        // Always set category to the group's category
        const group = await db.group.findUnique({ where: { id: existingSession.groupId } });
        const session = await db.mentoringSession.update({
            where: { id: sessionId },
            data: {
                title,
                description,
                date: new Date(date),
                location,
                isPublic: Boolean(isPublic),
                maxCapacity: maxCapacity ? parseInt(maxCapacity) : null,
                category: group?.category || existingSession.category,
            },
            include: {
                group: true,
                mentor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    }
                },
                attendances: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                upi: true,
                            }
                        }
                    }
                }
            }
        });

        return NextResponse.json({ session });
    } catch (error) {
        console.error('Error updating session:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/sessions/[id] - Delete session (mentors only)
export async function DELETE(
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

        // Verify the session belongs to the mentor
        const session = await db.mentoringSession.findUnique({
            where: { id: sessionId },
            include: { mentor: true }
        });

        if (!session || session.mentorId !== user.id) {
            return NextResponse.json({ error: 'Session not found or unauthorized' }, { status: 404 });
        }

        // Delete the session (attendances will be deleted due to CASCADE)
        await db.mentoringSession.delete({
            where: { id: sessionId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting session:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
