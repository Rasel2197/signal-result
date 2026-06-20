import { Candle, AssetPairConfig } from '../types';

// Simple FNV-1a or similar string hashing function to produce a seed
export function hashString(str: string): number {
  let hash = 1540483477;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash ^= char;
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

// Seeded PRNG
export class SeededRandom {
  private state: number;

  constructor(seedStr: string) {
    this.state = hashString(seedStr) || 123456789;
  }

  // Float [0, 1)
  next(): number {
    this.state = Math.imul(this.state, 48271) % 2147483647;
    return (this.state - 1) / 2147483646;
  }

  // Range [min, max]
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}

export const ASSET_PAIRS: Record<string, AssetPairConfig> = {
  'EUR/USD': { symbol: 'EUR/USD', name: 'Euro / US Dollar', isOTC: false, basePrice: 1.08250, volatility: 0.00012 },
  'GBP/USD': { symbol: 'GBP/USD', name: 'Great Britain Pound / US Dollar', isOTC: false, basePrice: 1.27400, volatility: 0.00015 },
  'USD/JPY': { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', isOTC: false, basePrice: 156.400, volatility: 0.02400 },
  'EUR/GBP': { symbol: 'EUR/GBP', name: 'Euro / Great Britain Pound', isOTC: false, basePrice: 0.85200, volatility: 0.00008 },
  'GBP/JPY': { symbol: 'GBP/JPY', name: 'Great Britain Pound / Japanese Yen', isOTC: false, basePrice: 198.500, volatility: 0.03800 },
  'AUD/USD': { symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', isOTC: false, basePrice: 0.66500, volatility: 0.00010 },
  'USD/CAD': { symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', isOTC: false, basePrice: 1.36800, volatility: 0.00014 },
  
  // OTC equivalents
  'EUR/USD-OTC': { symbol: 'EUR/USD-OTC', name: 'Euro / US Dollar (OTC)', isOTC: true, basePrice: 1.08250, volatility: 0.00028 },
  'GBP/USD-OTC': { symbol: 'GBP/USD-OTC', name: 'Great Britain Pound / US Dollar (OTC)', isOTC: true, basePrice: 1.27400, volatility: 0.00032 },
  'USD/JPY-OTC': { symbol: 'USD/JPY-OTC', name: 'US Dollar / Japanese Yen (OTC)', isOTC: true, basePrice: 156.400, volatility: 0.06200 },
  'EUR/GBP-OTC': { symbol: 'EUR/GBP-OTC', name: 'Euro / Great Britain Pound (OTC)', isOTC: true, basePrice: 0.85200, volatility: 0.00018 },
  'GBP/JPY-OTC': { symbol: 'GBP/JPY-OTC', name: 'Great Britain Pound / Japanese Yen (OTC)', isOTC: true, basePrice: 198.500, volatility: 0.08800 },
  'USD/BRL-OTC': { symbol: 'USD/BRL-OTC', name: 'US Dollar / Brazilian Real (OTC)', isOTC: true, basePrice: 5.4200, volatility: 0.00180 },
  'USD/INR-OTC': { symbol: 'USD/INR-OTC', name: 'US Dollar / Indian Rupee (OTC)', isOTC: true, basePrice: 83.4500, volatility: 0.02200 },
};

/**
 * Returns a deterministic price for an asset at a specific minute of the day.
 * We want the price to change continuously and realistically.
 */
export function getAssetPriceAtMinute(pair: string, dateSeed: string, minuteOfDay: number): number {
  const config = ASSET_PAIRS[pair] || ASSET_PAIRS['EUR/USD'];
  const basePrice = config.basePrice;
  const isOTC = config.isOTC;
  
  // Create a base seed combining pair and date
  const baseHash = hashString(`${pair}_${dateSeed}`);
  const r = new SeededRandom(`${pair}_${dateSeed}`);
  
  // Establish deterministic cycles for this pair on this day
  const freq1 = r.range(90, 160); // macro cycles (minutes)
  const freq2 = r.range(20, 50);  // medium cycles
  const freq3 = r.range(5, 15);   // micro cycles
  
  const amp1 = r.range(0.002, 0.006) * (isOTC ? 1.8 : 1.0);
  const amp2 = r.range(0.0006, 0.0018) * (isOTC ? 1.8 : 1.0);
  const amp3 = r.range(0.00015, 0.00045) * (isOTC ? 2.0 : 1.0);

  // General macro-trend for the day (linear random slope representing market trend)
  const daySlope = r.range(-0.0015, 0.0015) * (minuteOfDay / 1440);
  
  // Wave formulation
  const wave = 
    Math.sin(minuteOfDay / freq1) * amp1 +
    Math.cos(minuteOfDay / freq2) * amp2 +
    Math.sin(minuteOfDay / freq3) * amp3;
    
  // Micro jitter for the specific minute
  const minuteHash = hashString(`${pair}_${dateSeed}_min_${minuteOfDay}`);
  const rMin = new SeededRandom(`${pair}_${dateSeed}_min_${minuteOfDay}`);
  const jitter = rMin.range(-0.0002, 0.0002) * (isOTC ? 2.5 : 1.0);

  // Sum up multiplier
  const pctChange = daySlope + wave + jitter;
  return basePrice * (1 + pctChange);
}

/**
 * Generates a complete deterministic Candle at a specific minute index.
 */
export function generateCandle(pair: string, dateSeed: string, minuteOfDay: number): Candle {
  // To keep it 100% continuous, open of m is the close of m-1
  const open = getAssetPriceAtMinute(pair, dateSeed, minuteOfDay - 1);
  const close = getAssetPriceAtMinute(pair, dateSeed, minuteOfDay);
  
  const config = ASSET_PAIRS[pair] || ASSET_PAIRS['EUR/USD'];
  const vol = config.volatility;
  
  // Create unique seed for this specific candle's high/low wick sizes
  const candleSeed = `${pair}_${dateSeed}_candle_${minuteOfDay}`;
  const r = new SeededRandom(candleSeed);
  
  const maxOC = Math.max(open, close);
  const minOC = Math.min(open, close);
  
  // High and low are wicks.
  const high = maxOC + r.range(0.05, 0.35) * vol;
  const low = minOC - r.range(0.05, 0.35) * vol;
  
  const diff = Number((close - open).toFixed(8));
  const isBullish = diff > 0.00000001;
  const isBearish = diff < -0.00000001;
  const isDoji = !isBullish && !isBearish;
  
  // Render time string
  const hours = Math.floor(minuteOfDay / 60) % 24;
  const mins = minuteOfDay % 60;
  const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  
  return {
    time: timeStr,
    open: Number(open.toFixed(config.basePrice > 50 ? 3 : 5)),
    close: Number(close.toFixed(config.basePrice > 50 ? 3 : 5)),
    high: Number(high.toFixed(config.basePrice > 50 ? 3 : 5)),
    low: Number(low.toFixed(config.basePrice > 50 ? 3 : 5)),
    isBullish,
    isBearish,
    isDoji,
  };
}

/**
 * Utility to convert "HH:MM" string to minutes or minute index since 00:00
 */
export function timeToMinuteIndex(timeStr: string): number {
  const clean = timeStr.trim().replace(/\s+/g, '');
  const parts = clean.split(':');
  if (parts.length < 2) return 0;
  
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  
  if (isNaN(h) || isNaN(m)) return 0;
  return (h % 24) * 60 + (m % 60);
}

/**
 * Returns index to time string format e.g. 755 -> "12:35"
 */
export function minuteIndexToTimeStr(index: number): string {
  const hours = Math.floor(index / 60) % 24;
  const mins = index % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Generates a historical list of candles for displaying visual chart
 */
export function generateCandlesForSignal(
  pair: string,
  dateSeed: string,
  targetTimeStr: string,
  countBefore: number = 8,
  countAfter: number = 3
): Candle[] {
  const targetIndex = timeToMinuteIndex(targetTimeStr);
  const candles: Candle[] = [];
  
  for (let i = -countBefore; i <= countAfter; i++) {
    const minIndex = (targetIndex + i + 1440) % 1440;
    candles.push(generateCandle(pair, dateSeed, minIndex));
  }
  
  return candles;
}
