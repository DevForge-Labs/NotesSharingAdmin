import React, { useState, useEffect } from 'react';
import { reportService } from '@/services/reportService';
import { Report } from '@/types/report';
import { ReportCard } from '@/components/ReportCard';
import { ReportDetails } from '@/components/ReportDetails';
import { Card, CardContent } from '@/components/ui/card';
import { useResourceDeepLink } from '@/hooks/useResourceDeepLink';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Flag, 
  Search, 
  RefreshCw, 
  AlertTriangle,
  Info,
  Sparkles
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [indexError, setIndexError] = useState<boolean>(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Toast feedback state
  const [toast, setToast] = useState<{ message: string | null; type: 'success' | 'info' | 'error' }>({ message: null, type: 'success' });

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

  // Establish real-time reports listener
  const setupListener = () => {
    setLoading(true);
    setError(null);
    setIndexError(false);

    const unsubscribe = reportService.subscribeToPendingReports(
      (data) => {
        setReports(data);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore reports listener error:", err);
        // Detect composite index missing error
        if (err.code === 'failed-precondition' || err.message?.includes('index')) {
          setIndexError(true);
          setError("This query requires a Firestore composite index. You can create it by clicking the link printed in the browser developer console (Press F12 / inspect).");
        } else {
          setError(err.message || "Failed to fetch reports. Check your firebase configuration and permissions.");
        }
        setLoading(false);
      }
    );

    return unsubscribe;
  };

  useEffect(() => {
    const unsubscribe = setupListener();
    return () => unsubscribe();
  }, []);

  const handleOpenDetails = (report: Report) => {
    setSelectedReport(report);
    setIsDetailOpen(true);
  };

  useResourceDeepLink(loading, reports, handleOpenDetails);

  // Filter logic
  const filteredReports = reports.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    const titleMatch = (item.resourceTitle || '').toLowerCase().includes(q);
    const reasonMatch = (item.reason || '').toLowerCase().includes(q);
    const reporterMatch = (item.reporterName || '').toLowerCase().includes(q);
    const uploaderMatch = (item.uploaderName || '').toLowerCase().includes(q);
    const typeMatch = (item.resourceType || '').toLowerCase().includes(q);
    const idMatch = (item.resourceId || '').toLowerCase() === q || item.id?.toLowerCase() === q;

    return titleMatch || reasonMatch || reporterMatch || uploaderMatch || typeMatch || idMatch;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative">
          <div className="absolute -left-3 top-0.5 bottom-0.5 w-1 bg-gradient-to-b from-red-500 to-red-500/10 rounded-full" />
          <h2 className="text-2xl font-bold tracking-tight font-heading pl-3">Moderation Reports</h2>
          <p className="text-sm text-muted-foreground pl-3">
            Review and moderate student-submitted resource uploads reported by users.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={setupListener} className="flex items-center gap-1.5 bg-card">
            <RefreshCw className="h-3.5 w-3.5" /> Reload Reports
          </Button>
        </div>
      </div>

      {/* Search Toolbar */}
      <Card className="border-border bg-card/50 backdrop-blur-sm shadow-premium">
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search reports by title, reason, uploader, reporter, resource type or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-accent/40 hover:bg-accent/60 border-border/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
            />
          </div>
        </CardContent>
      </Card>

      {/* Main Reports List Area */}
      {loading ? (
        /* Loading skeleton list */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border bg-card/50 shadow-premium animate-pulse">
              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="h-5 w-16 bg-accent/80 rounded animate-pulse" />
                  <div className="h-5 w-14 bg-accent/80 rounded animate-pulse" />
                </div>
                <div className="flex gap-3">
                  <div className="h-14 w-14 bg-accent/80 rounded-lg shrink-0 animate-pulse" />
                  <div className="space-y-2 flex-1 pt-1">
                    <div className="h-4 w-3/4 bg-accent/80 rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-accent/60 rounded animate-pulse" />
                  </div>
                </div>
                <div className="pt-3 border-t border-border/20 space-y-2">
                  <div className="h-12 bg-accent/40 rounded-lg animate-pulse" />
                </div>
                <div className="flex justify-between pt-2">
                  <div className="h-4 w-24 bg-accent/60 rounded animate-pulse" />
                  <div className="h-8 w-16 bg-accent/80 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        /* Error details box */
        <Card className="border-red-500/20 bg-red-500/5 shadow-premium">
          <CardContent className="p-8 text-center flex flex-col items-center justify-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-3 animate-bounce" />
            <h3 className="text-lg font-bold text-foreground">Query Failed</h3>
            <p className="text-sm text-muted-foreground max-w-xl mt-2 leading-relaxed">{error}</p>
            {indexError && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 max-w-lg text-left flex gap-2">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Firestore queries with equality filters combined with sorting require a composite index. Check your browser console log for a direct link to generate it automatically.
                </span>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={setupListener} className="mt-6 border-red-500/30 hover:bg-red-500/10">
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      ) : filteredReports.length === 0 ? (
        /* Empty State */
        <Card className="border-border bg-card/40 shadow-premium">
          <CardContent className="p-16 text-center flex flex-col items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-accent/40 flex items-center justify-center mb-4 text-muted-foreground">
              <Flag className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold">No Pending Reports</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              {reports.length === 0 
                ? "Excellent! All submitted user reports are currently resolved or dismissed." 
                : "No pending reports match your search criteria."}
            </p>
            {searchQuery && (
              <Button variant="outline" size="sm" onClick={() => setSearchQuery('')} className="mt-6 bg-card">
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Grid Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {filteredReports.map((report) => (
            <ReportCard 
              key={report.id} 
              report={report} 
              onView={handleOpenDetails} 
            />
          ))}
        </div>
      )}

      {/* Report details dialog */}
      <Dialog isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} className="max-w-2xl max-h-[95vh] flex flex-col min-h-0">
        {selectedReport && (
          <div className="flex flex-col flex-1 min-h-0">
            <DialogHeader className="border-b border-border/80 pb-4 mb-4 text-left shrink-0 pr-8">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl border shrink-0 bg-red-500/10 text-red-500 border-red-500/20">
                  <Flag className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 flex-wrap">
                    Report Moderation Review
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Review and verify details of reported material.
                  </p>
                </div>
              </div>
            </DialogHeader>

            <ReportDetails 
              report={selectedReport} 
              onClose={() => setIsDetailOpen(false)} 
              showToast={showToast}
            />
          </div>
        )}
      </Dialog>

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
export default ReportsPage;
