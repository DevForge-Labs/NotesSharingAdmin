import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FileCode, Trash2, Eye, Download, BookOpen, PlusCircle } from 'lucide-react';

interface CheatsheetItem {
  id: string;
  title: string;
  subject: string;
  author: string;
  tags: string[];
  downloads: number;
  date: string;
}

export const Cheatsheets: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [cheatsheets, setCheatsheets] = useState<CheatsheetItem[]>([
    { id: 'C201', title: 'React Hooks API quick-reference cheatsheet', subject: 'Computer Science', author: 'Vikash Sen', tags: ['React', 'Frontend', 'JS'], downloads: 312, date: '2026-05-29' },
    { id: 'C202', title: 'Docker CLI commands cheat sheet', subject: 'DevOps', author: 'Admin Sarah', tags: ['Docker', 'DevOps', 'Backend'], downloads: 184, date: '2026-05-24' },
    { id: 'C203', title: 'Linear Algebra matrix transformations guide', subject: 'Mathematics', author: 'Priya Patel', tags: ['Matrix', 'Algebra', 'Math'], downloads: 90, date: '2026-05-20' },
    { id: 'C204', title: 'Organic Chemistry nomenclature sheet', subject: 'Chemistry', author: 'Dev Kabir', tags: ['Chemistry', 'Science', 'IUPAC'], downloads: 65, date: '2026-05-15' },
    { id: 'C205', title: 'Git & GitHub Workflow cheatsheet', subject: 'Software Eng.', author: 'Rohan Sharma', tags: ['Git', 'VCS', 'CLI'], downloads: 410, date: '2026-05-10' },
  ]);

  const filtered = cheatsheets.filter((sheet) =>
    sheet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sheet.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sheet.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this cheatsheet from public galleries?')) {
      setCheatsheets((prev) => prev.filter((c) => c.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-heading">Cheatsheets & References</h2>
          <p className="text-sm text-muted-foreground">
            Audit single-page summary booklets, formulas lists, and developer command cheat guides.
          </p>
        </div>
        <Button className="flex items-center gap-1 text-sm bg-primary hover:bg-primary/95 text-white">
          <PlusCircle className="h-4 w-4" /> Upload Cheatsheet
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search cheatsheets by name, subject, or tag keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Card Grid */}
      {filtered.length === 0 ? (
        <Card className="border-border">
          <CardContent className="p-16 text-center flex flex-col items-center justify-center">
            <FileCode className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-bold">No cheat sheets found</h3>
            <p className="text-sm text-muted-foreground mt-1">Try testing other syntax tags.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((sheet) => (
            <Card key={sheet.id} className="hover:shadow-premium-hover transition-all duration-300 border-border bg-card flex flex-col justify-between group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono font-semibold text-muted-foreground bg-accent px-2 py-0.5 rounded border border-border">
                    {sheet.id}
                  </span>
                  <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                    <BookOpen className="h-3 w-3" /> {sheet.downloads} downloads
                  </span>
                </div>
                <CardTitle className="text-base font-bold leading-tight group-hover:text-primary transition-colors cursor-pointer">
                  {sheet.title}
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-primary/80 mt-1 uppercase tracking-wider">
                  {sheet.subject}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pb-4">
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {sheet.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[9px] px-2 py-0">
                      #{tag}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Shared by <span className="font-semibold text-foreground/80">{sheet.author}</span> on {sheet.date}
                </p>
              </CardContent>

              <CardFooter className="border-t border-border/60 pt-3 flex items-center justify-between gap-2 bg-accent/10 rounded-b-xl">
                <Button variant="ghost" size="sm" className="text-xs hover:bg-primary/10 hover:text-primary flex gap-1 h-8 px-2.5">
                  <Eye className="h-3.5 w-3.5" /> View File
                </Button>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(sheet.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
