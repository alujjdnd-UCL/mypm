'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser } from '@/types/auth';
import { useRouter } from 'next/navigation';
import { hasPermission } from '@/lib/rbac';

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    login: () => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await fetch('/api/user');
            if (response.ok) {
                const { user } = await response.json();
                setUser(user);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = () => {
        window.location.href = '/api/auth/login';
    };

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            setUser(null);
            window.location.href = '/';
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Custom hook to require authentication and (optionally) permissions/roles
export function useRequireAuth({
    requiredRole,
    requiredPermission,
    redirectTo = '/login',
}: {
    requiredRole?: string;
    requiredPermission?: { resource: string; action: string };
    redirectTo?: string;
} = {}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.replace(redirectTo);
            } else if (requiredRole && user.role !== requiredRole) {
                router.replace(redirectTo);
            } else if (requiredPermission && !hasPermission(user.role, requiredPermission)) {
                router.replace(redirectTo);
            }
        }
    }, [user, loading, requiredRole, requiredPermission, redirectTo, router]);

    return { user, loading };
}