"use client";

import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid, Cell } from 'recharts';

interface PriceHistoryPoint {
  time: number | string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  value?: number;
}

interface SignalChartProps {
  data: PriceHistoryPoint[];
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
}

// Custom Candlestick Shape with wicks
const Candlestick = (props: any) => {
  const { x, y, width, height, low, high, open, close } = props;
  const isGrowing = close >= open;
  const color = isGrowing ? '#16a34a' : '#dc2626';
  
  // The y prop is the top of the bar, so we need to calculate the actual y positions based on price
  const y_max = y;
  const y_min = y + height;
  const price_max = Math.max(open, close);
  const price_min = Math.min(open, close);
  
  const y_high = y_max + ((price_max - high) / (price_max - price_min)) * height;
  const y_low = y_max + ((price_max - low) / (price_max - price_min)) * height;
  
  const y_body_top = y_max + ((price_max - Math.max(open, close)) / (price_max - price_min)) * height;
  const y_body_bottom = y_max + ((price_max - Math.min(open, close)) / (price_max - price_min)) * height;
  const body_height = y_body_bottom - y_body_top;

  return (
    <g stroke={color} fill={isGrowing ? color : 'none'} strokeWidth="1">
      {/* Wick */}
      <path d={`M ${x + width / 2},${y_high} L ${x + width / 2},${y_low}`} />
      {/* Body */}
      <rect x={x} y={y_body_top} width={width} height={body_height} />
    </g>
  );
};


