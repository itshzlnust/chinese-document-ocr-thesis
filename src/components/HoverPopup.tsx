import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DocumentWordToken } from '../types';
import { DictionaryService } from '../services/dictionary';
import { HanziVGService } from '../services/hanzivg';
import { NMTTranslationService } from '../services/nmtTranslationService';
import {
  Volume2, Bookmark, BookmarkCheck, RotateCcw,
  BookOpen, PenTool, Sparkles, MessageSquare,
  FileText, MapPin, X, Copy, Check,
  ChevronLeft, ChevronRight, Zap, Bot, RefreshCw
} from 'lucide-react';

interface HoverPopupProps {
  token: DocumentWordToken;
  position: { x: number; y: number };
  onClose: () => void;
  onToggleFlashcard: (token: DocumentWordToken) => void;
  isSavedInFlashcard: boolean;
}

type PopupSubTab = 'dictionary' | 'strokes' | 'grammar' | 'examples';

const isChinese = (text: string) => /[\u4e00-\u9fa5]/.test(text);

/** Compute ideal popup width for a Latin text token based on text length */
function computeLatinPopupWidth(text: string): number {
  const len = text.length;
  if (len <= 8)  return 240;
  if (len <= 18) return 280;
  if (len <= 36) return 340;
  if (len <= 60) return 380;
  return 420;
}

