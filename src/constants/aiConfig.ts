export const AI_CONFIG = {
  REVIEW_THRESHOLD: 0.70,
  HIGH_CONFIDENCE_THRESHOLD: 0.85,
  AI_METADATA_VERSION: 'metadata-v1',
  DEFAULT_MODEL: 'gemini-1.5-flash',
  FALLBACK_MODELS: ['gemini-1.5-flash', 'gemini-1.5-pro'],
  MAX_CONCURRENCY: 3,
  MAX_RETRIES: 3,
  RETRY_BASE_DELAY_MS: 1000,
} as const;
