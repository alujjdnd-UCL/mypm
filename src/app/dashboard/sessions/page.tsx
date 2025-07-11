'use client';

import { useAuth, useRequireAuth } from '@/components/AuthProvider';
import { PERMISSIONS } from '@/lib/rbac';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SidebarLayout from '@/components/SidebarLayout';
import { PageHeader } from '@/components/PageHeader';
import { Calendar, Clock, MapPin, Users, UserCheck, UserPlus, ChevronLeft, ChevronRight, Copy, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay, isToday, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface MentoringSession {
    id: string;
    title: string;
    description: string;
    date: string;
    startTime?: string | null;
    endTime?: string | null;
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

// Helper to format session time range
function formatSessionTime(session: MentoringSession) {
    if (session.startTime && session.endTime) {
        const start = new Date(session.startTime);
        const end = new Date(session.endTime);
        // If same day, show as 'HH:mm - HH:mm, ddd, MMM d'
        if (start.toDateString() === end.toDateString()) {
            return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}, ${format(start, 'EEE, MMM d')}`;
        } else {
            // If different days, show full range
            return `${format(start, 'PPP p')} - ${format(end, 'PPP p')}`;
        }
    } else if (session.startTime) {
        const start = new Date(session.startTime);
        return `${format(start, 'PPP p')}`;
    } else {
        // Fallback to date
        return format(new Date(session.date), 'PPP p');
    }
}

export default function SessionsPage() {
    const { user, loading: userLoading } = useAuth();
    const [sessions, setSessions] = useState<MentoringSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [joiningSession, setJoiningSession] = useState<string | null>(null);
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'registered'>('calendar');
    const [selectedSession, setSelectedSession] = useState<MentoringSession | null>(null);
    const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
    const [calendarUrl, setCalendarUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const [regenLoading, setRegenLoading] = useState(false);
    const [regenSuccess, setRegenSuccess] = useState(false);

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

    const handleSessionClick = (session: MentoringSession) => {
        setSelectedSession(session);
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
                                                {formatSessionTime(session)}
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

    // Helper to get mentor name
    const getMentorName = (session: MentoringSession) => `${session.mentor.firstName} ${session.mentor.lastName}`;
    // Helper to get group label
    const getGroupLabel = (session: MentoringSession) => session.group ? `Group ${session.group.groupNumber}` : '';

    // Fetch/generate the user's calendar token and build the URL
    const handleOpenCalendarDialog = async () => {
        if (!user) return;
        // Call a backend endpoint to ensure/generate the token and return it
        const res = await fetch(`/api/user/calendar-token`);
        const data = await res.json();
        if (data && data.token) {
            const url = `${window.location.origin}/api/calendar/${user.id}?token=${data.token}`;
            setCalendarUrl(url);
            setCalendarDialogOpen(true);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(calendarUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const handleRegenerateToken = async () => {
        if (!user) return;
        setRegenLoading(true);
        setRegenSuccess(false);
        const res = await fetch(`/api/user/calendar-token`, { method: 'POST' });
        const data = await res.json();
        if (data && data.token) {
            const url = `${window.location.origin}/api/calendar/${user.id}?token=${data.token}`;
            setCalendarUrl(url);
            setRegenSuccess(true);
            setTimeout(() => setRegenSuccess(false), 2000);
        }
        setRegenLoading(false);
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
                        <Button
                            variant={viewMode === 'registered' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('registered')}
                        >
                            My Registered Sessions
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
                                                className="p-2 bg-blue-50 rounded-lg text-xs border-l-4 border-blue-500 hover:bg-blue-100 cursor-pointer transition-colors shadow-sm hover:shadow-md"
                                                onClick={() => handleSessionClick(session)}
                                                tabIndex={0}
                                                role="button"
                                                aria-label={`View details for ${session.title}`}
                                            >
                                                <div className="font-semibold text-gray-900 truncate mb-1">{session.title}</div>
                                                <div className="text-gray-600 truncate">{formatSessionTime(session)}</div>
                                                <div className="text-gray-500 truncate">{session.location}</div>
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
                                    <Card key={session.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleSessionClick(session)}>
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
                                                    <span>{formatSessionTime(session)}</span>
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

                {/* Registered Sessions View */}
                {viewMode === 'registered' && (
                    <div>
                        <div className="flex justify-end mb-4">
                            <Button variant="outline" onClick={handleOpenCalendarDialog} className="flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5" />
                                Subscribe to Personal Caledar
                            </Button>
                        </div>
                        <h2 className="text-2xl font-bold text-[#002248] mb-6" style={{ fontFamily: 'Literata, serif' }}>
                            My Registered Sessions
                        </h2>
                        {sessions.filter(isUserRegistered).length === 0 ? (
                            <Card className="p-8 text-center">
                                <CardContent>
                                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Registered Sessions</h3>
                                    <p className="text-gray-500">You have not registered for any sessions yet.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {sessions.filter(isUserRegistered).map((session) => (
                                    <Card key={session.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleSessionClick(session)}>
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
                                                    <span>{formatSessionTime(session)}</span>
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
                                                <Button variant="outline" size="sm" disabled>
                                                    <UserCheck className="w-4 h-4 mr-1" />
                                                    Registered
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                        {/* Calendar Dialog (only in registered view) */}
                        <Dialog open={calendarDialogOpen} onOpenChange={setCalendarDialogOpen}>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Subscribe to Your Personal Calendar</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-3">
                                    <p className="text-gray-700 text-sm">Copy the link below and add it to your calendar app (Google Calendar, Apple Calendar, Outlook, etc.) as a subscription. Your calendar will stay up to date with your registered sessions.</p>
                                    <div className="flex items-center gap-2 bg-gray-100 rounded px-2 py-1">
                                        <input type="text" value={calendarUrl} readOnly className="flex-1 bg-transparent border-none text-xs font-mono focus:outline-none" />
                                        <Button size="icon" variant="ghost" onClick={handleCopy} title="Copy to clipboard">
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                        {copied && <span className="text-green-600 text-xs ml-2">Copied!</span>}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Button variant="destructive" size="sm" onClick={handleRegenerateToken} disabled={regenLoading}>
                                            {regenLoading ? 'Regenerating...' : 'Regenerate Token'}
                                        </Button>
                                        {regenSuccess && <span className="text-green-600 text-xs ml-2">Token regenerated!</span>}
                                    </div>
                                    <div className="text-xs text-red-500 mt-1">Warning: Regenerating your token will break any existing calendar subscriptions using the old link.</div>
                                    <div className="text-xs text-gray-500 mt-2">This is a private link. Do not share it with others.</div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>
            {/* Session Details Modal */}
            {selectedSession && (
                <Dialog open={!!selectedSession} onOpenChange={(open) => !open && setSelectedSession(null)}>
                    <DialogContent className="max-w-xl p-0 overflow-hidden rounded-2xl shadow-2xl border-0">
                        <DialogTitle className="sr-only">{selectedSession.title}</DialogTitle>
                        {/* Header */}
                        <div className="bg-gradient-to-r from-[#002248] to-[#003366] px-8 py-6">
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-1" style={{ fontFamily: 'Literata, serif' }}>{selectedSession.title}</h2>
                            <div className="flex flex-wrap gap-2 mt-2">
                                <Badge className={`${getCategoryColor(selectedSession.category)} text-xs px-2 py-0.5 font-semibold`}>{getCategoryLabel(selectedSession.category)}</Badge>
                                {selectedSession.isPublic && <Badge variant="outline" className="text-green-100 border-green-200 bg-green-300/10">Public</Badge>}
                                {isUserRegistered(selectedSession) && <Badge variant="outline" className="text-blue-100 border-blue-200 bg-blue-300/10">Registered</Badge>}
                            </div>
                        </div>
                        {/* Main Content */}
                        <div className="px-8 py-6 bg-white">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-gray-700 text-sm">
                                        <Clock className="w-4 h-4 text-[#002248]" />
                                        <span>{formatSessionTime(selectedSession)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700 text-sm">
                                        <MapPin className="w-4 h-4 text-[#002248]" />
                                        <span>{selectedSession.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700 text-sm">
                                        <Users className="w-4 h-4 text-[#002248]" />
                                        <span>{getMentorName(selectedSession)} <span className="text-xs text-gray-500">(Mentor)</span></span>
                                    </div>
                                    {selectedSession.group && (
                                        <div className="flex items-center gap-2 text-gray-700 text-sm">
                                            <Users className="w-4 h-4 text-[#002248]" />
                                            <span>{getGroupLabel(selectedSession)}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-gray-700 text-sm">
                                        <span className="font-semibold">Capacity:</span>
                                        <span>{selectedSession.maxCapacity ? `${selectedSession._count.attendances} / ${selectedSession.maxCapacity}` : `${selectedSession._count.attendances} registered`}</span>
                                    </div>
                                    {selectedSession.description && (
                                        <div className="text-gray-700 text-sm mt-2 whitespace-pre-line border-l-4 border-[#002248]/10 pl-3 py-1 bg-gray-50 rounded">
                                            {selectedSession.description}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <hr className="my-4 border-gray-200" />
                            <div className="flex flex-col md:flex-row gap-3 justify-end">
                                {isUserRegistered(selectedSession) ? (
                                    <Button variant="outline" size="lg" disabled className="w-full md:w-auto">Registered</Button>
                                ) : (
                                    <Button size="lg" className="w-full md:w-auto bg-[#002248] hover:bg-[#003366] text-white font-semibold shadow-md transition" onClick={() => joinSession(selectedSession.id)} disabled={joiningSession === selectedSession.id}>
                                        <UserPlus className="w-5 h-5 mr-2" />
                                        {joiningSession === selectedSession.id ? 'Joining...' : 'Join'}
                                    </Button>
                                )}
                                <Button variant="outline" size="lg" onClick={() => setSelectedSession(null)} className="w-full md:w-auto">Close</Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </SidebarLayout>
    );
}
