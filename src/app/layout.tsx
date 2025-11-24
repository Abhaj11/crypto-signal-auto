import type { Metadata } from 'next';
import './globals.css';
import { MainLayout } from '@/components/layout/main-layout';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/hooks/use-auth';
import { FirebaseErrorListener } from '@/components/firebase-error-listener';

export const metadata: Metadata = {
  title: 'GiantOracle',
  description: 'Advanced Cryptocurrency Bubble Detection System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <FirebaseErrorListener />
          <MainLayout>{children}</MainLayout>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
