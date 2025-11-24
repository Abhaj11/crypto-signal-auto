"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, ServerCrash, Archive } from 'lucide-react';
import { format } from 'date-fns';

interface Trade {
    id: string;
    symbol: string;
    action: 'BUY' | 'SELL';
    entryPrice: number;
    quantity: number;
    status: 'open' | 'closed_tp' | 'closed_sl' | 'closed_manual';
    openedAt: string;
    pnl?: number; // Profit and Loss
    closingPrice?: number;
}

export function TradeHistoryList() {
    const { user } = useAuth();
    const [trades, setTrades] = useState<Trade[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchTradeHistory = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/trade-history`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.uid }),
                });

                const data = await response.json();
                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Failed to fetch trade history');
                }
                setTrades(data.trades);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTradeHistory();
        // Simple auto-refresh every 15 seconds
        const interval = setInterval(fetchTradeHistory, 15000);
        return () => clearInterval(interval);

    }, [user]);

    const getStatusBadge = (status: Trade['status']) => {
        switch (status) {
            case 'open':
                return <Badge className="bg-blue-500 hover:bg-blue-600">Open</Badge>;
            case 'closed_tp':
                return <Badge className="bg-green-600 hover:bg-green-700">Take Profit</Badge>;
            case 'closed_sl':
                return <Badge variant="destructive">Stop Loss</Badge>;
            case 'closed_manual':
                return <Badge variant="secondary">Closed</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Loading Trade History...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-8 text-destructive">
                <ServerCrash className="mx-auto h-8 w-8 mb-2" />
                <p>Error loading trade history: {error}</p>
            </div>
        );
    }
    
    if (trades.length === 0) {
        return (
            <div className="text-center p-8 border rounded-lg">
                <Archive className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="font-semibold">No Trades Found</p>
                <p className="text-sm text-muted-foreground">Your executed trades will appear here.</p>
            </div>
        )
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead className="text-right">Entry Price</TableHead>
                    <TableHead className="text-right">Closing Price</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">P&L (USD)</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {trades.map((trade) => (
                    <TableRow key={trade.id}>
                        <TableCell>{format(new Date(trade.openedAt), 'PPp')}</TableCell>
                        <TableCell className="font-medium">{trade.symbol}</TableCell>
                        <TableCell>
                            <span className={`font-semibold ${trade.action === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>
                                {trade.action}
                            </span>
                        </TableCell>
                        <TableCell className="text-right font-mono">${trade.entryPrice.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono">
                            {trade.closingPrice ? `$${trade.closingPrice.toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono">{trade.quantity.toFixed(6)}</TableCell>
                         <TableCell className={`text-right font-semibold ${trade.pnl === undefined ? '' : (trade.pnl >= 0 ? 'text-green-600' : 'text-red-600')}`}>
                            {trade.pnl !== undefined ? `$${trade.pnl.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell className="text-right">{getStatusBadge(trade.status)}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
