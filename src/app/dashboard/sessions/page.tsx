'use client';

import { useAuth, useRequireAuth } from '@/components/AuthProvider';
import { PERMISSIONS } from '@/lib/rbac';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SidebarLayout from '@/components/SidebarLayout';
import { PageHeader } from '@/components/PageHeader';
import { Calendar, Clock, MapPin, Users, UserCheck, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay, isToday, parseISO } from 'date-fns';

interface MentoringSession {
    id: string;
    title: string;
    description: string;
    date: string;
    location: string;
    isPublic: boolean;
    category: string;
    maxCapacity: number | null;
    mentor: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    group: {
        id: number;
        groupNumber: number;
        category: string;
    };
    attendances?: Array<{
        status: string;
        user?: {
            id: string;
            firstName: string;
            lastName: string;
        };
    }>;
    _count: {
        attendances: number;
    };
}

const getCategoryLabel = (category: string) => {
    switch (category) {
        case 'CS_BSC_MENG':
            return 'Computer Science BSc/MEng';
        case 'ROBOTICS_AI_MENG':
            return 'Robotics and AI MEng';
        case 'CS_MATHS_MENG':
            return 'CS and Mathematics MEng';
        default:
            return category;
    }
};

const getCategoryColor = (category: string) => {
    switch (category) {
        case 'CS_BSC_MENG':
            return 'bg-blue-100 text-blue-800';
        case 'ROBOTICS_AI_MENG':
            return 'bg-purple-100 text-purple-800';
        case 'CS_MATHS_MENG':
            return 'bg-green-100 text-green-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

export default function SessionsPage() {
    const { user, loading: userLoading } = useAuth();
    const [sessions, setSessions] = useState<MentoringSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [joiningSession, setJoiningSession] = useState<string | null>(null);
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

    useRequireAuth({ requiredPermission: PERMISSIONS.USER_READ });

    useEffect(() => {
        if (!userLoading && user) {
            fetchSessions();
        }
    }, [user, userLoading]);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/sessions?view=student');
            if (!response.ok) {
                throw new Error('Failed to fetch sessions');
            }
            const data = await response.json();
            setSessions(data.sessions || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load sessions');
        } finally {
            setLoading(false);
        }
    };

    const joinSession = async (sessionId: string) => {
        try {
            setJoiningSession(sessionId);
            const response = await fetch(`/api/sessions/${sessionId}/attendance`, {
                method: 'POST',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to join session');
            }

            // Refresh sessions to update UI
            await fetchSessions();
        } catch (err) {
            console.error('Error joining session:', err);
            alert(err instanceof Error ? err.message : 'Failed to join session');
        } finally {
            setJoiningSession(null);
        }
    };

    const isUserRegistered = (session: MentoringSession) => {
        return session.attendances?.some(att => att.user?.id === user?.id) || false;
    };

    const getSessionStatus = (session: MentoringSession) => {
        const now = new Date();
        const sessionDate = new Date(session.date);

        if (sessionDate < now) {
            return 'past';
        } else if (sessionDate.toDateString() === now.toDateString()) {
            return 'today';
        } else {
            return 'upcoming';
        }
    };

    // Calendar navigation functions
    const goToPreviousWeek = () => {
        setCurrentWeek(subWeeks(currentWeek, 1));
    };

    const goToNextWeek = () => {
        setCurrentWeek(addWeeks(currentWeek, 1));
    };

    const goToCurrentWeek = () => {
        setCurrentWeek(new Date());
    };

    // Get week range
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday start
    const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
    const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

    // Filter sessions for current week
    const weekSessions = sessions.filter(session => {
        const sessionDate = parseISO(session.date);
        return sessionDate >= weekStart && sessionDate <= weekEnd;
    });

    // Group sessions by day
    const sessionsByDay = daysInWeek.map(day => ({
        date: day,
        sessions: weekSessions.filter(session =>
            isSameDay(parseISO(session.date), day)
        )
    }));

    // Filter sessions based on user's access
    const getFilteredSessions = (allSessions: MentoringSession[]) => {
        if (!user) return [];

        return allSessions.filter(session => {
            // Show public sessions
            if (session.isPublic) return true;

            // Show user's own group sessions
            if (user.id === session.mentor.id) return true;

            // Show sessions from user's mentor group
            if (session.group && user.role === 'STUDENT') {
                // This would need to be checked against user's group membership
                return true; // For now, let the API handle this filtering
            }

            return false;
        });
    };

    const renderCalendar = () => {
        const start = startOfWeek(currentWeek);
        const end = endOfWeek(currentWeek);
        const days = eachDayOfInterval({ start, end });

        return (
            <div className="grid grid-cols-7 gap-4">
                {days.map(day => (
                    <div key={day.toString()} className="flex flex-col">
                        <div className="text-center text-sm text-gray-500 font-medium mb-2">
                            {format(day, 'EEE')}
                        </div>
                        <div className="flex-1">
                            {sessions
                                .filter(session => isSameDay(parseISO(session.date), day))
                                .map(session => (
                                    <Card key={session.id} className="mb-2">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <Badge className={getCategoryColor(session.category)}>
                                                    {getCategoryLabel(session.category)}
                                                </Badge>
                                                {session.isPublic && (
                                                    <Badge variant="outline" className="text-green-600 border-green-300">
                                                        Public
                                                    </Badge>
                                                )}
                                            </div>

                                            <h3 className="text-md font-bold text-[#002248] mb-1" style={{ fontFamily: 'Literata, serif' }}>
                                                {session.title}
                                            </h3>

                                            <div className="text-sm text-gray-600 mb-2">
                                                {format(new Date(session.date), 'PPP p')}
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-gray-500">
                                                    by {session.mentor.firstName} {session.mentor.lastName}
                                                </div>

                                                {isUserRegistered(session) ? (
                                                    <Button variant="outline" size="sm" disabled>
                                                        <UserCheck className="w-4 h-4 mr-1" />
                                                        Registered
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => joinSession(session.id)}
                                                        disabled={joiningSession === session.id}
                                                        className="bg-[#002248] hover:bg-[#003366]"
                                                    >
                                                        <UserPlus className="w-4 h-4 mr-1" />
                                                        {joiningSession === session.id ? 'Joining...' : 'Join'}
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    if (userLoading || loading) {
        return (
            <SidebarLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002248] mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading sessions...</p>
                    </div>
                </div>
            </SidebarLayout>
        );
    }

    if (error) {
        return (
            <SidebarLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <p className="text-red-600 mb-4">{error}</p>
                        <Button onClick={fetchSessions}>Try Again</Button>
                    </div>
                </div>
            </SidebarLayout>
        );
    }

    const upcomingSessions = sessions.filter(s => getSessionStatus(s) === 'upcoming');
    const pastSessions = sessions.filter(s => getSessionStatus(s) === 'past');

    return (
        <SidebarLayout>
            <PageHeader icon={<Calendar className="w-10 h-10" />} title="Programming Sessions" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                {/* View Mode Toggle and Calendar Navigation */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <div className="flex items-center gap-2">
                        <Button
                            variant={viewMode === 'calendar' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('calendar')}
                        >
                            Calendar View
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('list')}
                        >
                            List View
                        </Button>
                    </div>

                    {viewMode === 'calendar' && (
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
                                Today
                            </Button>
                            <Button variant="outline" size="sm" onClick={goToNextWeek}>
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                            <span className="text-sm font-medium ml-2">
                                {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                            </span>
                        </div>
                    )}
                </div>

                {/* Calendar View */}
                {viewMode === 'calendar' && (
                    <div className="bg-white rounded-lg shadow border overflow-hidden">
                        {/* Calendar Header */}
                        <div className="grid grid-cols-7 gap-0">
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                <div key={day} className="p-3 text-center text-sm font-semibold text-gray-600 bg-gray-50 border-b border-gray-200">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-0">
                            {sessionsByDay.map(({ date, sessions }) => (
                                <div key={date.toISOString()} className="min-h-[200px] p-3 border-r border-b border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                                    <div className={`text-sm font-medium mb-3 ${isToday(date) ? 'text-blue-600 font-bold' : 'text-gray-900'}`}>
                                        {format(date, 'd')}
                                        {isToday(date) && <span className="ml-1 text-xs">(Today)</span>}
                                    </div>
                                    <div className="space-y-2">
                                        {sessions.map(session => (
                                            <div
                                                key={session.id}
                                                className="p-2 bg-blue-50 rounded-lg text-xs border-l-4 border-blue-500 hover:bg-blue-100 cursor-pointer transition-colors"
                                                onClick={() => {
                                                    // Could open session details modal here
                                                }}
                                            >
                                                <div className="font-semibold text-gray-900 truncate mb-1">{session.title}</div>
                                                <div className="text-gray-600 truncate">
                                                    {format(parseISO(session.date), 'HH:mm')}
                                                </div>
                                                <div className="text-gray-500 truncate">
                                                    {session.location}
                                                </div>
                                                <div className="flex items-center gap-1 mt-1 flex-wrap">
                                                    <Badge className={`${getCategoryColor(session.category)} text-xs px-1 py-0`}>
                                                        {session.category === 'CS_BSC_MENG' ? 'CS' :
                                                            session.category === 'ROBOTICS_AI_MENG' ? 'AI' :
                                                                session.category === 'CS_MATHS_MENG' ? 'Math' : 'Other'}
                                                    </Badge>
                                                    {session.isPublic && (
                                                        <Badge variant="outline" className="text-xs px-1 py-0 text-green-600 border-green-300">
                                                            Public
                                                        </Badge>
                                                    )}
                                                    {isUserRegistered(session) && (
                                                        <Badge variant="outline" className="text-xs px-1 py-0 text-blue-600 border-blue-300">
                                                            Registered
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {sessions.length === 0 && (
                                            <div className="text-xs text-gray-400 italic">No sessions</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* List View */}
                {viewMode === 'list' && (
                    <div>
                        <h2 className="text-2xl font-bold text-[#002248] mb-6" style={{ fontFamily: 'Literata, serif' }}>
                            Upcoming Sessions
                        </h2>

                        {sessions.filter(s => getSessionStatus(s) === 'upcoming').length === 0 ? (
                            <Card className="p-8 text-center">
                                <CardContent>
                                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Upcoming Sessions</h3>
                                    <p className="text-gray-500">Check back later for new programming sessions.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {sessions.filter(s => getSessionStatus(s) === 'upcoming').map((session) => (
                                    <Card key={session.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <Badge className={getCategoryColor(session.category)}>
                                                    {getCategoryLabel(session.category)}
                                                </Badge>
                                                {session.isPublic && (
                                                    <Badge variant="outline" className="text-green-600 border-green-300">
                                                        Public
                                                    </Badge>
                                                )}
                                            </div>

                                            <h3 className="text-xl font-bold text-[#002248] mb-2" style={{ fontFamily: 'Literata, serif' }}>
                                                {session.title}
                                            </h3>

                                            {session.description && (
                                                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                                                    {session.description}
                                                </p>
                                            )}

                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Clock className="w-4 h-4" />
                                                    <span>{format(parseISO(session.date), 'PPP p')}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <MapPin className="w-4 h-4" />
                                                    <span>{session.location}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Users className="w-4 h-4" />
                                                    <span>
                                                        {session._count.attendances} registered
                                                        {session.maxCapacity && ` (+${session.maxCapacity} extra capacity)`}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-gray-500">
                                                    by {session.mentor.firstName} {session.mentor.lastName}
                                                </div>

                                                {isUserRegistered(session) ? (
                                                    <Button variant="outline" size="sm" disabled>
                                                        <UserCheck className="w-4 h-4 mr-1" />
                                                        Registered
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => joinSession(session.id)}
                                                        disabled={joiningSession === session.id}
                                                        className="bg-[#002248] hover:bg-[#003366]"
                                                    >
                                                        <UserPlus className="w-4 h-4 mr-1" />
                                                        {joiningSession === session.id ? 'Joining...' : 'Join'}
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </SidebarLayout>
    );
}
