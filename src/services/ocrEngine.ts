import { OCRDocument, DocumentBlock } from '../types';
import { PDFRendererService } from './pdfRenderer';
import { MonkeyOCRService } from './monkeyOcrService';
import { OCRScannerService } from './ocrScanner';

export class OCREngine {
  /**
   * Process custom uploaded file (image or PDF) with word-level OCR bounding box detection
   */
  public static async processCustomDocument(file: File, pageNum = 1): Promise<OCRDocument> {
    const isPdf = file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');
    let imageUrl = '';
    let pdfTotalPages = 1;

    if (isPdf) {
      // 1. Render PDF page to crisp Canvas image URL using PDFRendererService
      const pdfResult = await PDFRendererService.renderPDFPage(file, pageNum);
      imageUrl = pdfResult.dataUrl;
      pdfTotalPages = pdfResult.totalPages;
    } else {
      imageUrl = URL.createObjectURL(file);
    }

    let blocksToUse: DocumentBlock[] = [];

    // Step 1: For PDFs, attempt PDF.js real word-level text layer extraction
    if (isPdf) {
      blocksToUse = await OCRScannerService.scanPDFDocument(file, pageNum);
    }

    // Step 2: If PDF has no text layer or file is image, call MonkeyOCR v2 backend / layout vision service
    if (blocksToUse.length === 0 || blocksToUse[0].tokens.length === 0) {
      blocksToUse = await MonkeyOCRService.identifyDocument(file, pageNum);
    }

    // Step 3: If still empty, run client-side word-level Tesseract OCR scan
    if (blocksToUse.length === 0 || blocksToUse[0].tokens.length === 0) {
      blocksToUse = await OCRScannerService.scanImageWithTesseract(imageUrl);
    }

    return {
      id: `doc-upload-${Date.now()}`,
      title: file.name,
      type: isPdf ? 'pdf' : 'image',
      imageUrl,
      width: 1000,
      height: 1200,
      blocks: blocksToUse,
      fullChineseText: blocksToUse.map((b) => b.chineseText).join(' '),
      fullIndonesianText: `Word-level OCR Terjemahan Dokumen "${file.name}"`,
      pdfPageNumber: pageNum,
      pdfTotalPages,
      fileObj: file,
    };
  }
}
