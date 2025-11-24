import { Suspense } from 'react';
import WalletClientPage from './wallet-client-page';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// A simple loading skeleton for the wallet page
function WalletLoadingSkeleton() {
    return (
        <div className="space-y-6 p-4 md:p-8">
            <div className='space-y-2'>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-72" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-10 w-40" />
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Skeleton className="h-10 w-full" />
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        </div>
    );
}


// This is now a Server Component by default
export default function WalletPage() {
  return (
    // The Suspense boundary is essential for useSearchParams in the client component
    <Suspense fallback={<WalletLoadingSkeleton />}>
      <WalletClientPage />
    </Suspense>
  );
}
