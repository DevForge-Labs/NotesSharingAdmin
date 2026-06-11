import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Dialog, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CheatsheetsMassUploadDialog } from '@/components/CheatsheetsMassUploadDialog';
import { AdminRemoveDialog } from '@/components/AdminRemoveDialog';
import { BulkDeleteDialog } from '@/components/BulkDeleteDialog';
import { cn } from '@/lib/utils';
import { 
  Search, 
  Eye, 
  Calendar,
  Shield,
  CheckCircle,
  Clock,
  Info,
  RefreshCw,
  FileText,
  File,
  Layers,
  Copy,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  Upload,
  Trash2
} from 'lucide-react';

interface CheatsheetItem {
  id: string;
  documentId?: string;
  title?: string;
  subject?: string;
  displaySubject?: string;
  uploaderName?: string;
  uploaderPhotoUrl?: string;
  branch?: string;
  semester?: string;
  fileSize?: any;
  downloadsCount?: number;
  downloads?: number;
  viewsCount?: number;
  uploadedAt?: any;
  uploadTimestamp?: any;
  fileUrl?: string;
  downloadUrl?: string;
  thumbnailUrl?: string;
  description?: string;
  mimeType?: string;
  fileExtension?: string;
  previewAttachmentType?: string;
  attachmentCount?: number;
  storagePath?: string;
  isVerified?: boolean;
  documentType?: string;
  type?: string;
}

