import React, { useState, useRef } from 'react';
import { OCRDocument, DocumentWordToken } from '../types';
import { OCREngine } from '../services/ocrEngine';
import {
  Upload, FileText, ZoomIn, ZoomOut, RotateCcw,
  MousePointer, ChevronLeft, ChevronRight, Search, FileCode,
  Eye, EyeOff, CheckCircle2, UploadCloud, XCircle, Maximize2, RefreshCw,
  Camera
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
  const [loadingText, setLoadingText] = useState('Analyzing Document...');
  const [zoomLevel, setZoomLevel] = useState(0.85); // Comfortable default zoom to avoid clipping
  const [hoveredTokenId, setHoveredTokenId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Bounding boxes are NOT shown until the user triggers "Identify Characters"
  const [isIdentifying, setIsIdentifying] = useState(false);

  // Total word-level tokens detected in current document
  const totalTokens = selectedDoc
    ? selectedDoc.blocks.reduce((acc, b) => acc + b.tokens.length, 0)
    : 0;

  const handleFitPage = () => {
    if (!containerRef.current) return;
    const containerH = containerRef.current.clientHeight - 130;
    // Standard page aspect ratio ~1.414, base width 850px -> ~1200px height at 100%
    const optimalZoom = Math.min(1.0, Math.max(0.25, Math.round((containerH / 1200) * 20) / 20));
    setZoomLevel(optimalZoom);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setIsIdentifying(false); // Do not show bounding boxes yet
    setLoadingText(
      file.type.includes('pdf') || file.name.endsWith('.pdf')
        ? 'Rendering PDF Page & Parsing Layout...'
        : 'Loading Document Image...'
    );

    try {
      const doc = await OCREngine.processCustomDocument(file, 1);
      setSelectedDoc(doc);
      // Document is loaded in center, bounding boxes NOT shown until "Identify Characters" is clicked!
      setIsIdentifying(false);
      // Auto-fit page on load so entire text is visible from top to bottom
      setTimeout(() => handleFitPage(), 100);
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
    setLoadingText(`Rendering PDF Page ${newPageNum}...`);
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
    setLoadingText('Detecting Characters & Scanning Word-Level Bounding Boxes...');
    setTimeout(() => {
      setIsIdentifying(true);
      setIsLoading(false);
    }, 500);
  };

  const handleClearDocument = () => {
    setSelectedDoc(null);
    setIsIdentifying(false);
    setZoomLevel(0.85);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950 font-sans">
      {/* Top Bar Controls */}
      <div className="h-16 px-4 sm:px-6 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-20 shrink-0 gap-2">
        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
          <div className="flex items-center space-x-2 min-w-0">
            {selectedDoc?.type === 'pdf' ? (
              <FileCode className="w-5 h-5 text-rose-500 shrink-0" />
            ) : (
              <FileText className="w-5 h-5 text-rose-500 shrink-0" />
            )}
            <div className="flex items-center space-x-2 min-w-0">
              <h2 className="font-bold text-slate-100 text-xs sm:text-sm tracking-wide max-w-[140px] sm:max-w-xs truncate">
                {selectedDoc ? selectedDoc.title : 'No Document Loaded'}
              </h2>
              {selectedDoc && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded uppercase shrink-0">
                  {selectedDoc.type}
                </span>
              )}
            </div>
          </div>

          <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

          {/* Quick Camera & File Upload in Top Bar */}
          <div className="flex items-center space-x-1.5">
            <label
              className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white cursor-pointer border border-rose-500 flex items-center gap-1.5 text-xs font-semibold shadow transition-all shrink-0"
              title="Take Photo with Mobile Camera"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Camera</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <label
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer border border-slate-700 flex items-center gap-1.5 text-xs font-semibold transition-all shrink-0"
              title="Upload Image or PDF File"
            >
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Upload</span>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {selectedDoc && (
              <button
                onClick={handleClearDocument}
                className="p-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
                title="Close Document"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-3">
          {selectedDoc && (
            <>
              {/* Identify Characters Action Button */}
              <button
                onClick={handleTriggerIdentify}
                className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition-all shadow-lg ${
                  isIdentifying
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-emerald-950/40'
                    : 'bg-slate-100 hover:bg-white text-slate-900 border-slate-200 shadow-slate-950/50'
                }`}
                title="Run Word-Level Character Recognition"
              >
                <Search className="w-3.5 h-3.5 text-slate-900" />
                <span>{isIdentifying ? 'Re-Scan OCR' : 'Identify Characters'}</span>
              </button>

              {/* Bounding Box Toggle */}
              {isIdentifying && (
                <button
                  onClick={() => setIsIdentifying(!isIdentifying)}
                  className="px-3 py-1.5 rounded-xl border bg-slate-800 border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition-all"
                  title="Toggle Bounding Boxes"
                >
                  {isIdentifying ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{isIdentifying ? `Hide Boxes (${totalTokens})` : 'Show Boxes'}</span>
                </button>
              )}

              {/* PDF Page Navigation */}
              {selectedDoc.type === 'pdf' && selectedDoc.pdfTotalPages && selectedDoc.pdfTotalPages > 1 && (
                <div className="flex items-center bg-slate-800/80 rounded-xl border border-slate-700 p-1 text-xs">
                  <button
                    onClick={() => handlePageChange((selectedDoc.pdfPageNumber || 1) - 1)}
                    disabled={(selectedDoc.pdfPageNumber || 1) <= 1}
                    className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 font-mono text-slate-300">
                    Page {selectedDoc.pdfPageNumber || 1} / {selectedDoc.pdfTotalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange((selectedDoc.pdfPageNumber || 1) + 1)}
                    disabled={(selectedDoc.pdfPageNumber || 1) >= selectedDoc.pdfTotalPages}
                    className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent"
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Zoom controls */}
              <div className="flex items-center bg-slate-800/80 rounded-xl border border-slate-700 p-1 text-xs">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.25, Number((z - 0.1).toFixed(2))))}
                  className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
                  title="Zoom Out (down to 25%)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="px-2 font-mono text-slate-300 min-w-[46px] text-center font-semibold">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(2.0, Number((z + 0.1).toFixed(2))))}
                  className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
                  title="Zoom In (up to 200%)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleFitPage}
                  className="px-2 py-1 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white text-[11px] font-medium border-l border-slate-700 ml-1 transition-colors flex items-center gap-1"
                  title="Fit Full Page to Screen"
                >
                  <Maximize2 className="w-3 h-3 text-rose-400" />
                  <span>Fit Page</span>
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-200 ml-1 border-l border-slate-700 transition-colors"
                  title="Reset Zoom to 100%"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Clear Document Button */}
              <button
                onClick={handleClearDocument}
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 transition-colors"
                title="Close Document"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Camera Button */}
          <label className="p-2 sm:px-3 sm:py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-lg transition-all hover:scale-105" title="Take Photo with Mobile Camera">
            <Camera className="w-4 h-4 text-white" />
            <span className="hidden sm:inline">Camera</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Upload Button */}
          <label className="px-3 sm:px-4 py-2 rounded-xl bg-slate-100 hover:bg-white text-slate-900 text-xs font-semibold flex items-center space-x-2 cursor-pointer shadow-lg transition-all hover:scale-105">
            <Upload className="w-4 h-4 text-slate-900" />
            <span className="hidden sm:inline">Upload Document</span>
            <span className="sm:hidden">Upload</span>
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
      <div
        ref={containerRef}
        className="flex-1 relative overflow-auto p-6 flex flex-col items-center justify-start bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]"
      >

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-40 flex flex-col items-center justify-center space-y-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-rose-500 animate-spin" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-slate-200 text-base">{loadingText}</h3>
              <p className="text-xs text-slate-400">MonkeyOCR v2 PDF Renderer & Layout Parser</p>
            </div>
          </div>
        )}

        {/* ── STATE 1: BLANK / EMPTY WORKSPACE (No Document Loaded) ── */}
        {!selectedDoc && !isLoading && (
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl glass-panel border border-slate-800 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 my-auto mx-4">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-inner">
              <UploadCloud className="w-10 h-10 text-rose-400 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-100">
                Upload Document or Take Photo
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                Capture printed documents directly with your mobile camera, or upload an existing PDF / image from your device.
              </p>
            </div>

            {/* Mobile & Desktop Action Buttons */}
            <div className="flex flex-col gap-3 w-full">
              <label className="w-full py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm flex items-center justify-center space-x-2.5 cursor-pointer shadow-xl shadow-rose-950/40 transition-all hover:scale-[1.02]">
                <Camera className="w-5 h-5 text-white" />
                <span>Take Photo with Camera</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <label className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-100 font-bold text-sm flex items-center justify-center space-x-2.5 cursor-pointer border border-slate-700 shadow-xl transition-all hover:scale-[1.02]">
                <Upload className="w-5 h-5 text-slate-300" />
                <span>Choose Image or PDF File</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {/* ── STATE 2: DOCUMENT LOADED (Center Preview + Bounding Box Trigger) ── */}
        {selectedDoc && (
          <div className="relative flex flex-col items-center w-full min-h-0 pt-2 pb-20">
            {/* Top Action Banner above Document */}
            <div className="mb-4 z-20 px-4 py-2 rounded-full glass-panel border border-slate-700 text-xs text-slate-300 flex items-center space-x-3 shadow-xl shrink-0">
              {!isIdentifying ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Document loaded. Click button to scan characters:</span>
                  <button
                    onClick={handleTriggerIdentify}
                    className="px-3 py-1 rounded-full bg-slate-100 hover:bg-white text-slate-900 font-bold text-xs flex items-center space-x-1 shadow-md transition-all hover:scale-105"
                  >
                    <Search className="w-3 h-3 text-slate-900" />
                    <span>Identify Characters</span>
                  </button>
                </>
              ) : (
                <>
                  <MousePointer className="w-4 h-4 text-rose-400 animate-bounce" />
                  <span>Hover over any bounding box to view Dictionary, HanziVG Stroke Order, & Grammar</span>
                  <span className="flex items-center gap-1 text-emerald-400 font-medium ml-2 border-l border-slate-700 pl-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {totalTokens} Word Boxes Active
                  </span>
                </>
              )}
            </div>

            {/* Scalable Document Container */}
            <div
              className="relative transition-all duration-150 ease-out shadow-2xl rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 group select-none shrink-0"
              style={{
                width: `${Math.round(850 * zoomLevel)}px`,
                maxWidth: 'none',
              }}
            >
              {/* Rendered Document Image / PDF Canvas */}
              <img
                src={selectedDoc.imageUrl}
                alt={selectedDoc.title}
                className="w-full h-auto object-contain block opacity-95 brightness-95 contrast-105"
              />

              {/* Word-Level Interactive Bounding Box Overlay Layer (Shown ONLY after Identify Characters is clicked) */}
              {isIdentifying && (
                <div className="absolute inset-0 z-10 pointer-events-auto">
                  {selectedDoc.blocks.map((block) =>
                    block.tokens.map((token) => {
                      const isHovered = hoveredTokenId === token.id;
                      const isActive = activeTokenId === token.id;

                      const isChineseChar = /[\u4e00-\u9fa5]/.test(token.chinese);

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
                          className={`absolute cursor-pointer rounded-[3px] transition-all duration-100 flex items-center justify-center ${
                            isActive || isHovered
                              ? isChineseChar
                                ? 'border-2 border-rose-500 bg-rose-500/30 shadow-md shadow-rose-950/60 z-30 ring-1 ring-rose-400/50'
                                : 'border-2 border-indigo-400 bg-indigo-500/30 shadow-md shadow-indigo-950/60 z-30 ring-1 ring-indigo-400/50'
                              : isChineseChar
                              ? 'border border-rose-500/40 bg-rose-500/8 hover:border-rose-400 hover:bg-rose-500/25'
                              : 'border border-indigo-400/40 bg-indigo-500/8 hover:border-indigo-300 hover:bg-indigo-500/25'
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
                            <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-100 text-[10px] font-bold font-chinese whitespace-nowrap shadow-xl z-40 flex items-center gap-1">
                              <span className="text-rose-400">{token.chinese}</span>
                              <span className="text-slate-400 font-normal">({token.pinyin})</span>
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
