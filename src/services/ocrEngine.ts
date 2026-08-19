import { OCRDocument, DocumentBlock } from '../types';
import { PDFRendererService } from './pdfRenderer';
import { MonkeyOCRService } from './monkeyOcrService';

export class OCREngine {
  /**
   * Process custom uploaded file (image or PDF) using MonkeyOCR v2 vision model layout detection
   */
  public static async processCustomDocument(file: File, pageNum = 1): Promise<OCRDocument> {
    const isPdf = file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');
    let imageUrl = '';
    let pdfTotalPages = 1;

    if (isPdf) {
      // Render PDF page to crisp Canvas image URL using PDFRendererService
      const pdfResult = await PDFRendererService.renderPDFPage(file, pageNum);
      imageUrl = pdfResult.dataUrl;
      pdfTotalPages = pdfResult.totalPages;
    } else {
      imageUrl = URL.createObjectURL(file);
    }

    // Run MonkeyOCR v2 model text detection & structural layout analysis
    const blocksToUse: DocumentBlock[] = await MonkeyOCRService.identifyDocument(file, pageNum);

    return {
      id: `doc-upload-${Date.now()}`,
      title: file.name,
      type: isPdf ? 'pdf' : 'image',
      imageUrl,
      width: 1000,
      height: 1200,
      blocks: blocksToUse,
      fullChineseText: blocksToUse.map((b) => b.chineseText).join(' '),
      fullIndonesianText: `MonkeyOCR v2 Terjemahan Dokumen "${file.name}"`,
      pdfPageNumber: pageNum,
      pdfTotalPages,
      fileObj: file
    };
  }
}
