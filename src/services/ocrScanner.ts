import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';
import { DocumentBlock, DocumentWordToken } from '../types';
import { getDictionaryEntry } from '../data/cc_cedict_sample';

// Set PDF.js Global Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

/** Returns true if text contains Chinese characters */
const hasHanzi = (text: string) => /[\u4e00-\u9fa5]/.test(text);

/** Returns true if text is valid Latin/English text */
const isEnglish = (text: string): boolean => {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (!/[a-zA-Z]/.test(trimmed)) return false;
  return /^[a-zA-Z0-9\s\-'.,!?&/()]+$/.test(trimmed);
};

/** Filter to keep only Hanzi or English tokens, rejecting pure numbers, symbols, and single punctuation */
const shouldIncludeToken = (text: string): boolean => {
  const trimmed = text.trim().replace(/^[0-9\s\.,:;、，。！？\(\)\[\]#\-—–]+|[0-9\s\.,:;、，。！？\(\)\[\]#\-—–]+$/g, '');
  if (trimmed.length === 0) return false;
  return hasHanzi(trimmed) || isEnglish(trimmed);
};

export class OCRScannerService {
  /**
   * Scans a PDF document using PDF.js text layer extraction to get word-level bounding boxes
   */
  public static async scanPDFDocument(file: File, pageNum = 1): Promise<DocumentBlock[]> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const validPageNum = Math.min(Math.max(1, pageNum), pdf.numPages);
      const page = await pdf.getPage(validPageNum);

      const viewport = page.getViewport({ scale: 1.0 });
      const textContent = await page.getTextContent();

      const tokens: DocumentWordToken[] = [];
      let fullText = '';

      for (let i = 0; i < textContent.items.length; i++) {
        const item = textContent.items[i] as any;
        const str = item.str ? item.str.trim() : '';

        if (!str || str.length === 0) continue;

        // Extract transform matrix [scaleX, skewY, skewX, scaleY, translateX, translateY]
        const tx = item.transform;
        const xPdf = tx[4];
        const yPdf = tx[5];
        const fontSize = Math.abs(tx[3]) || item.height || 12;
        const itemWidth = item.width || (str.length * fontSize * 0.6);

        // Convert PDF coordinates (origin at bottom-left) to Viewport Percentage (origin at top-left)
        const leftPx = xPdf;
        const topPx = viewport.height - yPdf - fontSize;

        const xPercent = Math.min(Math.max(0.5, (leftPx / viewport.width) * 100), 96);
        const yPercent = Math.min(Math.max(0.5, (topPx / viewport.height) * 100), 96);
        const widthPercent = Math.min(Math.max(1.8, (itemWidth / viewport.width) * 100), 96);
        const heightPercent = Math.min(Math.max(1.6, ((fontSize * 1.3) / viewport.height) * 100), 16);

        fullText += str + ' ';

        // Perform Word-Level Segmentation on text item
        const wordTokens = this.segmentStringIntoWordTokens(str, {
          x: Number(xPercent.toFixed(2)),
          y: Number(yPercent.toFixed(2)),
          width: Number(widthPercent.toFixed(2)),
          height: Number(heightPercent.toFixed(2)),
        });

        tokens.push(...wordTokens);
      }

      if (tokens.length > 0) {
        return [
          {
            id: `scanned-pdf-block-1`,
            bbox: { x: 1, y: 1, width: 98, height: 98 },
            chineseText: fullText.substring(0, 150),
            indonesianTranslation: 'Teks dokumen PDF teridentifikasi secara word-level.',
            tokens,
          },
        ];
      }

      return [];
    } catch (err) {
      console.warn('PDF text layer extraction fallback:', err);
      return [];
    }
  }

  /**
   * Scans an image using Tesseract.js client-side OCR with line-aware Chinese word grouping
   * to produce tight, accurate, and clean word-level bounding boxes.
   */
  public static async scanImageWithTesseract(imageSrc: string): Promise<DocumentBlock[]> {
    try {
      console.info('Starting Tesseract.js client-side Chinese OCR scan...');
      const worker = await createWorker('chi_sim+eng');
      const ret = await worker.recognize(imageSrc);
      await worker.terminate();

      const tokens: DocumentWordToken[] = [];

      if (ret.data) {
        // Obtain actual image canvas dimensions
        const img = new Image();
        img.src = imageSrc;
        await new Promise((resolve) => { img.onload = resolve; });

        const imageWidth = img.naturalWidth || (ret.data as any).width || 1000;
        const imageHeight = img.naturalHeight || (ret.data as any).height || 1200;

        const lines = ret.data.lines || [];

        if (lines.length > 0) {
          lines.forEach((line) => {
            const lineText = line.text ? line.text.trim() : '';
            if (!lineText || !shouldIncludeToken(lineText)) return;

            const lBox = line.bbox;
            const lineW = Math.max(lBox.x1 - lBox.x0, 10);

            // Segment line into natural Chinese words (1-3 chars) and English words
            const words = this.segmentLineIntoWords(lineText);
            let charCursor = 0;
            const totalLineChars = Math.max(lineText.length, 1);

            words.forEach((word) => {
              const cleanWord = word.trim().replace(/^[0-9\s\.,:;、，。！？\(\)\[\]#\-—–]+|[0-9\s\.,:;、，。！？\(\)\[\]#\-—–]+$/g, '');
              if (!cleanWord || !shouldIncludeToken(cleanWord)) {
                charCursor += word.length;
                return;
              }

              // Calculate proportional or symbol-based coordinates
              let wordX0 = lBox.x0 + (charCursor / totalLineChars) * lineW;
              let wordX1 = lBox.x0 + ((charCursor + word.length) / totalLineChars) * lineW;
              let wordY0 = lBox.y0;
              let wordY1 = lBox.y1;

              // If line has symbols matching this word range, compute tight symbol bounds
              if (line.symbols && line.symbols.length > 0) {
                const matchedSymbols = line.symbols.slice(charCursor, charCursor + word.length);
                const validSyms = matchedSymbols.filter(s => s && s.bbox && s.bbox.x1 > s.bbox.x0);
                if (validSyms.length > 0) {
                  wordX0 = Math.min(...validSyms.map(s => s.bbox.x0));
                  wordX1 = Math.max(...validSyms.map(s => s.bbox.x1));
                  wordY0 = Math.min(...validSyms.map(s => s.bbox.y0));
                  wordY1 = Math.max(...validSyms.map(s => s.bbox.y1));
                }
              }

              // Convert to percentage
              const x = Number(Math.max(0.5, Math.min(96, (wordX0 / imageWidth) * 100)).toFixed(2));
              const y = Number(Math.max(0.5, Math.min(96, (wordY0 / imageHeight) * 100)).toFixed(2));
              const width = Number(Math.max(1.8, Math.min(98 - x, ((wordX1 - wordX0) / imageWidth) * 100)).toFixed(2));
              const height = Number(Math.max(1.6, Math.min(98 - y, ((wordY1 - wordY0) / imageHeight) * 100)).toFixed(2));

              tokens.push(this.createTokenFromText(cleanWord, { x, y, width, height }));
              charCursor += word.length;
            });
          });
        } else if (ret.data.words && ret.data.words.length > 0) {
          // Fallback if lines are missing
          ret.data.words.forEach((w) => {
            const rawText = w.text ? w.text.trim() : '';
            const cleanText = rawText.replace(/^[0-9\s\.,:;、，。！？\(\)\[\]#\-—–]+|[0-9\s\.,:;、，。！？\(\)\[\]#\-—–]+$/g, '');
            if (cleanText && shouldIncludeToken(cleanText)) {
              const x = Number(Math.max(0.5, Math.min(96, (w.bbox.x0 / imageWidth) * 100)).toFixed(2));
              const y = Number(Math.max(0.5, Math.min(96, (w.bbox.y0 / imageHeight) * 100)).toFixed(2));
              const width = Number(Math.max(1.8, Math.min(98 - x, ((w.bbox.x1 - w.bbox.x0) / imageWidth) * 100)).toFixed(2));
              const height = Number(Math.max(1.6, Math.min(98 - y, ((w.bbox.y1 - w.bbox.y0) / imageHeight) * 100)).toFixed(2));

              tokens.push(this.createTokenFromText(cleanText, { x, y, width, height }));
            }
          });
        }
      }

      console.info(`Tesseract OCR completed: ${tokens.length} word-level tokens extracted.`);

      if (tokens.length > 0) {
        return [
          {
            id: `tesseract-block-1`,
            bbox: { x: 1, y: 1, width: 98, height: 98 },
            chineseText: ret.data.text ? ret.data.text.substring(0, 150) : '',
            indonesianTranslation: 'Hasil pemindaian Word-Level OCR Tesseract.',
            tokens,
          },
        ];
      }

      return [];
    } catch (err) {
      console.warn('Tesseract OCR scan fallback:', err);
      return [];
    }
  }

  /**
   * Segments a Chinese/English text line into 1–3 character Chinese words and English words
   */
  private static segmentLineIntoWords(line: string): string[] {
    const result: string[] = [];
    // Split by whitespace or non-Hanzi boundaries
    const chunks = line.split(/(\s+|[a-zA-Z0-9\-_]+|[，。！？、：；（）\(\)\[\]])/);

    for (const chunk of chunks) {
      if (!chunk) continue;

      if (hasHanzi(chunk)) {
        // Group Chinese characters into 2-character words (or 3-chars if remaining)
        let i = 0;
        while (i < chunk.length) {
          if (i + 2 <= chunk.length) {
            result.push(chunk.substring(i, i + 2));
            i += 2;
          } else {
            result.push(chunk.substring(i, i + 1));
            i += 1;
          }
        }
      } else {
        result.push(chunk);
      }
    }

    return result;
  }

  /**
   * Segments a string (line or phrase) into individual word tokens with tight sub-bounding boxes
   */
  private static segmentStringIntoWordTokens(
    fullStr: string,
    itemBbox: { x: number; y: number; width: number; height: number }
  ): DocumentWordToken[] {
    const tokens: DocumentWordToken[] = [];
    const trimmed = fullStr.trim();
    if (!trimmed) return tokens;

    const words = this.segmentLineIntoWords(trimmed);
    const totalChars = Math.max(trimmed.length, 1);
    let charOffset = 0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const clean = word.trim().replace(/^[0-9\s\.,:;、，。！？\(\)\[\]#\-—–]+|[0-9\s\.,:;、，。！？\(\)\[\]#\-—–]+$/g, '');
      if (!clean || !shouldIncludeToken(clean)) {
        charOffset += word.length;
        continue;
      }

      const wordRatio = word.length / totalChars;
      const startRatio = charOffset / totalChars;

      const wordX = Number((itemBbox.x + itemBbox.width * startRatio).toFixed(2));
      const wordWidth = Number((itemBbox.width * wordRatio).toFixed(2));

      tokens.push(
        this.createTokenFromText(clean, {
          x: Math.min(Math.max(wordX, 0.5), 96),
          y: itemBbox.y,
          width: Math.max(wordWidth, 1.8),
          height: itemBbox.height,
        })
      );

      charOffset += word.length;
    }

    return tokens;
  }

  /**
   * Generates token info with dictionary lookup or English transliteration
   */
  private static createTokenFromText(
    text: string,
    bbox: { x: number; y: number; width: number; height: number }
  ): DocumentWordToken {
    const hasChinese = hasHanzi(text);

    if (hasChinese) {
      const dict = getDictionaryEntry(text);
      return {
        ...dict,
        id: `scanned-tok-${Math.random().toString(36).substring(2, 9)}`,
        bbox,
      };
    }

    // English word token
    return {
      id: `scanned-en-tok-${Math.random().toString(36).substring(2, 9)}`,
      chinese: text,
      pinyin: text.toLowerCase(),
      hskLevel: 1,
      radical: '🐵 Word-Level OCR',
      indonesianDef: `Word-level text detected: "${text}". Identified via document layout scanner.`,
      englishDef: `Scanned word item: "${text}".`,
      grammarNotes: `Word-level token: "${text}" at coordinates (${bbox.x}%, ${bbox.y}%).`,
      examples: [
        {
          id: `ex-word-1`,
          chinese: text,
          pinyin: text.toLowerCase(),
          indonesian: `Word item: ${text}`,
        },
      ],
      bbox,
    };
  }
}
