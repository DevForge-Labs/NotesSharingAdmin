import { DomainMetadataDTO } from '@/ai/schemas/metadataSchema';
import { ProviderRequestOptions } from './geminiProvider';
import { AI_CONFIG } from '@/constants/aiConfig';

export async function extractMetadataViaBackend(
  options: ProviderRequestOptions
): Promise<{ dto: DomainMetadataDTO; model: string }> {
  const { context, signal } = options;
  const backendUrl = import.meta.env.VITE_AI_BACKEND_URL || '/api/extract-metadata';

  const response = await fetch(backendUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(context),
    signal
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.message || `HTTP ${response.status} ${response.statusText}`;
    const err = new Error(`Backend AI Endpoint Error (${response.status}): ${message}`);
    (err as any).status = response.status;
    throw err;
  }

  const data = await response.json();
  return {
    dto: data.dto || data,
    model: data.model || AI_CONFIG.DEFAULT_MODEL
  };
}
