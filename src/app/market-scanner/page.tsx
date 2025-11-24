

"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ServerCrash, Search, Gauge, Gem, Star, Medal, Lock, Award, Zap, Info, Clock, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { SignalChart } from '@/components/market-scanner/signal-chart';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"


interface PriceHistoryPoint {
  time: number | string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  value?: number;
}
interface Opportunity {
  rank: 'PLATINUM' | 'GOLD' | 'SILVER';
  symbol: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  tradingSignal: string;
  tradingAction: string;
  takeProfit: number;
  stopLoss: number;
  priority: number;
  strengthScore: number;
  priceHistory: PriceHistoryPoint[];
  timeframe: string;
}

interface ScanStats {
    totalProcessed: number;
    totalOpportunities: number;
    platinum: number;
    gold: number;
    silver: number;
    scanTimeMs: number;
    fearGreedIndex?: number;
}


const tierPermissions: Record<string, string[]> = {
    FREE: [], // Free tier sees nothing directly, but we show locked cards
    TRADER: ['SILVER'],
    PRO: ['SILVER', 'GOLD'],
    VIP: ['SILVER', 'GOLD', 'PLATINUM'],
};

// Developer/Admin bypass email
const ADMIN_EMAIL = 'pro@giantoracle.com';


export default function SignalScreenerPage() {
  const [allOpportunities, setAllOpportunities] = useState<Opportunity[]>([]);
  const [stats, setStats] = useState<ScanStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, userProfile } = useAuth();
  
  const fetchOpportunities = useCallback(async () => {
    if(!loading) setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/scan`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      const data = await response.json();
      if(data.success){
        setAllOpportunities(data.opportunities);
        setStats(data.statistics);
      } else {
        throw new Error(data.error || 'API returned success: false');
      }
    } catch (err: any) {
      setError(err.message);
      setAllOpportunities([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    fetchOpportunities();
    const interval = setInterval(fetchOpportunities, 15 * 60 * 1000); // Refresh every 15 minutes
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { visibleOpportunities, opportunitiesToShow, isFreeTier } = useMemo(() => {
    const isAdmin = user?.email === ADMIN_EMAIL;

    if (!userProfile && !isAdmin) {
        return { visibleOpportunities: [], opportunitiesToShow: allOpportunities.map(op => ({ ...op, isLocked: true })), isFreeTier: true };
    }
    
    const effectiveTier = isAdmin ? 'VIP' : (userProfile?.subscriptionTier || 'FREE');
    const allowedRanks = tierPermissions[effectiveTier] || [];

    const visible = allOpportunities.filter(op => allowedRanks.includes(op.rank));
    const locked = allOpportunities.filter(op => !allowedRanks.includes(op.rank));
    
    const opportunities = [...visible.map(op => ({...op, isLocked: false})), ...locked.map(op => ({ ...op, isLocked: true }))]
        .sort((a, b) => a.priority - b.priority || b.strengthScore - a.strengthScore);

    return { 
        visibleOpportunities: visible, 
        opportunitiesToShow: opportunities,
        isFreeTier: !isAdmin && effectiveTier === 'FREE',
    };
  }, [allOpportunities, userProfile, user]);


  const getRankBadge = (rank: string) => {
    switch (rank) {
      case 'PLATINUM':
        return <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg"><Layers className="mr-1 h-3 w-3" /> Platinum</Badge>;
      case 'GOLD':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black"><Star className="mr-1 h-3 w-3" /> Gold</Badge>;
      case 'SILVER':
        return <Badge className="bg-gray-400 hover:bg-gray-500 text-white"><Medal className="mr-1 h-3 w-3" /> Silver</Badge>;
      default:
        return <Badge variant="secondary">{rank}</Badge>;
    }
  };

  const renderStats = () => {
    if (!stats || isFreeTier) return null;
    const statCards = [
        { label: "Visible Signals", value: visibleOpportunities.length, icon: <Search/>, note: "Based on your current plan" },
        { label: "Market Sentiment", value: stats.fearGreedIndex || 'N/A', icon: <Gauge/>, note: "Fear & Greed Index" },
        { label: "Platinum Signals", value: stats.platinum, icon: <Gem className="text-purple-500"/>, note: "Highest probability" },
        { label: "Gold Signals", value: stats.gold, icon: <Star className="text-yellow-500"/>, note: "High probability" },
        { label: "Scan Time", value: `${(stats.scanTimeMs / 1000).toFixed(1)}s`, icon: <Clock/>, note: "Last scan duration" },
    ];
    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {statCards.map(stat => (
                <Card key={stat.label}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                        <div className="h-4 w-4 text-muted-foreground">{stat.icon}</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className="text-xs text-muted-foreground">{stat.note}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
  }

  const renderOpportunityCard = (op: Opportunity & { isLocked: boolean }) => {
    const isLockedForUser = op.isLocked;

    return (
        <Card key={`${op.symbol}-${op.timeframe}`} className={`overflow-hidden transition-all duration-300 relative ${isLockedForUser ? 'bg-card/50' : 'bg-card'} ${op.rank === 'PLATINUM' ? 'border-2 border-purple-500 shadow-lg' : ''}`}>
        <CardHeader className="p-4">
            <div className="flex justify-between items-start">
            <div>
                <div className="flex items-center gap-2 flex-wrap">
                    {getRankBadge(op.rank)}
                    <CardTitle className="text-xl">{op.symbol}/USDT</CardTitle>
                    <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {op.timeframe}
                    </Badge>
                </div>
                <p className={`text-2xl font-bold mt-1 ${op.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${op.price.toLocaleString()}
                </p>
            </div>
            <div className="text-right">
                {op.tradingAction.includes('BUY') ? 
                <Badge className="bg-green-600 text-white hover:bg-green-700">BUY</Badge> : 
                <Badge className="bg-red-600 text-white hover:bg-red-700">SELL</Badge>
                }
                <p className={`text-sm font-medium mt-1 ${op.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {op.priceChange24h.toFixed(2)}% (24h)
                </p>
            </div>
            </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
            <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Confidence</span>
                <div className="flex items-center gap-2 w-1/2">
                    <Progress value={op.strengthScore} className={`h-2 ${op.rank === 'PLATINUM' ? '[&>div]:bg-purple-500' : ''}`} />
                    <span className="text-sm font-semibold">{op.strengthScore}%</span>
                </div>
            </div>
            <p className="text-xs text-muted-foreground pt-2 mt-2 border-t text-center">
                <Info className="inline-block h-3 w-3 mr-1"/>
                {op.tradingSignal}
            </p>

            <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full mt-4" disabled={isLockedForUser}>View Chart & Details</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                <DialogTitle className="text-2xl">{op.symbol}/USDT Full Analysis ({op.timeframe})</DialogTitle>
                <DialogDescription>
                    Detailed chart view with entry, take profit, and stop loss levels.
                </DialogDescription>
                </DialogHeader>
                <SignalChart 
                data={op.priceHistory} 
                entryPrice={op.price} 
                takeProfit={op.takeProfit} 
                stopLoss={op.stopLoss}
                />
            </DialogContent>
            </Dialog>

            {isLockedForUser && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
                <Lock className="h-8 w-8 text-primary" />
                <p className="mt-2 font-semibold text-center">Unlock this signal with a premium plan</p>
                <Button asChild size="sm" className="mt-4">
                <Link href="/pricing">Upgrade Now</Link>
                </Button>
            </div>
            )}
        </CardContent>
        </Card>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Signal Screener</h1>
          <p className="text-muted-foreground">
            Finds high-probability trading opportunities using our proprietary analysis.
          </p>
        </div>
         <Button variant="outline" onClick={fetchOpportunities} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4" />}
            {loading ? 'Scanning...' : 'Refresh Now'}
        </Button>
      </div>
      
      {renderStats()}

      {loading && (
        <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-semibold">Scanning The Market...</p>
          <p className="text-muted-foreground">This may take a moment as we analyze multiple timeframes.</p>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center text-destructive">
            <ServerCrash className="h-12 w-12" />
            <p className="text-lg font-semibold">Scan Failed</p>
            <p>{error}</p>
        </div>
      )}
      
      {!loading && !error && opportunitiesToShow.length === 0 && (
         <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center">
            <Search className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-semibold">No Strong Opportunities Found</p>
            <p className="text-muted-foreground">The market is quiet. The scanner will check again automatically.</p>
        </div>
      )}

      {!loading && !error && opportunitiesToShow.length > 0 && (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {opportunitiesToShow.map(renderOpportunityCard)}
        </div>
      )}
    </div>
  );
}
