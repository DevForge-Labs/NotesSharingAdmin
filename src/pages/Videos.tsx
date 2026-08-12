import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Dialog, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { VideosMassUploadDialog } from '@/components/VideosMassUploadDialog';
import { AdminRemoveDialog } from '@/components/AdminRemoveDialog';
import { BulkDeleteDialog } from '@/components/BulkDeleteDialog';
import { cn } from '@/lib/utils';
import { useResourceDeepLink } from '@/hooks/useResourceDeepLink';
import {
  useAppCatalog,
  formatBranchName,
  formatSemesterName,
  extractSemNumber
} from '@/hooks/useNotesCatalog';
import {
  Search,
  Check,
  Eye,
  Trash2,
  AlertTriangle,
  FolderOpen,
  Copy,
  Clock,
  Sparkles,
  Info,
  Calendar,
  Briefcase,
  User,
  Shield,
  ExternalLink,
  ChevronRight,
  Video,
  CheckCircle,
  RefreshCw,
  Upload,
  BookOpen,
  School,
  GitBranch,
  ThumbsUp,
  RotateCcw
} from 'lucide-react';

interface VideoItem {
  id: string;
  documentId?: string;
  title?: string;
  subject?: string;
  displaySubject?: string;
  uploaderName?: string;
  uploaderPhotoUrl?: string;
  branch?: string;
  semester?: string;
  college?: string;
  channelName?: string;
  playlistTitle?: string;
  youtubeUrl?: string;
  youtubeId?: string;
  youtubePlaylistId?: string;
  youtubeThumbnailUrl?: string;
  thumbnailUrl?: string;
  youtubeResourceType?: string;
  description?: string;
  uploadTimestamp?: any;
  uploadedAt?: any;
  viewsCount?: number;
  downloadsCount?: number;
  likesCount?: number;
  upvotes?: number;
  documentType?: string;
  type?: string;
  temp?: boolean;
}

interface ToastState {
  message: string | null;
  type: 'success' | 'info' | 'error';
}

const getBranchInitials = (branch?: string): string => {
  if (!branch) return '—';
  return formatBranchName(branch);
};

const getSemesterNumber = (semester?: string): string => {
  if (!semester) return '—';
  const num = extractSemNumber(semester);
  return num || semester;
};

const formatResourceType = (type?: string) => {
  if (!type) return 'Video';
  const clean = type.toLowerCase();
  if (clean.includes('playlist')) return 'Playlist';
  if (clean.includes('lecture') || clean.includes('single')) return 'Single Lecture';
  if (clean.includes('one_shot') || clean.includes('oneshot')) return 'One Shot';
  return type;
};

