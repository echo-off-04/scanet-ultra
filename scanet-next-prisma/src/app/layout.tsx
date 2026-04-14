import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Toaster } from 'sonner';
import { SessionProvider } from './providers';
import './globals.css';

const inter = localFont({
    src: [
        {
            path: '../fonts/inter-var.woff2',
            style: 'normal',
        },
    ],
    variable: '--font-inter',
    display: 'swap',
    fallback: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
});

export const metadata: Metadata = {
    title: 'ScaNetwork - Plateforme de Networking Professionnel',
    description: 'Gérez vos contacts, événements et opportunités professionnelles avec ScaNetwork.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="fr">
            <body className={inter.className}>
                <SessionProvider>
                    {children}
                </SessionProvider>
                <Toaster
                    position="top-right"
                    richColors
                    closeButton
                    expand={true}
                    duration={4000}
                    toastOptions={{
                        style: { zIndex: 999999 },
                    }}
                />
            </body>
        </html>
    );
}
