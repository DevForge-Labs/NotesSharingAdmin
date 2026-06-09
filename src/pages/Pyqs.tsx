import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Dialog, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PyqsMassUploadDialog } from '@/components/PyqsMassUploadDialog';
import { AdminRemoveDialog } from '@/components/AdminRemoveDialog';
import { 
  Search, 
  Eye, 
  Calendar,
  Shield,
  Info,
  RefreshCw,
  FileText,
  File,
  Layers,
  Copy,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  Upload
} from 'lucide-react';

interface PyqItem {
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
  documentType?: string;
  type?: string;
  examType?: string;
  examYear?: string;
  isVerified?: boolean;
}

export const Pyqs: React.FC = () => {
  const [pyqs, setPyqs] = useState<PyqItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPyq, setSelectedPyq] = useState<PyqItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState<boolean>(false);
  const [isAdminRemoveOpen, setIsAdminRemoveOpen] = useState<boolean>(false);
  
  // Search and Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'Latest' | 'Downloads' | 'Views'>('Latest');

  // Toast feedback state
  const [toast, setToast] = useState<{ message: string | null; type: 'success' | 'info' | 'error' }>({ message: null, type: 'success' });

  const fetchPyqs = async () => {
    setLoading(true);
    setError(null);
    try {
      const querySnapshot = await getDocs(collection(db, 'pyqs'));
      
      // Mandatory debug visibility print
      console.log("PYQs snapshot size:", querySnapshot.size);
      console.log("PYQs raw docs:", querySnapshot.docs);
      console.log("PYQs raw data:", querySnapshot.docs.map(d => d.data()));

      const fetched: PyqItem[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as PyqItem;
        
        // Exclude dummy or temp documents
        if (!(data as any).temp) {
          fetched.push({
            ...data,
            id: data.documentId || doc.id
          });
        }
      });

      console.log("PYQs mapped:", fetched);
      setPyqs(fetched);
    } catch (err: any) {
      console.error("Error fetching pyqs collection from Firestore:", err);
      setError("Failed to fetch PYQs directory from Firestore database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPyqs();
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
  const filtered = pyqs.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    const titleMatch = (item.title ?? 'Untitled').toLowerCase().includes(q);
    const subjectMatch = (item.displaySubject || item.subject || '—').toLowerCase().includes(q);
    const uploaderMatch = (item.uploaderName ?? 'Anonymous').toLowerCase().includes(q);
    const examTypeMatch = (item.examType ?? '—').toLowerCase().includes(q);
    const examYearMatch = (item.examYear ?? '—').toLowerCase().includes(q);

    return titleMatch || subjectMatch || uploaderMatch || examTypeMatch || examYearMatch;
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
  const sortedPyqs = [...filtered].sort((a, b) => {
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

  const handleOpenDetails = (item: PyqItem) => {
    setSelectedPyq(item);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative">
          <div className="absolute -left-3 top-0.5 bottom-0.5 w-1 bg-gradient-to-b from-violet-500 to-violet-500/10 rounded-full" />
          <h2 className="text-2xl font-bold tracking-tight font-heading pl-3">PYQs Repository Management</h2>
          <p className="text-sm text-muted-foreground pl-3">
            Manage, review, and inspect student-submitted previous year question papers.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={fetchPyqs} className="flex items-center gap-1.5 bg-card">
            <RefreshCw className="h-3.5 w-3.5" /> Reload Catalog
          </Button>
          <Button variant="default" size="sm" onClick={() => setIsUploadDialogOpen(true)} className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.18)] hover:shadow-[0_0_25px_rgba(139,92,246,0.28)] transition-all duration-200 border-0">
            <Upload className="h-3.5 w-3.5" /> Upload
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
              placeholder="Search PYQs by title, subject, exam, uploader or year..."
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
              <Button variant="outline" size="sm" onClick={fetchPyqs} className="mt-6">
                Retry Query
              </Button>
            </div>
          ) : sortedPyqs.length === 0 ? (
            /* Empty State */
            <div className="p-16 text-center flex flex-col items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-accent/40 flex items-center justify-center mb-4">
                <Layers className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold">No PYQs Found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                {pyqs.length === 0
                  ? "The pyqs collection in Firestore contains no document entries."
                  : "No uploaded PYQs match your search parameters."}
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
                    <th className="p-4 w-16">S.NO.</th>
                    <th className="p-4 w-[25%]">TITLE</th>
                    <th className="p-4">SUBJECT</th>
                    <th className="p-4">EXAM</th>
                    <th className="p-4">YEAR</th>
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
                  {sortedPyqs.map((item, index) => (
                    <tr 
                      key={item.id} 
                      className="hover:bg-accent/30 cursor-pointer transition-colors"
                      onClick={() => handleOpenDetails(item)}
                    >
                      <td className="p-4 font-semibold text-xs text-muted-foreground">
                        {index + 1}
                      </td>
                      <td className="p-4 font-semibold text-foreground/90 max-w-xs truncate" title={item.title}>
                        {item.title || <span className="text-muted-foreground/50 italic font-normal">Untitled</span>}
                      </td>
                      <td className="p-4 text-muted-foreground font-medium">
                        {item.displaySubject || item.subject || <span className="text-muted-foreground/50 italic">—</span>}
                      </td>
                      <td className="p-4 font-semibold text-foreground/80">
                        {item.examType || <span className="text-muted-foreground/50 italic font-normal">—</span>}
                      </td>
                      <td className="p-4 text-muted-foreground font-mono text-xs">
                        {item.examYear || <span className="text-muted-foreground/50 italic">—</span>}
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} className="max-w-2xl max-h-[90vh] flex flex-col min-h-0">
        {selectedPyq && (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Sticky Header Section */}
            <DialogHeader className="border-b border-border/80 pb-4 mb-4 text-left shrink-0 pr-8">
              <div className="flex items-start gap-4">
                {/* Category Icon */}
                <div className="p-4 rounded-2xl border shrink-0 bg-amber-500/10 text-amber-500 border-amber-500/20 animate-fade-in">
                  <Layers className="h-8 w-8" />
                </div>

                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 flex-wrap">
                    {selectedPyq.title || <span className="text-muted-foreground/60 italic font-normal">Untitled PYQ</span>}
                    <Badge className="text-[10px] py-0 px-2 uppercase font-extrabold tracking-wide bg-amber-500/20 text-amber-400 border-amber-500/35">
                      PYQ
                    </Badge>
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">
                    {selectedPyq.displaySubject || selectedPyq.subject || 'No Subject Area'}
                    {selectedPyq.examType && ` • ${selectedPyq.examType}`}
                    {selectedPyq.examYear && ` • ${selectedPyq.examYear}`}
                  </p>
                </div>
              </div>
            </DialogHeader>

            {/* Scrollable Dialog Content Body */}
            <div className="flex-1 overflow-y-auto pr-2 py-1 space-y-6 select-text scrollbar-thin">
              {/* Thumbnail / File Icon Preview */}
              <div className="flex justify-center border-b border-border/50 pb-4">
                {selectedPyq.thumbnailUrl ? (
                  <div className="w-full max-w-xs h-32 bg-accent/20 rounded-xl overflow-hidden border border-border flex items-center justify-center shadow-sm">
                    <img src={selectedPyq.thumbnailUrl} alt="Preview thumbnail" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full max-w-xs h-24 bg-accent/15 rounded-xl border border-border flex items-center justify-center gap-3 shadow-inner">
                    {getFileIcon(selectedPyq.mimeType)}
                    <div className="text-left">
                      <span className="text-xs font-bold text-foreground block">Reference File</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{selectedPyq.fileExtension || 'PDF'} format</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Simplified Metadata Grid - No heavy nested cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-5 gap-x-4 border border-border/80 bg-accent/10 p-5 rounded-xl text-xs">
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Subject</span>
                  <span className="font-semibold text-foreground block mt-0.5">{selectedPyq.displaySubject || selectedPyq.subject || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Exam Type</span>
                  <span className="font-semibold text-foreground block mt-0.5">{selectedPyq.examType || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Exam Year</span>
                  <span className="font-semibold text-foreground block mt-0.5">{selectedPyq.examYear || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Branch</span>
                  <span className="font-semibold text-foreground block mt-0.5">{selectedPyq.branch || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Semester</span>
                  <span className="font-semibold text-foreground block mt-0.5">{selectedPyq.semester || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Uploader</span>
                  <span className="font-semibold text-foreground block mt-0.5">{selectedPyq.uploaderName || 'Anonymous'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">File Size</span>
                  <span className="font-semibold text-foreground block mt-0.5">{formatFileSize(selectedPyq.fileSize)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Downloads</span>
                  <span className="font-semibold text-foreground block mt-0.5">
                    {(selectedPyq.downloadsCount !== undefined ? selectedPyq.downloadsCount : (selectedPyq.downloads || 0)).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Views</span>
                  <span className="font-semibold text-foreground block mt-0.5">
                    {(selectedPyq.viewsCount || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Uploaded Date</span>
                  <span className="font-semibold text-foreground block mt-0.5">
                    {renderDateField(selectedPyq.uploadedAt || selectedPyq.uploadTimestamp)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Document Type</span>
                  <span className="font-semibold text-foreground block mt-0.5 capitalize">{selectedPyq.documentType || selectedPyq.type || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Attachments</span>
                  <span className="font-semibold text-foreground block mt-0.5">{selectedPyq.attachmentCount ?? 0} file(s)</span>
                </div>
                {selectedPyq.fileExtension && (
                  <div>
                    <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">File Extension</span>
                    <span className="font-semibold text-foreground block mt-0.5 uppercase">.{selectedPyq.fileExtension}</span>
                  </div>
                )}
              </div>

              {/* Description Card */}
              {selectedPyq.description && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> PYQ Description
                  </h4>
                  <p className="text-sm text-foreground/80 leading-relaxed bg-accent/10 p-4 rounded-xl border border-border/80 whitespace-pre-line">
                    {selectedPyq.description}
                  </p>
                </div>
              )}

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
                      if (selectedPyq.fileUrl) {
                        window.open(selectedPyq.fileUrl, '_blank');
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
                      if (selectedPyq.fileUrl) {
                        handleCopyText(selectedPyq.fileUrl);
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
                  Delete PYQ
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

      {selectedPyq && (
        <AdminRemoveDialog
          isOpen={isAdminRemoveOpen}
          onClose={() => setIsAdminRemoveOpen(false)}
          onSuccess={() => {
            setIsDetailOpen(false);
            fetchPyqs();
          }}
          showToast={showToast}
          resource={selectedPyq}
          resourceType="pyqs"
        />
      )}

      {/* Pyqs Mass Upload Dialog */}
      <PyqsMassUploadDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        onUploadSuccess={fetchPyqs}
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
