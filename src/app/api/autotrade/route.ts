
import { NextResponse } from 'next/server';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { scanMarket } from '@/services/market.service';
import { decryptData } from '@/lib/user-profile';
import type { MarketOpportunity } from '@/services/market.service';

interface UserProfile {
  uid: string;
  isAutoTradeEnabled: boolean;
  autoTradeAmount: number;
  autoTradeRiskLevel: 'low' | 'medium' | 'high';
  apiKeys?: {
      binance?: {
          apiKey: string;
          apiSecret: string;
      }
  };
  // other properties...
}

// Maps our risk levels to the minimum acceptable signal rank
const riskLevelToRank: Record<string, ('SILVER' | 'GOLD' | 'PLATINUM')[]> = {
    low: ['SILVER', 'GOLD', 'PLATINUM'],
    medium: ['GOLD', 'PLATINUM'],
    high: ['PLATINUM'],
};


// This function will be triggered by a cron job (e.g., every 5 or 15 minutes)
export async function GET() {
    console.log("🤖 Starting Auto-Trade Job...");
    const startTime = Date.now();
    const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

    try {
        // 1. Get all users who have enabled auto-trading
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("isAutoTradeEnabled", "==", true));
        const userSnapshot = await getDocs(q);

        const usersToProcess: UserProfile[] = [];
        userSnapshot.forEach(doc => {
            usersToProcess.push({ uid: doc.id, ...doc.data() } as UserProfile);
        });

        if (usersToProcess.length === 0) {
            return NextResponse.json({ success: true, message: "No users with auto-trade enabled.", trades: 0 });
        }
        console.log(`Found ${usersToProcess.length} users with auto-trade enabled.`);

        // 2. Scan the market for fresh opportunities
        const scanResult = await scanMarket({ topN: 20 }); // Scan top 20 coins for efficiency
        if (!scanResult.success || scanResult.opportunities.length === 0) {
            return NextResponse.json({ success: true, message: "No trading opportunities found in the market scan.", trades: 0 });
        }
        console.log(`Found ${scanResult.opportunities.length} market opportunities.`);

        let tradesExecuted = 0;
        const batch = writeBatch(db);

        // 3. Iterate through each user and their potential trades
        for (const user of usersToProcess) {
            if (!user.apiKeys?.binance?.apiKey || !user.apiKeys?.binance?.apiSecret) {
                console.warn(`User ${user.uid} has auto-trade enabled but no API keys. Skipping.`);
                continue;
            }

            const allowedRanks = riskLevelToRank[user.autoTradeRiskLevel];
            
            for (const opportunity of scanResult.opportunities) {
                if (allowedRanks.includes(opportunity.rank)) {
                    
                    // Simple check to avoid opening the same trade again within a short period
                    // A more robust solution would check the database for recent trades on this symbol
                    const tradeId = `${user.uid}-${opportunity.symbol}-${opportunity.timeframe}-${new Date().toISOString().split('T')[0]}`;
                    const tradeDocRef = doc(db, `trades`, tradeId);
                    
                    console.log(`Executing ${opportunity.rank} trade for user ${user.uid}: ${opportunity.tradingAction} ${opportunity.symbol}`);
                    
                    const quantity = user.autoTradeAmount / opportunity.price;
                    
                    // Execute trade via our own secure API endpoint
                    const tradeResponse = await fetch(`${API_BASE_URL}/api/trade`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            apiKey: decryptData(user.apiKeys.binance.apiKey),
                            apiSecret: decryptData(user.apiKeys.binance.apiSecret),
                            symbol: opportunity.symbol + 'USDT',
                            side: opportunity.tradingAction,
                            quantity: quantity.toFixed(6), // Adjust precision as needed
                            type: 'MARKET',
                        })
                    });

                    const tradeResult = await tradeResponse.json();

                    if (!tradeResponse.ok || !tradeResult.success) {
                        console.error(`Trade failed for user ${user.uid} on ${opportunity.symbol}:`, tradeResult.error);
                        continue; // Skip to next opportunity
                    }

                    // 4. If trade is successful, create a trade document in Firestore
                    const newTrade = {
                        userId: user.uid,
                        symbol: opportunity.symbol,
                        binanceSymbol: opportunity.symbol + 'USDT',
                        action: opportunity.tradingAction,
                        status: 'open' as const,
                        entryPrice: tradeResult.data.price,
                        quantity: tradeResult.data.executedQty,
                        takeProfit: opportunity.takeProfit,
                        stopLoss: opportunity.stopLoss,
                        openedAt: serverTimestamp(),
                        signalRank: opportunity.rank,
                        signalTimeframe: opportunity.timeframe,
                    };
                    
                    batch.set(tradeDocRef, newTrade);
                    tradesExecuted++;
                }
            }
        }
        
        if (tradesExecuted > 0) {
            await batch.commit();
            console.log(`Successfully executed and saved ${tradesExecuted} new auto-trades.`);
        }

        const duration = Date.now() - startTime;
        return NextResponse.json({
            success: true,
            message: `Auto-trade job completed in ${duration}ms. Executed ${tradesExecuted} trades.`,
            trades: tradesExecuted,
        });

    } catch (error: any) {
        console.error("❌ Error in auto-trade job:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "An unknown server error occurred during the auto-trade job."
        }, { status: 500 });
    }
}
