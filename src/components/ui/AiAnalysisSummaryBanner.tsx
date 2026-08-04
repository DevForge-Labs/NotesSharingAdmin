import React from 'react';
import { AnalysisSummary } from '@/hooks/useAiAutofill';
import { CheckCircle2, AlertTriangle, XCircle, Zap, Sparkles } from 'lucide-react';

interface AiAnalysisSummaryBannerProps {
  summary: AnalysisSummary;
  isProcessing: boolean;
  className?: string;
}

export const AiAnalysisSummaryBanner: React.FC<AiAnalysisSummaryBannerProps> = ({
  summary,
  isProcessing,
  className = ''
}) => {
  if (summary.totalAnalyzed === 0) return null;

  return (
    <div className={`p-3 rounded-xl border bg-zinc-950/70 border-violet-500/20 text-xs shadow-md space-y-2 select-none ${className}`}>
      <div className="flex items-center justify-between font-semibold border-b border-zinc-800/80 pb-2">
        <span className="flex items-center gap-1.5 text-violet-300">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          AI Analysis Summary
        </span>
        <span className="text-[10px] text-zinc-400 font-mono">
          {isProcessing ? 'Analyzing items...' : `${summary.totalAnalyzed} files processed`}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[11px]">
        <div className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md font-medium">
          <CheckCircle2 className="h-3 w-3" />
          <span>Ready: <strong>{summary.readyCount}</strong></span>
        </div>

        {summary.needsReviewCount > 0 && (
          <div className="flex items-center gap-1 text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md font-medium">
            <AlertTriangle className="h-3 w-3" />
            <span>Needs Review: <strong>{summary.needsReviewCount}</strong></span>
          </div>
        )}

        {summary.failedCount > 0 && (
          <div className="flex items-center gap-1 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md font-medium">
            <XCircle className="h-3 w-3" />
            <span>Failed: <strong>{summary.failedCount}</strong></span>
          </div>
        )}

        {summary.skippedCount > 0 && (
          <div className="flex items-center gap-1 text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md font-medium">
            <Zap className="h-3 w-3" />
            <span>Skipped (Local Match): <strong>{summary.skippedCount}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
};
