
import { NextResponse } from 'next/server';
import { collection, query, where, getDocs, doc, updateDoc, writeBatch, runTransaction, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Trade {
    id: string;
    userId: string;
    action: 'BUY' | 'SELL';
    entryPrice: number;
    quantity: number;
    takeProfit: number;
    stopLoss: number;
    symbol: string;
    binanceSymbol: string;
    status: 'open' | 'closed_tp' | 'closed_sl';
}

const profitShareTiers: Record<string, number> = {
    'FREE': 0, // No auto-trading, so no profit share
    'TRADER': 0.30, // 30%
    'PRO': 0.15, // 15%
    'VIP': 0.10, // 10%
};


// Function to fetch current prices for multiple symbols from Binance
async function getCurrentPrices(symbols: string[]): Promise<Record<string, number>> {
    if (symbols.length === 0) return {};
    
    const symbolsParam = JSON.stringify(symbols);
    const url = `https://api.binance.com/api/v3/ticker/price?symbols=${symbolsParam}`;

    try {
        const response = await fetch(url, {
            next: { revalidate: 10 }
        });

        if (!response.ok) {
            console.error("Binance API error:", response.status, await response.text());
            throw new Error(`Binance API error: ${response.status}`);
        }

        const data: { symbol: string, price: string }[] = await response.json();
        
        const prices: Record<string, number> = {};
        for (const ticker of data) {
            prices[ticker.symbol] = parseFloat(ticker.price);
        }
        return prices;
    } catch (error: any) {
        console.error("Failed to fetch current prices from Binance:", error);
        throw new Error("Could not fetch current prices from Binance.");
    }
}


export async function GET() {
    try {
        console.log("🚀 Starting trade check job...");
        const startTime = Date.now();

        const tradesCollectionRef = collection(db, "trades");
        const q = query(tradesCollectionRef, where("status", "==", "open"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return NextResponse.json({ success: true, message: "No open trades to check.", updates: 0 });
        }

        const openTrades: Trade[] = [];
        querySnapshot.forEach(doc => {
            openTrades.push({ id: doc.id, ...doc.data() } as Trade);
        });

        const uniqueSymbols = [...new Set(openTrades.map(t => t.binanceSymbol))];
        const currentPrices = await getCurrentPrices(uniqueSymbols);
        
        let updatedCount = 0;
        const updatePromises: Promise<void>[] = [];

        for (const trade of openTrades) {
            const currentPrice = currentPrices[trade.binanceSymbol];
            if (currentPrice === undefined) {
                console.warn(`Could not find price for ${trade.binanceSymbol}. Skipping.`);
                continue;
            }

            let newStatus: Trade['status'] | null = null;
            let closingPrice: number | null = null;

            if (trade.action === 'BUY') {
                if (currentPrice >= trade.takeProfit) {
                    newStatus = 'closed_tp';
                    closingPrice = trade.takeProfit;
                } else if (currentPrice <= trade.stopLoss) {
                    newStatus = 'closed_sl';
                    closingPrice = trade.stopLoss;
                }
            } else if (trade.action === 'SELL') {
                if (currentPrice <= trade.takeProfit) {
                    newStatus = 'closed_tp';
                    closingPrice = trade.takeProfit;
                } else if (currentPrice >= trade.stopLoss) {
                    newStatus = 'closed_sl';
                    closingPrice = trade.stopLoss;
                }
            }

            if (newStatus && closingPrice !== null) {
                updatedCount++;
                const finalClosingPrice = closingPrice;
                const promise = runTransaction(db, async (transaction) => {
                    const userDocRef = doc(db, "users", trade.userId);
                    const userDoc = await transaction.get(userDocRef);

                    if (!userDoc.exists()) {
                        throw new Error(`User with ID ${trade.userId} not found.`);
                    }
                    const userData = userDoc.data();
                    
                    let pnl = 0;
                    if (trade.action === 'BUY') {
                        pnl = (finalClosingPrice - trade.entryPrice) * trade.quantity;
                    } else { // SELL
                        pnl = (trade.entryPrice - finalClosingPrice) * trade.quantity;
                    }

                    // --- PROFIT SHARE LOGIC ---
                    // Only if the trade is profitable (pnl > 0), deduct the profit share from the user's wallet.
                    if (pnl > 0) {
                        const userTier = userData.subscriptionTier || 'FREE';
                        const profitSharePercentage = profitShareTiers[userTier] || 0;
                        const profitShareAmount = pnl * profitSharePercentage;

                        if (profitShareAmount > 0) {
                            // Deduct the profit share amount by incrementing with a negative value
                            transaction.update(userDocRef, { walletBalance: increment(-profitShareAmount) });
                             console.log(`Deducted ${profitShareAmount.toFixed(2)} (profit share) from user ${trade.userId}'s wallet.`);
                        }
                    }
                    // --- END PROFIT SHARE LOGIC ---


                    // Update trade status, add PNL, and other details
                    const tradeDocRef = doc(db, "trades", trade.id);
                    transaction.update(tradeDocRef, { 
                        status: newStatus,
                        closedAt: new Date(),
                        closingPrice: finalClosingPrice,
                        pnl: pnl
                    });

                    console.log(`Trade ${trade.id} (${trade.symbol}) updated to ${newStatus}. PNL: ${pnl.toFixed(2)}.`);
                }).catch(err => {
                    console.error(`Transaction failed for trade ${trade.id}:`, err);
                    // We don't re-throw, to allow other trades to be processed.
                });
                updatePromises.push(promise);
            }
        }
        
        await Promise.all(updatePromises);
        
        const duration = Date.now() - startTime;
        console.log(`✅ Trade check job finished in ${duration}ms. Updated ${updatedCount} trades.`);

        return NextResponse.json({
            success: true,
            message: `Checked ${openTrades.length} trades. Updated ${updatedCount} trades.`,
            updates: updatedCount,
            duration: `${duration}ms`
        });

    } catch (error: any) {
        console.error("❌ Error in trade check job:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "An unknown server error occurred during the trade check."
        }, { status: 500 });
    }
}
    
