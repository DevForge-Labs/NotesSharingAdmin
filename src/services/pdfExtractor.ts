import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set worker source URL using Vite's bundled worker URL
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

export async function extractFirstPageText(file: File, signal?: AbortSignal): Promise<string> {
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
      console.warn(`[PDF Extractor Debug] PDF file ${file.name} has 0 pages`);
      return '';
    }

    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    const textItems = textContent.items.map((item: any) => item.str || '');
    const fullText = textItems.join(' ').replace(/\s+/g, ' ').trim();

    console.log(`[PDF Extractor Debug] ${file.name} - Extracted Text Length: ${fullText.length}`);
    console.log(`[PDF Extractor Debug] ${file.name} - First 500 chars:\n"${fullText.substring(0, 500)}"`);

    return fullText;
  } catch (err: any) {
    if (err?.message === 'Extraction aborted' || signal?.aborted) {
      throw err;
    }
    console.warn(`[PDF Extractor Debug] PDF text extraction failed for ${file.name}:`, err);
    return '';
  }
}
