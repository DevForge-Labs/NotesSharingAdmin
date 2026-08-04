import { PromptContext } from '@/ai/prompts/metadataPrompt';
import { DomainMetadataDTO } from '@/ai/schemas/metadataSchema';
import { executeAiProvider } from './providers';
import { AI_CONFIG } from '@/constants/aiConfig';

export interface AiServiceResult {
  dto: DomainMetadataDTO;
  model: string;
  version: string;
  analysisDurationMs: number;
}

export async function processAiExtraction(
  context: PromptContext,
  signal?: AbortSignal
): Promise<AiServiceResult> {
  const startTime = Date.now();
  let attempts = 0;
  let delayMs = AI_CONFIG.RETRY_BASE_DELAY_MS;
  let lastError: any = null;

  while (attempts < AI_CONFIG.MAX_RETRIES) {
    attempts++;
    try {
      if (signal?.aborted) {
        throw new Error('AI processing aborted by user');
      }

      const { dto, model } = await executeAiProvider({ context, signal });
      const duration = Date.now() - startTime;

      return {
        dto,
        model,
        version: AI_CONFIG.AI_METADATA_VERSION,
        analysisDurationMs: duration
      };
    } catch (err: any) {
      lastError = err;
      
      if (err.name === 'AbortError' || signal?.aborted) {
        throw err;
      }

      const status = err?.status;
      const isRetryable = status === 429 || status === 503 || !status;

      if (!isRetryable || attempts >= AI_CONFIG.MAX_RETRIES) {
        break;
      }

      // Wait exponential backoff before retry
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, delayMs);
        if (signal) {
          signal.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new Error('AI processing aborted during retry backoff'));
          });
        }
      });
      delayMs *= 2;
    }
  }

  throw lastError || new Error('AI extraction failed after retries');
}
