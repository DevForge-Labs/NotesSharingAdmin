import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Report } from '@/types/report';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { reportService } from '@/services/reportService';
import { deleteResource } from '@/lib/deleteResource';
import { useAuth } from '@/context/AuthContext';
import { Dialog, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  FileText, 
  GraduationCap, 
  Layers, 
  FileCode, 
  Video, 
  Calendar, 
  User, 
  Mail, 
  Fingerprint,
  AlertTriangle,
  Copy,
  Check,
  Search,
  Shield,
  Trash2,
  XCircle,
  Loader2
} from 'lucide-react';

interface ReportDetailsProps {
  report: Report;
  onClose: () => void;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const getBranchInitials = (branch?: string): string => {
  if (!branch) return 'Unknown Branch';
  const clean = branch.trim().toLowerCase();
  
  if (clean.includes('computer science engineering') || clean === 'cse') return 'CSE';
  if (clean.includes('computer science') || clean === 'cs') return 'CS';
  if (clean.includes('mechanical engineering') || clean === 'me') return 'ME';
  if (clean.includes('electrical engineering') || clean === 'ee') return 'EE';
  if (clean.includes('electronics engineering') || clean === 'ece' || clean.includes('electronics & communication')) return 'ECE';
  if (clean.includes('civil engineering') || clean === 'ce') return 'CE';
  if (clean.includes('information technology') || clean === 'it') return 'IT';
  
  // Abbreviation fallback
  const words = branch.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    return words.map(w => w[0].toUpperCase()).join('');
  }
  return branch;
};

const getSemesterNumber = (semester?: string): string => {
  if (!semester) return '';
  const clean = semester.trim();
  const match = clean.match(/\d+/);
  return match ? match[0] : clean;
};

