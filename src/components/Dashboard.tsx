import React from 'react';
import {
  BookOpen, Languages, Layers, Upload, Clock,
  CheckCircle2, ArrowRight,
  BarChart3, Award, FolderOpen
} from 'lucide-react';
import { ActiveTab, Flashcard } from '../types';
import { SAMPLE_DOCUMENTS } from '../data/sample_documents';

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
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-slate-950 p-6 md:p-8 space-y-8 font-sans">

      {/* ── HERO BANNER: LEXIDOC PROPOSAL ALIGNMENT ── */}
      <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-rose-300 border border-rose-500/20 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Undergraduate Thesis Information Systems ITK · Ilham Ahmad Fahriji (10231042)</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
            LexiDoc: Document-Based Chinese-English Learning Space
          </h1>

          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            An integrated academic platform for reading scanned Chinese-English documents (<strong>MonkeyOCR v2</strong>),
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
        {/* Total Documents */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Documents
            </span>
            <div className="p-2 rounded-xl bg-slate-800 text-rose-400">
              <FolderOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            {SAMPLE_DOCUMENTS.length + 1}
          </div>
          <p className="text-[11px] text-slate-500">PDFs & scans stored in library</p>
        </div>

        {/* Total Vocabulary */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Vocabulary
            </span>
            <div className="p-2 rounded-xl bg-slate-800 text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            {flashcards.length}
          </div>
          <p className="text-[11px] text-slate-500">Characters saved in flashcard deck</p>
        </div>

        {/* Cards Due Today (SM2) */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Due for Review (SM2)
            </span>
            <div className="p-2 rounded-xl bg-slate-800 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            {dueCardsCount}
          </div>
          <p className="text-[11px] text-slate-500">SuperMemo-2 review schedule</p>
        </div>

        {/* Mastered Vocabulary */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Mastered Vocabulary
            </span>
            <div className="p-2 rounded-xl bg-slate-800 text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {masteredCount}
          </div>
          <p className="text-[11px] text-slate-500">Mastery Level ≥ 3 (High Retention)</p>
        </div>
      </div>

      {/* ── PERSONAL DOCUMENT LIBRARY ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Document Library
            </h2>
            <p className="text-xs text-slate-400">
              Digital documents & scans ready for interactive OCR reading and structured interlinear translation
            </p>
          </div>
          <button
            onClick={() => onNavigate('reader')}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-rose-400" />
            <span>Upload New Document</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Sample Proposal LexiDoc Card */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 shadow-lg space-y-3 transition-all hover:scale-[1.01]">
            <div className="flex items-center justify-between text-xs">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-rose-300 border border-rose-500/30 font-mono text-[10px] uppercase font-bold">
                Proposal PDF
              </span>
              <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-mono">
                <CheckCircle2 className="w-3 h-3" />
                Completed
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm truncate">
                Undergraduate_Thesis_LexiDoc.pdf
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                Development of LexiDoc: A Document-Based Chinese-English Learning Space for Reading, Translating, and Reviewing Vocabulary.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-xs">
              <span className="text-[11px] text-slate-500">71 Pages · 1.4 MB</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('translator')}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
                >
                  <span>Translate</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Existing Sample Documents */}
          {SAMPLE_DOCUMENTS.map((doc) => (
            <div
              key={doc.id}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 shadow-lg space-y-3 transition-all hover:scale-[1.01]"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[10px] uppercase font-bold">
                  {doc.type}
                </span>
                <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-mono">
                  <CheckCircle2 className="w-3 h-3" />
                  Parsed OCR
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm truncate">{doc.title}</h3>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {doc.fullChineseText || doc.fullIndonesianText}
                </p>
              </div>
              <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-xs">
                <span className="text-[11px] text-slate-500">
                  {doc.blocks.reduce((s, b) => s + b.tokens.length, 0)} Character Tokens
                </span>
                <button
                  onClick={() => onNavigate('reader')}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
                >
                  <span>Open Reader</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ARCHITECTURAL COMPLIANCE INFO (TABLE 3.9) ── */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-rose-400" />
            <h3 className="font-bold text-slate-200 text-sm">
              LexiDoc Architecture & Technical Specifications
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Table 3.9 Tech Stack</span>
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
