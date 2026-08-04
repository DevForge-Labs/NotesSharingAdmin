import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

export interface ParsedPdfTextResult {
  firstPageText: string;
  extractedYear?: number;
  extractedExamType?: 'Endsem' | 'Midsem' | 'Quiz';
  extractedSubjectText?: string;
  extractedUnit?: string;
}

export async function extractFirstPagePdfText(file: File, signal?: AbortSignal): Promise<ParsedPdfTextResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    if (signal?.aborted) {
      throw new Error('Extraction aborted');
    }

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    if (signal) {
      signal.addEventListener('abort', () => {
        try {
          loadingTask.destroy();
        } catch (_) {}
      });
    }

    const pdf = await loadingTask.promise;
    if (pdf.numPages === 0) {
      return { firstPageText: '' };
    }

    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    const textItems = textContent.items.map((item: any) => item.str || '');
    const firstPageText = textItems.join(' ').replace(/\s+/g, ' ').trim();

    if (!firstPageText) {
      return { firstPageText: '' };
    }

    // Extract Year from Page 1 text
    const yearMatch = firstPageText.match(/\b(20\d{2})\b/);
    const extractedYear = yearMatch ? parseInt(yearMatch[1], 10) : undefined;

    // Extract Exam Type from Page 1 text
    let extractedExamType: 'Endsem' | 'Midsem' | 'Quiz' | undefined = undefined;
    if (/\b(end\s*sem(?:ester)?|end-sem|endsem|final\s*examination|final\s*sem)\b/i.test(firstPageText)) {
      extractedExamType = 'Endsem';
    } else if (/\b(mid\s*sem(?:ester)?|mid-sem|midsem|internal\s*examination|internal\s*test)\b/i.test(firstPageText)) {
      extractedExamType = 'Midsem';
    } else if (/\bquiz\b/i.test(firstPageText)) {
      extractedExamType = 'Quiz';
    }

    // Extract Unit / Module from Page 1 text
    let extractedUnit: string | undefined = undefined;
    const unitMatch = firstPageText.match(/\b(?:unit|module|chapter)\s*([1-8])\b/i);
    if (unitMatch) {
      extractedUnit = `Unit ${unitMatch[1]}`;
    }

    return {
      firstPageText,
      extractedYear,
      extractedExamType,
      extractedUnit
    };
  } catch (err: any) {
    if (err?.message === 'Extraction aborted' || signal?.aborted) {
      throw err;
    }
    console.warn(`[PDF Text Parser] Text extraction skipped/failed for ${file.name}:`, err);
    return { firstPageText: '' };
  }
}
