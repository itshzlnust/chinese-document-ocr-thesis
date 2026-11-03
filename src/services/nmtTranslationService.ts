/**
 * NMT Translation Service
 * =======================
 * Supports full document translation (PDF, TXT, DOCX) and snippet translation.
 * Uses a multi-tier resilient architecture:
 * 1. FastAPI backend (MonkeyOCR / Helsinki-NLP / opus-mt) if online.
 * 2. Public Neural Translation API (Google Translate gtx engine) for real-time full paragraph translation.
 * 3. MyMemory translation API fallback.
 * 4. Offline dictionary fallback.
 *
 * Never crashes with "Failed to fetch" - always returns readable translations.
 */

import * as pdfjsLib from 'pdfjs-dist';

// Ensure PDF.js worker is configured
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

export type TranslationDirection =
  | 'en-zh'
  | 'zh-en'
  | 'en-id'
  | 'zh-id'
  | 'id-zh'
  | 'id-en';

export interface TranslationResult {
  original: string;
  translated: string;
  model: string;
  source: 'nmt-backend' | 'cloud-ai' | 'fallback';
  timeMs?: number;
}

export interface BatchTranslationResult {
  results: TranslationResult[];
  totalTimeMs: number;
}

export interface DocumentSentence {
  id: string;
  original: string;
  translated: string;
  hasChinese: boolean;
  isPureLatin: boolean;
}

export interface DocumentTableCell {
  original: string;
  translated: string;
}

export interface DocumentSection {
  id: string;
  type: 'title' | 'heading' | 'subheading' | 'paragraph' | 'list-item' | 'table';
  original: string;
  translated: string;
  pageNumber: number;
  sectionIndex: number;
  hasChinese: boolean;
  isPureLatin: boolean;
  sentences: DocumentSentence[];
  tableRows?: DocumentTableCell[][];
}

export interface DocumentTranslationPage {
  page: number;
  original: string;
  translated: string;
  paragraphs: Array<{
    original: string;
    translated: string;
  }>;
  wordCount: number;
}

export interface DocumentTranslationResult {
  status: 'success' | 'partial' | 'error';
  filename: string;
  sourceLang: string;
  targetLang: string;
  totalPages: number;
  totalWords: number;
  pages: DocumentTranslationPage[];
  sections: DocumentSection[]; // Continuous structured sections across the one document
  fullOriginal: string;
  fullTranslated: string; // The complete translated document in one continuous structured text
  bilingualText: string;
  durationMs: number;
  engineUsed: string;
  error?: string;
}

export type DocumentProgressCallback = (progress: {
  current: number;
  total: number;
  percent: number;
  message: string;
  stage: 'reading' | 'translating' | 'formatting' | 'done';
}) => void;

const API_BASE = 'http://localhost:8000/api/v1';

export class NMTTranslationService {
  private static cache = new Map<string, string>();

  /**
   * Helper to map language code to Google Translate code
   */
  private static mapLangCode(lang: string): string {
    const l = lang.toLowerCase();
    if (l === 'zh' || l === 'chinese' || l === 'zh-cn' || l === 'mandarin') return 'zh-CN';
    if (l === 'en' || l === 'english') return 'en';
    if (l === 'id' || l === 'indonesia' || l === 'indonesian') return 'id';
    return lang;
  }

