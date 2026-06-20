import React from 'react';
import { Upload, FileText, ClipboardList, CheckCircle, Flame, Sparkles } from 'lucide-react';
import { 
  parseRawSignals, 
  SAMPLE_SIGNALS_PROFITABLE, 
  SAMPLE_SIGNALS_OTC, 
  SAMPLE_SIGNALS_DIVERSE_FORMAT 
} from '../utils/signalParser';
import { Signal } from '../types';

interface SignalInputProps {
  onParsedSignals: (signals: Signal[], count: number) => void;
  initialText?: string;
}

export const SignalInput: React.FC<SignalInputProps> = ({ onParsedSignals, initialText = '' }) => {
  const [inputText, setInputText] = React.useState(initialText);
  const [parsedCount, setParsedCount] = React.useState<number | null>(null);
  const [activePreset, setActivePreset] = React.useState<string | null>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (initialText) {
      setInputText(initialText);
      const parsed = parseRawSignals(initialText);
      setParsedCount(parsed.length);
    }
  }, [initialText]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputText(value);
    setActivePreset(null);
    const parsed = parseRawSignals(value);
    setParsedCount(parsed.length);
  };

  const handlePresetSelect = (presetType: 'real' | 'otc' | 'diverse') => {
    let presetText = '';
    let label = '';
    if (presetType === 'real') {
      presetText = SAMPLE_SIGNALS_PROFITABLE;
      label = 'real';
    } else if (presetType === 'otc') {
      presetText = SAMPLE_SIGNALS_OTC;
      label = 'otc';
    } else {
      presetText = SAMPLE_SIGNALS_DIVERSE_FORMAT;
      label = 'diverse';
    }
    
    setInputText(presetText);
    setActivePreset(label);
    const parsed = parseRawSignals(presetText);
    setParsedCount(parsed.length);
    onParsedSignals(parsed, parsed.length);
  };

  const executeParsing = () => {
    const parsed = parseRawSignals(inputText);
    setParsedCount(parsed.length);
    onParsedSignals(parsed, parsed.length);
  };

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setInputText(text);
      setActivePreset(null);
      const parsed = parseRawSignals(text);
      setParsedCount(parsed.length);
      onParsedSignals(parsed, parsed.length);
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-[#0d1015] border border-white/5 rounded-2xl p-5 shadow-xl flex flex-col h-full justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#00f294]" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white font-sans">
              Signal Input Terminal
            </h2>
          </div>
          {parsedCount !== null && parsedCount > 0 && (
            <span className="text-[10px] bg-[#00f294]/10 text-[#00f294] font-mono px-2.5 py-1 rounded-full border border-[#00f294]/20 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              {parsedCount} Verified Signals
            </span>
          )}
        </div>

        {/* Preset Buttons */}
        <div className="grid grid-cols-3 gap-2 mb-3 shrink-0">
          <button
            type="button"
            onClick={() => handlePresetSelect('real')}
            className={`py-1.5 px-2 rounded-lg border text-left flex flex-col justify-between transition-all duration-200 cursor-pointer ${
              activePreset === 'real'
                ? 'bg-[#00f294]/10 border-[#00f294]/30 text-[#00f294]'
                : 'bg-[#06080a] border-white/5 hover:border-white/10 text-white/50 hover:text-white'
            }`}
          >
            <span className="text-[10px] font-mono leading-none font-bold uppercase tracking-wider">Demo Real</span>
            <span className="text-[8px] opacity-75 mt-0.5">FX Pairs (8)</span>
          </button>
          
          <button
            type="button"
            onClick={() => handlePresetSelect('otc')}
            className={`py-1.5 px-2 rounded-lg border text-left flex flex-col justify-between transition-all duration-200 cursor-pointer ${
              activePreset === 'otc'
                ? 'bg-[#00f294]/10 border-[#00f294]/30 text-[#00f294]'
                : 'bg-[#06080a] border-white/5 hover:border-white/10 text-white/50 hover:text-white'
            }`}
          >
            <span className="text-[10px] font-mono leading-none font-bold uppercase tracking-wider flex items-center gap-0.5">
              Demo OTC <Flame className="w-2.5 h-2.5 text-orange-400 inline-block fill-orange-400" />
            </span>
            <span className="text-[8px] opacity-75 mt-0.5 animate-pulse">Volatility (8)</span>
          </button>

          <button
            type="button"
            onClick={() => handlePresetSelect('diverse')}
            className={`py-1.5 px-2 rounded-lg border text-left flex flex-col justify-between transition-all duration-200 cursor-pointer ${
              activePreset === 'diverse'
                ? 'bg-[#00f294]/10 border-[#00f294]/30 text-[#00f294]'
                : 'bg-[#06080a] border-white/5 hover:border-white/10 text-white/50 hover:text-white'
            }`}
          >
            <span className="text-[10px] font-mono leading-none font-bold uppercase tracking-wider flex items-center gap-0.5">
              Super-Parser <Sparkles className="w-2.5 h-2.5 text-blue-400 inline-block" />
            </span>
            <span className="text-[8px] opacity-75 mt-0.5">Fuzzy Delimiters</span>
          </button>
        </div>

        {/* Text Area Input */}
        <div className="relative">
          <textarea
            value={inputText}
            onChange={handleTextChange}
            placeholder="Paste your signals block here. Supported format:&#10;10:05 | EUR/USD | CALL&#10;10:10 | GBP/JPY | PUT&#10;12:20 | USD/JPY-OTC | CALL"
            className="w-full h-56 bg-[#06080a] border border-white/5 rounded-xl px-4 py-3 text-white text-xs font-mono focus:outline-none focus:border-[#00f294] focus:ring-1 focus:ring-[#00f294]/20 placeholder-white/15 resize-none leading-relaxed transition-all duration-200"
          />
        </div>

        {/* Drag and Drop File Overlay Area */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-3 py-3 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 ${
            dragActive
              ? 'border-[#00f294] bg-[#00f294]/5 text-[#00f294]'
              : 'border-white/5 hover:border-[#00f294]/30 text-white/30 hover:text-[#00f294]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
          {dragActive ? (
            <>
              <Upload className="w-4 h-4 animate-bounce" />
              <span className="text-[10.5px] font-mono">Drop your file here!</span>
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              <span className="text-[10.5px] font-mono">Upload CSV / TXT or drag here</span>
            </>
          )}
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-white/5 shrink-0">
        <button
          type="button"
          onClick={executeParsing}
          disabled={!inputText.trim()}
          className="w-full bg-[#00f294] hover:bg-[#00f294]/90 disabled:bg-white/[0.02] text-black disabled:text-white/20 font-semibold py-2.5 px-4 rounded-xl font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-[#00f294]/10 cursor-pointer transition-all duration-200 active:translate-y-px glowing-btn-emerald"
        >
          <ClipboardList className="w-4 h-4" />
          Load and Backtest Signals
        </button>
      </div>
    </div>
  );
};
