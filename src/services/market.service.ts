
import { analyzeMarket, type Candle } from '@/lib/technical-indicators';

const BINANCE_API = 'https://api.binance.com/api/v3';

// #region Types
export interface ScanOptions {
  symbols?: string[];
  timeframes?: string[];
  minVolume?: number;
  minPriceChange?: number;
  topN?: number;
  minConfidence?: number;
}

export interface MarketOpportunity {
  symbol: string;
  rank: 'PLATINUM' | 'GOLD' | 'SILVER';
  priority: number;
  timeframe: string;
  tradingAction: 'BUY' | 'SELL';
  strengthScore: number;
  tradingSignal: string;
  price: number;
  volume24h: number;
  priceChange24h: number;
  takeProfit: number;
  stopLoss: number;
  priceHistory: Array<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
  }>;
}

export interface ScanResult {
  success: boolean;
  error?: string;
  opportunities: MarketOpportunity[];
  statistics: {
    totalProcessed: number;
    totalOpportunities: number;
    platinum: number;
    gold: number;
    silver: number;
    scanTimeMs: number;
    fearGreedIndex: number;
  };
  timestamp: string;
}
// #endregion

// #region Data Fetching
async function getFearGreedIndex(): Promise<number> {
  try {
    const response = await fetch('https://api.alternative.me/fng/?limit=1', { 
      next: { revalidate: 300 } 
    });
    if (!response.ok) throw new Error(`Fear & Greed API error: ${response.status}`);
    const data = await response.json();
    return parseInt(data.data[0].value, 10);
  } catch (error: any) {
    console.error('Fear & Greed Index error:', error.message);
    return 50;
  }
}

async function getHistoricalData(symbol: string, interval: string, limit: number = 100): Promise<Candle[]> {
  try {
    const url = `${BINANCE_API}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    const response = await fetch(url, { next: { revalidate: 60 } });
    
    if (!response.ok) {
      if (response.status !== 400) {
        console.warn(`Failed to fetch klines for ${symbol} on ${interval}: ${response.status}`);
      }
      return [];
    }
    
    const data = await response.json();
    return data.map((d: any) => ({
      timestamp: d[0],
      open: parseFloat(d[1]),
      high: parseFloat(d[2]),
      low: parseFloat(d[3]),
      close: parseFloat(d[4]),
      volume: parseFloat(d[5])
    }));
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol} on ${interval}:`, (error as Error).message);
    return [];
  }
}
// #endregion

// #region Analysis Logic
function generateAdvancedScanSignal(analysis: any, fearGreedIndex: number) {
  if (!analysis || !analysis.rsi || !analysis.macd || !analysis.bollinger || !analysis.momentum || !analysis.volume || !analysis.patterns) {
    return null;
  }

  const { rsi, macd, bollinger, momentum, volume, patterns } = analysis;
  let score = 0;

  if (rsi.signal === 'OVERSOLD') score += 25;
  if (rsi.signal === 'OVERBOUGHT') score -= 25;
  if (macd.trend === 'BULLISH') score += 15;
  if (macd.trend === 'BEARISH') score -= 15;
  if (bollinger.signal === 'OVERSOLD') score += 15;
  if (bollinger.signal === 'OVERBOUGHT') score -= 15;
  if (momentum.trend === 'BULLISH') score += (momentum.strength === 'STRONG' ? 20 : 10);
  if (momentum.trend === 'BEARISH') score -= (momentum.strength === 'STRONG' ? 20 : 10);
  if (volume.signal === 'STRONG') score += 5;
  if (patterns.signal === 'BULLISH') score += 10;
  if (patterns.signal === 'BEARISH') score -= 10;
  if (fearGreedIndex < 30) score += 10;
  if (fearGreedIndex > 75) score -= 10;

  let tradingAction: 'BUY' | 'SELL' | null = null;
  if (score >= 18) tradingAction = 'BUY';
  else if (score <= -18) tradingAction = 'SELL';
  else return null;

  return {
    tradingAction,
    strengthScore: Math.min(100, Math.round(Math.abs(score))),
    tradingSignal: `Multiple indicators suggest a potential ${tradingAction} opportunity.`,
  };
}

function calculateTradingLevels(price: number, action: string, rank: string): { takeProfit: number; stopLoss: number } {
  if (isNaN(price) || price <= 0) return { takeProfit: 0, stopLoss: 0 };
  let tpRate: number, slRate: number;

  if (action.includes('BUY')) {
    switch(rank) {
      case 'PLATINUM': [tpRate, slRate] = [1.08, 0.96]; break;
      case 'GOLD':     [tpRate, slRate] = [1.05, 0.97]; break;
      default:         [tpRate, slRate] = [1.03, 0.98]; break;
    }
  } else { // SELL
    switch(rank) {
      case 'PLATINUM': [tpRate, slRate] = [0.92, 1.04]; break;
      case 'GOLD':     [tpRate, slRate] = [0.95, 1.03]; break;
      default:         [tpRate, slRate] = [0.97, 1.02]; break;
    }
  }
  return { 
    takeProfit: parseFloat((price * tpRate).toFixed(4)), 
    stopLoss: parseFloat((price * slRate).toFixed(4)) 
  };
}
// #endregion

