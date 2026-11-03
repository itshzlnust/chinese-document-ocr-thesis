import React from 'react';
import { ActiveTab } from '../types';
import {
  BookOpen, Languages, Layers, CheckCircle2,
  LayoutDashboard, Cpu, ChevronLeft, ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  flashcardCount: number;
  onOpenApiModal: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  flashcardCount,
  onOpenApiModal,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const menuItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard & Library',
      subtitle: 'F1/F7: Document repository & stats',
      icon: LayoutDashboard,
      badge: 'F1/F7'
    },
    {
      id: 'reader' as ActiveTab,
      label: 'Split-Screen Reader',
      subtitle: 'F2/F3: MonkeyOCR v2 & token lookup',
      icon: BookOpen,
      badge: 'MonkeyOCR v2'
    },
    {
      id: 'translator' as ActiveTab,
      label: 'Document Translator',
      subtitle: 'F4: Full document & interlinear translation',
      icon: Languages,
      badge: 'OPUS-MT'
    },
    {
      id: 'flashcards' as ActiveTab,
      label: 'Flashcards & SM2 Review',
      subtitle: 'F5/F6: Adaptive spaced repetition',
      icon: Layers,
      countBadge: flashcardCount
    }
  ];

  return (
    <aside
      className={`bg-slate-900/90 backdrop-blur-xl border-r border-slate-800 flex flex-col justify-between shrink-0 select-none z-30 min-h-screen transition-all duration-200 ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      <div>
        {/* Header / Brand Logo: LexiDoc + Collapse Button */}
        <div className={`p-4 border-b border-slate-800/80 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-950/30 shrink-0">
              <span className="text-xl font-bold font-chinese text-white">文</span>
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <h1 className="font-bold text-slate-100 tracking-tight text-lg">LexiDoc</h1>
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded">
                    v2
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">Chinese-English Learning Space</p>
              </div>
            )}
          </div>

          {onToggleCollapse && !isCollapsed && (
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1.5">
          {!isCollapsed ? (
            <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Navigation
            </div>
          ) : onToggleCollapse ? (
            <div className="flex justify-center pb-2">
              <button
                onClick={onToggleCollapse}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                title="Expand Sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : null}

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={isCollapsed ? `${item.label} (${item.subtitle})` : undefined}
                className={`w-full rounded-xl transition-all duration-200 flex items-center group ${
                  isCollapsed
                    ? 'p-3 justify-center'
                    : 'p-3 justify-between'
                } ${
                  isActive
                    ? 'bg-slate-800 border border-slate-700 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3 min-w-0'}`}>
                  <div
                    className={`p-2 rounded-lg transition-colors shrink-0 ${
                      isActive ? 'bg-rose-500 text-white' : 'bg-slate-800 group-hover:bg-slate-700 text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {!isCollapsed && (
                    <div className="min-w-0 text-left">
                      <div className="text-sm font-medium tracking-wide truncate">{item.label}</div>
                      <div className="text-[11px] text-slate-400 truncate">{item.subtitle}</div>
                    </div>
                  )}
                </div>

                {!isCollapsed && item.countBadge !== undefined && (
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold transition-all shrink-0 ml-1 ${
                      item.countBadge > 0
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.countBadge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Tech Stack Specifications */}
      <div className="p-3 border-t border-slate-800/80 space-y-2">
        <button
          onClick={onOpenApiModal}
          className={`w-full p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white flex items-center transition-colors text-xs ${
            isCollapsed ? 'justify-center' : 'justify-between'
          }`}
          title="Tech Stack & API Specifications (Table 3.9)"
        >
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-amber-400 shrink-0" />
            {!isCollapsed && <span className="font-medium truncate">Tech Stack & API</span>}
          </div>
          {!isCollapsed && <span className="text-[10px] text-slate-400 underline shrink-0">Table 3.9</span>}
        </button>

        {!isCollapsed && (
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 text-xs space-y-1">
            <div className="flex items-center justify-between text-slate-300 font-semibold text-[11px]">
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-rose-500" />
                <span>LexiDoc Engine</span>
              </span>
              <span className="text-emerald-400 text-[10px] flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Active
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              • OCR: <strong className="text-slate-200">MonkeyOCR v2</strong>
            </div>
            <div className="text-[11px] text-slate-400">
              • NMT: <strong className="text-slate-200">OPUS-MT (zh ⇄ en)</strong>
            </div>
            <div className="text-[11px] text-slate-400">
              • Memory: <strong className="text-slate-200">SuperMemo-2 (SM2)</strong>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
