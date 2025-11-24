

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, Activity, Settings, Eye, AlertTriangle, Loader2, ServerCrash, KeyRound, Trash2, Bot, Gem, Star, Rocket, RefreshCw, Zap
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from "@/hooks/use-toast";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateApiKeys, deleteApiKeys, updateAutoTradeSettings } from '@/lib/user-profile';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TradeHistoryList } from '@/components/trading/trade-history-list';
import Link from 'next/link';


const subscriptionPlans: any = {
    FREE: { name: 'Free', icon: <Eye className="h-6 w-6" />, signals: ['BRONZE'], profitShare: 0, allowsAutoTrade: false },
    TRADER: { name: 'Trader', icon: <Rocket className="h-6 w-6" />, signals: ['BRONZE', 'SILVER'], profitShare: 0.30, allowsAutoTrade: true },
    PRO: { name: 'Professional', icon: <Star className="h-6 w-6" />, signals: ['BRONZE', 'SILVER', 'GOLD'], profitShare: 0.15, allowsAutoTrade: true },
    VIP: { name: 'VIP', icon: <Gem className="h-6 w-6" />, signals: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'], profitShare: 0.10, allowsAutoTrade: true }
};

interface Opportunity {
  rank: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE' | 'WATCH';
  symbol: string;
  price: number;
  tradingAction: string;
  tradingSignal: string;
  strengthScore: number;
  takeProfit: number;
  stopLoss: number;
  priceChange24h: number;
}


const TradingDashboard = () => {
  const { user, userProfile, decryptedApiKeys, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [signals, setSignals] = useState<Opportunity[]>([]);
  const [loadingSignals, setLoadingSignals] = useState(true);
  const [errorSignals, setErrorSignals] = useState<string | null>(null);

  const [binanceApiKey, setBinanceApiKey] = useState('');
  const [binanceApiSecret, setBinanceApiSecret] = useState('');
  const [isSavingKeys, setIsSavingKeys] = useState(false);
  const [isDeletingKeys, setIsDeletingKeys] = useState(false);
  const [isCheckingTrades, setIsCheckingTrades] = useState(false);


  const [isAutoTradeEnabled, setIsAutoTradeEnabled] = useState(false);
  const [tradeAmount, setTradeAmount] = useState('100');
  const [riskLevel, setRiskLevel] = useState('medium');
  const [isSavingAutoTrade, setIsSavingAutoTrade] = useState(false);

  const [tradeQuantities, setTradeQuantities] = useState<Record<string, string>>({});
  const [executingTrade, setExecutingTrade] = useState<string | null>(null);


  const userSubscriptionType = userProfile?.subscriptionTier || 'FREE';
  const currentPlan = subscriptionPlans[userSubscriptionType];

  useEffect(() => {
    if (decryptedApiKeys?.binance) {
      setBinanceApiKey(decryptedApiKeys.binance.apiKey);
      setBinanceApiSecret(decryptedApiKeys.binance.apiSecret);
    } else {
      setBinanceApiKey('');
      setBinanceApiSecret('');
    }
  }, [decryptedApiKeys]);

  useEffect(() => {
    if (userProfile) {
      setIsAutoTradeEnabled(userProfile.isAutoTradeEnabled ?? false);
      setTradeAmount(String(userProfile.autoTradeAmount ?? 100));
      setRiskLevel(userProfile.autoTradeRiskLevel ?? 'medium');
    }
  }, [userProfile]);


  const fetchSignals = useCallback(async () => {
    setLoadingSignals(true);
    setErrorSignals(null);
    try {
      const response = await fetch(`/api/scan`);
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch signals');
      }
      const data = await response.json();
      if (data.success) {
        setSignals(data.opportunities);
      } else {
        throw new Error(data.error || 'API returned an error');
      }
    } catch (err: any) {
      setErrorSignals(err.message);
    } finally {
      setLoadingSignals(false);
    }
  }, []);

  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);


  const getRankColor = (rank: string) => {
    switch(rank) {
      case 'PLATINUM': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'GOLD': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'SILVER': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'BRONZE': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'WATCH': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };


  const canExecuteSignal = (signalRank: string) => {
    if (!currentPlan) return false;
    return currentPlan.signals.includes(signalRank);
  };

  const executeTrade = async (signal: Opportunity) => {
    if (!user) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to trade."});
        return;
    }

    const quantityUSD = parseFloat(tradeQuantities[signal.symbol] || '0');
    if (quantityUSD <= 0) {
        toast({ variant: "destructive", title: "Invalid Amount", description: "Please enter a valid trade amount in USD."});
        return;
    }
    const quantity = quantityUSD / signal.price;

    setExecutingTrade(signal.symbol);
    toast({ title: "Executing Trade...", description: `Submitting ${signal.tradingAction} order for ${signal.symbol}.` });

    try {
      const response = await fetch(`/api/trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            signal,
            userId: user.uid,
            quantity: quantity.toFixed(6) 
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Trade execution failed.');
      }
      
      toast({ variant: "default", className:"bg-green-500 text-white", title: "Trade Successful!", description: `Order for ${result.data.symbol} filled at ${result.data.price}` });
    } catch(err: any) {
      toast({ variant: "destructive", title: "Trade Failed", description: err.message });
    } finally {
        setExecutingTrade(null);
    }
  };

  const handleSaveKeys = async () => {
    if (!user) return;
    setIsSavingKeys(true);
    try {
      await updateApiKeys(user.uid, 'binance', binanceApiKey, binanceApiSecret);
      toast({ title: "API Keys Saved", description: "Your Binance API keys have been securely saved." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Save Failed", description: err.message });
    } finally {
      setIsSavingKeys(false);
    }
  };

  const handleDeleteKeys = async () => {
    if (!user) return;
    setIsDeletingKeys(true);
    try {
      await deleteApiKeys(user.uid, 'binance');
      setBinanceApiKey('');
      setBinanceApiSecret('');
      toast({ title: "API Keys Deleted", description: "Your Binance API keys have been removed." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Deletion Failed", description: err.message });
    } finally {
      setIsDeletingKeys(false);
    }
  };

  const handleSaveAutoTradeSettings = async () => {
    if (!user) return;
    if (!currentPlan.allowsAutoTrade) {
      toast({ variant: "destructive", title: "Upgrade Required", description: "Auto-trading is only available on the VIP plan." });
      return;
    }
    setIsSavingAutoTrade(true);
    try {
      await updateAutoTradeSettings(user.uid, {
        isAutoTradeEnabled,
        autoTradeAmount: parseFloat(tradeAmount),
        autoTradeRiskLevel: riskLevel
      });
      toast({ title: "Auto-Trade Settings Saved", description: "Your new settings have been saved and will be used for the next trades." });
    } catch(err: any) {
      toast({ variant: "destructive", title: "Save Failed", description: err.message });
    } finally {
      setIsSavingAutoTrade(false);
    }
  }

  const handleCheckTrades = async () => {
    setIsCheckingTrades(true);
    toast({ title: "Checking Trades", description: "Asking the server to check the status of all open trades." });
    try {
        const response = await fetch(`/api/check-trades`);
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.error || "Failed to check trades.");
        }
        toast({ title: "Check Complete", description: result.message });
    } catch (err: any) {
        toast({ variant: "destructive", title: "Check Failed", description: err.message });
    } finally {
        setIsCheckingTrades(false);
    }
  }

  const renderSignals = () => {
    if (loadingSignals) return <div className="flex justify-center p-8"><Loader2 className="h-10 w-10 animate-spin" /></div>
    if (errorSignals) return <div className="text-center p-8 text-destructive"><ServerCrash className="mx-auto h-10 w-10 mb-2" />Error loading signals: {errorSignals}</div>
    if (signals.length === 0) return <div className="text-center p-8"><Eye className="mx-auto h-10 w-10 text-muted-foreground mb-2" />No active signals found. Market is quiet.</div>

    return (
       <div className="space-y-4">
        {signals.map((signal) => (
          <Card key={signal.symbol} className="p-4 hover:shadow-md transition-shadow">
            <CardContent className="p-2">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-3">
                <Badge className={`px-3 py-1 rounded-full text-xs font-medium border ${getRankColor(signal.rank)}`}>
                  {signal.rank}
                </Badge>
                <h3 className="text-lg font-semibold">{signal.symbol}</h3>
                <span className="text-2xl font-bold">${signal.price.toLocaleString()}</span>
                <span className={`text-sm font-medium ${signal.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {signal.priceChange24h >= 0 ? '+' : ''}{signal.priceChange24h.toFixed(2)}%
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Confidence</div>
                <div className="font-semibold text-blue-600">{signal.strengthScore}%</div>
              </div>
            </div>

            <p className="text-muted-foreground mb-3 text-sm">{signal.tradingSignal}</p>

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <span className="text-muted-foreground">Take Profit:</span>
                <span className="ml-2 font-medium text-green-600">${signal.takeProfit.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Stop Loss:</span>
                <span className="ml-2 font-medium text-red-600">${signal.stopLoss.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center mt-4 border-t pt-4 gap-4">
              <div className="flex-1 w-full">
                 <Label htmlFor={`quantity-${signal.symbol}`} className="text-xs text-muted-foreground">Amount (USD)</Label>
                 <Input 
                    id={`quantity-${signal.symbol}`}
                    type="number"
                    placeholder="e.g., 100"
                    className="h-9"
                    value={tradeQuantities[signal.symbol] || ''}
                    onChange={(e) => setTradeQuantities({...tradeQuantities, [signal.symbol]: e.target.value})}
                    disabled={!canExecuteSignal(signal.rank) || !decryptedApiKeys?.binance}
                 />
              </div>
              
              <div className="flex gap-2 w-full md:w-auto">
                {canExecuteSignal(signal.rank) ? (
                  <>
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button className="w-full" disabled={!decryptedApiKeys?.binance || !!executingTrade || !tradeQuantities[signal.symbol]}>
                          {executingTrade === signal.symbol ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Zap className="mr-2 h-4 w-4" />}
                          Manual Trade
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Manual Trade</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to {signal.tradingAction.toLowerCase().includes('buy') ? 'BUY' : 'SELL'} approximately <strong>{((parseFloat(tradeQuantities[signal.symbol] || '0')) / signal.price).toFixed(6)} {signal.symbol}</strong> for <strong>${parseFloat(tradeQuantities[signal.symbol] || '0').toLocaleString()}</strong>?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => executeTrade(signal)} disabled={!!executingTrade}>
                            {executingTrade === signal.symbol && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Confirm
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    
                    <Button variant="outline" className="w-full" disabled={!currentPlan.allowsAutoTrade || !decryptedApiKeys?.binance}>
                      <Bot className="mr-2 h-4 w-4" />
                      Auto-Trade
                    </Button>
                  </>

                ) : (
                  <div className="text-right w-full">
                    <div className="text-red-600 text-sm mb-1">
                      <AlertTriangle className="inline h-4 w-4 mr-1" />
                      Subscription Required
                    </div>
                    <Button variant="secondary" asChild className="w-full">
                      <Link href="/pricing">View Plans</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
            {!decryptedApiKeys?.binance && canExecuteSignal(signal.rank) && 
              <p className="text-xs text-red-500 mt-2 text-right">Please connect your Binance API keys in the Settings tab to trade.</p>
            }
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 bg-background text-foreground">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Trading Dashboard</h1>
        {currentPlan && (
          <Badge variant="outline" className="px-4 py-2 text-lg flex items-center gap-2">
            {currentPlan.icon}
            {currentPlan.name} Plan
          </Badge>
        )}
      </div>

      <Tabs defaultValue="signals">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="signals">Trading Signals</TabsTrigger>
          <TabsTrigger value="performance">Trade History</TabsTrigger>
          <TabsTrigger value="settings">Settings & Auto-Trade</TabsTrigger>
        </TabsList>
        <TabsContent value="signals" className="pt-6">
            {renderSignals()}
        </TabsContent>
         <TabsContent value="performance" className="pt-6">
          <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Trade History</CardTitle>
                        <CardDescription>
                            A real-time log of all your executed trades.
                        </CardDescription>
                    </div>
                    <Button variant="outline" onClick={handleCheckTrades} disabled={isCheckingTrades}>
                        {isCheckingTrades ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Check Open Trades
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
              <TradeHistoryList />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settings" className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><KeyRound/> Binance API Connection</CardTitle>
                    <CardDescription>Connect your Binance account to enable all trading features.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="apiKey">API Key</Label>
                      <Input id="apiKey" value={binanceApiKey} onChange={(e) => setBinanceApiKey(e.target.value)} placeholder="Enter your Binance API Key" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apiSecret">API Secret</Label>
                      <Input id="apiSecret" type="password" value={binanceApiSecret} onChange={(e) => setBinanceApiSecret(e.target.value)} placeholder="Enter your Binance API Secret" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Button onClick={handleSaveKeys} disabled={isSavingKeys || !binanceApiKey || !binanceApiSecret}>
                          {isSavingKeys ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                          Save Keys
                      </Button>
                      {decryptedApiKeys?.binance && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" disabled={isDeletingKeys}>
                                  {isDeletingKeys ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4" />}
                                  Delete Keys
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete your API keys and disable all trading features.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteKeys}>Continue</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-6">
                <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Bot /> Auto-Trading Bot</CardTitle>
                      <CardDescription>Configure our bot to trade on your behalf. (Some plans)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                            <Label htmlFor="auto-trade-switch" className="font-semibold">Enable Auto-Trading Bot</Label>
                            <Switch id="auto-trade-switch" checked={isAutoTradeEnabled} onCheckedChange={setIsAutoTradeEnabled} disabled={!currentPlan.allowsAutoTrade}/>
                        </div>

                        {isAutoTradeEnabled && currentPlan.allowsAutoTrade ? (
                          <div className="space-y-4 pt-4 border-t">
                              <div className="space-y-2">
                                <Label htmlFor="trade-amount">Trade Amount (USD)</Label>
                                <Input id="trade-amount" type="number" value={tradeAmount} onChange={(e) => setTradeAmount(e.target.value)} placeholder="e.g., 100" />
                              </div>
                               <div className="space-y-2">
                                <Label htmlFor="risk-level">Risk Level</Label>
                                <Select value={riskLevel} onValueChange={setRiskLevel}>
                                  <SelectTrigger id="risk-level">
                                    <SelectValue placeholder="Select risk level" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="low">Conservative (SILVER+ signals)</SelectItem>
                                    <SelectItem value="medium">Balanced (GOLD+ signals)</SelectItem>
                                    <SelectItem value="high">Aggressive (PLATINUM signals only)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button className="w-full" onClick={handleSaveAutoTradeSettings} disabled={isSavingAutoTrade}>
                                {isSavingAutoTrade && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Auto-Trade Settings
                              </Button>
                          </div>
                        ) : (
                           <div className="text-sm text-center text-muted-foreground pt-4 border-t">
                             {currentPlan.allowsAutoTrade 
                                ? "Enable the bot to configure your trading strategy."
                                : <div className="flex flex-col items-center gap-2">
                                    <AlertTriangle className="h-6 w-6 text-orange-500"/>
                                    <span>Auto-trading is only available on select premium plans.</span>
                                    <Button asChild variant="secondary" size="sm" className="mt-2">
                                        <Link href="/pricing">Upgrade Your Plan</Link>
                                    </Button>
                                  </div>
                              }
                            </div>
                        )}
                    </CardContent>
                </Card>
              </div>

            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TradingDashboard;

    
