import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Dialog, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { NotesMassUploadDialog } from '@/components/NotesMassUploadDialog';
import { AdminRemoveDialog } from '@/components/AdminRemoveDialog';
import { BulkDeleteDialog } from '@/components/BulkDeleteDialog';
import { cn } from '@/lib/utils';
import {
  Search,
  Check,
  X,
  Eye,
  Trash2,
  AlertTriangle,
  FolderOpen,
  Copy,
  Download,
  Clock,
  Sparkles,
  Info,
  Calendar,
  HardDrive,
  Briefcase,
  User,
  Shield,
  ExternalLink,
  ChevronDown,
  Layers,
  GraduationCap,
  File,
  FileCode,
  FileText,
  CheckCircle,
  RefreshCw,
  FileDown,
  ThumbsUp,
  Upload
} from 'lucide-react';

interface NoteItem {
  id: string;
  documentId?: string;
  title?: string;
  subject?: string;
  displaySubject?: string;
  documentType?: string;
  type?: string;
  uploaderName?: string;
  uploaderId?: string;
  uploaderUid?: string;
  uid?: string;
  branch?: string;
  semester?: string;
  fileSize?: any;
  downloadsCount?: number;
  viewsCount?: number;
  likesCount?: number;
  upvotes?: number;
  isVerified?: boolean;
  uploadedAt?: any;
  uploadTimestamp?: any;
  fileUrl?: string;
  fileType?: string;
  fileExtension?: string;
  storagePath?: string;
  mimeType?: string;
  thumbnailUrl?: string;
  temp?: boolean;
}


interface ToastState {
  message: string | null;
  type: 'success' | 'info' | 'error';
}

const getBranchInitials = (branch?: string): string => {
  if (!branch) return '—';
  const clean = branch.trim().toLowerCase();
  
  if (clean.includes('computer science engineering') || clean === 'cse') return 'CSE';
  if (clean.includes('computer science') || clean === 'cs') return 'CS';
  if (clean.includes('mechanical engineering') || clean === 'me') return 'ME';
  if (clean.includes('electrical engineering') || clean === 'ee') return 'EE';
  if (clean.includes('electronics engineering') || clean === 'ece' || clean.includes('electronics & communication')) return 'ECE';
  if (clean.includes('civil engineering') || clean === 'ce') return 'CE';
  if (clean.includes('information technology') || clean === 'it') return 'IT';
  
  return branch;
};

const getSemesterNumber = (semester?: string): string => {
  if (!semester) return '—';
  const clean = semester.trim();
  const match = clean.match(/\d+/);
  return match ? match[0] : clean;
};

const getFileIcon = (mimeType?: string) => {
  const mime = (mimeType || '').toLowerCase();
  if (mime.includes('pdf')) return <FileText className="h-10 w-10 text-rose-500 shrink-0" />;
  if (mime.includes('word') || mime.includes('officedocument')) return <FileText className="h-10 w-10 text-blue-500 shrink-0" />;
  if (mime.includes('zip') || mime.includes('rar')) return <Layers className="h-10 w-10 text-amber-500 shrink-0" />;
  return <File className="h-10 w-10 text-primary/75 shrink-0" />;
};

