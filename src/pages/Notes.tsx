import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Dialog, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Search,
  Filter,
  Check,
  X,
  Eye,
  Trash2,
  AlertTriangle,
  FolderOpen,
  ArrowUpDown,
  BookOpen
} from 'lucide-react';

interface NoteItem {
  id: string;
  title: string;
  subject: string;
  author: string;
  semester: string;
  date: string;
  status: 'Pending' | 'Approved' | 'Flagged';
  downloads: number;
  description: string;
}

export const Notes: React.FC = () => {
  // Mock Notes List
  const [notes, setNotes] = useState<NoteItem[]>([
    {
      id: 'N001',
      title: 'Database Management Systems Complete Lecture Notes',
      subject: 'Computer Science',
      author: 'Aravind Swamy',
      semester: 'Semester 5',
      date: '2026-05-28',
      status: 'Pending',
      downloads: 0,
      description: 'Handwritten notes covering ER diagrams, Relational Algebra, SQL normalization, indexing, and transactional states.',
    },
    {
      id: 'N002',
      title: 'Machine Learning algorithms cheatsheets and notes',
      subject: 'Data Science',
      author: 'Neha Deshmukh',
      semester: 'Semester 7',
      date: '2026-05-26',
      status: 'Approved',
      downloads: 142,
      description: 'Quick guide containing mathematical summaries of Linear/Logistic Regression, SVM, KNN, Random Forests, and Gradient Boosting.',
    },
    {
      id: 'N003',
      title: 'Thermodynamics Formulas & Derivations guide',
      subject: 'Mechanical Eng.',
      author: 'Vikram Malhotra',
      semester: 'Semester 3',
      date: '2026-05-25',
      status: 'Approved',
      downloads: 88,
      description: 'Comprehensive derivation of First, Second, and Third Laws of Thermodynamics along with Carnot cycle efficiency proofs.',
    },
    {
      id: 'N004',
      title: 'Introductory Microeconomics Syllabus Summary',
      subject: 'Economics',
      author: 'Sneha Roy',
      semester: 'Semester 1',
      date: '2026-05-24',
      status: 'Flagged',
      downloads: 4,
      description: 'Brief overview of demand-supply curves, elasticities, consumer behaviors, and market structural margins.',
    },
    {
      id: 'N005',
      title: 'Compiler Design Syntax Analysis & Parsing notes',
      subject: 'Computer Science',
      author: 'Rohan Sharma',
      semester: 'Semester 6',
      date: '2026-05-20',
      status: 'Pending',
      downloads: 0,
      description: 'Deep dive into LL(1) parsing tables, LR(0), SLR(1), LALR(1) compiler stages, and parser generator configurations.',
    },
  ]);

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Flagged'>('All');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  // Filtered Notes
  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || note.status === statusFilter;
    const matchesSubject = subjectFilter === 'All' || note.subject === subjectFilter;

    return matchesSearch && matchesStatus && matchesSubject;
  });

  // Action Handlers
  const handleApprove = (id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: 'Approved' } : n))
    );
    if (selectedNote && selectedNote.id === id) {
      setSelectedNote((prev) => (prev ? { ...prev, status: 'Approved' } : null));
    }
    setIsReviewOpen(false);
  };

  const handleFlag = (id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: 'Flagged' } : n))
    );
    if (selectedNote && selectedNote.id === id) {
      setSelectedNote((prev) => (prev ? { ...prev, status: 'Flagged' } : null));
    }
    setIsReviewOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this resource?')) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      setIsReviewOpen(false);
    }
  };

  const openReview = (note: NoteItem) => {
    setSelectedNote(note);
    setIsReviewOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-heading">Notes Repository Management</h2>
          <p className="text-sm text-muted-foreground">
            Verify lecture notes, slides, and class summaries uploaded by students.
          </p>
        </div>
      </div>

      {/* Filters and Search toolbar */}
      <Card className="border-border">
        <CardContent className="p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by title, author, or document ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Selector */}
            <div className="flex items-center gap-1 bg-accent/40 rounded-lg p-0.5 border border-border">
              {(['All', 'Pending', 'Approved', 'Flagged'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150
                    ${statusFilter === status
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                    }
                  `}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Subject Selector */}
            <Select
              className="w-40 text-xs"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
            >
              <option value="All">All Subjects</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Data Science">Data Science</option>
              <option value="Mechanical Eng.">Mechanical Eng.</option>
              <option value="Economics">Economics</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card className="border-border overflow-hidden">
        <CardContent className="p-0">
          {filteredNotes.length === 0 ? (
            /* Empty State */
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center text-muted-foreground mb-4">
                <FolderOpen className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold">No documents match search parameters</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1.5">
                Try modifying your filter categories or clear the search input to see files.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-6"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('All');
                  setSubjectFilter('All');
                }}
              >
                Clear All Filters
              </Button>
            </div>
          ) : (
            /* Table Grid */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-accent/30 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="p-4 w-20">ID</th>
                    <th className="p-4">Document Title</th>
                    <th className="p-4">Subject</th>
                    <th className="p-4">Uploaded By</th>
                    <th className="p-4">Upload Date</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {filteredNotes.map((note) => (
                    <tr key={note.id} className="hover:bg-accent/20 transition-colors duration-150">
                      <td className="p-4 font-mono text-xs text-muted-foreground">{note.id}</td>
                      <td className="p-4 max-w-xs md:max-w-md font-semibold truncate text-foreground/90">
                        {note.title}
                      </td>
                      <td className="p-4 text-muted-foreground font-medium">{note.subject}</td>
                      <td className="p-4 font-medium">{note.author}</td>
                      <td className="p-4 text-xs text-muted-foreground">{note.date}</td>
                      <td className="p-4 text-center">
                        <Badge
                          variant={
                            note.status === 'Approved'
                              ? 'success'
                              : note.status === 'Flagged'
                              ? 'destructive'
                              : 'warning'
                          }
                        >
                          {note.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={() => openReview(note)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {note.status !== 'Approved' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/20"
                              onClick={() => handleApprove(note.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(note.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Document Detail Dialog */}
      <Dialog isOpen={isReviewOpen} onClose={() => setIsReviewOpen(false)}>
        {selectedNote && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{selectedNote.id}</Badge>
                <Badge
                  variant={
                    selectedNote.status === 'Approved'
                      ? 'success'
                      : selectedNote.status === 'Flagged'
                      ? 'destructive'
                      : 'warning'
                  }
                >
                  {selectedNote.status}
                </Badge>
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight">
                {selectedNote.title}
              </DialogTitle>
              <DialogDescription>
                Uploaded by {selectedNote.author} on {selectedNote.date}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-2">
              {/* Document metadata info grid */}
              <div className="grid grid-cols-2 gap-4 bg-accent/40 rounded-xl p-3.5 border border-border/80 text-xs">
                <div>
                  <span className="text-muted-foreground block font-medium">Subject Area</span>
                  <span className="font-semibold text-foreground mt-0.5 block">{selectedNote.subject}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-medium">Academic Period</span>
                  <span className="font-semibold text-foreground mt-0.5 block">{selectedNote.semester}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-medium">Downloads</span>
                  <span className="font-semibold text-foreground mt-0.5 block">{selectedNote.downloads} views</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-medium">Format Status</span>
                  <span className="font-semibold text-foreground mt-0.5 block">Verified PDF Document</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Description</span>
                <p className="text-sm text-foreground/80 leading-relaxed bg-accent/15 p-3 rounded-lg border border-border">
                  {selectedNote.description}
                </p>
              </div>

              {/* Mock PDF preview canvas layout */}
              <div className="border border-border/80 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-accent/40 p-2.5 border-b border-border flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> preview_document.pdf (Page 1 of 12)</span>
                  <span className="text-[10px] text-primary">Double Click to Zoom</span>
                </div>
                <div className="h-32 bg-neutral-100 dark:bg-neutral-900 flex flex-col items-center justify-center p-4">
                  <div className="w-16 h-20 bg-white dark:bg-neutral-800 border border-border shadow-md rounded flex flex-col justify-between p-2">
                    <div className="space-y-1">
                      <div className="h-1 w-full bg-neutral-200 dark:bg-neutral-700 rounded" />
                      <div className="h-1 w-4/5 bg-neutral-200 dark:bg-neutral-700 rounded" />
                      <div className="h-1 w-5/6 bg-neutral-200 dark:bg-neutral-700 rounded" />
                    </div>
                    <div className="h-1 w-1/3 bg-neutral-300 dark:bg-neutral-600 rounded align-bottom" />
                  </div>
                  <span className="text-xs text-muted-foreground mt-2 font-medium">Document content is OCR parsed and ready for download.</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <div className="flex items-center justify-between w-full mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 text-xs flex gap-1.5"
                  onClick={() => handleDelete(selectedNote.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete File
                </Button>
                <div className="flex items-center gap-2">
                  {selectedNote.status !== 'Flagged' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-amber-600 border-amber-600/35 hover:bg-amber-500/10 text-xs flex gap-1 items-center"
                      onClick={() => handleFlag(selectedNote.id)}
                    >
                      <AlertTriangle className="h-3.5 w-3.5" /> Flag
                    </Button>
                  )}
                  {selectedNote.status !== 'Approved' && (
                    <Button
                      variant="default"
                      size="sm"
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex gap-1 items-center"
                      onClick={() => handleApprove(selectedNote.id)}
                    >
                      <Check className="h-3.5 w-3.5" /> Approve
                    </Button>
                  )}
                </div>
              </div>
            </DialogFooter>
          </>
        )}
      </Dialog>
    </div>
  );
};
