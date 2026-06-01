import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  FileText,
  Users as UsersIcon,
  TrendingUp,
  AlertCircle,
  FileCode,
  GraduationCap,
  Layers,
  ArrowUpRight,
  Clock,
  CheckCircle,
  ArrowRight,
  Download,
  PlusCircle,
  Upload,
  Check,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PendingItem {
  id: string;
  title: string;
  type: 'Note' | 'Assignment' | 'PYQ' | 'Cheatsheet';
  subject: string;
  author: string;
  date: string;
}

interface UploadedItem {
  id: string;
  title: string;
  type: 'Note' | 'Assignment' | 'PYQ' | 'Cheatsheet';
  author: string;
  date: string;
  status: 'Approved' | 'Flagged' | 'Pending';
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Metrics Data (6 Cards)
  const stats = [
    {
      title: 'Total Notes',
      value: '1,421',
      change: '+12.4%',
      trendingUp: true,
      description: 'verified student guides',
      icon: <FileText className="h-5 w-5 text-indigo-500" />,
      path: '/notes'
    },
    {
      title: 'Total Assignments',
      value: '592',
      change: '+8.2%',
      trendingUp: true,
      description: 'tutor sheets & problems',
      icon: <GraduationCap className="h-5 w-5 text-emerald-500" />,
      path: '/assignments'
    },
    {
      title: 'Total PYQs',
      value: '630',
      change: '+15.1%',
      trendingUp: true,
      description: 'previous year papers',
      icon: <Layers className="h-5 w-5 text-amber-500" />,
      path: '/pyqs'
    },
    {
      title: 'Total Cheatsheets',
      value: '202',
      change: '+24.6%',
      trendingUp: true,
      description: 'quick reference booklets',
      icon: <FileCode className="h-5 w-5 text-blue-500" />,
      path: '/cheatsheets'
    },
    {
      title: 'Total Users',
      value: '12,408',
      change: '+18.3%',
      trendingUp: true,
      description: 'registered students & staff',
      icon: <UsersIcon className="h-5 w-5 text-violet-500" />,
      path: '/users'
    },
    {
      title: 'Total Downloads',
      value: '48,291',
      change: '+31.4%',
      trendingUp: true,
      description: 'successful file deliveries',
      icon: <Download className="h-5 w-5 text-rose-500" />,
      path: '/notes'
    },
  ];

  // Mock State for Dynamic List Changes
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([
    {
      id: 'N001',
      title: 'Database Management Systems Complete Lecture Notes',
      type: 'Note',
      subject: 'Computer Science',
      author: 'Aravind Swamy',
      date: 'Today, 11:20 AM',
    },
    {
      id: 'A003',
      title: 'Pipelining & Cache Mapping exercises',
      type: 'Assignment',
      subject: 'Computer Architecture',
      author: 'Dr. Sunil K.',
      date: 'Today, 09:15 AM',
    },
    {
      id: 'P013',
      title: 'Advanced Operating Systems theory paper',
      type: 'PYQ',
      subject: 'Computer Science',
      author: 'M.Tech CSE Group',
      date: 'Yesterday, 04:40 PM',
    },
  ]);

  const [recentUploads, setRecentUploads] = useState<UploadedItem[]>([
    {
      id: 'C201',
      title: 'React Hooks API quick-reference cheatsheet',
      type: 'Cheatsheet',
      author: 'Vikash Sen',
      date: '10 mins ago',
      status: 'Approved',
    },
    {
      id: 'N002',
      title: 'Machine Learning algorithms guide',
      type: 'Note',
      author: 'Neha Deshmukh',
      date: '1 hour ago',
      status: 'Approved',
    },
    {
      id: 'P011',
      title: 'Computer Organization & Assembly Language Paper',
      type: 'PYQ',
      author: 'Prof. Amrita Sen',
      date: '2 hours ago',
      status: 'Approved',
    },
    {
      id: 'A004',
      title: 'Fiscal Policy & Inflation calculations sheet',
      type: 'Assignment',
      author: 'Prof. Sarah Vance',
      date: '5 hours ago',
      status: 'Approved',
    },
  ]);

