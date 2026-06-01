import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, GraduationCap, ClipboardList, Eye, PlusCircle, Check, Trash2 } from 'lucide-react';
import { Dialog, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface AssignmentItem {
  id: string;
  topic: string;
  subject: string;
  uploadedBy: string;
  dueDate: string;
  status: 'Published' | 'Draft' | 'Archived';
  description: string;
}

export const Assignments: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [assignments, setAssignments] = useState<AssignmentItem[]>([
    {
      id: 'A001',
      topic: 'Graph Theory & Network Flows Assignment 3',
      subject: 'Discrete Mathematics',
      uploadedBy: 'Dr. Sunil K. (IIT D)',
      dueDate: '2026-06-10',
      status: 'Published',
      description: 'Advanced graph routing, shortest path algorithm proofs, maximum flow problems, and bipartite matching applications.',
    },
    {
      id: 'A002',
      topic: 'Neural Networks Backpropagation derivations',
      subject: 'Machine Learning',
      uploadedBy: 'Prof. Amrita Sen',
      dueDate: '2026-06-15',
      status: 'Published',
      description: 'Mathematical derivation of weight update equations using gradient descent chain rule for multi-layered perceptrons.',
    },
    {
      id: 'A003',
      topic: 'Pipelining & Cache Mapping exercises',
      subject: 'Computer Architecture',
      uploadedBy: 'Dr. Sunil K. (IIT D)',
      dueDate: '2026-06-05',
      status: 'Draft',
      description: 'Calculating structural hazards, branch penalties, cache block size formulas, and direct/associative mapping tables.',
    },
    {
      id: 'A004',
      topic: 'Fiscal Policy & Inflation calculations sheet',
      subject: 'Macroeconomics',
      uploadedBy: 'Prof. Sarah Vance',
      dueDate: '2026-05-20',
      status: 'Archived',
      description: 'Analyzing aggregate demand shifts, multiplier effects, tax policy models, and CPI calculation methodologies.',
    },
  ]);

  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const filtered = assignments.filter((item) =>
    item.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this assignment sheet template?')) {
      setAssignments((prev) => prev.filter((a) => a.id !== id));
      setIsDetailOpen(false);
    }
  };

  const handleStatusChange = (id: string, nextStatus: 'Published' | 'Draft' | 'Archived') => {
    setAssignments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: nextStatus } : a))
    );
    if (selectedAssignment && selectedAssignment.id === id) {
      setSelectedAssignment((prev) => (prev ? { ...prev, status: nextStatus } : null));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-heading">Assignments Hub</h2>
          <p className="text-sm text-muted-foreground">
            Manage course assignments, problem sets, and tutor sheet templates.
          </p>
        </div>
        <Button className="flex items-center gap-1 text-sm bg-primary hover:bg-primary/95 text-white">
          <PlusCircle className="h-4 w-4" /> Create Assignment
        </Button>
      </div>

      {/* Toolbar */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search assignments by topic, subject or instructor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table grid */}
      <Card className="border-border overflow-hidden">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center justify-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-bold">No assignments found</h3>
              <p className="text-sm text-muted-foreground mt-1">No worksheets match your query criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-accent/30 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="p-4 w-20">ID</th>
                    <th className="p-4">Topic / Worksheet</th>
                    <th className="p-4">Subject</th>
                    <th className="p-4">Created By</th>
                    <th className="p-4">Due Date</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-accent/20 transition-colors">
                      <td className="p-4 font-mono text-xs text-muted-foreground">{item.id}</td>
                      <td className="p-4 font-semibold text-foreground/90">{item.topic}</td>
                      <td className="p-4 text-muted-foreground font-medium">{item.subject}</td>
                      <td className="p-4 font-medium">{item.uploadedBy}</td>
                      <td className="p-4 text-xs text-muted-foreground">{item.dueDate}</td>
                      <td className="p-4 text-center">
                        <Badge
                          variant={
                            item.status === 'Published'
                              ? 'success'
                              : item.status === 'Draft'
                              ? 'warning'
                              : 'secondary'
                          }
                        >
                          {item.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={() => {
                              setSelectedAssignment(item);
                              setIsDetailOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(item.id)}
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

      {/* Detail Dialog */}
      <Dialog isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)}>
        {selectedAssignment && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{selectedAssignment.id}</Badge>
                <Badge
                  variant={
                    selectedAssignment.status === 'Published'
                      ? 'success'
                      : selectedAssignment.status === 'Draft'
                      ? 'warning'
                      : 'secondary'
                  }
                >
                  {selectedAssignment.status}
                </Badge>
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight">
                {selectedAssignment.topic}
              </DialogTitle>
              <DialogDescription>
                Instructed by {selectedAssignment.uploadedBy} • Due date: {selectedAssignment.dueDate}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-2">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Description</span>
                <p className="text-sm text-foreground/80 leading-relaxed bg-accent/15 p-3 rounded-lg border border-border">
                  {selectedAssignment.description}
                </p>
              </div>
              <div className="bg-accent/40 rounded-xl p-3 border border-border text-xs">
                <span className="text-muted-foreground font-semibold block mb-1">Subject Context</span>
                <span className="text-foreground font-medium flex items-center gap-1.5"><GraduationCap className="h-4 w-4 text-primary" /> {selectedAssignment.subject} Course Bundle</span>
              </div>
            </div>

            <DialogFooter>
              <div className="flex items-center justify-between w-full mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 text-xs"
                  onClick={() => handleDelete(selectedAssignment.id)}
                >
                  Delete Template
                </Button>
                <div className="flex items-center gap-2">
                  {selectedAssignment.status !== 'Published' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleStatusChange(selectedAssignment.id, 'Published')}
                    >
                      Publish Now
                    </Button>
                  )}
                  {selectedAssignment.status !== 'Draft' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleStatusChange(selectedAssignment.id, 'Draft')}
                    >
                      Move to Draft
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
