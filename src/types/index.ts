export interface BoundingBox {
  x: number; // percentage (0-100) or pixel
  y: number;
  width: number;
  height: number;
}

export interface ExampleSentence {
  id: string;
  chinese: string;
  pinyin: string;
  indonesian: string;
  english?: string;
}

export interface HanziStrokeData {
  character: string;
  strokes: string[]; // SVG path strings
  medians?: number[][][]; // Optional stroke skeleton points
  radicals?: string[];
}

export interface WordInfo {
  id: string;
  chinese: string;
  pinyin: string;
  hskLevel: number;
  radical: string;
  indonesianDef: string;
  englishDef: string;
  grammarNotes: string;
  examples: ExampleSentence[];
  strokeData?: HanziStrokeData;
  bbox?: BoundingBox;
}

export interface DocumentWordToken extends WordInfo {
  bbox: BoundingBox; // Relative bounding box on image (0-100%)
  lineIndex?: number;
}

export interface DocumentBlock {
  id: string;
  bbox: BoundingBox;
  chineseText: string;
  indonesianTranslation: string;
  tokens: DocumentWordToken[];
}

export interface OCRDocument {
  id: string;
  title: string;
  type: 'image' | 'pdf';
  imageUrl: string;
  width: number;
  height: number;
  blocks: DocumentBlock[];
  fullChineseText: string;
  fullIndonesianText: string;
  pdfPageNumber?: number;
  pdfTotalPages?: number;
  fileObj?: File;
}

export interface Flashcard {
  id: string;
  character: string;
  pinyin: string;
  hskLevel: number;
  radical: string;
  indonesianDef: string;
  englishDef: string;
  grammarNotes: string;
  examples: ExampleSentence[];
  addedAt: string;
  masteryLevel: number; // 0 to 5
  nextReviewDate?: string;
  tags?: string[];
}

export type ActiveTab = 'reader' | 'translator' | 'flashcards' | 'api-settings';
