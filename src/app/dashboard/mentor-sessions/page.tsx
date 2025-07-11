'use client';

import { useAuth, useRequireAuth } from '@/components/AuthProvider';
import { PERMISSIONS } from '@/lib/rbac';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import SidebarLayout from '@/components/SidebarLayout';
import { PageHeader } from '@/components/PageHeader';
import { Calendar, Clock, MapPin, Users, Plus, Edit, Trash2, UserCheck, UserX, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

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
    attendances: Array<{
        id: string;
        status: string;
        user: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
            upi: string;
        };
    }>;
    startTime: string;
    endTime: string;
}

const MENTOR_ROLES = ['MENTOR', 'SENIOR_MENTOR', 'ADMIN', 'SUPERADMIN'];

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

const getAttendanceStatusColor = (status: string) => {
    switch (status) {
        case 'ATTENDED':
            return 'bg-green-100 text-green-800';
        case 'ABSENT':
            return 'bg-red-100 text-red-800';
        case 'CANCELLED':
            return 'bg-yellow-100 text-yellow-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

export default function MentorSessionsPage() {
    const { user, loading: userLoading } = useAuth();
    const [sessions, setSessions] = useState<MentoringSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editingSession, setEditingSession] = useState<MentoringSession | null>(null);
    const [attendanceSession, setAttendanceSession] = useState<MentoringSession | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        location: '',
        isPublic: false,
        maxCapacity: ''
    });

    useRequireAuth({ requiredPermission: PERMISSIONS.USER_READ });

    useEffect(() => {
        if (!userLoading && user && MENTOR_ROLES.includes(user.role)) {
            fetchSessions();
        }
    }, [user, userLoading]);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/sessions?view=mentor');
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

    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Combine date and times into ISO strings
            const startTimeISO = formData.date && formData.startTime ? new Date(`${formData.date}T${formData.startTime}`).toISOString() : null;
            const endTimeISO = formData.date && formData.endTime ? new Date(`${formData.date}T${formData.endTime}`).toISOString() : null;
            const response = await fetch('/api/sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...formData, startTime: startTimeISO, endTime: endTimeISO }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create session');
            }

            setCreateDialogOpen(false);
            setFormData({
                title: '',
                description: '',
                date: '',
                startTime: '',
                endTime: '',
                location: '',
                isPublic: false,
                maxCapacity: ''
            });
            await fetchSessions();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to create session');
        }
    };

    const handleUpdateAttendance = async (sessionId: string, attendanceUpdates: { userId: string; status: string }[]) => {
        try {
            const response = await fetch(`/api/sessions/${sessionId}/attendance`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ attendanceUpdates }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update attendance');
            }

            await fetchSessions();
            setAttendanceSession(null);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to update attendance');
        }
    };

    const handleDeleteSession = async (sessionId: string) => {
        if (!confirm('Are you sure you want to delete this session?')) return;

        try {
            const response = await fetch(`/api/sessions/${sessionId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete session');
            }

            await fetchSessions();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete session');
        }
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

    if (!user || !MENTOR_ROLES.includes(user.role)) {
        return (
            <SidebarLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <p className="text-red-600 mb-4">Access denied. Mentor role required.</p>
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

    return (
        <SidebarLayout>
            <PageHeader icon={<Calendar className="w-10 h-10" />} title="Manage Sessions" />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                {/* Create Session Button */}
                <div className="flex justify-end mb-6">
                    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-[#002248] hover:bg-[#003366]">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Session
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Create New Session</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreateSession} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Title</label>
                                    <Input
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g., Python Basics Workshop"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Description</label>
                                    <Textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="What will you cover in this session?"
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Date</label>
                                    <Input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Start Time</label>
                                        <Input
                                            type="time"
                                            value={formData.startTime}
                                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">End Time</label>
                                        <Input
                                            type="time"
                                            value={formData.endTime}
                                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Location</label>
                                    <Input
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        placeholder="e.g., Room 1.01, Zoom link"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Extra Capacity (optional)</label>
                                    <Input
                                        type="number"
                                        value={formData.maxCapacity}
                                        onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                                        placeholder="0"
                                        min="0"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Number of additional students beyond your group members who can join this session.
                                        Your group members are automatically enrolled. Leave empty for unlimited extra capacity.
                                    </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="isPublic"
                                        checked={formData.isPublic}
                                        onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                                    />
                                    <label htmlFor="isPublic" className="text-sm">
                                        Public session (visible to all students)
                                    </label>
                                </div>
                                <div className="flex justify-end space-x-2 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="bg-[#002248] hover:bg-[#003366]">
                                        Create Session
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Sessions List */}
                {sessions.length === 0 ? (
                    <Card className="p-8 text-center">
                        <CardContent>
                            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Sessions Yet</h3>
                            <p className="text-gray-500 mb-4">Create your first programming session to get started.</p>
                            <Button onClick={() => setCreateDialogOpen(true)} className="bg-[#002248] hover:bg-[#003366]">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Session
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {sessions.map((session) => (
                            <Card key={session.id} className="overflow-hidden shadow-lg">
                                <div className="bg-gradient-to-r from-[#002248] to-[#003366] text-white rounded-t-lg">
                                    <div className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-xl mb-2">{session.title}</CardTitle>
                                                <div className="flex items-center gap-4 text-sm text-white/80">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        {format(new Date(session.date), 'PPP p')}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="w-4 h-4" />
                                                        {session.location}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Users className="w-4 h-4" />
                                                        {session.attendances.length} registered
                                                        {session.maxCapacity && ` (+${session.maxCapacity} extra spots)`}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge className={`${getCategoryColor(session.category)} border-white/20`}>
                                                    {getCategoryLabel(session.category)}
                                                </Badge>
                                                {session.isPublic && (
                                                    <Badge variant="outline" className="text-green-300 border-green-300 bg-green-300/10">
                                                        Public
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <CardContent className="p-6">
                                    {session.description && (
                                        <p className="text-gray-600 mb-4">{session.description}</p>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setAttendanceSession(session)}
                                            >
                                                <UserCheck className="w-4 h-4 mr-1" />
                                                Manage Attendance
                                            </Button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setEditingSession(session)}
                                            >
                                                <Edit className="w-4 h-4 mr-1" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDeleteSession(session.id)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="w-4 h-4 mr-1" />
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Edit Session Dialog */}
                {editingSession && (
                    <Dialog open={!!editingSession} onOpenChange={(open) => !open && setEditingSession(null)}>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Edit Session</DialogTitle>
                            </DialogHeader>
                            <EditSessionForm
                                session={editingSession}
                                onClose={() => setEditingSession(null)}
                                onUpdate={fetchSessions}
                            />
                        </DialogContent>
                    </Dialog>
                )}

                {/* Attendance Dialog */}
                {attendanceSession && (
                    <AttendanceDialog
                        session={attendanceSession}
                        onClose={() => setAttendanceSession(null)}
                        onUpdateAttendance={handleUpdateAttendance}
                    />
                )}
            </div>
        </SidebarLayout>
    );
}

function EditSessionForm({
    session,
    onClose,
    onUpdate
}: {
    session: MentoringSession;
    onClose: () => void;
    onUpdate: () => void;
}) {
    const [formData, setFormData] = useState({
        title: session.title,
        description: session.description || '',
        date: new Date(session.date).toISOString().slice(0, 10),
        startTime: session.startTime ? new Date(session.startTime).toISOString().slice(11, 16) : '',
        endTime: session.endTime ? new Date(session.endTime).toISOString().slice(11, 16) : '',
        location: session.location,
        isPublic: session.isPublic,
        maxCapacity: session.maxCapacity?.toString() || ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Combine date and times into ISO strings
            const startTimeISO = formData.date && formData.startTime ? new Date(`${formData.date}T${formData.startTime}`).toISOString() : null;
            const endTimeISO = formData.date && formData.endTime ? new Date(`${formData.date}T${formData.endTime}`).toISOString() : null;
            const response = await fetch(`/api/sessions/${session.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...formData, startTime: startTimeISO, endTime: endTimeISO }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update session');
            }

            onUpdate();
            onClose();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to update session');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Python Basics Workshop"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What will you cover in this session?"
                    rows={3}
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                />
            </div>
            <div className="flex gap-4">
                <div>
                    <label className="block text-sm font-medium mb-2">Start Time</label>
                    <Input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">End Time</label>
                    <Input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        required
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Room 1.01, Zoom link"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-2">Extra Capacity (optional)</label>
                <Input
                    type="number"
                    value={formData.maxCapacity}
                    onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                    placeholder="0"
                    min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Number of additional students beyond your group members who can join this session.
                    Your group members are automatically enrolled. Leave empty for unlimited extra capacity.
                </p>
            </div>
            <div className="flex items-center space-x-2">
                <input
                    type="checkbox"
                    id="editIsPublic"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                />
                <label htmlFor="editIsPublic" className="text-sm">
                    Public session (visible to all students)
                </label>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="submit" className="bg-[#002248] hover:bg-[#003366]">
                    Update Session
                </Button>
            </div>
        </form>
    );
}

