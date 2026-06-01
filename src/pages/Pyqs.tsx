import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Search, Layers, Calendar, Eye, Download, ShieldAlert, PlusCircle } from 'lucide-react';

interface PyqItem {
  id: string;
  subject: string;
  course: string;
  year: number;
  term: 'Mid-Sem' | 'End-Sem' | 'Quiz / Class Test';
  fileSize: string;
  status: 'Verified' | 'Unverified';
}

export const Pyqs: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [termFilter, setTermFilter] = useState<'All' | 'Mid-Sem' | 'End-Sem' | 'Quiz / Class Test'>('All');
  const [pyqs, setPyqs] = useState<PyqItem[]>([
    { id: 'P011', subject: 'Computer Organization & Assembly Language', course: 'B.Tech CSE', year: 2024, term: 'End-Sem', fileSize: '2.4 MB', status: 'Verified' },
    { id: 'P012', subject: 'Object Oriented Programming with C++', course: 'B.Tech CSE', year: 2023, term: 'Mid-Sem', fileSize: '1.8 MB', status: 'Verified' },
    { id: 'P013', subject: 'Advanced Operating Systems theory', course: 'M.Tech CSE', year: 2024, term: 'Mid-Sem', fileSize: '3.1 MB', status: 'Unverified' },
    { id: 'P014', subject: 'Mathematical Foundations of Computer Science', course: 'B.Tech CSE', year: 2022, term: 'End-Sem', fileSize: '1.2 MB', status: 'Verified' },
    { id: 'P015', subject: 'Financial Accounting & Cost Audit', course: 'MBA Fin', year: 2024, term: 'Quiz / Class Test', fileSize: '850 KB', status: 'Unverified' },
  ]);

  const filtered = pyqs.filter((p) => {
    const matchesSearch = p.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTerm = termFilter === 'All' || p.term === termFilter;
    return matchesSearch && matchesTerm;
  });

  const handleVerify = (id: string) => {
    setPyqs((prev) => prev.map((p) => p.id === id ? { ...p, status: 'Verified' } : p));
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Remove this question paper from archive?')) {
      setPyqs((prev) => prev.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-heading">Previous Year Questions (PYQs)</h2>
          <p className="text-sm text-muted-foreground">
            Audit and publish official semester examination papers and midterm worksheets.
          </p>
        </div>
        <Button className="flex items-center gap-1 text-sm bg-primary hover:bg-primary/95 text-white">
          <PlusCircle className="h-4 w-4" /> Upload Exam Paper
        </Button>
      </div>

      {/* Filter toolbar */}
      <Card className="border-border">
        <CardContent className="p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search PYQs by subject title or course index..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-3">
            <Select
              className="w-44 text-xs"
              value={termFilter}
              onChange={(e) => setTermFilter(e.target.value as any)}
            >
              <option value="All">All Exam Terms</option>
              <option value="Mid-Sem">Mid-Sem Exams</option>
              <option value="End-Sem">End-Sem Exams</option>
              <option value="Quiz / Class Test">Quizzes & Class Tests</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Grid List */}
      <Card className="border-border overflow-hidden">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center justify-center">
              <Layers className="h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-bold">No exam sheets located</h3>
              <p className="text-sm text-muted-foreground mt-1">Try broadening your subject keywords.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-accent/30 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="p-4 w-20">ID</th>
                    <th className="p-4">Subject Title</th>
                    <th className="p-4">Course Degree</th>
                    <th className="p-4">Exam Year</th>
                    <th className="p-4">Exam Term</th>
                    <th className="p-4">File Size</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-accent/20 transition-colors">
                      <td className="p-4 font-mono text-xs text-muted-foreground">{item.id}</td>
                      <td className="p-4 font-semibold text-foreground/90">{item.subject}</td>
                      <td className="p-4 text-muted-foreground font-medium">{item.course}</td>
                      <td className="p-4 font-medium flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-muted-foreground" /> {item.year}</td>
                      <td className="p-4">
                        <Badge variant="secondary" className="font-semibold text-[10px]">
                          {item.term}
                        </Badge>
                      </td>
                      <td className="p-4 text-xs font-mono text-muted-foreground">{item.fileSize}</td>
                      <td className="p-4 text-center">
                        <Badge
                          variant={item.status === 'Verified' ? 'success' : 'warning'}
                          className="flex items-center gap-1 w-fit mx-auto"
                        >
                          {item.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {item.status === 'Unverified' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/20 font-medium"
                              onClick={() => handleVerify(item.id)}
                            >
                              Verify Paper
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(item.id)}
                          >
                            <ShieldAlert className="h-4 w-4" />
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
    </div>
  );
};