export const HoverPopup: React.FC<HoverPopupProps> = ({
  token,
  position,
  onClose,
  onToggleFlashcard,
  isSavedInFlashcard,
}) => {
  const [subTab, setSubTab] = useState<PopupSubTab>('dictionary');
  const [strokeAnimKey, setStrokeAnimKey] = useState(0);
  const [isPlayingStrokes, setIsPlayingStrokes] = useState(true);
  const [animSpeed] = useState(1.2);
  const [showNumbers, setShowNumbers] = useState(true);
  const [copied, setCopied] = useState(false);
  const [charIndex, setCharIndex] = useState(0);
  const [nmtResult, setNmtResult] = useState<string | null>(null);
  const [nmtLoading, setNmtLoading] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  const isChineseToken = isChinese(token.chinese);

  // Extract individual Hanzi characters from the token (e.g. "汉字" → ['汉','字'])
  const hanziChars = Array.from(token.chinese).filter((c) => /[\u4e00-\u9fa5]/.test(c));
  const activeChar = hanziChars[charIndex] ?? token.chinese.charAt(0);
  const strokesData = HanziVGService.getStrokesForCharacter(activeChar);

  // Compute width: Chinese tokens always use 420px (need space for tabs + HanziVG canvas)
  // Latin tokens scale to fit text content
  const popupWidth = isChineseToken ? 420 : computeLatinPopupWidth(token.chinese);

  useEffect(() => {
    setSubTab('dictionary');
    setStrokeAnimKey((prev) => prev + 1);
    setIsPlayingStrokes(true);
    setCopied(false);
    setCharIndex(0);
    setNmtResult(null);   // clear NMT result on new token
  }, [token.id]);

  const handleNMTTranslate = useCallback(async () => {
    setNmtLoading(true);
    const result = await NMTTranslationService.translate(token.chinese, 'zh-en');
    setNmtResult(result.translated);
    setNmtLoading(false);
  }, [token.chinese]);

  // When character index changes, auto-replay
  useEffect(() => {
    setStrokeAnimKey((prev) => prev + 1);
    setIsPlayingStrokes(true);
  }, [charIndex]);

  // Clamp position to keep popup fully inside viewport
  const leftPx = Math.min(
    Math.max(12, position.x - popupWidth / 2),
    window.innerWidth - popupWidth - 12
  );
  // For Latin tokens: short popup, so allow closer to bottom
  const estimatedHeight = isChineseToken ? 520 : 260;
  const topPx = Math.min(position.y + 14, window.innerHeight - estimatedHeight - 12);

  const handlePlayAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    DictionaryService.speak(token.chinese, isChineseToken ? 'zh-CN' : 'id-ID');
  };

  const handleReplayStrokes = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStrokeAnimKey((prev) => prev + 1);
    setIsPlayingStrokes(true);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(token.chinese);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      ref={popupRef}
      className="fixed z-50 rounded-2xl shadow-2xl shadow-black/60 text-slate-100 overflow-hidden"
      style={{
        left: `${leftPx}px`,
        top: `${topPx}px`,
        width: `${popupWidth}px`,
        background: 'rgba(10, 14, 28, 0.97)',
        border: isChineseToken
          ? '1px solid rgba(239,68,68,0.40)'
          : '1px solid rgba(99,102,241,0.40)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        animation: 'fadeInScale 0.15s ease-out both',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>

      {/* ══════════════════ HEADER ══════════════════ */}
      <div
        className="p-3 flex items-center justify-between gap-2"
        style={{
          background: isChineseToken
            ? 'linear-gradient(135deg, rgba(127,29,29,0.45) 0%, rgba(15,23,42,0.6) 100%)'
            : 'linear-gradient(135deg, rgba(49,46,129,0.45) 0%, rgba(15,23,42,0.6) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* ── CHINESE header ── */}
        {isChineseToken ? (
          <>
            <div className="flex items-center gap-3">
              {/* Character box */}
              <div
                className="relative shrink-0 w-14 h-14 flex items-center justify-center rounded-xl shadow-inner"
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  border: '1.5px solid rgba(239,68,68,0.5)',
                }}
              >
                <span className="text-3xl font-bold font-chinese text-red-400 leading-none">
                  {token.chinese}
                </span>
                <button
                  onClick={handlePlayAudio}
                  className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg transition-transform hover:scale-110"
                >
                  <Volume2 className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-100 tracking-wide leading-none">
                    {token.pinyin}
                  </h2>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/35 rounded-full">
                    HSK {token.hskLevel}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Radikal: <span className="text-slate-200 font-medium">{token.radical}</span>
                </p>
              </div>
            </div>

            {/* Right action buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={handleCopyText}
                className="p-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
                title="Salin"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => onToggleFlashcard(token)}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isSavedInFlashcard
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-slate-800/70 border-slate-700 text-slate-400 hover:text-amber-300'
                }`}
                title={isSavedInFlashcard ? 'Hapus dari Flashcards' : 'Simpan ke Flashcards'}
              >
                {isSavedInFlashcard ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
              </button>
              <button onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-800/70 hover:bg-red-900/50 text-slate-400 hover:text-red-300 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        ) : (
          /* ── LATIN header — full width scanned text display ── */
          <div className="flex items-start justify-between gap-2 w-full">
            <div className="flex-1 min-w-0 space-y-1.5">
              {/* Scanned text — the star of the show */}
              <p className="text-sm font-semibold text-slate-100 leading-snug break-words">
                {token.chinese}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full flex items-center gap-1">
                  <FileText className="w-2.5 h-2.5" />
                  MonkeyOCR v2
                </span>
                {token.bbox && (
                  <span className="flex items-center gap-0.5 text-[10px] text-slate-500">
                    <MapPin className="w-2.5 h-2.5 text-indigo-400" />
                    {token.bbox.x.toFixed(1)}%, {token.bbox.y.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>

            {/* Compact action buttons */}
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={handlePlayAudio}
                className="p-1.5 rounded-lg bg-indigo-700/40 hover:bg-indigo-600/50 text-indigo-300 transition-colors"
                title="Dengarkan"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleCopyText}
                className="p-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
                title="Salin teks"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-800/70 hover:bg-red-900/50 text-slate-400 hover:text-red-300 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════ LATIN BODY — compact, no tabs ══════════════════ */}
      {!isChineseToken && (
        <div className="p-3 space-y-2">
          {/* Indonesian context */}
          <div className="p-2.5 rounded-xl space-y-0.5"
            style={{ background: 'rgba(49,46,129,0.15)', border: '1px solid rgba(99,102,241,0.20)' }}>
            <span className="text-[9px] font-semibold text-indigo-400 uppercase tracking-wider">
              Keterangan
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">{token.indonesianDef}</p>
          </div>

          {/* Position info — only if meaningful */}
          {token.bbox && (
            <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
              <span>Posisi dokumen: ({token.bbox.x.toFixed(1)}%, {token.bbox.y.toFixed(1)}%)</span>
              <span>W:{token.bbox.width.toFixed(1)}% H:{token.bbox.height.toFixed(1)}%</span>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════ CHINESE TABS ══════════════════ */}
      {isChineseToken && (
        <>
          <div
            className="flex p-1 gap-0.5 text-xs"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)' }}
          >
            {([
              { key: 'dictionary', icon: BookOpen, label: 'Kamus' },
              { key: 'strokes',    icon: PenTool,  label: 'HanziVG' },
              { key: 'grammar',    icon: Sparkles,  label: 'Grammar' },
              { key: 'examples',   icon: MessageSquare, label: 'Kalimat' },
            ] as { key: PopupSubTab; icon: React.FC<{ className?: string }>; label: string }[]).map(
              ({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setSubTab(key)}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 font-medium transition-all ${
                    subTab === key
                      ? 'bg-red-600/30 text-red-300 border border-red-500/40'
                      : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              )
            )}
          </div>

          <div className="p-3 space-y-2.5 min-h-[200px] max-h-[270px] overflow-y-auto">

            {/* DICTIONARY */}
            {subTab === 'dictionary' && (
              <div className="space-y-2 text-xs">
                {/* CC-CEDICT static definitions */}
                <div className="p-3 rounded-xl space-y-1"
                  style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                    🇮🇩 Bahasa Indonesia (CC-CEDICT)
                  </span>
                  <p className="text-sm font-semibold text-slate-100 leading-relaxed">
                    {token.indonesianDef}
                  </p>
                </div>
                <div className="p-3 rounded-xl space-y-1"
                  style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                    🇬🇧 English Definition (CC-CEDICT)
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">{token.englishDef}</p>
                </div>

                {/* NMT Real-time Translation */}
                <div className="rounded-xl overflow-hidden"
                  style={{ border: '1px solid rgba(99,102,241,0.30)' }}>
                  <div className="px-3 py-2 flex items-center justify-between"
                    style={{ background: 'rgba(49,46,129,0.25)' }}>
                    <span className="text-[9px] font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                      <Bot className="w-3 h-3" /> Helsinki-NLP NMT (ZH→EN)
                    </span>
                    <button
                      onClick={handleNMTTranslate}
                      disabled={nmtLoading}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all"
                      style={{
                        background: nmtLoading ? 'rgba(30,41,59,0.6)' : 'rgba(99,102,241,0.25)',
                        border: '1px solid rgba(99,102,241,0.40)',
                        color: nmtLoading ? '#64748b' : '#a5b4fc',
                      }}
                    >
                      {nmtLoading
                        ? <><RefreshCw className="w-2.5 h-2.5 animate-spin" /> Menerjemahkan...</>
                        : <><Zap className="w-2.5 h-2.5" /> {nmtResult ? 'Ulangi' : 'Terjemahkan'}</>
                      }
                    </button>
                  </div>
                  <div className="px-3 py-2.5" style={{ background: 'rgba(15,23,42,0.7)' }}>
                    {nmtResult ? (
                      <p className="text-xs text-indigo-100 leading-relaxed font-medium">{nmtResult}</p>
                    ) : (
                      <p className="text-[10px] text-slate-600 italic">
                        Klik "Terjemahkan" untuk terjemahan NMT real-time via Helsinki-NLP
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* HANZIVG */}
            {subTab === 'strokes' && (
              <div className="space-y-2">

                {/* ── Character pills (only shown when token has 2+ Hanzi chars) ── */}
                {hanziChars.length > 1 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {hanziChars.map((ch, i) => (
                      <button
                        key={i}
                        onClick={() => setCharIndex(i)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-bold font-chinese transition-all ${
                          i === charIndex
                            ? 'bg-red-600/40 text-red-200 border border-red-500/60 shadow-lg shadow-red-900/30'
                            : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:text-slate-200 hover:bg-slate-700/60'
                        }`}
                      >
                        <span>{ch}</span>
                        <span className={`text-[9px] font-mono ${
                          i === charIndex ? 'text-red-400' : 'text-slate-600'
                        }`}>{i + 1}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* ── Top control bar ── */}
                <div className="flex items-center justify-between text-xs text-slate-400">
                  {/* Left: active char + stroke count */}
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold font-chinese text-slate-200 leading-none">
                      {activeChar}
                    </span>
                    <span className="text-slate-500">
                      {strokesData.strokes.length} stroke
                      {hanziChars.length > 1 && (
                        <span className="ml-1 text-[10px] text-red-400/70">
                          ({charIndex + 1}/{hanziChars.length})
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Right: controls */}
                  <div className="flex items-center gap-1">
                    <button onClick={handleReplayStrokes}
                      className="px-2 py-1 rounded-lg flex items-center gap-1 text-slate-200 transition-colors"
                      style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <RotateCcw className="w-3 h-3" /><span>Replay</span>
                    </button>
                    <button
                      onClick={() => setShowNumbers(!showNumbers)}
                      className={`px-2 py-1 rounded-lg border text-xs transition-colors ${
                        showNumbers
                          ? 'bg-red-500/20 text-red-300 border-red-500/40'
                          : 'text-slate-400 border-slate-700'
                      }`}
                      style={!showNumbers ? { background: 'rgba(30,41,59,0.8)' } : {}}
                    >
                      # No.
                    </button>
                  </div>
                </div>

                {/* ── Stroke canvas ── */}
                <div className="relative w-full rounded-xl overflow-hidden"
                  style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.07)', height: '160px' }}>

                  {/* Tianzige grid */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100"
                    style={{ stroke: 'rgba(100,116,139,0.22)', fill: 'none' }}>
                    <line x1="0" y1="50" x2="100" y2="50" strokeDasharray="2,2" />
                    <line x1="50" y1="0" x2="50" y2="100" strokeDasharray="2,2" />
                    <line x1="0" y1="0" x2="100" y2="100" strokeDasharray="1,4" />
                    <line x1="100" y1="0" x2="0" y2="100" strokeDasharray="1,4" />
                    <rect x="5" y="5" width="90" height="90" />
                  </svg>

                  {/* Stroke animation */}
                  <svg key={strokeAnimKey} viewBox="0 0 1024 1024"
                    className="absolute inset-0 m-auto w-32 h-32 z-10"
                    style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                  >
                    {strokesData.strokes.map((pathStr, index) => {
                      const delay = (index * 0.4).toFixed(2);
                      return (
                        <g key={index}>
                          {/* Ghost */}
                          <path d={pathStr} fill="none" stroke="rgba(239,68,68,0.10)"
                            strokeWidth="52" strokeLinecap="round" strokeLinejoin="round" />
                          {/* Animated stroke */}
                          <path d={pathStr} fill="none" stroke="#EF4444"
                            strokeWidth="50" strokeLinecap="round" strokeLinejoin="round"
                            strokeDasharray="1500" strokeDashoffset="1500"
                            style={{
                              animation: isPlayingStrokes
                                ? `strokeDraw ${animSpeed}s ease-in-out ${delay}s forwards`
                                : 'none',
                            }}
                          />
                          {showNumbers && (
                            <text
                              x={parseInt(pathStr.split(',')[0].replace(/[^0-9]/g, '')) || 100}
                              y={(parseInt(pathStr.split(',')[1]) || 100) - 60}
                              fill="#F59E0B" fontSize="68" fontWeight="bold" opacity="0.85"
                            >
                              {index + 1}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>

                  {/* Prev / Next arrow buttons — only when multi-char */}
                  {hanziChars.length > 1 && (
                    <>
                      <button
                        onClick={() => setCharIndex((i) => Math.max(0, i - 1))}
                        disabled={charIndex === 0}
                        className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-lg transition-all"
                        style={{
                          background: charIndex === 0 ? 'rgba(30,41,59,0.3)' : 'rgba(30,41,59,0.85)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          opacity: charIndex === 0 ? 0.3 : 1,
                        }}
                        title="Karakter sebelumnya"
                      >
                        <ChevronLeft className="w-4 h-4 text-slate-300" />
                      </button>

                      <button
                        onClick={() => setCharIndex((i) => Math.min(hanziChars.length - 1, i + 1))}
                        disabled={charIndex === hanziChars.length - 1}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-lg transition-all"
                        style={{
                          background: charIndex === hanziChars.length - 1 ? 'rgba(30,41,59,0.3)' : 'rgba(30,41,59,0.85)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          opacity: charIndex === hanziChars.length - 1 ? 0.3 : 1,
                        }}
                        title="Karakter berikutnya"
                      >
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </button>

                      {/* Dot indicator */}
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-20">
                        {hanziChars.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCharIndex(i)}
                            className="transition-all rounded-full"
                            style={{
                              width: i === charIndex ? '16px' : '6px',
                              height: '6px',
                              background: i === charIndex ? '#ef4444' : 'rgba(100,116,139,0.5)',
                            }}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* GRAMMAR */}
            {subTab === 'grammar' && (
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl space-y-1.5"
                  style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <span className="text-[9px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Penggunaan & Tata Bahasa
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed">{token.grammarNotes}</p>
                </div>
                <div className="p-2.5 rounded-xl space-y-1"
                  style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Radikal</span>
                  <p className="text-xs text-slate-300">{token.radical}</p>
                </div>
              </div>
            )}

            {/* EXAMPLES */}
            {subTab === 'examples' && (
              <div className="space-y-2 text-xs">
                {token.examples.length === 0 ? (
                  <p className="text-slate-400 text-center py-8 text-sm">Tidak ada contoh kalimat.</p>
                ) : (
                  token.examples.map((ex) => (
                    <div key={ex.id} className="p-3 rounded-xl space-y-1.5"
                      style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <p className="font-bold text-slate-100 font-chinese text-sm leading-relaxed">{ex.chinese}</p>
                      <p className="text-[11px] text-amber-400 font-medium">{ex.pinyin}</p>
                      <p className="text-xs text-slate-300 leading-relaxed">{ex.indonesian}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ══════════════════ FOOTER ══════════════════ */}
      <div
        className="px-3 py-1.5 flex items-center justify-between text-[10px] text-slate-600"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.4)' }}
      >
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          MonkeyOCR v2{isChineseToken ? ' + HanziVG' : ''}
        </span>
        <button onClick={onClose} className="hover:text-slate-300 transition-colors">
          Esc untuk tutup
        </button>
      </div>
    </div>
  );
};
