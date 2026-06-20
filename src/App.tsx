import React from 'react';
import { Signal, BacktestResult, BacktestSummary, BacktestSettings } from './types';
import { parseRawSignals, SAMPLE_SIGNALS_PROFITABLE } from './utils/signalParser';
import { runBacktestSuite } from './utils/backtestEngine';
import { StatsGrid } from './components/StatsGrid';
import { SignalInput } from './components/SignalInput';
import { BacktestConfig } from './components/BacktestConfig';
import { BacktestResults } from './components/BacktestResults';
import { ExportCard } from './components/ExportCard';
import { TrendingUp, Activity, RefreshCw } from 'lucide-react';

export default function App() {
  // Initialize customizable parameter block
  const [settings, setSettings] = React.useState<BacktestSettings>({
    stake: 10,
    payoutRate: 85,
    maxMtg: 1,
    mtgMultiplier: 2.2,
    slippageMultiplier: 1.0,
    otcMode: false,
    seedDate: '2026-06-19', // Coherent simulation day
  });

  // Track raw active/parsed signals
  const [signals, setSignals] = React.useState<Signal[]>([]);
  
  // Track active backtest results
  const [results, setResults] = React.useState<BacktestResult[]>([]);
  const [summary, setSummary] = React.useState<BacktestSummary | null>(null);
  
  const [loading, setLoading] = React.useState(false);

  // Auto-onboard: Load demo session on first mount so the user sees a ready-to-test dashboard!
  React.useEffect(() => {
    const defaultSignals = parseRawSignals(SAMPLE_SIGNALS_PROFITABLE);
    setSignals(defaultSignals);
    
    setLoading(true);
    // Add small delay to mimic high-performance database loading
    const timer = setTimeout(() => {
      const suite = runBacktestSuite(defaultSignals, settings);
      setResults(suite.results);
      setSummary(suite.summary);
      setLoading(false);
    }, 400);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle manual or imported list uploads
  const handleSignalsParsed = (parsedSignals: Signal[], count: number) => {
    setSignals(parsedSignals);
    triggerBacktestExecution(parsedSignals, settings);
  };

  // Multi-state trigger evaluation
  const triggerBacktestExecution = (activeSignals: Signal[], activeSettings: BacktestSettings) => {
    setLoading(true);
    const timer = setTimeout(() => {
      const suite = runBacktestSuite(activeSignals, activeSettings);
      setResults(suite.results);
      setSummary(suite.summary);
      setLoading(false);
    }, 500); // Small professional loader delay
  };

  const handleSettingsChange = (newSettings: BacktestSettings) => {
    setSettings(newSettings);
    // Re-evaluate if signals already exist
    if (signals.length > 0) {
      triggerBacktestExecution(signals, newSettings);
    }
  };

  // Re-run execution manually
  const forceRecalculation = () => {
    if (signals.length > 0) {
      triggerBacktestExecution(signals, settings);
    }
  };

  return (
    <div className="bg-[#090b0e] min-h-screen text-[#e1e1e1] flex flex-col antialiased">
      {/* Upper Navigation Trading Bar */}
      <header className="bg-[#0d1015] border-b border-white/5 px-4 md:px-8 py-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* Logo Brand Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#00f294] rounded-sm flex items-center justify-center shadow-[0_0_15px_rgba(0,242,148,0.2)]">
              <div className="w-4 h-4 border-2 border-black rotate-45"></div>
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-white uppercase font-sans">
                ORIN <span className="text-[#00f294]/80 font-mono font-light ml-1">SIGNAL ANALYZER</span>
              </h1>
              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                Automated Quotex & Binary Options Signal Backtester
              </p>
            </div>
          </div>

          {/* Status Live Ticker */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="hidden md:flex items-center gap-2 bg-white/[0.02] px-3 py-1.5 rounded-lg border border-white/5">
              <span className="w-2 h-2 rounded-full bg-[#00f294] animate-pulse"></span>
              <span className="text-white/40 text-[10px] uppercase tracking-wider">Live Market Data</span>
              <span className="text-white/20">|</span>
              <span className="text-[10px] text-white/50">v4.2.0-STABLE</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Seed:</span>
              <span className="bg-[#06080a] px-2.5 py-1 rounded border border-white/5 text-[#00f294]">
                {settings.seedDate}
              </span>
            </div>
          </div>

        </div>
      </header>

      {/* Primary Dashboard Canvas */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
        
        {/* Row 1: Terminals (Inputs and Parameters) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-7 xl:col-span-8">
            <SignalInput 
              onParsedSignals={handleSignalsParsed} 
              initialText={SAMPLE_SIGNALS_PROFITABLE}
            />
          </div>

          <div className="lg:col-span-5 xl:col-span-4">
            <BacktestConfig 
              settings={settings} 
              onChangeSettings={handleSettingsChange}
            />
          </div>

        </section>

        {/* Global Loader Backdrop Overlay */}
        {loading ? (
          <div className="bg-[#0d1015] p-12 rounded-2xl border border-white/5 flex flex-col items-center justify-center space-y-4">
            <Activity className="w-8 h-8 text-[#00f294] animate-spin" />
            <p className="text-xs font-mono text-[#00f294] tracking-widest animate-pulse">
              ANALYZING HISTORICAL ASSET FEEDS...
            </p>
          </div>
        ) : (
          summary && (
            <>
              {/* Row 2: Comprehensive Statistics Bento */}
              <section>
                <StatsGrid summary={summary} maxMtg={settings.maxMtg} />
              </section>

              {/* Row 3: Evaluation Records Grid */}
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                <div className="lg:col-span-8">
                  <BacktestResults 
                    results={results} 
                    settings={settings}
                    onRefreshRun={forceRecalculation}
                  />
                </div>

                <div className="lg:col-span-4">
                  <ExportCard 
                    summary={summary} 
                    settings={settings}
                    results={results}
                  />
                </div>

              </section>
            </>
          )
        )}
      </main>

      {/* Footer System Margin Info */}
      <footer className="bg-[#090b0e] border-t border-white/5 py-6 px-4 text-center text-[10px] text-[#e1e1e1]/40 font-mono space-y-1 mt-auto shrink-0">
        <p>© 2026 Orin Financial Corporation. All simulation calculations are deterministic.</p>
        <p className="opacity-60">Backtesting relies on simulated historical feeds seeded on localized seed inputs.</p>
      </footer>
    </div>
  );
}