export const Notes: React.FC = () => {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [copiedType, setCopiedType] = useState<'fileUrl' | 'docId' | 'uploaderId' | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState<boolean>(false);
  const [isAdminRemoveOpen, setIsAdminRemoveOpen] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState<boolean>(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Notes' | 'Assignment' | 'PYQ' | 'Cheat Sheet'>('All');
  const [sortBy, setSortBy] = useState<'Latest' | 'Downloads' | 'Views'>('Latest');



  // Toast notifications state
  const [toast, setToast] = useState<ToastState>({ message: null, type: 'success' });

  const fetchNotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const querySnapshot = await getDocs(collection(db, 'notes'));
      const validNotes = querySnapshot.docs
        .map(doc => {
          const data = doc.data() as NoteItem;
          return {
            ...data,
            id: data.documentId || doc.id
          };
        })
        .filter(note =>
          note.title &&
          note.documentId &&
          !note.temp
        );

      console.log("Raw notes snapshot:", querySnapshot.size);
      console.log("Valid notes count:", validNotes.length);

      querySnapshot.docs.forEach(doc => {
        const data = doc.data() as any;

        if (!data.title || !data.documentId || data.temp) {
          console.warn(
            "Excluded invalid note:",
            doc.id,
            data
          );
        }
      });

      setNotes(validNotes);
    } catch (err: any) {
      console.error("Error fetching notes collection from Firestore:", err);
      setError("Failed to fetch notes directory from Firestore database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
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

  const handleCopyText = (text: string, type: 'fileUrl' | 'docId' | 'uploaderId') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedType(type);
      showToast(`${type === 'fileUrl' ? 'File URL' : type === 'docId' ? 'Document ID' : 'Uploader ID'} copied!`, 'success');
      setTimeout(() => setCopiedType(null), 2000);
    }).catch(err => {
      console.error("Clipboard write failure:", err);
      showToast("Copy failed", 'error');
    });
  };



  const handleOpenDetails = (note: NoteItem) => {
    setSelectedNote(note);
    setIsDetailOpen(true);
    setCopiedType(null);
  };

  // Helper formatting size
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

  // Helper formatting date
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

  // Truncate document id helper
  const renderDocumentId = (id: string) => {
    if (!id) return '—';
    const short = id.length > 8 ? `${id.substring(0, 8)}...` : id;
    return (
      <span className="font-mono text-xs text-muted-foreground cursor-help" title={id}>
        {short}
      </span>
    );
  };

  // 1. Search Query Filters
  const filteredNotes = notes.filter((note) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    const titleMatch = note.title?.toLowerCase().includes(q) || false;
    const subjectMatch = note.displaySubject?.toLowerCase().includes(q) || note.subject?.toLowerCase().includes(q) || false;
    const uploaderMatch = note.uploaderName?.toLowerCase().includes(q) || false;
    const idMatch = note.id?.toLowerCase().includes(q) || false;

    return titleMatch || subjectMatch || uploaderMatch || idMatch;
  });

  // 2. Document Type Filters
  const typeFilteredNotes = filteredNotes.filter((note) => {
    if (typeFilter === 'All') return true;

    const rawType = (note.documentType || note.type || '').toString().toLowerCase().trim();
    if (typeFilter === 'Notes') {
      return rawType.includes('note');
    }
    if (typeFilter === 'Assignment') {
      return rawType.includes('assign');
    }
    if (typeFilter === 'PYQ') {
      return rawType.includes('pyq') || rawType.includes('exam') || rawType.includes('paper');
    }
    if (typeFilter === 'Cheat Sheet') {
      return rawType.includes('cheat') || rawType.includes('formula');
    }
    return true;
  });

  // Helper date ms resolution
  const getTimestampMs = (val: any): number => {
    if (!val) return 0;
    if (typeof val.toDate === 'function') return val.toDate().getTime();
    if (typeof val.seconds === 'number') return val.seconds * 1000;
    const parsed = new Date(val).getTime();
    return isNaN(parsed) ? 0 : parsed;
  };

  // 3. Sorting
  const sortedNotes = [...typeFilteredNotes].sort((a, b) => {
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

  const allSelected = sortedNotes.length > 0 && sortedNotes.every(note => selectedIds.includes(note.id));

  const handleSelectAll = () => {
    if (allSelected) {
      const sortedIds = sortedNotes.map(n => n.id);
      setSelectedIds(prev => prev.filter(id => !sortedIds.includes(id)));
    } else {
      const newIds = new Set([...selectedIds, ...sortedNotes.map(n => n.id)]);
      setSelectedIds(Array.from(newIds));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative">
          <div className="absolute -left-3 top-0.5 bottom-0.5 w-1 bg-gradient-to-b from-violet-500 to-violet-500/10 rounded-full" />
          <h2 className="text-2xl font-bold tracking-tight font-heading pl-3">Notes Repository Management</h2>
          <p className="text-sm text-muted-foreground pl-3">
            Audit, verify, and manage student-submitted lecture papers, cheatsheets, and academic documents.
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
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsBulkDeleteOpen(true)}
            disabled={selectedIds.length === 0}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 disabled:bg-red-600/50 text-white shadow-[0_0_20px_rgba(220,38,38,0.18)] transition-all duration-200 border-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete Selected{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchNotes} className="flex items-center gap-1.5 bg-card">
            <RefreshCw className="h-3.5 w-3.5" /> Reload Catalog
          </Button>
        </div>
      </div>

      {/* Search and Filters toolbar */}
      <Card className="border-border bg-card/50 backdrop-blur-sm shadow-premium">
        <CardContent className="p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search directory by title, subject, uploader name, or document ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-accent/40 hover:bg-accent/60 border-border/80 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all duration-200"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-3">
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
          </div>
        </CardContent>
      </Card>

      {/* Table Section */}
      <Card className="border-border overflow-hidden shadow-premium">
        <CardContent className="p-0">
          {loading ? (
            /* Table Loading Skeletons */
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
            /* Query Error State */
            <div className="p-16 text-center flex flex-col items-center justify-center">
              <AlertTriangle className="h-12 w-12 text-destructive mb-3" />
              <h3 className="text-lg font-bold">Query Failure</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchNotes} className="mt-6">
                Retry Query
              </Button>
            </div>
          ) : sortedNotes.length === 0 ? (
            /* Empty State */
            <div className="p-16 text-center flex flex-col items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-accent/40 flex items-center justify-center mb-4">
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold">No Documents Found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                {notes.length === 0
                  ? "The notes collection in Firestore contains no document entries."
                  : "No uploaded documents match your search parameters."}
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
                    <th className="p-4 w-12 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleSelectAll}
                        className="rounded border-input text-violet-600 focus:ring-violet-500 h-4 w-4 cursor-pointer"
                      />
                    </th>
                    <th className="p-4">S.NO</th>
                    <th className="p-4 w-[25%]">Title</th>
                    <th className="p-4">Subject</th>
                    <th className="p-4">Uploader</th>
                    <th className="p-4">Branch</th>
                    <th className="p-4">SEM</th>
                    <th className="p-4">File Size</th>
                    <th className="p-4 text-center">Downloads</th>
                    <th className="p-4 text-center">Views</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm whitespace-nowrap">
                  {sortedNotes.map((note, index) => {
                    const isSelected = selectedIds.includes(note.id);
                    return (
                      <tr 
                        key={note.id} 
                        className={cn(
                          "hover:bg-accent/30 cursor-pointer transition-colors",
                          isSelected && "bg-violet-500/10 border-violet-500/20 hover:bg-violet-500/15"
                        )}
                        onClick={() => handleOpenDetails(note)}
                      >
                        <td className="p-4 w-12 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedIds(prev =>
                                prev.includes(note.id)
                                  ? prev.filter(id => id !== note.id)
                                  : [...prev, note.id]
                              );
                            }}
                            className="rounded border-input text-violet-600 focus:ring-violet-500 h-4 w-4 cursor-pointer"
                          />
                        </td>
                        <td className="p-4 font-semibold text-xs text-muted-foreground">
                          {index + 1}
                        </td>
                        <td className="p-4 font-semibold text-foreground/90 max-w-xs truncate" title={note.title}>
                          {note.title || <span className="text-muted-foreground/50 italic font-normal">Untitled</span>}
                        </td>
                      <td className="p-4 text-muted-foreground font-medium">
                        {note.displaySubject || note.subject || <span className="text-muted-foreground/50 italic">—</span>}
                      </td>
                      <td className="p-4 font-medium">
                        {note.uploaderName || <span className="text-muted-foreground/50 italic font-normal">Anonymous</span>}
                      </td>
                      <td className="p-4">
                        {getBranchInitials(note.branch)}
                      </td>
                      <td className="p-4">
                        {getSemesterNumber(note.semester)}
                      </td>
                      <td className="p-4 text-xs font-mono">
                        {formatFileSize(note.fileSize)}
                      </td>
                      <td className="p-4 text-center font-bold">
                        {(note.downloadsCount !== undefined ? note.downloadsCount : (note.downloads || 0)).toLocaleString()}
                      </td>
                      <td className="p-4 text-center font-bold">
                        {(note.viewsCount || 0).toLocaleString()}
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 text-xs font-semibold flex items-center gap-1.5 text-primary hover:bg-primary/10 ml-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetails(note);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </Button>
                      </td>
                    </tr>
                  );})}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes Details Dialog Modal - Wider max-w-2xl class with height constraints and flex layout */}
      <Dialog isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} className="max-w-2xl max-h-[90vh] flex flex-col min-h-0">
        {selectedNote && (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Sticky Header Section */}
            <DialogHeader className="border-b border-border/80 pb-4 mb-4 text-left shrink-0 pr-8">
              <div className="flex items-start gap-4">
                {/* Category Icon */}
                <div className={`p-4 rounded-2xl border shrink-0 ${
                  (selectedNote.documentType || selectedNote.type || '').toString().toLowerCase().includes('note')
                    ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                    : (selectedNote.documentType || selectedNote.type || '').toString().toLowerCase().includes('assign')
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : (selectedNote.documentType || selectedNote.type || '').toString().toLowerCase().includes('pyq') || (selectedNote.documentType || selectedNote.type || '').toString().toLowerCase().includes('exam')
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                }`}>
                  {(selectedNote.documentType || selectedNote.type || '').toString().toLowerCase().includes('note') ? (
                    <FileText className="h-8 w-8" />
                  ) : (selectedNote.documentType || selectedNote.type || '').toString().toLowerCase().includes('assign') ? (
                    <GraduationCap className="h-8 w-8" />
                  ) : (selectedNote.documentType || selectedNote.type || '').toString().toLowerCase().includes('pyq') || (selectedNote.documentType || selectedNote.type || '').toString().toLowerCase().includes('exam') ? (
                    <Layers className="h-8 w-8" />
                  ) : (
                    <FileCode className="h-8 w-8" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 flex-wrap" title={selectedNote.title}>
                    {selectedNote.title || <span className="text-muted-foreground/60 italic font-normal">Untitled Document</span>}
                    <Badge className="text-[10px] py-0 px-2 uppercase font-extrabold tracking-wide">
                      {selectedNote.documentType || selectedNote.type || 'Document'}
                    </Badge>
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">
                    {selectedNote.displaySubject || selectedNote.subject || 'No Subject Area'}
                  </p>

                  {/* Verification Status Badge */}
                  <div className={`flex items-center gap-1 mt-2 text-xs font-bold px-2.5 py-0.5 rounded-full w-max ${
                    selectedNote.isVerified
                      ? 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20'
                      : 'text-amber-500 bg-amber-500/10 border border-amber-500/20'
                  }`}>
                    {selectedNote.isVerified ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    {selectedNote.isVerified ? 'Verified Document' : 'Pending Verification'}
                  </div>
                </div>
              </div>
            </DialogHeader>

            {/* Scrollable Dialog Content Body */}
            <div className="flex-1 overflow-y-auto pr-2 py-1 space-y-6 select-text scrollbar-thin">
              {/* Thumbnail / File Icon Preview */}
              <div className="flex justify-center border-b border-border/50 pb-4">
                {selectedNote.thumbnailUrl ? (
                  <div 
                    className={`w-full max-w-xs h-32 bg-accent/20 rounded-xl overflow-hidden border border-border flex items-center justify-center shadow-sm relative group ${
                      (selectedNote.fileUrl || (selectedNote as any).downloadUrl) ? 'cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:opacity-90' : ''
                    }`}
                    onClick={() => {
                      const url = selectedNote.fileUrl || (selectedNote as any).downloadUrl;
                      if (url) {
                        window.open(url, "_blank", "noopener,noreferrer");
                      }
                    }}
                    role={(selectedNote.fileUrl || (selectedNote as any).downloadUrl) ? 'button' : undefined}
                    tabIndex={(selectedNote.fileUrl || (selectedNote as any).downloadUrl) ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        const url = selectedNote.fileUrl || (selectedNote as any).downloadUrl;
                        if (url) {
                          e.preventDefault();
                          window.open(url, "_blank", "noopener,noreferrer");
                        }
                      }
                    }}
                  >
                    <img src={selectedNote.thumbnailUrl} alt="Preview thumbnail" className="w-full h-full object-cover group-hover:brightness-110 transition-all duration-200" />
                    {(selectedNote.fileUrl || (selectedNote as any).downloadUrl) && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1.5 text-white font-semibold text-xs rounded-xl">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open Document
                      </div>
                    )}
                  </div>
                ) : (
                  <div 
                    className={`w-full max-w-xs h-24 bg-accent/15 rounded-xl border border-border flex items-center justify-center gap-3 shadow-inner relative group ${
                      (selectedNote.fileUrl || (selectedNote as any).downloadUrl) ? 'cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:opacity-90' : ''
                    }`}
                    onClick={() => {
                      const url = selectedNote.fileUrl || (selectedNote as any).downloadUrl;
                      if (url) {
                        window.open(url, "_blank", "noopener,noreferrer");
                      }
                    }}
                    role={(selectedNote.fileUrl || (selectedNote as any).downloadUrl) ? 'button' : undefined}
                    tabIndex={(selectedNote.fileUrl || (selectedNote as any).downloadUrl) ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        const url = selectedNote.fileUrl || (selectedNote as any).downloadUrl;
                        if (url) {
                          e.preventDefault();
                          window.open(url, "_blank", "noopener,noreferrer");
                        }
                      }
                    }}
                  >
                    {getFileIcon(selectedNote.mimeType)}
                    <div className="text-left">
                      <span className="text-xs font-bold text-foreground block">Reference File</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{selectedNote.fileExtension || 'PDF'} format</span>
                    </div>
                    {(selectedNote.fileUrl || (selectedNote as any).downloadUrl) && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1.5 text-white font-semibold text-xs rounded-xl">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open Document
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* File Information and Academic Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* File Information Card */}
                <Card className="border-border bg-accent/15 p-4 flex flex-col justify-between space-y-3">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <HardDrive className="h-3.5 w-3.5" /> File Information
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">File Type</span>
                      <span className="font-semibold text-foreground uppercase">{selectedNote.fileType || '—'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Extension</span>
                        <span className="font-semibold text-foreground uppercase">.{selectedNote.fileExtension || 'pdf'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">File Size</span>
                        <span className="font-semibold text-foreground">{formatFileSize(selectedNote.fileSize)}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">MIME Type</span>
                      <span className="font-semibold text-foreground font-mono text-[10px]">{selectedNote.mimeType || 'application/pdf'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Storage Path</span>
                      <span className="font-mono text-[9px] text-foreground break-all bg-card/60 p-1.5 rounded border border-border/40 block">
                        {selectedNote.storagePath || '—'}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Academic Context Card */}
                <Card className="border-border bg-accent/15 p-4 flex flex-col justify-between space-y-3">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" /> Academic Context
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Subject</span>
                      <span className="font-semibold text-foreground">{selectedNote.displaySubject || selectedNote.subject || '—'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Branch</span>
                        <span className="font-semibold text-foreground">{selectedNote.branch || '—'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Semester</span>
                        <span className="font-semibold text-foreground">{selectedNote.semester || '—'}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Uploaded Date</span>
                      <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {renderDateField(selectedNote.uploadedAt || selectedNote.uploadTimestamp)}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Performance Metrics Cards */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Performance Metrics
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {/* Downloads */}
                  <div className="bg-card border border-border/80 rounded-xl p-3 text-center shadow-sm">
                    <Download className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
                    <span className="text-[9px] text-muted-foreground block truncate font-medium">Downloads</span>
                    <span className="text-lg font-bold text-foreground mt-0.5 block">
                      {(selectedNote.downloadsCount !== undefined ? selectedNote.downloadsCount : (selectedNote.downloads || 0)).toLocaleString()}
                    </span>
                  </div>

                  {/* Views */}
                  <div className="bg-card border border-border/80 rounded-xl p-3 text-center shadow-sm">
                    <Eye className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                    <span className="text-[9px] text-muted-foreground block truncate font-medium">Views</span>
                    <span className="text-lg font-bold text-foreground mt-0.5 block">
                      {(selectedNote.viewsCount || 0).toLocaleString()}
                    </span>
                  </div>

                  {/* Likes */}
                  <div className="bg-card border border-border/80 rounded-xl p-3 text-center shadow-sm">
                    <ThumbsUp className="h-4 w-4 text-rose-500 mx-auto mb-1" />
                    <span className="text-[9px] text-muted-foreground block truncate font-medium">Likes</span>
                    <span className="text-lg font-bold text-foreground mt-0.5 block">
                      {(selectedNote.upvotes !== undefined ? selectedNote.upvotes : (selectedNote.likesCount || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Uploader Information Card */}
              <Card className="border-border bg-accent/15 p-4 space-y-3">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Uploader Information
                </h4>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Uploader Name</span>
                    <span className="font-semibold text-foreground">{selectedNote.uploaderName || 'Anonymous'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-between bg-card/60 p-1.5 rounded border border-border/40">
                    <div className="min-w-0">
                      <span className="text-muted-foreground block text-[8px] uppercase tracking-wider font-semibold">Uploader ID</span>
                      <span className="font-mono text-[10px] text-foreground block truncate">
                        {selectedNote.uploaderId || selectedNote.uploaderUid || selectedNote.uid || '—'}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
                      onClick={() => handleCopyText(selectedNote.uploaderId || selectedNote.uploaderUid || selectedNote.uid || '', 'uploaderId')}
                      title="Copy Uploader ID"
                    >
                      {copiedType === 'uploaderId' ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Document Operations Card */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" /> Document Operations
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Open File Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs font-bold flex items-center gap-1.5 h-10 bg-card border-border/80 text-foreground hover:bg-accent/20"
                    onClick={() => {
                      if (selectedNote.fileUrl) {
                        window.open(selectedNote.fileUrl, '_blank');
                      } else {
                        showToast("No File URL available", "error");
                      }
                    }}
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-primary" /> Open File
                  </Button>

                  {/* Copy File URL Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs font-bold flex items-center gap-1.5 h-10 bg-card border-border/80 text-foreground hover:bg-accent/20"
                    onClick={() => {
                      if (selectedNote.fileUrl) {
                        handleCopyText(selectedNote.fileUrl, 'fileUrl');
                      } else {
                        showToast("No File URL available", "error");
                      }
                    }}
                  >
                    {copiedType === 'fileUrl' ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    Copy File URL
                  </Button>

                  {/* Copy Document ID Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs font-bold flex items-center gap-1.5 h-10 bg-card border-border/80 text-foreground hover:bg-accent/20"
                    onClick={() => handleCopyText(selectedNote.id, 'docId')}
                  >
                    {copiedType === 'docId' ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    Copy Document ID
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
                  Delete Note
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



      {/* Mass Upload Dialog */}
      <NotesMassUploadDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        onUploadSuccess={fetchNotes}
        showToast={showToast}
      />

      {selectedNote && (
        <AdminRemoveDialog
          isOpen={isAdminRemoveOpen}
          onClose={() => setIsAdminRemoveOpen(false)}
          onSuccess={() => {
            setIsDetailOpen(false);
            fetchNotes();
          }}
          showToast={showToast}
          resource={selectedNote}
          resourceType="notes"
        />
      )}

      <BulkDeleteDialog
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onSuccess={() => {
          setSelectedIds([]);
          fetchNotes();
        }}
        showToast={showToast}
        resources={notes.filter(n => selectedIds.includes(n.id))}
        resourceType="notes"
      />

      {/* Premium Toast/Snackbar Notification */}
      {toast.message && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-foreground text-background dark:bg-card dark:text-foreground px-4 py-3.5 rounded-xl shadow-2xl border border-border/80 animate-fade-in max-w-sm">
          <Sparkles className="h-4 w-4 shrink-0 text-primary animate-pulse" />
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}
    </div>
  );
};