export const ReportDetails: React.FC<ReportDetailsProps> = ({ report, onClose, showToast }) => {
  const navigate = useNavigate();
  const { user: currentAdmin } = useAuth();
  
  const currentAdminUid = currentAdmin?.uid || '';
  const currentAdminName = currentAdmin?.displayName || 'Admin';

  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Confirmation dialogs & loading states
  const [confirmType, setConfirmType] = useState<'delete' | 'dismiss' | null>(null);
  const [isModifying, setIsModifying] = useState<boolean>(false);

  // Centralized academic metadata from original resource
  const [extraMetadata, setExtraMetadata] = useState<any>(null);
  const [loadingMetadata, setLoadingMetadata] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    setLoadingMetadata(true);
    reportService.fetchResourceMetadata(report.resourceType, report.resourceId)
      .then((meta) => {
        if (active) {
          setExtraMetadata(meta);
          setLoadingMetadata(false);
        }
      })
      .catch((err) => {
        console.error("Failed to retrieve resource metadata:", err);
        if (active) {
          setLoadingMetadata(false);
        }
      });
    return () => {
      active = false;
    };
  }, [report.resourceType, report.resourceId]);

  // Copy helper
  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }).catch(err => {
      console.error("Failed to copy text:", err);
    });
  };

  // Safe Date formatter helper
  const formatFullDate = (val: any) => {
    if (!val) return '—';
    try {
      if (typeof val.toDate === 'function') {
        return val.toDate().toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'medium' });
      }
      if (typeof val.seconds === 'number') {
        return new Date(val.seconds * 1000).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'medium' });
      }
      const date = new Date(val);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'medium' });
      }
    } catch (e) {
      console.error("Error formatting date:", e);
    }
    return '—';
  };

  // Navigate to corresponding resource page
  const handleOpenResource = () => {
    const type = (report.resourceType || '').trim().toLowerCase();
    let path = '';
    if (type === 'notes') path = '/notes';
    else if (type === 'assignments') path = '/assignments';
    else if (type === 'pyqs') path = '/pyqs';
    else if (type === 'cheatsheets') path = '/cheatsheets';
    else if (type === 'videos') path = '/videos';
    else path = `/${type}`;

    onClose();
    navigate(`${path}?search=${encodeURIComponent(report.resourceId)}`);
  };

  // Helper formatting resource type labels & styling
  const getResourceConfig = (type?: string) => {
    const t = (type || '').trim().toLowerCase();
    switch (t) {
      case 'notes':
        return {
          label: 'Note',
          icon: <FileText className="h-6 w-6" />,
          colorClass: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
          fallbackClass: 'bg-violet-500/5 text-violet-500'
        };
      case 'assignments':
        return {
          label: 'Assignment',
          icon: <GraduationCap className="h-6 w-6" />,
          colorClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          fallbackClass: 'bg-blue-500/5 text-blue-500'
        };
      case 'pyqs':
        return {
          label: 'PYQ',
          icon: <Layers className="h-6 w-6" />,
          colorClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          fallbackClass: 'bg-emerald-500/5 text-emerald-500'
        };
      case 'cheatsheets':
        return {
          label: 'CheatSheet',
          icon: <FileCode className="h-6 w-6" />,
          colorClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          fallbackClass: 'bg-amber-500/5 text-amber-500'
        };
      case 'videos':
        return {
          label: 'Video',
          icon: <Video className="h-6 w-6" />,
          colorClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          fallbackClass: 'bg-rose-500/5 text-rose-500'
        };
      default:
        return {
          label: type || 'Resource',
          icon: <FileText className="h-6 w-6" />,
          colorClass: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
          fallbackClass: 'bg-zinc-500/5 text-zinc-500'
        };
    }
  };

  // Moderation Handlers
  const handleConfirmDismiss = async () => {
    if (isModifying || !currentAdminUid) return;
    setIsModifying(true);
    try {
      await reportService.dismissReport(report.id, currentAdminUid);
      showToast("Report dismissed successfully.", "success");
      setConfirmType(null);
      onClose();
    } catch (err: any) {
      console.error("Dismiss moderation action failed:", err);
      showToast(err.message || "Failed to dismiss report. Action canceled.", "error");
      setIsModifying(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (isModifying || !currentAdminUid) return;
    setIsModifying(true);
    try {
      // 1. Gather all storage paths/URLs from original doc cached metadata
      const pathsSet = new Set<string>();
      if (extraMetadata) {
        if (extraMetadata.storagePath) pathsSet.add(extraMetadata.storagePath);
        if (extraMetadata.storagePaths && Array.isArray(extraMetadata.storagePaths)) {
          extraMetadata.storagePaths.forEach((p: string) => p && pathsSet.add(p));
        }
        if (extraMetadata.fileUrl) pathsSet.add(extraMetadata.fileUrl);
        if (extraMetadata.fileUrls && Array.isArray(extraMetadata.fileUrls)) {
          extraMetadata.fileUrls.forEach((u: string) => u && pathsSet.add(u));
        }
        if (extraMetadata.downloadUrl) pathsSet.add(extraMetadata.downloadUrl);
        if (extraMetadata.thumbnailUrl) pathsSet.add(extraMetadata.thumbnailUrl);
        if (extraMetadata.thumbnailPath) pathsSet.add(extraMetadata.thumbnailPath);
      }
      const storagePaths = Array.from(pathsSet).filter(Boolean);

      // 2. Extract uploader fields
      const uploaderUid = report.uploaderUid || extraMetadata?.uploaderUid || extraMetadata?.uid || '';
      const uploaderName = report.uploaderName || extraMetadata?.uploaderName || 'Anonymous';
      const uploaderEmail = report.uploaderEmail || extraMetadata?.uploaderEmail || null;
      const uploaderFcmToken = extraMetadata?.uploaderFcmToken || null;

      // 3. Build snapshot
      const resourceSnapshot: any = {
        title: report.resourceTitle || extraMetadata?.title || 'Untitled',
        subject: extraMetadata?.displaySubject || extraMetadata?.subject || '',
        branch: extraMetadata?.branch || '',
        semester: extraMetadata?.semester || '',
        uploaderName,
        uploaderUid,
      };

      if (report.resourceType === 'videos') {
        resourceSnapshot.youtubeUrl = extraMetadata?.youtubeUrl || undefined;
        resourceSnapshot.thumbnailUrl = extraMetadata?.thumbnailUrl || extraMetadata?.youtubeThumbnailUrl || undefined;
        resourceSnapshot.youtubeResourceType = extraMetadata?.youtubeResourceType || undefined;
      } else {
        resourceSnapshot.fileUrl = extraMetadata?.fileUrl || extraMetadata?.downloadUrl || undefined;
        resourceSnapshot.storagePath = extraMetadata?.storagePath || undefined;
      }

      // 4. Call existing deleteResource helper pipeline
      const result = await deleteResource({
        resourceId: report.resourceId,
        resourceType: report.resourceType as any,
        resourceTitle: report.resourceTitle || extraMetadata?.title || 'Untitled',
        uploaderUid,
        uploaderName,
        uploaderEmail,
        uploaderFcmToken,
        deletedByUid: currentAdminUid,
        deletedByName: currentAdminName,
        deletionReason: 'Administrative action (User Report)',
        customReason: `Report reason: ${report.reason}`,
        storagePaths,
        resourceSnapshot
      });

      if (!result.success) {
        throw new Error(result.error?.message || "Failed to delete original resource via deletion pipeline.");
      }

      // 5. Deletion succeeded, now update report document to resolved
      await reportService.resolveReportDeleted(report.id, currentAdminUid);

      showToast("Resource deleted successfully.", "success");
      showToast("Report marked as resolved.", "success");
      setConfirmType(null);
      onClose();
    } catch (err: any) {
      console.error("Delete moderation action failed:", err);
      showToast(err.message || "Failed to complete Delete Resource moderation action.", "error");
      setIsModifying(false);
    }
  };

  const config = getResourceConfig(report.resourceType);
  const resourceTitle = report.resourceTitle || extraMetadata?.title || 'Unknown';
  const resourceThumbnail = report.resourceThumbnail || extraMetadata?.thumbnailUrl;

  return (
    <div className="flex flex-col flex-1 min-h-0 select-text">
      {/* Scrollable Dialog Content Body */}
      <div className="flex-1 overflow-y-auto pr-2 py-1 space-y-6 scrollbar-thin max-h-[70vh]">
        
        {/* SECTION 1: Resource details panel */}
        <div className="bg-accent/30 border border-border/80 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-muted-foreground">Resource</span>
            <Badge className={`text-[10px] py-0.5 px-2.5 font-bold uppercase tracking-wider ${config.colorClass}`}>
              {config.label}
            </Badge>
          </div>

          <div className="flex gap-4 items-start flex-col sm:flex-row">
            {/* Resource Thumbnail / Fallback Icon */}
            <div className="w-20 h-20 rounded-xl overflow-hidden border border-border flex items-center justify-center shrink-0 bg-accent/20">
              {resourceThumbnail ? (
                <img 
                  src={resourceThumbnail} 
                  alt={resourceTitle} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`w-full h-full flex items-center justify-center ${config.fallbackClass}`}>
                  {config.icon}
                </div>
              )}
            </div>

            {/* Title, academic tags & Resource ID */}
            <div className="min-w-0 flex-1 space-y-2">
              <h3 className="font-bold text-base leading-snug text-foreground" title={resourceTitle}>
                {resourceTitle === 'Unknown' ? (
                  <span className="text-muted-foreground/60 italic font-normal">Untitled Resource</span>
                ) : (
                  resourceTitle
                )}
              </h3>

              {/* Branch / Semester / Subject academic metadata */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                {loadingMetadata ? (
                  <div className="h-4 w-32 bg-accent/60 animate-pulse rounded" />
                ) : (
                  <>
                    <span className="text-muted-foreground font-medium">
                      {extraMetadata?.branch ? getBranchInitials(extraMetadata.branch) : 'Not available'}
                      {extraMetadata?.semester ? ` • Semester ${getSemesterNumber(extraMetadata.semester)}` : ''}
                    </span>
                    <span className="text-muted-foreground/40">•</span>
                    <span className="text-primary font-bold">
                      {extraMetadata?.subject || 'Not available'}
                    </span>
                  </>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground pt-1">
                {/* Clickable Resource Inspector Route Button */}
                <Button 
                  onClick={handleOpenResource}
                  variant="outline"
                  className="h-8 px-3 text-xs font-bold bg-violet-600/10 hover:bg-violet-600 hover:text-white border-violet-500/30 hover:border-transparent text-violet-400 transition-all duration-200 flex items-center gap-1.5 shadow-sm"
                >
                  <Search className="h-3.5 w-3.5" /> Open Resource
                </Button>

                <div className="h-3 w-px bg-border hidden sm:block" />

                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <span>ID: {report.resourceId || 'Not available'}</span>
                  {report.resourceId && (
                    <button 
                      onClick={() => handleCopy(report.resourceId, 'resourceId')} 
                      className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-all"
                      title="Copy Resource ID"
                    >
                      {copiedField === 'resourceId' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: User information details grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* UPLOADER PANEL */}
          <div className="border border-border/80 rounded-xl p-4 bg-accent/20 space-y-3">
            <div className="flex items-center gap-2 border-b border-border/40 pb-2">
              <User className="h-4 w-4 text-violet-400" />
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-muted-foreground">Uploaded By</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[10px]">Name</span>
                <span className="font-semibold text-foreground/90">{report.uploaderName || 'Unknown'}</span>
              </div>

              <div className="flex flex-col">
                <span className="text-muted-foreground text-[10px]">Email Address</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate max-w-[180px] font-medium" title={report.uploaderEmail || ''}>
                    {report.uploaderEmail || <span className="italic text-muted-foreground/60 font-normal">Not available</span>}
                  </span>
                  {report.uploaderEmail && (
                    <button 
                      onClick={() => handleCopy(report.uploaderEmail || '', 'uploaderEmail')}
                      className="p-0.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground ml-auto hover:bg-accent"
                    >
                      {copiedField === 'uploaderEmail' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-muted-foreground text-[10px]">User UID</span>
                <div className="flex items-center gap-1.5 mt-0.5 font-mono">
                  <Fingerprint className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate max-w-[150px]">{report.uploaderUid || 'Not available'}</span>
                  {report.uploaderUid && (
                    <button 
                      onClick={() => handleCopy(report.uploaderUid, 'uploaderUid')}
                      className="p-0.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground ml-auto hover:bg-accent"
                    >
                      {copiedField === 'uploaderUid' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* REPORTER PANEL */}
          <div className="border border-border/80 rounded-xl p-4 bg-accent/20 space-y-3">
            <div className="flex items-center gap-2 border-b border-border/40 pb-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-muted-foreground">Reported By</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[10px]">Name</span>
                <span className="font-semibold text-foreground/90">{report.reporterName || 'Unknown'}</span>
              </div>

              <div className="flex flex-col">
                <span className="text-muted-foreground text-[10px]">Email Address</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate max-w-[180px] font-medium" title={report.reporterEmail || ''}>
                    {report.reporterEmail || <span className="italic text-muted-foreground/60 font-normal">Not available</span>}
                  </span>
                  {report.reporterEmail && (
                    <button 
                      onClick={() => handleCopy(report.reporterEmail || '', 'reporterEmail')}
                      className="p-0.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground ml-auto hover:bg-accent"
                    >
                      {copiedField === 'reporterEmail' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-muted-foreground text-[10px]">User UID</span>
                <div className="flex items-center gap-1.5 mt-0.5 font-mono">
                  <Fingerprint className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate max-w-[150px]">{report.reporterUid || 'Not available'}</span>
                  {report.reporterUid && (
                    <button 
                      onClick={() => handleCopy(report.reporterUid, 'reporterUid')}
                      className="p-0.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground ml-auto hover:bg-accent"
                    >
                      {copiedField === 'reporterUid' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* SECTION 3: Report Reason & Custom Message details */}
        <div className="border border-border/85 rounded-xl p-5 bg-red-950/5 border-red-500/10 space-y-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400 animate-pulse" />
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-muted-foreground">Report Information</span>
            </div>
            {/* Status Badge */}
            <Badge variant="warning" className="text-[10px] uppercase font-bold tracking-wider py-0.5 px-2.5 bg-amber-500/10 border-amber-500/20 text-amber-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 bg-amber-400 rounded-full animate-pulse" />
              Pending Review
            </Badge>
          </div>

          <div className="space-y-4">
            {/* Reported Reason (Prominent) */}
            <div className="space-y-1">
              <span className="text-muted-foreground text-[10px]">Reported Reason</span>
              <p className="font-extrabold text-red-400 text-lg leading-tight flex items-center gap-1.5">
                <span>⚠</span>
                {report.reason || 'Unknown'}
              </p>
            </div>

            {/* Reported Time (Smaller emphasis) */}
            <div className="space-y-1">
              <span className="text-muted-foreground text-[10px]">Reported Time</span>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground/80 font-medium">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{formatFullDate(report.createdAt)}</span>
              </div>
            </div>
            
            {/* Additional Message (Always displayed) */}
            <div className="space-y-1.5 pt-3 border-t border-border/30">
              <span className="text-muted-foreground text-[10px]">Additional Comments</span>
              {report.customMessage ? (
                <div className="bg-background/40 border border-border/60 rounded-lg p-3 text-xs italic text-foreground/90 font-medium">
                  "{report.customMessage}"
                </div>
              ) : (
                <div className="text-xs text-muted-foreground/60 italic pl-1 leading-relaxed">
                  —<br />
                  No additional comments were provided.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* FUTURE-READY FOOTER: Moderation Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-between items-center border-t border-border/80 pt-4 mt-6 gap-3">
        {/* Left Side: Close Actions */}
        <Button 
          variant="outline" 
          onClick={onClose} 
          disabled={isModifying}
          className="w-full sm:w-auto h-9 bg-card border-border hover:bg-accent text-xs font-bold"
        >
          Close
        </Button>

        {/* Right Side: Moderation Action Buttons (Active controls) */}
        <div className="flex w-full sm:w-auto gap-2 items-center">
          <Button 
            disabled={isModifying || loadingMetadata}
            variant="outline"
            onClick={() => setConfirmType('dismiss')}
            className="flex-1 sm:flex-initial h-9 text-xs font-bold border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex gap-1.5 items-center"
          >
            <XCircle className="h-3.5 w-3.5" /> Dismiss Report
          </Button>

          <Button 
            disabled={isModifying || loadingMetadata || !extraMetadata}
            variant="destructive"
            onClick={() => setConfirmType('delete')}
            className="flex-1 sm:flex-initial h-9 text-xs font-bold bg-red-600 hover:bg-red-500 text-white disabled:opacity-50 disabled:cursor-not-allowed flex gap-1.5 items-center border-0"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete Resource
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog overlay */}
      <Dialog 
        isOpen={confirmType !== null} 
        onClose={() => !isModifying && setConfirmType(null)} 
        className="max-w-md border border-border bg-card p-6 shadow-2xl rounded-xl"
      >
        {confirmType === 'delete' && (
          <div className="space-y-4">
            <DialogHeader className="text-left">
              <div className="flex items-center gap-2 text-red-500 mb-1">
                <AlertTriangle className="h-5 w-5 animate-pulse" />
                <DialogTitle className="text-lg font-bold">Delete Resource?</DialogTitle>
              </div>
              <DialogDescription className="text-sm mt-1.5 text-muted-foreground leading-relaxed">
                You are about to permanently delete this resource.
                <div className="mt-3 space-y-1 pl-4 text-xs list-disc font-medium text-muted-foreground">
                  <p>• Delete the Firestore document</p>
                  <p>• Delete the uploaded file</p>
                  <p>• Delete the thumbnail</p>
                  <p>• Remove the resource from Algolia</p>
                  <p>• Mark this report as resolved</p>
                </div>
                <p className="mt-3 text-xs font-bold text-red-400">This action cannot be undone.</p>
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setConfirmType(null)} 
                disabled={isModifying}
                className="h-9 text-xs bg-card border-border hover:bg-accent font-semibold"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleConfirmDelete} 
                disabled={isModifying}
                className="h-9 text-xs font-bold bg-red-600 hover:bg-red-500 text-white flex gap-1.5 items-center border-0"
              >
                {isModifying ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Deleting...
                  </>
                ) : (
                  'Delete Resource'
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {confirmType === 'dismiss' && (
          <div className="space-y-4">
            <DialogHeader className="text-left">
              <div className="flex items-center gap-2 text-amber-500 mb-1">
                <XCircle className="h-5 w-5" />
                <DialogTitle className="text-lg font-bold">Dismiss Report?</DialogTitle>
              </div>
              <DialogDescription className="text-sm mt-1.5 text-muted-foreground leading-relaxed">
                The reported resource will remain published.
                <p className="mt-2 font-medium">This report will be marked as resolved and removed from the pending moderation queue.</p>
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setConfirmType(null)} 
                disabled={isModifying}
                className="h-9 text-xs bg-card border-border hover:bg-accent font-semibold"
              >
                Cancel
              </Button>
              <Button 
                variant="outline" 
                onClick={handleConfirmDismiss} 
                disabled={isModifying}
                className="h-9 text-xs font-bold border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex gap-1.5 items-center"
              >
                {isModifying ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Dismissing...
                  </>
                ) : (
                  'Dismiss Report'
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>
    </div>
  );
};
export default ReportDetails;
