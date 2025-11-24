"use client";
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Zap, TrendingUp, TrendingDown, CheckCircle, XCircle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const SUPPORTED_SYMBOLS = [
  'BTC', 'ETH', 'SOL', 'ADA', 'XRP', 'DOGE', 'SHIB', 'AVAX', 'DOT', 'LINK', 
  'MATIC', 'LTC', 'BCH', 'TRX', 'UNI', 'ATOM', 'NEAR', 'FTM', 'ALGO', 'VET', 'ICP'
];

interface AnalysisCache {
  [symbol: string]: {
    data: any;
    timestamp: number;
  };
}

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const COOLDOWN_DURATION_MS = 30 * 1000; // 30 seconds

export function BubbleDetector() {
  const [symbol, setSymbol] = useState('BTC');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const cache = useRef<AnalysisCache>({});
  const cooldownTimers = useRef<{[symbol: string]: number}>({});

  const analyzeMarket = useCallback(async (selectedSymbol: string) => {
    if (!selectedSymbol) return;

    const now = Date.now();
    const cooldownEnd = cooldownTimers.current[selectedSymbol];
    if (cooldownEnd && now < cooldownEnd) {
      toast({
        title: "Cooldown Active",
        description: `Please wait ${Math.ceil((cooldownEnd - now) / 1000)}s before analyzing ${selectedSymbol} again.`,
      });
      return;
    }
    
    const cachedItem = cache.current[selectedSymbol];
    if (cachedItem && (now - cachedItem.timestamp) < CACHE_DURATION_MS) {
      setAnalysisResult(cachedItem.data);
      toast({
        title: "Loaded from Cache",
        description: `Displaying recent analysis for ${selectedSymbol}.`,
      });
      return;
    }

    setLoading(true);
    setAnalysisResult(null);
    
    try {
      const response = await fetch(`/api/analyze/${selectedSymbol}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Backend analysis failed.');
      }
      
      setAnalysisResult(data);
      cache.current[selectedSymbol] = { data, timestamp: Date.now() };
      cooldownTimers.current[selectedSymbol] = Date.now() + COOLDOWN_DURATION_MS;

    } catch (err: any) {
      console.error("Analysis failed:", err);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: err.message,
      });
      setAnalysisResult({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getRiskColor = (probability: number) => {
    if (probability >= 75) return 'text-red-600';
    if (probability >= 50) return 'text-orange-500';
    if (probability >= 25) return 'text-yellow-500';
    return 'text-green-600';
  };

  const getRecommendationBadge = (recommendation: string) => {
    switch(recommendation) {
      case 'STRONG_BUY':
        return <Badge className="bg-green-700 hover:bg-green-800 text-white">Strong Buy</Badge>;
      case 'BUY':
        return <Badge className="bg-green-500 hover:bg-green-600">Buy</Badge>;
      case 'HOLD':
        return <Badge variant="secondary">Hold</Badge>;
      case 'SELL':
        return <Badge className="bg-red-500 hover:bg-red-600">Sell</Badge>;
      case 'STRONG_SELL':
        return <Badge className="bg-red-700 hover:bg-red-800">Strong Sell</Badge>;
      default:
        return <Badge>{recommendation}</Badge>;
    }
  };

  const isButtonDisabled = loading || (cooldownTimers.current[symbol] > Date.now());


  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl flex items-center justify-center gap-2">
          <Zap className="h-7 w-7 text-primary" />
          GiantOracle Analyst
        </CardTitle>
        <CardDescription>
         Get instant, expert-level analysis on any major cryptocurrency. Our advanced system evaluates live market data to give you a clear, actionable trading edge.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex gap-4 items-center justify-center">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Select Asset
          </label>
          <Select onValueChange={setSymbol} defaultValue={symbol}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select a coin" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_SYMBOLS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="mt-8">
          <Button onClick={() => analyzeMarket(symbol)} disabled={isButtonDisabled}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : 'Analyze Now'}
          </Button>
        </div>
      </CardContent>

      {analysisResult && analysisResult.success && (
        <CardContent className="space-y-6">
          
          <div className="bg-secondary/50 p-6 rounded-lg border">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2"><FileText /> Expert Summary</h3>
                    <p className="text-sm text-muted-foreground italic">
                        "{analysisResult.analysis.summary}"
                    </p>
                </div>
                 <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">System Recommendation</h3>
                    <div className="flex items-center gap-4">
                        {getRecommendationBadge(analysisResult.analysis.recommendation)}
                        <div>
                            <p className="font-semibold">Confidence: {analysisResult.analysis.confidence_score}%</p>
                            <Progress value={analysisResult.analysis.confidence_score} className="w-full h-2 mt-1" />
                        </div>
                    </div>
                     <div className="mt-2">
                        <p className={`font-semibold ${getRiskColor(analysisResult.analysis.bubble_probability)}`}>
                            Bubble Probability: {analysisResult.analysis.bubble_probability}%
                        </p>
                        <Progress value={analysisResult.analysis.bubble_probability} className="w-full h-2 mt-1" />
                    </div>
                </div>
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-green-600 flex items-center gap-2"><TrendingUp /> Bullish Points</h3>
              <ul className="space-y-2">
                {analysisResult.analysis.bullish_points.map((point: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2"><TrendingDown /> Bearish Points</h3>
              <ul className="space-y-2">
                {analysisResult.analysis.bearish_points.map((point: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </CardContent>
      )}

      {analysisResult && !analysisResult.success && (
         <CardContent>
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
                <p className="font-bold">Analysis Failed</p>
                <p>{analysisResult.error}</p>
            </div>
         </CardContent>
      )}

       {loading && (
        <CardContent>
            <div className="flex flex-col items-center justify-center space-y-4 p-8">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Our system is analyzing live market data...</p>
            </div>
        </CardContent>
      )}

    </Card>
  );
};
