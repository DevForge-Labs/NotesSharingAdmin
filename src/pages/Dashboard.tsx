import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { isValidNoteDocument } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users as UsersIcon, 
  Upload,
  FileText,
  Layers,
  GraduationCap,
  FileCode,
  Youtube,
  ArrowRight, 
  RefreshCw, 
  AlertTriangle,
  Sparkles,
  Eye,
  ThumbsUp,
  Bookmark,
  CheckCircle,
  XCircle,
  Download,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NoteItem {
  id: string;
  documentId?: string;
  title?: string;
  subject?: string;
  displaySubject?: string;
  documentType?: string;
  type?: string;
  uploaderName?: string;
  uploadedAt?: any;
  uploadTimestamp?: any;
  downloads?: number;
  downloadsCount?: number;
  viewsCount?: number;
  likesCount?: number;
  upvotes?: number;
  bookmarks?: any;
  fileSize?: number;
  semester?: string;
  branch?: string;
  isVerified?: boolean;
}

interface DashboardStats {
  totalUsers: number;
  totalNotes: number;
  totalDownloads: number;
  totalViews: number;
  totalLikes: number;
  totalBookmarks: number;
  notesCount: number;
  assignmentsCount: number;
  pyqsCount: number;
  cheatsheetsCount: number;
  videosCount: number;
  verifiedCount: number;
  unverifiedCount: number;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentUploads, setRecentUploads] = useState<NoteItem[]>([]);
  const [mostDownloaded, setMostDownloaded] = useState<NoteItem[]>([]);
  const [mostViewed, setMostViewed] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAndAggregateStats = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch all collections in parallel
      const [
        usersSnapshot,
        notesSnapshot,
        assignmentsSnapshot,
        pyqsSnapshot,
        cheatsheetsSnapshot,
        videosSnapshot
      ] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'notes')),
        getDocs(collection(db, 'assignments')),
        getDocs(collection(db, 'pyqs')),
        getDocs(collection(db, 'cheatsheets')),
        getDocs(collection(db, 'videos'))
      ]);

      const totalUsersCount = usersSnapshot.size;
      const notesList: NoteItem[] = [];

      let downloadsSum = 0;
      let viewsSum = 0;
      let likesSum = 0;
      let bookmarksSum = 0;

      // Loop over Notes collection to compute telemetry sums and Notes list
      notesSnapshot.forEach((doc) => {
        const data = doc.data() as Omit<NoteItem, 'id'>;
        const id = doc.id;
        const note: NoteItem = { ...data, id };
        notesList.push(note);

        downloadsSum += Number(data.downloadsCount !== undefined ? data.downloadsCount : (data.downloads || 0));
        viewsSum += Number(data.viewsCount || 0);
        likesSum += Number(data.upvotes !== undefined ? data.upvotes : (data.likesCount || 0));

        const b = data.bookmarks;
        if (Array.isArray(b)) {
          bookmarksSum += b.length;
        } else {
          bookmarksSum += Number(b || 0);
        }
      });

      // Filter and count each category from its own collection using validation rules
      const notesCount = notesSnapshot.docs.filter(doc => {
        const data = doc.data();
        const valid = isValidNoteDocument(data);
        if (!valid) {
          console.log("Invalid note document", doc.id, data);
        }
        return valid;
      }).length;
      
      const assignmentsCount = assignmentsSnapshot.docs.filter(doc => {
        const data = doc.data();
        return !data.temp && data.title;
      }).length;

      const pyqsCount = pyqsSnapshot.docs.filter(doc => {
        const data = doc.data();
        return !data.temp;
      }).length;

      const cheatsheetsCount = cheatsheetsSnapshot.docs.filter(doc => {
        const data = doc.data();
        return !data.temp && data.title;
      }).length;

      const videosCount = videosSnapshot.docs.filter(doc => {
        const data = doc.data();
        return !data.temp;
      }).length;

      // Debug logs as requested
      console.log("Notes count:", notesCount);
      console.log("Assignments count:", assignmentsCount);
      console.log("PYQs count:", pyqsCount);
      console.log("Cheatsheets count:", cheatsheetsCount);
      console.log("Videos count:", videosCount);

      const combinedTotal = notesCount + assignmentsCount + pyqsCount + cheatsheetsCount + videosCount;

      // Date parsing helper to safely format Firestore Timestamps to ms for client-side sorting
      const getTimestampMs = (val: any): number => {
        if (!val) return 0;
        if (typeof val.toDate === 'function') return val.toDate().getTime();
        if (typeof val.seconds === 'number') return val.seconds * 1000;
        const parsed = new Date(val).getTime();
        return isNaN(parsed) ? 0 : parsed;
      };

      // Sort by uploadedAt/uploadTimestamp descending for Recent Uploads
      const sortedByDate = [...notesList].sort((a, b) => {
        const timeA = getTimestampMs(a.uploadedAt || a.uploadTimestamp);
        const timeB = getTimestampMs(b.uploadedAt || b.uploadTimestamp);
        return timeB - timeA;
      });
      setRecentUploads(sortedByDate.slice(0, 5));

      // Sort by downloadsCount descending for Most Downloaded
      const sortedByDownloads = [...notesList].sort((a, b) => {
        const dlA = Number(a.downloadsCount !== undefined ? a.downloadsCount : (a.downloads || 0));
        const dlB = Number(b.downloadsCount !== undefined ? b.downloadsCount : (b.downloads || 0));
        return dlB - dlA;
      });
      setMostDownloaded(sortedByDownloads.slice(0, 5));

      // Sort by viewsCount descending for Most Viewed
      const sortedByViews = [...notesList].sort((a, b) => {
        const vA = Number(a.viewsCount || 0);
        const vB = Number(b.viewsCount || 0);
        return vB - vA;
      });
      setMostViewed(sortedByViews.slice(0, 5));

      setStats({
        totalUsers: totalUsersCount,
        totalNotes: combinedTotal,
        totalDownloads: downloadsSum,
        totalViews: viewsSum,
        totalLikes: likesSum,
        totalBookmarks: bookmarksSum,
        notesCount,
        assignmentsCount,
        pyqsCount,
        cheatsheetsCount,
        videosCount,
        verifiedCount: 0,
        unverifiedCount: 0
      });
    } catch (err: any) {
      console.error("Error fetching and aggregating database stats:", err);
      setError("Failed to load dashboard metrics from Firestore collections.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAndAggregateStats();
  }, []);

  const getPercentage = (count: number) => {
    if (!stats || stats.totalNotes === 0) return '0';
    return ((count / stats.totalNotes) * 100).toFixed(1);
  };

  const getVerifiedPercentage = () => {
    if (!stats || stats.totalNotes === 0) return '0';
    return ((stats.verifiedCount / stats.totalNotes) * 100).toFixed(1);
  };

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

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-foreground p-6">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-muted-foreground font-medium animate-pulse">
          Aggregating notes telemetry and user profiles from Firestore...
        </p>
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="h-12 w-12 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mb-4">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold tracking-tight">Unable to load dashboard data</h3>
        <p className="text-sm text-muted-foreground max-w-md mt-1.5">{error}</p>
        <Button variant="outline" onClick={fetchAndAggregateStats} className="mt-6 flex items-center gap-2">
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  // 3. Empty State (Zero Users and Notes)
  if (!loading && stats && stats.totalUsers === 0 && stats.totalNotes === 0) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="text-4xl mb-4">📂</div>
        <h3 className="text-lg font-bold">No platform data found</h3>
        <p className="text-sm text-muted-foreground max-w-sm mt-1.5">
          The Firestore database seems to have uninitialized notes and users collections.
        </p>
        <Button variant="outline" onClick={fetchAndAggregateStats} className="mt-6 flex items-center gap-2">
          <RefreshCw className="h-4 w-4" /> Reload
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 animate-fade-in select-text">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent p-6 rounded-2xl border border-primary/10 shadow-premium">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-heading flex items-center gap-2">
            Welcome to NotesSharing Admin <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Console dashboard for verifying academic resources, content statistics, and directory audit records.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={fetchAndAggregateStats} className="flex items-center gap-1.5 bg-card">
            <RefreshCw className="h-3.5 w-3.5" /> Reload Stats
          </Button>
          <Button size="sm" onClick={() => navigate('/users')} className="flex items-center gap-1.5 bg-primary hover:bg-primary/95 text-white">
            Users Directory <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          Platform Overview
        </h3>
        
        {/* KPI Grid (5 cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          
          {/* Total Registered Users */}
          <Card 
            onClick={() => navigate('/users')}
            className="hover:shadow-premium-hover hover:border-primary/20 transition-all duration-300 group border-border cursor-pointer bg-gradient-to-br from-card to-accent/5 flex flex-col justify-between"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Users
              </span>
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl group-hover:scale-105 transition-transform duration-200">
                <UsersIcon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="text-3xl font-extrabold tracking-tight font-heading">
                {stats?.totalUsers?.toLocaleString() ?? '0'}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Registered student profiles in database.
              </p>
            </CardContent>
          </Card>

          {/* Total Downloads */}
          <Card 
            className="border-border bg-gradient-to-br from-card to-accent/5 hover:border-emerald-500/10 hover:shadow-premium-hover transition-all duration-300 flex flex-col justify-between"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Downloads
              </span>
              <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
                <Download className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="text-3xl font-extrabold tracking-tight font-heading text-emerald-500">
                {stats?.totalDownloads?.toLocaleString() ?? '0'}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Total times notes downloaded.
              </p>
            </CardContent>
          </Card>

          {/* Total Views */}
          <Card 
            className="border-border bg-gradient-to-br from-card to-accent/5 hover:border-blue-500/10 hover:shadow-premium-hover transition-all duration-300 flex flex-col justify-between"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Views
              </span>
              <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl">
                <Eye className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="text-3xl font-extrabold tracking-tight font-heading text-blue-500">
                {stats?.totalViews?.toLocaleString() ?? '0'}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Accumulated page views across platform.
              </p>
            </CardContent>
          </Card>

          {/* Total Likes */}
          <Card 
            className="border-border bg-gradient-to-br from-card to-accent/5 hover:border-rose-500/10 hover:shadow-premium-hover transition-all duration-300 flex flex-col justify-between"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Likes
              </span>
              <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl">
                <ThumbsUp className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="text-3xl font-extrabold tracking-tight font-heading text-rose-500">
                {stats?.totalLikes?.toLocaleString() ?? '0'}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Upvotes given by verified students.
              </p>
            </CardContent>
          </Card>

          {/* Total Bookmarks */}
          <Card 
            className="border-border bg-gradient-to-br from-card to-accent/5 hover:border-amber-500/10 hover:shadow-premium-hover transition-all duration-300 flex flex-col justify-between"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Bookmarks
              </span>
              <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
                <Bookmark className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="text-3xl font-extrabold tracking-tight font-heading text-amber-500">
                {stats?.totalBookmarks?.toLocaleString() ?? '0'}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Saved resources for revision.
              </p>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Upload Breakdown Full-Width Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          Upload Breakdown
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          
          {/* Notes Breakdown */}
          <Card 
            className="border-border bg-card/60 backdrop-blur-sm hover:shadow-premium-hover transition-all duration-200 p-5 flex flex-col justify-between cursor-pointer hover:-translate-y-1 hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/10"
            onClick={() => navigate('/notes')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/notes');
              }
            }}
          >
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Notes
              </span>
              <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold tracking-tight font-heading text-indigo-500">
                {getPercentage(stats?.notesCount ?? 0)}%
              </div>
              <div className="w-full bg-accent/30 h-1.5 rounded-full overflow-hidden mt-3">
                <div 
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${getPercentage(stats?.notesCount ?? 0)}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 font-medium">
                {stats?.notesCount?.toLocaleString() ?? '0'} documents
              </p>
            </div>
          </Card>

          {/* Assignments Breakdown */}
          <Card 
            className="border-border bg-card/60 backdrop-blur-sm hover:shadow-premium-hover transition-all duration-200 p-5 flex flex-col justify-between cursor-pointer hover:-translate-y-1 hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/10"
            onClick={() => navigate('/assignments')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/assignments');
              }
            }}
          >
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Assignments
              </span>
              <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                <GraduationCap className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold tracking-tight font-heading text-emerald-500">
                {getPercentage(stats?.assignmentsCount ?? 0)}%
              </div>
              <div className="w-full bg-accent/30 h-1.5 rounded-full overflow-hidden mt-3">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${getPercentage(stats?.assignmentsCount ?? 0)}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 font-medium">
                {stats?.assignmentsCount?.toLocaleString() ?? '0'} documents
              </p>
            </div>
          </Card>

          {/* PYQs Breakdown */}
          <Card 
            className="border-border bg-card/60 backdrop-blur-sm hover:shadow-premium-hover transition-all duration-200 p-5 flex flex-col justify-between cursor-pointer hover:-translate-y-1 hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/10"
            onClick={() => navigate('/pyqs')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/pyqs');
              }
            }}
          >
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                PYQs
              </span>
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                <Layers className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold tracking-tight font-heading text-amber-500">
                {getPercentage(stats?.pyqsCount ?? 0)}%
              </div>
              <div className="w-full bg-accent/30 h-1.5 rounded-full overflow-hidden mt-3">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${getPercentage(stats?.pyqsCount ?? 0)}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 font-medium">
                {stats?.pyqsCount?.toLocaleString() ?? '0'} documents
              </p>
            </div>
          </Card>

          {/* Cheatsheets Breakdown */}
          <Card 
            className="border-border bg-card/60 backdrop-blur-sm hover:shadow-premium-hover transition-all duration-200 p-5 flex flex-col justify-between cursor-pointer hover:-translate-y-1 hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/10"
            onClick={() => navigate('/cheatsheets')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/cheatsheets');
              }
            }}
          >
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Cheat Sheets
              </span>
              <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                <FileCode className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold tracking-tight font-heading text-blue-500">
                {getPercentage(stats?.cheatsheetsCount ?? 0)}%
              </div>
              <div className="w-full bg-accent/30 h-1.5 rounded-full overflow-hidden mt-3">
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${getPercentage(stats?.cheatsheetsCount ?? 0)}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 font-medium">
                {stats?.cheatsheetsCount?.toLocaleString() ?? '0'} documents
              </p>
            </div>
          </Card>

          {/* Videos Breakdown */}
          <Card 
            className="border-border bg-card/60 backdrop-blur-sm hover:shadow-premium-hover transition-all duration-200 p-5 flex flex-col justify-between cursor-pointer hover:-translate-y-1 hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/10"
            onClick={() => navigate('/videos')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/videos');
              }
            }}
          >
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Videos
              </span>
              <div className="p-2 bg-pink-500/10 text-pink-500 rounded-lg">
                <Youtube className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold tracking-tight font-heading text-pink-500">
                {getPercentage(stats?.videosCount ?? 0)}%
              </div>
              <div className="w-full bg-accent/30 h-1.5 rounded-full overflow-hidden mt-3">
                <div 
                  className="bg-pink-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${getPercentage(stats?.videosCount ?? 0)}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 font-medium">
                {stats?.videosCount?.toLocaleString() ?? '0'} documents
              </p>
            </div>
          </Card>

        </div>
      </div>

      {/* Recent Uploads Table */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-muted-foreground" /> Recent Uploads
        </h3>
        
        <Card className="border-border overflow-hidden shadow-premium">
          <CardContent className="p-0">
            {recentUploads.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                No recent uploads found in the catalog.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-accent/30 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="p-4 w-[40%]">Title</th>
                      <th className="p-4">Subject</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Uploader</th>
                      <th className="p-4">Uploaded Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {recentUploads.map((note) => (
                      <tr key={note.id} className="hover:bg-accent/10 transition-colors duration-150">
                        <td className="p-4 font-semibold text-foreground/90 max-w-xs truncate" title={note.title}>
                          {note.title || <span className="text-muted-foreground/60 italic font-normal">Untitled Document</span>}
                        </td>
                        <td className="p-4 text-muted-foreground whitespace-nowrap">
                          {note.displaySubject || note.subject || <span className="text-muted-foreground/60 italic">—</span>}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          {note.documentType || note.type ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-secondary text-secondary-foreground border border-border capitalize">
                              {note.documentType || note.type}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60 italic">—</span>
                          )}
                        </td>
                        <td className="p-4 whitespace-nowrap font-medium text-foreground/80">
                          {note.uploaderName || <span className="text-muted-foreground/60 italic font-normal">Anonymous</span>}
                        </td>
                        <td className="p-4 text-xs text-muted-foreground whitespace-nowrap">
                          {renderDateField(note.uploadedAt || note.uploadTimestamp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Content Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Most Downloaded Notes */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Download className="h-4 w-4 text-emerald-500" /> Most Downloaded Content
          </h3>
          
          <Card className="border-border overflow-hidden shadow-premium">
            <CardContent className="p-0">
              {mostDownloaded.length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">
                  No downloads recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {mostDownloaded.map((note, index) => (
                    <div key={note.id} className="flex items-center justify-between p-4 hover:bg-accent/10 transition-colors">
                      <div className="min-w-0 flex-1 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-muted-foreground w-4">
                            {index + 1}
                          </span>
                          <span className="font-semibold text-sm text-foreground truncate block" title={note.title}>
                            {note.title || 'Untitled Document'}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground block pl-6 mt-0.5">
                          {note.displaySubject || note.subject || 'No Subject'} • {note.documentType || note.type || 'Document'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-lg text-xs font-bold shrink-0">
                        <Download className="h-3.5 w-3.5" />
                        {(note.downloadsCount !== undefined ? note.downloadsCount : (note.downloads || 0)).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Most Viewed Notes */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="h-4 w-4 text-blue-500" /> Most Viewed Content
          </h3>
          
          <Card className="border-border overflow-hidden shadow-premium">
            <CardContent className="p-0">
              {mostViewed.length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">
                  No views recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {mostViewed.map((note, index) => (
                    <div key={note.id} className="flex items-center justify-between p-4 hover:bg-accent/10 transition-colors">
                      <div className="min-w-0 flex-1 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-muted-foreground w-4">
                            {index + 1}
                          </span>
                          <span className="font-semibold text-sm text-foreground truncate block" title={note.title}>
                            {note.title || 'Untitled Document'}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground block pl-6 mt-0.5">
                          {note.displaySubject || note.subject || 'No Subject'} • {note.documentType || note.type || 'Document'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-500 px-2.5 py-1 rounded-lg text-xs font-bold shrink-0">
                        <Eye className="h-3.5 w-3.5" />
                        {(note.viewsCount || 0).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};
