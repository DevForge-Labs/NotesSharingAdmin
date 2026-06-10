import React, { useState, useEffect } from 'react';
import { Dialog, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { deleteResource } from '@/lib/deleteResource';
import { ADMIN_DELETION_REASONS } from '@/constants/adminDeletionReasons';
import { AlertTriangle, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface BulkDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  showToast: (message: any, type?: 'success' | 'info' | 'error') => void;
  resources: any[];
  resourceType: 'notes' | 'assignments' | 'pyqs' | 'cheatsheets' | 'videos';
}

const resourceTypeLabels: Record<string, string> = {
  notes: 'Notes',
  assignments: 'Assignments',
  pyqs: 'PYQs',
  cheatsheets: 'Cheatsheets',
  videos: 'Videos'
};

export const BulkDeleteDialog: React.FC<BulkDeleteDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  showToast,
  resources,
  resourceType
}) => {
  const { user } = useAuth();
  const [reason, setReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [confirmText, setConfirmText] = useState<string>('');
  
  // Progress states
  const [status, setStatus] = useState<'idle' | 'deleting' | 'completed'>('idle');
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [successCount, setSuccessCount] = useState<number>(0);
  const [failureCount, setFailureCount] = useState<number>(0);
  const [failedResources, setFailedResources] = useState<Array<{ title: string; error?: string }>>([]);

  const selectedCount = resources.length;
  const isLargeDelete = selectedCount >= 10;
  
  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setCustomReason('');
      setConfirmText('');
      setStatus('idle');
      setCompletedCount(0);
      setSuccessCount(0);
      setFailureCount(0);
      setFailedResources([]);
    }
  }, [isOpen]);

  if (selectedCount === 0) return null;

  const resourceLabel = resourceTypeLabels[resourceType] || 'Resources';
  
  // Validation checks
  const isReasonValid = reason && (reason !== 'Other' || customReason.trim().length >= 10);
  const isSafetyConfirmed = !isLargeDelete || confirmText === 'DELETE';
  const isValid = isReasonValid && isSafetyConfirmed && user && status === 'idle';

  const handleBulkDelete = async () => {
    if (!isValid || !user) return;
    setStatus('deleting');

    const finalDeletionReason = reason === 'Other' ? customReason.trim() : reason;
    const finalCustomReason = reason === 'Other' ? customReason.trim() : '';

    let completed = 0;
    let succeeded = 0;
    let failed = 0;
    const failedList: Array<{ title: string; error?: string }> = [];

    const promises = resources.map(async (res) => {
      try {
        // 1. Gather all storage paths/URLs
        const pathsSet = new Set<string>();
        if (res.storagePath) pathsSet.add(res.storagePath);
        if (res.storagePaths && Array.isArray(res.storagePaths)) {
          res.storagePaths.forEach((p: string) => p && pathsSet.add(p));
        }
        if (res.fileUrl) pathsSet.add(res.fileUrl);
        if (res.fileUrls && Array.isArray(res.fileUrls)) {
          res.fileUrls.forEach((u: string) => u && pathsSet.add(u));
        }
        if (res.downloadUrl) pathsSet.add(res.downloadUrl);
        if (res.thumbnailUrl) pathsSet.add(res.thumbnailUrl);
        if (res.thumbnailPath) pathsSet.add(res.thumbnailPath);
        const storagePaths = Array.from(pathsSet).filter(Boolean);

        // 2. Extract uploader fields
        const uploaderUid = res.uploaderId || res.uploaderUid || res.uid || '';
        const uploaderName = res.uploaderName || 'Anonymous';
        const uploaderEmail = res.uploaderEmail || null;
        const uploaderFcmToken = res.uploaderFcmToken || null;

        // 3. Build snapshot
        const resourceSnapshot: any = {
          title: res.title || 'Untitled',
          subject: res.displaySubject || res.subject || '',
          branch: res.branch || '',
          semester: res.semester || '',
          uploaderName,
          uploaderUid,
        };

        if (resourceType === 'videos') {
          resourceSnapshot.youtubeUrl = res.youtubeUrl || undefined;
          resourceSnapshot.thumbnailUrl = res.thumbnailUrl || res.youtubeThumbnailUrl || undefined;
          resourceSnapshot.youtubeResourceType = res.youtubeResourceType || undefined;
        } else {
          resourceSnapshot.fileUrl = res.fileUrl || res.downloadUrl || undefined;
          resourceSnapshot.storagePath = res.storagePath || undefined;
        }

        // 4. Call deleteResource helper
        const result = await deleteResource({
          resourceId: res.id,
          resourceType,
          resourceTitle: res.title || 'Untitled',
          uploaderUid,
          uploaderName,
          uploaderEmail,
          uploaderFcmToken,
          deletedByUid: user.uid,
          deletedByName: user.displayName || 'Admin',
          deletionReason: finalDeletionReason,
          customReason: finalCustomReason,
          storagePaths,
          resourceSnapshot
        });

        if (result.success) {
          succeeded++;
        } else {
          failed++;
          failedList.push({
            title: res.title || 'Untitled',
            error: result.error?.message || 'Deletion failed.'
          });
        }
      } catch (err: any) {
        failed++;
        failedList.push({
          title: res.title || 'Untitled',
          error: err?.message || 'An unexpected error occurred.'
        });
      } finally {
        completed++;
        // Update states reactively
        setCompletedCount(completed);
        setSuccessCount(succeeded);
        setFailureCount(failed);
      }
    });

    await Promise.allSettled(promises);
    setFailedResources(failedList);
    setStatus('completed');
  };

  const handleClose = () => {
    if (status === 'completed') {
      showToast(`Bulk delete operation completed. ${successCount} successful, ${failureCount} failed.`, failureCount > 0 ? 'info' : 'success');
      onSuccess();
    }
    onClose();
  };

  const progressPercent = Math.min(Math.round((completedCount / selectedCount) * 100), 100);

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} className="max-w-md">
      <div className="space-y-4">
        {status === 'idle' && (
          <>
            <DialogHeader className="text-left">
              <div className="flex items-center gap-2 text-red-500 mb-1">
                <AlertTriangle className="h-5 w-5" />
                <DialogTitle className="text-lg font-bold">Delete {selectedCount} {selectedCount === 1 ? 'Resource' : 'Resources'}?</DialogTitle>
              </div>
              <DialogDescription className="text-sm mt-1.5 text-muted-foreground leading-relaxed">
                Select the reason for removing these items. This audit trail is saved securely.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <Select
                label="Reason for Removal"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-background border-border/80 focus:border-red-500"
              >
                <option value="" disabled>Select reason...</option>
                {ADMIN_DELETION_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>

              {reason === 'Other' && (
                <div className="space-y-1.5 font-sans">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Custom Reason
                  </label>
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Describe the reason (min 10 characters)..."
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-ring min-h-[80px] focus:border-red-500"
                  />
                  {customReason.trim().length > 0 && customReason.trim().length < 10 && (
                    <p className="text-xs text-red-500 font-medium font-sans">
                      Custom reason must be at least 10 characters (currently {customReason.trim().length}).
                    </p>
                  )}
                </div>
              )}

              {isLargeDelete && (
                <div className="space-y-1.5 font-sans border-t border-border/60 pt-3 mt-2">
                  <label className="text-xs font-semibold text-red-500 uppercase tracking-wider block">
                    Type DELETE to continue:
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-ring focus:border-red-500 font-bold uppercase tracking-wider"
                  />
                </div>
              )}
            </div>

            <DialogFooter className="mt-4">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={!isValid}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold disabled:opacity-50"
              >
                Delete {selectedCount} {selectedCount === 1 ? 'Resource' : 'Resources'}
              </Button>
            </DialogFooter>
          </>
        )}

        {status === 'deleting' && (
          <div className="py-6 text-center space-y-4 font-sans">
            <Loader2 className="h-10 w-10 text-violet-500 animate-spin mx-auto" />
            <div className="space-y-1">
              <h3 className="text-md font-bold">Deleting {completedCount} of {selectedCount}...</h3>
              <p className="text-xs text-muted-foreground">Please do not close this window or navigate away.</p>
            </div>
            <div className="w-full bg-accent/30 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-violet-600 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {status === 'completed' && (
          <>
            <DialogHeader className="text-left">
              <div className="flex items-center gap-2 text-violet-500 mb-1">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <DialogTitle className="text-lg font-bold">Bulk Deletion Summary</DialogTitle>
              </div>
              <DialogDescription className="text-sm mt-1.5 text-muted-foreground leading-relaxed">
                Bulk deletion operations have finished processing.
              </DialogDescription>
            </DialogHeader>

            <div className="py-2 space-y-3 font-sans text-sm">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-accent/20 rounded-xl p-2.5 border border-border/50">
                  <span className="text-[10px] text-muted-foreground block font-bold uppercase">Selected</span>
                  <span className="text-lg font-extrabold text-foreground mt-0.5 block">{selectedCount}</span>
                </div>
                <div className="bg-emerald-500/10 rounded-xl p-2.5 border border-emerald-500/20">
                  <span className="text-[10px] text-emerald-500 block font-bold uppercase">Succeeded</span>
                  <span className="text-lg font-extrabold text-emerald-500 mt-0.5 block">{successCount}</span>
                </div>
                <div className="bg-red-500/10 rounded-xl p-2.5 border border-red-500/20">
                  <span className="text-[10px] text-red-500 block font-bold uppercase">Failed</span>
                  <span className="text-lg font-extrabold text-red-500 mt-0.5 block">{failureCount}</span>
                </div>
              </div>

              {failedResources.length > 0 && (
                <div className="space-y-1.5 mt-4">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Failed Items:</span>
                  <div className="max-h-36 overflow-y-auto border border-border/80 bg-accent/10 rounded-lg p-2.5 space-y-1.5 text-xs font-medium">
                    {failedResources.map((fail, i) => (
                      <div key={i} className="flex items-start gap-1 text-red-500">
                        <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold">{fail.title}</p>
                          <p className="text-[10px] text-muted-foreground">{fail.error}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="mt-4">
              <Button size="sm" onClick={handleClose} className="bg-violet-600 hover:bg-violet-500 text-white font-bold">
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </div>
    </Dialog>
  );
};
