/**
 * NMT Translation Service
 * =======================
 * Calls the FastAPI backend Helsinki-NLP/opus-mt-zh-en translation endpoint.
 * Falls back gracefully when backend is offline.
 */

export type TranslationDirection = 'zh-en' | 'en-zh';

export interface TranslationResult {
  original: string;
  translated: string;
  model: string;
  source: 'nmt-backend' | 'fallback';
  timeMs?: number;
}

export interface BatchTranslationResult {
  results: TranslationResult[];
  totalTimeMs: number;
}

const API_BASE = 'http://localhost:8000/api/v1';

export class NMTTranslationService {
  private static cache = new Map<string, string>();

  /** Translate a single text snippet */
  static async translate(
    text: string,
    direction: TranslationDirection = 'zh-en',
  ): Promise<TranslationResult> {
    if (!text.trim()) return { original: text, translated: '', model: 'none', source: 'fallback' };

    const cacheKey = `${direction}:${text}`;
    if (this.cache.has(cacheKey)) {
      return {
        original: text,
        translated: this.cache.get(cacheKey)!,
        model: 'cache',
        source: 'nmt-backend',
      };
    }

    const t0 = performance.now();
    try {
      const fd = new FormData();
      fd.append('text', text);
      fd.append('direction', direction);

      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 5000);

      const res = await fetch(`${API_BASE}/translate`, {
        method: 'POST',
        body: fd,
        signal: ctrl.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const translated = data.translated ?? text;
        this.cache.set(cacheKey, translated);
        return {
          original: text,
          translated,
          model: data.model ?? 'Helsinki-NLP/opus-mt-zh-en',
          source: 'nmt-backend',
          timeMs: Math.round(performance.now() - t0),
        };
      }
    } catch {
      // backend offline → use fallback
    }

    return {
      original: text,
      translated: this.simpleFallback(text, direction),
      model: 'fallback',
      source: 'fallback',
      timeMs: Math.round(performance.now() - t0),
    };
  }

  /** Translate multiple texts in parallel (batch) */
  static async translateBatch(
    texts: string[],
    direction: TranslationDirection = 'zh-en',
  ): Promise<BatchTranslationResult> {
    const t0 = performance.now();
    const results = await Promise.all(texts.map((t) => this.translate(t, direction)));
    return { results, totalTimeMs: Math.round(performance.now() - t0) };
  }

  /** Check if backend NMT is available */
  static async checkBackend(): Promise<{ online: boolean; model: string; zhEnLoaded: boolean; enZhLoaded: boolean }> {
    try {
      const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const d = await res.json();
        return {
          online: true,
          model: d.nmt_model ?? 'Helsinki-NLP/opus-mt-zh-en',
          zhEnLoaded: d.nmt_zh_en_loaded ?? false,
          enZhLoaded: d.nmt_en_zh_loaded ?? false,
        };
      }
    } catch { /* offline */ }
    return { online: false, model: 'offline', zhEnLoaded: false, enZhLoaded: false };
  }

  /** Minimal client-side fallback using known dictionary entries */
  private static simpleFallback(text: string, direction: TranslationDirection): string {
    const dict: Record<string, string> = {
      '学习': 'study / learn', '汉字': 'Chinese character (Hanzi)',
      '翻译': 'translate / translation', '中文': 'Chinese language',
      '文档': 'document / file', '识别': 'identify / recognize',
      '系统': 'system', '开发': 'develop / development',
      '学生': 'student', '教师': 'teacher / lecturer',
      '实习': 'internship / practicum', '指导': 'guide / supervise',
    };
    if (direction === 'zh-en') {
      for (const [zh, en] of Object.entries(dict)) {
        if (text.includes(zh)) return `[Fallback] ${en}`;
      }
      return `[Backend offline — install & run server.py] ${text}`;
    }
    return `[EN→ZH fallback] ${text}`;
  }

  static clearCache() {
    this.cache.clear();
  }
}
