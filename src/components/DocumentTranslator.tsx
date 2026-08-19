import React, { useState, useCallback, useEffect } from 'react';
import {
  Languages, Columns, Layers, Copy, Check, Download,
  Sparkles, FileText, ArrowRight,
  RefreshCw, Zap, Globe, ChevronDown, Bot, AlertCircle
} from 'lucide-react';
import { NMTTranslationService, TranslationDirection } from '../services/nmtTranslationService';

interface TranslatedBlock {
  id: string;
  original: string;
  translated: string;
  timeMs?: number;
  source: 'nmt-backend' | 'fallback';
}

export const DocumentTranslator: React.FC = () => {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'overlay'>('side-by-side');
  const [direction, setDirection] = useState<TranslationDirection>('zh-en');
  const [inputText, setInputText] = useState(
    '学习汉字是一项很有趣的挑战。通过文档识别系统，学生可以快速提高阅读能力。\n\n本系统使用MonkeyOCR v2进行文档布局分析，并结合Helsinki-NLP神经机器翻译模型，实现高质量的中英文翻译。'
  );
  const [blocks, setBlocks] = useState<TranslatedBlock[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [backendStatus, setBackendStatus] = useState<{
    online: boolean; model: string; zhEnLoaded: boolean; enZhLoaded: boolean;
  }>({ online: false, model: '...', zhEnLoaded: false, enZhLoaded: false });
  const [copied, setCopied] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  // Check backend on mount
  useEffect(() => {
    NMTTranslationService.checkBackend().then(setBackendStatus);
    const interval = setInterval(
      () => NMTTranslationService.checkBackend().then(setBackendStatus),
      10000
    );
    return () => clearInterval(interval);
  }, []);

  const handleTranslate = useCallback(async () => {
    const lines = inputText.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;

    setIsTranslating(true);
    setBlocks([]);

    // Translate paragraph by paragraph for real layout preservation
    const batch = await NMTTranslationService.translateBatch(lines, direction);

    setBlocks(
      batch.results.map((r, i) => ({
        id: `blk-${i}`,
        original: r.original,
        translated: r.translated,
        timeMs: r.timeMs,
        source: r.source,
      }))
    );
    setIsTranslating(false);
  }, [inputText, direction]);

  const fullTranslatedText = blocks.map(b => b.translated).join('\n\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(fullTranslatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const label = direction === 'zh-en' ? 'ZH_to_EN' : 'EN_to_ZH';
    const blob = new Blob(
      [`NEURAL MACHINE TRANSLATION — Helsinki-NLP\n${'─'.repeat(50)}\n\nOriginal:\n${inputText}\n\n${'─'.repeat(50)}\n\nTranslation (${label}):\n${fullTranslatedText}`],
      { type: 'text/plain' }
    );
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `NMT_Translation_${label}_${Date.now()}.txt`;
    a.click();
  };

  const directionOptions: { value: TranslationDirection; label: string; flag: string }[] = [
    { value: 'zh-en', label: 'ZH → EN', flag: '🇨🇳→🇬🇧' },
    { value: 'en-zh', label: 'EN → ZH', flag: '🇬🇧→🇨🇳' },
  ];

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950">

      {/* ── Header ── */}
      <div className="h-16 px-6 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/25">
            <Languages className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="font-bold text-slate-100 text-sm tracking-wide">
              Neural Machine Translation
            </h2>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <Bot className="w-3 h-3 text-indigo-400" />
              Helsinki-NLP/opus-mt-zh-en · Bidirectional
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Backend status pill */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-medium ${
            backendStatus.online
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-slate-800/60 border-slate-700 text-slate-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${backendStatus.online ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            {backendStatus.online
              ? `NMT Online — ${backendStatus.zhEnLoaded ? 'ZH→EN ✓' : 'Loading...'}`
              : 'Backend Offline'}
          </div>

          {/* Direction selector */}
          <div className="relative">
            <button
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-medium">{directionOptions.find(d => d.value === direction)?.flag}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {showLangDropdown && (
              <div
                className="absolute right-0 top-full mt-1 z-50 rounded-xl overflow-hidden shadow-xl"
                style={{ background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {directionOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setDirection(opt.value); setShowLangDropdown(false); setBlocks([]); }}
                    className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 transition-colors ${
                      direction === opt.value
                        ? 'bg-red-600/20 text-red-300'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-base">{opt.flag}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View toggle */}
          <div className="flex items-center bg-slate-800/80 rounded-xl border border-slate-700 p-1 text-xs">
            {(['side-by-side', 'overlay'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
                  viewMode === mode
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode === 'side-by-side' ? <Columns className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
                <span>{mode === 'side-by-side' ? 'Side-by-Side' : 'Overlay'}</span>
              </button>
            ))}
          </div>

          {blocks.length > 0 && (
            <>
              <button onClick={handleCopy}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              <button onClick={handleDownload}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-red-950/40 transition-all hover:scale-105"
              >
                <Download className="w-4 h-4" />
                <span>Download TXT</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Input panel + Translate button ── */}
      <div
        className="px-6 py-4 border-b border-slate-800/60 space-y-3"
        style={{ background: 'rgba(15,23,42,0.6)' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            Input Teks {direction === 'zh-en' ? 'Mandarin (ZH)' : 'English (EN)'}
          </span>
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Paragraph-level translation dengan layout preservation</span>
          </div>
        </div>

        <div className="relative">
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            rows={5}
            placeholder={
              direction === 'zh-en'
                ? '输入中文文本进行翻译...'
                : 'Enter English text to translate to Chinese...'
            }
            className="w-full rounded-xl p-4 text-sm text-slate-200 resize-none outline-none font-chinese leading-relaxed placeholder:text-slate-600"
            style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.07)',
              caretColor: '#ef4444',
            }}
          />
          <div className="absolute bottom-3 right-3 text-[10px] text-slate-600">
            {inputText.length} karakter · {inputText.split('\n').filter(Boolean).length} paragraf
          </div>
        </div>

        <button
          onClick={handleTranslate}
          disabled={isTranslating || !inputText.trim()}
          className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{
            background: isTranslating
              ? 'rgba(30,41,59,0.8)'
              : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
            boxShadow: isTranslating ? 'none' : '0 4px 24px rgba(220,38,38,0.35)',
          }}
        >
          {isTranslating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Menerjemahkan dengan Helsinki-NLP...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>
                Terjemahkan {direction === 'zh-en' ? 'ZH → EN' : 'EN → ZH'}
                {backendStatus.online ? ' (NMT)' : ' (Fallback)'}
              </span>
            </>
          )}
        </button>

        {!backendStatus.online && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-amber-500/8 border border-amber-500/20 text-[11px] text-amber-400">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              Backend offline — menjalankan fallback dictionary.
              Untuk NMT nyata: <code className="bg-slate-800 px-1 rounded">python server.py</code>
            </span>
          </div>
        )}
      </div>

      {/* ── Translation Results ── */}
      <div className="flex-1 p-6 overflow-y-auto">
        {blocks.length === 0 && !isTranslating && (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-3">
            <Languages className="w-16 h-16 opacity-20" />
            <p className="text-sm">Masukkan teks dan klik Terjemahkan</p>
            <p className="text-xs text-slate-700">Helsinki-NLP/opus-mt-zh-en · Bidirectional Neural MT</p>
          </div>
        )}

        {isTranslating && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl animate-pulse"
                style={{ background: 'rgba(30,41,59,0.5)', animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        )}

        {blocks.length > 0 && viewMode === 'side-by-side' && (
          <div className="grid grid-cols-2 gap-5">
            {/* Original */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800">
                <FileText className="w-4 h-4 text-slate-500" />
                {direction === 'zh-en' ? 'Teks Asli (ZH)' : 'Original (EN)'}
              </div>
              {blocks.map(b => (
                <div key={b.id} className="p-4 rounded-2xl"
                  style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className={`text-sm leading-relaxed ${direction === 'zh-en' ? 'font-chinese text-slate-200' : 'text-slate-300'}`}>
                    {b.original}
                  </p>
                </div>
              ))}
            </div>

            {/* Translation */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider pb-2 border-b border-red-500/20">
                <span className="flex items-center gap-2 text-red-400">
                  <Languages className="w-4 h-4" />
                  {direction === 'zh-en' ? 'Terjemahan (EN)' : '翻译 (ZH)'}
                </span>
                <span className="text-[10px] font-mono text-slate-500 normal-case">Helsinki-NLP NMT</span>
              </div>
              {blocks.map(b => (
                <div key={b.id} className="p-4 rounded-2xl relative group"
                  style={{ background: 'rgba(127,29,29,0.12)', border: '1px solid rgba(239,68,68,0.20)' }}>
                  <p className={`text-sm leading-relaxed font-medium ${direction === 'zh-en' ? 'text-slate-100' : 'font-chinese text-slate-100'}`}>
                    {b.translated}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono ${
                      b.source === 'nmt-backend'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                    }`}>
                      {b.source === 'nmt-backend' ? '🤖 NMT' : '📖 Fallback'}
                    </span>
                    {b.timeMs && (
                      <span className="text-[9px] text-slate-600">{b.timeMs}ms</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {blocks.length > 0 && viewMode === 'overlay' && (
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="text-center py-3 text-xs text-slate-500 flex items-center justify-center gap-2">
              <Bot className="w-3.5 h-3.5 text-indigo-400" />
              <span>Helsinki-NLP/opus-mt · {blocks.length} paragraf diterjemahkan</span>
            </div>
            {blocks.map(b => (
              <div key={b.id} className="p-5 rounded-2xl space-y-3 relative"
                style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {/* Original */}
                <p className={`text-sm leading-relaxed text-slate-500 line-through ${direction === 'zh-en' ? 'font-chinese' : ''}`}>
                  {b.original}
                </p>
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-red-500 shrink-0" />
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono ${
                    b.source === 'nmt-backend'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-amber-500/15 text-amber-400'
                  }`}>
                    {b.source === 'nmt-backend' ? 'NMT' : 'Fallback'}
                  </span>
                </div>
                {/* Translation */}
                <p className={`text-base font-semibold text-slate-100 leading-relaxed ${direction === 'zh-en' ? '' : 'font-chinese'}`}>
                  {b.translated}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
