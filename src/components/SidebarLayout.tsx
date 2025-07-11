'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { Users, BookOpen, Code, User, LayoutDashboard, Menu, X, Shield, Sparkles } from 'lucide-react';

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const inter = 'font-inter';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/assistant', label: 'Assistant', icon: Sparkles },
  { href: '/dashboard/my-group', label: 'My Group', icon: Users },
  { href: '/dashboard/sessions', label: 'Sessions', icon: BookOpen },
  { href: '/profile', label: 'My Profile', icon: User },
];

const mentorLinks = [
  { href: '/dashboard/mentor-sessions', label: 'Manage Sessions', icon: Code },
];

const adminLinks = [
  { href: '/group-admin', label: 'Group Administration', icon: Shield },
];

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = user && ['ADMIN', 'SENIOR_MENTOR', 'SUPERADMIN'].includes(user.role);
  const isMentor = user && ['MENTOR', 'SENIOR_MENTOR', 'ADMIN', 'SUPERADMIN'].includes(user.role);

  return (
    <div className="min-h-screen flex bg-[#f7f8fa]">
      {/* Sidebar (desktop & mobile slide-in) */}
      <aside className={`fixed z-40 inset-y-0 left-0 w-64 bg-[#002248] text-white flex flex-col transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:static md:inset-auto md:translate-x-0`}>
        {/* Logo & App Name */}
        <Link href="/" className="flex items-center gap-3 px-6 py-5 border-b border-white/10 hover:bg-[#003366] transition">
          <img src="/myPM-logo.png" alt="myPM Logo" className="w-10 h-10 bg-white p-1 rounded-md" />
          <span
            className="text-white text-2xl font-bold group-hover:underline"
            style={{ fontFamily: 'Literata, serif' }}
          >
            myPM
          </span>
        </Link>
        {/* Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#003366] transition font-medium">
              <link.icon className="w-5 h-5" />
              <span className={inter + ' flex items-center'}>{link.label}
                {link.label === 'Assistant' && (
                  <Badge
                    className="ml-2 px-1 py-0.5 text-[10px] font-bold bg-yellow-100 text-yellow-700 border border-yellow-200 rounded"
                    style={{ borderRadius: '4px', minWidth: '18px', boxShadow: 'none' }}
                  >
                    New
                  </Badge>
                )}
              </span>
            </Link>
          ))}
          {isMentor && (
            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="text-xs text-white/60 uppercase font-semibold mb-2 px-3">Mentor Tools</div>
              {mentorLinks.map(link => (
                <Link key={link.href} href={link.href} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#003366] transition font-medium">
                  <link.icon className="w-5 h-5" />
                  <span className={inter}>{link.label}</span>
                </Link>
              ))}
            </div>
          )}
          {isAdmin && (
            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="text-xs text-white/60 uppercase font-semibold mb-2 px-3">Admin Tools</div>
              {adminLinks.map(link => (
                <Link key={link.href} href={link.href} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#003366] transition font-medium">
                  <link.icon className="w-5 h-5" />
                  <span className={inter}>{link.label}</span>
                </Link>
              ))}
            </div>
          )}
        </nav>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="w-full bg-white shadow flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16 border-b border-gray-200">
          {/* Hamburger (mobile) */}
          <button className="md:hidden p-2" onClick={() => setSidebarOpen(v => !v)}>
            {sidebarOpen ? <X className="w-6 h-6 text-[#002248]" /> : <Menu className="w-6 h-6 text-[#002248]" />}
          </button>
          {/* Logo & App Name (mobile only) */}
          <div className="flex items-center gap-2 md:hidden">
            <img src="/myPM-logo.png" alt="myPM Logo" className="w-8 h-8 bg-white p-1 rounded-md" />
            <span
              className="text-xl font-bold text-[#002248]"
              style={{ fontFamily: 'Literata, serif' }}
            >
              myPM
            </span>
          </div>
          <div className="flex-1" />
          {/* Profile Picture and Greeting */}
          <div className="flex items-center gap-4">
            {user && (
              <>
                <span
                  className="hidden sm:block text-lg text-[#002248] font-light"
                  style={{ fontFamily: 'Literata, serif' }}
                >
                  Hello, {user.given_name}!
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <img
                      src={`/api/user/profile-pic/${user.upi}`}
                      alt={user.given_name}
                      className="w-10 h-10 rounded-full border-2 border-[#002248] object-cover cursor-pointer"
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 mt-2 bg-white/95 backdrop-blur-sm shadow-xl border border-gray-200 rounded-2xl p-2">
                    <DropdownMenuItem asChild>
                      <Button variant="destructive" className="w-full font-geist-mono" onClick={logout}>Logout</Button>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </header>
        {/* Main Content */}
        <main className="flex-1 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}