import React, { useState } from 'react';
import { Dialog, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { deleteResource } from '@/lib/deleteResource';
import { ADMIN_DELETION_REASONS } from '@/constants/adminDeletionReasons';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface AdminRemoveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  showToast: (message: any, type?: 'success' | 'info' | 'error') => void;
  resource: any;
  resourceType: 'notes' | 'assignments' | 'pyqs' | 'cheatsheets' | 'videos';
}

const resourceTypeLabels: Record<string, string> = {
  notes: 'Note',
  assignments: 'Assignment',
  pyqs: 'PYQ',
  cheatsheets: 'Cheatsheet',
  videos: 'Video'
};

export const AdminRemoveDialog: React.FC<AdminRemoveDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  showToast,
  resource,
  resourceType
}) => {
  const { user } = useAuth();
  const [reason, setReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  if (!resource) return null;

  const resourceLabel = resourceTypeLabels[resourceType] || 'Resource';
  const isValid = reason && (reason !== 'Other' || customReason.trim().length >= 10);

  const handleDelete = async () => {
    if (!isValid || !user || isDeleting) return;
    setIsDeleting(true);

    // 1. Gather all storage paths/URLs
    const pathsSet = new Set<string>();
    if (resource.storagePath) pathsSet.add(resource.storagePath);
    if (resource.storagePaths && Array.isArray(resource.storagePaths)) {
      resource.storagePaths.forEach((p: string) => p && pathsSet.add(p));
    }
    if (resource.fileUrl) pathsSet.add(resource.fileUrl);
    if (resource.fileUrls && Array.isArray(resource.fileUrls)) {
      resource.fileUrls.forEach((u: string) => u && pathsSet.add(u));
    }
    if (resource.downloadUrl) pathsSet.add(resource.downloadUrl);
    if (resource.thumbnailUrl) pathsSet.add(resource.thumbnailUrl);
    if (resource.thumbnailPath) pathsSet.add(resource.thumbnailPath);
    const storagePaths = Array.from(pathsSet).filter(Boolean);

    // 2. Extract uploader fields
    const uploaderUid = resource.uploaderId || resource.uploaderUid || resource.uid || '';
    const uploaderName = resource.uploaderName || 'Anonymous';
    const uploaderEmail = resource.uploaderEmail || null;
    const uploaderFcmToken = resource.uploaderFcmToken || null;

    // 3. Build snapshot
    const resourceSnapshot = {
      title: resource.title || 'Untitled',
      subject: resource.displaySubject || resource.subject || '',
      branch: resource.branch || '',
      semester: resource.semester || '',
      uploaderName,
      uploaderUid,
      fileUrl: resource.fileUrl || resource.downloadUrl || undefined,
      storagePath: resource.storagePath || undefined
    };

    const result = await deleteResource({
      resourceId: resource.id,
      resourceType,
      resourceTitle: resource.title || 'Untitled',
      uploaderUid,
      uploaderName,
      uploaderEmail,
      uploaderFcmToken,
      deletedByUid: user.uid,
      deletedByName: user.displayName || 'Admin',
      deletionReason: reason,
      customReason: reason === 'Other' ? customReason.trim() : '',
      storagePaths,
      resourceSnapshot
    });

    setIsDeleting(false);

    if (result.success) {
      showToast(`${resourceLabel} removed successfully.`, 'success');
      onSuccess();
      onClose();
      // Reset dialog inputs
      setReason('');
      setCustomReason('');
    } else {
      showToast({
        title: 'Delete Failed',
        description: result.error?.message || 'An unknown error occurred.',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="space-y-4">
        <DialogHeader className="text-left">
          <div className="flex items-center gap-2 text-red-500 mb-1">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle className="text-lg font-bold">Delete {resourceLabel}?</DialogTitle>
          </div>
          <DialogDescription className="text-sm mt-1.5 text-muted-foreground leading-relaxed">
            Select the reason for removal.
            This reason will be stored and may be shown to the uploader through notifications in a future release.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Select
            label="Reason for Removal"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isDeleting}
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
                disabled={isDeleting}
                placeholder="Describe the reason for removing this resource (min 10 characters)..."
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-ring min-h-[80px] focus:border-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {customReason.trim().length > 0 && customReason.trim().length < 10 && (
                <p className="text-xs text-red-500 font-medium font-sans">
                  Custom reason must be at least 10 characters (currently {customReason.trim().length}).
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDelete}
            disabled={!isValid || isDeleting}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Deleting...
              </>
            ) : (
              `Delete ${resourceLabel}`
            )}
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
};
