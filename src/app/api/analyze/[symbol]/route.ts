
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ai } from '@/ai/genkit';
import { z } from 'zod';

// ========== DATA FETCHING FUNCTIONS ==========

// Symbol mappings for different exchanges
const BINANCE_SYMBOLS: Record<string, string> = {
  'BTC': 'BTCUSDT', 'ETH': 'ETHUSDT', 'SOL': 'SOLUSDT', 'ADA': 'ADAUSDT', 'XRP': 'XRPUSDT',
  'DOGE': 'DOGEUSDT', 'SHIB': 'SHIBUSDT', 'AVAX': 'AVAXUSDT', 'DOT': 'DOTUSDT', 'LINK': 'LINKUSDT',
  'MATIC': 'MATICUSDT', 'LTC': 'LTCUSDT', 'BCH': 'BCHUSDT', 'TRX': 'TRXUSDT', 'UNI': 'UNIUSDT',
  'ATOM': 'ATOMUSDT', 'NEAR': 'NEARUSDT', 'FTM': 'FTMUSDT', 'ALGO': 'ALGOUSDT', 'VET': 'VETUSDT', 'ICP': 'ICPUSDT'
};

const COINGECKO_SYMBOLS: Record<string, string> = {
  'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana', 'ADA': 'cardano', 'XRP': 'ripple',
  'DOGE': 'dogecoin', 'SHIB': 'shiba-inu', 'AVAX': 'avalanche-2', 'DOT': 'polkadot', 'LINK': 'chainlink',
  'MATIC': 'polygon', 'LTC': 'litecoin', 'BCH': 'bitcoin-cash', 'TRX': 'tron', 'UNI': 'uniswap'
};

// Default market data fallback
function getDefaultMarketData(currentPrice: number) {
  return {
    marketCap: currentPrice * 19000000, marketCapRank: 1, circulatingSupply: 19000000,
    totalSupply: 21000000, maxSupply: 21000000,
    allTimeHigh: { price: currentPrice * 1.3, date: new Date().toISOString(), changePercentage: -23 },
    allTimeLow: { price: currentPrice * 0.15, date: new Date().toISOString(), changePercentage: 567 },
    priceChange7d: 2.5, priceChange30d: 8.7, source: 'Estimated Data'
  };
}

// Fetch real-time data from Binance
async function getBinanceData(symbol: string) {
  try {
    const binanceSymbol = BINANCE_SYMBOLS[symbol.toUpperCase()];
    if (!binanceSymbol) throw new Error(`Unsupported symbol for Binance: ${symbol}`);

    const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`, { next: { revalidate: 60 } });
    if (!response.ok) throw new Error(`Binance API error: ${response.status}`);
    const data = await response.json();
    return {
      price: parseFloat(data.lastPrice), priceChange24h: parseFloat(data.priceChangePercent),
      volume24h: parseFloat(data.volume), high24h: parseFloat(data.highPrice),
      low24h: parseFloat(data.lowPrice), source: 'Binance API'
    };
  } catch (error: any) {
    console.error(`Binance API error for ${symbol}:`, error.message);
    throw error;
  }
}

// Fetch additional data from CoinGecko
async function getCoinGeckoData(symbol: string, currentPrice: number) {
  try {
    const coinId = COINGECKO_SYMBOLS[symbol.toUpperCase()];
    if (!coinId) return getDefaultMarketData(currentPrice);

    const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`, { next: { revalidate: 300 } });
    if (!response.ok) {
      console.warn(`CoinGecko API issue for ${symbol}, using defaults`);
      return getDefaultMarketData(currentPrice);
    }
    const data = await response.json();
    const marketData = data.market_data;
    return {
      marketCap: marketData.market_cap?.usd || 0, marketCapRank: marketData.market_cap_rank || 999,
      circulatingSupply: marketData.circulating_supply || 0, totalSupply: marketData.total_supply || null,
      maxSupply: marketData.max_supply || null,
      allTimeHigh: { price: marketData.ath?.usd || currentPrice * 1.5, date: marketData.ath_date?.usd || new Date().toISOString(), changePercentage: marketData.ath_change_percentage?.usd || -25 },
      allTimeLow: { price: marketData.atl?.usd || currentPrice * 0.1, date: marketData.atl_date?.usd || new Date().toISOString(), changePercentage: marketData.atl_change_percentage?.usd || 900 },
      priceChange7d: marketData.price_change_percentage_7d || 0, priceChange30d: marketData.price_change_percentage_30d || 0,
      source: 'CoinGecko API'
    };
  } catch (error: any) {
    console.error(`CoinGecko error for ${symbol}:`, error.message);
    return getDefaultMarketData(currentPrice);
  }
}

