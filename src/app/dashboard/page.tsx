'use client';

import { useAuth, useRequireAuth } from '@/components/AuthProvider';
import { UserProfile } from '@/components/UserProfile';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PERMISSIONS } from '@/lib/rbac';
import { Users, BookOpen, Code, Sparkles } from 'lucide-react';
import SidebarLayout from '@/components/SidebarLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [showPopup, setShowPopup] = useState(false);
    const [popupAnnouncement, setPopupAnnouncement] = useState<any | null>(null);
    const [pimentoPrompt, setPimentoPrompt] = useState('');

    // Require authentication and user:read permission
    useRequireAuth({ requiredPermission: PERMISSIONS.USER_READ });

    const handleAskPimento = (e: React.FormEvent) => {
        e.preventDefault();
        if (pimentoPrompt.trim()) {
            router.push(`/dashboard/pimento?prompt=${encodeURIComponent(pimentoPrompt)}`);
        }
    };

    useEffect(() => {
        if (!loading && user) {
            fetch('/api/admin/announcements')
                .then(res => res.json())
                .then(data => {
                    setAnnouncements(data.announcements || []);
                    // Find the latest unseen announcement
                    const unseen = (data.announcements || []).find((a: any) => !a.seenBy || a.seenBy.length === 0);
                    if (unseen) {
                        setPopupAnnouncement(unseen);
                        setShowPopup(true);
                    }
                });
        }
    }, [user, loading]);

    const handleClosePopup = async () => {
        setShowPopup(false);
        if (popupAnnouncement) {
            await fetch('/api/admin/announcements/seen', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ announcementId: popupAnnouncement.id }),
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f7f8fa]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    // Font classes
    const literata = 'font-literata';

    return (
        <SidebarLayout>
            <main className="flex-1 w-full">
                {/* Welcome Section */}
                <section className="w-full bg-gradient-to-b from-[#e3eafc] to-[#f7f8fa] border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 flex flex-col md:flex-row items-center gap-8 md:gap-16">
                        <div className="flex-1 text-center md:text-left">
                            <h1 className={`text-3xl sm:text-4xl md:text-5xl font-light mb-4 leading-tight ${literata}`}>👋 Welcome, <span className="font-bold">{user.given_name}</span>!</h1>
                            <p className="text-lg text-gray-700 max-w-xl mx-auto md:mx-0 mb-4 font-inter">This is your personalised Programming Mentorship dashboard.</p>
                        </div>
                        <div className="flex-1 flex justify-center md:justify-end">
                            <img src="/myPM-logo.png" alt="myPM Logo" className="w-32 h-32 md:w-40 md:h-40 bg-white p-2 rounded-lg shadow" />
                        </div>
                    </div>
                </section>

                {/* Announcements */}
                <section className="w-full bg-[#f7f8fa] py-10">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-2xl shadow p-8 border border-[#e3eafc]">
                            <h2 className="text-2xl md:text-3xl font-bold text-[#002248] mb-6 flex items-center gap-2" style={{ fontFamily: 'Literata, serif' }}>
                                <span role="img" aria-label="announcements">📢</span> Announcements
                            </h2>
                            <div className="space-y-4">
                                {announcements.length === 0 && <div className="text-gray-400 text-center">No announcements yet.</div>}
                                {announcements.map(a => (
                                    <div key={a.id} className="rounded-lg bg-[#f7f8fa] p-4 border border-[#e3eafc] flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                        <div>
                                            <div className="font-bold text-[#002248] text-lg mb-1">{a.title}</div>
                                            <div className="text-[#002248] text-sm mb-1 whitespace-pre-line">{a.content}</div>
                                            <div className="text-xs text-gray-500">By {a.createdBy?.firstName} {a.createdBy?.lastName} ({a.createdBy?.role}) • {new Date(a.createdAt).toLocaleString()}</div>
                                        </div>
                                        {(!a.seenBy || a.seenBy.length === 0) && (
                                            <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full font-semibold mt-2 md:mt-0">New</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Ask Pimento */}
                <section className="w-full bg-[#f7f8fa] pb-12">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-2xl shadow p-8 border border-[#e3eafc] flex flex-col md:flex-row md:items-center md:gap-8">
                            <div className="flex items-center gap-4 mb-6 md:mb-0 md:w-1/3">
                                <div className="bg-gradient-to-br from-[#ffb347] to-[#ffcc80] rounded-full p-3 shadow">
                                    <Sparkles className="w-10 h-10 text-[#ff6f1b]" />
                                </div>
                                <div>
                                    <h3 className="text-2xl md:text-2xl font-bold text-[#002248] mb-1" style={{ fontFamily: 'Literata, serif' }}>Ask Pimento</h3>
                                    <p className="text-gray-600 text-base">Need help or have a question? Ask Pimento, your smart session assistant!</p>
                                </div>
                            </div>
                            <form onSubmit={handleAskPimento} className="flex-1 flex gap-4 items-center">
                                <input
                                    type="text"
                                    className="flex-1 border border-[#e3eafc] rounded-lg px-6 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-[#ffb347] bg-[#f7f8fa] shadow-sm"
                                    placeholder="Ask Pimento a question..."
                                    value={pimentoPrompt}
                                    onChange={e => setPimentoPrompt(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    className="bg-[#ff6f1b] hover:bg-[#e65100] text-white font-semibold px-8 py-4 rounded-lg shadow transition text-lg"
                                >
                                    Ask
                                </button>
                            </form>
                        </div>
                    </div>
                </section>

                {/* Announcement Popup */}
                <Dialog open={showPopup} onOpenChange={setShowPopup}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>{popupAnnouncement?.title}</DialogTitle>
                        </DialogHeader>
                        <div className="text-[#002248] whitespace-pre-line mb-2">{popupAnnouncement?.content}</div>
                        <div className="text-xs text-gray-500 mb-2">By {popupAnnouncement?.createdBy?.firstName} {popupAnnouncement?.createdBy?.lastName} ({popupAnnouncement?.createdBy?.role}) • {popupAnnouncement && new Date(popupAnnouncement.createdAt).toLocaleString()}</div>
                        <Button className="w-full bg-[#002248] hover:bg-[#003366] mt-2" onClick={handleClosePopup}>Dismiss</Button>
                    </DialogContent>
                </Dialog>
            </main>
        </SidebarLayout>
    );
}
