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

/** Filter to keep only Hanzi or English tokens */
const shouldIncludeToken = (text: string): boolean => {
  const trimmed = text.trim();
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

        const xPercent = Math.min(Math.max(1, (leftPx / viewport.width) * 100), 96);
        const yPercent = Math.min(Math.max(1, (topPx / viewport.height) * 100), 96);
        const widthPercent = Math.min(Math.max(2, (itemWidth / viewport.width) * 100), 95);
        const heightPercent = Math.min(Math.max(1.8, ((fontSize * 1.3) / viewport.height) * 100), 15);

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
            bbox: { x: 2, y: 2, width: 96, height: 96 },
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
   * Scans image using Tesseract.js client-side OCR for word-level bounding boxes
   */
  public static async scanImageWithTesseract(imageSrc: string): Promise<DocumentBlock[]> {
    try {
      const worker = await createWorker('chi_sim+eng');
      const ret = await worker.recognize(imageSrc);
      await worker.terminate();

      const tokens: DocumentWordToken[] = [];

      if (ret.data && ret.data.words) {
        const imageWidth = (ret.data as any).width || 1000;
        const imageHeight = (ret.data as any).height || 1200;

        ret.data.words.forEach((w) => {
          const text = w.text.trim();
          if (text.length > 0 && shouldIncludeToken(text)) {
            const { x0, y0, x1, y1 } = w.bbox;
            const x = Number(((x0 / imageWidth) * 100).toFixed(2));
            const y = Number(((y0 / imageHeight) * 100).toFixed(2));
            const width = Number((((x1 - x0) / imageWidth) * 100).toFixed(2));
            const height = Number((((y1 - y0) / imageHeight) * 100).toFixed(2));

            tokens.push(this.createTokenFromText(text, { x, y, width, height }));
          }
        });
      }

      if (tokens.length > 0) {
        return [
          {
            id: `tesseract-block-1`,
            bbox: { x: 2, y: 2, width: 96, height: 96 },
            chineseText: ret.data.text.substring(0, 150),
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
   * Segments a string (line or phrase) into individual word tokens with tight sub-bounding boxes
   */
  private static segmentStringIntoWordTokens(
    fullStr: string,
    itemBbox: { x: number; y: number; width: number; height: number }
  ): DocumentWordToken[] {
    const tokens: DocumentWordToken[] = [];
    const trimmed = fullStr.trim();
    if (!trimmed) return tokens;

    // Split words by space or Chinese character boundaries
    // Chinese characters are split into 1-2 char words; English words by whitespace
    const words: string[] = [];
    const parts = trimmed.split(/(\s+|[\u4e00-\u9fa5]{1,2})/);
    for (const p of parts) {
      const w = p.trim();
      if (w.length > 0) {
        words.push(w);
      }
    }

    if (words.length === 0) return tokens;

    const totalChars = trimmed.length;
    let charOffset = 0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (!shouldIncludeToken(word)) {
        charOffset += word.length + 1;
        continue;
      }

      // Calculate word's relative position along the parent bounding box line
      const wordRatio = word.length / Math.max(totalChars, 1);
      const startRatio = charOffset / Math.max(totalChars, 1);

      const wordX = Number((itemBbox.x + itemBbox.width * startRatio).toFixed(2));
      const wordWidth = Number((itemBbox.width * wordRatio).toFixed(2));

      tokens.push(
        this.createTokenFromText(word, {
          x: Math.min(wordX, 96),
          y: itemBbox.y,
          width: Math.max(wordWidth, 1.8),
          height: itemBbox.height,
        })
      );

      charOffset += word.length + 1;
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
