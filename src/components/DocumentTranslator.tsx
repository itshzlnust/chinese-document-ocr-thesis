import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Languages, Columns, Copy, Check, Download,
  FileText, ArrowRight, Upload, RefreshCw, Zap,
  Globe, AlertCircle, Printer, FileCheck,
  ArrowLeftRight, X, BookOpen, AlignLeft,
  Search, ChevronRight, Bookmark, Volume2, Sun, Moon,
  ListTree
} from 'lucide-react';
import {
  NMTTranslationService,
  TranslationDirection,
  DocumentTranslationResult,
} from '../services/nmtTranslationService';
import { DictionaryService } from '../services/dictionary';
import { getDictionaryEntry } from '../data/cc_cedict_sample';

interface TranslatedBlock {
  id: string;
  original: string;
  translated: string;
  timeMs?: number;
  source: 'nmt-backend' | 'cloud-ai' | 'fallback';
}

interface DocumentTranslatorProps {
  onAddFlashcard?: (word: string, pinyin: string, def: string, sourceSentence?: string) => void;
}

export const DocumentTranslator: React.FC<DocumentTranslatorProps> = ({ onAddFlashcard }) => {
  // Main workflow tab: 'document' (Full Document PDF/TXT) or 'text' (Quick Text snippet)
  const [activeWorkflow, setActiveWorkflow] = useState<'document' | 'text'>('document');

  // Translation Direction: default to 'zh-en' or 'en-zh'
  const [direction, setDirection] = useState<TranslationDirection>('zh-en');

  // Backend status
  const [backendStatus, setBackendStatus] = useState<{
    online: boolean;
    model: string;
    zhEnLoaded: boolean;
    enZhLoaded: boolean;
  }>({ online: false, model: '...', zhEnLoaded: false, enZhLoaded: false });

  // ── Document Translation State ──
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docPageCount, setDocPageCount] = useState<number>(1);
  const [rangeMode, setRangeMode] = useState<'all' | 'custom'>('all');
  const [pageRangeStart, setPageRangeStart] = useState<number>(1);
  const [pageRangeEnd, setPageRangeEnd] = useState<number>(5);

  const [docTranslating, setDocTranslating] = useState(false);
  const [docProgress, setDocProgress] = useState<{
    current: number;
    total: number;
    percent: number;
    message: string;
  }>({ current: 0, total: 0, percent: 0, message: '' });
  const [docResult, setDocResult] = useState<DocumentTranslationResult | null>(null);
  const [docError, setDocError] = useState<string | null>(null);

  // ── Layout Modes matching Supervisor's specification ──
  // 'interlinear': Di bawah tiap baris / kalimat (Supervisor recommendation!)
  // 'split-doc': Dua kolom bersanding
  // 'single-doc': Satu dokumen utuh bahasa target
  const [docLayoutMode, setDocLayoutMode] = useState<'interlinear' | 'split-doc' | 'single-doc'>('interlinear');

  // Granularity for interlinear: 'sentence' (memenggal per kalimat) vs 'paragraph' (memenggal per paragraf)
  const [granularity, setGranularity] = useState<'sentence' | 'paragraph'>('sentence');

  // Theme & Reading settings
  const [docTheme, setDocTheme] = useState<'paper' | 'dark'>('paper'); // Kertas A4 vs Mode Gelap
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [indentParagraphs, setIndentParagraphs] = useState<boolean>(true);
  const [showOutline, setShowOutline] = useState<boolean>(true);
  const [searchDocQuery, setSearchDocQuery] = useState<string>('');

  const [copiedDoc, setCopiedDoc] = useState(false);

  // In-document word lookup pop-up (F4 & F5)
  const [selectedWord, setSelectedWord] = useState<{
    word: string;
    pinyin: string;
    meaning: string;
    sourceSentence: string;
    pos: { x: number; y: number };
  } | null>(null);
  const [savedWordStatus, setSavedWordStatus] = useState<string | null>(null);

  // ── Text Snippet Translation State ──
  const [inputText, setInputText] = useState(
    '学习汉字是一项很有趣的挑战。通过文档识别系统，学生可以快速提高阅读能力。\n\n本系统结合预训练OPUS-MT神经机器翻译模型与SuperMemo-2算法，实现文档级高效双语对照学习。'
  );
  const [textBlocks, setTextBlocks] = useState<TranslatedBlock[]>([]);
  const [isTranslatingText, setIsTranslatingText] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const docCanvasRef = useRef<HTMLDivElement>(null);

  // Language options
  const directionOptions: { value: TranslationDirection; label: string; flag: string; src: string; tgt: string }[] = [
    { value: 'zh-en', label: 'Mandarin ➔ English', flag: '🇨🇳 ➔ 🇬🇧', src: 'zh', tgt: 'en' },
    { value: 'en-zh', label: 'English ➔ Mandarin (中文)', flag: '🇬🇧 ➔ 🇨🇳', src: 'en', tgt: 'zh' },
    { value: 'zh-id', label: 'Mandarin ➔ Indonesian', flag: '🇨🇳 ➔ 🇮🇩', src: 'zh', tgt: 'id' },
    { value: 'en-id', label: 'English ➔ Indonesian', flag: '🇬🇧 ➔ 🇮🇩', src: 'en', tgt: 'id' },
    { value: 'id-zh', label: 'Indonesian ➔ Mandarin (中文)', flag: '🇮🇩 ➔ 🇨🇳', src: 'id', tgt: 'zh' },
    { value: 'id-en', label: 'Indonesian ➔ English', flag: '🇮🇩 ➔ 🇬🇧', src: 'id', tgt: 'en' },
  ];

  const handleSwapDirection = () => {
    if (direction === 'en-zh') setDirection('zh-en');
    else if (direction === 'zh-en') setDirection('en-zh');
    else if (direction === 'en-id') setDirection('id-en');
    else if (direction === 'id-en') setDirection('en-id');
    else if (direction === 'zh-id') setDirection('id-zh');
    else if (direction === 'id-zh') setDirection('zh-id');
  };

  useEffect(() => {
    NMTTranslationService.checkBackend().then(setBackendStatus);
    const interval = setInterval(
      () => NMTTranslationService.checkBackend().then(setBackendStatus),
      12000
    );
    return () => clearInterval(interval);
  }, []);

  // ── Document Translation Handlers ──
  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocFile(file);
    setDocResult(null);
    setDocError(null);

    // Auto-detect page count
    NMTTranslationService.getDocPageCount(file).then((count) => {
      setDocPageCount(count);
      setPageRangeEnd(Math.min(count, 5));
    });
  };

  const handleDocDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setDocFile(file);
      setDocResult(null);
      setDocError(null);
      NMTTranslationService.getDocPageCount(file).then((count) => {
        setDocPageCount(count);
        setPageRangeEnd(Math.min(count, 5));
      });
    }
  };

  // 1. One-click Sample: Chinese Academic Document (Pak Henokh's exact specification)
  const handleLoadSampleChineseDocument = () => {
    const sampleChineseText = `基于深度学习的中文文档解析与双语对照学习系统

作者：Ilham Ahmad Fahriji (NIM: 10231042)
指导教师：Henokh Lugo Hariyanto, S.Si., M.Sc.
Institut Teknologi Kalimantan (ITK)

第一章：研究背景与意义

1.1 汉字学习的现状与挑战
汉语是世界上使用人数最多的语言之一，具有悠久的历史和独特的表意文字系统。汉字（Hanzi）与拉丁文字不同，它属于表意文字，字形与读音之间没有直接的拼读对应关系。因此，学习者在阅读中文文档时，不仅需要掌握汉字的字形与含义，还需要借助汉语拼音来辅助正确发音。

此外，在数字化转型的背景下，许多珍贵的学术文献和扫描文档仍缺乏连贯语境翻译。学习者在面对这些扫描文档时，面临文字难以提取、词汇查询困难以及缺乏双语排版的问题。

Table 1
| 模块名称 | 算法模型 | 字符识别精度 | 响应延迟 | 版面保真度 |
| 文档版面解析 | MonkeyOCR v2 | 98.6% | 120ms | 完整对齐 |
| 神经机器翻译 | Helsinki-NLP OPUS-MT | BLEU 38.4 | 85ms | 逐句对照 |
| 记忆复习调度 | SuperMemo-2 (SM2) | 自适应间隔 | <10ms | 动态生成 |

1.2 本文研究目标
针对现有中文学习平台操作割裂、无法在完整文档语境下进行即时对照翻译的问题，本课题设计并实现了 LexiDoc 学习空间：
• 采用 MonkeyOCR v2 深度学习框架进行高精度文档版面解析与字符识别。
• 集成 Helsinki-NLP OPUS-MT 预训练神经机器翻译模型，实现逐行逐句的高质量双语排版。
• 结合 SuperMemo-2 (SM2) 自适应间隔重复算法，实现生词与来源句一键加入记忆卡片。

参考文献：
[1] Vaswani, A., et al. (2017). Attention is all you need. Advances in Neural Information Processing Systems.
[2] Wozniak, P. A. (1990). Optimization of learning: A new approach to spaced repetition.`;

    const blob = new Blob([sampleChineseText], { type: 'text/plain;charset=utf-8' });
    const file = new File([blob], 'LexiDoc_Mandarin_Academic_Paper.txt', { type: 'text/plain' });
    setDocFile(file);
    setDirection('zh-en'); // Mandarin to English
    setDocPageCount(1);
    setDocResult(null);
    setDocError(null);
  };

  // 2. One-click Sample: Pak Henokh's exact academic document reference with Table 1
  const handleLoadSupervisorSample = () => {
    const supervisorSampleText = `学业制度概要
Summary of the Academic System

学业制度
Academic System

Table 1
| 培养层次 | 硕士生 | 博士生 | 硕博连读 | 备注 |
| 学期学制 (2003年秋季起) | 硕士标准注册 | 博士标准注册 | 连读标准注册 | 学费缴纳标准 |
| 1~4学期注册类型 | 标准学籍注册 | 标准学籍注册 | 标准学籍注册 | 全额学费 |
| 5~8学期注册类型 | 科研学籍注册 | 基础学费标准 | 标准学籍注册 | 科研阶段 |
| 9~10学期注册类型 | 科研学籍注册 | 科研学籍注册 | 基础学费标准 | 论文撰写 |

• 各培养阶段注册类型与学分要求 (适用于2019学年及之前入学的学生)
• 硕博连读研究生培养阶段说明：1-8学期为标准注册，9-10学期缴纳基础学费，第11学期起为科研注册
• 各类注册学费标准：标准注册缴纳全额学费，基础学费约占总额30%，科研注册约占总额10%`;

    const blob = new Blob([supervisorSampleText], { type: 'text/plain;charset=utf-8' });
    const file = new File([blob], 'Supervisor_Academic_System_Sample.txt', { type: 'text/plain' });
    setDocFile(file);
    setDirection('zh-en');
    setDocPageCount(1);
    setDocResult(null);
    setDocError(null);
  };

  // 3. One-click Sample: English LexiDoc Thesis Proposal
  const handleLoadSampleProposal = () => {
    const sampleText = `DEVELOPMENT OF LEXIDOC: A DOCUMENT-BASED CHINESE-ENGLISH LEARNING SPACE FOR READING, TRANSLATING, AND REVIEWING VOCABULARY

By: Ilham Ahmad Fahriji (NIM: 10231042)
Institut Teknologi Kalimantan

CHAPTER 1: INTRODUCTION

1.1 Background
Mandarin Chinese is one of the most widely spoken and studied languages in the world, with close to 1.4 billion people using it as a native or second language. It is written with hanzi, or Chinese characters, which are logographic. Unlike alphabetic languages such as English, a single character can represent an entire morpheme or meaning rather than merely a sound.

1.2 Problem Statements
Currently, the learner workflow remains severely fragmented, as users must continuously switch between standalone scanning applications, external translation tools, and separate flashcard platforms, which introduces high operational friction.

1.3 Research Objectives
To address this operational limitation, this undergraduate thesis designs and implements LexiDoc:
1. To develop an interactive web platform that integrates MonkeyOCR v2 to perform document parsing on documents written in Chinese and English.
2. To integrate pretrained OPUS-MT models for real-time bidirectional translation with layout preservation.
3. To implement a one-click flashcard generator connected to an adaptive SuperMemo-2 (SM2) scheduling engine.`;

    const blob = new Blob([sampleText], { type: 'text/plain;charset=utf-8' });
    const file = new File([blob], 'LexiDoc_Proposal_Sample.txt', { type: 'text/plain' });
    setDocFile(file);
    setDirection('en-zh'); // English to Mandarin
    setDocPageCount(1);
    setDocResult(null);
    setDocError(null);
  };

  const handleTranslateDocument = useCallback(async () => {
    if (!docFile) return;
    setDocTranslating(true);
    setDocResult(null);
    setDocError(null);
    setDocProgress({ current: 0, total: 100, percent: 5, message: 'Preparing document...' });

    const currentOpt = directionOptions.find((d) => d.value === direction) || directionOptions[0];

    const range = rangeMode === 'custom'
      ? { startPage: pageRangeStart, endPage: pageRangeEnd }
      : undefined;

    try {
      const result = await NMTTranslationService.translateDocument(
        docFile,
        currentOpt.src,
        currentOpt.tgt,
        (progress) => {
          setDocProgress({
            current: progress.current,
            total: progress.total,
            percent: progress.percent,
            message: progress.message,
          });
        },
        range
      );
      setDocResult(result);
    } catch (err: any) {
      setDocError(err?.message || 'Failed to process document');
    } finally {
      setDocTranslating(false);
    }
  }, [docFile, direction, directionOptions, rangeMode, pageRangeStart, pageRangeEnd]);

  // Download complete structured translated document (.txt or .md)
  const handleDownloadStructuredDoc = (format: 'txt' | 'md') => {
    if (!docResult) return;
    const baseName = docResult.filename.replace(/\.[^/.]+$/, '');
    const content = docResult.fullTranslated;
    const mime = format === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8';
    const blob = new Blob([content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${baseName}_translated_${docResult.targetLang}.${format}`;
    a.click();
  };

  // Download complete bilingual document
  const handleDownloadBilingualDoc = () => {
    if (!docResult) return;
    const baseName = docResult.filename.replace(/\.[^/.]+$/, '');
    const blob = new Blob([docResult.bilingualText], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${baseName}_bilingual_${docResult.sourceLang}_to_${docResult.targetLang}.txt`;
    a.click();
  };

  // Download Microsoft Word .doc file
  const handleDownloadWordDoc = () => {
    if (!docResult) return;
    const baseName = docResult.filename.replace(/\.[^/.]+$/, '');
    const wordHtml = NMTTranslationService.generateWordHtml(docResult);
    const blob = new Blob([wordHtml], { type: 'application/msword;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${baseName}_interlinear_${docResult.targetLang}.doc`;
    a.click();
  };

  // Copy full structured document
  const handleCopyDoc = () => {
    if (!docResult) return;
    navigator.clipboard.writeText(docResult.fullTranslated);
    setCopiedDoc(true);
    setTimeout(() => setCopiedDoc(false), 2000);
  };

  // Print as complete document
  const handlePrintDoc = () => {
    if (!docResult) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>LexiDoc — ${docResult.filename}</title>
        <style>
          @page { size: A4; margin: 25mm 20mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", STKaiti, serif;
            color: #0f172a;
            line-height: 1.6;
            max-width: 820px;
            margin: 0 auto;
            padding: 24px;
          }
          .doc-header {
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 8px;
            margin-bottom: 24px;
          }
          .doc-meta {
            font-size: 11px;
            color: #64748b;
          }
          .sec-item {
            margin-bottom: 12px;
          }
          .orig-text {
            font-size: 13.5px;
            color: #0f172a;
            font-weight: 500;
          }
          .trans-text {
            font-size: 11.5px;
            color: #475569;
            margin-top: 2px;
          }
          .sec-title-orig {
            font-size: 20px;
            font-weight: bold;
            color: #0f172a;
            margin-top: 20px;
            margin-bottom: 3px;
          }
          .sec-title-trans {
            font-size: 14px;
            color: #334155;
            margin-bottom: 16px;
          }
          .sec-heading-orig {
            font-size: 15px;
            font-weight: bold;
            color: #0f172a;
            margin-top: 18px;
            margin-bottom: 2px;
          }
          .sec-heading-trans {
            font-size: 12px;
            color: #334155;
            margin-bottom: 10px;
          }
          .academic-table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0 16px 0;
            font-size: 11px;
          }
          .academic-table th, .academic-table td {
            border: 1px solid #64748b;
            padding: 6px 8px;
            vertical-align: top;
          }
          .academic-table tr:first-child {
            background-color: #f1f5f9;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="doc-header">
          <div class="doc-meta">
            ${docResult.filename} · Academic Interlinear Format · ${docResult.sourceLang.toUpperCase()} ➔ ${docResult.targetLang.toUpperCase()} · ${docResult.totalPages} Page(s)
          </div>
        </div>
        ${docResult.sections.map((sec) => {
          if (sec.type === 'title') {
            return `
              <div style="margin-bottom:18px;">
                <div class="sec-title-orig">${sec.original}</div>
                ${sec.translated ? `<div class="sec-title-trans">${sec.translated}</div>` : ''}
              </div>`;
          }
          if (sec.type === 'heading') {
            return `
              <div style="margin-top:16px; margin-bottom:8px;">
                <div class="sec-heading-orig">${sec.original}</div>
                ${sec.translated ? `<div class="sec-heading-trans">${sec.translated}</div>` : ''}
              </div>`;
          }
          if (sec.type === 'subheading') {
            return `
              <div style="margin-top:12px; margin-bottom:6px;">
                <div style="font-size:13px; font-weight:bold; color:#1e293b;">${sec.original}</div>
                ${sec.translated ? `<div style="font-size:11px; color:#475569; margin-top:1px;">${sec.translated}</div>` : ''}
              </div>`;
          }
          if (sec.type === 'table' && sec.tableRows && sec.tableRows.length > 0) {
            return `
              <table class="academic-table">
                <tbody>
                  ${sec.tableRows.map((row, rIdx) => `
                    <tr>
                      ${row.map(cell => `
                        <td>
                          <div style="font-weight:${rIdx === 0 ? 'bold' : 'normal'}; color:#0f172a;">${cell.original}</div>
                          ${cell.translated && cell.translated !== cell.original ? `<div style="color:#475569; font-size:10px; margin-top:2px;">${cell.translated}</div>` : ''}
                        </td>
                      `).join('')}
                    </tr>
                  `).join('')}
                </tbody>
              </table>`;
          }
          if (sec.type === 'list-item') {
            return `
              <div style="margin-left:14px; margin-bottom:8px;">
                <div class="orig-text">• ${sec.original}</div>
                ${sec.translated ? `<div class="trans-text" style="padding-left:12px;">${sec.translated}</div>` : ''}
              </div>`;
          }
          // Paragraph: Render sentences if available
          if (sec.sentences && sec.sentences.length > 1) {
            return `
              <div class="sec-item">
                ${sec.sentences.map(s => `
                  <div style="margin-bottom:6px;">
                    <div class="orig-text">${s.original}</div>
                    ${s.translated ? `<div class="trans-text">${s.translated}</div>` : ''}
                  </div>
                `).join('')}
              </div>`;
          }
          return `
            <div class="sec-item">
              <div class="orig-text">${sec.original}</div>
              ${sec.translated ? `<div class="trans-text">${sec.translated}</div>` : ''}
            </div>`;
        }).join('')}
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Scroll smoothly to section in the continuous document
  const handleScrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-red-500/80');
      setTimeout(() => el.classList.remove('ring-2', 'ring-red-500/80'), 1500);
    }
  };

  // In-document word click lookup (F4 & F5)
  const handleWordClick = (word: string, sourceSentence: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanWord = word.replace(/[^\u4e00-\u9fa5a-zA-Z]/g, '').trim();
    if (!cleanWord) return;

    const dict = getDictionaryEntry(cleanWord);

    setSelectedWord({
      word: cleanWord,
      pinyin: dict.pinyin || '',
      meaning: dict.englishDef || dict.indonesianDef || '',
      sourceSentence: sourceSentence,
      pos: { x: Math.min(window.innerWidth - 320, e.clientX + 10), y: Math.min(window.innerHeight - 220, e.clientY + 10) },
    });
    setSavedWordStatus(null);
  };

  // Add to flashcards handler
  const handleSaveSelectedWord = () => {
    if (!selectedWord) return;
    if (onAddFlashcard) {
      onAddFlashcard(
        selectedWord.word,
        selectedWord.pinyin,
        selectedWord.meaning,
        selectedWord.sourceSentence
      );
      setSavedWordStatus('Saved to Flashcard Deck!');
      setTimeout(() => setSelectedWord(null), 1200);
    }
  };

  // ── Text Snippet Handlers ──
  const handleTranslateText = async () => {
    if (!inputText.trim()) return;
    setIsTranslatingText(true);
    setTextBlocks([]);

    const paragraphs = inputText.split(/\n\s*\n/).filter(Boolean);
    const results: TranslatedBlock[] = [];

    for (const para of paragraphs) {
      const res = await NMTTranslationService.translate(para, direction);
      results.push({
        id: `blk-${Date.now()}-${Math.random()}`,
        original: para,
        translated: res.translated,
        timeMs: res.timeMs,
        source: res.source,
      });
    }

    setTextBlocks(results);
    setIsTranslatingText(false);
  };

  const handleCopyText = () => {
    const text = textBlocks.map((b) => b.translated).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const currentDirObj = directionOptions.find((d) => d.value === direction) || directionOptions[0];

  // Outline list (Headings only)
  const outlineSections = docResult
    ? docResult.sections.filter(
        (sec) => sec.type === 'title' || sec.type === 'heading' || sec.type === 'subheading'
      )
    : [];

  return (
    <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden bg-slate-950 font-sans text-slate-100" onClick={() => setSelectedWord(null)}>
      {/* ── TOP HEADER BAR (Clean Academic Header) ── */}
      <div className="px-4 md:px-6 py-2.5 min-h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 z-20 shrink-0 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-rose-600/10 border border-rose-500/30 shrink-0">
            <Languages className="w-5 h-5 text-rose-500" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-100 text-sm tracking-wide truncate">
                LexiDoc Document Translator
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded font-semibold whitespace-nowrap">
                Interlinear Layout
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              Structured Document Translation · Supervisor Specification Compliant
            </p>
          </div>
        </div>

        {/* Workflow Switcher Tabs: Document vs Text */}
        <div className="flex items-center bg-slate-800/80 rounded-xl border border-slate-700 p-1 text-xs shrink-0">
          <button
            onClick={() => setActiveWorkflow('document')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 font-medium transition-all ${
              activeWorkflow === 'document'
                ? 'bg-rose-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Full Document</span>
          </button>
          <button
            onClick={() => setActiveWorkflow('text')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 font-medium transition-all ${
              activeWorkflow === 'text'
                ? 'bg-rose-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5" />
            <span>Quick Text</span>
          </button>
        </div>

        {/* Controls right */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Direction Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 rounded-xl p-1 text-xs">
            <Globe className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as TranslationDirection)}
              className="bg-transparent text-slate-200 font-semibold px-1.5 py-1 outline-none cursor-pointer text-xs"
            >
              {directionOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-200">
                  {opt.label} ({opt.flag})
                </option>
              ))}
            </select>
            <button
              onClick={handleSwapDirection}
              className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Swap Language Direction"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-rose-400" />
            </button>
          </div>

          {/* Engine Status */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-medium whitespace-nowrap ${
              backendStatus.online
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                backendStatus.online ? 'bg-emerald-400' : 'bg-slate-400'
              }`}
            />
            <span className="hidden sm:inline">{backendStatus.online ? 'OPUS-MT Server' : 'OPUS-MT Engine'}</span>
          </div>
        </div>
      </div>

      {/* ── WORKFLOW 1: FULL DOCUMENT TRANSLATION (INTERLINEAR UNDER-THE-LINE) ── */}
      {activeWorkflow === 'document' && (
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

          {/* Document Upload Area & Controls Bar */}
          <div className="p-3 md:p-4 border-b border-slate-800/80 bg-slate-900/60 shrink-0 space-y-3 min-w-0">
            <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 min-w-0">

              {/* Upload Dropzone */}
              <div className="flex-1">
                <label
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDocDrop}
                  className={`w-full p-3 rounded-2xl border-2 border-dashed transition-all flex items-center justify-between cursor-pointer ${
                    docFile
                      ? 'bg-red-500/5 border-red-500/40 hover:border-red-500/60'
                      : 'bg-slate-900/80 border-slate-700 hover:border-red-500/40 hover:bg-slate-800/50'
                  }`}
                >
                  <input
                    type="file"
                    accept="application/pdf,text/plain,text/markdown"
                    onChange={handleDocFileChange}
                    className="hidden"
                  />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                      {docFile ? (
                        <FileCheck className="w-5 h-5 text-red-400" />
                      ) : (
                        <Upload className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      {docFile ? (
                        <div>
                          <p className="font-semibold text-slate-100 text-sm max-w-md truncate">
                            {docFile.name}
                          </p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{(docFile.size / 1024).toFixed(1)} KB</span>
                            <span>•</span>
                            <span className="text-red-400 font-medium">
                              {docFile.name.endsWith('.pdf') ? `PDF (${docPageCount} Pages)` : 'Text Document'}
                            </span>
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-semibold text-slate-200 text-sm">
                            Upload PDF / Text Document ({currentDirObj.label})
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Automatic interlinear translation directly beneath each line or sentence preserving structure
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!docFile && (
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={handleLoadSampleChineseDocument}
                          className="px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-xs text-red-200 font-medium transition-colors"
                          title="Original Chinese thesis paper with sections, lists, and Latin citations"
                        >
                          🇨🇳 Chinese Thesis Paper
                        </button>
                        <button
                          type="button"
                          onClick={handleLoadSupervisorSample}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-xs text-emerald-200 font-medium transition-colors"
                          title="Supervisor's exact Academic System reference document with Table 1"
                        >
                          🎓 Academic System (Table 1)
                        </button>
                        <button
                          type="button"
                          onClick={handleLoadSampleProposal}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 hover:text-white transition-colors"
                        >
                          🇬🇧 Thesis Proposal (EN)
                        </button>
                      </div>
                    )}

                    {docFile && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDocFile(null);
                          setDocResult(null);
                          setDocError(null);
                        }}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
                        title="Replace File"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </label>
              </div>

              {/* Page Range Selector for PDF */}
              {docFile && docFile.name.toLowerCase().endsWith('.pdf') && docPageCount > 1 && (
                <div className="shrink-0 flex items-center gap-2 bg-slate-900/80 border border-slate-800 p-2 rounded-2xl text-xs">
                  <span className="text-slate-400 text-[11px] font-medium ml-1">Range:</span>
                  <button
                    onClick={() => setRangeMode('all')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      rangeMode === 'all'
                        ? 'bg-red-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All ({docPageCount} Pages)
                  </button>
                  <button
                    onClick={() => setRangeMode('custom')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      rangeMode === 'custom'
                        ? 'bg-red-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Custom Pages
                  </button>

                  {rangeMode === 'custom' && (
                    <div className="flex items-center gap-1.5 font-mono text-slate-200 ml-1">
                      <input
                        type="number"
                        min={1}
                        max={docPageCount}
                        value={pageRangeStart}
                        onChange={(e) => setPageRangeStart(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-12 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-center text-xs"
                      />
                      <span>to</span>
                      <input
                        type="number"
                        min={pageRangeStart}
                        max={docPageCount}
                        value={pageRangeEnd}
                        onChange={(e) => setPageRangeEnd(Math.min(docPageCount, parseInt(e.target.value) || docPageCount))}
                        className="w-12 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-center text-xs"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Primary Action Button */}
              <div className="shrink-0 flex items-center gap-3">
                <button
                  onClick={handleTranslateDocument}
                  disabled={docTranslating || !docFile}
                  className="px-6 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 bg-red-600 hover:bg-red-500 text-white transition-all shadow-lg shadow-red-950/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {docTranslating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Translating Document...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>Translate Full Document</span>
                      <ArrowRight className="w-4 h-4 text-white/80" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Translation Progress Bar */}
            {docTranslating && (
              <div className="space-y-2 pt-2 animate-in fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 flex items-center gap-2 font-medium">
                    <RefreshCw className="w-3.5 h-3.5 text-red-400 animate-spin" />
                    {docProgress.message}
                  </span>
                  <span className="font-mono text-red-400 font-bold">{docProgress.percent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-red-600 transition-all duration-300 rounded-full"
                    style={{ width: `${docProgress.percent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {docError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{docError}</span>
              </div>
            )}
          </div>

          {/* ── DOCUMENT WORKSPACE: INTERLINEAR STRUCTURE ── */}
          <div className="flex-1 flex overflow-hidden bg-slate-950">

            {/* Empty State */}
            {!docResult && !docTranslating && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-md">
                  <BookOpen className="w-8 h-8 text-slate-500" />
                </div>
                <div className="space-y-1.5 max-w-md">
                  <h3 className="text-base font-bold text-slate-100">
                    Interlinear Document Translation (Supervisor Specification)
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    The engine places the translated output <strong>directly beneath each sentence or paragraph</strong> of the original document. Pure Latin lines, names, numbers, and citations are preserved without redundant translation.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={handleLoadSampleChineseDocument}
                    className="px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-xs text-red-200 font-semibold flex items-center gap-2 shadow"
                  >
                    <span>🇨🇳 Try Chinese Thesis Paper</span>
                  </button>
                  <button
                    onClick={handleLoadSupervisorSample}
                    className="px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-xs text-emerald-200 font-semibold flex items-center gap-2 shadow"
                  >
                    <span>🎓 Try Supervisor Academic System (Table 1)</span>
                  </button>
                  <button
                    onClick={handleLoadSampleProposal}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 hover:text-white font-medium flex items-center gap-2 shadow"
                  >
                    <span>🇬🇧 Try LexiDoc Proposal (EN)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Active Document View */}
            {docResult && !docTranslating && (
              <div className="flex-1 flex flex-col overflow-hidden">

                {/* Sub-Header Result Toolbar */}
                <div className="px-4 py-2 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0 min-w-0">
                  {/* Left: Result Stats & Outline toggle */}
                  <div className="flex items-center gap-2 text-xs flex-wrap min-w-0">
                    <button
                      onClick={() => setShowOutline(!showOutline)}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 ${
                        showOutline
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                      }`}
                      title="Toggle Table of Contents"
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                      <span>{showOutline ? 'Hide Contents' : 'Contents'}</span>
                    </button>

                    <span className="font-semibold text-slate-100 flex items-center gap-1.5 truncate max-w-[180px] sm:max-w-xs" title={docResult.filename}>
                      <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="truncate">{docResult.filename}</span>
                    </span>
                    <span className="text-slate-600 hidden sm:inline">•</span>
                    <span className="text-slate-300 font-mono text-[11px] whitespace-nowrap">
                      {docResult.totalPages}p ({docResult.totalWords}w)
                    </span>
                    <span className="text-slate-600 hidden sm:inline">•</span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30 text-[10px] font-mono font-medium whitespace-nowrap">
                      {docResult.sourceLang.toUpperCase()} ➔ {docResult.targetLang.toUpperCase()}
                    </span>
                  </div>

                  {/* Right: View Modes, Theme & Export Actions — with flex-wrap and min-w-0 */}
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    {/* View Modes */}
                    <div className="flex items-center bg-slate-800/90 rounded-xl border border-slate-700 p-0.5 text-xs shrink-0">
                      <button
                        onClick={() => setDocLayoutMode('interlinear')}
                        className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
                          docLayoutMode === 'interlinear'
                            ? 'bg-rose-600 text-white shadow-sm font-semibold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title="Interlinear: Translation directly beneath each line"
                      >
                        <ListTree className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Interlinear</span>
                      </button>
                      <button
                        onClick={() => setDocLayoutMode('split-doc')}
                        className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
                          docLayoutMode === 'split-doc'
                            ? 'bg-rose-600 text-white shadow-sm font-semibold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title="Side-by-Side Dual Column"
                      >
                        <Columns className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Split</span>
                      </button>
                      <button
                        onClick={() => setDocLayoutMode('single-doc')}
                        className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
                          docLayoutMode === 'single-doc'
                            ? 'bg-rose-600 text-white shadow-sm font-semibold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title="Full Translated Document"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Full</span>
                      </button>
                    </div>

                    {/* Interlinear Granularity */}
                    {docLayoutMode === 'interlinear' && (
                      <div className="flex items-center bg-slate-800/90 rounded-xl border border-slate-700 p-0.5 text-xs shrink-0">
                        <button
                          onClick={() => setGranularity('sentence')}
                          className={`px-2 py-1 rounded-lg font-medium transition-all text-xs ${
                            granularity === 'sentence'
                              ? 'bg-slate-700 text-white font-bold'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                          title="Segment by sentence"
                        >
                          Sentence
                        </button>
                        <button
                          onClick={() => setGranularity('paragraph')}
                          className={`px-2 py-1 rounded-lg font-medium transition-all text-xs ${
                            granularity === 'paragraph'
                              ? 'bg-slate-700 text-white font-bold'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                          title="Segment by paragraph"
                        >
                          Paragraph
                        </button>
                      </div>
                    )}

                    {/* Theme & Formatting */}
                    <div className="flex items-center bg-slate-800/90 rounded-xl border border-slate-700 p-0.5 text-xs shrink-0">
                      <button
                        onClick={() => setDocTheme('paper')}
                        className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-all ${
                          docTheme === 'paper'
                            ? 'bg-white text-slate-900 font-bold shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title="Paper A4 Theme"
                      >
                        <Sun className="w-3 h-3 text-amber-500" />
                        <span className="hidden md:inline">Paper</span>
                      </button>
                      <button
                        onClick={() => setDocTheme('dark')}
                        className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-all ${
                          docTheme === 'dark'
                            ? 'bg-slate-950 text-slate-100 font-bold border border-slate-700'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title="Dark Theme"
                      >
                        <Moon className="w-3 h-3 text-indigo-400" />
                        <span className="hidden md:inline">Dark</span>
                      </button>
                      <button
                        onClick={() => setFontSize(fontSize === 'lg' ? 'base' : 'sm')}
                        className={`px-1.5 py-1 rounded text-xs transition-all ${
                          fontSize === 'sm' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title="Small font size"
                      >
                        A-
                      </button>
                      <button
                        onClick={() => setFontSize('base')}
                        className={`px-1.5 py-1 rounded text-xs transition-all ${
                          fontSize === 'base' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title="Normal font size"
                      >
                        A
                      </button>
                      <button
                        onClick={() => setFontSize(fontSize === 'sm' ? 'base' : 'lg')}
                        className={`px-1.5 py-1 rounded text-xs transition-all ${
                          fontSize === 'lg' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title="Large font size"
                      >
                        A+
                      </button>
                      <button
                        onClick={() => setIndentParagraphs(!indentParagraphs)}
                        className={`px-2 py-1 rounded-lg font-sans text-xs ml-0.5 transition-all ${
                          indentParagraphs
                            ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title="Toggle Indent (2em)"
                      >
                        Indent
                      </button>
                    </div>

                    {/* Export Actions */}
                    <div className="flex items-center gap-1 bg-slate-800/90 rounded-xl border border-slate-700 p-0.5 text-xs shrink-0">
                      <button
                        onClick={handleCopyDoc}
                        className="px-2 py-1 rounded-lg hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors"
                        title="Copy Document Text"
                      >
                        {copiedDoc ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{copiedDoc ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button
                        onClick={handleDownloadWordDoc}
                        className="px-2 py-1 rounded-lg hover:bg-blue-600/30 text-blue-300 text-xs font-medium flex items-center gap-1 transition-colors"
                        title="Download Word (.doc)"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-400" />
                        <span>Word</span>
                      </button>
                      <button
                        onClick={() => handleDownloadStructuredDoc('md')}
                        className="px-2 py-1 rounded-lg hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors"
                        title="Download Markdown (.md)"
                      >
                        <Download className="w-3.5 h-3.5 text-amber-400" />
                        <span>MD</span>
                      </button>
                      <button
                        onClick={handleDownloadBilingualDoc}
                        className="px-2 py-1 rounded-lg hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors"
                        title="Download Bilingual (.txt)"
                      >
                        <Download className="w-3.5 h-3.5 text-indigo-400" />
                        <span>TXT</span>
                      </button>
                      <button
                        onClick={handlePrintDoc}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1 shadow transition-all"
                        title="Print / PDF"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── WORKSPACE SPLIT: LEFT OUTLINE DRAWER + RIGHT CONTINUOUS DOCUMENT CANVAS ── */}
                <div className="flex-1 min-w-0 flex overflow-hidden">

                  {/* Left Outline / TOC Drawer */}
                  {showOutline && (
                    <div className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col shrink-0 overflow-hidden text-xs">
                      {/* Outline Header & Search */}
                      <div className="p-3 border-b border-slate-800 space-y-2 shrink-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200 flex items-center gap-1.5">
                            <AlignLeft className="w-3.5 h-3.5 text-rose-400" />
                            Document Structure (Sections)
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {outlineSections.length} Sections
                          </span>
                        </div>
                        <div className="relative">
                          <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                          <input
                            type="text"
                            placeholder="Search section..."
                            value={searchDocQuery}
                            onChange={(e) => setSearchDocQuery(e.target.value)}
                            className="w-full pl-7 pr-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500/50"
                          />
                        </div>
                      </div>

                      {/* Outline List */}
                      <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {outlineSections
                          .filter((sec) =>
                            sec.translated.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
                            sec.original.toLowerCase().includes(searchDocQuery.toLowerCase())
                          )
                          .map((sec) => (
                            <button
                              key={sec.id}
                              onClick={() => handleScrollToSection(sec.id)}
                              className={`w-full text-left p-2 rounded-lg transition-all group flex items-start gap-2 hover:bg-slate-800 ${
                                sec.type === 'title'
                                  ? 'font-bold text-rose-300'
                                  : sec.type === 'heading'
                                  ? 'font-semibold text-slate-200 pl-3'
                                  : 'text-slate-400 pl-5 text-[11px]'
                              }`}
                            >
                              <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-rose-400 mt-0.5 shrink-0" />
                              <div className="flex-1 truncate">
                                <p className="truncate font-chinese">{sec.original}</p>
                                <p className="text-[10px] text-slate-500 truncate">{sec.translated || '(Original)'}</p>
                              </div>
                              <span className="text-[9px] font-mono text-slate-600 shrink-0">
                                p.{sec.pageNumber}
                              </span>
                            </button>
                          ))}
                      </div>

                      {/* Document Quick Stats Footer */}
                      <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-1 text-[11px] text-slate-400">
                        <div className="flex justify-between">
                          <span>Total Pages:</span>
                          <span className="font-mono text-slate-200">{docResult.totalPages}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Words:</span>
                          <span className="font-mono text-slate-200">{docResult.totalWords}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Est. Read Time:</span>
                          <span className="font-mono text-slate-200">
                            ~{Math.max(1, Math.round(docResult.totalWords / 160))} min
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── CONTINUOUS STRUCTURED DOCUMENT CANVAS ── */}
                  <div
                    ref={docCanvasRef}
                    className={`flex-1 min-w-0 overflow-y-auto overflow-x-auto p-4 sm:p-6 md:p-8 flex justify-center ${
                      docTheme === 'paper' ? 'bg-slate-800/40' : 'bg-slate-950/90'
                    }`}
                  >

                    {/* ── MODE 1: INTERLINEAR UNDER-THE-LINE TRANSLATION (SUPERVISOR'S RECOMMENDATION) ── */}
                    {docLayoutMode === 'interlinear' && (
                      <div
                        className={`w-full max-w-4xl min-w-0 shadow-lg p-6 sm:p-10 md:p-14 transition-all duration-200 border rounded-lg ${
                          docTheme === 'paper'
                            ? 'bg-white text-slate-900 border-slate-200 shadow-slate-900/10'
                            : 'bg-slate-900 text-slate-100 border-slate-800'
                        }`}
                      >
                        {/* Document Sheet Header */}
                        <div
                          className={`pb-4 mb-6 border-b flex flex-wrap items-center justify-between gap-2 text-xs font-sans ${
                            docTheme === 'paper' ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-400'
                          }`}
                        >
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {docResult.filename}
                          </div>
                          <div className="text-[11px] font-mono">
                            {granularity === 'sentence' ? 'Sentence-by-Sentence' : 'Paragraph-by-Paragraph'} · {docResult.sourceLang.toUpperCase()} ➔ {docResult.targetLang.toUpperCase()} · Academic Interlinear Format
                          </div>
                        </div>

                        {/* Continuous Academic Interlinear Flow */}
                        <div className="space-y-4">
                          {docResult.sections.map((sec, idx) => {
                            const isTitle = sec.type === 'title';
                            const isHeading = sec.type === 'heading';
                            const isSubheading = sec.type === 'subheading';
                            const isTable = sec.type === 'table';
                            const isListItem = sec.type === 'list-item';

                            const showPageMarker =
                              idx === 0 || docResult.sections[idx - 1].pageNumber !== sec.pageNumber;

                            const fontClass =
                              fontSize === 'sm'
                                ? 'text-xs md:text-sm'
                                : fontSize === 'lg'
                                ? 'text-base md:text-lg'
                                : 'text-sm md:text-base';

                            return (
                              <React.Fragment key={sec.id}>
                                {showPageMarker && docResult.totalPages > 1 && (
                                  <div
                                    className={`py-2 my-5 border-t border-b flex items-center justify-between text-[11px] font-mono ${
                                      docTheme === 'paper'
                                        ? 'border-slate-200 text-slate-400 bg-slate-50/70 px-3 rounded'
                                        : 'border-slate-800 text-slate-500 bg-slate-950/40 px-3 rounded'
                                    }`}
                                  >
                                    <span>── Page {sec.pageNumber} ──</span>
                                    <span>Academic Interlinear Document</span>
                                  </div>
                                )}

                                <div id={sec.id} className="scroll-mt-6 transition-all">
                                  {/* TITLE SECTION (Heading 1) */}
                                  {isTitle ? (
                                    <div className="pt-2 pb-4 mb-3 text-left">
                                      <h1
                                        className={`text-2xl sm:text-3xl font-bold font-chinese tracking-tight leading-snug break-words [overflow-wrap:anywhere] ${
                                          docTheme === 'paper' ? 'text-slate-950' : 'text-slate-50'
                                        }`}
                                      >
                                        {sec.original}
                                      </h1>
                                      {sec.translated && (
                                        <div
                                          className={`text-base sm:text-xl font-normal font-sans mt-1.5 leading-snug break-words [overflow-wrap:anywhere] ${
                                            docTheme === 'paper' ? 'text-slate-700' : 'text-slate-300'
                                          }`}
                                        >
                                          {sec.translated}
                                        </div>
                                      )}
                                    </div>
                                  ) : isHeading ? (
                                    /* HEADING SECTION (Heading 2) */
                                    <div className="pt-6 pb-2 mb-2 text-left">
                                      <h2
                                        className={`text-lg sm:text-xl font-bold font-chinese tracking-tight break-words [overflow-wrap:anywhere] ${
                                          docTheme === 'paper' ? 'text-slate-900' : 'text-slate-100'
                                        }`}
                                      >
                                        {sec.original}
                                      </h2>
                                      {sec.translated && (
                                        <div
                                          className={`text-sm sm:text-base font-medium font-sans mt-1 break-words [overflow-wrap:anywhere] ${
                                            docTheme === 'paper' ? 'text-slate-700' : 'text-slate-300'
                                          }`}
                                        >
                                          {sec.translated}
                                        </div>
                                      )}
                                    </div>
                                  ) : isSubheading ? (
                                    /* SUBHEADING SECTION (Heading 3) */
                                    <div className="pt-4 pb-1 mb-2 text-left">
                                      <h3
                                        className={`text-sm sm:text-base font-semibold font-chinese break-words [overflow-wrap:anywhere] ${
                                          docTheme === 'paper' ? 'text-slate-900' : 'text-slate-200'
                                        }`}
                                      >
                                        {sec.original}
                                      </h3>
                                      {sec.translated && (
                                        <div
                                          className={`text-xs sm:text-sm font-normal font-sans mt-0.5 break-words [overflow-wrap:anywhere] ${
                                            docTheme === 'paper' ? 'text-slate-600' : 'text-slate-400'
                                          }`}
                                        >
                                          {sec.translated}
                                        </div>
                                      )}
                                    </div>
                                  ) : isTable && sec.tableRows && sec.tableRows.length > 0 ? (
                                    /* ACADEMIC TABLE SECTION (Table 1 Grid matching Supervisor Reference) */
                                    <div className="my-5 overflow-x-auto">
                                      <table
                                        className={`w-full border-collapse border text-xs sm:text-sm ${
                                          docTheme === 'paper'
                                            ? 'border-slate-400 text-slate-900'
                                            : 'border-slate-600 text-slate-100'
                                        }`}
                                      >
                                        <tbody>
                                          {sec.tableRows.map((row, rIdx) => (
                                            <tr
                                              key={rIdx}
                                              className={
                                                rIdx === 0
                                                  ? docTheme === 'paper'
                                                    ? 'bg-slate-100 font-semibold'
                                                    : 'bg-slate-800 font-semibold'
                                                  : ''
                                              }
                                            >
                                              {row.map((cell, cIdx) => (
                                                <td
                                                  key={cIdx}
                                                  className={`border px-3 py-2 align-top ${
                                                    docTheme === 'paper'
                                                      ? 'border-slate-400'
                                                      : 'border-slate-600'
                                                  }`}
                                                >
                                                  <div className="font-chinese leading-normal font-medium">
                                                    {cell.original}
                                                  </div>
                                                  {cell.translated && cell.translated !== cell.original && (
                                                    <div
                                                      className={`text-[11px] sm:text-xs mt-0.5 leading-normal ${
                                                        docTheme === 'paper'
                                                          ? 'text-slate-600'
                                                          : 'text-slate-400'
                                                      }`}
                                                    >
                                                      {cell.translated}
                                                    </div>
                                                  )}
                                                </td>
                                              ))}
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : isListItem ? (
                                    /* LIST ITEM SECTION (Bullet with indented translation directly below) */
                                    <div className="my-2 pl-1 text-left">
                                      <div
                                        className={`${fontClass} font-chinese text-slate-900 dark:text-slate-100 flex items-start gap-2.5 leading-relaxed`}
                                      >
                                        <span className="font-bold select-none text-slate-800 dark:text-slate-200">
                                          •
                                        </span>
                                        <span className="break-words [overflow-wrap:anywhere] min-w-0">
                                          {sec.original}
                                        </span>
                                      </div>
                                      {sec.translated && (
                                        <div
                                          className={`pl-5 text-xs sm:text-sm font-sans leading-relaxed mt-0.5 ${
                                            docTheme === 'paper' ? 'text-slate-600' : 'text-slate-400'
                                          }`}
                                        >
                                          {sec.translated}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    /* PARAGRAPH SECTION (Flowing academic text with translation line directly below) */
                                    <div className="my-3 space-y-3">
                                      {granularity === 'sentence' && sec.sentences && sec.sentences.length > 0 ? (
                                        sec.sentences.map((sent) => (
                                          <div
                                            key={sent.id}
                                            onClick={(e) => handleWordClick(sent.original.slice(0, 2), sent.original, e)}
                                            className="cursor-pointer group rounded p-1 -m-1 transition-colors hover:bg-slate-100/70 dark:hover:bg-slate-800/50"
                                            title="Click to view dictionary & save to flashcards"
                                          >
                                            {/* Chinese original sentence */}
                                            <p
                                              className={`${fontClass} font-chinese text-slate-900 dark:text-slate-100 leading-relaxed font-normal break-words [overflow-wrap:anywhere]`}
                                            >
                                              {sent.original}
                                            </p>
                                            {/* Translated sentence directly underneath */}
                                            {sent.translated ? (
                                              <p
                                                className={`text-xs sm:text-sm font-sans leading-relaxed mt-0.5 break-words [overflow-wrap:anywhere] ${
                                                  docTheme === 'paper' ? 'text-slate-600' : 'text-slate-400'
                                                }`}
                                              >
                                                {sent.translated}
                                              </p>
                                            ) : null}
                                          </div>
                                        ))
                                      ) : (
                                        /* Paragraph granularity */
                                        <div
                                          onClick={(e) => handleWordClick(sec.original.slice(0, 2), sec.original, e)}
                                          className="cursor-pointer group rounded p-1 -m-1 transition-colors hover:bg-slate-100/70 dark:hover:bg-slate-800/50"
                                          title="Click to view dictionary & save to flashcards"
                                        >
                                          {/* Chinese original paragraph */}
                                          <p
                                            className={`${fontClass} font-chinese text-slate-900 dark:text-slate-100 leading-relaxed text-justify ${
                                              indentParagraphs ? 'indent-8' : ''
                                            } break-words [overflow-wrap:anywhere]`}
                                          >
                                            {sec.original}
                                          </p>
                                          {/* Translated paragraph directly underneath */}
                                          {sec.translated ? (
                                            <p
                                              className={`text-xs sm:text-sm font-sans leading-relaxed mt-1 text-justify ${
                                                indentParagraphs ? 'indent-8' : ''
                                              } break-words [overflow-wrap:anywhere] ${
                                                docTheme === 'paper' ? 'text-slate-600' : 'text-slate-400'
                                              }`}
                                            >
                                              {sec.translated}
                                            </p>
                                          ) : null}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ── MODE 2: SPLIT-SCREEN SYNCHRONIZED DUAL-COLUMN DOCUMENT CANVAS ── */}
                    {docLayoutMode === 'split-doc' && (
                      <div
                        className={`w-full max-w-6xl min-w-0 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 space-y-6 border ${
                          docTheme === 'paper'
                            ? 'bg-white text-slate-900 border-slate-300'
                            : 'bg-slate-900 text-slate-100 border-slate-800'
                        }`}
                      >
                        <div
                          className={`pb-4 border-b flex flex-wrap items-center justify-between gap-2 text-xs ${
                            docTheme === 'paper' ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Columns className="w-4 h-4 text-red-500" />
                            <span className="font-semibold truncate">
                              Side-by-Side: {docResult.filename}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] font-mono">
                            <span>Left: Original ({docResult.sourceLang.toUpperCase()})</span>
                            <span>•</span>
                            <span className="text-red-500 font-medium">
                              Right: Translation ({docResult.targetLang.toUpperCase()})
                            </span>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {docResult.sections.map((sec, idx) => {
                            const isHeading = sec.type === 'title' || sec.type === 'heading';
                            const isSubheading = sec.type === 'subheading';
                            const isListItem = sec.type === 'list-item';

                            const showPageMarker =
                              idx === 0 || docResult.sections[idx - 1].pageNumber !== sec.pageNumber;

                            return (
                              <React.Fragment key={sec.id}>
                                {showPageMarker && docResult.totalPages > 1 && (
                                  <div
                                    className={`py-3 my-4 border-t border-b flex items-center justify-between text-[11px] font-mono ${
                                      docTheme === 'paper'
                                        ? 'border-slate-200 text-slate-400 bg-slate-50 px-3 rounded'
                                        : 'border-slate-800 text-slate-500 bg-slate-950 px-3 rounded'
                                    }`}
                                  >
                                    <span>─── Page {sec.pageNumber} ───</span>
                                    <span>LexiDoc Structured Page</span>
                                  </div>
                                )}

                                <div
                                  id={sec.id}
                                  className={`grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 p-3 rounded-xl transition-colors min-w-0 ${
                                    isHeading
                                      ? docTheme === 'paper' ? 'bg-red-50/50' : 'bg-slate-800/40'
                                      : docTheme === 'paper' ? 'hover:bg-slate-50' : 'hover:bg-slate-800/30'
                                  }`}
                                >
                                  {/* Left: Original Section */}
                                  <div className={`min-w-0 ${docTheme === 'paper' ? 'text-slate-800' : 'text-slate-300'}`}>
                                    {isHeading ? (
                                      <h3 className="font-bold text-base md:text-lg tracking-wide font-chinese break-words [overflow-wrap:anywhere]">
                                        {sec.original}
                                      </h3>
                                    ) : isSubheading ? (
                                      <h4 className="font-semibold text-sm font-chinese break-words [overflow-wrap:anywhere]">
                                        {sec.original}
                                      </h4>
                                    ) : isListItem ? (
                                      <div className="text-xs md:text-sm pl-4 border-l-2 border-slate-400 font-chinese break-words [overflow-wrap:anywhere]">
                                        {sec.original}
                                      </div>
                                    ) : (
                                      <p className="text-xs md:text-sm text-justify leading-relaxed font-chinese break-words [overflow-wrap:anywhere]">
                                        {sec.original}
                                      </p>
                                    )}
                                  </div>

                                  {/* Right: Translated Section */}
                                  <div className={`min-w-0 ${docTheme === 'paper' ? 'text-slate-900' : 'text-slate-100'}`}>
                                    {isHeading ? (
                                      <h3 className="font-bold text-base md:text-lg text-red-600 tracking-wide break-words [overflow-wrap:anywhere]">
                                        {sec.translated || sec.original}
                                      </h3>
                                    ) : isSubheading ? (
                                      <h4 className="font-semibold text-sm text-red-700 break-words [overflow-wrap:anywhere]">
                                        {sec.translated || sec.original}
                                      </h4>
                                    ) : isListItem ? (
                                      <div className="text-xs md:text-sm pl-4 border-l-2 border-red-500/50 break-words [overflow-wrap:anywhere]">
                                        {sec.translated || sec.original}
                                      </div>
                                    ) : (
                                      <p
                                        onClick={(e) => handleWordClick(sec.translated.slice(0, 2), sec.translated, e)}
                                        className="text-xs md:text-sm text-justify leading-relaxed cursor-pointer hover:bg-red-500/5 rounded p-1 transition-colors break-words [overflow-wrap:anywhere]"
                                        title="Click to view dictionary & save to flashcards"
                                      >
                                        {sec.translated || (
                                          <span className="text-slate-400 italic break-words [overflow-wrap:anywhere]">{sec.original}</span>
                                        )}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ── MODE 3: FULL TRANSLATED DOCUMENT CANVAS ── */}
                    {docLayoutMode === 'single-doc' && (
                      <div
                        className={`w-full max-w-4xl min-w-0 rounded-2xl shadow-xl p-4 sm:p-6 md:p-10 space-y-6 transition-all duration-200 border ${
                          docTheme === 'paper'
                            ? 'bg-white text-slate-900 border-slate-300 shadow-slate-900/30'
                            : 'bg-slate-900 text-slate-100 border-slate-800'
                        }`}
                      >
                        <div
                          className={`pb-5 border-b text-center space-y-2 min-w-0 ${
                            docTheme === 'paper' ? 'border-slate-200' : 'border-slate-800'
                          }`}
                        >
                          <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-600 border border-red-500/25 text-xs font-mono font-semibold">
                            Full Translated Document
                          </span>
                          <h2
                            className={`text-xl md:text-2xl font-bold tracking-wide pt-2 break-words [overflow-wrap:anywhere] ${
                              docTheme === 'paper' ? 'text-slate-900' : 'text-slate-100'
                            }`}
                          >
                            {docResult.filename.replace(/\.[^/.]+$/, '')} — Full Translated Document
                          </h2>
                          <p
                            className={`text-xs ${
                              docTheme === 'paper' ? 'text-slate-500' : 'text-slate-400'
                            }`}
                          >
                            Translated in full ({docResult.totalPages} pages · {docResult.totalWords} words)
                          </p>
                        </div>

                        <div className="space-y-4 pt-2 min-w-0">
                          {docResult.sections.map((sec, idx) => {
                            const isTitle = sec.type === 'title';
                            const isHeading = sec.type === 'heading';
                            const isSubheading = sec.type === 'subheading';
                            const isListItem = sec.type === 'list-item';

                            const showPageMarker =
                              idx === 0 || docResult.sections[idx - 1].pageNumber !== sec.pageNumber;

                            const content = sec.translated || sec.original;

                            return (
                              <React.Fragment key={sec.id}>
                                {showPageMarker && docResult.totalPages > 1 && (
                                  <div
                                    className={`py-3 my-5 border-t border-b flex items-center justify-between text-xs font-mono ${
                                      docTheme === 'paper'
                                        ? 'border-slate-200 text-slate-400 bg-slate-50 px-3 rounded'
                                        : 'border-slate-800 text-slate-500 bg-slate-950 px-3 rounded'
                                    }`}
                                  >
                                    <span>── Page {sec.pageNumber} ──</span>
                                    <span>{docResult.filename}</span>
                                  </div>
                                )}

                                <div id={sec.id} className="scroll-mt-6 min-w-0">
                                  {isTitle ? (
                                    <h2 className="text-xl md:text-2xl font-bold text-red-600 pt-4 pb-2 border-b border-red-200 break-words [overflow-wrap:anywhere]">
                                      {content}
                                    </h2>
                                  ) : isHeading ? (
                                    <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 pt-3 pb-1 break-words [overflow-wrap:anywhere]">
                                      {content}
                                    </h3>
                                  ) : isSubheading ? (
                                    <h4 className="text-sm md:text-base font-semibold text-slate-700 dark:text-slate-200 pt-2 break-words [overflow-wrap:anywhere]">
                                      {content}
                                    </h4>
                                  ) : isListItem ? (
                                    <li className="text-sm md:text-base text-slate-800 dark:text-slate-200 ml-6 list-disc leading-relaxed break-words [overflow-wrap:anywhere]">
                                      {content}
                                    </li>
                                  ) : (
                                    <p className="text-sm md:text-base text-slate-800 dark:text-slate-100 leading-relaxed text-justify indent-8 break-words [overflow-wrap:anywhere]">
                                      {content}
                                    </p>
                                  )}
                                </div>
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── WORKFLOW 2: QUICK TEXT SNIPPET TRANSLATION ── */}
      {activeWorkflow === 'text' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-800/80 bg-slate-900/60 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Input Text ({currentDirObj.src.toUpperCase()})
              </span>
              <span className="text-[10px] text-slate-500">
                Neural Translation via OPUS-MT
              </span>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type or paste text here..."
              rows={4}
              className="w-full p-4 bg-slate-900 border border-slate-700 rounded-2xl text-slate-100 text-sm focus:outline-none focus:border-red-500/60 transition-colors resize-none font-sans leading-relaxed shadow-inner"
            />

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                {inputText.length} characters · {inputText.split(/\n\s*\n/).filter(Boolean).length} paragraphs
              </span>
              <button
                onClick={handleTranslateText}
                disabled={isTranslatingText || !inputText.trim()}
                className="px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-950/40 disabled:opacity-50 transition-all hover:scale-105"
              >
                {isTranslatingText ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Translating...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>Translate {currentDirObj.flag}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {textBlocks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                <FileText className="w-8 h-8 text-slate-600" />
                <p className="text-xs">Click the "Translate" button above to start</p>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-semibold text-slate-300">
                    Translation Result ({currentDirObj.tgt.toUpperCase()})
                  </span>
                  <button
                    onClick={handleCopyText}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1.5 transition-colors"
                  >
                    {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedText ? 'Copied' : 'Copy All'}</span>
                  </button>
                </div>

                {textBlocks.map((blk) => (
                  <div
                    key={blk.id}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2"
                  >
                    <p className="text-sm font-chinese text-slate-100 font-medium leading-relaxed">
                      {blk.original}
                    </p>
                    <p className="text-xs md:text-sm text-slate-400 font-sans leading-relaxed mt-1">
                      {blk.translated}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── IN-DOCUMENT WORD POPUP MODAL (F4 & F5) ── */}
      {selectedWord && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ top: selectedWord.pos.y, left: selectedWord.pos.x }}
          className="fixed z-50 w-72 rounded-2xl bg-slate-900 border border-red-500/40 shadow-2xl p-4 text-xs space-y-3 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold font-chinese text-amber-400">
                {selectedWord.word}
              </span>
              <div>
                <span className="font-semibold text-slate-200">{selectedWord.pinyin}</span>
                <span className="block text-[10px] text-red-400">Interactive Dictionary</span>
              </div>
            </div>
            <button
              onClick={() => DictionaryService.speak(selectedWord.word)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
              title="Listen Pronunciation"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Definition / Translation:</span>
            <p className="text-slate-200 text-xs leading-relaxed font-medium">
              {selectedWord.meaning}
            </p>
          </div>

          {selectedWord.sourceSentence && (
            <div className="space-y-1 bg-slate-950 p-2 rounded-lg border border-slate-800">
              <span className="text-[9px] text-slate-500 uppercase font-semibold">Document Context:</span>
              <p className="text-[11px] text-slate-400 italic font-chinese line-clamp-2">
                "{selectedWord.sourceSentence}"
              </p>
            </div>
          )}

          <div className="pt-1 flex items-center justify-between">
            <button
              onClick={handleSaveSelectedWord}
              className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                savedWordStatus
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-950/40'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{savedWordStatus || '+ Add to Flashcards (F5)'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
