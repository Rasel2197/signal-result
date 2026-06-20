import { Signal, Candle, BacktestResult, BacktestSettings, BacktestSummary, OutcomeType } from '../types';
import { generateCandle, timeToMinuteIndex, hashString } from './marketGenerator';

interface RuleCheckResult {
  violatedRules: string[];
  isPreCandleStrong: boolean;
}

/**
 * Evaluates the 5 "Advance Signal Rules" from the active manual trading protocol rules.
 */
export function checkAdvanceRules(
  signal: Signal,
  settings: BacktestSettings,
  targetMinute: number
): RuleCheckResult {
  const { payoutRate, seedDate } = settings;
  const violatedRules: string[] = [];
  
  // Generate preceding candles T-1, T-2, T-3, T-4
  const candle_T1 = generateCandle(signal.pair, seedDate, (targetMinute - 1 + 1440) % 1440);
  const candle_T2 = generateCandle(signal.pair, seedDate, (targetMinute - 2 + 1440) % 1440);
  const candle_T3 = generateCandle(signal.pair, seedDate, (targetMinute - 3 + 1440) % 1440);
  const candle_T4 = generateCandle(signal.pair, seedDate, (targetMinute - 4 + 1440) % 1440);

  // 1. Avoid Market Below 78% Payout rate
  if (payoutRate < 78) {
    violatedRules.push("Low Payout (<78%)");
  }

  // 2. Avoid Doji (body is tiny compared to wick range or absolute size is near null)
  const bodySize_T1 = Math.abs(candle_T1.close - candle_T1.open);
  const wickRange_T1 = candle_T1.high - candle_T1.low;
  const isDoji_T1 = candle_T1.isDoji || (wickRange_T1 > 0 && bodySize_T1 / wickRange_T1 < 0.1) || bodySize_T1 < 0.000002;
  if (isDoji_T1) {
    violatedRules.push("Doji Pre-candle ⚠️");
  }

  // 3. Avoid Gap Up/Down (deterministic gap factor mapped from timestamp)
  const gapSeed = hashString(`${signal.pair}_${seedDate}_gap_${targetMinute - 1}`);
  const isGap = (gapSeed % 100) < (settings.otcMode ? 15 : 8);
  if (isGap) {
    violatedRules.push("Gap Up/Down 📸");
  }

  // 4. Avoid Big Candle (pre-candle T-1 exceeds average previous candle bodies by 1.8x)
  const bodySize_T2 = Math.abs(candle_T2.close - candle_T2.open);
  const bodySize_T3 = Math.abs(candle_T3.close - candle_T3.open);
  const bodySize_T4 = Math.abs(candle_T4.close - candle_T4.open);
  const avgPrevousBody = (bodySize_T2 + bodySize_T3 + bodySize_T4) / 3;
  
  const isBigCandle_T1 = bodySize_T1 > avgPrevousBody * 1.8 && bodySize_T1 > (candle_T1.high - candle_T1.low) * 0.5 && bodySize_T1 > 0.00001;
  if (isBigCandle_T1) {
    violatedRules.push("Big Candle Alert ❗");
  }

  // 5. Avoid If B2B (Back-to-Back) 3-4 Candle Opposite Direction
  const isCall = signal.direction === 'CALL';
  const opposite_T1 = isCall ? candle_T1.isBearish : candle_T1.isBullish;
  const opposite_T2 = isCall ? candle_T2.isBearish : candle_T2.isBullish;
  const opposite_T3 = isCall ? candle_T3.isBearish : candle_T3.isBullish;
  const opposite_T4 = isCall ? candle_T4.isBearish : candle_T4.isBullish;

  if (opposite_T1 && opposite_T2 && opposite_T3) {
    const oppCount = opposite_T4 ? 4 : 3;
    violatedRules.push(`B2B ${oppCount} Opp. Candles 🟢`);
  }

  // Pre-candle is STRONG if body size is 1.3x average and has considerable range
  const isPreCandleStrong = bodySize_T1 > avgPrevousBody * 1.3 && bodySize_T1 > 0.000005;

  return {
    violatedRules,
    isPreCandleStrong
  };
}

/**
 * Runs backtest on a single signal based on provided settings
 */
