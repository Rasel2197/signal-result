import React from 'react';
import { Candle, Signal } from '../types';
import { generateCandlesForSignal } from '../utils/marketGenerator';

interface MarketChartProps {
  signal: Signal;
  dateSeed: string;
  evaluatedCandles: Candle[];
}

export const MarketChart: React.FC<MarketChartProps> = ({ signal, dateSeed, evaluatedCandles }) => {
  // We'll generate 8 candles before the signal time, and 3 after to construct a nice timeline
  const countBefore = 8;
  const countAfter = 4;
  const candles = React.useMemo(() => {
    return generateCandlesForSignal(signal.pair, dateSeed, signal.time, countBefore, countAfter);
  }, [signal.pair, dateSeed, signal.time]);

  // Find price bounds for mapping to SVG coordinates
  const prices = candles.flatMap(c => [c.high, c.low, c.open, c.close]);
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const priceRange = maxPrice - minPrice || 0.0001;
  const padding = priceRange * 0.1; // 10% padding top and bottom

  const yMin = minPrice - padding;
  const yMax = maxPrice + padding;
  const yRange = yMax - yMin;

  // Chart Dimensions
  const chartHeight = 180;
  const chartWidth = 540;
  const candleWidth = 24;
  const spacing = (chartWidth - 40) / candles.length;

  // Helper to map price to Y coordinate
  const mapY = (price: number) => {
    return chartHeight - ((price - yMin) / yRange) * chartHeight;
  };

  // Identify index of target trade time candle
  const targetTimeStr = signal.time;
  const targetIndex = candles.findIndex(c => c.time === targetTimeStr);

  return (
    <div className="bg-[#06080a] p-4 rounded-xl border border-white/5 shadow-inner select-none">
      <div className="flex justify-between items-center mb-3">
        <div className="text-xs font-mono text-white/40 flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#00f294] animate-pulse"></span>
          <span>Asset: <strong className="text-white/80">{signal.pair}</strong></span>
          <span className="text-white/10">|</span>
          <span>Date: <strong className="text-white/80">{dateSeed}</strong></span>
        </div>
        <div className="flex gap-4 text-[10px] font-mono">
          <div className="flex items-center gap-1.5 text-[#00f294]">
            <span className="w-2.5 h-2.5 bg-[#00f294]/20 border border-[#00f294] rounded-sm"></span>
            <span>Bullish Candle</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#ff4d4d]">
            <span className="w-2.5 h-2.5 bg-[#ff4d4d]/20 border border-[#ff4d4d] rounded-sm"></span>
            <span>Bearish Candle</span>
          </div>
        </div>
      </div>

      <div className="relative w-full overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight + 30}`}
          width="100%"
          height={chartHeight + 35}
          className="min-w-[500px]"
        >
          {/* horizontal guidelines */}
          {[0.25, 0.5, 0.75].map((ratio, idx) => {
            const priceVal = yMax - ratio * yRange;
            const yCoord = ratio * chartHeight;
            return (
              <g key={idx}>
                <line
                  x1={0}
                  y1={yCoord}
                  x2={chartWidth}
                  y2={yCoord}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeDasharray="4,4"
                  strokeWidth={0.5}
                />
                <text
                  x={chartWidth - 5}
                  y={yCoord - 4}
                  fill="rgba(255, 255, 255, 0.3)"
                  fontSize={8}
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {priceVal.toFixed(signal.pair.includes('JPY') || signal.pair.includes('INR') || signal.pair.includes('BRL') ? 2 : 5)}
                </text>
              </g>
            );
          })}

          {/* Render target vertical trigger dashed line */}
          {targetIndex !== -1 && (
            <line
              x1={targetIndex * spacing + spacing / 2 + 15}
              y1={0}
              x2={targetIndex * spacing + spacing / 2 + 15}
              y2={chartHeight + 10}
              stroke="#ffffff"
              strokeDasharray="3,3"
              strokeWidth={1}
              opacity={0.15}
            />
          )}

          {/* Render Candles */}
          {candles.map((candle, idx) => {
            const x = idx * spacing + spacing / 2 + 15;
            const yOpen = mapY(candle.open);
            const yClose = mapY(candle.close);
            const yHigh = mapY(candle.high);
            const yLow = mapY(candle.low);

            const isBullish = candle.isBullish;
            const isTarget = candle.time === targetTimeStr;
            
            // Check if this candle is evaluated in the trade sequence
            const evalIndex = evaluatedCandles.findIndex(ec => ec.time === candle.time);
            const isEvaluated = evalIndex !== -1;
            
            // Color schemes
            const strokeColor = isBullish ? '#00f294' : '#ff4d4d';
            const fillGradient = isBullish ? 'rgba(0, 242, 148, 0.25)' : 'rgba(255, 77, 77, 0.25)';

            return (
              <g key={idx} className="cursor-pointer group">
                <title>
                  {`Time: ${candle.time}\nOpen: ${candle.open}\nClose: ${candle.close}\nHigh: ${candle.high}\nLow: ${candle.low}\nType: ${isBullish ? 'BULL' : 'BEAR'}`}
                </title>

                {/* Draw Wick */}
                <line
                  x1={x}
                  y1={yHigh}
                  x2={x}
                  y2={yLow}
                  stroke={strokeColor}
                  strokeWidth={1.5}
                />

                {/* Draw Body */}
                <rect
                  x={x - candleWidth / 2}
                  y={Math.min(yOpen, yClose)}
                  width={candleWidth}
                  height={Math.max(Math.abs(yOpen - yClose), 2)} // ensure at least 2px height
                  fill={fillGradient}
                  stroke={strokeColor}
                  strokeWidth={1}
                  rx={1.5}
                  className="transition-all duration-250 group-hover:brightness-125"
                />

                {/* Highlights for evaluated / active candles */}
                {isEvaluated && (
                  <rect
                    x={x - (candleWidth / 2 + 4)}
                    y={Math.min(yOpen, yClose) - 4}
                    width={candleWidth + 8}
                    height={Math.max(Math.abs(yOpen - yClose), 2) + 8}
                    fill="transparent"
                    stroke={signal.direction === 'CALL' ? '#00f294' : '#ff4d4d'}
                    strokeDasharray="2,2"
                    strokeWidth={1}
                    className="animate-pulse"
                  />
                )}

                {/* Signal Badge Label above candle if target */}
                {isTarget && (
                  <g>
                    {/* Background label box */}
                    <rect
                      x={x - 22}
                      y={mapY(candle.high) - 24}
                      width={44}
                      height={16}
                      fill={signal.direction === 'CALL' ? 'rgba(0, 242, 148, 0.15)' : 'rgba(255, 77, 77, 0.15)'}
                      stroke={signal.direction === 'CALL' ? '#00f294' : '#ff4d4d'}
                      strokeWidth={1}
                      rx={3}
                    />
                    <text
                      x={x}
                      y={mapY(candle.high) - 13}
                      fontSize={8}
                      fontWeight="bold"
                      fontFamily="monospace"
                      fill={signal.direction === 'CALL' ? '#00f294' : '#ff4d4d'}
                      textAnchor="middle"
                    >
                      {signal.direction}
                    </text>
                    {/* Drawn indicator line down to candle top */}
                    <path
                      d={`M ${x} ${mapY(candle.high) - 8} L ${x} ${mapY(candle.high) - 1}`}
                      stroke={signal.direction === 'CALL' ? '#00f294' : '#ff4d4d'}
                      strokeWidth={1}
                    />
                  </g>
                )}

                {/* Subtext marker for target / MTG elements */}
                {isEvaluated && (
                  <g>
                    <rect
                      x={x - 16}
                      y={chartHeight + 1}
                      width={32}
                      height={12}
                      fill="#06080a"
                      stroke="rgba(255, 255, 255, 0.05)"
                      rx={3}
                    />
                    <text
                      x={x}
                      y={chartHeight + 9}
                      fontSize={7}
                      fontWeight="600"
                      fontFamily="monospace"
                      fill="rgba(255, 255, 255, 0.5)"
                      textAnchor="middle"
                    >
                      {evalIndex === 0 ? 'ENTRY' : `MTG${evalIndex}`}
                    </text>
                  </g>
                )}

                {/* Time string on X-Axis */}
                <text
                  x={x}
                  y={chartHeight + 25}
                  fontSize={8}
                  fontFamily="monospace"
                  fill={isTarget ? '#FFFFFF' : 'rgba(255, 255, 255, 0.25)'}
                  fontWeight={isTarget ? 'bold' : 'normal'}
                  textAnchor="middle"
                >
                  {candle.time}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      
      {/* Detail panel footer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-3 border-t border-white/5 text-center">
        {evaluatedCandles.map((ec, i) => {
          const isWinner = signal.direction === 'CALL' ? ec.isBullish : ec.isBearish;
          return (
            <div key={i} className="text-[11px] font-mono bg-[#06080a] p-2 rounded border border-white/5">
              <div className="text-white/30 text-xs font-semibold">
                {i === 0 ? 'Direct Trade' : `Martingale ${i}`}
              </div>
              <div className="text-white/60 mt-1">
                Time: {ec.time}
              </div>
              <div className="mt-1 flex items-center justify-center gap-1.5 font-bold">
                <span className={isWinner ? 'text-[#00f294]' : 'text-[#ff4d4d]'}>
                  {ec.open} → {ec.close}
                </span>
                <span className={`inline-block px-1 rounded text-[9px] ${
                  isWinner ? 'bg-[#00f294]/10 text-[#00f294] border border-[#00f294]/20' : 'bg-[#ff4d4d]/10 text-[#ff4d4d] border border-[#ff4d4d]/20'
                }`}>
                  {isWinner ? 'WIN' : 'LOSS'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
