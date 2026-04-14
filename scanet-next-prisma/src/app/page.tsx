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
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-teal-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Chargement...</p>
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
