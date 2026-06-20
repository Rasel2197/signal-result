import { Signal } from '../types';
import { ASSET_PAIRS } from './marketGenerator';

/**
 * Searches for an asset pair from a tokenized string block.
 * Maps abbreviated or stylized pair string (e.g., "EURUSD OTC" -> "EUR/USD-OTC", "USDJPY" -> "USD/JPY")
 */
export function normalizeAssetPair(token: string): string | null {
  const clean = token.toUpperCase().replace(/[^A-Z]/g, ''); // Convert to letters only
  
  // Try to find the closest match in ASSET_PAIRS
  const keys = Object.keys(ASSET_PAIRS);
  
  // High-priority matching for exact token contains
  const uppercaseToken = token.toUpperCase().trim();
  
  // Handle explicit OTC notation (e.g. EURUSD-OTC, EUR USD OTC, EURUSD_OTC, EURUSDOtc)
  const isOTC = uppercaseToken.includes('OTC') || uppercaseToken.includes('O.T.C.');
  
  // Strip non-alphas from the base search, but preserve the asset prefix
  const searchPattern = clean.replace('OTC', '');
  
  for (const pair of keys) {
    const pairClean = pair.replace(/[^A-Z]/g, '').replace('OTC', '');
    if (searchPattern === pairClean || pairClean.includes(searchPattern) || searchPattern.includes(pairClean)) {
      // Return matching OTC / Non-OTC
      if (isOTC && ASSET_PAIRS[`${ASSET_PAIRS[pair].symbol.split('-')[0]}-OTC`]) {
        return ASSET_PAIRS[`${ASSET_PAIRS[pair].symbol.split('-')[0]}-OTC`].symbol;
      }
      return ASSET_PAIRS[pair].symbol;
    }
  }
  
  return null;
}

/**
 * Normalizes direction synonyms (CALL, PUT, BUY, SELL, UP, DOWN, GREEN, RED, etc.)
 */
export function normalizeDirection(token: string): 'CALL' | 'PUT' | null {
  const t = token.toUpperCase().trim();
  
  const callSynonyms = ['CALL', 'BUY', 'UP', 'GREEN', 'HIGHER', 'ABOVE', 'LONG', '🟢', '▲'];
  const putSynonyms = ['PUT', 'SELL', 'DOWN', 'RED', 'LOWER', 'BELOW', 'SHORT', '🔴', '▼'];
  
  if (callSynonyms.some(s => t.includes(s))) return 'CALL';
  if (putSynonyms.some(s => t.includes(s))) return 'PUT';
  
  return null;
}

/**
 * Parses raw text or CSV to generate a list of Signals.
 * Handles:
 * - Time formats like "10:15" or "10:15:00" or "10:15 AM"
 * - Pair names with/without slash, spacing, or OTC
 * - Custom dividers (e.g. | , ; tab space)
 */
export function parseRawSignals(rawText: string): Signal[] {
  if (!rawText) return [];
  
  const lines = rawText.split(/\r?\n/);
  const parsedSignals: Signal[] = [];
  
  lines.forEach((line, index) => {
    const cleanLine = line.trim();
    if (!cleanLine) return; // Skip empty lines
    
    // Check if line looks like a comment header or separator
    if (cleanLine.startsWith('#') || cleanLine.startsWith('//') || cleanLine.toLowerCase().includes('time|pair')) {
      return;
    }
    
    // Split using common delimiters: |, comma, semicolon, tab, multiple spaces, hyphen
    const parts = cleanLine.split(/[|;, \t-]+/).map(p => p.trim()).filter(Boolean);
    
    // We expect at least a Time, a Pair, and a Direction
    // Let's search each line block for the three standard components using regular expressions.
    let time: string | null = null;
    let pair: string | null = null;
    let direction: 'CALL' | 'PUT' | null = null;
    
    // 1. Time extraction
    const timeRegex = /\b(\d{1,2}):(\d{2})(?::\d{2})?\b/;
    const timeMatch = cleanLine.match(timeRegex);
    if (timeMatch) {
      const hh = timeMatch[1].padStart(2, '0');
      const mm = timeMatch[2].padStart(2, '0');
      time = `${hh}:${mm}`;
    }
    
    // If we didn't find time using regex but there is a token containing ":", try it
    if (!time) {
      const colToken = parts.find(p => p.includes(':'));
      if (colToken) {
        const numbers = colToken.split(':').map(n => parseInt(n, 10));
        if (numbers.length >= 2 && !isNaN(numbers[0]) && !isNaN(numbers[1])) {
          time = `${numbers[0].toString().padStart(2, '0')}:${numbers[1].toString().padStart(2, '0')}`;
        }
      }
    }
    
    // 2. Identify the tokens excluding the time part
    const nonTimeParts = parts.filter(p => !p.includes(':') && !p.match(/^\d+$/));
    
    // Try to extract pair and direction from remaining parts
    for (const part of nonTimeParts) {
      if (!pair) {
        const potentialPair = normalizeAssetPair(part);
        if (potentialPair) {
          pair = potentialPair;
          continue;
        }
      }
      if (!direction) {
        const potentialDir = normalizeDirection(part);
        if (potentialDir) {
          direction = potentialDir;
        }
      }
    }
    
    // If direction still not found, let's look anywhere in the line for UP/DOWN/CALL/PUT/BUY/SELL/GREEN/RED
    if (!direction) {
      direction = normalizeDirection(cleanLine);
    }
    
    // If we found all 3, add the signal!
    if (time && pair && direction) {
      parsedSignals.push({
        id: `sig_${Date.now()}_${index}_${Math.floor(Math.random() * 1000)}`,
        time,
        pair,
        direction,
        rawText: cleanLine
      });
    }
  });
  
  return parsedSignals;
}

/**
 * Format an input list of preset sample signals
 */
export const SAMPLE_SIGNALS_PROFITABLE = `
10:05 | EUR/USD | CALL
10:12 | GBP/USD | PUT
10:20 | USD/JPY | CALL
10:35 | EUR/GBP | PUT
10:40 | GBP/JPY | CALL
10:55 | USD/CAD | PUT
11:05 | AUD/USD | CALL
11:15 | EUR/USD | PUT
`.trim();

export const SAMPLE_SIGNALS_OTC = `
// Volatile OTC Morning Session
08:05 | EUR/USD-OTC | CALL
08:12 | GBP/USD-OTC | CALL
08:25 | USD/JPY-OTC | PUT
08:32 | EUR/GBP-OTC | PUT
08:45 | GBP/JPY-OTC | CALL
09:10 | USD/BRL-OTC | CALL
09:24 | USD/INR-OTC | PUT
09:40 | EUR/USD-OTC | PUT
`.trim();

export const SAMPLE_SIGNALS_DIVERSE_FORMAT = `
# Inconsistent User Formats Parser Demo
11:05, EURUSD, CALL
USDJPY 11:20 PUT
11:35 | GBP/JPY-OTC | BUY
🟢 11:45 - EUR/GBP - CALL - M1
12:00; AUDUSD; SELL
🔴 12:15 - CAD/USD - PUT - 60s
12:30 | EUR_USD_OTC | UP
`.trim();
