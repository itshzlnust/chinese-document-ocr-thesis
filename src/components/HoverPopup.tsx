import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DocumentWordToken, HanziStrokeData } from '../types';
import { DictionaryService } from '../services/dictionary';
import { HanziVGService } from '../services/hanzivg';
import { NMTTranslationService } from '../services/nmtTranslationService';
import { getAccuratePinyin } from '../data/cc_cedict_sample';
import {
  Volume2, Bookmark, BookmarkCheck, RotateCcw,
  BookOpen, PenTool, MessageSquare,
  FileText, X, Copy, Check,
  ChevronLeft, ChevronRight, Zap, Languages, RefreshCw
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
  const [animSpeed] = useState(1.1);
  const [showNumbers, setShowNumbers] = useState(true);
  const [copied, setCopied] = useState(false);
  const [charIndex, setCharIndex] = useState(0);
  const [nmtResult, setNmtResult] = useState<string | null>(null);
  const [nmtLoading, setNmtLoading] = useState(false);
  const [activeDef, setActiveDef] = useState<string>(token.englishDef || token.indonesianDef || '');
  const popupRef = useRef<HTMLDivElement>(null);

  const isChineseToken = isChinese(token.chinese);

  // Extract individual Hanzi characters from token (e.g. "基于" → ['基','于'])
  const hanziChars = Array.from(token.chinese).filter((c) => /[\u4e00-\u9fa5]/.test(c));
  const activeChar = hanziChars[charIndex] ?? token.chinese.charAt(0);

  // Accurate Pinyin resolution (strictly eliminates 'zì zì')
  const displayPinyin =
    token.pinyin && token.pinyin !== 'zì zì' && token.pinyin !== 'zì' && !token.pinyin.includes('zì zì')
      ? token.pinyin
      : getAccuratePinyin(token.chinese);

  // HanziVG stroke data with real stroke paths
  const [strokeData, setStrokeData] = useState<HanziStrokeData>(() =>
    HanziVGService.getStrokesForCharacter(activeChar)
  );

  // Asynchronously fetch authentic stroke vectors on character switch
  useEffect(() => {
    let isMounted = true;
    const initial = HanziVGService.getStrokesForCharacter(activeChar);
    setStrokeData(initial);

    HanziVGService.fetchStrokesForCharacter(activeChar).then((data) => {
      if (isMounted && data) {
        setStrokeData(data);
      }
    });

    return () => { isMounted = false; };
  }, [activeChar]);

  // Compute radical
  const displayRadical =
    token.radical && !token.radical.includes('Manusia / Human')
      ? token.radical
      : HanziVGService.getRadical(activeChar);

  // Width calculation
  const popupWidth = isChineseToken ? 420 : computeLatinPopupWidth(token.chinese);

  // Reset state on token change & auto-enrich definition via NMT if needed
  useEffect(() => {
    setSubTab('dictionary');
    setStrokeAnimKey((prev) => prev + 1);
    setIsPlayingStrokes(true);
    setCopied(false);
    setCharIndex(0);
    setNmtResult(null);

    const rawDef = token.englishDef || token.indonesianDef || '';
    const isGeneric =
      !rawDef ||
      rawDef.startsWith('Chinese vocabulary item:') ||
      rawDef.startsWith('Definition of') ||
      rawDef.startsWith('Arti kosakata');

    if (isChineseToken && isGeneric) {
      setActiveDef('Resolving definition via neural translation...');
      NMTTranslationService.translate(token.chinese, 'zh-en').then((res) => {
        if (res && res.translated) {
          setActiveDef(res.translated);
        } else {
          setActiveDef(rawDef);
        }
      });
    } else {
      setActiveDef(rawDef);
    }
  }, [token.id, token.chinese, token.englishDef, isChineseToken]);

  const handleNMTTranslate = useCallback(async () => {
    setNmtLoading(true);
    const result = await NMTTranslationService.translate(token.chinese, 'zh-en');
    setNmtResult(result.translated);
    setNmtLoading(false);
  }, [token.chinese]);

  // Replay strokes on character switch
  useEffect(() => {
    setStrokeAnimKey((prev) => prev + 1);
    setIsPlayingStrokes(true);
  }, [charIndex]);

  // Viewport clamp
  const leftPx = Math.min(
    Math.max(12, position.x - popupWidth / 2),
    window.innerWidth - popupWidth - 12
  );
  const estimatedHeight = isChineseToken ? 520 : 260;
  const topPx = Math.min(position.y + 14, window.innerHeight - estimatedHeight - 12);

  const handlePlayAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    DictionaryService.speak(token.chinese, isChineseToken ? 'zh-CN' : 'en-US');
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
      className="fixed z-50 rounded-2xl shadow-2xl shadow-black/80 text-slate-100 overflow-hidden font-sans border border-rose-500/30"
      style={{
        left: `${leftPx}px`,
        top: `${topPx}px`,
        width: `${popupWidth}px`,
        background: 'rgba(10, 14, 28, 0.98)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        animation: 'fadeInScale 0.15s ease-out both',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.94) translateY(6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      {/* ══════════════════ HEADER ══════════════════ */}
      <div
        className="p-3 flex items-center justify-between gap-2 border-b border-slate-800/80"
        style={{
          background: isChineseToken
            ? 'linear-gradient(135deg, rgba(159,18,57,0.4) 0%, rgba(15,23,42,0.85) 100%)'
            : 'linear-gradient(135deg, rgba(49,46,129,0.4) 0%, rgba(15,23,42,0.85) 100%)',
        }}
      >
        {isChineseToken ? (
          <>
            <div className="flex items-center gap-3 min-w-0">
              {/* Character Badge with Audio button */}
              <div
                className="relative shrink-0 min-w-[56px] px-2.5 py-1.5 flex items-center justify-center rounded-xl shadow-inner bg-slate-950/80 border border-rose-500/40"
              >
                <span className="text-2xl font-bold font-chinese text-slate-100 leading-none whitespace-nowrap">
                  {token.chinese}
                </span>
                <button
                  onClick={handlePlayAudio}
                  className="absolute -bottom-1.5 -right-1.5 p-1 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition-transform hover:scale-110"
                  title="Pronounce Hanzi"
                >
                  <Volume2 className="w-2.5 h-2.5" />
                </button>
              </div>

              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-rose-300 font-mono tracking-wide leading-none truncate">
                    {displayPinyin}
                  </h2>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-full">
                    HSK {token.hskLevel}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  Radical: <span className="text-slate-200 font-medium">{displayRadical}</span>
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleCopyText}
                className="p-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
                title="Copy character"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => onToggleFlashcard({ ...token, pinyin: displayPinyin, radical: displayRadical, englishDef: activeDef })}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isSavedInFlashcard
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-slate-800/70 border-slate-700 text-slate-400 hover:text-amber-300'
                }`}
                title={isSavedInFlashcard ? 'Saved in Flashcards' : 'Save to Flashcards'}
              >
                {isSavedInFlashcard ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-800/70 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 transition-colors"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        ) : (
          /* Latin Header */
          <div className="flex items-start justify-between gap-2 w-full">
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-sm font-semibold text-slate-100 leading-snug break-words">
                {token.chinese}
              </p>
              <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-400 font-mono">
                <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Scanned Latin Token
                </span>
                {token.bbox && (
                  <span>
                    Pos: ({token.bbox.x.toFixed(1)}%, {token.bbox.y.toFixed(1)}%)
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handlePlayAudio}
                className="p-1.5 rounded-lg bg-indigo-700/40 hover:bg-indigo-600/50 text-indigo-300 transition-colors"
                title="Pronounce"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCopyText}
                className="p-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
                title="Copy text"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-800/70 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════ LATIN BODY ══════════════════ */}
      {!isChineseToken && (
        <div className="p-3 space-y-2 text-xs">
          <div
            className="p-2.5 rounded-xl space-y-0.5 bg-indigo-950/30 border border-indigo-500/20"
          >
            <span className="text-[9px] font-semibold text-indigo-400 uppercase tracking-wider">
              Scanned Context
            </span>
            <p className="text-xs text-slate-200 leading-relaxed break-words">
              {token.chinese}
            </p>
          </div>
          {token.bbox && (
            <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 font-mono">
              <span>Bounding Box: ({token.bbox.x.toFixed(1)}%, {token.bbox.y.toFixed(1)}%)</span>
              <span>W:{token.bbox.width.toFixed(1)}% H:{token.bbox.height.toFixed(1)}%</span>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════ CHINESE TABS ══════════════════ */}
      {isChineseToken && (
        <>
          <div
            className="flex p-1 gap-1 text-xs border-b border-slate-800 bg-slate-950/60"
          >
            {([
              { key: 'dictionary', icon: BookOpen, label: 'Dictionary' },
              { key: 'strokes', icon: PenTool, label: 'HanziVG' },
              { key: 'grammar', icon: FileText, label: 'Grammar' },
              { key: 'examples', icon: MessageSquare, label: 'Examples' },
            ] as { key: PopupSubTab; icon: React.FC<{ className?: string }>; label: string }[]).map(
              ({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setSubTab(key)}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 font-medium transition-all ${
                    subTab === key
                      ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              )
            )}
          </div>

          <div className="p-3 space-y-2.5 min-h-[220px] max-h-[285px] overflow-y-auto">

            {/* TAB 1: DICTIONARY */}
            {subTab === 'dictionary' && (
              <div className="space-y-2 text-xs">
                {/* Primary English Definition */}
                <div
                  className="p-3 rounded-xl space-y-1 bg-slate-900/80 border border-slate-800"
                >
                  <span className="text-[9px] font-semibold text-rose-400 uppercase tracking-wider flex items-center justify-between">
                    <span>English Definition (CC-CEDICT)</span>
                    <span className="text-slate-500 font-mono text-[10px]">{displayPinyin}</span>
                  </span>
                  <p className="text-sm font-semibold text-slate-100 leading-relaxed break-words">
                    {activeDef}
                  </p>
                </div>

                {/* Indonesian Definition (if present and clean) */}
                {token.indonesianDef && !token.indonesianDef.startsWith('Arti kosakata') && (
                  <div
                    className="p-2.5 rounded-xl space-y-0.5 bg-slate-900/50 border border-slate-800/60"
                  >
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                      Indonesian Definition
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">{token.indonesianDef}</p>
                  </div>
                )}

                {/* OPUS-MT Real-time Neural Translation */}
                <div
                  className="rounded-xl overflow-hidden border border-indigo-500/30 bg-slate-900/70"
                >
                  <div
                    className="px-3 py-2 flex items-center justify-between bg-indigo-950/40 border-b border-indigo-500/20"
                  >
                    <span className="text-[9px] font-semibold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Languages className="w-3 h-3 text-indigo-400" /> OPUS-MT Neural Translation (ZH ➔ EN)
                    </span>
                    <button
                      onClick={handleNMTTranslate}
                      disabled={nmtLoading}
                      className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-semibold transition-all bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40"
                    >
                      {nmtLoading ? (
                        <>
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Translating...
                        </>
                      ) : (
                        <>
                          <Zap className="w-2.5 h-2.5" /> {nmtResult ? 'Re-translate' : 'Translate'}
                        </>
                      )}
                    </button>
                  </div>
                  <div className="px-3 py-2.5">
                    {nmtResult ? (
                      <p className="text-xs text-indigo-100 leading-relaxed font-medium">{nmtResult}</p>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">
                        Click "Translate" for real-time neural translation via OPUS-MT
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: HANZIVG STROKE ORDER ANIMATION */}
            {subTab === 'strokes' && (
              <div className="space-y-2">
                {/* Character pills for multi-character compound words */}
                {hanziChars.length > 1 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {hanziChars.map((ch, i) => (
                      <button
                        key={i}
                        onClick={() => setCharIndex(i)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-bold font-chinese transition-all ${
                          i === charIndex
                            ? 'bg-rose-600/40 text-rose-200 border border-rose-500/60 shadow-lg shadow-rose-950/40'
                            : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:text-slate-200 hover:bg-slate-700/60'
                        }`}
                      >
                        <span>{ch}</span>
                        <span className={`text-[10px] font-mono ${
                          i === charIndex ? 'text-rose-400' : 'text-slate-500'
                        }`}>({i + 1}/{hanziChars.length})</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Top stroke details */}
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold font-chinese text-slate-100 leading-none">
                      {activeChar}
                    </span>
                    <span className="text-slate-300 font-mono text-[11px]">
                      {strokeData.strokes.length} strokes · Radical: {HanziVGService.getRadical(activeChar)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleReplayStrokes}
                      className="px-2 py-1 rounded-lg flex items-center gap-1 text-slate-200 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs transition-colors"
                      title="Replay stroke sequence"
                    >
                      <RotateCcw className="w-3 h-3 text-rose-400" />
                      <span>Replay</span>
                    </button>
                    <button
                      onClick={() => setShowNumbers(!showNumbers)}
                      className={`px-2 py-1 rounded-lg border text-xs transition-colors ${
                        showNumbers
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      # No.
                    </button>
                  </div>
                </div>

                {/* Stroke canvas (Tianzige Grid + Exact HanziVG Stroke Vectors) */}
                <div
                  className="relative w-full rounded-xl overflow-hidden bg-slate-950/90 border border-slate-800"
                  style={{ height: '160px' }}
                >
                  {/* Tianzige grid */}
                  <svg
                    className="absolute inset-0 w-full h-full"
                    viewBox="0 0 100 100"
                    style={{ stroke: 'rgba(100,116,139,0.25)', fill: 'none' }}
                  >
                    <line x1="0" y1="50" x2="100" y2="50" strokeDasharray="2,2" />
                    <line x1="50" y1="0" x2="50" y2="100" strokeDasharray="2,2" />
                    <line x1="0" y1="0" x2="100" y2="100" strokeDasharray="1,4" />
                    <line x1="100" y1="0" x2="0" y2="100" strokeDasharray="1,4" />
                    <rect x="4" y="4" width="92" height="92" strokeWidth="0.8" />
                  </svg>

                  {/* Stroke animation SVG */}
                  <svg
                    key={strokeAnimKey}
                    viewBox="0 0 1024 1024"
                    className="absolute inset-0 m-auto w-32 h-32 z-10"
                    style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                  >
                    {strokeData.strokes.map((pathStr, index) => {
                      const delay = (index * 0.3).toFixed(2);
                      const isClosed = pathStr.trim().endsWith('Z') || pathStr.trim().endsWith('z');

                      return (
                        <g key={index}>
                          {/* Ghost background stroke */}
                          <path
                            d={pathStr}
                            fill={isClosed ? 'rgba(244,63,94,0.15)' : 'none'}
                            stroke="rgba(244,63,94,0.18)"
                            strokeWidth={isClosed ? '2' : '52'}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {/* Animated active stroke */}
                          <path
                            d={pathStr}
                            fill={isClosed ? '#F43F5E' : 'none'}
                            stroke="#F43F5E"
                            strokeWidth={isClosed ? '2' : '48'}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray={isClosed ? '3000' : '1500'}
                            strokeDashoffset={isClosed ? '3000' : '1500'}
                            style={{
                              animation: isPlayingStrokes
                                ? `strokeDraw ${animSpeed}s ease-in-out ${delay}s forwards`
                                : 'none',
                            }}
                          />
                          {/* Stroke number marker */}
                          {showNumbers && (
                            <text
                              x={parseInt(pathStr.split(',')[0].replace(/[^0-9]/g, '')) || (index * 60 + 120)}
                              y={Math.max(60, (parseInt(pathStr.split(',')[1]) || (index * 60 + 120)) - 40)}
                              fill="#F59E0B"
                              fontSize="64"
                              fontWeight="bold"
                              opacity="0.9"
                            >
                              {index + 1}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>

                  {/* Previous / Next buttons for multi-character tokens */}
                  {hanziChars.length > 1 && (
                    <>
                      <button
                        onClick={() => setCharIndex((i) => Math.max(0, i - 1))}
                        disabled={charIndex === 0}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-200 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-800 transition-all"
                        title="Previous Character"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setCharIndex((i) => Math.min(hanziChars.length - 1, i + 1))}
                        disabled={charIndex === hanziChars.length - 1}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-200 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-800 transition-all"
                        title="Next Character"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      {/* Dot indicators */}
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-20">
                        {hanziChars.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCharIndex(i)}
                            className="transition-all rounded-full"
                            style={{
                              width: i === charIndex ? '16px' : '6px',
                              height: '6px',
                              background: i === charIndex ? '#F43F5E' : 'rgba(100,116,139,0.5)',
                            }}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: GRAMMAR & USAGE NOTES */}
            {subTab === 'grammar' && (
              <div className="space-y-2 text-xs">
                <div
                  className="p-3 rounded-xl space-y-1.5 bg-slate-900/80 border border-slate-800"
                >
                  <span className="text-[9px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3 h-3" /> Grammar & Syntactic Usage Notes
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {token.grammarNotes}
                  </p>
                </div>
                <div
                  className="p-2.5 rounded-xl space-y-1 bg-slate-900/50 border border-slate-800/60"
                >
                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                    Radical & Character Morphology
                  </span>
                  <p className="text-xs text-slate-300">
                    Component: <span className="font-semibold text-rose-300">{displayRadical}</span>
                  </p>
                </div>
              </div>
            )}

            {/* TAB 4: EXAMPLE SENTENCES */}
            {subTab === 'examples' && (
              <div className="space-y-2 text-xs">
                {token.examples.length === 0 ? (
                  <p className="text-slate-400 text-center py-8 text-xs">No example sentences recorded.</p>
                ) : (
                  token.examples.map((ex) => (
                    <div
                      key={ex.id}
                      className="p-3 rounded-xl space-y-1.5 bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors"
                    >
                      <p className="font-bold text-slate-100 font-chinese text-sm leading-relaxed">{ex.chinese}</p>
                      <p className="text-[11px] text-amber-400 font-medium font-mono">{ex.pinyin}</p>
                      <p className="text-xs text-slate-300 leading-relaxed">{ex.english || ex.indonesian}</p>
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
        className="px-3 py-1.5 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800 bg-slate-950"
      >
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          MonkeyOCR v2 + HanziVG Vector Engine
        </span>
        <button onClick={onClose} className="hover:text-slate-300 transition-colors">
          Press Esc to close
        </button>
      </div>
    </div>
  );
};
