import React from 'react';
import { BacktestSummary, BacktestSettings, BacktestResult } from '../types';
import { Share2, Copy, Check, Printer, Send, MessageSquare, Globe, AlignLeft } from 'lucide-react';

interface ExportCardProps {
  summary: BacktestSummary;
  settings: BacktestSettings;
  results: BacktestResult[];
}

type TemplateType = 'telegram' | 'bangla' | 'minimal';

export const ExportCard: React.FC<ExportCardProps> = ({ summary, settings, results }) => {
  const [copied, setCopied] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<TemplateType>('telegram');
  const [brandingText, setBrandingText] = React.useState('@OrinSignalsVIP');

  const totalWinRate = summary.accuracyRate;
  const isNetPositive = summary.netProfit >= 0;
  const marketTypeStr = settings.otcMode ? 'OTC Markets [BOOSTED ⚡]' : 'Standard Real Time';

  // Helper inside to compile details of which signal did what
  const getSignalsDetailText = (isBangla: boolean, useTableStyle = false) => {
    if (!results || results.length === 0) return 'No signals recorded.';
    
    return results.map((res, index) => {
      const pair = res.signal.pair.replace('_', '/'); // e.g., EUR_USD -> EUR/USD
      const time = res.signal.time;
      const arrow = res.signal.direction === 'CALL' ? 'CALL' : 'PUT';
      
      let outcomeText = '';
      if (res.isAvoided) {
        outcomeText = isBangla ? 'AVOID 🛡️' : 'AVOID 🛡️';
      } else if (res.outcome === 'DIRECT_WIN' || res.outcome === 'MTG1_WIN' || res.outcome === 'MTG2_WIN') {
        outcomeText = isBangla ? 'PROFIT ✅' : 'PROFIT ✅';
      } else {
        outcomeText = isBangla ? 'LOSS ❌' : 'LOSS ❌';
      }
      
      if (useTableStyle) {
        return `[${time}] ${pair.padEnd(8)} | ${res.signal.direction.padEnd(4)} ➜ ${outcomeText}`;
      }
      return `${index + 1}. 🔹 [${time}] ${pair} (${arrow}) ➜ *${outcomeText}*`;
    }).join('\n');
  };

  const signalsSheetTelegram = getSignalsDetailText(false);
  const signalsSheetBangla = getSignalsDetailText(true);
  const signalsSheetMinimal = getSignalsDetailText(false, true);

  // Template 1: Telegram VIP Style
  const telegramTemplate = `👑 *ORIN SIGNAL ANALYZER - AUTOMATED VIP BACKTEST* 👑
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 *Date Window:* ${settings.seedDate}
📈 *Market Mode:* ${settings.otcMode ? 'OTC / High Volatility ⚡' : 'Live Real Market 🌐'}
⚙ *Parameters:* Stake $${settings.stake} | Max MTG: ${settings.maxMtg} (${settings.mtgMultiplier}x)

🏆 *SMART VIP PROTOCOL PERFORMANCE:*
🎯 *VIP Accuracy:* ${summary.filteredAccuracyRate}% 🔥 [STABLE PROFIT]
💰 *VIP Net Profit:* ${summary.filteredNetProfit >= 0 ? '+' : ''}$${summary.filteredNetProfit.toFixed(2)} USD 💸
🛡️ *Avoided Losses:* ${summary.avoidedLossesCount} signals successfully bypassed!
💵 *Capital Saved:* +$${summary.protectedCapital.toFixed(2)} USD protected!

📊 *STANDARD MODEL INDEX (UNFILTERED):*
🔹 Total Signal Inputs: ${summary.totalSignals}
✅ Total Wins: ${summary.totalWins}
   ├─ Direct Wins (MTG 0): ${summary.directWins} 🎯
   ├─ MTG Level 1 Wins: ${summary.mtg1Wins} ⭐
   └─ MTG Level 2 Wins: ${summary.mtg2Wins} ⚡
❌ Standard Losses: ${summary.losses}
🎯 *Standard Accuracy:* ${summary.accuracyRate}%
💰 *Standard Profit:* ${isNetPositive ? '+' : ''}$${summary.netProfit.toFixed(2)} USD

📋 *DETAILED SIGNAL SHEET (KONTA KI HOICHE):*
${signalsSheetTelegram}

🔥 *BEST WIN STREAK:* ${summary.winStreaks} wins in a row!

📢 *JOIN MY TELEGRAM GROUP FOR FREE SIGNALS:*
👉 ${brandingText}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Verified automatically via Orin Smart VIP Engine - Prevent bad entries, preserve your wallet!_`;

  // Template 2: Bangla Community Style
  const banglaTemplate = `🇧🇩 *ওড়িন সিগন্যাল অ্যালগরিদম - ভিআইপি ব্যাকটেস্ট রিপোর্ট* 🇧🇩
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 *তারিখ উইন্ডো:* ${settings.seedDate}
📈 *মার্কেট টাইপ:* ${settings.otcMode ? 'OTC মার্কেট ⚡' : 'লাইভ রিয়েল মার্কেট 🌐'}
⚙️ *সেটিংস:* Stake $${settings.stake} | MTG লিমিট: ${settings.maxMtg} (${settings.mtgMultiplier}x)

🏆 *স্মার্ট ভিআইপি প্রোটোকল ফলাফল:*
🎯 *ভিআইপি এক্যুরিসি:* ${summary.filteredAccuracyRate}% 🔥 [অত্যন্ত লাভজনক]
💰 *ভিআইপি নেট প্রফিট:* ${summary.filteredNetProfit >= 0 ? '+' : ''}$${summary.filteredNetProfit.toFixed(2)} USD 💸
🛡️ *লস এড়ানো সম্ভব হয়েছে:* ${summary.avoidedLossesCount} টি খারাপ সিগন্যাল সফলভাবে ফিল্টার করা হয়েছে!
💵 *টাকা বেঁচে গেছে:* +$${summary.protectedCapital.toFixed(2)} USD ক্যাপিটাল রক্ষা করা হয়েছে!

📊 *সাধারণ আন-ফিল্টার্ড ট্রেড সেশন:*
🔹 মোট সিগন্যাল যাচাইকৃত: ${summary.totalSignals} টি
✅ মোট উইন: ${summary.totalWins} টি
   ├─ সরাসরি উইন (MTG 0): ${summary.directWins} টি 🎯
   ├─ ১ম মার্টিনগেল উইন (MTG 1): ${summary.mtg1Wins} টি ⭐
   └─ ২য় মার্টিনগেল উইন (MTG 2): ${summary.mtg2Wins} টি ⚡
❌ সাধারণ লস: ${summary.losses} টি
🎯 *সাধারণ এক্যুরিসি:* ${summary.accuracyRate}%
💰 *সাধারণ নেট প্রফিট:* ${isNetPositive ? '+' : ''}$${summary.netProfit.toFixed(2)} USD

📋 *প্রতিটি ট্রেডের বিস্তারিত ফলাফল:*
${signalsSheetBangla}

🔥 *টানা সর্বোচ্চ প্রফিট সাকসেস (Streak):* ${summary.winStreaks} টি!

📢 *ফ্রি সিগন্যাল এবং আপডেট পেতে জয়েন করুন:*
👉 ${brandingText}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_ওড়িন স্মার্ট ভিআইপি ফিল্টার ব্যবহার করে অপ্রয়োজনীয় লস এড়ান ও ক্যাপিটাল সুরক্ষিত রাখুন!_`;

  // Template 3: Minimalist Pro Table
  const minimalTemplate = `[ORIN PRO - VIP COMPLIANT REPORT]
-----------------------------------------
RUN DATE : ${settings.seedDate}
FEED TYPE: ${marketTypeStr}
SETTING  : $${settings.stake} USD | Max MTG ${settings.maxMtg}

VIP FILTER METRICS:
- VIP Accuracy      : ${summary.filteredAccuracyRate}%
- VIP Net Benefit   : ${summary.filteredNetProfit >= 0 ? '+' : ''}$${summary.filteredNetProfit.toFixed(2)} USD
- Saved Losses      : ${summary.avoidedLossesCount} trades bypassed
- Saved Capital     : +$${summary.protectedCapital.toFixed(2)} USD

BASE METRICS:
- Total Signal Inputs: ${summary.totalSignals}
- Successfully Won   : ${summary.totalWins}
- Direct Win Rate    : ${summary.totalSignals > 0 ? ((summary.directWins / summary.totalSignals) * 100).toFixed(0) : 0}%
- Martingale Resolved: ${summary.mtg1Wins + summary.mtg2Wins} signals
- Base Losses        : ${summary.losses}
- Base Accuracy      : ${summary.accuracyRate}%
- Base Net Profit    : ${isNetPositive ? '+' : ''}$${summary.netProfit.toFixed(2)} USD

SIGNAL TRANSACTION DETAILED LOGS:
${signalsSheetMinimal}

VIP ADMISSION CONTACT: ${brandingText}
-----------------------------------------
Verified on Orin Financial Audit compliance logic.`;

  // Determine current active text
  const getActiveTextReport = () => {
    switch (activeTab) {
      case 'bangla':
        return banglaTemplate;
      case 'minimal':
        return minimalTemplate;
      case 'telegram':
      default:
        return telegramTemplate;
    }
  };

  const copyToClipboard = () => {
    const textToCopy = getActiveTextReport().replace(/\*/g, ''); // Convert markdown bold to clean text for non-markdown targets if needed, but standard clients support asterisk markdown! Let's keep asterisks for Telegram/WhatsApp bold markup.
    navigator.clipboard.writeText(getActiveTextReport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="bg-[#0d1015] border border-white/5 rounded-2xl p-5 shadow-xl flex flex-col justify-between h-full relative overflow-hidden group">
      {/* Background radial highlight */}
      <div className="absolute -right-32 -bottom-32 w-64 h-64 bg-[#00f294]/5 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#00f294]" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white font-sans">
              Share & Export Center
            </h2>
          </div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#00f294]/80 px-2 py-0.5 rounded border border-[#00f294]/20 bg-[#00f294]/5 select-none">
            VIP READY
          </span>
        </div>

        {/* Custom Branding Handle Input */}
        <div>
          <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-1.5">
            Group/Channel link or name (Branding Handle)
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white/30 text-xs pointer-events-none font-mono">
              🔗
            </span>
            <input
              type="text"
              placeholder="e.g. @MyVIPSignalChannel"
              value={brandingText}
              onChange={(e) => setBrandingText(e.target.value)}
              className="w-full bg-[#06080a] border border-white/5 rounded-lg pl-8 pr-3 py-2 text-xs text-white font-mono placeholder-white/20 focus:outline-none focus:border-[#00f294] focus:ring-1 focus:ring-[#00f294]/20 transition-all duration-200"
            />
          </div>
        </div>

        {/* Template Select Tabs */}
        <div>
          <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-1.5">
            Select Message Layout
          </label>
          <div className="grid grid-cols-3 gap-1.5 bg-[#06080a] p-1 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => setActiveTab('telegram')}
              className={`py-1.5 px-1 rounded-lg text-[10px] font-bold font-mono transition-all duration-200 flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                activeTab === 'telegram'
                  ? 'bg-[#00f294]/10 text-[#00f294] border border-[#00f294]/20'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.02] border border-transparent'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Telegram VIP</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bangla')}
              className={`py-1.5 px-1 rounded-lg text-[10px] font-bold font-mono transition-all duration-200 flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                activeTab === 'bangla'
                  ? 'bg-[#00f294]/10 text-[#00f294] border border-[#00f294]/20'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.02] border border-transparent'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Bangla Style</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('minimal')}
              className={`py-1.5 px-1 rounded-lg text-[10px] font-bold font-mono transition-all duration-200 flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                activeTab === 'minimal'
                  ? 'bg-[#00f294]/10 text-[#00f294] border border-[#00f294]/20'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.02] border border-transparent'
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
              <span>Minimal Pro</span>
            </button>
          </div>
        </div>

        {/* Live Scrollable Render Preview Box */}
        <div>
          <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-1.5">
            Instant Copy Preview
          </label>
          <div className="relative group">
            <pre className="w-full h-44 bg-[#06080a] border border-white/5 rounded-xl p-3 text-[10px] text-white/60 font-mono overflow-y-auto whitespace-pre-wrap leading-relaxed select-all scrollbar-thin scrollbar-thumb-white/10">
              {getActiveTextReport()}
            </pre>
            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span className="text-[9px] bg-[#0d1015] border border-white/10 px-2 py-0.5 rounded text-white/40 font-mono">
                Click text to select all
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Copy Action Button with pulse highlight */}
      <div className="mt-4 space-y-2 relative z-10 shrink-0">
        <button
          type="button"
          onClick={copyToClipboard}
          className="w-full bg-[#00f294] hover:bg-[#00f294]/90 text-black font-semibold py-2.5 px-4 rounded-xl font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#00f294]/10 cursor-pointer transition-all duration-200 active:translate-y-px glowing-btn-emerald"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              <span>COP-IED DESIGN! READY UNTO VIP 👑</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>COPY BEAUTIFIED REPORT (SHARE) 🚀</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={printReceipt}
          className="w-full bg-[#06080a] hover:bg-[#1b1e22] text-white/60 hover:text-white font-mono text-[10.5px] font-bold py-2 px-3 rounded-xl border border-white/5 flex items-center justify-center gap-1.5 active:translate-y-px duration-200 cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5 text-[#00f294]" />
          <span>Print Physical Receipt</span>
        </button>
      </div>

      <p className="text-[10px] text-white/30 text-center font-sans mt-3.5 leading-normal">
        Your copied report is formatted with native Markdown bolding and selected emoji profiles, perfect for straight paste into Telegram VIP directories or WhatsApp groups.
      </p>

      {/* Legacy Receipt Container hidden except during print workflow */}
      <div id="orin-receipt-card" className="hidden print:block absolute inset-0 bg-white text-black p-8 z-50">
        <div className="border-b border-zinc-300 pb-4 mb-4">
          <h1 className="font-bold text-xl uppercase tracking-wider text-center">ORIN AUTOMATED TRADE SYSTEM</h1>
          <h3 className="font-semibold text-center text-zinc-500 text-sm">Automated Trade Execution Verifier</h3>
        </div>
        <div className="space-y-3 font-mono text-xs">
          <div className="flex justify-between"><span>DATE STAMP</span><span>{settings.seedDate}</span></div>
          <div className="flex justify-between"><span>MARKET SETTING</span><span>{settings.otcMode ? 'OTC MARKET [FAST INDEX]' : 'STANDARD REALTIME'}</span></div>
          <div className="flex justify-between"><span>INITIAL POSITION</span><span>${settings.stake} USD</span></div>
          <div className="flex justify-between"><span>MTG MAX STEPS</span><span>Level {settings.maxMtg} ({settings.mtgMultiplier}x)</span></div>
          <div className="border-t border-zinc-300 py-2"></div>
          <div className="flex justify-between"><span>TOTAL EVALUATED</span><span>{summary.totalSignals} signals</span></div>
          <div className="flex justify-between font-bold text-emerald-700"><span>DIRECT WIN SOLVES</span><span>{summary.directWins}</span></div>
          <div className="flex justify-between font-bold text-emerald-600"><span>MTG 1 ACTIONS</span><span>{summary.mtg1Wins}</span></div>
          <div className="flex justify-between font-bold text-emerald-500"><span>MTG 2 ACTIONS</span><span>{summary.mtg2Wins}</span></div>
          <div className="flex justify-between font-bold text-red-605"><span>FAILED ACTION LOSSES</span><span>{summary.losses}</span></div>
          <div className="border-t border-zinc-300 py-2"></div>
          <div className="flex justify-between items-center bg-gray-100 p-2 rounded">
            <span className="font-bold uppercase">Accuracy Score</span>
            <span className="text-base font-black">{summary.accuracyRate}%</span>
          </div>
          <div className="flex justify-between items-center bg-gray-100 p-2 rounded mt-2">
            <span className="font-bold uppercase">Net Result</span>
            <span className="text-base font-black">{summary.netProfit >= 0 ? '+' : ''}${summary.netProfit.toFixed(2)} USD</span>
          </div>
        </div>
        <div className="text-center text-[8px] text-zinc-400 mt-10 uppercase tracking-wider">
          Orin Compliance Protocol Verified. Simulation calculations are non-discretionary.
        </div>
      </div>
    </div>
  );
};
