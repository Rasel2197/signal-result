import React from 'react';
import { BacktestResult, OutcomeType, BacktestSettings } from '../types';
import { MarketChart } from './MarketChart';
import { Search, ChevronDown, ChevronUp, Download, Eye, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

interface BacktestResultsProps {
  results: BacktestResult[];
  settings: BacktestSettings;
  onRefreshRun?: () => void;
}

export const BacktestResults: React.FC<BacktestResultsProps> = ({ results, settings, onRefreshRun }) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterPair, setFilterPair] = React.useState('ALL');
  const [filterOutcome, setFilterOutcome] = React.useState<string>('ALL');
  const [expandedRowId, setExpandedRowId] = React.useState<string | null>(null);

  // Derive unique pairs from results for filter dropdown
  const uniquePairs = React.useMemo(() => {
    const pairs = results.map(r => r.signal.pair);
    return ['ALL', ...Array.from(new Set(pairs))];
  }, [results]);

  // Filter application
  const filteredResults = React.useMemo(() => {
    return results.filter(res => {
      const matchesSearch = res.signal.pair.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            res.signal.time.includes(searchQuery);
                            
      const matchesPair = filterPair === 'ALL' || res.signal.pair === filterPair;
      
      let matchesOutcome = true;
      if (filterOutcome !== 'ALL') {
        if (filterOutcome === 'WINS') {
          matchesOutcome = res.outcome !== 'LOSS';
        } else if (filterOutcome === 'LOSSES') {
          matchesOutcome = res.outcome === 'LOSS';
        } else {
          matchesOutcome = res.outcome === filterOutcome;
        }
      }
      
      return matchesSearch && matchesPair && matchesOutcome;
    });
  }, [results, searchQuery, filterPair, filterOutcome]);

  const handleRowClick = (id: string) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  // CSV Downloader Utility
  const downloadCSV = () => {
    if (results.length === 0) return;
    
    // Headers matching requirements: Pair | Time | Result | MTG Level | Profit/Loss
    const headers = ['Pair', 'Time', 'Direction', 'Outcome', 'MTG Level Used', 'Initial Stake', 'Accumulated Invested', 'Net Profit/Loss ($)'];
    
    const rows = results.map(res => [
      res.signal.pair,
      res.signal.time,
      res.signal.direction,
      res.outcome,
      res.mtgLevelUsed,
      res.stakePerLevel[0],
      res.stakePerLevel.reduce((a, b) => a + b, 0),
      res.netProfit
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${val}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `orin_backtest_${settings.seedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#0d1015] border border-white/5 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5 pb-3 border-b border-white/5">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            Backtest Evaluation Logs
            {results.length > 0 && (
              <span className="text-xs bg-[#06080a] text-white/50 font-mono font-medium px-2.5 py-0.5 rounded-full border border-white/5">
                Found {filteredResults.length} / {results.length} items
              </span>
            )}
          </h2>
          <p className="text-xs text-white/40 mt-1 font-sans">
            Review detailed single-candle triggers, test calculations, and corresponding execution charts.
          </p>
        </div>
        
        {/* Actions Button Row */}
        <div className="flex items-center gap-2 w-full md:w-auto self-stretch shrink-0">
          <button
            type="button"
            onClick={downloadCSV}
            disabled={results.length === 0}
            className="flex-1 md:flex-none bg-[#06080a] hover:bg-[#1b1e22] disabled:bg-white/[0.01] border border-white/5 disabled:border-transparent text-white/80 disabled:text-white/20 hover:text-[#00f294] px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          
          {onRefreshRun && (
            <button
              type="button"
              onClick={onRefreshRun}
              disabled={results.length === 0}
              className="bg-[#00f294]/10 hover:bg-[#00f294]/20 text-[#00f294] border border-[#00f294]/20 p-2 rounded-lg text-xs font-mono font-semibold flex items-center justify-center transition-colors cursor-pointer"
              title="Re-run Simulation"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-12 bg-[#06080a]/50 rounded-xl border border-dashed border-white/5">
          <ChevronUp className="w-8 h-8 text-white/20 mx-auto mb-2 animate-bounce" />
          <p className="text-white/40 text-xs font-mono">No signals evaluated yet.</p>
          <p className="text-[10px] text-white/30 mt-1 max-w-sm mx-auto leading-normal font-sans">
            Pasted or uploaded signal inputs will show up evaluated sequentially here after clicking 'Load and Backtest Signals'.
          </p>
        </div>
      ) : (
        <>
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {/* Search */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white/30 pointer-events-none">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder="Search symbol or time..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#06080a] border border-white/5 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white/70 font-mono placeholder-white/20 focus:outline-none focus:border-[#00f294] transition-colors"
              />
            </div>

            {/* Pair Switcher */}
            <div className="relative">
              <select
                value={filterPair}
                onChange={(e) => setFilterPair(e.target.value)}
                className="w-full bg-[#06080a] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white/70 font-mono appearance-none focus:outline-none focus:border-[#00f294] cursor-pointer"
              >
                {uniquePairs.map((pair) => (
                  <option key={pair} value={pair}>
                    Asset: {pair}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
            </div>

            {/* Outcome Switcher */}
            <div className="relative">
              <select
                value={filterOutcome}
                onChange={(e) => setFilterOutcome(e.target.value)}
                className="w-full bg-[#06080a] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white/70 font-mono appearance-none focus:outline-none focus:border-[#00f294] cursor-pointer"
              >
                <option value="ALL">Outcome: All Signals</option>
                <option value="WINS">Outcome: Wins Only</option>
                <option value="DIRECT_WIN">Outcome: Direct Wins</option>
                <option value="MTG1_WIN">Outcome: MTG 1 Wins</option>
                <option value="MTG2_WIN">Outcome: MTG 2 Wins</option>
                <option value="LOSSES">Outcome: Losses Only</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
            </div>
          </div>

          {/* Results Table */}
          <div className="relative overflow-hidden rounded-xl border border-white/5 bg-[#06080a]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0d1015]/60 border-b border-white/5 text-white/40 font-mono font-medium text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-4">Asset Pair</th>
                    <th className="py-3 px-4 text-center">Time</th>
                    <th className="py-3 px-4 text-center">Direction</th>
                    <th className="py-3 px-4 text-center">Performance Result</th>
                    <th className="py-3 px-4 text-center">MTG Step</th>
                    <th className="py-3 px-4 text-right">Net Profit / Loss</th>
                    <th className="py-3 px-4 text-center">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02] text-xs font-mono">
                  {filteredResults.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-white/20 italic">
                        No results match your selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredResults.map((res) => {
                      const isExpanded = expandedRowId === res.id;
                      const totalInvested = res.stakePerLevel.reduce((a, b) => a + b, 0);
                      const isProfit = res.netProfit > 0;
                      
                      // Result labeling styles
                      let outcomeBadge: React.ReactNode = null;
                      if (res.isAvoided) {
                        outcomeBadge = (
                          <div className="flex flex-col items-center gap-1 font-sans">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
                              🛡️ AVOIDED (LOSS)
                            </span>
                            {res.violatedRules && res.violatedRules.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1 justify-center max-w-[150px]">
                                {res.violatedRules.map((r, idx) => (
                                  <span key={idx} className="text-[7.5px] font-mono leading-none text-yellow-400/90 bg-yellow-500/5 px-1 py-0.5 rounded border border-yellow-500/10">
                                    {r}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      } else if (res.outcome === 'DIRECT_WIN') {
                        outcomeBadge = (
                          <div className="flex flex-col items-center gap-1 font-sans">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#00f294]/10 text-[#00f294] border border-[#00f294]/20">
                              DIRECT WIN
                            </span>
                            {res.violatedRules && res.violatedRules.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1 justify-center max-w-[150px]">
                                {res.violatedRules.map((r, idx) => (
                                  <span key={idx} className="text-[7px] font-mono leading-none text-white/40 bg-white/[0.02] px-1 py-0.5 rounded border border-white/5" title="Rule crossed but trade won">
                                    {r}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      } else if (res.outcome === 'MTG1_WIN') {
                        outcomeBadge = (
                          <div className="flex flex-col items-center gap-1 font-sans">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#00f294]/10 text-[#00f294]/80 border border-[#00f294]/10">
                              MTG 1 WIN
                            </span>
                            {res.violatedRules && res.violatedRules.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1 justify-center max-w-[150px]">
                                {res.violatedRules.map((r, idx) => (
                                  <span key={idx} className="text-[7px] font-mono leading-none text-white/40 bg-white/[0.02] px-1 py-0.5 rounded border border-white/5" title="Rule crossed but trade won">
                                    {r}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      } else if (res.outcome === 'MTG2_WIN') {
                        outcomeBadge = (
                          <div className="flex flex-col items-center gap-1 font-sans">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#00f294]/10 text-[#00f294]/60 border border-[#00f294]/10">
                              MTG 2 WIN
                            </span>
                            {res.violatedRules && res.violatedRules.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1 justify-center max-w-[150px]">
                                {res.violatedRules.map((r, idx) => (
                                  <span key={idx} className="text-[7px] font-mono leading-none text-white/40 bg-white/[0.02] px-1 py-0.5 rounded border border-white/5" title="Rule crossed but trade won">
                                    {r}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      } else {
                        outcomeBadge = (
                          <div className="flex flex-col items-center gap-1 font-sans">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ff4d4d]/10 text-[#ff4d4d] border border-[#ff4d4d]/20">
                              LOSS
                            </span>
                            {res.violatedRules && res.violatedRules.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1 justify-center max-w-[150px]">
                                {res.violatedRules.map((r, idx) => (
                                  <span key={idx} className="text-[7.5px] font-mono leading-none text-white/30 bg-white/[0.02] px-1 py-0.5 rounded border border-white/5">
                                    {r}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <React.Fragment key={res.id}>
                          <tr
                            onClick={() => handleRowClick(res.id)}
                            className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${
                              isExpanded ? 'bg-white/[0.01]' : ''
                            }`}
                          >
                            {/* Asset */}
                            <td className="py-3.5 px-4 font-bold text-white/90">
                              {res.signal.pair}
                            </td>
                            
                            {/* Time */}
                            <td className="py-3.5 px-4 text-center text-white/70">
                              {res.signal.time}
                            </td>
                            
                            {/* Dir */}
                            <td className="py-3.5 px-4 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                res.signal.direction === 'CALL' 
                                  ? 'bg-[#00f294]/10 text-[#00f294]' 
                                  : 'bg-[#ff4d4d]/10 text-[#ff4d4d]'
                              }`}>
                                {res.signal.direction === 'CALL' ? 'CALL ▲' : 'PUT ▼'}
                              </span>
                            </td>
                            
                            {/* Outcome Badge */}
                            <td className="py-3.5 px-4 text-center">
                              {outcomeBadge}
                            </td>
                            
                            {/* MTG Level */}
                            <td className="py-3.5 px-4 text-center font-bold text-white/80">
                              {res.mtgLevelUsed === 0 ? '-' : `MTG${res.mtgLevelUsed}`}
                            </td>
                            
                            {/* Profit / Loss */}
                            <td className="py-3.5 px-4 text-right font-semibold">
                              {res.isAvoided ? (
                                <span className="flex flex-col items-end">
                                  <span className="text-white/30 line-through text-[10px] select-none">
                                    -${Math.abs(res.netProfit)}
                                  </span>
                                  <span className="text-[#00f294] text-[10px] font-bold flex items-center gap-0.5">
                                    Saved +${Math.abs(res.netProfit)} 🛡️
                                  </span>
                                </span>
                              ) : (
                                <span className={`flex items-center justify-end gap-1 ${
                                  isProfit ? 'text-[#00f294]' : 'text-[#ff4d4d]'
                                }`}>
                                  {isProfit ? (
                                    <>
                                      <TrendingUp className="w-3 h-3 shrink-0" />
                                      +${res.netProfit}
                                    </>
                                  ) : (
                                    <>
                                      <TrendingDown className="w-3 h-3 shrink-0" />
                                      -${Math.abs(res.netProfit)}
                                    </>
                                  )}
                                </span>
                              )}
                            </td>
                            
                            {/* Inspect toggle */}
                            <td className="py-3.5 px-4 text-center">
                              <button
                                type="button"
                                className="text-white/20 hover:text-white/60 p-1 cursor-pointer"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 mx-auto" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 mx-auto" />
                                )}
                              </button>
                            </td>
                          </tr>

                          {/* Chart row expansion container */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={7} className="p-4 bg-[#06080a] border-y border-white/5">
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center text-xs text-white/40">
                                    <span className="flex items-center gap-1">
                                      <Eye className="w-3.5 h-3.5 text-white/20" />
                                      Execution Trace details
                                    </span>
                                    <span className="font-mono text-[10px] text-white/35">
                                      Total Invested: ${totalInvested} | Initial: ${res.stakePerLevel[0]} 
                                      {res.mtgLevelUsed > 0 && ` | Level Stakes: [${res.stakePerLevel.join(', ')}]`}
                                    </span>
                                  </div>
                                  
                                  <MarketChart
                                    signal={res.signal}
                                    dateSeed={settings.seedDate}
                                    evaluatedCandles={res.candles}
                                  />
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
