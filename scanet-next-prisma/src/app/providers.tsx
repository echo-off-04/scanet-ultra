'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { MaterialWebProvider } from '@/components/material/MaterialWebProvider';

export function SessionProvider({ children }: { children: React.ReactNode }) {
    return (
        <NextAuthSessionProvider>
            <MaterialWebProvider>{children}</MaterialWebProvider>
        </NextAuthSessionProvider>
    );
}
