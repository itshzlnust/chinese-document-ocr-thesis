import React, { useState } from 'react';
import { Flashcard } from '../types';
import { DictionaryService } from '../services/dictionary';
import { Layers, Volume2, Plus, Search, Trash2, Zap, ArrowLeft, ArrowRight } from 'lucide-react';

interface FlashcardHubProps {
  flashcards: Flashcard[];
  onRemoveFlashcard: (id: string) => void;
  onAddSampleCards: () => void;
}

export const FlashcardHub: React.FC<FlashcardHubProps> = ({
  flashcards,
  onRemoveFlashcard,
  onAddSampleCards,
}) => {
  const [activeMode, setActiveMode] = useState<'deck' | 'study'>('deck');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHskFilter, setSelectedHskFilter] = useState<number | 'all'>('all');

  const filteredCards = flashcards.filter((card) => {
    const matchesSearch =
      card.character.includes(searchQuery) ||
      card.pinyin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.indonesianDef.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesHsk = selectedHskFilter === 'all' || card.hskLevel === selectedHskFilter;
    return matchesSearch && matchesHsk;
  });

  const currentCard = filteredCards[currentIndex] || flashcards[0];

  const handleNextCard = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % filteredCards.length);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
  };

  const handleSpeak = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    DictionaryService.speak(text);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950">
      {/* Top Bar Navigation */}
      <div className="h-16 px-6 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center space-x-3">
          <Layers className="w-5 h-5 text-amber-500" />
          <div>
            <h2 className="font-bold text-slate-100 text-sm tracking-wide">
              Flashcards & Study Hub
            </h2>
            <p className="text-[11px] text-slate-400">
              Total {flashcards.length} karakter tersimpan di memori deck
            </p>
          </div>
        </div>

        {/* Mode Selector Buttons */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-slate-800/80 rounded-xl border border-slate-700 p-1 text-xs">
            <button
              onClick={() => {
                setActiveMode('deck');
                setIsFlipped(false);
              }}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 font-medium transition-all ${
                activeMode === 'deck'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Daftar Deck</span>
            </button>
            <button
              onClick={() => {
                if (flashcards.length === 0) return;
                setActiveMode('study');
                setIsFlipped(false);
              }}
              disabled={flashcards.length === 0}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 font-medium transition-all ${
                activeMode === 'study'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : flashcards.length === 0
                  ? 'opacity-40 cursor-not-allowed text-slate-500'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Mode Flip 3D</span>
            </button>
          </div>

          {flashcards.length === 0 && (
            <button
              onClick={onAddSampleCards}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-amber-950/40 transition-transform hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>+ Impor 5 Sampel Flashcard</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 p-6 overflow-y-auto">
        {flashcards.length === 0 ? (
          /* Empty Deck Screen */
          <div className="max-w-md mx-auto my-12 glass-panel rounded-3xl p-8 border border-slate-800 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <Layers className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Belum Ada Flashcard</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Anda belum menyimpan karakter ke dalam flashcards. Anda dapat menekan ikon <strong>Bookmark</strong> saat meng-hover kotak aksara di <strong>OCR Reader</strong>, atau mengklik tombol di bawah ini untuk mengimpor sampel langsung.
            </p>
            <button
              onClick={onAddSampleCards}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-950/50 transition-all hover:scale-105"
            >
              + Tambahkan 5 Karakter Sampel
            </button>
          </div>
        ) : activeMode === 'deck' ? (
          /* Deck Collection Grid */
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari karakter, pinyin, atau arti..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-400">Filter HSK:</span>
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
                    {hsk === 'all' ? 'Semua' : `HSK ${hsk}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Flashcard Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCards.map((card) => {
                return (
                  <div
                    key={card.id}
                    className="glass-card glass-card-hover rounded-2xl p-5 border border-slate-800 space-y-3 relative group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-950 border border-amber-500/40 flex items-center justify-center relative">
                          <span className="text-2xl font-bold font-chinese text-amber-400">
                            {card.character}
                          </span>
                          <button
                            onClick={(e) => handleSpeak(e, card.character)}
                            className="absolute -bottom-1 -right-1 p-1 rounded-full bg-amber-600 text-white shadow"
                          >
                            <Volume2 className="w-3 h-3" />
                          </button>
                        </div>

                        <div>
                          <h4 className="font-bold text-slate-100 text-base">{card.pinyin}</h4>
                          <span className="px-2 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30">
                            HSK {card.hskLevel}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => onRemoveFlashcard(card.id)}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all"
                        title="Hapus dari Flashcards"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Arti (ID):</span>
                      <p className="text-slate-200 font-medium">{card.indonesianDef}</p>
                    </div>

                    {card.examples[0] && (
                      <div className="text-[11px] text-slate-400 italic">
                        "{card.examples[0].chinese}" ➔ {card.examples[0].indonesian}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* 3D Interactive Flip Study Mode */
          <div className="max-w-xl mx-auto space-y-6 pt-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Kartu {currentIndex + 1} dari {filteredCards.length}</span>
              <span>Klik kartu untuk membalik (Flip 3D)</span>
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
                  <div className="absolute inset-0 backface-hidden glass-panel rounded-3xl p-8 border-2 border-amber-500/40 bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col items-center justify-between shadow-2xl shadow-amber-950/20">
                    <span className="px-3 py-1 text-xs rounded-full bg-amber-500/20 text-amber-300 font-semibold">
                      HSK {currentCard.hskLevel}
                    </span>

                    <div className="text-center space-y-3">
                      <div className="text-7xl font-bold font-chinese text-amber-400 drop-shadow-md">
                        {currentCard.character}
                      </div>
                      <div className="text-2xl font-bold text-slate-200">{currentCard.pinyin}</div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={(e) => handleSpeak(e, currentCard.character)}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>Dengar Pengucapan</span>
                      </button>
                    </div>
                  </div>

                  {/* BACK SIDE */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 glass-panel rounded-3xl p-6 border-2 border-red-500/40 bg-slate-900 flex flex-col justify-between shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <span className="text-xs font-bold text-amber-400">{currentCard.character} ({currentCard.pinyin})</span>
                      <span className="text-xs text-slate-400">Radikal: {currentCard.radical}</span>
                    </div>

                    <div className="space-y-3 text-xs overflow-y-auto">
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Arti Bahasa Indonesia:</span>
                        <p className="text-sm font-semibold text-slate-100">{currentCard.indonesianDef}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Grammar & Catatan:</span>
                        <p className="text-xs text-slate-300">{currentCard.grammarNotes}</p>
                      </div>

                      {currentCard.examples[0] && (
                        <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">Contoh Kalimat:</span>
                          <p className="font-chinese text-slate-100 font-bold">{currentCard.examples[0].chinese}</p>
                          <p className="text-slate-300">{currentCard.examples[0].indonesian}</p>
                        </div>
                      )}
                    </div>

                    <div className="text-center text-[10px] text-slate-500">Klik lagi untuk membalik ke depan</div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation & SRS Controls */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handlePrevCard}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>

              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-400">Tingkat Hafal:</span>
                <button
                  onClick={handleNextCard}
                  className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40"
                >
                  Sulit ❌
                </button>
                <button
                  onClick={handleNextCard}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
                >
                  Mudah / Hafal ✅
                </button>
              </div>

              <button
                onClick={handleNextCard}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5"
              >
                <span>Berikutnya</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
