import React, { useState } from 'react';
import { OCRDocument, DocumentWordToken } from '../types';
import { SAMPLE_DOCUMENTS } from '../data/sample_documents';
import { OCREngine } from '../services/ocrEngine';
import {
  Upload, FileText, Sparkles, ZoomIn, ZoomOut, RotateCcw,
  MousePointer, ChevronLeft, ChevronRight, Search, FileCode,
  Eye, EyeOff, CheckCircle2
} from 'lucide-react';

interface DocumentReaderProps {
  onSelectToken: (token: DocumentWordToken, mousePos: { x: number; y: number }) => void;
  activeTokenId?: string;
}

export const DocumentReader: React.FC<DocumentReaderProps> = ({
  onSelectToken,
  activeTokenId,
}) => {
  const [selectedDoc, setSelectedDoc] = useState<OCRDocument>(SAMPLE_DOCUMENTS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Menganalisis Dokumen...');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredTokenId, setHoveredTokenId] = useState<string | null>(null);
  const [isIdentifying, setIsIdentifying] = useState(true);

  // Total word-level tokens detected in current document
  const totalTokens = selectedDoc.blocks.reduce((acc, b) => acc + b.tokens.length, 0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setIsIdentifying(false); // Hide previous bounding boxes during upload
    setLoadingText(
      file.type.includes('pdf') || file.name.endsWith('.pdf')
        ? 'Merendisi PDF & Memindai Word-Level OCR...'
        : 'Menganalisis Gambar & Memindai Word-Level OCR...'
    );

    try {
      const doc = await OCREngine.processCustomDocument(file, 1);
      setSelectedDoc(doc);
      // Automatically show word-level bounding boxes AFTER document is loaded & identified!
      setIsIdentifying(true);
    } catch (err) {
      console.error('Failed to process document:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = async (newPageNum: number) => {
    if (!selectedDoc.fileObj || !selectedDoc.pdfTotalPages) return;
    if (newPageNum < 1 || newPageNum > selectedDoc.pdfTotalPages) return;

    setIsLoading(true);
    setIsIdentifying(false);
    setLoadingText(`Merendisi Halaman PDF ${newPageNum} & Memindai Word-Level OCR...`);
    try {
      const updatedDoc = await OCREngine.processCustomDocument(selectedDoc.fileObj, newPageNum);
      setSelectedDoc(updatedDoc);
      setIsIdentifying(true);
    } catch (err) {
      console.error('Failed to render PDF page:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerIdentify = () => {
    setIsLoading(true);
    setLoadingText('Memproses Ulang Word-Level Bounding Box...');
    setTimeout(() => {
      setIsIdentifying(true);
      setIsLoading(false);
    }, 400);
  };

  const handleSelectSample = (doc: OCRDocument) => {
    setIsLoading(true);
    setIsIdentifying(false);
    setLoadingText('Memuat Sampel Dokumen...');
    setTimeout(() => {
      setSelectedDoc(doc);
      setIsIdentifying(true);
      setIsLoading(false);
    }, 300);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950">
      {/* Top Bar Controls */}
      <div className="h-16 px-6 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {selectedDoc.type === 'pdf' ? (
              <FileCode className="w-5 h-5 text-red-500" />
            ) : (
              <FileText className="w-5 h-5 text-red-500" />
            )}
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-slate-100 text-sm tracking-wide max-w-xs truncate">
                {selectedDoc.title}
              </h2>
              <span className="px-1.5 py-0.5 text-[10px] font-mono bg-red-500/20 text-red-300 border border-red-500/30 rounded uppercase">
                {selectedDoc.type}
              </span>
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
                  selectedDoc.id === doc.id
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

          {/* Bounding Box Toggle & Counter */}
          <button
            onClick={() => setIsIdentifying(!isIdentifying)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              isIdentifying
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Tampilkan / Sembunyikan Bounding Box Word-Level"
          >
            {isIdentifying ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{isIdentifying ? `Bounding Box (${totalTokens} Kata)` : 'Sembunyikan Box'}</span>
          </button>

          {/* Identify OCR Button */}
          <button
            onClick={handleTriggerIdentify}
            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            title="Memindai Ulang Word-Level OCR"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Scan OCR</span>
          </button>

          {/* PDF Page Navigation Controls */}
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

          {/* Upload Button */}
          <label className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-semibold flex items-center space-x-2 cursor-pointer shadow-lg shadow-red-950/50 transition-all hover:scale-105">
            <Upload className="w-4 h-4" />
            <span>Unggah Dokumen (PDF/Gambar)</span>
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
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-40 flex flex-col items-center justify-center space-y-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-full border-4 border-red-500/20 border-t-red-500 animate-spin flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-red-500 animate-pulse" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-slate-200 text-base">{loadingText}</h3>
              <p className="text-xs text-slate-400">Word-Level Character Recognition & Precise Bounding Box Generation</p>
            </div>
          </div>
        )}

        {/* Floating Instruction Banner */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full glass-panel border border-slate-700 text-xs text-slate-300 flex items-center space-x-2 shadow-xl">
          <MousePointer className="w-4 h-4 text-red-400 animate-bounce" />
          <span>Arahkan kursor / <strong>Hover</strong> pada kotak word-level untuk melihat Kamus, HanziVG, & Grammar</span>
          {isIdentifying && totalTokens > 0 && (
            <span className="flex items-center gap-1 text-emerald-400 font-medium ml-2 border-l border-slate-700 pl-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {totalTokens} Word Box Active
            </span>
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
            className="w-full h-auto object-cover opacity-90 brightness-95 contrast-105"
          />

          {/* Word-Level Interactive Bounding Box Overlay Layer */}
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
    </div>
  );
};
