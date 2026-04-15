'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { KpiProvider } from '@/contexts/KpiContext';
import { Dashboard } from '@/components/Dashboard';

function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.replace('/auth');
        }
    }, [status, router]);

    if (status === 'loading') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900"></div>
                    <p className="text-sm font-medium text-slate-600">Chargement...</p>
                </div>
            </div>
        );
    }

    if (!session) return null;

    return (
        <AuthProvider>
            <NotificationProvider>
                <KpiProvider>
                    <Dashboard />
                </KpiProvider>
            </NotificationProvider>
        </AuthProvider>
    );
}

export default DashboardPage;
