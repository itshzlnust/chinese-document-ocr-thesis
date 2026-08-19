import React from 'react';
import { ActiveTab } from '../types';
import { BookOpen, Languages, Layers, Terminal, Sparkles } from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  flashcardCount: number;
  onOpenApiModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  flashcardCount,
  onOpenApiModal,
}) => {
  const menuItems = [
    {
      id: 'reader' as ActiveTab,
      label: 'OCR Reader Interaktif',
      subtitle: 'Identify per character & hover popup',
      icon: BookOpen,
      badge: 'MonkeyOCR v2'
    },
    {
      id: 'translator' as ActiveTab,
      label: 'Terjemahan Dokumen',
      subtitle: 'Translate ZH -> ID preserves layout',
      icon: Languages,
      badge: 'ZH to ID'
    },
    {
      id: 'flashcards' as ActiveTab,
      label: 'Flashcards Belajar',
      subtitle: 'Deck memori & latihan stroke Hanzi',
      icon: Layers,
      countBadge: flashcardCount
    }
  ];

  return (
    <aside className="w-72 bg-slate-900/90 backdrop-blur-xl border-r border-slate-800 flex flex-col justify-between shrink-0 select-none z-30 min-h-screen">
      <div>
        {/* Header / Brand Logo */}
        <div className="p-6 border-b border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center shadow-lg shadow-red-900/30">
              <span className="text-xl font-bold font-chinese text-white">猴</span>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="font-bold text-slate-100 tracking-tight text-lg">MonkeyOCR</h1>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-red-500/20 text-red-400 border border-red-500/30 rounded">
                  v2
                </span>
              </div>
              <p className="text-xs text-slate-400">Chinese Document AI Hub</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-2">
          <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Menu Utama
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left p-3.5 rounded-xl transition-all duration-200 flex items-center justify-between group ${
                  isActive
                    ? 'bg-gradient-to-r from-red-600/20 to-slate-800 border border-red-500/40 text-white shadow-lg shadow-red-950/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-lg transition-colors ${
                      isActive ? 'bg-red-500 text-white' : 'bg-slate-800 group-hover:bg-slate-700 text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium tracking-wide">{item.label}</div>
                    <div className="text-[11px] text-slate-400">{item.subtitle}</div>
                  </div>
                </div>

                {item.badge && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium border border-slate-700">
                    {item.badge}
                  </span>
                )}

                {item.countBadge !== undefined && (
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold transition-all ${
                    item.countBadge > 0
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.countBadge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Model Connection */}
      <div className="p-4 border-t border-slate-800/80 space-y-3">
        <button
          onClick={onOpenApiModal}
          className="w-full p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white flex items-center justify-between transition-colors text-xs"
        >
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span className="font-medium">Backend API PyTorch</span>
          </div>
          <span className="text-[10px] text-slate-400 underline">Lihat Kode</span>
        </button>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 text-xs space-y-1">
          <div className="flex items-center justify-between text-slate-300 font-semibold text-[11px]">
            <span className="flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-red-400" />
              <span>Model Specs</span>
            </span>
            <span className="text-emerald-400 text-[10px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Active
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            • OCR: <strong className="text-slate-300">MonkeyOCR v2</strong>
          </div>
          <div className="text-[11px] text-slate-400">
            • Strokes: <strong className="text-slate-300">HanziVG Vector</strong>
          </div>
          <div className="text-[11px] text-slate-400">
            • Kamus: <strong className="text-slate-300">CC-CEDICT (ZH-ID)</strong>
          </div>
        </div>
      </div>
    </aside>
  );
};
