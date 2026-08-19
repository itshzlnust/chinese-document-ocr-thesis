import { DocumentBlock, DocumentWordToken } from '../types';
import { getDictionaryEntry } from '../data/cc_cedict_sample';

export interface MonkeyOCRServerConfig {
  apiUrl: string;
  isLiveServerConnected: boolean;
}

// ─────────────────────────────────────────────────────────────
// Token filter: keep ONLY Hanzi-containing or pure English tokens
// ─────────────────────────────────────────────────────────────

/** Returns true if text contains at least one Hanzi (Chinese) character */
const hasHanzi = (text: string) => /[\u4e00-\u9fa5]/.test(text);

/**
 * Returns true if text is "English" — i.e. purely Latin alphabet words.
 */
const isEnglish = (text: string): boolean => {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (!/[a-zA-Z]/.test(trimmed)) return false;
  return /^[a-zA-Z0-9\s\-'.,!?&/()]+$/.test(trimmed);
};

/**
 * Master filter: accept a token text if it is Hanzi OR English.
 * Rejects: pure-Indonesian words, pure numbers, symbols.
 */
const shouldIncludeToken = (text: string): boolean => {
  const trimmed = text.trim();
  if (trimmed.length === 0) return false;
  return hasHanzi(trimmed) || isEnglish(trimmed);
};

export class MonkeyOCRService {
  private static apiUrl = 'http://localhost:8000/api/v1/ocr-identify';

  public static setApiUrl(url: string) {
    this.apiUrl = url;
  }

  public static getApiUrl(): string {
    return this.apiUrl;
  }

  /**
   * Primary OCR detection method powered by MonkeyOCR v2 model engine.
   * Attempts to call live Python PyTorch backend (http://localhost:8000).
   * If server is offline and file is a custom upload, returns empty array so
   * OCREngine falls back to real image OCR scanning (Tesseract / PDF.js).
   */
  public static async identifyDocument(file: File, pageNum = 1): Promise<DocumentBlock[]> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('page', pageNum.toString());

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.blocks) && data.blocks.length > 0) {
          const filtered = this.filterBlocks(data.blocks as DocumentBlock[]);
          console.info(`✅ MonkeyOCR v2 backend: ${filtered.reduce((s, b) => s + b.tokens.length, 0)} tokens (Hanzi+EN) in ${data.processTimeMs}ms`);
          return filtered;
        }
      }
    } catch (e) {
      console.info('MonkeyOCR v2 backend offline — falling back to client-side image/PDF OCR engine.');
    }

    // Only return hardcoded sample blocks if the file is one of the built-in demo samples
    const fileName = file.name.toLowerCase();
    if (fileName.includes('sample') || fileName.includes('guide') || fileName.includes('storybook')) {
      return this.runMonkeyOCRv2LayoutAnalysis(file, pageNum);
    }

    // For custom uploaded files, return [] so OCREngine uses real Tesseract/PDF.js image scanning!
    return [];
  }

  /**
   * Filter blocks: keep only blocks that have ≥1 valid token (Hanzi or English).
   */
  private static filterBlocks(blocks: DocumentBlock[]): DocumentBlock[] {
    return blocks
      .map((block) => ({
        ...block,
        tokens: block.tokens.filter((tok) => shouldIncludeToken(tok.chinese)),
      }))
      .filter((block) => block.tokens.length > 0);
  }

  /**
   * MonkeyOCR v2 Demo Layout Parser for built-in sample documents only.
   */
  private static async runMonkeyOCRv2LayoutAnalysis(_file: File, _pageNum: number): Promise<DocumentBlock[]> {
    return [
      {
        id: `monkeyocr-block-gen-1`,
        bbox: { x: 8, y: 12, width: 84, height: 28 },
        chineseText: '欢迎使用 MonkeyOCR v2 文档识别与翻译系统。',
        indonesianTranslation: 'Selamat datang di sistem pengenalan dokumen MonkeyOCR v2.',
        tokens: [
          this.createToken('文档', { x: 12, y: 15, width: 14, height: 16 }),
          this.createToken('识', { x: 28, y: 15, width: 8, height: 16 }),
          this.createToken('别', { x: 38, y: 15, width: 8, height: 16 }),
          this.createToken('翻译', { x: 48, y: 15, width: 14, height: 16 }),
          this.createToken('汉字', { x: 65, y: 15, width: 14, height: 16 }),
        ],
      },
      {
        id: `monkeyocr-block-gen-2`,
        bbox: { x: 8, y: 48, width: 84, height: 28 },
        chineseText: '自动识别与卡片复习，能够快速掌握中文。看懂汉字, 记忆卡片。',
        indonesianTranslation: 'Pengenalan otomatis dan peninjauan kartu, dapat menguasai Bahasa Mandarin.',
        tokens: [
          this.createToken('学习', { x: 12, y: 52, width: 14, height: 16 }),
          this.createToken('中文', { x: 28, y: 52, width: 14, height: 16 }),
          this.createToken('懂', { x: 45, y: 52, width: 8, height: 16 }),
          this.createToken('卡片', { x: 56, y: 52, width: 14, height: 16 }),
          this.createToken('猴', { x: 73, y: 52, width: 8, height: 16 }),
        ],
      },
    ];
  }

  private static createToken(
    text: string,
    bbox: { x: number; y: number; width: number; height: number }
  ): DocumentWordToken {
    const hasChinese = hasHanzi(text);

    if (hasChinese) {
      const dict = getDictionaryEntry(text);
      return {
        ...dict,
        id: `monkey-tok-${Math.random().toString(36).substring(2, 9)}`,
        bbox,
      };
    }

    return {
      id: `monkey-en-tok-${Math.random().toString(36).substring(2, 9)}`,
      chinese: text,
      pinyin: text.toLowerCase(),
      hskLevel: 1,
      radical: '🐵 MonkeyOCR v2 — English Text',
      indonesianDef: `English text detected: "${text}". Identified by MonkeyOCR v2 vision scan.`,
      englishDef: `Scanned English text: "${text}".`,
      grammarNotes: `English text item at position (${bbox.x}%, ${bbox.y}%).`,
      examples: [
        {
          id: `ex-en-1`,
          chinese: text,
          pinyin: text.toLowerCase(),
          indonesian: `English: ${text}`,
        },
      ],
      bbox,
    };
  }
}
