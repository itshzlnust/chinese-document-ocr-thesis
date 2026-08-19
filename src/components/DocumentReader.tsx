import React, { useState } from 'react';
import { OCRDocument, DocumentWordToken } from '../types';
import { SAMPLE_DOCUMENTS } from '../data/sample_documents';
import { OCREngine } from '../services/ocrEngine';
import {
  Upload, FileText, Sparkles, ZoomIn, ZoomOut, RotateCcw,
  MousePointer, ChevronLeft, ChevronRight, Search, FileCode,
  Eye, EyeOff, CheckCircle2, UploadCloud, XCircle, ArrowRight
} from 'lucide-react';

interface DocumentReaderProps {
  onSelectToken: (token: DocumentWordToken, mousePos: { x: number; y: number }) => void;
  activeTokenId?: string;
}

export const DocumentReader: React.FC<DocumentReaderProps> = ({
  onSelectToken,
  activeTokenId,
}) => {
  // Initial state: BLANK (no document loaded on screen initially)
  const [selectedDoc, setSelectedDoc] = useState<OCRDocument | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Menganalisis Dokumen...');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredTokenId, setHoveredTokenId] = useState<string | null>(null);

  // Bounding boxes are NOT shown until the user triggers "Identify Character"
  const [isIdentifying, setIsIdentifying] = useState(false);

  // Total word-level tokens detected in current document
  const totalTokens = selectedDoc
    ? selectedDoc.blocks.reduce((acc, b) => acc + b.tokens.length, 0)
    : 0;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setIsIdentifying(false); // Do not show bounding boxes yet
    setLoadingText(
      file.type.includes('pdf') || file.name.endsWith('.pdf')
        ? 'Merendisi Halaman PDF & Mengurai Layout...'
        : 'Memuat Gambar Dokumen...'
    );

    try {
      const doc = await OCREngine.processCustomDocument(file, 1);
      setSelectedDoc(doc);
      // Document is loaded in center, bounding boxes NOT shown until "Identify Character" is clicked!
      setIsIdentifying(false);
    } catch (err) {
      console.error('Failed to process document:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = async (newPageNum: number) => {
    if (!selectedDoc || !selectedDoc.fileObj || !selectedDoc.pdfTotalPages) return;
    if (newPageNum < 1 || newPageNum > selectedDoc.pdfTotalPages) return;

    setIsLoading(true);
    setIsIdentifying(false);
    setLoadingText(`Merendisi Halaman PDF ${newPageNum}...`);
    try {
      const updatedDoc = await OCREngine.processCustomDocument(selectedDoc.fileObj, newPageNum);
      setSelectedDoc(updatedDoc);
      setIsIdentifying(false);
    } catch (err) {
      console.error('Failed to render PDF page:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerIdentify = () => {
    if (!selectedDoc) return;
    setIsLoading(true);
    setLoadingText('Mengidentifikasi Aksara & Memindai Word-Level Bounding Box...');
    setTimeout(() => {
      setIsIdentifying(true);
      setIsLoading(false);
    }, 500);
  };

  const handleSelectSample = (doc: OCRDocument) => {
    setIsLoading(true);
    setIsIdentifying(false);
    setLoadingText('Memuat Sampel Dokumen...');
    setTimeout(() => {
      setSelectedDoc(doc);
      setIsIdentifying(false); // Loaded cleanly without bounding boxes initially
      setIsLoading(false);
    }, 300);
  };

  const handleClearDocument = () => {
    setSelectedDoc(null);
    setIsIdentifying(false);
    setZoomLevel(1);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950">
      {/* Top Bar Controls */}
      <div className="h-16 px-6 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {selectedDoc?.type === 'pdf' ? (
              <FileCode className="w-5 h-5 text-red-500" />
            ) : (
              <FileText className="w-5 h-5 text-red-500" />
            )}
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-slate-100 text-sm tracking-wide max-w-xs truncate">
                {selectedDoc ? selectedDoc.title : 'Dokumen Belum Diunggah'}
              </h2>
              {selectedDoc && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono bg-red-500/20 text-red-300 border border-red-500/30 rounded uppercase">
                  {selectedDoc.type}
                </span>
              )}
            </div>
          </div>

          <div className="h-4 w-[1px] bg-slate-800" />

          {/* Sample Selector */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">Sampel:</span>
            {SAMPLE_DOCUMENTS.map((doc) => (
              <button
                key={doc.id}
                onClick={() => handleSelectSample(doc)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                  selectedDoc?.id === doc.id
                    ? 'bg-red-500/20 border-red-500/50 text-red-300'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                {doc.title.split(' ')[1] || doc.title}
              </button>
            ))}
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-3">
          {selectedDoc && (
            <>
              {/* Identify Character Action Button */}
              <button
                onClick={handleTriggerIdentify}
                className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition-all shadow-lg ${
                  isIdentifying
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-emerald-950/40'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 border-amber-400 shadow-amber-950/50 animate-pulse'
                }`}
                title="Jalankan Deteksi Word-Level Character Recognition"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{isIdentifying ? 'Re-Scan OCR' : 'Identify Character'}</span>
              </button>

              {/* Bounding Box Toggle */}
              {isIdentifying && (
                <button
                  onClick={() => setIsIdentifying(!isIdentifying)}
                  className="px-3 py-1.5 rounded-xl border bg-slate-800 border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition-all"
                  title="Sembunyikan / Tampilkan Bounding Box"
                >
                  {isIdentifying ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{isIdentifying ? `Sembunyikan (${totalTokens} Box)` : 'Tampilkan Box'}</span>
                </button>
              )}

              {/* PDF Page Navigation */}
              {selectedDoc.type === 'pdf' && selectedDoc.pdfTotalPages && selectedDoc.pdfTotalPages > 1 && (
                <div className="flex items-center bg-slate-800/80 rounded-xl border border-slate-700 p-1 text-xs">
                  <button
                    onClick={() => handlePageChange((selectedDoc.pdfPageNumber || 1) - 1)}
                    disabled={(selectedDoc.pdfPageNumber || 1) <= 1}
                    className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent"
                    title="Halaman Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 font-mono text-slate-300">
                    Hal {selectedDoc.pdfPageNumber || 1} / {selectedDoc.pdfTotalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange((selectedDoc.pdfPageNumber || 1) + 1)}
                    disabled={(selectedDoc.pdfPageNumber || 1) >= selectedDoc.pdfTotalPages}
                    className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent"
                    title="Halaman Berikutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Zoom controls */}
              <div className="flex items-center bg-slate-800/80 rounded-xl border border-slate-700 p-1 text-xs">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
                  className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="px-2 font-mono text-slate-300">{Math.round(zoomLevel * 100)}%</span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
                  className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-200 ml-1 border-l border-slate-700"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Clear Document Button */}
              <button
                onClick={handleClearDocument}
                className="p-2 rounded-xl bg-slate-800 hover:bg-red-950/40 border border-slate-700 hover:border-red-500/40 text-slate-400 hover:text-red-300 transition-colors"
                title="Kosongkan Dokumen"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Upload Button */}
          <label className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-semibold flex items-center space-x-2 cursor-pointer shadow-lg shadow-red-950/50 transition-all hover:scale-105">
            <Upload className="w-4 h-4" />
            <span>Unggah Dokumen</span>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Main Workspace Canvas */}
      <div className="flex-1 relative overflow-auto p-8 flex items-center justify-center bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]">

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-40 flex flex-col items-center justify-center space-y-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-full border-4 border-red-500/20 border-t-red-500 animate-spin flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-red-500 animate-pulse" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-slate-200 text-base">{loadingText}</h3>
              <p className="text-xs text-slate-400">MonkeyOCR v2 PDF Renderer & Layout Parser</p>
            </div>
          </div>
        )}

        {/* ── STATE 1: BLANK / EMPTY WORKSPACE (No Document Loaded) ── */}
        {!selectedDoc && !isLoading && (
          <div className="max-w-xl w-full p-8 rounded-3xl glass-panel border border-slate-800 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-red-500/10 to-indigo-500/10 border border-red-500/20 flex items-center justify-center shadow-inner">
              <UploadCloud className="w-10 h-10 text-red-400 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-100">
                Unggah Dokumen atau Pilih Sampel
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
                Silakan unggah berkas <strong>PDF</strong> atau gambar (<strong>PNG/JPG</strong>). Berkas akan ditampilkan di tengah canvas, lalu Anda dapat menekan tombol <strong>Identify Character</strong> untuk memindai word-level OCR.
              </p>
            </div>

            {/* Big Primary Upload Button */}
            <div className="flex flex-col items-center gap-3">
              <label className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm flex items-center justify-center space-x-2 cursor-pointer shadow-xl shadow-red-950/60 transition-all hover:scale-[1.02]">
                <Upload className="w-5 h-5" />
                <span>Pilih Berkas PDF / Gambar</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Sample Document Quick Options */}
              <div className="pt-2 w-full">
                <span className="text-[11px] text-slate-500 block mb-2 font-medium">
                  — ATAU PILIH DOKUMEN SAMPEL —
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {SAMPLE_DOCUMENTS.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => handleSelectSample(doc)}
                      className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-red-500/40 text-left transition-all group flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-200 group-hover:text-red-300">
                          {doc.title}
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase">{doc.type}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-red-400 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STATE 2: DOCUMENT LOADED (Center Preview + Bounding Box Trigger) ── */}
        {selectedDoc && (
          <div className="relative flex flex-col items-center">
            {/* Top Action Banner above Document */}
            <div className="mb-4 z-20 px-4 py-2 rounded-full glass-panel border border-slate-700 text-xs text-slate-300 flex items-center space-x-3 shadow-xl">
              {!isIdentifying ? (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                  <span>Dokumen telah dimuat. Klik tombol untuk memindai aksara:</span>
                  <button
                    onClick={handleTriggerIdentify}
                    className="px-3 py-1 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1 shadow-md transition-all hover:scale-105"
                  >
                    <Search className="w-3 h-3" />
                    <span>Identify Character</span>
                  </button>
                </>
              ) : (
                <>
                  <MousePointer className="w-4 h-4 text-red-400 animate-bounce" />
                  <span>Arahkan kursor / <strong>Hover</strong> pada kotak word-level untuk melihat Kamus, HanziVG, & Grammar</span>
                  <span className="flex items-center gap-1 text-emerald-400 font-medium ml-2 border-l border-slate-700 pl-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {totalTokens} Word Box Active
                  </span>
                </>
              )}
            </div>

            {/* Scalable Document Container */}
            <div
              className="relative transition-transform duration-200 ease-out shadow-2xl rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 group select-none"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center center',
                maxWidth: '900px',
                width: '100%',
              }}
            >
              {/* Rendered Document Image / PDF Canvas */}
              <img
                src={selectedDoc.imageUrl}
                alt={selectedDoc.title}
                className="w-full h-auto object-cover opacity-95 brightness-95 contrast-105"
              />

              {/* Word-Level Interactive Bounding Box Overlay Layer (Shown ONLY after Identify Character is clicked) */}
              {isIdentifying && (
                <div className="absolute inset-0 z-10 pointer-events-auto">
                  {selectedDoc.blocks.map((block) =>
                    block.tokens.map((token) => {
                      const isHovered = hoveredTokenId === token.id;
                      const isActive = activeTokenId === token.id;

                      return (
                        <div
                          key={token.id}
                          onMouseEnter={(e) => {
                            setHoveredTokenId(token.id);
                            onSelectToken(token, { x: e.clientX, y: e.clientY });
                          }}
                          onClick={(e) => {
                            onSelectToken(token, { x: e.clientX, y: e.clientY });
                          }}
                          className={`absolute cursor-pointer rounded transition-all duration-150 flex items-center justify-center ${
                            isActive || isHovered
                              ? 'border-2 border-red-500 bg-red-500/35 shadow-lg shadow-red-500/50 scale-105 z-30 bbox-active'
                              : 'border border-amber-400/60 bg-amber-400/15 hover:border-red-400 hover:bg-red-500/25'
                          }`}
                          style={{
                            left: `${token.bbox.x}%`,
                            top: `${token.bbox.y}%`,
                            width: `${token.bbox.width}%`,
                            height: `${token.bbox.height}%`,
                          }}
                        >
                          {/* Tooltip character label on hover */}
                          {(isHovered || isActive) && (
                            <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold font-chinese whitespace-nowrap shadow-md z-40">
                              {token.chinese} ({token.pinyin})
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
