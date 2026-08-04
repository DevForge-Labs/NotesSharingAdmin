import { useState, useRef, useCallback } from 'react';
import { DocumentType } from '@/constants/documentTypes';
import { SubjectOption } from '@/ai/prompts/metadataPrompt';
import { extractMetadataDeterministically, DeterministicMetadataOutput } from '@/services/metadata/metadataEngine';
import { MappedFirestoreMetadata } from '@/services/metadataMapper';
import { AI_CONFIG } from '@/constants/aiConfig';

export type AiAnalysisStatus = 
  | 'idle'
  | 'waiting'
  | 'reading_pdf'
  | 'ai_processing'
  | 'ready'
  | 'needs_review'
  | 'failed'
  | 'skipped';

export interface AiFileState {
  fileId: string;
  status: AiAnalysisStatus;
  statusMsg?: string;
  result?: MappedFirestoreMetadata;
  error?: string;
  isSkippedAi?: boolean;
}

export interface AnalysisSummary {
  readyCount: number;
  needsReviewCount: number;
  failedCount: number;
  skippedCount: number;
  totalAnalyzed: number;
}

export function useAiAutofill() {
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [fileStates, setFileStates] = useState<Record<string, AiFileState>>({});
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // In-memory cache based on file signature
  const cacheRef = useRef<Map<string, MappedFirestoreMetadata>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  const toggleAi = useCallback((enabled?: boolean) => {
    setIsEnabled(prev => (typeof enabled === 'boolean' ? enabled : !prev));
  }, []);

  const cancelAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsProcessing(false);
  }, []);

  const getFileCacheKey = (file: File): string => {
    return `${file.name}-${file.size}-${file.lastModified}`;
  };

  const analyzeFiles = useCallback(async (
    items: { id: string; file: File }[],
    documentType: DocumentType,
    _subjectCatalogOptions: SubjectOption[],
    currentContext?: { college?: string; branch?: string; semester?: string },
    onItemSuccess?: (id: string, metadata: MappedFirestoreMetadata) => void
  ) => {
    if (!isEnabled || items.length === 0) return;

    // Reset abort controller
    cancelAnalysis();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const signal = controller.signal;

    setIsProcessing(true);

    // Initialize waiting states for new files
    setFileStates(prev => {
      const next = { ...prev };
      for (const item of items) {
        if (!next[item.id]) {
          next[item.id] = { fileId: item.id, status: 'waiting' };
        }
      }
      return next;
    });

    const updateItemState = (id: string, updates: Partial<AiFileState>) => {
      setFileStates(prev => ({
        ...prev,
        [id]: { ...prev[id], fileId: id, ...updates }
      }));
    };

    // Process single file using Deterministic Metadata Extraction Engine
    const processSingleFile = async (item: { id: string; file: File }) => {
      if (signal.aborted) return;

      // 0. Cache Check
      const cacheKey = getFileCacheKey(item.file);
      if (cacheRef.current.has(cacheKey)) {
        const cachedMeta = cacheRef.current.get(cacheKey)!;
        const status: AiAnalysisStatus = cachedMeta.confidence >= AI_CONFIG.REVIEW_THRESHOLD ? 'ready' : 'needs_review';
        console.log(`[Deterministic Engine] Instant Cache Hit for "${item.file.name}":`, cachedMeta);
        updateItemState(item.id, { status, result: cachedMeta, isSkippedAi: true });
        if (onItemSuccess) onItemSuccess(item.id, cachedMeta);
        return;
      }

      try {
        const result: DeterministicMetadataOutput = await extractMetadataDeterministically({
          file: item.file,
          documentType,
          context: currentContext,
          onProgressStep: (stepMsg) => {
            if (stepMsg.includes('Reading PDF')) {
              updateItemState(item.id, { status: 'reading_pdf', statusMsg: stepMsg });
            } else {
              updateItemState(item.id, { status: 'ai_processing', statusMsg: stepMsg });
            }
          },
          signal
        });

        if (signal.aborted) return;

        const mapped: MappedFirestoreMetadata = {
          title: result.title,
          description: result.description,
          subject: result.subject,
          subjectId: result.subjectId,
          displaySubject: result.displaySubject,
          searchKey: result.searchKey,
          semester: result.semester,
          branch: result.branch,
          college: result.college,
          examType: result.examType,
          examYear: result.examYear,
          resourceType: result.resourceType,
          topics: result.topics,
          tags: result.topics,
          confidence: result.confidence,
          aiGenerated: false,
          aiConfidence: result.confidence,
          aiModel: 'deterministic-engine-v1',
          aiVersion: 'v1.0',
          analysisDurationMs: 5
        };

        cacheRef.current.set(cacheKey, mapped);
        const finalStatus: AiAnalysisStatus = mapped.confidence >= AI_CONFIG.REVIEW_THRESHOLD ? 'ready' : 'needs_review';

        updateItemState(item.id, { status: finalStatus, result: mapped });
        if (onItemSuccess) onItemSuccess(item.id, mapped);
      } catch (err: any) {
        if (signal.aborted) return;
        console.error(`[Deterministic Engine] Extraction error for ${item.file.name}:`, err);
        updateItemState(item.id, { 
          status: 'needs_review', 
          error: err?.message || 'Metadata extraction failed' 
        });
      }
    };

    // Step 4: Batch Processing with Concurrency Control (Max 3)
    const queue = [...items];
    const workers: Promise<void>[] = [];

    for (let i = 0; i < AI_CONFIG.MAX_CONCURRENCY; i++) {
      workers.push((async () => {
        while (queue.length > 0 && !signal.aborted) {
          const item = queue.shift();
          if (item) {
            await processSingleFile(item);
          }
        }
      })());
    }

    await Promise.all(workers);
    setIsProcessing(false);
  }, [isEnabled, cancelAnalysis]);

  // Compute summary stats across processed files
  const summary: AnalysisSummary = {
    readyCount: Object.values(fileStates).filter(s => s.status === 'ready').length,
    needsReviewCount: Object.values(fileStates).filter(s => s.status === 'needs_review').length,
    failedCount: Object.values(fileStates).filter(s => s.status === 'failed').length,
    skippedCount: Object.values(fileStates).filter(s => s.isSkippedAi).length,
    totalAnalyzed: Object.keys(fileStates).length
  };

  return {
    isEnabled,
    toggleAi,
    fileStates,
    isProcessing,
    analyzeFiles,
    cancelAnalysis,
    summary
  };
}
