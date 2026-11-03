import React, { useState } from 'react';
import { Flashcard } from '../types';
import { DictionaryService } from '../services/dictionary';
import { SM2SchedulerService } from '../services/sm2SchedulerService';
import {
  Layers, Volume2, Plus, Search, Trash2, Zap, ArrowLeft,
  ArrowRight, CheckCircle, RefreshCw, BookOpen
} from 'lucide-react';

interface FlashcardHubProps {
  flashcards: Flashcard[];
  onRemoveFlashcard: (id: string) => void;
  onAddSampleCards: () => void;
  onUpdateFlashcard?: (card: Flashcard) => void;
}

export const FlashcardHub: React.FC<FlashcardHubProps> = ({
  flashcards,
  onRemoveFlashcard,
  onAddSampleCards,
  onUpdateFlashcard,
}) => {
  const [activeMode, setActiveMode] = useState<'deck' | 'study'>('deck');
  const [studyFilter, setStudyFilter] = useState<'due' | 'all'>('due');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHskFilter, setSelectedHskFilter] = useState<number | 'all'>('all');
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionReviewedCount, setSessionReviewedCount] = useState(0);

  // Filter for deck view
  const filteredCards = flashcards.filter((card) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      card.character.includes(searchQuery) ||
      card.pinyin.toLowerCase().includes(q) ||
      (card.englishDef && card.englishDef.toLowerCase().includes(q)) ||
      (card.indonesianDef && card.indonesianDef.toLowerCase().includes(q));
    const matchesHsk = selectedHskFilter === 'all' || card.hskLevel === selectedHskFilter;
    return matchesSearch && matchesHsk;
  });

  // Filter for study mode
  const dueCards = flashcards.filter((c) => SM2SchedulerService.isDueToday(c));
  const studyPool = studyFilter === 'due' ? (dueCards.length > 0 ? dueCards : flashcards) : flashcards;

  const currentCard = studyPool[currentIndex] || studyPool[0];

  const handleNextCard = () => {
    setIsFlipped(false);
    if (currentIndex + 1 >= studyPool.length) {
      setSessionCompleted(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + studyPool.length) % studyPool.length);
  };

  const handleSpeak = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    DictionaryService.speak(text);
  };

  // Grade card with SuperMemo-2 (SM2) Algorithm (FR-SRS-05)
  const handleGradeCard = (grade: 1 | 3 | 4 | 5) => {
    if (!currentCard || !onUpdateFlashcard) return;

    const sm2Result = SM2SchedulerService.calculateReview(
      {
        easinessFactor: currentCard.easinessFactor ?? 2.5,
        repetitionCount: currentCard.repetitionCount ?? 0,
        intervalDays: currentCard.intervalDays ?? 1,
      },
      grade
    );

    const updatedCard: Flashcard = {
      ...currentCard,
      easinessFactor: sm2Result.easinessFactor,
      repetitionCount: sm2Result.repetitionCount,
      intervalDays: sm2Result.intervalDays,
      nextReviewDate: sm2Result.nextReviewDate,
      masteryLevel: sm2Result.masteryLevel,
      lastQualityGrade: grade,
    };

    onUpdateFlashcard(updatedCard);
    setSessionReviewedCount((prev) => prev + 1);

    // Proceed to next card
    handleNextCard();
  };

  const handleResetSession = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
    setSessionReviewedCount(0);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950 font-sans">
      {/* Top Bar Navigation */}
      <div className="h-16 px-6 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <Layers className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-100 text-sm tracking-wide">
                LexiDoc Flashcard Hub & SM2 Review
              </h2>
              <span className="px-1.5 py-0.5 text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded font-semibold">
                SuperMemo-2
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {flashcards.length} total cards in deck · {dueCards.length} cards due today
            </p>
          </div>
        </div>

        {/* Mode Selector Buttons */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-slate-800/80 rounded-xl border border-slate-700/80 p-1 text-xs">
            <button
              onClick={() => {
                setActiveMode('deck');
                setIsFlipped(false);
                setSessionCompleted(false);
              }}
              className={`px-3.5 py-1.5 rounded-lg flex items-center space-x-1.5 font-medium transition-all ${
                activeMode === 'deck'
                  ? 'bg-slate-700 text-slate-100 border border-slate-600 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Deck List ({flashcards.length})</span>
            </button>
            <button
              onClick={() => {
                if (flashcards.length === 0) return;
                setActiveMode('study');
                setIsFlipped(false);
                setSessionCompleted(false);
              }}
              disabled={flashcards.length === 0}
              className={`px-3.5 py-1.5 rounded-lg flex items-center space-x-1.5 font-medium transition-all ${
                activeMode === 'study'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold shadow-sm'
                  : flashcards.length === 0
                  ? 'opacity-40 cursor-not-allowed text-slate-500'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>SM2 Study Mode</span>
            </button>
          </div>

          {flashcards.length === 0 && (
            <button
              onClick={onAddSampleCards}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-amber-950/40 transition-transform hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>+ Import 5 Sample Cards</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 p-6 overflow-y-auto">
        {flashcards.length === 0 ? (
          /* Empty Deck Screen */
          <div className="max-w-md mx-auto my-12 glass-panel rounded-3xl p-8 border border-slate-800 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <Layers className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">No Flashcards Saved Yet</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              You haven't saved any vocabulary characters to your review deck. Click the <strong>+ Flashcard</strong> button in the Document Translator or hover over character bounding boxes in the <strong>OCR Reader</strong>.
            </p>
            <button
              onClick={onAddSampleCards}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-950/50 transition-all hover:scale-105"
            >
              + Add 5 Sample Vocabulary Cards
            </button>
          </div>
        ) : activeMode === 'deck' ? (
          /* Deck Collection Grid */
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search character, pinyin, or English definition..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-400">HSK Level:</span>
                {(['all', 1, 2, 3, 4] as const).map((hsk) => (
                  <button
                    key={hsk}
                    onClick={() => setSelectedHskFilter(hsk)}
                    className={`px-3 py-1 rounded-lg border font-medium ${
                      selectedHskFilter === hsk
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {hsk === 'all' ? 'All' : `HSK ${hsk}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Flashcard Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCards.map((card) => {
                const isDue = SM2SchedulerService.isDueToday(card);
                return (
                  <div
                    key={card.id}
                    className="glass-card glass-card-hover rounded-2xl p-5 border border-slate-800/80 space-y-3.5 relative group bg-slate-900/50 hover:border-slate-700 transition-all"
                  >
                    {/* Card Header: Hanzi badge + Pinyin & HSK */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Flexible Hanzi display badge — NEVER clips or line-breaks */}
                        <div className="min-w-[60px] px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700/80 flex items-center justify-center gap-1.5 shadow-inner shrink-0">
                          <span className="text-xl font-bold font-chinese text-slate-100 whitespace-nowrap">
                            {card.character}
                          </span>
                          <button
                            onClick={(e) => handleSpeak(e, card.character)}
                            className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
                            title="Listen Pronunciation"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <h4 className="font-bold text-slate-100 text-sm font-mono tracking-wide">
                            {card.pinyin}
                          </h4>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-amber-400 rounded-md border border-amber-500/20 font-medium">
                              HSK {card.hskLevel}
                            </span>
                            {isDue && (
                              <span className="px-2 py-0.5 text-[10px] bg-rose-500/15 text-rose-300 rounded-md border border-rose-500/30 font-medium">
                                Due Today
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => onRemoveFlashcard(card.id)}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-all shrink-0"
                        title="Remove from Flashcards"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Radical Info */}
                    <div className="text-[11px] text-slate-400">
                      Radical: <span className="text-slate-300 font-medium">{card.radical}</span>
                    </div>

                    {/* English Definition */}
                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                        Definition
                      </span>
                      <p className="text-slate-200 font-medium leading-relaxed">
                        {card.englishDef || card.indonesianDef}
                      </p>
                    </div>

                    {/* Source sentence from document (FR-SRS-01) */}
                    {card.sourceSentence && (
                      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                          Document Context
                        </span>
                        <p className="text-slate-300 italic font-chinese line-clamp-2">
                          "{card.sourceSentence}"
                        </p>
                      </div>
                    )}

                    {/* SM2 Spaced Repetition Info */}
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800/60">
                      <span>EF: {card.easinessFactor?.toFixed(2) ?? '2.50'}</span>
                      <span>Rep: {card.repetitionCount ?? 0}</span>
                      <span>Interval: {card.intervalDays ?? 1}d</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : sessionCompleted ? (
          /* Session Completed Summary Screen */
          <div className="max-w-md mx-auto my-12 glass-panel rounded-3xl p-8 border border-emerald-500/30 text-center space-y-5 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/40">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-100">SM2 Review Complete!</h3>
              <p className="text-xs text-slate-400">
                Excellent work! You have finished reviewing {sessionReviewedCount} cards scheduled by the SuperMemo-2 algorithm.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Cards Tested</span>
                <span className="text-lg font-bold font-mono text-emerald-400">{sessionReviewedCount}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Total in Deck</span>
                <span className="text-lg font-bold font-mono text-slate-200">{flashcards.length}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleResetSession}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Repeat Session</span>
              </button>
              <button
                onClick={() => setActiveMode('deck')}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-emerald-950/40"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>View All Cards</span>
              </button>
            </div>
          </div>
        ) : (
          /* 3D Interactive Flip Study Mode (SM2 Engine) */
          <div className="max-w-xl mx-auto space-y-5 pt-2">
            {/* Study Mode Controls & Counter */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-200">
                  Card {currentIndex + 1} of {studyPool.length}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-amber-400 font-mono text-[11px]">
                  {studyFilter === 'due' ? 'Target: Due for Review' : 'Target: All Cards'}
                </span>
              </div>
              <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[11px]">
                <button
                  onClick={() => {
                    setStudyFilter('due');
                    setCurrentIndex(0);
                    setIsFlipped(false);
                  }}
                  className={`px-2.5 py-0.5 rounded font-medium ${
                    studyFilter === 'due' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400'
                  }`}
                >
                  Due ({dueCards.length})
                </button>
                <button
                  onClick={() => {
                    setStudyFilter('all');
                    setCurrentIndex(0);
                    setIsFlipped(false);
                  }}
                  className={`px-2.5 py-0.5 rounded font-medium ${
                    studyFilter === 'all' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400'
                  }`}
                >
                  All ({flashcards.length})
                </button>
              </div>
            </div>

            {currentCard && (
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-full h-96 perspective-1000 cursor-pointer"
              >
                <div
                  className={`w-full h-full relative transition-transform duration-500 transform-style-3d ${
                    isFlipped ? 'rotate-y-180' : ''
                  }`}
                >
                  {/* FRONT SIDE */}
                  <div className="absolute inset-0 backface-hidden glass-panel rounded-3xl p-8 border border-slate-700/80 bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col items-center justify-between shadow-2xl">
                    <div className="w-full flex items-center justify-between">
                      <span className="px-3 py-1 text-xs rounded-full bg-slate-800 text-amber-300 border border-amber-500/30 font-semibold">
                        HSK {currentCard.hskLevel}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        EF: {currentCard.easinessFactor?.toFixed(2) ?? '2.50'}
                      </span>
                    </div>

                    <div className="text-center space-y-3 px-4">
                      {/* Character display with ample padding and auto-fitting text */}
                      <div className="text-6xl font-bold font-chinese text-slate-100 drop-shadow-md tracking-wider">
                        {currentCard.character}
                      </div>
                      <div className="text-2xl font-bold text-slate-300 font-mono tracking-wide">
                        {currentCard.pinyin}
                      </div>
                    </div>

                    {/* Context Hint / Document Source Hint */}
                    {currentCard.sourceSentence && (
                      <div className="w-full p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                          Document Context:
                        </span>
                        <p className="text-xs text-slate-300 italic font-chinese line-clamp-1 mt-0.5">
                          "{currentCard.sourceSentence}"
                        </p>
                      </div>
                    )}

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={(e) => handleSpeak(e, currentCard.character)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 shadow transition-colors"
                      >
                        <Volume2 className="w-4 h-4 text-amber-400" />
                        <span>Pronounce</span>
                      </button>
                      <span className="text-[11px] text-slate-500">Click card to flip</span>
                    </div>
                  </div>

                  {/* BACK SIDE */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 glass-panel rounded-3xl p-6 border border-slate-700/80 bg-slate-900 flex flex-col justify-between shadow-2xl space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-100 font-chinese">
                          {currentCard.character}
                        </span>
                        <span className="text-xs text-slate-300 font-semibold font-mono">
                          ({currentCard.pinyin})
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Radical: {currentCard.radical}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs overflow-y-auto max-h-56">
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                          English Definition:
                        </span>
                        <p className="text-sm font-semibold text-slate-100 mt-0.5">
                          {currentCard.englishDef || currentCard.indonesianDef}
                        </p>
                      </div>

                      {/* Source Sentence from Document (FR-SRS-01) */}
                      {currentCard.sourceSentence && (
                        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-amber-400" />
                            Original Document Context:
                          </span>
                          <p className="text-xs text-slate-200 font-chinese mt-0.5">
                            "{currentCard.sourceSentence}"
                          </p>
                        </div>
                      )}

                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                          Grammar & Usage Notes:
                        </span>
                        <p className="text-xs text-slate-300 mt-0.5">
                          {currentCard.grammarNotes}
                        </p>
                      </div>
                    </div>

                    {/* SRS Metric Indicator */}
                    <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-slate-400">
                      <span>EF: {currentCard.easinessFactor?.toFixed(2) ?? '2.50'}</span>
                      <span>Repetitions: {currentCard.repetitionCount ?? 0}</span>
                      <span>Interval: {currentCard.intervalDays ?? 1}d</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── SUPERMEMO-2 RECALL BUTTONS (FR-SRS-05) ── */}
            {isFlipped ? (
              <div className="space-y-2 pt-2 animate-in fade-in">
                <div className="text-center text-[11px] text-slate-400 font-medium">
                  Rate your recall difficulty (SuperMemo-2 SM2):
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => handleGradeCard(1)}
                    className="p-3 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-center transition-all hover:scale-105 active:scale-95 shadow-md shadow-rose-950/40"
                  >
                    <span className="block font-bold text-xs">Again (q=1)</span>
                    <span className="block text-[10px] text-rose-400/80 mt-0.5">&lt; 1 day</span>
                  </button>
                  <button
                    onClick={() => handleGradeCard(3)}
                    className="p-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-center transition-all hover:scale-105 active:scale-95 shadow-md shadow-amber-950/40"
                  >
                    <span className="block font-bold text-xs">Hard (q=3)</span>
                    <span className="block text-[10px] text-amber-400/80 mt-0.5">~1-3 days</span>
                  </button>
                  <button
                    onClick={() => handleGradeCard(4)}
                    className="p-3 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-center transition-all hover:scale-105 active:scale-95 shadow-md shadow-emerald-950/40"
                  >
                    <span className="block font-bold text-xs">Good (q=4)</span>
                    <span className="block text-[10px] text-emerald-400/80 mt-0.5">~4-6 days</span>
                  </button>
                  <button
                    onClick={() => handleGradeCard(5)}
                    className="p-3 rounded-2xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 text-center transition-all hover:scale-105 active:scale-95 shadow-md shadow-sky-950/40"
                  >
                    <span className="block font-bold text-xs">Easy (q=5)</span>
                    <span className="block text-[10px] text-sky-400/80 mt-0.5">~8+ days</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Navigation before flip */
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handlePrevCard}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <button
                  onClick={() => setIsFlipped(true)}
                  className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-white text-slate-900 font-bold text-xs shadow-lg transition-all hover:scale-105"
                >
                  Flip Card (3D Flip)
                </button>

                <button
                  onClick={handleNextCard}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5"
                >
                  <span>Skip</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