export function backtestSingleSignal(
  signal: Signal,
  settings: BacktestSettings
): BacktestResult {
  const { stake, payoutRate, maxMtg, mtgMultiplier, seedDate } = settings;
  const targetMinute = timeToMinuteIndex(signal.time);
  const payoutDecimal = payoutRate / 100;
  
  const candlesChecked: Candle[] = [];
  let outcome: OutcomeType = 'LOSS';
  let mtgLevelUsed: 0 | 1 | 2 = 0;
  
  // Calculate stakes per level
  const levelStakes = [
    stake,
    Number((stake * mtgMultiplier).toFixed(2)),
    Number((stake * mtgMultiplier * mtgMultiplier).toFixed(2))
  ];
  
  let currentMtg = 0;
  let won = false;
  
  while (currentMtg <= maxMtg && !won) {
    const candleIndex = (targetMinute + currentMtg) % 1440;
    const candle = generateCandle(signal.pair, seedDate, candleIndex);
    candlesChecked.push(candle);
    
    const isBullish = candle.isBullish;
    const isBearish = candle.isBearish;
    
    if (signal.direction === 'CALL') {
      won = isBullish;
    } else {
      won = isBearish;
    }
    
    if (won) {
      if (currentMtg === 0) outcome = 'DIRECT_WIN';
      else if (currentMtg === 1) outcome = 'MTG1_WIN';
      else if (currentMtg === 2) outcome = 'MTG2_WIN';
      mtgLevelUsed = currentMtg as 0 | 1 | 2;
      break;
    }
    
    if (currentMtg < maxMtg) {
      currentMtg++;
    } else {
      outcome = 'LOSS';
      mtgLevelUsed = maxMtg as 0 | 1 | 2;
      break;
    }
  }
  
  // Financial calculation
  const stakePerLevel: number[] = [];
  const payoutPerLevel: number[] = [];
  let spent = 0;
  
  for (let i = 0; i <= mtgLevelUsed; i++) {
    spent += levelStakes[i];
    stakePerLevel.push(levelStakes[i]);
  }
  
  let netProfit = 0;
  if (won) {
    const winLevelStake = levelStakes[mtgLevelUsed];
    const grossReturn = winLevelStake * (1 + payoutDecimal);
    netProfit = Number((grossReturn - spent).toFixed(2));
    
    for (let i = 0; i < mtgLevelUsed; i++) {
      payoutPerLevel.push(0);
    }
    payoutPerLevel.push(Number(grossReturn.toFixed(2)));
  } else {
    netProfit = Number((-spent).toFixed(2));
    for (let i = 0; i <= mtgLevelUsed; i++) {
      payoutPerLevel.push(0);
    }
  }

  // Evaluate the Advance Rules
  const ruleChecks = checkAdvanceRules(signal, settings, targetMinute);
  const isLoss = outcome === 'LOSS';
  
  // A signal is AVOIDED only if it ends in a loss, but violates advanced rules
  const isAvoided = isLoss && ruleChecks.violatedRules.length > 0;
  
  return {
    id: `res_${signal.id}`,
    signal,
    candles: candlesChecked,
    outcome,
    mtgLevelUsed,
    payoutRate,
    stakePerLevel,
    payoutPerLevel,
    netProfit,
    violatedRules: ruleChecks.violatedRules,
    isAvoided
  };
}

/**
 * Runs a backtest suite on a list of Signals and produces an aggregated Summary
 */
export function runBacktestSuite(
  signals: Signal[],
  settings: BacktestSettings
): { results: BacktestResult[]; summary: BacktestSummary } {
  const results: BacktestResult[] = [];
  
  const sortedSignals = [...signals].sort((a, b) => {
    return timeToMinuteIndex(a.time) - timeToMinuteIndex(b.time);
  });
  
  sortedSignals.forEach(signal => {
    results.push(backtestSingleSignal(signal, settings));
  });
  
  let directWins = 0;
  let mtg1Wins = 0;
  let mtg2Wins = 0;
  let losses = 0;
  let avoidedLossesCount = 0;
  let protectedCapital = 0;
  let totalInvested = 0;
  let totalReturned = 0;
  let netProfit = 0;
  
  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let currentWinStreak = 0;
  let currentLossStreak = 0;
  
  results.forEach(res => {
    totalInvested += res.stakePerLevel.reduce((a, b) => a + b, 0);
    
    if (res.outcome === 'DIRECT_WIN') {
      directWins++;
      totalReturned += res.payoutPerLevel[res.payoutPerLevel.length - 1];
      
      currentWinStreak++;
      if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
      currentLossStreak = 0;
    } else if (res.outcome === 'MTG1_WIN') {
      mtg1Wins++;
      totalReturned += res.payoutPerLevel[res.payoutPerLevel.length - 1];
      
      currentWinStreak++;
      if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
      currentLossStreak = 0;
    } else if (res.outcome === 'MTG2_WIN') {
      mtg2Wins++;
      totalReturned += res.payoutPerLevel[res.payoutPerLevel.length - 1];
      
      currentWinStreak++;
      if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
      currentLossStreak = 0;
    } else {
      losses++;
      if (res.isAvoided) {
        avoidedLossesCount++;
        protectedCapital += Math.abs(res.netProfit);
      }
      
      currentLossStreak++;
      if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
      currentWinStreak = 0;
    }
    
    netProfit += res.netProfit;
  });
  
  if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
  if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
  
  const totalWins = directWins + mtg1Wins + mtg2Wins;
  const totalSignals = sortedSignals.length;
  const accuracyRate = totalSignals > 0 ? Number(((totalWins / totalSignals) * 100).toFixed(1)) : 0;
  
  // Calculate Filtered Accuracy: Excluding losses that violated rules and could thus be ignored (avoided)
  const filteredTotal = totalSignals - avoidedLossesCount;
  const filteredAccuracyRate = filteredTotal > 0 ? Number(((totalWins / filteredTotal) * 100).toFixed(1)) : 0;
  const filteredNetProfit = Number((netProfit + protectedCapital).toFixed(2));
  
  return {
    results,
    summary: {
      totalSignals,
      directWins,
      mtg1Wins,
      mtg2Wins,
      losses,
      totalWins,
      accuracyRate,
      totalInvested: Number(totalInvested.toFixed(2)),
      totalReturned: Number(totalReturned.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
      winStreaks: maxWinStreak,
      lossStreaks: maxLossStreak,
      avoidedLossesCount,
      filteredAccuracyRate,
      filteredNetProfit,
      protectedCapital: Number(protectedCapital.toFixed(2))
    }
  };
}
