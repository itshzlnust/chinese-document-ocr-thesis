import { HanziStrokeData } from '../types';
import { getHanziVGStrokes, HANZI_VG_DATA, CHARACTER_RADICALS_MAP } from '../data/hanzivg_data';

export class HanziVGService {
  private static cache = new Map<string, HanziStrokeData>();

  /**
   * Synchronous stroke data lookup
   */
  public static getStrokesForCharacter(char: string): HanziStrokeData {
    if (this.cache.has(char)) {
      return this.cache.get(char)!;
    }
    return getHanziVGStrokes(char);
  }

  /**
   * Get authentic radical for a character
   */
  public static getRadical(char: string): string {
    return CHARACTER_RADICALS_MAP[char] || '部首 (Radical)';
  }

  /**
   * Asynchronous stroke data fetcher for ANY Unicode Chinese character via HanziWriter open data CDN
   */
  public static async fetchStrokesForCharacter(char: string): Promise<HanziStrokeData> {
    if (!char || char.trim().length === 0) {
      return getHanziVGStrokes('字');
    }

    const cleanChar = char.trim().charAt(0);

    // 1. Check in-memory cache
    if (this.cache.has(cleanChar)) {
      return this.cache.get(cleanChar)!;
    }

    // 2. Check bundled offline datasets
    if (HANZI_VG_DATA[cleanChar]) {
      this.cache.set(cleanChar, HANZI_VG_DATA[cleanChar]);
      return HANZI_VG_DATA[cleanChar];
    }

    // 3. Fetch from HanziWriter open vector stroke database CDN
    try {
      const url = `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${encodeURIComponent(cleanChar)}.json`;
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 3500);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.strokes) && data.strokes.length > 0) {
          const radicalName = CHARACTER_RADICALS_MAP[cleanChar] || '部首 (Radical)';
          const strokeData: HanziStrokeData = {
            character: cleanChar,
            radicals: [radicalName.charAt(0)],
            strokes: data.strokes,
            medians: data.medians,
          };
          this.cache.set(cleanChar, strokeData);
          return strokeData;
        }
      }
    } catch {
      // Offline fallback
    }

    // 4. Return offline graceful vector stroke structure
    const fallback = getHanziVGStrokes(cleanChar);
    this.cache.set(cleanChar, fallback);
    return fallback;
  }
}