export function SignalChart({ data, entryPrice, takeProfit, stopLoss }: SignalChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] w-full bg-slate-100 rounded-md flex items-center justify-center text-sm text-slate-600">
        No price data available
      </div>
    );
  }

  const chartData = data.map((point) => {
    const timeValue = typeof point.time === 'string' 
      ? new Date(point.time).getTime() 
      : point.time;
    
    const closePrice = point.close ?? point.value ?? 0;
    
    const candle = {
      time: timeValue,
      open: point.open ?? closePrice,
      high: point.high ?? closePrice,
      low: point.low ?? closePrice,
      close: closePrice,
      // For the bar chart, we need a range for the body
      body: [point.open, point.close],
      formattedTime: new Date(timeValue).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      shortTime: new Date(timeValue).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    return candle;
  });

  chartData.sort((a, b) => a.time - b.time);

  const allPrices = chartData.flatMap(d => [d.high, d.low]);
  const minPrice = Math.min(...allPrices, stopLoss);
  const maxPrice = Math.max(...allPrices, takeProfit);
  const padding = (maxPrice - minPrice) * 0.15;
  const yDomain: [number, number] = [
    Math.max(0, minPrice - padding), 
    maxPrice + padding
  ];

  const currentPrice = chartData[chartData.length - 1]?.close || entryPrice;
  const profitLoss = ((currentPrice - entryPrice) / entryPrice) * 100;
  const profitLossColor = profitLoss >= 0 ? '#16a34a' : '#dc2626';
  
  const distanceToSL = ((stopLoss - entryPrice) / entryPrice) * 100;
  const distanceToTP = ((takeProfit - entryPrice) / entryPrice) * 100;
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPositive = data.close >= data.open;
      const change = ((data.close - data.open) / data.open) * 100;
      
      return (
        <div className="bg-background border-2 border-border rounded-lg p-3 shadow-xl text-sm">
           <div className="font-bold text-foreground mb-2 border-b pb-1">{data.formattedTime}</div>
           <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <span className="text-muted-foreground">Open:</span>
              <span className="font-mono text-right font-semibold">${data.open.toFixed(4)}</span>
              
              <span className="text-muted-foreground">High:</span>
              <span className="font-mono text-right font-semibold text-green-600">${data.high.toFixed(4)}</span>
              
              <span className="text-muted-foreground">Low:</span>
              <span className="font-mono text-right font-semibold text-red-600">${data.low.toFixed(4)}</span>
              
              <span className="text-muted-foreground">Close:</span>
              <span className="font-mono text-right font-semibold">${data.close.toFixed(4)}</span>
           </div>
           <div className="mt-2 pt-2 border-t">
             <span className="text-muted-foreground">Change:</span>
             <span className={`font-mono ml-2 font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
               {isPositive ? '+' : ''}{change.toFixed(2)}%
             </span>
           </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full space-y-3 p-4 bg-background rounded-lg border">
      <div className="flex justify-between items-center pb-3 border-b-2">
        <div>
          <div className="text-xs text-muted-foreground mb-1 font-medium">Current Price</div>
          <div className="text-2xl font-bold text-foreground">${currentPrice.toFixed(4)}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground mb-1 font-medium">P&L</div>
          <div className={`text-2xl font-bold`} style={{ color: profitLossColor }}>
            {profitLoss >= 0 ? '+' : ''}{profitLoss.toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="h-[450px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={chartData} 
            margin={{ top: 20, right: 90, left: 10, bottom: 50 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              vertical={false}
            />
            
            <XAxis
              dataKey="shortTime"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              angle={-35}
              textAnchor="end"
              height={80}
              tickMargin={8}
            />
            
            <YAxis
              domain={yDomain}
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickFormatter={(value) => `$${Number(value).toFixed(2)}`}
              width={70}
              tickMargin={5}
              scale="linear"
            />

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1 }} />
            
            {/* Candlesticks drawn with a Bar component */}
            <Bar dataKey="body" isAnimationActive={false}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.close >= entry.open ? '#16a34a' : '#dc2626'} />
              ))}
            </Bar>
            
            {/* Wicks drawn as a Line component */}
            <Line type="linear" dataKey={d => [d.high, d.low]} stroke="#6b7280" dot={false} isAnimationActive={false} />


            {/* Take Profit Line */}
            <ReferenceLine
              y={takeProfit}
              stroke="#16a34a"
              strokeWidth={2.5}
              strokeDasharray="8 4"
              label={{
                value: `TP: $${takeProfit.toFixed(4)} (+${distanceToTP.toFixed(1)}%)`,
                position: "right",
                fill: '#16a34a',
                fontSize: 12,
                fontWeight: 700,
                offset: 5
              }}
            />
            
            {/* Entry Line */}
            <ReferenceLine
              y={entryPrice}
              stroke="hsl(var(--foreground))"
              strokeWidth={2.5}
              strokeDasharray="4 4"
              label={{
                value: `Entry: $${entryPrice.toFixed(4)}`,
                position: "right",
                fill: 'hsl(var(--foreground))',
                fontSize: 12,
                fontWeight: 700,
                offset: 5
              }}
            />
            
            {/* Stop Loss Line */}
            <ReferenceLine
              y={stopLoss}
              stroke="#dc2626"
              strokeWidth={2.5}
              strokeDasharray="8 4"
              label={{
                value: `SL: $${stopLoss.toFixed(4)} (${distanceToSL.toFixed(1)}%)`,
                position: "right",
                fill: '#dc2626',
                fontSize: 12,
                fontWeight: 700,
                offset: 5
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-3 border-t-2">
        <div className="text-center p-3 bg-red-500/10 rounded-lg border-2 border-red-500/20">
          <div className="text-xs text-red-600 dark:text-red-400 font-semibold mb-1">Stop Loss</div>
          <div className="text-lg font-bold text-red-600 dark:text-red-400">${stopLoss.toFixed(4)}</div>
          <div className="text-xs text-red-600 dark:text-red-400 mt-1 font-semibold">
            {distanceToSL.toFixed(2)}%
          </div>
        </div>
        
        <div className="text-center p-3 bg-secondary rounded-lg border-2">
          <div className="text-xs text-muted-foreground font-semibold mb-1">Entry Price</div>
          <div className="text-lg font-bold text-foreground">${entryPrice.toFixed(4)}</div>
          <div className="text-xs text-muted-foreground mt-1 font-medium">Base price</div>
        </div>
        
        <div className="text-center p-3 bg-green-500/10 rounded-lg border-2 border-green-500/20">
          <div className="text-xs text-green-600 dark:text-green-400 font-semibold mb-1">Take Profit</div>
          <div className="text-lg font-bold text-green-600 dark:text-green-400">${takeProfit.toFixed(4)}</div>
          <div className="text-xs text-green-600 dark:text-green-400 mt-1 font-semibold">
            +{distanceToTP.toFixed(2)}%
          </div>
        </div>
      </div>

    </div>
  );
}