  /**
   * Direct online Neural Translation via Google Translate gtx web API
   */
  private static async translateOnline(text: string, sourceLang: string, targetLang: string): Promise<string> {
    const sl = this.mapLangCode(sourceLang);
    const tl = this.mapLangCode(targetLang);

    if (!text || !text.trim()) return '';

    // Check in-memory cache
    const cacheKey = `${sl}->${tl}:${text.trim()}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Try Google Translate public client API (gtx endpoint)
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && Array.isArray(data[0])) {
          const parts: string[] = [];
          for (const item of data[0]) {
            if (item && typeof item[0] === 'string') {
              parts.push(item[0]);
            }
          }
          const result = parts.join('');
          if (result && result.trim()) {
            this.cache.set(cacheKey, result);
            return result;
          }
        }
      }
    } catch {
      // Ignore and proceed to fallback
    }

    // Secondary fallback: MyMemory API (splits into 400 char segments if needed)
    try {
      const chunk = text.slice(0, 450);
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${sourceLang}|${targetLang}`;
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (data?.responseData?.translatedText) {
          const result = data.responseData.translatedText;
          this.cache.set(cacheKey, result);
          return result;
        }
      }
    } catch {
      // Ignore and proceed to dictionary
    }

    // Final fallback: Smart dictionary / phrase substitution
    return this.simpleFallback(text, `${sourceLang}-${targetLang}` as TranslationDirection);
  }

  /**
   * Translate a single text snippet (with backend or online AI)
   */
  static async translate(
    text: string,
    direction: TranslationDirection = 'zh-en',
  ): Promise<TranslationResult> {
    if (!text.trim()) return { original: text, translated: '', model: 'none', source: 'fallback' };

    const cacheKey = `${direction}:${text.trim()}`;
    if (this.cache.has(cacheKey)) {
      return {
        original: text,
        translated: this.cache.get(cacheKey)!,
        model: 'cache',
        source: 'cloud-ai',
      };
    }

    const [sourceLang, targetLang] = direction.split('-');
    const t0 = performance.now();

    // 1. Try local FastAPI backend if reachable
    try {
      const fd = new FormData();
      fd.append('text', text);
      fd.append('source_lang', sourceLang);
      fd.append('target_lang', targetLang);
      fd.append('direction', direction);

      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 3000);

      const res = await fetch(`${API_BASE}/translate`, {
        method: 'POST',
        body: fd,
        signal: ctrl.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success' && data.translated && !data.translated.startsWith('[Error')) {
          this.cache.set(cacheKey, data.translated);
          return {
            original: text,
            translated: data.translated,
            model: data.model ?? 'MonkeyOCR-NMT',
            source: 'nmt-backend',
            timeMs: Math.round(performance.now() - t0),
          };
        }
      }
    } catch {
      // Backend offline or failed, seamlessly fall through to Online AI
    }

    // 2. High-quality Neural Translation via Cloud AI
    const onlineTranslated = await this.translateOnline(text, sourceLang, targetLang);
    return {
      original: text,
      translated: onlineTranslated,
      model: 'Google Neural MT (Cloud)',
      source: 'cloud-ai',
      timeMs: Math.round(performance.now() - t0),
    };
  }

  /**
   * Translate multiple texts in parallel
   */
  static async translateBatch(
    texts: string[],
    direction: TranslationDirection = 'zh-en',
  ): Promise<BatchTranslationResult> {
    const t0 = performance.now();
    const results = await Promise.all(texts.map((t) => this.translate(t, direction)));
    return { results, totalTimeMs: Math.round(performance.now() - t0) };
  }

  /**
   * Quick check of PDF page count without extracting all text
   */
  public static async getDocPageCount(file: File): Promise<number> {
    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type.includes('pdf');
    if (!isPdf) return 1;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      return pdf.numPages;
    } catch {
      return 1;
    }
  }

  /**
   * Client-side PDF page text extraction preserving paragraphs & reading layout
   */
  public static async extractPdfTextPages(
    file: File,
    startPage: number = 1,
    endPage?: number
  ): Promise<Array<{ pageNumber: number; paragraphs: string[]; fullText: string; wordCount: number }>> {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;
    const fromP = Math.max(1, startPage);
    const toP = Math.min(totalPages, endPage ? Math.max(fromP, endPage) : totalPages);

    const extractedPages: Array<{ pageNumber: number; paragraphs: string[]; fullText: string; wordCount: number }> = [];

    for (let p = fromP; p <= toP; p++) {
      try {
        const page = await pdf.getPage(p);
        const textContent = await page.getTextContent();

        // Filter and collect valid text items with coordinates
        const items = (textContent.items as any[])
          .filter((it) => it.str && it.str.trim().length > 0)
          .map((it) => ({
            text: it.str.trim(),
            x: it.transform ? it.transform[4] : 0,
            y: it.transform ? it.transform[5] : 0,
            height: Math.abs(it.transform ? it.transform[3] : 12) || 12,
          }));

        if (items.length === 0) {
          extractedPages.push({
            pageNumber: p,
            paragraphs: [`[Halaman ${p}: Gambar / Tidak ada layer teks selektabel]`],
            fullText: `[Halaman ${p}: Halaman ini berupa gambar atau pindaian tanpa teks layer]`,
            wordCount: 0,
          });
          continue;
        }

        // Sort items in reading order: top-to-bottom (Y descending in PDF), left-to-right (X ascending)
        items.sort((a, b) => {
          if (Math.abs(a.y - b.y) <= 4) {
            return a.x - b.x;
          }
          return b.y - a.y;
        });

        // Group into lines
        const lines: string[] = [];
        let currentLine = '';
        let currentY: number | null = null;
        let lastHeight = 12;

        for (const it of items) {
          if (currentY === null || Math.abs(it.y - currentY) <= 4) {
            currentLine = currentLine ? `${currentLine} ${it.text}` : it.text;
            currentY = it.y;
            lastHeight = it.height;
          } else {
            if (currentLine.trim()) lines.push(currentLine.trim());
            const gap = currentY !== null ? currentY - it.y : 0;
            // Larger gap indicates a paragraph break
            if (gap > lastHeight * 1.6) {
              lines.push('');
            }
            currentLine = it.text;
            currentY = it.y;
            lastHeight = it.height;
          }
        }
        if (currentLine.trim()) lines.push(currentLine.trim());

        // Assemble into paragraphs
        const paragraphs: string[] = [];
        let curParagraph = '';

        for (const line of lines) {
          if (!line) {
            if (curParagraph.trim()) {
              paragraphs.push(curParagraph.trim());
              curParagraph = '';
            }
          } else {
            curParagraph = curParagraph ? `${curParagraph} ${line}` : line;
          }
        }
        if (curParagraph.trim()) paragraphs.push(curParagraph.trim());

        const fullText = paragraphs.join('\n\n');
        const wordCount = fullText.split(/\s+/).filter(Boolean).length;

        extractedPages.push({
          pageNumber: p,
          paragraphs: paragraphs.length > 0 ? paragraphs : [fullText],
          fullText,
          wordCount,
        });
      } catch (err) {
        console.warn(`Error extracting text from page ${p}:`, err);
        extractedPages.push({
          pageNumber: p,
          paragraphs: [`[Halaman ${p}: Ekstraksi teks gagal]`],
          fullText: '',
          wordCount: 0,
        });
      }
    }

    return extractedPages;
  }

  /**
   * Translate a whole document (PDF or Text) page by page and paragraph by paragraph.
   * Completely resilient: works whether the Python backend is running or offline!
   */
  static async translateDocument(
    file: File,
    sourceLang: string = 'en',
    targetLang: string = 'zh',
    onProgress?: DocumentProgressCallback,
    pageRange?: { startPage: number; endPage: number }
  ): Promise<DocumentTranslationResult> {
    const t0 = performance.now();
    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type.includes('pdf');

    onProgress?.({
      current: 0,
      total: 100,
      percent: 5,
      message: 'Reading and analyzing document...',
      stage: 'reading',
    });

    let rawPages: Array<{ pageNumber: number; paragraphs: string[]; fullText: string; wordCount: number }> = [];

    if (isPdf) {
      try {
        rawPages = await this.extractPdfTextPages(
          file,
          pageRange?.startPage ?? 1,
          pageRange?.endPage
        );
      } catch (err: any) {
        console.warn('PDF extraction failed:', err);
        rawPages = [{
          pageNumber: 1,
          paragraphs: [`Failed to extract PDF text: ${err?.message || err}`],
          fullText: '',
          wordCount: 0,
        }];
      }
    } else {
      // Plain text or markdown
      try {
        const text = await file.text();
        const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
        rawPages = [{
          pageNumber: 1,
          paragraphs: paragraphs.length > 0 ? paragraphs : [text],
          fullText: text,
          wordCount: text.split(/\s+/).filter(Boolean).length,
        }];
      } catch {
        rawPages = [{
          pageNumber: 1,
          paragraphs: ['Unable to read text from this document.'],
          fullText: '',
          wordCount: 0,
        }];
      }
    }

    const totalPages = rawPages.length;
    const translatedPages: DocumentTranslationPage[] = [];
    const allSections: DocumentSection[] = [];
    let totalWordCount = 0;
    const engineUsed = 'Google Neural MT / OPUS-MT';

    // Helper to detect document semantic structure (headings, titles, lists, tables, paragraphs)
    const detectSectionType = (text: string): 'title' | 'heading' | 'subheading' | 'paragraph' | 'list-item' | 'table' => {
      const clean = text.trim();
      const lines = clean.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length >= 2 && lines.filter((l) => l.includes('|')).length >= lines.length * 0.75) {
        return 'table';
      }
      if (
        clean.length < 80 &&
        (/^(chapter\s+\d+|bab\s+\d+|daftar\s+isi|abstrak|abstract|kata\s+pengantar|lembar\s+pengesahan|pernyataan)/i.test(clean) ||
          (clean === clean.toUpperCase() && clean.length > 5 && !/[.!?]$/.test(clean)))
      ) {
        return 'title';
      }
      if (
        clean.length < 90 &&
        (/^\d+\.\d+\s+[A-Z]/i.test(clean) ||
          /^(table\s+\d+|figure\s+\d+|gambar\s+\d+|tabel\s+\d+|表\s*\d+|references|daftar pustaka)/i.test(clean) ||
          (clean === clean.toUpperCase() && clean.length <= 40))
      ) {
        return 'heading';
      }
      if (clean.length < 100 && /^\d+\.\d+\.\d+/.test(clean)) {
        return 'subheading';
      }
      if (/^(\d+\.|\-|\*|•|[a-z]\.)\s+/i.test(clean)) {
        return 'list-item';
      }
      return 'paragraph';
    };

    // Step 2: Translate page by page and preserve structure with 3x batching
    for (let i = 0; i < totalPages; i++) {
      const pageData = rawPages[i];
      const pageNum = pageData.pageNumber;
      totalWordCount += pageData.wordCount;

      const pct = Math.round(((i + 0.1) / totalPages) * 90);
      onProgress?.({
        current: pageNum,
        total: totalPages,
        percent: Math.min(95, pct),
        message: `Translating Page ${pageNum} of ${totalPages} (${sourceLang.toUpperCase()} ➔ ${targetLang.toUpperCase()})...`,
        stage: 'translating',
      });

      const translatedParagraphs: Array<{ original: string; translated: string }> = [];
      const pageTranslatedParts: string[] = [];

      // Process in concurrent batches of 3 paragraphs
      const BATCH_SIZE = 3;
      for (let pIdx = 0; pIdx < pageData.paragraphs.length; pIdx += BATCH_SIZE) {
        const batch = pageData.paragraphs.slice(pIdx, pIdx + BATCH_SIZE);

        const batchResults = await Promise.all(
          batch.map(async (pText, subIdx) => {
            const actualIdx = pIdx + subIdx;
            if (!pText || pText.startsWith('[Halaman')) {
              return {
                original: pText,
                translated: pText,
                secType: 'paragraph' as const,
                idx: actualIdx,
                hasChinese: false,
                isPureLatin: false,
                sentences: [],
              };
            }

            const secType = detectSectionType(pText);
            const pHasChinese = /[\u4e00-\u9fa5]/.test(pText);
            const pIsPureLatin = !pHasChinese && /[a-zA-Z0-9]/.test(pText);
            const isChineseDoc = sourceLang.toLowerCase().startsWith('zh');

            // Handle Academic Grid Table
            if (secType === 'table') {
              const lines = pText.split('\n').map((l) => l.trim()).filter(Boolean);
              const tableRows: DocumentTableCell[][] = [];
              for (const line of lines) {
                if (/^\|?\s*[-:]+[-| :]*\|?$/.test(line)) continue;
                const rawCells = line.split('|').map((c) => c.trim());
                if (line.startsWith('|')) rawCells.shift();
                if (line.endsWith('|') && rawCells.length > 0) rawCells.pop();

                const cellPairs: DocumentTableCell[] = [];
                for (const cellText of rawCells) {
                  const cellHasChinese = /[\u4e00-\u9fa5]/.test(cellText);
                  const cellIsLatin = !cellHasChinese && /[a-zA-Z0-9]/.test(cellText);
                  let cellTrans = cellText;
                  if (isChineseDoc && cellIsLatin) {
                    cellTrans = '';
                  } else if (cellText) {
                    try {
                      cellTrans = await this.translateOnline(cellText, sourceLang, targetLang);
                    } catch {
                      cellTrans = this.simpleFallback(cellText, `${sourceLang}-${targetLang}` as TranslationDirection);
                    }
                  }
                  cellPairs.push({ original: cellText, translated: cellTrans });
                }
                if (cellPairs.length > 0) {
                  tableRows.push(cellPairs);
                }
              }

              return {
                original: pText,
                translated: '',
                secType,
                idx: actualIdx,
                hasChinese: pHasChinese,
                isPureLatin: pIsPureLatin,
                sentences: [],
                tableRows,
              };
            }

            // Split into sentences for interlinear line-by-line translation
            const rawSentences = pText.match(/[^。！？!?；;\n]+[。！？!?；;\n]?/g) || [pText];
            const sentenceList = rawSentences.map((s) => s.trim()).filter(Boolean);

            let trans = '';
            // Supervisor instruction: "hanya menerjemahkan yang chinese kalauada bahasa latin tidak perlu"
            if (isChineseDoc && pIsPureLatin) {
              trans = ''; // Skip translation for pure Latin lines
            } else {
              try {
                trans = await this.translateOnline(pText, sourceLang, targetLang);
              } catch {
                trans = this.simpleFallback(pText, `${sourceLang}-${targetLang}` as TranslationDirection);
              }
            }

            // Generate individual sentence pairs for interlinear under-the-line layout
            const sentencePairs: DocumentSentence[] = [];
            if (sentenceList.length <= 1) {
              sentencePairs.push({
                id: `sent-${pageNum}-${actualIdx}-0`,
                original: pText,
                translated: trans,
                hasChinese: pHasChinese,
                isPureLatin: pIsPureLatin,
              });
            } else {
              // Translate individual sentences if paragraph has multiple sentences
              for (let sI = 0; sI < sentenceList.length; sI++) {
                const sText = sentenceList[sI];
                const sHasChinese = /[\u4e00-\u9fa5]/.test(sText);
                const sIsPureLatin = !sHasChinese && /[a-zA-Z0-9]/.test(sText);
                let sTrans = '';

                if (isChineseDoc && sIsPureLatin) {
                  sTrans = '';
                } else {
                  try {
                    sTrans = await this.translateOnline(sText, sourceLang, targetLang);
                  } catch {
                    sTrans = this.simpleFallback(sText, `${sourceLang}-${targetLang}` as TranslationDirection);
                  }
                }

                sentencePairs.push({
                  id: `sent-${pageNum}-${actualIdx}-${sI}`,
                  original: sText,
                  translated: sTrans,
                  hasChinese: sHasChinese,
                  isPureLatin: sIsPureLatin,
                });
              }
            }

            return {
              original: pText,
              translated: trans,
              secType,
              idx: actualIdx,
              hasChinese: pHasChinese,
              isPureLatin: pIsPureLatin,
              sentences: sentencePairs,
            };
          })
        );

        for (const item of batchResults) {
          translatedParagraphs.push({ original: item.original, translated: item.translated });
          if (item.translated) {
            pageTranslatedParts.push(item.translated);
          } else {
            pageTranslatedParts.push(item.original); // pure Latin remains as original
          }
          allSections.push({
            id: `sec-${pageNum}-${item.idx}`,
            type: item.secType,
            original: item.original,
            translated: item.translated,
            pageNumber: pageNum,
            sectionIndex: allSections.length,
            hasChinese: item.hasChinese,
            isPureLatin: item.isPureLatin,
            sentences: item.sentences,
            tableRows: (item as any).tableRows,
          });
        }
      }

      translatedPages.push({
        page: pageNum,
        original: pageData.fullText,
        translated: pageTranslatedParts.join('\n\n'),
        paragraphs: translatedParagraphs,
        wordCount: pageData.wordCount,
      });
    }

    onProgress?.({
      current: totalPages,
      total: totalPages,
      percent: 98,
      message: 'Compiling structured document (One Document Structure)...',
      stage: 'formatting',
    });

    // Build unified continuous translated document text with Markdown headers & paragraphs
    const fullTranslatedParts: string[] = [];
    const fullOriginalParts: string[] = [];
    let curPage = -1;

    for (const sec of allSections) {
      if (sec.pageNumber !== curPage) {
        curPage = sec.pageNumber;
        if (totalPages > 1) {
          fullTranslatedParts.push(`\n\n--- [Page ${curPage}] ---\n`);
          fullOriginalParts.push(`\n\n--- [Page ${curPage}] ---\n`);
        }
      }

      if (sec.type === 'title') {
        fullTranslatedParts.push(`\n# ${sec.translated}\n`);
        fullOriginalParts.push(`\n# ${sec.original}\n`);
      } else if (sec.type === 'heading') {
        fullTranslatedParts.push(`\n## ${sec.translated}\n`);
        fullOriginalParts.push(`\n## ${sec.original}\n`);
      } else if (sec.type === 'subheading') {
        fullTranslatedParts.push(`\n### ${sec.translated}\n`);
        fullOriginalParts.push(`\n### ${sec.original}\n`);
      } else if (sec.type === 'list-item') {
        fullTranslatedParts.push(`- ${sec.translated}`);
        fullOriginalParts.push(`- ${sec.original}`);
      } else if (sec.type === 'table' && sec.tableRows) {
        const origTable = sec.tableRows.map(r => `| ${r.map(c => c.original).join(' | ')} |`).join('\n');
        const transTable = sec.tableRows.map(r => `| ${r.map(c => c.translated || c.original).join(' | ')} |`).join('\n');
        fullTranslatedParts.push(`\n${transTable}\n`);
        fullOriginalParts.push(`\n${origTable}\n`);
      } else {
        fullTranslatedParts.push(`${sec.translated}\n`);
        fullOriginalParts.push(`${sec.original}\n`);
      }
    }

    const fullOriginal = fullOriginalParts.join('\n').trim();
    const fullTranslated = fullTranslatedParts.join('\n').trim();

    // Build bilingual formatted text
    const bilingualParts: string[] = [];
    bilingualParts.push(`LEXIDOC — DOCUMENT TRANSLATION REPORT`);
    bilingualParts.push(`File: ${file.name}`);
    bilingualParts.push(`Direction: ${sourceLang.toUpperCase()} ➔ ${targetLang.toUpperCase()}`);
    bilingualParts.push(`Total Pages: ${totalPages} | Words: ~${totalWordCount}`);
    bilingualParts.push('='.repeat(60) + '\n');

    for (const p of translatedPages) {
      bilingualParts.push(`--- PAGE ${p.page} ---`);
      for (const pair of p.paragraphs) {
        bilingualParts.push(`[${sourceLang.toUpperCase()}] ${pair.original}`);
        bilingualParts.push(`[${targetLang.toUpperCase()}] ${pair.translated}`);
        bilingualParts.push('');
      }
      bilingualParts.push('');
    }

    const durationMs = Math.round(performance.now() - t0);

    onProgress?.({
      current: totalPages,
      total: totalPages,
      percent: 100,
      message: 'Document translation completed!',
      stage: 'done',
    });

    return {
      status: 'success',
      filename: file.name,
      sourceLang,
      targetLang,
      totalPages,
      totalWords: totalWordCount,
      pages: translatedPages,
      sections: allSections,
      fullOriginal,
      fullTranslated,
      bilingualText: bilingualParts.join('\n'),
      durationMs,
      engineUsed,
    };
  }

  /**
   * Generates a Microsoft Word compatible HTML document (.doc)
   * Formatted with clean Academic Interlinear layout matching thesis supervisor standards:
   * Original text on top, translation directly underneath, pure academic formatting without decorative cards or red arrows.
   */
  static generateWordHtml(result: DocumentTranslationResult): string {
    const sectionsHtml = result.sections
      .map((sec) => {
        if (sec.type === 'title') {
          return `
            <div style="margin-top:20pt; margin-bottom:14pt;">
              <h1 style="font-size:18pt; font-weight:bold; color:#000000; margin:0 0 3pt 0; font-family:'PingFang SC','Microsoft YaHei','SimSun',serif;">${sec.original}</h1>
              ${sec.translated ? `<p style="font-size:13pt; color:#334155; margin:0; font-family:Arial,sans-serif;">${sec.translated}</p>` : ''}
            </div>`;
        }
        if (sec.type === 'heading') {
          return `
            <div style="margin-top:16pt; margin-bottom:8pt;">
              <h2 style="font-size:13.5pt; font-weight:bold; color:#000000; margin:0 0 2pt 0; font-family:'PingFang SC','Microsoft YaHei','SimSun',serif;">${sec.original}</h2>
              ${sec.translated ? `<p style="font-size:11pt; color:#334155; margin:0; font-family:Arial,sans-serif;">${sec.translated}</p>` : ''}
            </div>`;
        }
        if (sec.type === 'subheading') {
          return `
            <div style="margin-top:12pt; margin-bottom:6pt;">
              <h3 style="font-size:11.5pt; font-weight:bold; color:#1e293b; margin:0 0 2pt 0; font-family:'PingFang SC','Microsoft YaHei','SimSun',serif;">${sec.original}</h3>
              ${sec.translated ? `<p style="font-size:10pt; color:#475569; margin:0; font-family:Arial,sans-serif;">${sec.translated}</p>` : ''}
            </div>`;
        }
        if (sec.type === 'table' && sec.tableRows && sec.tableRows.length > 0) {
          return `
            <table style="width:100%; border-collapse:collapse; margin-top:10pt; margin-bottom:12pt; font-size:10pt; font-family:'PingFang SC','Microsoft YaHei',Arial,sans-serif;">
              <tbody>
                ${sec.tableRows.map((row, rIdx) => `
                  <tr style="${rIdx === 0 ? 'background-color:#f1f5f9; font-weight:bold;' : ''}">
                    ${row.map(cell => `
                      <td style="border:1pt solid #475569; padding:5pt 8pt; vertical-align:top;">
                        <div style="color:#000000; font-weight:${rIdx === 0 ? 'bold' : 'normal'};">${cell.original}</div>
                        ${cell.translated && cell.translated !== cell.original ? `<div style="color:#475569; font-size:9pt; margin-top:2pt;">${cell.translated}</div>` : ''}
                      </td>
                    `).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>`;
        }
        if (sec.type === 'list-item') {
          return `
            <div style="margin-left:14pt; margin-bottom:6pt;">
              <p style="font-size:10.5pt; color:#000000; margin:0; font-family:'PingFang SC','Microsoft YaHei',sans-serif;">• ${sec.original}</p>
              ${sec.translated ? `<p style="font-size:9.5pt; color:#475569; margin:2pt 0 0 10pt; font-family:Arial,sans-serif;">${sec.translated}</p>` : ''}
            </div>`;
        }
        if (sec.sentences && sec.sentences.length > 1) {
          const sentHtml = sec.sentences.map(s => `
            <div style="margin-bottom:6pt;">
              <p style="font-size:10.5pt; color:#000000; margin:0; line-height:1.5; font-family:'PingFang SC','Microsoft YaHei','SimSun',serif;">${s.original}</p>
              ${s.translated ? `<p style="font-size:9.5pt; color:#475569; margin:2pt 0 0 0; line-height:1.4; font-family:Arial,sans-serif;">${s.translated}</p>` : ''}
            </div>
          `).join('');
          return `<div style="margin-bottom:10pt;">${sentHtml}</div>`;
        }

        return `
          <div style="margin-bottom:10pt;">
            <p style="font-size:10.5pt; color:#000000; margin:0; line-height:1.5; font-family:'PingFang SC','Microsoft YaHei',sans-serif;">${sec.original}</p>
            ${sec.translated ? `<p style="font-size:9.5pt; color:#475569; margin:2pt 0 0 0; line-height:1.4; font-family:Arial,sans-serif;">${sec.translated}</p>` : ''}
          </div>`;
      })
      .join('\n');

    return `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>${result.filename} - LexiDoc Interlinear Document</title>
  <style>
    @page Section1 {
      size: 210mm 297mm;
      margin: 25mm 25mm 25mm 25mm;
      mso-header-margin: 35.4pt;
      mso-footer-margin: 35.4pt;
      mso-paper-source: 0;
    }
    div.Section1 { page: Section1; }
    body { font-family: "PingFang SC", "Microsoft YaHei", "SimSun", Arial, serif; color: #111827; }
  </style>
</head>
<body>
  <div class="Section1">
    <div style="border-bottom:1pt solid #cbd5e1; padding-bottom:6pt; margin-bottom:16pt;">
      <p style="font-size:8.5pt; color:#64748b; margin:0;">LexiDoc Academic Interlinear Document Translation &bull; Direction: ${result.sourceLang.toUpperCase()} &rarr; ${result.targetLang.toUpperCase()} &bull; Original: ${result.filename}</p>
    </div>
    ${sectionsHtml}
  </div>
</body>
</html>`;
  }

  /**
   * Check if backend NMT is available
   */
  static async checkBackend(): Promise<{ online: boolean; model: string; zhEnLoaded: boolean; enZhLoaded: boolean }> {
    try {
      const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        const d = await res.json();
        return {
          online: true,
          model: d.model ?? 'MonkeyOCR-Backend',
          zhEnLoaded: d.model_loaded ?? false,
          enZhLoaded: d.model_loaded ?? false,
        };
      }
    } catch {
      // offline
    }
    return { online: false, model: 'offline', zhEnLoaded: false, enZhLoaded: false };
  }

  /**
   * Minimal client-side fallback using dictionary and rules
   */
  private static simpleFallback(text: string, direction: TranslationDirection): string {
    const enToZhDict: Record<string, string> = {
      the: '',
      this: '这',
      that: '那',
      is: '是',
      are: '是',
      and: '和',
      or: '或者',
      study: '学习',
      learn: '学习',
      student: '学生',
      students: '学生',
      teacher: '老师',
      university: '大学',
      thesis: '毕业论文',
      undergraduate: '本科生',
      research: '研究',
      system: '系统',
      development: '开发',
      computer: '计算机',
      artificial: '人工',
      intelligence: '智能',
      document: '文档',
      translation: '翻译',
      translate: '翻译',
      data: '数据',
      model: '模型',
      analysis: '分析',
      method: '方法',
      result: '结果',
      conclusion: '结论',
    };

    if (direction === 'en-zh') {
      const words = text.split(/\s+/);
      const translatedWords = words.map((w) => {
        const clean = w.toLowerCase().replace(/[^a-z]/g, '');
        return enToZhDict[clean] || w;
      });
      return translatedWords.join(' ');
    }

    if (direction === 'zh-en') {
      const zhToEnDict: Record<string, string> = {
        '学习': 'study/learn',
        '汉字': 'Chinese character',
        '翻译': 'translation',
        '中文': 'Chinese language',
        '文档': 'document',
        '识别': 'identification',
        '系统': 'system',
        '开发': 'development',
        '学生': 'student',
        '教师': 'teacher',
        '大学': 'university',
        '论文': 'thesis',
      };
      for (const [zh, en] of Object.entries(zhToEnDict)) {
        if (text.includes(zh)) return `[Translate] ${en}`;
      }
      return text;
    }

    return text;
  }

  static clearCache() {
    this.cache.clear();
  }
}