  // Top Downloaded Resources Mock Data
  const topDownloads = [
    {
      title: 'Data Structures & Algorithms Exam Cheatsheet',
      type: 'Cheatsheet',
      downloads: '1,280',
      subject: 'Computer Science',
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Computer Networks Endsem 2024 Question Paper',
      type: 'PYQ',
      downloads: '954',
      subject: 'Information Technology',
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
    {
      title: 'Thermodynamics Formulas & Derivations guide',
      type: 'Note',
      downloads: '840',
      subject: 'Mechanical Eng.',
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    },
    {
      title: 'Discrete Mathematics Graph Theory Assignment',
      type: 'Assignment',
      downloads: '712',
      subject: 'Mathematics',
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
  ];

  // Quick Action Modal States
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'Note' | 'Assignment' | 'PYQ' | 'Cheatsheet'>('Note');
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenUpload = (type: 'Note' | 'Assignment' | 'PYQ' | 'Cheatsheet') => {
    setUploadType(type);
    setNewTitle('');
    setNewSubject('');
    setNewAuthor('Admin Moderator');
    setIsUploadOpen(true);
  };

  const handleMockUpload = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      const generatedId = `${uploadType[0]}${Math.floor(100 + Math.random() * 900)}`;
      
      // Add to recent uploads list
      const newItem: UploadedItem = {
        id: generatedId,
        title: newTitle || `Untitled ${uploadType}`,
        type: uploadType,
        author: newAuthor || 'Admin',
        date: 'Just now',
        status: 'Approved',
      };

      setRecentUploads((prev) => [newItem, ...prev]);
      setIsSaving(false);
      setIsUploadOpen(false);
    }, 600);
  };

  const handleApprovePending = (id: string) => {
    const itemToApprove = pendingItems.find((item) => item.id === id);
    if (itemToApprove) {
      // Add to recent uploads list
      const newItem: UploadedItem = {
        id: itemToApprove.id,
        title: itemToApprove.title,
        type: itemToApprove.type,
        author: itemToApprove.author,
        date: 'Just now',
        status: 'Approved',
      };
      setRecentUploads((prev) => [newItem, ...prev]);
    }
    // Remove from pending
    setPendingItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleRejectPending = (id: string) => {
    // Remove from pending
    setPendingItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner specific to NotesSharingAPP */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-500/10 via-violet-500/5 to-transparent p-6 rounded-2xl border border-indigo-500/10 shadow-premium">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-heading">
            NotesSharingAPP Admin Portal
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            App metrics, academic resource archives, and student directory telemetry.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
            Console Settings
          </Button>
          <Button size="sm" onClick={() => navigate('/notes')} className="flex items-center gap-1.5">
            Manage Notes <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Metrics Row (6 Cards Layout) */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat, i) => (
          <Card
            key={i}
            onClick={() => navigate(stat.path)}
            className="hover:shadow-premium-hover hover:border-primary/20 transition-all duration-300 group border-border cursor-pointer"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {stat.title}
              </span>
              <div className="p-1.5 bg-accent/40 rounded-lg group-hover:scale-105 duration-200">
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-extrabold tracking-tight font-heading">
                  {stat.value}
                </span>
                <span className="text-[9px] font-bold text-emerald-500">
                  {stat.change}
                </span>
              </div>
              <p className="text-[9px] text-muted-foreground mt-1 truncate">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Core Split Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2/3 width) - Pending Review & Recent Uploads */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Pending Content Review */}
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base font-bold tracking-tight">Pending Content Review</CardTitle>
                <CardDescription>Academic files awaiting moderator verification</CardDescription>
              </div>
              <Badge variant="warning">{pendingItems.length} awaiting</Badge>
            </CardHeader>
            <CardContent className="pt-0">
              {pendingItems.length === 0 ? (
                <div className="py-8 text-center flex flex-col items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-emerald-500 mb-2" />
                  <p className="text-sm font-semibold">All caught up!</p>
                  <p className="text-xs text-muted-foreground">No resources are currently pending review.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {pendingItems.map((item) => (
                    <div key={item.id} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm truncate text-foreground/90">{item.title}</span>
                          <Badge variant="outline" className="text-[9px] font-mono py-0">{item.id}</Badge>
                          <Badge variant="secondary" className="text-[9px] py-0">{item.type}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Uploaded by <span className="text-foreground/80 font-medium">{item.author}</span> • {item.subject} • <span className="text-[10px]">{item.date}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/20"
                          onClick={() => handleApprovePending(item.id)}
                          title="Approve Resource"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => handleRejectPending(item.id)}
                          title="Reject Resource"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Uploads */}
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base font-bold tracking-tight">Recent Uploads</CardTitle>
                <CardDescription>Live log of documents submitted and auto-published</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/notes')} className="text-xs flex gap-1 items-center">
                View All Files <ArrowRight className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y divide-border">
                {recentUploads.map((act) => (
                  <div key={act.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0 text-muted-foreground mt-0.5">
                        {act.type === 'Note' && <FileText className="h-4 w-4" />}
                        {act.type === 'Assignment' && <GraduationCap className="h-4 w-4" />}
                        {act.type === 'PYQ' && <Layers className="h-4 w-4" />}
                        {act.type === 'Cheatsheet' && <FileCode className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          <span className="font-semibold text-foreground/90">{act.author}</span>{' '}
                          <span className="text-muted-foreground">uploaded a {act.type}</span>
                        </p>
                        <p className="text-xs text-primary font-medium truncate mt-0.5">
                          {act.title}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge variant="success" className="text-[9px] py-0">Published</Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {act.date}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Column (1/3 width) - Quick Actions & Top Downloaded */}
        <div className="space-y-6">
          
          {/* Quick Actions */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base font-bold tracking-tight">Quick Actions</CardTitle>
              <CardDescription>Moderator shortcuts to publish documents directly</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 pt-0">
              <Button
                variant="outline"
                onClick={() => handleOpenUpload('Note')}
                className="flex flex-col items-center justify-center h-20 rounded-xl gap-2 hover:border-primary/30 transition-all text-center p-2 text-xs font-semibold"
              >
                <FileText className="h-5 w-5 text-indigo-500" />
                Upload Note
              </Button>
              <Button
                variant="outline"
                onClick={() => handleOpenUpload('Assignment')}
                className="flex flex-col items-center justify-center h-20 rounded-xl gap-2 hover:border-primary/30 transition-all text-center p-2 text-xs font-semibold"
              >
                <GraduationCap className="h-5 w-5 text-emerald-500" />
                Upload Assignment
              </Button>
              <Button
                variant="outline"
                onClick={() => handleOpenUpload('PYQ')}
                className="flex flex-col items-center justify-center h-20 rounded-xl gap-2 hover:border-primary/30 transition-all text-center p-2 text-xs font-semibold"
              >
                <Layers className="h-5 w-5 text-amber-500" />
                Upload PYQ
              </Button>
              <Button
                variant="outline"
                onClick={() => handleOpenUpload('Cheatsheet')}
                className="flex flex-col items-center justify-center h-20 rounded-xl gap-2 hover:border-primary/30 transition-all text-center p-2 text-xs font-semibold"
              >
                <FileCode className="h-5 w-5 text-blue-500" />
                Upload Cheatsheet
              </Button>
            </CardContent>
          </Card>

          {/* Top Downloaded Resources */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base font-bold tracking-tight">Top Downloaded Resources</CardTitle>
              <CardDescription>Highest student engagement files</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {topDownloads.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl border border-border/60 hover:bg-accent/40 transition-all duration-200"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 text-xs font-bold ${item.color}`}>
                      {item.type[0]}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-foreground/90 truncate leading-tight">{item.title}</h4>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">{item.subject}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 shrink-0 pl-2">
                    <span className="text-xs font-extrabold text-foreground/90">{item.downloads}</span>
                    <span className="text-[8px] text-muted-foreground uppercase font-semibold">get requests</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>

      </div>

      {/* Quick Upload Action Dialog (Mock) */}
      <Dialog isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)}>
        <form onSubmit={handleMockUpload}>
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Upload className="h-4 w-4 text-primary" />
              <Badge variant="outline" className="text-xs font-semibold capitalize">Direct Publisher</Badge>
            </div>
            <DialogTitle className="text-lg font-bold">
              Upload New {uploadType}
            </DialogTitle>
            <DialogDescription>
              Submit an official resource. The document will be published and logged under your account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 my-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Resource Name / Title
              </label>
              <Input
                type="text"
                placeholder={`e.g., ${uploadType === 'PYQ' ? 'Applied Physics Endsem 2025' : `Course lecture on ${uploadType} topic`}`}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Subject Category
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Computer Science"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Uploader Name
                </label>
                <Input
                  type="text"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Mock file picker */}
            <div className="border border-dashed border-border/80 rounded-xl p-6 text-center bg-accent/10 hover:bg-accent/20 cursor-pointer transition-all">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <span className="text-xs font-semibold text-foreground/90 block">Select PDF or Document file</span>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">Max limit 25MB. Files are auto-scanned.</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" disabled={isSaving} className="bg-primary hover:bg-primary/95 text-white flex gap-1.5 items-center">
              {isSaving ? (
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Publish Resource <Check className="h-4 w-4" />
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
};

