import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/rbac';
import { db } from '@/lib/db';

const MENTOR_ROLES = ['MENTOR', 'SENIOR_MENTOR', 'ADMIN', 'SUPERADMIN'];

// GET /api/sessions - Get sessions for current user
export async function GET(request: NextRequest) {
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
        const { searchParams } = new URL(request.url);
        const view = searchParams.get('view') || 'student'; // 'student' or 'mentor'

        if (view === 'mentor' && MENTOR_ROLES.includes(user.role)) {
            // Mentor view - get sessions they host
            const sessions = await db.mentoringSession.findMany({
                where: {
                    mentorId: user.id,
                },
                include: {
                    group: true,
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
                },
                orderBy: {
                    date: 'asc'
                }
            });

            return NextResponse.json({ sessions });
        } else {
            // Student view - get sessions they can attend
            const userWithGroup = await db.user.findUnique({
                where: { id: user.id },
                include: {
                    menteeOf: true,
                    sessionAttendances: {
                        include: {
                            session: {
                                include: {
                                    group: true,
                                    mentor: {
                                        select: {
                                            id: true,
                                            firstName: true,
                                            lastName: true,
                                            email: true,
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            // Get all sessions the user can attend
            const availableSessions = await db.mentoringSession.findMany({
                where: {
                    OR: [
                        // Public sessions
                        { isPublic: true },
                        // Sessions from their group (if they have one)
                        ...(userWithGroup?.menteeOf ? [{ groupId: userWithGroup.menteeOf.id }] : []),
                        // Sessions they're hosting (if they're a mentor)
                        ...(MENTOR_ROLES.includes(user.role) ? [{ mentorId: user.id }] : [])
                    ]
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
                        where: {
                            userId: user.id
                        },
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                }
                            }
                        }
                    },
                    _count: {
                        select: {
                            attendances: true
                        }
                    }
                },
                orderBy: {
                    date: 'asc'
                }
            });

            return NextResponse.json({ sessions: availableSessions });
        }
    } catch (error) {
        console.error('Error fetching sessions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/sessions - Create a new session (mentors only)
export async function POST(request: NextRequest) {
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
        const body = await request.json();
        const { title, description, date, startTime, endTime, location, isPublic, maxCapacity } = body;

        // Find the mentor's group
        const mentorGroup = await db.group.findUnique({
            where: { mentorId: user.id },
            include: { mentees: true }
        });

        if (!mentorGroup) {
            return NextResponse.json({ error: 'Mentor not assigned to a group' }, { status: 400 });
        }

        // Create the session
        const session = await db.mentoringSession.create({
            data: {
                title,
                description,
                date: new Date(date),
                startTime: startTime ? new Date(startTime) : null,
                endTime: endTime ? new Date(endTime) : null,
                location,
                isPublic: Boolean(isPublic),
                category: mentorGroup.category, // Always inherit from group
                maxCapacity: maxCapacity ? parseInt(maxCapacity) : null,
                mentorId: user.id,
                groupId: mentorGroup.id,
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
                }
            }
        });

        // Auto-enroll group members
        if (mentorGroup.mentees.length > 0) {
            await db.sessionAttendance.createMany({
                data: mentorGroup.mentees.map(mentee => ({
                    sessionId: session.id,
                    userId: mentee.id,
                    status: 'REGISTERED'
                }))
            });
        }

        return NextResponse.json({ session });
    } catch (error) {
        console.error('Error creating session:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
