import { extractMetadataViaGeminiSDK, ProviderRequestOptions } from './geminiProvider';
import { extractMetadataViaBackend } from './httpBackendProvider';
import { DomainMetadataDTO } from '@/ai/schemas/metadataSchema';

export async function executeAiProvider(
  options: ProviderRequestOptions
): Promise<{ dto: DomainMetadataDTO; model: string }> {
  const backendUrl = import.meta.env.VITE_AI_BACKEND_URL;
  
  if (backendUrl) {
    return extractMetadataViaBackend(options);
  }

  return extractMetadataViaGeminiSDK(options);
}
