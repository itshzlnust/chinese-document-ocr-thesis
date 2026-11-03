import React from 'react';
import {
  BookOpen,
  Languages,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Brain,
  Camera,
  BarChart3,
} from 'lucide-react';
import { ActiveTab, Flashcard } from '../types';

interface DashboardProps {
  onNavigate: (tab: ActiveTab) => void;
  flashcards: Flashcard[];
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, flashcards }) => {
  // Compute SM2 review due count
  const today = new Date().toISOString().split('T')[0];
  const dueCardsCount = flashcards.filter((c) => {
    if (!c.nextReviewDate) return true;
    return c.nextReviewDate <= today;
  }).length;

  const masteredCount = flashcards.filter((c) => c.masteryLevel >= 3).length;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-slate-950 p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8 font-sans">

      {/* ── HERO BANNER: LEXIDOC LEARNING SPACE ── */}
      <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
            LexiDoc: Document-Based Chinese-English Learning Space
          </h1>

          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            An integrated platform for reading Chinese documents and camera scans (<strong>MonkeyOCR v2</strong>),
            translating multi-page structured documents bidirectionally (<strong>OPUS-MT</strong>),
            and reinforcing long-term vocabulary retention adaptively (<strong>SuperMemo-2 / SM2</strong>).
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('reader')}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-white text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg transition-all hover:scale-105"
            >
              <BookOpen className="w-4 h-4 text-slate-900" />
              <span>Open Split-Screen Reader</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onNavigate('translator')}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <Languages className="w-4 h-4 text-rose-400" />
              <span>Translate Full Document (EN ⇄ ZH)</span>
            </button>

            <button
              onClick={() => onNavigate('flashcards')}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <Layers className="w-4 h-4 text-amber-400" />
              <span>SM2 Flashcard Practice</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── STATISTICAL OVERVIEW CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vocabulary Deck */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Vocabulary
            </span>
            <div className="p-2 rounded-xl bg-slate-800 text-amber-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            {flashcards.length}
          </div>
          <p className="text-[11px] text-slate-500">Hanzi cards in flashcard deck</p>
        </div>

        {/* Due for Review Today (SM2) */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Due Today (SM2)
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">
            {dueCardsCount}
          </div>
          <p className="text-[11px] text-slate-500">Scheduled for spaced repetition</p>
        </div>

        {/* Mastered Vocabulary */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Mastered Words
            </span>
            <div className="p-2 rounded-xl bg-slate-800 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {masteredCount}
          </div>
          <p className="text-[11px] text-slate-500">Mastery level 3 or higher</p>
        </div>

        {/* Retention Quality */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Retention Stability
            </span>
            <div className="p-2 rounded-xl bg-slate-800 text-indigo-400">
              <Brain className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-400 font-mono">
            {flashcards.length > 0
              ? `${Math.round((masteredCount / flashcards.length) * 100)}%`
              : '100%'}
          </div>
          <p className="text-[11px] text-slate-500">SM-2 memory retention index</p>
        </div>
      </div>

      {/* ── WORKSPACE MODULES ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100 tracking-tight">
              Workspace Modules & Quick Tools
            </h2>
            <p className="text-xs text-slate-400">
              Choose a tool to start reading, capturing camera scans, or translating documents
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Split-Screen Reader & Camera */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 shadow-lg space-y-3 transition-all hover:scale-[1.01]">
            <div className="flex items-center justify-between text-xs">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-rose-300 border border-rose-500/30 font-mono text-[10px] uppercase font-bold">
                Split-Screen Reader
              </span>
              <Camera className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">
                OCR Document Reader & Camera Scanner
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Upload PDFs, choose image files, or take photos directly with your phone camera. Inspect character bounding boxes, stroke order animations, and add words to flashcards.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-xs">
              <span className="text-[11px] text-slate-500">Camera & File Upload</span>
              <button
                onClick={() => onNavigate('reader')}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
              >
                <span>Launch Reader</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 2: Document Translator */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 shadow-lg space-y-3 transition-all hover:scale-[1.01]">
            <div className="flex items-center justify-between text-xs">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-blue-300 border border-blue-500/30 font-mono text-[10px] uppercase font-bold">
                Interlinear Translator
              </span>
              <Languages className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">
                Academic Document Translator
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Translate complete documents with structured academic formatting. Generates interlinear text directly beneath each line, with clean Word (.doc) and PDF export.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-xs">
              <span className="text-[11px] text-slate-500">Bidirectional (EN ⇄ ZH)</span>
              <button
                onClick={() => onNavigate('translator')}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
              >
                <span>Translate Document</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 3: SM-2 Spaced Repetition Flashcards */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 shadow-lg space-y-3 transition-all hover:scale-[1.01]">
            <div className="flex items-center justify-between text-xs">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-amber-500/30 font-mono text-[10px] uppercase font-bold">
                SM-2 Review
              </span>
              <Brain className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">
                Vocabulary Hub & SM2 Scheduling
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Review Hanzi flashcards with SuperMemo-2 adaptive intervals, stroke order practice with HanziVG animations, audio pronunciation, and source sentences.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-xs">
              <span className="text-[11px] text-slate-500">{dueCardsCount} due today</span>
              <button
                onClick={() => onNavigate('flashcards')}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
              >
                <span>Start Review</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── TECHNICAL SPECIFICATIONS ── */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-rose-400" />
            <h3 className="font-bold text-slate-200 text-sm">
              LexiDoc Architecture & Technical Specifications
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Core Engines</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/60">
            <span className="text-[10px] text-slate-500 block">Document Parsing (OCR)</span>
            <span className="font-bold text-slate-200">MonkeyOCR v2</span>
            <span className="text-[10px] text-rose-400 block mt-0.5">VLM 113M Docs</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/60">
            <span className="text-[10px] text-slate-500 block">Machine Translation</span>
            <span className="font-bold text-slate-200">OPUS-MT</span>
            <span className="text-[10px] text-rose-400 block mt-0.5">zh ⇄ en Bidirectional</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/60">
            <span className="text-[10px] text-slate-500 block">Spaced Repetition</span>
            <span className="font-bold text-slate-200">SuperMemo-2 (SM2)</span>
            <span className="text-[10px] text-rose-400 block mt-0.5">EF + Recall Quality</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/60">
            <span className="text-[10px] text-slate-500 block">Frontend & Backend</span>
            <span className="font-bold text-slate-200">React + FastAPI</span>
            <span className="text-[10px] text-rose-400 block mt-0.5">Vite + TypeScript</span>
          </div>
        </div>
      </div>

    </div>
  );
};