export const Cheatsheets: React.FC = () => {
  const [cheatsheets, setCheatsheets] = useState<CheatsheetItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCheatsheet, setSelectedCheatsheet] = useState<CheatsheetItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState<boolean>(false);
  const [isAdminRemoveOpen, setIsAdminRemoveOpen] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState<boolean>(false);
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  
  // Search and Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'Latest' | 'Downloads' | 'Views'>('Latest');

  // Toast feedback state
  const [toast, setToast] = useState<{ message: string | null; type: 'success' | 'info' | 'error' }>({ message: null, type: 'success' });

  const fetchCheatsheets = async () => {
    setLoading(true);
    setError(null);
    try {
      const querySnapshot = await getDocs(collection(db, 'cheatsheets'));
      
      // Mandatory debug logs for collection query results
      console.log("Cheatsheets snapshot size:", querySnapshot.size);
      console.log("Cheatsheets raw docs:", querySnapshot.docs);
      console.log("Cheatsheets raw data:", querySnapshot.docs.map(d => d.data()));

      const fetched: CheatsheetItem[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as CheatsheetItem;
        
        // Exclude dummy or temp documents
        if (!(data as any).temp && data.title) {
          fetched.push({
            ...data,
            id: data.documentId || doc.id
          });
        }
      });

      console.log("Cheatsheets mapped:", fetched);
      setCheatsheets(fetched);
    } catch (err: any) {
      console.error("Error fetching cheatsheets collection from Firestore:", err);
      setError("Failed to fetch cheatsheets directory from Firestore database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheatsheets();
  }, []);

  const showToast = (
    messageOrOptions: string | { title?: string; description?: string; variant?: string },
    type: 'success' | 'info' | 'error' = 'success'
  ) => {
    if (typeof messageOrOptions === 'object') {
      const msg = `${messageOrOptions.title ? `${messageOrOptions.title}: ` : ''}${messageOrOptions.description || ''}`;
      const t = messageOrOptions.variant === 'destructive' ? 'error' : 'success';
      setToast({ message: msg, type: t });
      setTimeout(() => {
        setToast(prev => prev.message === msg ? { ...prev, message: null } : prev);
      }, 3000);
    } else {
      setToast({ message: messageOrOptions, type });
      setTimeout(() => {
        setToast(prev => prev.message === messageOrOptions ? { ...prev, message: null } : prev);
      }, 3000);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast("URL copied to clipboard!", "success");
    }).catch(err => {
      console.error("Failed to copy URL:", err);
      showToast("Failed to copy URL", "error");
    });
  };

  // Branch mapping initials helper
  const getBranchInitials = (branch?: string): string => {
    if (!branch) return '—';
    const clean = branch.trim().toLowerCase();
    
    if (clean.includes('computer science engineering') || clean === 'cse') return 'CSE';
    if (clean.includes('computer science') || clean === 'cs') return 'CS';
    if (clean.includes('mechanical engineering') || clean === 'me' || clean === 'mechanical') return 'ME';
    if (clean.includes('electrical engineering') || clean === 'ee') return 'EE';
    if (clean.includes('electronics engineering') || clean === 'ece' || clean === 'electronics' || clean.includes('electronics & communication')) return 'ECE';
    if (clean.includes('civil engineering') || clean === 'ce' || clean === 'civil') return 'CE';
    if (clean.includes('information technology') || clean === 'it') return 'IT';

    // Abbreviation fallback
    const words = branch.trim().split(/\s+/).filter(Boolean);
    if (words.length > 1) {
      return words.map(w => w[0].toUpperCase()).join('');
    }
    return branch.substring(0, 3).toUpperCase();
  };

  // Semester value parsing helper
  const getSemesterNumber = (semester?: string): string => {
    if (!semester) return '—';
    const clean = semester.trim();
    const match = clean.match(/\d+/);
    return match ? match[0] : clean;
  };

  // File size formatting helper
  const formatFileSize = (bytes: any) => {
    if (bytes === undefined || bytes === null || bytes === '') return '—';
    const num = Number(bytes);
    if (isNaN(num)) return bytes.toString();
    if (num === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(num) / Math.log(k));
    return parseFloat((num / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Safe Date formatter helper
  const renderDateField = (val: any) => {
    if (!val) return <span className="text-muted-foreground/50 italic text-xs">—</span>;
    try {
      if (typeof val.toDate === 'function') {
        const date = val.toDate();
        return <span>{date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>;
      }
      if (typeof val.seconds === 'number') {
        const date = new Date(val.seconds * 1000);
        return <span>{date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>;
      }
      const date = new Date(val);
      if (!isNaN(date.getTime())) {
        return <span>{date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>;
      }
    } catch (e) {
      console.error("Error formatting date:", e);
    }
    return <span className="text-muted-foreground/50 italic text-xs">—</span>;
  };

  // File icon lookup helper
  const getFileIcon = (mimeType?: string) => {
    const mime = (mimeType || '').toLowerCase();
    if (mime.includes('pdf')) return <FileText className="h-10 w-10 text-rose-500 shrink-0" />;
    if (mime.includes('word') || mime.includes('officedocument')) return <FileText className="h-10 w-10 text-blue-500 shrink-0" />;
    if (mime.includes('zip') || mime.includes('rar')) return <Layers className="h-10 w-10 text-amber-500 shrink-0" />;
    return <File className="h-10 w-10 text-primary/75 shrink-0" />;
  };

  // Search logic filtering
  const filtered = cheatsheets.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    const titleMatch = item.title?.toLowerCase().includes(q) || false;
    const subjectMatch = item.displaySubject?.toLowerCase().includes(q) || item.subject?.toLowerCase().includes(q) || false;
    const uploaderMatch = item.uploaderName?.toLowerCase().includes(q) || false;

    return titleMatch || subjectMatch || uploaderMatch;
  });

  // Timestamp resolver
  const getTimestampMs = (val: any): number => {
    if (!val) return 0;
    if (typeof val.toDate === 'function') return val.toDate().getTime();
    if (typeof val.seconds === 'number') return val.seconds * 1000;
    const parsed = new Date(val).getTime();
    return isNaN(parsed) ? 0 : parsed;
  };

  // Sorting logic
  const sortedCheatsheets = [...filtered].sort((a, b) => {
    if (sortBy === 'Latest') {
      const timeA = getTimestampMs(a.uploadedAt || a.uploadTimestamp);
      const timeB = getTimestampMs(b.uploadedAt || b.uploadTimestamp);
      return timeB - timeA;
    }
    if (sortBy === 'Downloads') {
      const dlA = Number(a.downloadsCount !== undefined ? a.downloadsCount : (a.downloads || 0));
      const dlB = Number(b.downloadsCount !== undefined ? b.downloadsCount : (b.downloads || 0));
      return dlB - dlA;
    }
    if (sortBy === 'Views') {
      const vA = Number(a.viewsCount || 0);
      const vB = Number(b.viewsCount || 0);
      return vB - vA;
    }
    return 0;
  });

  const allSelected = sortedCheatsheets.length > 0 && sortedCheatsheets.every(item => selectedIds.includes(item.id));

  const handleSelectAll = () => {
    if (allSelected) {
      const sortedIds = sortedCheatsheets.map(item => item.id);
      setSelectedIds(prev => prev.filter(id => !sortedIds.includes(id)));
    } else {
      const newIds = new Set([...selectedIds, ...sortedCheatsheets.map(item => item.id)]);
      setSelectedIds(Array.from(newIds));
    }
  };

  const handleOpenDetails = (item: CheatsheetItem) => {
    setSelectedCheatsheet(item);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative">
          <div className="absolute -left-3 top-0.5 bottom-0.5 w-1 bg-gradient-to-b from-violet-500 to-violet-500/10 rounded-full" />
          <h2 className="text-2xl font-bold tracking-tight font-heading pl-3">Cheatsheets Repository Management</h2>
          <p className="text-sm text-muted-foreground pl-3">
            Manage, review, and inspect student-submitted cheatsheets.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => setIsUploadDialogOpen(true)} 
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.18)] hover:shadow-[0_0_25px_rgba(139,92,246,0.28)] transition-all duration-200 border-0"
          >
            <Upload className="h-3.5 w-3.5" /> Upload
          </Button>
          {!isSelectionMode ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsSelectionMode(true)}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.18)] transition-all duration-200 border-0"
            >
              <Trash2 className="h-3.5 w-3.5" /> Bulk Delete
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedIds([]);
                  setIsSelectionMode(false);
                }}
                className="flex items-center gap-1.5 bg-accent text-accent-foreground border border-border"
              >
                Exit Selection ({selectedIds.length} Selected)
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsBulkDeleteOpen(true)}
                disabled={selectedIds.length === 0}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 disabled:bg-red-600/50 text-white shadow-[0_0_20px_rgba(220,38,38,0.18)] transition-all duration-200 border-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete Selected{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={fetchCheatsheets} className="flex items-center gap-1.5 bg-card">
            <RefreshCw className="h-3.5 w-3.5" /> Reload Catalog
          </Button>
        </div>
      </div>

      {/* Search Toolbar */}
      <Card className="border-border bg-card/50 backdrop-blur-sm shadow-premium">
        <CardContent className="p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search cheatsheets by title, subject or instructor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-accent/40 hover:bg-accent/60 border-border/80 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all duration-200"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Sort by:</span>
            <Select
              className="w-36 text-xs bg-background"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="Latest">Latest Upload</option>
              <option value="Downloads">Most Downloaded</option>
              <option value="Views">Most Viewed</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Selection Mode Active Banner */}
      {isSelectionMode && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl text-xs font-semibold animate-fade-in">
          <AlertTriangle className="h-4 w-4 shrink-0 animate-pulse" />
          <span>Selection Mode Active — Select resources to delete.</span>
        </div>
      )}

      {/* Table Container */}
      <Card className="border-border overflow-hidden shadow-premium">
        <CardContent className="p-0">
          {loading ? (
            /* Loading State Skeletons */
            <div className="p-8 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="h-4 w-28 bg-accent/60 rounded animate-pulse" />
                <div className="h-4 w-44 bg-accent/60 rounded animate-pulse" />
                <div className="h-4 w-32 bg-accent/60 rounded animate-pulse" />
                <div className="h-4 w-20 bg-accent/60 rounded animate-pulse" />
              </div>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-border/40 last:border-0">
                  <div className="h-4 w-16 bg-accent/60 rounded animate-pulse" />
                  <div className="h-4 w-60 bg-accent/40 rounded animate-pulse" />
                  <div className="h-4 w-24 bg-accent/40 rounded animate-pulse" />
                  <div className="h-4 w-12 bg-accent/40 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : error ? (
            /* Error State */
            <div className="p-16 text-center flex flex-col items-center justify-center">
              <AlertTriangle className="h-12 w-12 text-destructive mb-3" />
              <h3 className="text-lg font-bold">Query Failure</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchCheatsheets} className="mt-6">
                Retry Query
              </Button>
            </div>
          ) : sortedCheatsheets.length === 0 ? (
            /* Empty State */
            <div className="p-16 text-center flex flex-col items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-accent/40 flex items-center justify-center mb-4">
                <Layers className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold">No Cheatsheets Found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                {cheatsheets.length === 0
                  ? "The cheatsheets collection in Firestore contains no document entries."
                  : "No uploaded cheatsheets match your search parameters."}
              </p>
              {searchQuery && (
                <Button variant="outline" size="sm" onClick={() => setSearchQuery('')} className="mt-6">
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            /* Data Table list */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-accent/50 text-xs font-semibold text-foreground/90 uppercase tracking-wider whitespace-nowrap">
                    {isSelectionMode && (
                      <th className="p-4 w-12 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={handleSelectAll}
                          className="rounded border-input text-violet-600 focus:ring-violet-500 h-4 w-4 cursor-pointer"
                        />
                      </th>
                    )}
                    <th className="p-4 w-16">S.NO.</th>
                    <th className="p-4 w-[30%]">TITLE</th>
                    <th className="p-4">SUBJECT</th>
                    <th className="p-4">UPLOADER</th>
                    <th className="p-4">BRANCH</th>
                    <th className="p-4">SEM</th>
                    <th className="p-4">FILE SIZE</th>
                    <th className="p-4 text-center">DOWNLOADS</th>
                    <th className="p-4 text-center">VIEWS</th>
                    <th className="p-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm whitespace-nowrap">
                  {sortedCheatsheets.map((item, index) => {
                    const isSelected = selectedIds.includes(item.id);
                    return (
                      <tr 
                        key={item.id} 
                        className={cn(
                          "hover:bg-accent/30 cursor-pointer transition-colors",
                          isSelectionMode && isSelected && "bg-violet-500/10 border-violet-500/20 hover:bg-violet-500/15"
                        )}
                        onClick={() => {
                          if (isSelectionMode) {
                            setSelectedIds(prev =>
                              prev.includes(item.id)
                                ? prev.filter(id => id !== item.id)
                                : [...prev, item.id]
                            );
                          } else {
                            handleOpenDetails(item);
                          }
                        }}
                      >
                        {isSelectionMode && (
                          <td className="p-4 w-12 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                setSelectedIds(prev =>
                                  prev.includes(item.id)
                                    ? prev.filter(id => id !== item.id)
                                    : [...prev, item.id]
                                );
                              }}
                              className="rounded border-input text-violet-600 focus:ring-violet-500 h-4 w-4 cursor-pointer"
                            />
                          </td>
                        )}
                        <td className="p-4 font-semibold text-xs text-muted-foreground">
                          {index + 1}
                        </td>
                        <td className="p-4 font-semibold text-foreground/90 max-w-xs truncate" title={item.title}>
                          {item.title || <span className="text-muted-foreground/50 italic font-normal">Untitled</span>}
                        </td>
                        <td className="p-4 text-muted-foreground font-medium">
                          {item.displaySubject || item.subject || <span className="text-muted-foreground/50 italic">—</span>}
                        </td>
                        <td className="p-4 font-medium">
                          {item.uploaderName || <span className="text-muted-foreground/50 italic font-normal">Anonymous</span>}
                        </td>
                        <td className="p-4">
                          {getBranchInitials(item.branch)}
                        </td>
                        <td className="p-4">
                          {getSemesterNumber(item.semester)}
                        </td>
                        <td className="p-4 text-xs font-mono">
                          {formatFileSize(item.fileSize)}
                        </td>
                        <td className="p-4 text-center font-bold">
                          {(item.downloadsCount !== undefined ? item.downloadsCount : (item.downloads || 0)).toLocaleString()}
                        </td>
                        <td className="p-4 text-center font-bold">
                          {(item.viewsCount || 0).toLocaleString()}
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-xs font-semibold flex items-center gap-1.5 text-primary hover:bg-primary/10 ml-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetails(item);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} className="max-w-2xl max-h-[90vh] flex flex-col min-h-0">
        {selectedCheatsheet && (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Sticky Header Section */}
            <DialogHeader className="border-b border-border/80 pb-4 mb-4 text-left shrink-0 pr-8">
              <div className="flex items-start gap-4">
                {/* Category Icon */}
                <div className="p-4 rounded-2xl border shrink-0 bg-blue-500/10 text-blue-500 border-blue-500/20 animate-fade-in">
                  <Layers className="h-8 w-8" />
                </div>

                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 flex-wrap">
                    {selectedCheatsheet.title || <span className="text-muted-foreground/60 italic font-normal">Untitled Cheatsheet</span>}
                    <Badge className="text-[10px] py-0 px-2 uppercase font-extrabold tracking-wide">
                      Cheatsheet
                    </Badge>
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">
                    {selectedCheatsheet.displaySubject || selectedCheatsheet.subject || 'No Subject Area'}
                  </p>

                  {/* Verification Badge */}
                  <div className={`flex items-center gap-1 mt-2 text-xs font-bold px-2.5 py-0.5 rounded-full w-max ${
                    selectedCheatsheet.isVerified
                      ? 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20'
                      : 'text-amber-500 bg-amber-500/10 border border-amber-500/20'
                  }`}>
                    {selectedCheatsheet.isVerified ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    {selectedCheatsheet.isVerified ? 'Verified Resource' : 'Pending Verification'}
                  </div>
                </div>
              </div>
            </DialogHeader>

            {/* Scrollable Dialog Content Body */}
            <div className="flex-1 overflow-y-auto pr-2 py-1 space-y-6 select-text scrollbar-thin">
              {/* Thumbnail / File Icon Preview */}
              <div className="flex justify-center border-b border-border/50 pb-4">
                {selectedCheatsheet.thumbnailUrl ? (
                  <div className="w-full max-w-xs h-32 bg-accent/20 rounded-xl overflow-hidden border border-border flex items-center justify-center shadow-sm">
                    <img src={selectedCheatsheet.thumbnailUrl} alt="Preview thumbnail" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full max-w-xs h-24 bg-accent/15 rounded-xl border border-border flex items-center justify-center gap-3 shadow-inner">
                    {getFileIcon(selectedCheatsheet.mimeType)}
                    <div className="text-left">
                      <span className="text-xs font-bold text-foreground block">Reference File</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{selectedCheatsheet.fileExtension || 'PDF'} format</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Academic Context */}
                <Card className="border-border bg-accent/15 p-4 flex flex-col justify-between space-y-3">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" /> Academic Context
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Subject</span>
                      <span className="font-semibold text-foreground">{selectedCheatsheet.displaySubject || selectedCheatsheet.subject || '—'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Branch</span>
                        <span className="font-semibold text-foreground">{selectedCheatsheet.branch || '—'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Semester</span>
                        <span className="font-semibold text-foreground">{selectedCheatsheet.semester || '—'}</span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* File Details */}
                <Card className="border-border bg-accent/15 p-4 flex flex-col justify-between space-y-3">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <File className="h-3.5 w-3.5" /> File metadata
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">File Size</span>
                        <span className="font-semibold text-foreground">{formatFileSize(selectedCheatsheet.fileSize)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Extension</span>
                        <span className="font-semibold text-foreground uppercase">.{selectedCheatsheet.fileExtension || 'pdf'}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">MIME Type</span>
                      <span className="font-semibold text-foreground font-mono text-[10px]">{selectedCheatsheet.mimeType || '—'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Attachments</span>
                        <span className="font-semibold text-foreground">{selectedCheatsheet.attachmentCount ?? 0} file(s)</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Document Type</span>
                        <span className="font-semibold text-foreground capitalize">{selectedCheatsheet.documentType || selectedCheatsheet.type || '—'}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Stats telemetry */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" /> Performance Stats
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-card border border-border/80 rounded-xl p-3 text-center shadow-sm">
                    <Clock className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
                    <span className="text-[9px] text-muted-foreground block truncate font-medium">Downloads</span>
                    <span className="text-lg font-bold text-foreground mt-0.5 block">
                      {(selectedCheatsheet.downloadsCount !== undefined ? selectedCheatsheet.downloadsCount : (selectedCheatsheet.downloads || 0)).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-card border border-border/80 rounded-xl p-3 text-center shadow-sm">
                    <Eye className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                    <span className="text-[9px] text-muted-foreground block truncate font-medium">Views</span>
                    <span className="text-lg font-bold text-foreground mt-0.5 block">
                      {(selectedCheatsheet.viewsCount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-card border border-border/80 rounded-xl p-3 text-center shadow-sm">
                    <Calendar className="h-4 w-4 text-rose-500 mx-auto mb-1" />
                    <span className="text-[9px] text-muted-foreground block truncate font-medium">Uploaded At</span>
                    <span className="text-xs font-bold text-foreground mt-1.5 block truncate">
                      {renderDateField(selectedCheatsheet.uploadedAt || selectedCheatsheet.uploadTimestamp)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Uploader Card */}
              <Card className="border-border bg-accent/15 p-4 space-y-3">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" /> Uploader Info
                </h4>
                <div className="space-y-1 text-xs">
                  <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Uploaded By</span>
                  <span className="font-semibold text-foreground">{selectedCheatsheet.uploaderName || 'Anonymous'}</span>
                </div>
              </Card>

              {/* Description Card */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Cheatsheet Description
                </h4>
                <p className="text-sm text-foreground/80 leading-relaxed bg-accent/10 p-4 rounded-xl border border-border/80 whitespace-pre-line">
                  {selectedCheatsheet.description || <span className="text-muted-foreground/50 italic">No description provided for this cheatsheet.</span>}
                </p>
              </div>

              {/* Document Operations Card */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" /> Document Operations
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Open File Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs font-bold flex items-center gap-1.5 h-10 bg-card border-border/80 text-foreground hover:bg-accent/20"
                    onClick={() => {
                      if (selectedCheatsheet.fileUrl) {
                        window.open(selectedCheatsheet.fileUrl, '_blank');
                      } else {
                        showToast("No File URL available", "error");
                      }
                    }}
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-primary" /> Open Document
                  </Button>

                  {/* Copy File URL Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs font-bold flex items-center gap-1.5 h-10 bg-card border-border/80 text-foreground hover:bg-accent/20"
                    onClick={() => {
                      if (selectedCheatsheet.fileUrl) {
                        handleCopyText(selectedCheatsheet.fileUrl);
                      } else {
                        showToast("No File URL available", "error");
                      }
                    }}
                  >
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" /> Copy URL
                  </Button>
                </div>
              </div>

              {/* Admin Actions Section */}
              <div className="space-y-2.5 pt-4 border-t border-border/60">
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" /> Administrative Actions
                </h4>
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white h-10 w-full"
                  onClick={() => setIsAdminRemoveOpen(true)}
                >
                  Delete Cheatsheet
                </Button>
              </div>
            </div>

            {/* Sticky Action Footer Section */}
            <DialogFooter className="mt-4 border-t border-border/60 pt-4 shrink-0">
              <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(false)} className="w-full sm:w-auto">
                Close Panel
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>

      {selectedCheatsheet && (
        <AdminRemoveDialog
          isOpen={isAdminRemoveOpen}
          onClose={() => setIsAdminRemoveOpen(false)}
          onSuccess={() => {
            setIsDetailOpen(false);
            fetchCheatsheets();
          }}
          showToast={showToast}
          resource={selectedCheatsheet}
          resourceType="cheatsheets"
        />
      )}

      <BulkDeleteDialog
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onSuccess={() => {
          setSelectedIds([]);
          fetchCheatsheets();
        }}
        showToast={showToast}
        resources={cheatsheets.filter(c => selectedIds.includes(c.id))}
        resourceType="cheatsheets"
      />

      {/* Cheatsheets Mass Upload Dialog */}
      <CheatsheetsMassUploadDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        onUploadSuccess={fetchCheatsheets}
        showToast={showToast}
      />

      {/* Premium Toast Notification */}
      {toast.message && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-foreground text-background dark:bg-card dark:text-foreground px-4 py-3.5 rounded-xl shadow-2xl border border-border/80 animate-fade-in max-w-sm">
          <Sparkles className="h-4 w-4 shrink-0 text-primary animate-pulse" />
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}
    </div>
  );
};