export const Videos: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [copiedType, setCopiedType] = useState<'youtubeUrl' | 'docId' | 'uploaderId' | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState<boolean>(false);
  const [isAdminRemoveOpen, setIsAdminRemoveOpen] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState<boolean>(false);
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);

  // URL state synchronization
  const selectedCollegeParam = searchParams.get('college');
  const selectedBranchParam = searchParams.get('branch');
  const selectedSemesterParam = searchParams.get('semester');
  const searchQueryParam = searchParams.get('search') || '';

  const [searchQuery, setSearchQuery] = useState(searchQueryParam);
  const [sortBy, setSortBy] = useState<'Latest' | 'Downloads' | 'Views'>('Latest');

  // App Catalog hook
  const {
    colleges: catalogColleges,
    getBranches,
    getSemesters,
    getSubjects,
    isLoading: catalogLoading,
    error: catalogError,
    reloadCatalog
  } = useAppCatalog(videos);

  const [toast, setToast] = useState<ToastState>({ message: null, type: 'success' });

  const fetchVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      const querySnapshot = await getDocs(collection(db, 'videos'));
      const fetched: VideoItem[] = [];
      querySnapshot.forEach(docSnap => {
        const data = docSnap.data() as VideoItem;
        if (!data.temp) {
          fetched.push({
            ...data,
            id: data.documentId || docSnap.id
          });
        }
      });
      setVideos(fetched);
    } catch (err: any) {
      console.error('Error fetching videos collection from Firestore:', err);
      setError('Failed to fetch videos directory from Firestore database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
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
        setToast(prev => (prev.message === msg ? { ...prev, message: null } : prev));
      }, 3000);
    } else {
      setToast({ message: messageOrOptions, type });
      setTimeout(() => {
        setToast(prev => (prev.message === messageOrOptions ? { ...prev, message: null } : prev));
      }, 3000);
    }
  };

  const handleCopyText = (text: string, type: 'youtubeUrl' | 'docId' | 'uploaderId') => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopiedType(type);
        showToast(
          `${type === 'youtubeUrl' ? 'YouTube URL' : type === 'docId' ? 'Document ID' : 'Uploader ID'} copied!`,
          'success'
        );
        setTimeout(() => setCopiedType(null), 2000);
      })
      .catch(err => {
        console.error('Clipboard write failure:', err);
        showToast('Copy failed', 'error');
      });
  };

  const handleOpenDetails = (video: VideoItem) => {
    setSelectedVideo(video);
    setIsDetailOpen(true);
    setCopiedType(null);
  };

  useResourceDeepLink(loading, videos, handleOpenDetails);

  const updateSearchQuery = (val: string) => {
    setSearchQuery(val);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (val.trim()) {
        next.set('search', val);
      } else {
        next.delete('search');
      }
      return next;
    }, { replace: true });
  };

  const selectedCollege = useMemo(() => {
    if (!selectedCollegeParam) return null;
    if (selectedCollegeParam === 'all') return 'all';
    const exists = catalogColleges.some(c => c.id.toLowerCase() === selectedCollegeParam.toLowerCase());
    return exists ? selectedCollegeParam.toLowerCase() : 'all';
  }, [selectedCollegeParam, catalogColleges]);

  const availableBranches = useMemo(() => {
    return getBranches(selectedCollege);
  }, [getBranches, selectedCollege]);

  const selectedBranch = useMemo(() => {
    if (selectedCollege === null || !selectedBranchParam) return null;
    if (selectedBranchParam === 'all') return 'all';
    const exists = availableBranches.some(b => b.id.toLowerCase() === selectedBranchParam.toLowerCase());
    return exists ? selectedBranchParam.toLowerCase() : 'all';
  }, [selectedCollege, selectedBranchParam, availableBranches]);

  const availableSemesters = useMemo(() => {
    return getSemesters(selectedCollege, selectedBranch);
  }, [getSemesters, selectedCollege, selectedBranch]);

  const selectedSemester = useMemo(() => {
    if (selectedCollege === null || selectedBranch === null || !selectedSemesterParam) return null;
    if (selectedSemesterParam === 'all') return 'all';
    const num = extractSemNumber(selectedSemesterParam);
    const exists = availableSemesters.some(s => s.id === num || s.id === selectedSemesterParam);
    return exists ? (num || selectedSemesterParam) : 'all';
  }, [selectedCollege, selectedBranch, selectedSemesterParam, availableSemesters]);

  const handleSelectCollege = (colId: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('college', colId);
      next.delete('branch');
      next.delete('semester');
      return next;
    });
  };

  const handleSelectBranch = (branchId: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('branch', branchId);
      next.delete('semester');
      return next;
    });
  };

  const handleSelectSemester = (semId: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('semester', semId);
      return next;
    });
  };

  const handleResetNavigation = () => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('college');
      next.delete('branch');
      next.delete('semester');
      return next;
    });
  };

  const currentStage = useMemo(() => {
    if (selectedCollege === null) return 1;
    if (selectedBranch === null) return 2;
    if (selectedSemester === null) return 3;
    return 4;
  }, [selectedCollege, selectedBranch, selectedSemester]);

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
      console.error('Error formatting date:', e);
    }
    return <span className="text-muted-foreground/50 italic text-xs">—</span>;
  };

  const filteredVideos = useMemo(() => {
    return videos.filter(item => {
      if (selectedCollege && selectedCollege !== 'all') {
        const col = (item.college || '').toLowerCase().trim();
        if (col && col !== selectedCollege) return false;
      }
      if (selectedBranch && selectedBranch !== 'all') {
        const br = getBranchInitials(item.branch).toLowerCase().trim();
        if (br && br !== selectedBranch) return false;
      }
      if (selectedSemester && selectedSemester !== 'all') {
        const sem = getSemesterNumber(item.semester).toLowerCase().trim();
        if (sem && sem !== selectedSemester) return false;
      }
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const titleMatch = item.title?.toLowerCase().includes(q) || false;
        const subjectMatch = item.displaySubject?.toLowerCase().includes(q) || item.subject?.toLowerCase().includes(q) || false;
        const channelMatch = item.channelName?.toLowerCase().includes(q) || false;
        const uploaderMatch = item.uploaderName?.toLowerCase().includes(q) || false;
        const idMatch = item.id?.toLowerCase().includes(q) || false;
        if (!titleMatch && !subjectMatch && !channelMatch && !uploaderMatch && !idMatch) return false;
      }
      return true;
    });
  }, [videos, selectedCollege, selectedBranch, selectedSemester, searchQuery]);

  const getTimestampMs = (val: any): number => {
    if (!val) return 0;
    if (typeof val.toDate === 'function') return val.toDate().getTime();
    if (typeof val.seconds === 'number') return val.seconds * 1000;
    const parsed = new Date(val).getTime();
    return isNaN(parsed) ? 0 : parsed;
  };

  const sortedVideos = useMemo(() => {
    return [...filteredVideos].sort((a, b) => {
      if (sortBy === 'Latest') {
        const timeA = getTimestampMs(a.uploadedAt || a.uploadTimestamp);
        const timeB = getTimestampMs(b.uploadedAt || b.uploadTimestamp);
        return timeB - timeA;
      }
      if (sortBy === 'Downloads') {
        const dlA = Number(a.upvotes !== undefined ? a.upvotes : a.likesCount || 0);
        const dlB = Number(b.upvotes !== undefined ? b.upvotes : b.likesCount || 0);
        return dlB - dlA;
      }
      if (sortBy === 'Views') {
        const vA = Number(a.viewsCount || 0);
        const vB = Number(b.viewsCount || 0);
        return vB - vA;
      }
      return 0;
    });
  }, [filteredVideos, sortBy]);

  const subjectGroups = useMemo(() => {
    if (currentStage !== 4) return [];

    const catalogSubjects = getSubjects(selectedCollege, selectedBranch, selectedSemester);
    const groupsMap = new Map<string, { id: string; name: string; videos: VideoItem[] }>();

    catalogSubjects.forEach(s => {
      groupsMap.set(s.id.toLowerCase(), { id: s.id, name: s.name, videos: [] });
    });

    const uncategorized: VideoItem[] = [];

    sortedVideos.forEach(item => {
      const subKey = (item.subject || item.displaySubject || '').toLowerCase().trim();
      let matchedKey = '';

      if (subKey && groupsMap.has(subKey)) {
        matchedKey = subKey;
      } else if (subKey) {
        for (const [key, grp] of groupsMap.entries()) {
          if (grp.name.toLowerCase() === subKey) {
            matchedKey = key;
            break;
          }
        }
      }

      if (matchedKey) {
        groupsMap.get(matchedKey)!.videos.push(item);
      } else {
        const customSubName = item.displaySubject || item.subject;
        if (customSubName) {
          const customKey = customSubName.toLowerCase().trim();
          if (!groupsMap.has(customKey)) {
            groupsMap.set(customKey, { id: customKey, name: customSubName, videos: [] });
          }
          groupsMap.get(customKey)!.videos.push(item);
        } else {
          uncategorized.push(item);
        }
      }
    });

    const result = Array.from(groupsMap.values()).filter(grp => grp.videos.length > 0);

    if (uncategorized.length > 0) {
      result.push({
        id: 'uncategorized',
        name: 'Other / General Subjects',
        videos: uncategorized
      });
    }

    return result;
  }, [sortedVideos, currentStage, getSubjects, selectedCollege, selectedBranch, selectedSemester]);

  const allSelected = sortedVideos.length > 0 && sortedVideos.every(item => selectedIds.includes(item.id));

  const handleSelectAll = () => {
    if (allSelected) {
      const sortedIds = sortedVideos.map(n => n.id);
      setSelectedIds(prev => prev.filter(id => !sortedIds.includes(id)));
    } else {
      const newIds = new Set([...selectedIds, ...sortedVideos.map(n => n.id)]);
      setSelectedIds(Array.from(newIds));
    }
  };

  const getNoteCountForCollege = (colId: string) => {
    if (colId === 'all') return videos.length;
    return videos.filter(n => (n.college || 'kiit').toLowerCase() === colId.toLowerCase()).length;
  };

  const getNoteCountForBranch = (branchId: string, colId?: string) => {
    const targetCol = colId || selectedCollege;
    if (branchId === 'all') {
      if (!targetCol || targetCol === 'all') return videos.length;
      return videos.filter(n => (n.college || 'kiit').toLowerCase() === targetCol.toLowerCase()).length;
    }
    return videos.filter(n => {
      const colMatch = !targetCol || targetCol === 'all' || (n.college || 'kiit').toLowerCase() === targetCol.toLowerCase();
      const branchMatch = getBranchInitials(n.branch).toLowerCase() === branchId.toLowerCase();
      return colMatch && branchMatch;
    }).length;
  };

  const getNoteCountForSemester = (semId: string) => {
    if (semId === 'all') return filteredVideos.length;
    return videos.filter(n => {
      const colMatch = !selectedCollege || selectedCollege === 'all' || (n.college || 'kiit').toLowerCase() === selectedCollege;
      const branchMatch = !selectedBranch || selectedBranch === 'all' || getBranchInitials(n.branch).toLowerCase() === selectedBranch;
      const semMatch = getSemesterNumber(n.semester) === semId;
      return colMatch && branchMatch && semMatch;
    }).length;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Permanent Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative">
          <div className="absolute -left-3 top-0.5 bottom-0.5 w-1 bg-gradient-to-b from-violet-500 to-violet-500/10 rounded-full" />
          <h2 className="text-2xl font-bold tracking-tight font-heading pl-3">Video Lectures Directory</h2>
          <p className="text-sm text-muted-foreground pl-3">
            Manage, verify, and inspect video lecture links, playlists, and course tutorials.
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchVideos();
              reloadCatalog();
            }}
            className="flex items-center gap-1.5 bg-card"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reload Catalog
          </Button>
        </div>
      </div>

      {/* Breadcrumbs Navigation Bar */}
      <Card className="border-border bg-card/60 backdrop-blur-md shadow-sm">
        <CardContent className="p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground overflow-x-auto">
            <button
              onClick={handleResetNavigation}
              className="flex items-center gap-1 hover:text-foreground transition-colors py-1 px-2 rounded-md hover:bg-accent/40"
            >
              <Video className="h-3.5 w-3.5 text-violet-500" />
              <span>Videos Directory</span>
            </button>

            {selectedCollege !== null && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                <button
                  onClick={() => {
                    setSearchParams(prev => {
                      const next = new URLSearchParams(prev);
                      next.delete('branch');
                      next.delete('semester');
                      return next;
                    });
                  }}
                  className={cn(
                    'py-1 px-2 rounded-md transition-colors flex items-center gap-1',
                    selectedBranch === null
                      ? 'bg-violet-500/15 text-violet-400 font-bold border border-violet-500/30'
                      : 'hover:text-foreground hover:bg-accent/40'
                  )}
                >
                  <School className="h-3 w-3" />
                  <span>
                    College: {selectedCollege === 'all' ? 'All Colleges' : selectedCollege.toUpperCase()}
                  </span>
                </button>
              </>
            )}

            {selectedBranch !== null && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                <button
                  onClick={() => {
                    setSearchParams(prev => {
                      const next = new URLSearchParams(prev);
                      next.delete('semester');
                      return next;
                    });
                  }}
                  className={cn(
                    'py-1 px-2 rounded-md transition-colors flex items-center gap-1',
                    selectedSemester === null
                      ? 'bg-violet-500/15 text-violet-400 font-bold border border-violet-500/30'
                      : 'hover:text-foreground hover:bg-accent/40'
                  )}
                >
                  <GitBranch className="h-3 w-3" />
                  <span>
                    Branch: {selectedBranch === 'all' ? 'All Branches' : formatBranchName(selectedBranch)}
                  </span>
                </button>
              </>
            )}

            {selectedSemester !== null && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                <span className="py-1 px-2 rounded-md bg-violet-500/15 text-violet-400 font-bold border border-violet-500/30 flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  <span>
                    Semester: {selectedSemester === 'all' ? 'All Semesters' : formatSemesterName(selectedSemester)}
                  </span>
                </span>
              </>
            )}
          </div>

          {selectedCollege !== null && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetNavigation}
              className="text-xs text-muted-foreground hover:text-foreground h-7 px-2 flex items-center gap-1 ml-auto"
            >
              <RotateCcw className="h-3 w-3" /> Reset Filter
            </Button>
          )}
        </CardContent>
      </Card>

      {/* STAGE 1: COLLEGE SELECTION GRID */}
      {currentStage === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                <School className="h-5 w-5 text-violet-500" /> Select College
              </h3>
              <p className="text-xs text-muted-foreground">
                Choose an institution from the dynamic App Catalog to view available video lectures.
              </p>
            </div>
            <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1 bg-accent/40">
              {catalogColleges.length} Colleges Available
            </Badge>
          </div>

          {catalogLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-accent/30 rounded-2xl animate-pulse border border-border" />
              ))}
            </div>
          ) : catalogError ? (
            <Card className="border-destructive/30 bg-destructive/5 p-8 text-center">
              <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-2" />
              <h4 className="font-bold text-destructive">Catalog Loading Error</h4>
              <p className="text-xs text-muted-foreground mt-1">{catalogError}</p>
              <Button variant="outline" size="sm" onClick={reloadCatalog} className="mt-4">
                Retry Loading Catalog
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <Card
                onClick={() => handleSelectCollege('all')}
                className="group relative cursor-pointer border-border hover:border-violet-500/60 bg-card/60 hover:bg-violet-500/5 transition-all duration-200 shadow-md hover:shadow-violet-500/10 overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-500 opacity-80" />
                <CardContent className="p-5 flex flex-col justify-between h-36">
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 group-hover:scale-110 transition-transform duration-200">
                      <School className="h-6 w-6" />
                    </div>
                    <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-[10px] font-extrabold uppercase tracking-wide">
                      Show Everything
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground group-hover:text-violet-400 transition-colors text-base flex items-center justify-between">
                      All Colleges
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getNoteCountForCollege('all')} total videos across all institutions
                    </p>
                  </div>
                </CardContent>
              </Card>

              {catalogColleges.map(c => {
                const count = getNoteCountForCollege(c.id);
                return (
                  <Card
                    key={c.id}
                    onClick={() => handleSelectCollege(c.id)}
                    className="group relative cursor-pointer border-border hover:border-violet-500/60 bg-card hover:bg-accent/40 transition-all duration-200 shadow-md hover:shadow-violet-500/10 overflow-hidden"
                  >
                    <CardContent className="p-5 flex flex-col justify-between h-36">
                      <div className="flex items-start justify-between">
                        <div className="p-2.5 rounded-xl bg-accent text-foreground group-hover:bg-violet-500/10 group-hover:text-violet-400 group-hover:scale-110 transition-all duration-200">
                          <Video className="h-6 w-6" />
                        </div>
                        <Badge variant="secondary" className="text-[10px] font-bold">
                          {count} {count === 1 ? 'Video' : 'Videos'}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground group-hover:text-violet-400 transition-colors text-base flex items-center justify-between">
                          {c.name}
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {c.id.toUpperCase()} Engineering Catalog
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* STAGE 2: BRANCH SELECTION GRID */}
      {currentStage === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-violet-500" /> Select Branch
              </h3>
              <p className="text-xs text-muted-foreground">
                Showing branches for{' '}
                <span className="font-bold text-foreground">
                  {selectedCollege === 'all' ? 'All Colleges' : selectedCollege?.toUpperCase()}
                </span>
              </p>
            </div>
            <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1 bg-accent/40">
              {selectedCollege === 'all'
                ? `${catalogColleges.length} Colleges • ${availableBranches.length} Total Branches`
                : `${availableBranches.length} Branches Available`}
            </Badge>
          </div>

          {selectedCollege === 'all' ? (
            <div className="space-y-8">
              <Card
                onClick={() => handleSelectBranch('all')}
                className="group relative cursor-pointer border-violet-500/30 hover:border-violet-500 bg-violet-500/5 hover:bg-violet-500/10 transition-all duration-200 shadow-md hover:shadow-violet-500/15 overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-500 opacity-90" />
                <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-2xl bg-violet-500/20 text-violet-300 group-hover:scale-110 transition-transform duration-200 shrink-0">
                      <GitBranch className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-foreground group-hover:text-violet-300 text-lg">
                          All Branches (Across All Colleges)
                        </h4>
                        <Badge className="bg-violet-500/30 text-violet-200 border-violet-500/40 text-[10px] uppercase tracking-wide">
                          Global Overview
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        View video lectures across all departments in all colleges
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant="secondary" className="text-xs font-bold px-3 py-1 bg-background">
                      {getNoteCountForBranch('all', 'all')} Videos
                    </Badge>
                    <ChevronRight className="h-5 w-5 text-violet-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>

              {catalogColleges.map(collegeItem => {
                const collegeBranches = getBranches(collegeItem.id);
                const colCount = getNoteCountForCollege(collegeItem.id);

                return (
                  <Card key={collegeItem.id} className="border-border bg-card/60 overflow-hidden shadow-premium">
                    <div className="bg-accent/40 px-6 py-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                          <School className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-base text-foreground tracking-tight flex items-center gap-2">
                            {collegeItem.name}
                            <span className="text-xs text-muted-foreground font-mono font-normal">
                              ({collegeItem.id.toUpperCase()})
                            </span>
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            College Department Hierarchy • {collegeBranches.length} Branches Available
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="font-bold text-xs bg-accent text-foreground">
                        {colCount} {colCount === 1 ? 'Video' : 'Videos'}
                      </Badge>
                    </div>

                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <Card
                          onClick={() => {
                            setSearchParams(prev => {
                              const next = new URLSearchParams(prev);
                              next.set('college', collegeItem.id);
                              next.set('branch', 'all');
                              next.delete('semester');
                              return next;
                            });
                          }}
                          className="group relative cursor-pointer border-border hover:border-violet-500/60 bg-card/80 hover:bg-violet-500/5 transition-all duration-200 shadow-sm hover:shadow-violet-500/10 overflow-hidden"
                        >
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-500 opacity-60" />
                          <CardContent className="p-4 flex flex-col justify-between h-32">
                            <div className="flex items-start justify-between">
                              <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 group-hover:scale-110 transition-transform">
                                <GitBranch className="h-5 w-5" />
                              </div>
                              <Badge className="bg-violet-500/20 text-violet-300 text-[9px] uppercase font-bold">
                                All Branches
                              </Badge>
                            </div>
                            <div>
                              <h5 className="font-bold text-foreground group-hover:text-violet-400 transition-colors text-sm flex items-center justify-between">
                                All {collegeItem.name} Branches
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                              </h5>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {colCount} videos in {collegeItem.name}
                              </p>
                            </div>
                          </CardContent>
                        </Card>

                        {collegeBranches.map(b => {
                          const count = getNoteCountForBranch(b.id, collegeItem.id);
                          return (
                            <Card
                              key={b.id}
                              onClick={() => {
                                setSearchParams(prev => {
                                  const next = new URLSearchParams(prev);
                                  next.set('college', collegeItem.id);
                                  next.set('branch', b.id);
                                  next.delete('semester');
                                  return next;
                                });
                              }}
                              className="group relative cursor-pointer border-border hover:border-violet-500/60 bg-card hover:bg-accent/40 transition-all duration-200 shadow-sm hover:shadow-violet-500/10 overflow-hidden"
                            >
                              <CardContent className="p-4 flex flex-col justify-between h-32">
                                <div className="flex items-start justify-between">
                                  <div className="p-2 rounded-xl bg-accent text-foreground group-hover:bg-violet-500/10 group-hover:text-violet-400 group-hover:scale-110 transition-all font-bold font-mono text-xs">
                                    {b.name}
                                  </div>
                                  <Badge variant="secondary" className="text-[10px] font-bold">
                                    {count} {count === 1 ? 'Video' : 'Videos'}
                                  </Badge>
                                </div>
                                <div>
                                  <h5 className="font-bold text-foreground group-hover:text-violet-400 transition-colors text-sm flex items-center justify-between">
                                    {b.name}
                                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                  </h5>
                                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                    Department Curriculum
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <Card
                onClick={() => handleSelectBranch('all')}
                className="group relative cursor-pointer border-border hover:border-violet-500/60 bg-card/60 hover:bg-violet-500/5 transition-all duration-200 shadow-md hover:shadow-violet-500/10 overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-500 opacity-80" />
                <CardContent className="p-5 flex flex-col justify-between h-36">
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 group-hover:scale-110 transition-transform duration-200">
                      <GitBranch className="h-6 w-6" />
                    </div>
                    <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-[10px] font-extrabold uppercase tracking-wide">
                      All Branches
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground group-hover:text-violet-400 transition-colors text-base flex items-center justify-between">
                      All Branches
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getNoteCountForBranch('all')} videos across all departments
                    </p>
                  </div>
                </CardContent>
              </Card>

              {availableBranches.map(b => {
                const count = getNoteCountForBranch(b.id);
                return (
                  <Card
                    key={b.id}
                    onClick={() => handleSelectBranch(b.id)}
                    className="group relative cursor-pointer border-border hover:border-violet-500/60 bg-card hover:bg-accent/40 transition-all duration-200 shadow-md hover:shadow-violet-500/10 overflow-hidden"
                  >
                    <CardContent className="p-5 flex flex-col justify-between h-36">
                      <div className="flex items-start justify-between">
                        <div className="p-2.5 rounded-xl bg-accent text-foreground group-hover:bg-violet-500/10 group-hover:text-violet-400 group-hover:scale-110 transition-all duration-200 font-bold font-mono text-sm">
                          {b.name}
                        </div>
                        <Badge variant="secondary" className="text-[10px] font-bold">
                          {count} {count === 1 ? 'Video' : 'Videos'}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground group-hover:text-violet-400 transition-colors text-base flex items-center justify-between">
                          {b.name}
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">Department Curriculum</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* STAGE 3: SEMESTER SELECTION GRID */}
      {currentStage === 3 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-violet-500" /> Select Semester
              </h3>
              <p className="text-xs text-muted-foreground">
                Showing semesters for{' '}
                <span className="font-bold text-foreground">
                  {selectedCollege === 'all' ? 'All Colleges' : selectedCollege?.toUpperCase()} →{' '}
                  {selectedBranch === 'all' ? 'All Branches' : formatBranchName(selectedBranch || '')}
                </span>
              </p>
            </div>
            <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1 bg-accent/40">
              {availableSemesters.length} Semesters Available
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Card
              onClick={() => handleSelectSemester('all')}
              className="group relative cursor-pointer border-border hover:border-violet-500/60 bg-card/60 hover:bg-violet-500/5 transition-all duration-200 shadow-md hover:shadow-violet-500/10 overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-500 opacity-80" />
              <CardContent className="p-5 flex flex-col justify-between h-36">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 group-hover:scale-110 transition-transform duration-200">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-[10px] font-extrabold uppercase tracking-wide">
                    All Semesters
                  </Badge>
                </div>
                <div>
                  <h4 className="font-bold text-foreground group-hover:text-violet-400 transition-colors text-base flex items-center justify-between">
                    All Semesters
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {getNoteCountForSemester('all')} total videos in branch
                  </p>
                </div>
              </CardContent>
            </Card>

            {availableSemesters.map(s => {
              const count = getNoteCountForSemester(s.id);
              return (
                <Card
                  key={s.id}
                  onClick={() => handleSelectSemester(s.id)}
                  className="group relative cursor-pointer border-border hover:border-violet-500/60 bg-card hover:bg-accent/40 transition-all duration-200 shadow-md hover:shadow-violet-500/10 overflow-hidden"
                >
                  <CardContent className="p-5 flex flex-col justify-between h-36">
                    <div className="flex items-start justify-between">
                      <div className="p-2.5 rounded-xl bg-accent text-foreground group-hover:bg-violet-500/10 group-hover:text-violet-400 group-hover:scale-110 transition-all duration-200 font-bold font-mono text-sm">
                        SEM {s.id}
                      </div>
                      <Badge variant="secondary" className="text-[10px] font-bold">
                        {count} {count === 1 ? 'Video' : 'Videos'}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground group-hover:text-violet-400 transition-colors text-base flex items-center justify-between">
                        {s.name}
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">Academic Term</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* STAGE 4: VIDEOS DISPLAY GROUPED BY SUBJECT */}
      {currentStage === 4 && (
        <div className="space-y-6">
          <Card className="border-border bg-card/50 backdrop-blur-sm shadow-premium">
            <CardContent className="p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search videos by title, subject, channel name, uploader, or document ID..."
                  value={searchQuery}
                  onChange={e => updateSearchQuery(e.target.value)}
                  className="pl-9 bg-accent/40 hover:bg-accent/60 border-border/80 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all duration-200"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Sort by:</span>
                  <Select
                    className="w-36 text-xs bg-background"
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as any)}
                  >
                    <option value="Latest">Latest Upload</option>
                    <option value="Downloads">Most Liked</option>
                    <option value="Views">Most Viewed</option>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {isSelectionMode && (
            <div className="flex items-center gap-2 px-4 py-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl text-xs font-semibold animate-fade-in">
              <AlertTriangle className="h-4 w-4 shrink-0 animate-pulse" />
              <span>Selection Mode Active — Select videos to delete.</span>
            </div>
          )}

          {loading ? (
            <Card className="border-border overflow-hidden shadow-premium">
              <CardContent className="p-8 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="h-4 w-28 bg-accent/60 rounded animate-pulse" />
                  <div className="h-4 w-44 bg-accent/60 rounded animate-pulse" />
                </div>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-border/40">
                    <div className="h-4 w-16 bg-accent/60 rounded animate-pulse" />
                    <div className="h-4 w-60 bg-accent/40 rounded animate-pulse" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="border-border overflow-hidden shadow-premium">
              <CardContent className="p-16 text-center flex flex-col items-center justify-center">
                <AlertTriangle className="h-12 w-12 text-destructive mb-3" />
                <h3 className="text-lg font-bold">Query Failure</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-1">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchVideos} className="mt-6">
                  Retry Query
                </Button>
              </CardContent>
            </Card>
          ) : sortedVideos.length === 0 ? (
            <Card className="border-border overflow-hidden shadow-premium">
              <CardContent className="p-16 text-center flex flex-col items-center justify-center">
                <div className="h-16 w-16 rounded-full bg-accent/40 flex items-center justify-center mb-4">
                  <FolderOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold">No Documents Found</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-1">
                  {searchQuery
                    ? 'No uploaded video lectures match your search parameters in this selection.'
                    : 'No video documents are currently available for this selection.'}
                </p>
                {searchQuery ? (
                  <Button variant="outline" size="sm" onClick={() => updateSearchQuery('')} className="mt-6">
                    Clear Search
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleResetNavigation} className="mt-6">
                    Back to Colleges
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {subjectGroups.map(group => (
                <Card key={group.id} className="border-border overflow-hidden shadow-premium bg-card/60">
                  <div className="bg-accent/40 px-6 py-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-foreground tracking-tight">{group.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          Subject Group • {group.videos.length} {group.videos.length === 1 ? 'Video' : 'Videos'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="font-semibold text-xs bg-accent text-foreground">
                      {group.videos.length} Videos
                    </Badge>
                  </div>

                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border bg-accent/20 text-xs font-semibold text-foreground/90 uppercase tracking-wider whitespace-nowrap">
                            {isSelectionMode && (
                              <th className="p-4 w-12 text-center" onClick={e => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={allSelected}
                                  onChange={handleSelectAll}
                                  className="rounded border-input text-violet-600 focus:ring-violet-500 h-4 w-4 cursor-pointer"
                                />
                              </th>
                            )}
                            <th className="p-4">S.NO</th>
                            <th className="p-4 w-[25%]">Title</th>
                            <th className="p-4">Subject</th>
                            <th className="p-4">Channel</th>
                            <th className="p-4">Type</th>
                            <th className="p-4">Uploader</th>
                            <th className="p-4">Branch</th>
                            <th className="p-4">SEM</th>
                            <th className="p-4 text-center">Likes</th>
                            <th className="p-4 text-center">Views</th>
                            <th className="p-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border text-sm whitespace-nowrap">
                          {group.videos.map((item, index) => {
                            const isSelected = selectedIds.includes(item.id);
                            return (
                              <tr
                                key={item.id}
                                className={cn(
                                  'hover:bg-accent/30 cursor-pointer transition-colors',
                                  isSelectionMode && isSelected && 'bg-violet-500/10 border-violet-500/20 hover:bg-violet-500/15'
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
                                  <td className="p-4 w-12 text-center" onClick={e => e.stopPropagation()}>
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
                                <td className="p-4 font-semibold text-xs text-muted-foreground">{index + 1}</td>
                                <td className="p-4 font-semibold text-foreground/90 max-w-xs truncate" title={item.title}>
                                  {item.title || <span className="text-muted-foreground/50 italic font-normal">Untitled</span>}
                                </td>
                                <td className="p-4 text-muted-foreground font-medium">
                                  {item.displaySubject || item.subject || <span className="text-muted-foreground/50 italic">—</span>}
                                </td>
                                <td className="p-4 text-muted-foreground font-medium">
                                  {item.channelName || <span className="text-muted-foreground/50 italic font-normal">—</span>}
                                </td>
                                <td className="p-4">
                                  <Badge variant="secondary" className="font-semibold text-[10px]">
                                    {formatResourceType(item.youtubeResourceType)}
                                  </Badge>
                                </td>
                                <td className="p-4 font-medium">
                                  {item.uploaderName || <span className="text-muted-foreground/50 italic font-normal">Anonymous</span>}
                                </td>
                                <td className="p-4">{getBranchInitials(item.branch)}</td>
                                <td className="p-4">{getSemesterNumber(item.semester)}</td>
                                <td className="p-4 text-center font-bold">
                                  {(item.upvotes !== undefined ? item.upvotes : item.likesCount || 0).toLocaleString()}
                                </td>
                                <td className="p-4 text-center font-bold">{(item.viewsCount || 0).toLocaleString()}</td>
                                <td className="p-4 text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-3 text-xs font-semibold flex items-center gap-1.5 text-primary hover:bg-primary/10 ml-auto"
                                    onClick={e => {
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Video Details Dialog Modal */}
      <Dialog isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} className="max-w-2xl max-h-[90vh] flex flex-col min-h-0">
        {selectedVideo && (
          <div className="flex flex-col flex-1 min-h-0">
            <DialogHeader className="border-b border-border/80 pb-4 mb-4 text-left shrink-0 pr-8">
              <div className="flex items-start gap-4">
                <div className="p-4 rounded-2xl border shrink-0 bg-rose-500/10 text-rose-500 border-rose-500/20">
                  <Video className="h-8 w-8" />
                </div>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 flex-wrap" title={selectedVideo.title}>
                    {selectedVideo.title || <span className="text-muted-foreground/60 italic font-normal">Untitled Video</span>}
                    <Badge className="text-[10px] py-0 px-2 uppercase font-extrabold tracking-wide">
                      {formatResourceType(selectedVideo.youtubeResourceType)}
                    </Badge>
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">
                    {selectedVideo.displaySubject || selectedVideo.subject || 'No Subject Area'}
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto pr-2 py-1 space-y-6 select-text scrollbar-thin">
              <div className="flex justify-center border-b border-border/50 pb-4">
                {selectedVideo.thumbnailUrl || selectedVideo.youtubeThumbnailUrl ? (
                  <div
                    className="w-full max-w-md h-48 bg-accent/20 rounded-xl overflow-hidden border border-border flex items-center justify-center shadow-sm relative group cursor-pointer"
                    onClick={() => {
                      if (selectedVideo.youtubeUrl) window.open(selectedVideo.youtubeUrl, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    <img
                      src={selectedVideo.thumbnailUrl || selectedVideo.youtubeThumbnailUrl}
                      alt="Video thumbnail"
                      className="w-full h-full object-cover group-hover:brightness-110 transition-all duration-200"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1.5 text-white font-semibold text-xs rounded-xl">
                      <ExternalLink className="h-4 w-4" />
                      Watch Video on YouTube
                    </div>
                  </div>
                ) : (
                  <div
                    className="w-full max-w-md h-28 bg-accent/15 rounded-xl border border-border flex items-center justify-center gap-3 shadow-inner relative group cursor-pointer"
                    onClick={() => {
                      if (selectedVideo.youtubeUrl) window.open(selectedVideo.youtubeUrl, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    <Video className="h-10 w-10 text-rose-500 shrink-0" />
                    <div className="text-left">
                      <span className="text-xs font-bold text-foreground block">{selectedVideo.channelName || 'YouTube Video'}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{formatResourceType(selectedVideo.youtubeResourceType)}</span>
                    </div>
                    {selectedVideo.youtubeUrl && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1.5 text-white font-semibold text-xs rounded-xl">
                        <ExternalLink className="h-4 w-4" />
                        Watch Video
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-border bg-accent/15 p-4 flex flex-col justify-between space-y-3">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Video className="h-3.5 w-3.5" /> Channel Information
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Channel</span>
                      <span className="font-semibold text-foreground">{selectedVideo.channelName || '—'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Resource Type</span>
                      <span className="font-semibold text-foreground uppercase">{formatResourceType(selectedVideo.youtubeResourceType)}</span>
                    </div>
                  </div>
                </Card>

                <Card className="border-border bg-accent/15 p-4 flex flex-col justify-between space-y-3">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" /> Academic Context
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Subject</span>
                      <span className="font-semibold text-foreground">{selectedVideo.displaySubject || selectedVideo.subject || '—'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Branch</span>
                        <span className="font-semibold text-foreground">{selectedVideo.branch || '—'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Semester</span>
                        <span className="font-semibold text-foreground">{selectedVideo.semester || '—'}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Performance Metrics
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-card border border-border/80 rounded-xl p-3 text-center shadow-sm">
                    <ThumbsUp className="h-4 w-4 text-rose-500 mx-auto mb-1" />
                    <span className="text-[9px] text-muted-foreground block truncate font-medium">Likes</span>
                    <span className="text-lg font-bold text-foreground mt-0.5 block">
                      {(selectedVideo.upvotes !== undefined ? selectedVideo.upvotes : selectedVideo.likesCount || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-card border border-border/80 rounded-xl p-3 text-center shadow-sm">
                    <Eye className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                    <span className="text-[9px] text-muted-foreground block truncate font-medium">Views</span>
                    <span className="text-lg font-bold text-foreground mt-0.5 block">
                      {(selectedVideo.viewsCount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <Card className="border-border bg-accent/15 p-4 space-y-3">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Uploader Information
                </h4>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Uploader Name</span>
                    <span className="font-semibold text-foreground">{selectedVideo.uploaderName || 'Anonymous'}</span>
                  </div>
                </div>
              </Card>

              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" /> Operations
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs font-bold flex items-center gap-1.5 h-10 bg-card border-border/80 text-foreground hover:bg-accent/20"
                    onClick={() => {
                      if (selectedVideo.youtubeUrl) window.open(selectedVideo.youtubeUrl, '_blank');
                      else showToast('No YouTube URL available', 'error');
                    }}
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-primary" /> Watch Video
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs font-bold flex items-center gap-1.5 h-10 bg-card border-border/80 text-foreground hover:bg-accent/20"
                    onClick={() => {
                      if (selectedVideo.youtubeUrl) handleCopyText(selectedVideo.youtubeUrl, 'youtubeUrl');
                      else showToast('No YouTube URL available', 'error');
                    }}
                  >
                    {copiedType === 'youtubeUrl' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                    Copy Link
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs font-bold flex items-center gap-1.5 h-10 bg-card border-border/80 text-foreground hover:bg-accent/20"
                    onClick={() => handleCopyText(selectedVideo.id, 'docId')}
                  >
                    {copiedType === 'docId' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                    Copy Document ID
                  </Button>
                </div>
              </div>

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
                  Delete Video
                </Button>
              </div>
            </div>

            <DialogFooter className="mt-4 border-t border-border/60 pt-4 shrink-0">
              <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(false)} className="w-full sm:w-auto">
                Close Panel
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>

      {/* Dialog Modals */}
      <VideosMassUploadDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        onUploadSuccess={() => {
          fetchVideos();
          reloadCatalog();
        }}
        showToast={showToast}
      />

      {selectedVideo && (
        <AdminRemoveDialog
          isOpen={isAdminRemoveOpen}
          onClose={() => setIsAdminRemoveOpen(false)}
          onSuccess={() => {
            setIsDetailOpen(false);
            fetchVideos();
          }}
          showToast={showToast}
          resource={selectedVideo}
          resourceType="videos"
        />
      )}

      <BulkDeleteDialog
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onSuccess={() => {
          setSelectedIds([]);
          fetchVideos();
        }}
        showToast={showToast}
        resources={videos.filter(n => selectedIds.includes(n.id))}
        resourceType="videos"
      />

      {/* Toast Notification */}
      {toast.message && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-foreground text-background dark:bg-card dark:text-foreground px-4 py-3.5 rounded-xl shadow-2xl border border-border/80 animate-fade-in max-w-sm">
          <Sparkles className="h-4 w-4 shrink-0 text-primary animate-pulse" />
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}
    </div>
  );
};
