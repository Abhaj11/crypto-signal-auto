"use client";

import { AlertList } from "@/components/dashboard/alert-list";
import { BubbleDetector } from "@/components/dashboard/bubble-detector";
import { PortfolioOverview } from "@/components/dashboard/portfolio-overview";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { GiantOracleLogo } from "@/components/icons/giant-oracle-logo";

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth');
        }
    }, [user, authLoading, router]);

    if (authLoading || !user) {
        return (
            <div className="flex h-screen items-center justify-center">
                <GiantOracleLogo className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-12">
            <AlertList />
        </div>
        <div className="lg:col-span-7">
            <BubbleDetector />
        </div>
        <div className="lg:col-span-5">
          <PortfolioOverview />
        </div>
      </div>
    </div>
  );
}
