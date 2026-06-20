import React from 'react';
import { BacktestSettings } from '../types';
import { Settings, HelpCircle, Shield, Sparkles } from 'lucide-react';

interface BacktestConfigProps {
  settings: BacktestSettings;
  onChangeSettings: (settings: BacktestSettings) => void;
}

export const BacktestConfig: React.FC<BacktestConfigProps> = ({ settings, onChangeSettings }) => {
  const handleToggleOTC = () => {
    const updatedSettings = {
      ...settings,
      otcMode: !settings.otcMode,
      // Automatically boost payouts to OTC values (typically 92% vs 85%)
      payoutRate: !settings.otcMode ? 92 : 85
    };
    onChangeSettings(updatedSettings);
  };

  const handlePayoutChange = (val: number) => {
    onChangeSettings({ ...settings, payoutRate: val });
  };

  const handleMtgLevelChange = (val: 0 | 1 | 2) => {
    onChangeSettings({ ...settings, maxMtg: val });
  };

  return (
    <div className="bg-[#0d1015] border border-white/5 rounded-2xl p-5 shadow-xl h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-[#00f294]" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white font-sans">
            Backtest Engine Settings
          </h2>
        </div>

        {/* Stake Settings */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[11px] font-mono text-white/40 uppercase tracking-wider flex items-center gap-1.5">
                Initial Trade Stake
              </label>
              <span className="text-xs font-mono font-bold text-[#00f294] bg-[#00f294]/10 px-2 py-0.5 rounded border border-[#00f294]/20">
                ${settings.stake} USD
              </span>
            </div>
            <input
              type="number"
              min="1"
              max="5000"
              value={settings.stake}
              onChange={(e) => onChangeSettings({ ...settings, stake: Math.max(1, parseInt(e.target.value, 10) || 0) })}
              className="w-full bg-[#06080a] border border-white/5 rounded-lg px-3 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-[#00f294] transition-colors"
            />
          </div>

          {/* Payout Ratio */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-mono text-white/40 uppercase tracking-wider">
                Payout Rate
              </label>
              <span className="text-xs font-mono font-bold text-[#00f294] bg-[#06080a] px-2 py-0.5 rounded border border-white/5">
                {settings.payoutRate}%
              </span>
            </div>
            <input
              type="range"
              min="60"
              max="100"
              value={settings.payoutRate}
              onChange={(e) => handlePayoutChange(parseInt(e.target.value, 10))}
              className="w-full accent-[#00f294] bg-[#06080a] rounded-lg h-1.5 appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[9px] font-mono text-white/30 mt-1">
              <span>60%</span>
              <span>85% (Avg Real)</span>
              <span>92% (Avg OTC)</span>
              <span>100%</span>
            </div>
          </div>

          {/* OTC Market Booster Toggle */}
          <div className="bg-[#06080a] p-3 rounded-xl border border-white/5 flex items-center justify-between">
            <div>
              <h4 className="text-[11px] font-mono uppercase tracking-wider text-white/80 flex items-center gap-1">
                OTC Market Override Boost
              </h4>
              <p className="text-[9px] text-white/40 mt-0.5 max-w-[180px]">
                Higher volatility and payout rates (Default: 92%). Forces backtests on high-risk OTC nodes.
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleOTC}
              className={`w-12 h-6 rounded-full p-0.5 transition-all duration-300 focus:outline-none cursor-pointer ${
                settings.otcMode ? 'bg-[#00f294]' : 'bg-[#1b1e22]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-black shadow-md transform transition-all duration-300 ${
                  settings.otcMode ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Martingale Level Selection */}
          <div>
            <label className="text-[11px] font-mono text-white/40 uppercase tracking-wider block mb-1.5">
              Martingale Depth (Max Steps)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => handleMtgLevelChange(level as 0 | 1 | 2)}
                  className={`py-2 px-3 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                    settings.maxMtg === level
                      ? 'bg-[#00f294]/10 border-[#00f294]/40 text-[#00f294]'
                      : 'bg-[#06080a] border-white/5 text-white/55 hover:border-white/10'
                  }`}
                >
                  {level === 0 ? 'No MTG' : `MTG ${level}`}
                </button>
              ))}
            </div>
          </div>

          {/* Martingale Multiplier */}
          {settings.maxMtg > 0 && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-mono text-white/40 uppercase tracking-wider">
                  Martingale Multiplier
                </label>
                <span className="text-xs font-mono font-bold text-[#00f294] bg-[#06080a] px-2 py-0.5 rounded border border-white/5">
                  {settings.mtgMultiplier}x
                </span>
              </div>
              <input
                type="range"
                min="1.5"
                max="3.0"
                step="0.1"
                value={settings.mtgMultiplier}
                onChange={(e) => onChangeSettings({ ...settings, mtgMultiplier: parseFloat(e.target.value) })}
                className="w-full accent-[#00f294] bg-[#06080a] rounded-lg h-1.5 appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-mono text-white/30 mt-1">
                <span>1.5x</span>
                <span>2.0x (Classic)</span>
                <span>2.2x (Recommended)</span>
                <span>3.0x</span>
              </div>
            </div>
          )}

          {/* Simulation Anchor Date */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[11px] font-mono text-white/40 uppercase tracking-wider flex items-center gap-1">
                Simulation Anchor Date
              </label>
              <div className="group relative">
                <HelpCircle className="w-3.5 h-3.5 text-white/20 hover:text-white/40 cursor-help" />
                <div className="pointer-events-none opacity-0 group-hover:opacity-100 absolute bottom-full mb-1 right-0 w-44 bg-black border border-white/10 text-white/60 p-2 rounded text-[9px] leading-relaxed transition-opacity font-sans z-55">
                  Allows simulating different market profiles. Modifying this changes the candle structures deterministically!
                </div>
              </div>
            </div>
            <input
              type="date"
              value={settings.seedDate}
              onChange={(e) => onChangeSettings({ ...settings, seedDate: e.target.value })}
              className="w-full bg-[#06080a] border border-white/5 rounded-lg px-3 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-[#00f294] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Safety Notice Footer */}
      <div className="mt-5 pt-3 border-t border-white/5 shrink-0 flex items-start gap-2.5 bg-[#06080a]/40 p-2.5 rounded-xl border border-white/5">
        <Shield className="w-4.5 h-4.5 text-white/30 shrink-0 mt-0.5" />
        <p className="text-[10px] text-white/40 leading-normal font-sans">
          Orin Martingale engine aggregates cumulative exposure: <strong className="text-white/60 font-semibold">MTG2</strong> increases position sizing by up to <strong className="text-white/60 font-semibold">{Number((1 + settings.mtgMultiplier + settings.mtgMultiplier*settings.mtgMultiplier).toFixed(1))}x</strong>. Trade responsibly.
        </p>
      </div>
    </div>
  );
};
