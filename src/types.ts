export interface Signal {
  id: string;
  time: string; // "HH:MM" format
  pair: string; // e.g., "EUR/USD", "EUR/USD-OTC"
  direction: 'CALL' | 'PUT';
  rawText: string;
}

export interface Candle {
  time: string; // "HH:MM" format
  open: number;
  close: number;
  high: number;
  low: number;
  isBullish: boolean;
  isBearish: boolean;
  isDoji: boolean;
}

export type OutcomeType = 'DIRECT_WIN' | 'MTG1_WIN' | 'MTG2_WIN' | 'LOSS';

export interface BacktestResult {
  id: string;
  signal: Signal;
  candles: Candle[]; // index 0 = trade time, index 1 = MTG1 (if needed), index 2 = MTG2 (if needed)
  outcome: OutcomeType;
  mtgLevelUsed: 0 | 1 | 2;
  payoutRate: number; // e.g. 0.85 (85%)
  stakePerLevel: number[]; // amount bet per level, e.g. [10, 20, 40]
  payoutPerLevel: number[]; // gross profit returned per level if won
  netProfit: number; // returned - invested
  violatedRules?: string[]; // rules violated, e.g. ["Doji Candle", "B2B Trend", "Big Candle"]
  isAvoided?: boolean; // true if it lost but violated rules (meaning we avoid it)
}

export interface BacktestSummary {
  totalSignals: number;
  directWins: number;
  mtg1Wins: number;
  mtg2Wins: number;
  losses: number;
  totalWins: number;
  accuracyRate: number; // (wins / total) * 100
  totalInvested: number;
  totalReturned: number;
  netProfit: number;
  winStreaks: number;
  lossStreaks: number;
  avoidedLossesCount: number; // number of losses that were prevented by smart rules
  filteredAccuracyRate: number; // accuracy calculated Excluding the avoided losses
  filteredNetProfit: number; // net profit if we didn't take the avoided losses
  protectedCapital: number; // capital saved from being spent on avoided losses
}

export interface BacktestSettings {
  stake: number; // initial trade stake, e.g., 10$
  payoutRate: number; // payout percentage, e.g., 85 (meaning 85%)
  maxMtg: 0 | 1 | 2; // Martingale depth
  mtgMultiplier: number; // Multiplier, e.g., 2.0 or 2.2
  slippageMultiplier: number; // Factor for doji / close wins
  otcMode: boolean; // OTC mode increases volatility and payout
  seedDate: string; // Consistent date to seed candles (default: "2026-06-19")
}

export interface AssetPairConfig {
  symbol: string;
  name: string;
  isOTC: boolean;
  basePrice: number;
  volatility: number;
}
