
export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ========== INDICATOR CALCULATIONS ==========

function calculateSMA(data: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - (period - 1), i + 1);
    const sum = slice.reduce((acc, val) => acc + val, 0);
    sma.push(sum / period);
  }
  return sma;
}


function calculateEMA(data: number[], period: number): number[] {
    const k = 2 / (period + 1);
    const ema: number[] = [data[0]]; // Start with the first price
    for (let i = 1; i < data.length; i++) {
        ema.push(data[i] * k + ema[i-1] * (1-k));
    }
    return ema;
}

function calculateRSI(prices: number[], period = 14): { rsi: number, signal: 'OVERBOUGHT' | 'OVERSOLD' | 'NEUTRAL' } {
    if (prices.length < period) return { rsi: 50, signal: 'NEUTRAL' };

    let gains = 0;
    let losses = 0;

    for (let i = 1; i < prices.length; i++) {
        const change = prices[i] - prices[i - 1];
        if (i <= period) {
            if (change > 0) gains += change;
            else losses += Math.abs(change);
        } else {
            gains = (gains * (period - 1) + (change > 0 ? change : 0)) / period;
            losses = (losses * (period - 1) + (change < 0 ? Math.abs(change) : 0)) / period;
        }
    }
    
    const avgGain = gains / Math.min(prices.length-1, period);
    const avgLoss = losses / Math.min(prices.length-1, period);

    if (avgLoss === 0) return { rsi: 100, signal: 'OVERBOUGHT' };

    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    let signal: 'OVERBOUGHT' | 'OVERSOLD' | 'NEUTRAL' = 'NEUTRAL';
    if (rsi > 70) signal = 'OVERBOUGHT';
    if (rsi < 30) signal = 'OVERSOLD';
    
    return { rsi: Math.round(rsi), signal };
}


function calculateMACD(prices: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    if (prices.length < slowPeriod) return null;
    const fastEMA = calculateEMA(prices, fastPeriod);
    const slowEMA = calculateEMA(prices, slowPeriod);

    const macdLine = fastEMA.slice(slowPeriod - fastPeriod).map((fe, i) => fe - slowEMA[i]);
    const signalLine = calculateEMA(macdLine, signalPeriod);
    const histogram = macdLine.slice(signalPeriod-1).map((ml, i) => ml - signalLine[i]);

    const latestMACD = macdLine[macdLine.length - 1];
    const latestSignal = signalLine[signalLine.length - 1];

    return {
        trend: latestMACD > latestSignal ? 'BULLISH' : 'BEARISH',
        strength: Math.abs(latestMACD - latestSignal)
    };
}


function calculateBollingerBands(prices: number[], period = 20, stdDev = 2) {
    if (prices.length < period) return null;
    
    const sma = calculateSMA(prices, period);
    const recentSma = sma[sma.length - 1];

    const stddevValues = [];
    for (let i = period - 1; i < prices.length; i++) {
        const slice = prices.slice(i - (period - 1), i + 1);
        const mean = slice.reduce((a, b) => a + b, 0) / period;
        const sqDiff = slice.map(v => (v - mean) ** 2);
        const variance = sqDiff.reduce((a, b) => a + b, 0) / period;
        stddevValues.push(Math.sqrt(variance));
    }

    const recentStdDev = stddevValues[stddevValues.length - 1];
    const upperBand = recentSma + (recentStdDev * stdDev);
    const lowerBand = recentSma - (recentStdDev * stdDev);
    
    const currentPrice = prices[prices.length - 1];
    let signal: 'OVERBOUGHT' | 'OVERSOLD' | 'NEUTRAL' = 'NEUTRAL';
    if (currentPrice > upperBand) signal = 'OVERBOUGHT';
    if (currentPrice < lowerBand) signal = 'OVERSOLD';

    return { upper: upperBand, middle: recentSma, lower: lowerBand, signal };
}

function calculateMomentum(prices: number[], period = 14) {
    if (prices.length < period) return { trend: 'NEUTRAL', strength: 'WEAK' };
    const currentPrice = prices[prices.length - 1];
    const pastPrice = prices[prices.length - 1 - period];
    const change = currentPrice - pastPrice;

    const volatility = calculateVolatility(prices.slice(-period));
    const normalizedChange = change / volatility;

    let trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    if (normalizedChange > 0.5) trend = 'BULLISH';
    if (normalizedChange < -0.5) trend = 'BEARISH';
    
    let strength: 'STRONG' | 'MEDIUM' | 'WEAK' = 'WEAK';
    if (Math.abs(normalizedChange) > 1.5) strength = 'STRONG';
    else if (Math.abs(normalizedChange) > 0.8) strength = 'MEDIUM';
    
    return { trend, strength };
}

function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((a, b) => a + (b - mean) ** 2, 0) / prices.length;
  return Math.sqrt(variance);
}

function analyzeVolume(candles: Candle[], period = 20) {
    if (candles.length < period) return { signal: 'NORMAL' };
    const recentCandles = candles.slice(-period);
    const volumes = recentCandles.map(c => c.volume);
    const currentVolume = volumes[volumes.length - 1];
    const avgVolume = volumes.slice(0, -1).reduce((a,b) => a+b, 0) / (period-1);

    if (currentVolume > avgVolume * 2) return { signal: 'STRONG' };
    return { signal: 'NORMAL' };
}

function detectCandlestickPatterns(candles: Candle[]) {
    const patterns: string[] = [];
    let signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    
    if (candles.length < 2) return { detected: [], signal: 'NEUTRAL' };

    const [prev, curr] = candles.slice(-2);

    // Bullish Engulfing
    if (curr.close > prev.open && curr.open < prev.close && prev.close < prev.open && curr.close > curr.open) {
        patterns.push('Bullish Engulfing');
        signal = 'BULLISH';
    }
    // Bearish Engulfing
    if (curr.open > prev.close && curr.close < prev.open && prev.close > prev.open && curr.open > curr.close) {
        patterns.push('Bearish Engulfing');
        signal = 'BEARISH';
    }

    // Add more patterns here...

    return { detected: patterns, signal };
}


// ========== MAIN ANALYSIS FUNCTION ==========

export async function analyzeMarket(candles: Candle[], symbol: string, timeframe: string): Promise<any> {
  const closingPrices = candles.map(c => c.close);
  
  if (closingPrices.length < 50) return null; 

  const [rsi, macd, bollinger, momentum, volume, patterns] = await Promise.all([
    calculateRSI(closingPrices),
    calculateMACD(closingPrices),
    calculateBollingerBands(closingPrices),
    calculateMomentum(closingPrices),
    analyzeVolume(candles),
    detectCandlestickPatterns(candles),
  ]);

  if (!macd || !bollinger) return null; // Not enough data

  // Basic trend from moving averages
  const sma20 = calculateSMA(closingPrices, 20).slice(-1)[0];
  const sma50 = calculateSMA(closingPrices, 50).slice(-1)[0];

  const trend = {
    overall: sma20 > sma50 ? 'BULLISH' : 'BEARISH',
    strength: Math.abs(sma20 - sma50)
  };
  
  return {
    symbol,
    timeframe,
    currentPrice: closingPrices[closingPrices.length - 1],
    trend,
    rsi,
    macd,
    bollinger,
    momentum,
    volume,
    patterns
  };
}
