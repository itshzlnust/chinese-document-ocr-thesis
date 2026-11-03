import React, { useState, useEffect } from 'react';
import { ActiveTab, DocumentWordToken, Flashcard } from './types';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { DocumentReader } from './components/DocumentReader';
import { DocumentTranslator } from './components/DocumentTranslator';
import { FlashcardHub } from './components/FlashcardHub';
import { HoverPopup } from './components/HoverPopup';
import { PythonApiModal } from './components/PythonApiModal';
import { DICTIONARY_DATABASE, getDictionaryEntry } from './data/cc_cedict_sample';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [popupToken, setPopupToken] = useState<DocumentWordToken | null>(null);
  const [popupPos, setPopupPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Initialize flashcards state with saved items or samples
  const [flashcards, setFlashcards] = useState<Flashcard[]>(() => {
    return [
      {
        ...DICTIONARY_DATABASE['学习'],
        character: DICTIONARY_DATABASE['学习'].chinese,
        addedAt: new Date().toISOString(),
        masteryLevel: 0,
      },
      {
        ...DICTIONARY_DATABASE['汉字'],
        character: DICTIONARY_DATABASE['汉字'].chinese,
        addedAt: new Date().toISOString(),
        masteryLevel: 1,
      },
      {
        ...DICTIONARY_DATABASE['翻译'],
        character: DICTIONARY_DATABASE['翻译'].chinese,
        addedAt: new Date().toISOString(),
        masteryLevel: 2,
      }
    ];
  });

  // Handle ESC key to close popups
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPopupToken(null);
        setIsApiModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectToken = (token: DocumentWordToken, mousePos: { x: number; y: number }) => {
    const isChinese = /[\u4e00-\u9fa5]/.test(token.chinese);
    let resolvedToken = token;
    if (isChinese) {
      const freshDict = getDictionaryEntry(token.chinese);
      resolvedToken = {
        ...freshDict,
        ...token,
        pinyin: freshDict.pinyin || token.pinyin,
        radical: freshDict.radical || token.radical,
        englishDef: freshDict.englishDef && !freshDict.englishDef.startsWith('Chinese vocabulary item:')
          ? freshDict.englishDef
          : token.englishDef || freshDict.englishDef,
        grammarNotes: freshDict.grammarNotes || token.grammarNotes,
        examples: freshDict.examples && freshDict.examples.length > 0 ? freshDict.examples : token.examples,
      };
    }
    setPopupToken(resolvedToken);
    setPopupPos(mousePos);
  };

  const handleToggleFlashcard = (token: DocumentWordToken) => {
    setFlashcards((prev) => {
      const exists = prev.some((c) => c.character === token.chinese);
      if (exists) {
        return prev.filter((c) => c.character !== token.chinese);
      } else {
        const newCard: Flashcard = {
          id: `card-${Date.now()}`,
          character: token.chinese,
          pinyin: token.pinyin,
          hskLevel: token.hskLevel,
          radical: token.radical,
          indonesianDef: token.indonesianDef,
          englishDef: token.englishDef,
          grammarNotes: token.grammarNotes,
          examples: token.examples,
          addedAt: new Date().toISOString(),
          masteryLevel: 0,
        };
        return [newCard, ...prev];
      }
    });
  };

  const handleRemoveFlashcard = (id: string) => {
    setFlashcards((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddSampleCards = () => {
    const keys = ['学习', '汉字', '翻译', '猴', '懂'];
    const newCards: Flashcard[] = keys.map((k) => ({
      ...DICTIONARY_DATABASE[k],
      character: DICTIONARY_DATABASE[k].chinese,
      id: `card-${k}-${Date.now()}`,
      addedAt: new Date().toISOString(),
      masteryLevel: 0,
    }));

    setFlashcards((prev) => {
      const existingChars = new Set(prev.map((c) => c.character));
      const filteredNew = newCards.filter((c) => !existingChars.has(c.character));
      return [...filteredNew, ...prev];
    });
  };

  const handleUpdateFlashcard = (updatedCard: Flashcard) => {
    setFlashcards((prev) => prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)));
  };

  const handleAddFlashcardFromText = (
    character: string,
    pinyin: string,
    def: string,
    sourceSentence?: string
  ) => {
    setFlashcards((prev) => {
      const exists = prev.some((c) => c.character === character);
      if (exists) return prev;
      const dictInfo = getDictionaryEntry(character);

      const newCard: Flashcard = {
        ...dictInfo,
        id: `card-${Date.now()}`,
        character: character,
        pinyin: pinyin || dictInfo.pinyin,
        indonesianDef: def || dictInfo.indonesianDef,
        sourceSentence: sourceSentence,
        addedAt: new Date().toISOString(),
        masteryLevel: 0,
        easinessFactor: 2.5,
        repetitionCount: 0,
        intervalDays: 1,
        nextReviewDate: new Date().toISOString().split('T')[0],
      };
      return [newCard, ...prev];
    });
  };

  const isSavedInFlashcard = popupToken
    ? flashcards.some((c) => c.character === popupToken.chinese)
    : false;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 selection:bg-rose-500/30 selection:text-rose-300">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setPopupToken(null); // Clear pop-up when switching tab
        }}
        flashcardCount={flashcards.length}
        onOpenApiModal={() => setIsApiModalOpen(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Main View Area with strict min-w-0 to prevent horizontal blowout */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden relative">
        {activeTab === 'dashboard' && (
          <Dashboard
            onNavigate={(tab) => setActiveTab(tab)}
            flashcards={flashcards}
          />
        )}

        {activeTab === 'reader' && (
          <DocumentReader
            onSelectToken={handleSelectToken}
            activeTokenId={popupToken?.id}
          />
        )}

        {activeTab === 'translator' && (
          <DocumentTranslator onAddFlashcard={handleAddFlashcardFromText} />
        )}

        {activeTab === 'flashcards' && (
          <FlashcardHub
            flashcards={flashcards}
            onRemoveFlashcard={handleRemoveFlashcard}
            onAddSampleCards={handleAddSampleCards}
            onUpdateFlashcard={handleUpdateFlashcard}
          />
        )}
      </main>

      {/* Hover Popup Modal (When hovering/clicking a bounding box character) */}
      {popupToken && (
        <HoverPopup
          token={popupToken}
          position={popupPos}
          onClose={() => setPopupToken(null)}
          onToggleFlashcard={handleToggleFlashcard}
          isSavedInFlashcard={isSavedInFlashcard}
        />
      )}

      {/* Python Backend API Integration Modal */}
      <PythonApiModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
      />
    </div>
  );
};
