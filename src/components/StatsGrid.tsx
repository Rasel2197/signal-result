import React from 'react';
import { BacktestSummary } from '../types';
import { Award, TrendingUp, TrendingDown, Layers, ShieldAlert, Zap, DollarSign } from 'lucide-react';

interface StatsGridProps {
  summary: BacktestSummary;
  maxMtg?: number;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ summary, maxMtg = 1 }) => {
  const {
    totalSignals,
    directWins,
    mtg1Wins,
    mtg2Wins,
    losses,
    totalWins,
    accuracyRate,
    totalInvested,
    totalReturned,
    netProfit,
    winStreaks,
    lossStreaks,
    avoidedLossesCount,
    filteredAccuracyRate,
    filteredNetProfit,
    protectedCapital,
  } = summary;

  const isNetPositive = netProfit >= 0;
  const isFilteredNetPositive = filteredNetProfit >= 0;

  // Circle dimensions
  const radius = 36;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Accuracy Dual Gauge - Standard vs VIP Rules */}
      <div className="md:col-span-2 bg-[#0d1015] p-5 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xl relative overflow-hidden group">
        <div className="absolute right-0 top-0 w-32 h-32 bg-[#00f294]/5 rounded-full blur-3xl group-hover:bg-[#00f294]/10 transition-all duration-500"></div>
        <div className="z-10 flex-grow text-center sm:text-left">
          <p className="text-white/30 text-[10px] font-mono uppercase tracking-widest mb-1.5">Simulation Accuracy Index</p>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-center sm:justify-start gap-2.5">
              <span className="text-4xl font-extrabold text-[#00f294] tracking-tight font-sans">
                {filteredAccuracyRate}%
              </span>
              <span className="text-[9px] font-mono font-bold uppercase text-[#00f294] px-2 py-0.5 rounded-md bg-[#00f294]/10 border border-[#00f294]/20">
                VIP PROTOCOL
              </span>
            </div>
            <div className="text-xs text-white/50 flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
              <span>Standard Accuracy:</span>
              <span className="font-semibold text-white/80">{accuracyRate}%</span>
            </div>
          </div>
          <p className="text-white/60 text-xs mt-3 leading-relaxed font-sans">
            Processed <span className="text-white font-bold">{totalSignals}</span> inputs. 
            VIP Filter saved <span className="text-[#00f294] font-bold">{avoidedLossesCount}</span> bad losses from ever being executed! 🛡️
          </p>
          <div className="flex justify-center sm:justify-start gap-1.5 items-center mt-3 text-[9.5px] font-mono text-white/30">
            <span className="inline-block w-2.5 h-1 px-1 bg-[#00f294] rounded-sm"></span>
            <span>Rules: Doji, Gaps, Giant Candles, B2B Opposite Trend</span>
          </div>
        </div>

        {/* Both SVG Circle Gauges side-by-side or stacked beautifully */}
        <div className="flex items-center gap-4 z-10 shrink-0">
          {/* Base Gauge */}
          <div className="relative flex items-center justify-center w-20 h-20">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="40" cy="40" r="30" className="stroke-white/[0.04]" strokeWidth="5" fill="transparent" />
              <circle
                cx="40"
                cy="40"
                r="30"
                className="stroke-white/20 transition-all duration-1000 ease-out"
                strokeWidth="5"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 30}
                strokeDashoffset={2 * Math.PI * 30 - (accuracyRate / 100) * (2 * Math.PI * 30)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-[10px] font-bold text-white/50">{accuracyRate}%</span>
              <span className="text-[7px] font-mono text-white/30 uppercase tracking-wider">Base</span>
            </div>
          </div>

          {/* VIP Gauge */}
          <div className="relative flex items-center justify-center w-24 h-24">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="48" cy="48" r="36" className="stroke-[#00f294]/5" strokeWidth="6" fill="transparent" />
              <circle
                cx="48"
                cy="48"
                r="36"
                className="stroke-[#00f294] transition-all duration-1000 ease-out"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (filteredAccuracyRate / 100) * circumference}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <Award className="w-4 h-4 text-[#00f294] animate-pulse mb-0.5" />
              <span className="text-sm font-extrabold text-white">{filteredAccuracyRate}%</span>
              <span className="text-[6.5px] font-mono text-[#00f294] uppercase tracking-wider font-bold">VIP FILTER</span>
            </div>
          </div>
        </div>
      </div>

      {/* Net Profit Card */}
      <div className="bg-[#0d1015] p-5 rounded-2xl border border-white/5 flex flex-col justify-between shadow-xl relative overflow-hidden group">
        <div className={`absolute right-0 top-0 w-24 h-24 rounded-full blur-3xl transition-all duration-500 ${
          isFilteredNetPositive ? 'bg-[#00f294]/5 group-hover:bg-[#00f294]/10' : 'bg-[#ff4d4d]/5 group-hover:bg-[#ff4d4d]/10'
        }`}></div>
        <div className="flex justify-between items-start z-10">
          <div>
            <p className="text-white/30 text-xs font-mono uppercase tracking-widest">VIP Net Return</p>
            <h3 className={`text-2xl font-bold tracking-tight mt-2 flex items-center font-sans ${
              isFilteredNetPositive ? 'text-[#00f294]' : 'text-[#ff4d4d]'
            }`}>
              {isFilteredNetPositive ? '+' : ''}${filteredNetProfit.toLocaleString()}
            </h3>
            <p className="text-[9.5px] text-white/40 font-mono mt-1">
              Base Profit: <span className={isNetPositive ? 'text-[#00f294]/80' : 'text-[#ff4d4d]/80'}>{isNetPositive ? '+' : ''}${netProfit}</span>
            </p>
          </div>
          <div className={`p-2 rounded-xl border ${
            isFilteredNetPositive ? 'bg-[#00f294]/10 border-[#00f294]/20 text-[#00f294]' : 'bg-[#ff4d4d]/10 border-[#ff4d4d]/20 text-[#ff4d4d]'
          }`}>
            {isFilteredNetPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          </div>
        </div>

        <div className="pt-3 border-t border-white/5 mt-4 flex flex-col gap-1 text-[10px] font-mono z-10">
          <div className="flex justify-between text-white/40">
            <span>Preserved Capital:</span>
            <span className="text-[#00f294] font-semibold">+${protectedCapital} 🛡️</span>
          </div>
          <div className="flex justify-between text-white/30 text-[9px]">
            <span>Net position if high-risk logs avoided.</span>
          </div>
        </div>
      </div>

      {/* Streaks Card */}
      <div className="bg-[#0d1015] p-5 rounded-2xl border border-white/5 flex flex-col justify-between shadow-xl relative overflow-hidden group">
        <div className="absolute right-0 top-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-3xl group-hover:bg-yellow-500/10 transition-all duration-500"></div>
        <div className="flex justify-between items-start z-10">
          <div>
            <p className="text-white/30 text-xs font-mono uppercase tracking-widest">Trading Streaks</p>
            <h3 className="text-2xl font-bold tracking-tight text-white mt-2 flex items-baseline gap-1 font-sans">
              {winStreaks} <span className="text-xs text-white/40 font-mono">Max Wins</span>
            </h3>
          </div>
          <div className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
            <Zap className="w-5 h-5" />
          </div>
        </div>
        <div className="pt-4 border-t border-white/5 mt-4 flex items-center justify-between text-xs font-mono z-10">
          <div className="text-white/40 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00f294]"></span>
            <span>Win Streak: <strong className="text-[#00f294]">{winStreaks}</strong></span>
          </div>
          <div className="text-white/40 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff4d4d]"></span>
            <span>Loss Streak: <strong className="text-[#ff4d4d]">{lossStreaks}</strong></span>
          </div>
        </div>
      </div>

      {/* Breakdowns Row (Direct, MTG1, MTG2) */}
      <div className={`md:col-span-4 grid gap-3 ${
        maxMtg === 2 
          ? 'grid-cols-2 sm:grid-cols-4' 
          : maxMtg === 1 
            ? 'grid-cols-1 sm:grid-cols-3' 
            : 'grid-cols-1 sm:grid-cols-2'
      }`}>
        <div className="bg-[#0d1015]/80 p-3.5 rounded-xl border border-white/5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">Direct Trade Wins</div>
          <div className="flex justify-between items-baseline mt-1.5">
            <span className="text-lg font-bold text-white/80">{directWins}</span>
            <span className="text-[10px] font-mono text-white/30">
              ({totalSignals > 0 ? ((directWins / totalSignals) * 100).toFixed(0) : 0}%)
            </span>
          </div>
          <div className="w-full bg-white/[0.04] h-1 mt-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-[#00f294] h-full rounded-full transition-all duration-500" 
              style={{ width: `${totalSignals > 0 ? (directWins / totalSignals) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        {maxMtg >= 1 && (
          <div className="bg-[#0d1015]/80 p-3.5 rounded-xl border border-white/5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#00f294]/60">Martingale 1 Wins</div>
            <div className="flex justify-between items-baseline mt-1.5">
              <span className="text-lg font-bold text-[#00f294]">{mtg1Wins}</span>
              <span className="text-[10px] font-mono text-white/30">
                ({totalSignals > 0 ? ((mtg1Wins / totalSignals) * 100).toFixed(0) : 0}%)
              </span>
            </div>
            <div className="w-full bg-white/[0.04] h-1 mt-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-[#00f294]/80 h-full rounded-full transition-all duration-500" 
                style={{ width: `${totalSignals > 0 ? (mtg1Wins / totalSignals) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        )}

        {maxMtg === 2 && (
          <div className="bg-[#0d1015]/80 p-3.5 rounded-xl border border-white/5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#00f294]/40">Martingale 2 Wins</div>
            <div className="flex justify-between items-baseline mt-1.5">
              <span className="text-lg font-bold text-[#00f294]/85">{mtg2Wins}</span>
              <span className="text-[10px] font-mono text-white/30">
                ({totalSignals > 0 ? ((mtg2Wins / totalSignals) * 100).toFixed(0) : 0}%)
              </span>
            </div>
            <div className="w-full bg-white/[0.04] h-1 mt-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-[#00f294]/60 h-full rounded-full transition-all duration-500" 
                style={{ width: `${totalSignals > 0 ? (mtg2Wins / totalSignals) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="bg-[#0d1015]/80 p-3.5 rounded-xl border border-white/5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#ff4d4d]/60">Total Losses</div>
          <div className="flex justify-between items-baseline mt-1.5">
            <span className="text-lg font-bold text-[#ff4d4d]">{losses}</span>
            <span className="text-[10px] font-mono text-white/30">
              ({totalSignals > 0 ? ((losses / totalSignals) * 100).toFixed(0) : 0}%)
            </span>
          </div>
          <div className="w-full bg-white/[0.04] h-1 mt-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-[#ff4d4d] h-full rounded-full transition-all duration-500" 
              style={{ width: `${totalSignals > 0 ? (losses / totalSignals) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};
