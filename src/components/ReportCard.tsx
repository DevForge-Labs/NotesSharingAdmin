import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Report } from '@/types/report';
import { 
  FileText, 
  GraduationCap, 
  Layers, 
  FileCode, 
  Video, 
  Eye, 
  Calendar, 
  User,
  AlertTriangle
} from 'lucide-react';

interface ReportCardProps {
  report: Report;
  onView: (report: Report) => void;
}

export const ReportCard: React.FC<ReportCardProps> = ({ report, onView }) => {
  // Safe Date formatter helper
  const renderDateField = (val: any) => {
    if (!val) return '—';
    try {
      if (typeof val.toDate === 'function') {
        return val.toDate().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
      }
      if (typeof val.seconds === 'number') {
        return new Date(val.seconds * 1000).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
      }
      const date = new Date(val);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
      }
    } catch (e) {
      console.error("Error formatting date:", e);
    }
    return '—';
  };

  // Helper formatting resource type labels & styling
  const getResourceConfig = (type?: string) => {
    const t = (type || '').trim().toLowerCase();
    switch (t) {
      case 'notes':
        return {
          label: 'Note',
          icon: <FileText className="h-5 w-5" />,
          colorClass: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
          fallbackClass: 'bg-violet-500/5 text-violet-500'
        };
      case 'assignments':
        return {
          label: 'Assignment',
          icon: <GraduationCap className="h-5 w-5" />,
          colorClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          fallbackClass: 'bg-blue-500/5 text-blue-500'
        };
      case 'pyqs':
        return {
          label: 'PYQ',
          icon: <Layers className="h-5 w-5" />,
          colorClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          fallbackClass: 'bg-emerald-500/5 text-emerald-500'
        };
      case 'cheatsheets':
        return {
          label: 'CheatSheet',
          icon: <FileCode className="h-5 w-5" />,
          colorClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          fallbackClass: 'bg-amber-500/5 text-amber-500'
        };
      case 'videos':
        return {
          label: 'Video',
          icon: <Video className="h-5 w-5" />,
          colorClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          fallbackClass: 'bg-rose-500/5 text-rose-500'
        };
      default:
        return {
          label: type || 'Resource',
          icon: <FileText className="h-5 w-5" />,
          colorClass: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
          fallbackClass: 'bg-zinc-500/5 text-zinc-500'
        };
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onView(report);
    }
  };

  const config = getResourceConfig(report.resourceType);
  const resourceTitle = report.resourceTitle || 'Untitled Resource';

  return (
    <Card 
      onClick={() => onView(report)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Open moderation details for "${resourceTitle}"`}
      className="border-border bg-card/60 hover:bg-card/80 hover:border-primary/50 hover:scale-[1.008] cursor-pointer transition-all duration-300 shadow-premium flex flex-col justify-between group overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <CardContent className="p-5 space-y-4">
        {/* Top Header Row: Resource Type & Status */}
        <div className="flex items-center justify-between gap-2">
          <Badge className={`text-[10px] py-0.5 px-2.5 font-bold uppercase tracking-wider ${config.colorClass}`}>
            {config.label}
          </Badge>
          <Badge variant="warning" className="text-[10px] uppercase font-bold tracking-wider py-0.5 px-2 bg-amber-500/10 border-amber-500/20 text-amber-400">
            Pending
          </Badge>
        </div>

        {/* Middle Resource Info Section */}
        <div className="flex gap-3 items-start">
          {/* Resource Thumbnail / Falling Icon */}
          <div className="w-14 h-14 rounded-lg overflow-hidden border border-border flex items-center justify-center shrink-0 shadow-sm bg-accent/20">
            {report.resourceThumbnail ? (
              <img 
                src={report.resourceThumbnail} 
                alt={resourceTitle} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center ${config.fallbackClass}`}>
                {config.icon}
              </div>
            )}
          </div>

          {/* Title & Reported Subject Info */}
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm leading-tight text-foreground truncate group-hover:text-primary transition-colors" title={resourceTitle}>
              {report.resourceTitle || <span className="text-muted-foreground/60 italic font-normal">Untitled Resource</span>}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground">
              <User className="h-3 w-3 shrink-0" />
              <span className="truncate">By: {report.uploaderName || 'Anonymous'}</span>
            </div>
          </div>
        </div>

        {/* Lower Divider and Reason info */}
        <div className="pt-3 border-t border-border/40 space-y-2">
          <div className="flex items-start gap-1.5 bg-destructive/10 border border-destructive/20 rounded-lg p-2.5">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-red-400 leading-none">Reason for Report</p>
              <p className="text-xs text-foreground/90 font-semibold mt-1 truncate">{report.reason}</p>
            </div>
          </div>

          {report.customMessage && (
            <p className="text-xs text-muted-foreground line-clamp-2 italic px-1">
              "{report.customMessage}"
            </p>
          )}
        </div>
      </CardContent>

      {/* Card Footer actions */}
      <div className="px-5 pb-5 pt-0 mt-auto flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3 shrink-0" />
          <span>{renderDateField(report.createdAt)}</span>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={(e) => {
            e.stopPropagation();
            onView(report);
          }} 
          className="h-8 px-3 text-xs bg-card hover:bg-primary hover:text-primary-foreground hover:border-transparent transition-all duration-200 flex items-center gap-1 font-semibold group-hover:border-primary/50"
        >
          <Eye className="h-3.5 w-3.5" /> View
        </Button>
      </div>
    </Card>
  );
};