// Get Fear & Greed Index
async function getFearGreedIndex() {
  try {
    const response = await fetch('https://api.alternative.me/fng/?limit=1', { next: { revalidate: 300 } });
    if (!response.ok) throw new Error(`Fear & Greed API error: ${response.status}`);
    const data = await response.json();
    const index = parseInt(data.data[0].value, 10);
    let category = 'Neutral';
    if (index <= 20) category = 'Extreme Fear'; else if (index <= 40) category = 'Fear';
    else if (index >= 80) category = 'Extreme Greed'; else if (index >= 60) category = 'Greed';
    return { index, category, source: 'Alternative.me API' };
  } catch (error: any) {
    console.error('Fear & Greed Index error:', error.message);
    return { index: 50, category: 'Neutral', source: 'Default (API unavailable)' };
  }
}


// ========== PROMPT & SCHEMAS ==========

const AnalysisInputSchema = z.object({
    symbol: z.string(),
    priceData: z.any(),
    marketData: z.any(),
    fearGreedData: z.any(),
});

const AnalysisOutputSchema = z.object({
  summary: z.string().describe("A 2-3 sentence expert summary of the current market situation for the asset."),
  bullish_points: z.array(z.string()).describe("A list of 2-3 key bullish (positive) points or indicators."),
  bearish_points: z.array(z.string()).describe("A list of 2-3 key bearish (negative) points or indicators."),
  recommendation: z.enum(["STRONG_BUY", "BUY", "HOLD", "SELL", "STRONG_SELL"]).describe("Your final trading recommendation based on the analysis."),
  confidence_score: z.number().min(0).max(100).describe("A confidence score (0-100) for your recommendation."),
  bubble_probability: z.number().min(0).max(100).describe("The estimated probability (0-100) of the asset being in a speculative bubble."),
});


const analysisPrompt = ai.definePrompt({
    name: 'marketAnalysisPrompt',
    input: { schema: AnalysisInputSchema },
    output: { schema: AnalysisOutputSchema },
    prompt: `You are a world-class cryptocurrency analyst. Your task is to provide a professional, data-driven analysis for the asset: {{{symbol}}}.

    Analyze the provided market data:
    - Current Price: {{{priceData.price}}}
    - 24h Change: {{{priceData.priceChange24h}}}%
    - 24h Volume (in coins): {{{priceData.volume24h}}}
    - Market Cap: {{{marketData.marketCap}}} (Rank: {{{marketData.marketCapRank}}})
    - All-Time High: {{{marketData.allTimeHigh.price}}} ({{{marketData.allTimeHigh.changePercentage}}}% from ATH)
    - Fear & Greed Index: {{{fearGreedData.index}}} ({{{fearGreedData.category}}})
    - 7-day price change: {{{marketData.priceChange7d}}}%
    - 30-day price change: {{{marketData.priceChange30d}}}%

    Based on this data, generate a concise and expert analysis. Focus on bubble detection, risk, and trading opportunities.

    - The summary should be a professional overview.
    - Identify the strongest bullish and bearish arguments. Be specific and reference the data.
    - Determine a clear trading recommendation (STRONG_BUY, BUY, HOLD, SELL, STRONG_SELL).
    - Provide a confidence score for your recommendation.
    - Calculate a "bubble probability" based on factors like extreme greed, parabolic price moves, and distance from ATH.
    
    Provide your response in the requested JSON format.
    `,
});


// ========== API ROUTE HANDLER ==========

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
): Promise<NextResponse> {
  try {
    const { symbol } = params;
    const startTime = Date.now();

    console.log(`Starting analysis for ${symbol}...`);

    if (!BINANCE_SYMBOLS[symbol.toUpperCase()]) {
      return NextResponse.json({
        error: `Unsupported cryptocurrency symbol: ${symbol}`,
        supportedSymbols: Object.keys(BINANCE_SYMBOLS)
      }, { status: 400 });
    }

    const [priceData, fearGreedData] = await Promise.all([
      getBinanceData(symbol),
      getFearGreedIndex()
    ]);

    const marketData = await getCoinGeckoData(symbol, priceData.price);

    const { output } = await analysisPrompt({
        symbol: symbol.toUpperCase(),
        priceData,
        marketData,
        fearGreedData
    });

    if (!output) {
      throw new Error("Analysis failed to generate a valid response.");
    }
    
    const response = {
      success: true,
      symbol: symbol.toUpperCase(),
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime,
      analysis: output,
      dataSources: {
        price: priceData.source,
        market: marketData.source,
        sentiment: fearGreedData.source
      },
      currentPrice: priceData.price,
      priceChange24h: priceData.priceChange24h,
      fearGreedIndex: fearGreedData.index,
      fearGreedCategory: fearGreedData.category,
    };

    console.log(`Analysis completed for ${symbol} in ${Date.now() - startTime}ms`);
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

    