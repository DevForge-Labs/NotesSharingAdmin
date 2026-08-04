import { DomainMetadataDTO, geminiResponseSchema } from '@/ai/schemas/metadataSchema';
import { PromptContext, buildMetadataPrompt } from '@/ai/prompts/metadataPrompt';
import { AI_CONFIG } from '@/constants/aiConfig';

export interface ProviderRequestOptions {
  context: PromptContext;
  signal?: AbortSignal;
}

let discoveredModelCache: string | null = null;

export async function discoverSupportedModel(apiKey: string): Promise<string> {
  if (discoveredModelCache) return discoveredModelCache;

  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (listRes.ok) {
      const data = await listRes.json();
      const models = data.models || [];
      const flashModel = models.find((m: any) => 
        m.name?.includes('flash') && m.supportedGenerationMethods?.includes('generateContent')
      );
      if (flashModel) {
        const cleanName = flashModel.name.replace(/^models\//, '');
        console.log(`[AI Discovery] Dynamically discovered supported Flash model: ${cleanName}`);
        discoveredModelCache = cleanName;
        return cleanName;
      }
    }
  } catch (err) {
    console.warn('[AI Discovery] Model discovery endpoint warning:', err);
  }

  return 'gemini-flash-latest';
}

export async function extractMetadataViaGeminiSDK(
  options: ProviderRequestOptions
): Promise<{ dto: DomainMetadataDTO; model: string }> {
  const { context, signal } = options;
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.error('[AI Debug] ERROR: VITE_GEMINI_API_KEY is missing in .env.local');
    throw new Error('VITE_GEMINI_API_KEY is missing in environment variables');
  }

  const promptText = buildMetadataPrompt(context);
  const primaryModel = await discoverSupportedModel(apiKey);
  const modelsToTry = Array.from(new Set([primaryModel, 'gemini-flash-latest', 'gemini-2.0-flash', 'gemini-2.5-flash']));

  let lastError: any = null;

  for (const modelName of modelsToTry) {
    console.log(`[AI Debug] Calling Gemini API (${modelName}) for file: "${context.filename}" (Prompt Length: ${promptText.length})`);

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const requestBody = {
      contents: [
        {
          parts: [{ text: promptText }]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: geminiResponseSchema
      }
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData?.error?.message || `HTTP ${response.status} ${response.statusText}`;
        console.warn(`[AI Debug] Model ${modelName} returned status ${response.status}: ${message}`);
        const err = new Error(`Gemini API Error (${response.status}): ${message}`);
        (err as any).status = response.status;
        
        if (response.status === 404) {
          lastError = err;
          continue;
        }
        throw err;
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      console.log(`[AI Debug] Raw Gemini Response for "${context.filename}":\n`, rawText);

      if (!rawText) {
        throw new Error('Gemini API returned empty candidate content');
      }

      const parsed = JSON.parse(rawText) as DomainMetadataDTO;
      console.log(`[AI Debug] Parsed JSON Response:`, parsed);

      discoveredModelCache = modelName;

      return {
        dto: parsed,
        model: modelName
      };
    } catch (err: any) {
      if (err.name === 'AbortError' || signal?.aborted) {
        throw err;
      }
      lastError = err;
      if ((err as any).status !== 404) {
        throw err;
      }
    }
  }

  throw lastError || new Error('All Gemini API model attempts failed');
}