// #region Main Scan Function
export async function scanMarket(options: ScanOptions = {}): Promise<ScanResult> {
    const {
        symbols,
        timeframes = ['15m', '1h', '4h'],
        minVolume = 1000000,
        minPriceChange = 1.5,
        topN = 50,
    } = options;

    const startTime = Date.now();
    try {
        let qualifiedTickers: any[];

        if (symbols && symbols.length > 0) {
            const tickersResponse = await fetch(`${BINANCE_API}/ticker/24hr?symbols=${JSON.stringify(symbols)}`);
            if (!tickersResponse.ok) throw new Error(`Binance API error on custom symbols: ${tickersResponse.status}`);
            qualifiedTickers = await tickersResponse.json();
        } else {
            const tickersResponse = await fetch(`${BINANCE_API}/ticker/24hr`);
            if (!tickersResponse.ok) throw new Error(`Binance API error on all tickers: ${tickersResponse.status}`);
            const allTickers = await tickersResponse.json();
            
            qualifiedTickers = allTickers
                .filter((t: any) => 
                    t.symbol.endsWith('USDT') &&
                    !/UP|DOWN|BULL|BEAR/.test(t.symbol) &&
                    parseFloat(t.quoteVolume) > minVolume &&
                    Math.abs(parseFloat(t.priceChangePercent)) > minPriceChange
                )
                .sort((a: any, b: any) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
                .slice(0, topN);
        }

        const fearGreedIndex = await getFearGreedIndex();
        
        const processTicker = async (ticker: any) => {
            const symbol = ticker.symbol;
            const tfSignals: Record<string, any> = {};

            for (const tf of timeframes) {
                const candles = await getHistoricalData(symbol, tf);
                if (candles.length < 50) continue;
                
                const analysis = await analyzeMarket(candles, symbol, tf);
                const signal = generateAdvancedScanSignal(analysis, fearGreedIndex);
                
                if (signal) {
                    tfSignals[tf] = {
                        ...signal,
                        price: parseFloat(ticker.lastPrice),
                        priceHistory: candles.slice(-50).map(c => ({ time: c.timestamp, open: c.open, high: c.high, low: c.low, close: c.close }))
                    };
                }
            }
            
            const { '15m': has15m, '1h': has1h, '4h': has4h } = tfSignals;
            let opportunity: any = null;

            if (has15m && has1h && has4h && has15m.tradingAction === has1h.tradingAction && has1h.tradingAction === has4h.tradingAction) {
                opportunity = { ...[has15m, has1h, has4h].sort((a,b) => b.strengthScore - a.strengthScore)[0], rank: 'PLATINUM', priority: 0, timeframe: '15m-1h-4h', tradingSignal: `PLATINUM SIGNAL: Strong ${tfSignals['15m'].tradingAction} signal confirmed across multiple timeframes.`, symbol };
            } else if (has1h) {
                opportunity = { ...has1h, rank: 'GOLD', priority: 1, timeframe: '1h', symbol };
            } else if (has15m) {
                opportunity = { ...has15m, rank: 'SILVER', priority: 2, timeframe: '15m', symbol };
            }

            if (opportunity) {
                 const price = parseFloat(ticker.lastPrice);
                 const { takeProfit, stopLoss } = calculateTradingLevels(price, opportunity.tradingAction, opportunity.rank);
                 return {
                     ...opportunity,
                     symbol: ticker.symbol.replace('USDT', ''),
                     price,
                     volume24h: parseFloat(ticker.quoteVolume),
                     priceChange24h: parseFloat(ticker.priceChangePercent),
                     takeProfit,
                     stopLoss,
                 };
            }
            return null;
        };

        const opportunityPromises = qualifiedTickers.map(processTicker);
        let finalOpportunities = (await Promise.all(opportunityPromises)).filter(op => op !== null) as MarketOpportunity[];

        finalOpportunities.sort((a, b) => a.priority - b.priority || b.strengthScore - a.strengthScore);

        const scanTimeMs = Date.now() - startTime;
        console.log(`✅ Scan completed in ${scanTimeMs}ms. Found ${finalOpportunities.length} opportunities.`);

        return {
            success: true,
            opportunities: finalOpportunities,
            statistics: {
                totalProcessed: qualifiedTickers.length,
                totalOpportunities: finalOpportunities.length,
                platinum: finalOpportunities.filter(o => o.rank === 'PLATINUM').length,
                gold: finalOpportunities.filter(o => o.rank === 'GOLD').length,
                silver: finalOpportunities.filter(o => o.rank === 'SILVER').length,
                scanTimeMs,
                fearGreedIndex,
            },
            timestamp: new Date().toISOString(),
        };
    } catch (error: any) {
        console.error('❌ Market scan service error:', error);
        return {
            success: false,
            error: error.message || 'An unknown error occurred during the scan.',
            opportunities: [],
            statistics: { totalProcessed: 0, totalOpportunities: 0, platinum: 0, gold: 0, silver: 0, scanTimeMs: Date.now() - startTime, fearGreedIndex: 50 },
            timestamp: new Date().toISOString(),
        };
    }
}
// #endregion
