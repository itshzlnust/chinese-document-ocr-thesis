import React, { useState } from 'react';
import { SAMPLE_DOCUMENTS } from '../data/sample_documents';
import { Languages, Columns, Layers, Copy, Check, Download, Sparkles, FileText, ArrowRight } from 'lucide-react';

export const DocumentTranslator: React.FC = () => {
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'overlay'>('side-by-side');
  const [copied, setCopied] = useState(false);

  const doc = SAMPLE_DOCUMENTS[selectedDocIndex];

  const handleCopyTranslation = () => {
    navigator.clipboard.writeText(doc.fullIndonesianText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTranslation = () => {
    const element = document.createElement('a');
    const file = new Blob([`TRADUKSI DOKUMEN MONKEYOCR v2\n\nOriginal (ZH):\n${doc.fullChineseText}\n\nTerjemahan (ID):\n${doc.fullIndonesianText}`], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Terjemahan_${doc.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950">
      {/* Header bar */}
      <div className="h-16 px-6 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center space-x-3">
          <Languages className="w-5 h-5 text-red-500" />
          <div>
            <h2 className="font-bold text-slate-100 text-sm tracking-wide">
              Document Translation (ZH ➔ ID)
            </h2>
            <p className="text-[11px] text-slate-400">MonkeyOCR v2 Layout Preservation Engine</p>
          </div>
        </div>

        {/* View mode toggle & Actions */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-slate-800/80 rounded-xl border border-slate-700 p-1 text-xs">
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 font-medium transition-all ${
                viewMode === 'side-by-side'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Side-by-Side</span>
            </button>
            <button
              onClick={() => setViewMode('overlay')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 font-medium transition-all ${
                viewMode === 'overlay'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Overlay Terjemahan</span>
            </button>
          </div>

          <button
            onClick={handleCopyTranslation}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center space-x-1.5 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Tercopy!' : 'Salin Teks'}</span>
          </button>

          <button
            onClick={handleDownloadTranslation}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-red-950/40 transition-transform hover:scale-105"
          >
            <Download className="w-4 h-4" />
            <span>Unduh TXT</span>
          </button>
        </div>
      </div>

      {/* Selector banner */}
      <div className="px-6 py-2.5 bg-slate-900/40 border-b border-slate-800/60 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          <span className="text-slate-400">Pilih Dokumen:</span>
          {SAMPLE_DOCUMENTS.map((d, idx) => (
            <button
              key={d.id}
              onClick={() => setSelectedDocIndex(idx)}
              className={`px-3 py-1 rounded-lg border font-medium ${
                selectedDocIndex === idx
                  ? 'bg-slate-800 border-red-500/50 text-red-300'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {d.title}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2 text-slate-400 text-[11px]">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Alignment: Paragraph-Level Structural Matching</span>
        </div>
      </div>

      {/* Main Viewport Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {viewMode === 'side-by-side' ? (
          <div className="grid grid-cols-2 gap-6 h-full min-h-[500px]">
            {/* Left: Original Chinese Document */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-red-400" />
                  Dokumen Asli (Bahasa Mandarin - ZH)
                </span>
                <span className="px-2 py-0.5 text-[10px] bg-red-500/20 text-red-300 rounded font-mono">
                  MonkeyOCR v2 OCR
                </span>
              </div>

              <div className="space-y-4 overflow-y-auto pr-2">
                {doc.blocks.map((block, i) => (
                  <div
                    key={block.id}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 hover:border-red-500/30 transition-colors"
                  >
                    <span className="text-[10px] font-mono text-slate-400">Blok #{i + 1}</span>
                    <p className="text-lg font-chinese font-semibold text-slate-100 leading-relaxed">
                      {block.chineseText}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Translated Indonesian Document */}
            <div className="glass-panel rounded-2xl p-6 border border-red-500/30 bg-slate-900/80 flex flex-col space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                  <Languages className="w-4 h-4 text-red-400" />
                  Hasil Terjemahan (Bahasa Indonesia - ID)
                </span>
                <span className="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 rounded font-mono">
                  Preserved Layout
                </span>
              </div>

              <div className="space-y-4 overflow-y-auto pr-2">
                {doc.blocks.map((block) => (
                  <div
                    key={block.id}
                    className="p-4 rounded-xl bg-slate-950/90 border border-red-500/20 space-y-2 shadow-sm"
                  >
                    <span className="text-[10px] font-mono text-slate-400">Blok Terjemahan</span>
                    <p className="text-sm font-medium text-slate-200 leading-relaxed">
                      {block.indonesianTranslation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Overlay View Mode */
          <div className="max-w-4xl mx-auto glass-panel rounded-2xl p-8 border border-slate-800 space-y-6">
            <div className="text-center space-y-2 border-b border-slate-800 pb-6">
              <span className="px-3 py-1 text-xs rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                Overlay Structural Translation View
              </span>
              <h3 className="text-xl font-bold text-slate-100">{doc.title}</h3>
            </div>

            <div className="space-y-6">
              {doc.blocks.map((block) => (
                <div
                  key={block.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 relative overflow-hidden group hover:border-red-500/40 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <p className="text-base font-chinese text-slate-400 line-through decoration-slate-600">
                      {block.chineseText}
                    </p>
                    <ArrowRight className="w-4 h-4 text-red-400 shrink-0 ml-4 mt-1" />
                  </div>
                  <div className="pt-2 border-t border-slate-800/60">
                    <p className="text-base font-semibold text-slate-100 leading-relaxed">
                      {block.indonesianTranslation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
