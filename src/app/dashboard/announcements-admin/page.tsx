"use client";

import React, { useEffect, useState } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Trash2, Edit, Plus } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

const ADMIN_ROLES = ["SENIOR_MENTOR", "ADMIN", "SUPERADMIN"];

export default function AnnouncementsAdminPage() {
  const { user, loading: userLoading } = useAuth();
  const [announcements, setAnnouncements] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", content: "", id: null as string | null });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const isAdmin = user && ADMIN_ROLES.includes(user.role);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/announcements");
      const data = await res.json();
      setAnnouncements(data.announcements || []);
      setError(null);
    } catch {
      setError("Failed to load announcements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading && isAdmin) {
      fetchAnnouncements();
    }
  }, [user, userLoading, isAdmin]);

  if (!isAdmin && !userLoading) {
    return (
      <SidebarLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Shield className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600">You do not have permission to view this page.</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  const handleEdit = (a: unknown) => {
    const announcement = a as { title: string; content: string; id: string };
    setForm({ title: announcement.title, content: announcement.content, id: announcement.id });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this announcement?")) return;
    setDeleting(id);
    await fetch("/api/admin/announcements", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDeleting(null);
    fetchAnnouncements();
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (form.id) {
      await fetch("/api/admin/announcements", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: form.id, title: form.title, content: form.content }),
      });
    } else {
      await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, content: form.content }),
      });
    }
    setSaving(false);
    setForm({ title: "", content: "", id: null });
    setShowForm(false);
    fetchAnnouncements();
  };

  return (
    <SidebarLayout>
      <PageHeader icon={<Shield className="w-10 h-10" />} title="Announcements Admin" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="flex justify-end mb-6">
          <Button onClick={() => { setForm({ title: "", content: "", id: null }); setShowForm(true); }} className="bg-[#002248] hover:bg-[#003366] flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Announcement
          </Button>
        </div>
        {showForm && (
          <form onSubmit={handleFormSubmit} className="bg-white rounded-xl shadow p-6 mb-8">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required maxLength={100} />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Content</label>
              <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} required rows={4} maxLength={1000} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving} className="bg-[#002248] hover:bg-[#003366]">{form.id ? "Update" : "Create"}</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        )}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : (
          <div className="space-y-4">
            {announcements.length === 0 && <div className="text-center text-gray-400">No announcements yet.</div>}
            {announcements.map(a => (
              <Card key={a.id} className="shadow-sm border-0 bg-[#e3eafc]">
                <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between px-4 py-3 gap-2">
                  <div>
                    <div className="font-semibold text-[#002248]">{a.title}</div>
                    <div className="text-[#002248] text-sm mb-1 whitespace-pre-line">{a.content}</div>
                    <div className="text-xs text-gray-500">By {a.createdBy?.firstName} {a.createdBy?.lastName} ({a.createdBy?.role}) • {new Date(a.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2 mt-2 md:mt-0">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(a)}><Edit className="w-4 h-4 mr-1" />Edit</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(a.id)} disabled={deleting === a.id}><Trash2 className="w-4 h-4 mr-1" />{deleting === a.id ? "Deleting..." : "Delete"}</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
} 