function AttendanceDialog({
    session,
    onClose,
    onUpdateAttendance
}: {
    session: MentoringSession;
    onClose: () => void;
    onUpdateAttendance: (sessionId: string, updates: { userId: string; status: string }[]) => void;
}) {
    const [attendanceData, setAttendanceData] = useState<{ [userId: string]: string }>({});

    useEffect(() => {
        const initialData: { [userId: string]: string } = {};
        session.attendances.forEach(att => {
            initialData[att.user.id] = att.status;
        });
        setAttendanceData(initialData);
    }, [session]);

    const handleSubmit = () => {
        const updates = Object.entries(attendanceData).map(([userId, status]) => ({
            userId,
            status
        }));
        onUpdateAttendance(session.id, updates);
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Manage Attendance - {session.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                    {session.attendances.map((attendance) => (
                        <div key={attendance.user.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                                <p className="font-medium">{attendance.user.firstName} {attendance.user.lastName}</p>
                                <p className="text-sm text-gray-500">{attendance.user.email}</p>
                            </div>
                            <Select
                                value={attendanceData[attendance.user.id] || 'REGISTERED'}
                                onValueChange={(value) => setAttendanceData({
                                    ...attendanceData,
                                    [attendance.user.id]: value
                                })}
                            >
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="REGISTERED">Registered</SelectItem>
                                    <SelectItem value="ATTENDED">Attended</SelectItem>
                                    <SelectItem value="ABSENT">Absent</SelectItem>
                                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} className="bg-[#002248] hover:bg-[#003366]">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Update Attendance
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
