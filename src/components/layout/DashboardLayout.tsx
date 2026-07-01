import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { reportService } from '@/services/reportService';
import { Report } from '@/types/report';
import {
  LayoutDashboard,
  FileText,
  FileCode,
  GraduationCap,
  Layers,
  Users as UsersIcon,
  Settings as SettingsIcon,
  Menu,
  X,
  Bell,
  Search,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Command,
  Video,
  Flag
} from 'lucide-react';

const formatRelativeTime = (val: any): string => {
  if (!val) return '—';
  try {
    let date: Date;
    if (typeof val.toDate === 'function') {
      date = val.toDate();
    } else if (typeof val.seconds === 'number') {
      date = new Date(val.seconds * 1000);
    } else {
      date = new Date(val);
    }
    
    if (isNaN(date.getTime())) return '—';
    
    const diffMs = Date.now() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);
    
    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${diffDay}d ago`;
  } catch (e) {
    return '—';
  }
};

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: authUser, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Pending reports list for real-time count badges & notifications popover dropdown
  const [pendingReports, setPendingReports] = useState<Report[]>([]);

  useEffect(() => {
    const unsubscribe = reportService.subscribeToPendingReports(
      (data) => {
        setPendingReports(data);
      },
      (error) => {
        console.error("Failed to fetch pending reports for notification badge & list:", error);
      }
    );
    return () => unsubscribe();
  }, []);

  const pendingCount = pendingReports.length;

  // Unread reports state (in-memory per session)
  const [readReportIds, setReadReportIds] = useState<Set<string>>(new Set());
  
  // Calculate unread count (where ID is not in readReportIds)
  const unreadCount = pendingReports.filter(r => !readReportIds.has(r.id)).length;

  // Popover toggle state
  const [notifOpen, setNotifOpen] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.notification-container')) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [notifOpen]);

  // Mark all current visible reports as read
  const handleMarkAllAsRead = () => {
    const newReadIds = new Set(readReportIds);
    pendingReports.forEach(r => newReadIds.add(r.id));
    setReadReportIds(newReadIds);
  };

  // Dynamic user data from Firebase Auth
  const user = {
    name: authUser?.displayName || 'Administrator',
    email: authUser?.email || 'admin@notessharing.com',
    role: 'Platform Admin',
    avatarUrl: authUser?.photoURL || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  };

  const navItems: SidebarItem[] = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { name: 'Notes', path: '/notes', icon: <FileText className="h-4 w-4" /> },
    { name: 'Assignments', path: '/assignments', icon: <GraduationCap className="h-4 w-4" /> },
    { name: 'PYQs', path: '/pyqs', icon: <Layers className="h-4 w-4" /> },
    { name: 'Videos', path: '/videos', icon: <Video className="h-4 w-4" /> },
    { name: 'Cheatsheets', path: '/cheatsheets', icon: <FileCode className="h-4 w-4" /> },
    { name: 'Reports', path: '/reports', icon: <Flag className="h-4 w-4" /> },
    { name: 'Users', path: '/users', icon: <UsersIcon className="h-4 w-4" /> },
    { name: 'Settings', path: '/settings', icon: <SettingsIcon className="h-4 w-4" /> },
  ];

  // Get title of current page from route
  const getPageTitle = () => {
    const currentPath = location.pathname;
    const matchedItem = navItems.find((item) => item.path === currentPath);
    return matchedItem ? matchedItem.name : 'Dashboard';
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex transition-colors duration-200">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-card border-r border-border flex flex-col justify-between transition-all duration-300 ease-in-out lg:static
          ${sidebarOpen ? 'w-64' : 'w-16'}
          ${mobileSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Sidebar Header */}
        <div>
          <div className="h-16 flex items-center justify-between px-4 border-b border-border">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-md shrink-0">
                <Sparkles className="h-4 w-4 animate-pulse" />
              </div>
              {sidebarOpen && (
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent truncate font-heading">
                  NotesSharing
                </span>
              )}
            </div>
            
            {/* Collapse button on large viewports */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
            
            {/* Close button on mobile viewports */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative
                  ${isActive 
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/10' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                  }
                `}
                onClick={() => setMobileSidebarOpen(false)}
              >
                <div className="shrink-0 relative">
                  {item.icon}
                  {/* Collapsed Sidebar: Pulsing Red Dot overlay for reports */}
                  {!sidebarOpen && item.name === 'Reports' && pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                  )}
                </div>
                {sidebarOpen && <span className="truncate">{item.name}</span>}
                
                {/* Open Sidebar: Numeric badge count for pending reports */}
                {sidebarOpen && item.name === 'Reports' && pendingCount > 0 && (
                  <span className="ml-auto bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm animate-fade-in shrink-0">
                    {pendingCount}
                  </span>
                )}

                {!sidebarOpen && (
                  <span className="absolute left-14 bg-popover text-popover-foreground text-xs font-semibold px-2 py-1 rounded shadow-premium border border-border opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap flex items-center gap-1.5">
                    {item.name}
                    {item.name === 'Reports' && pendingCount > 0 && (
                      <span className="bg-red-600 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
                        {pendingCount}
                      </span>
                    )}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer (User card) */}
        <div className="p-3 border-t border-border">
          {sidebarOpen ? (
            <div className="bg-accent/40 rounded-xl p-3 border border-border/50 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Avatar src={user.avatarUrl} fallback={user.name} />
                <div className="overflow-hidden min-w-0">
                  <p className="text-sm font-semibold truncate leading-tight">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate leading-none mt-1">{user.role}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs py-1.5 h-auto flex gap-2 font-medium"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-1">
              <Avatar src={user.avatarUrl} fallback={user.name} className="h-8 w-8 cursor-pointer" onClick={() => navigate('/settings')} />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Workspace Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Sticky Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6 sticky top-0 bg-background/80 backdrop-blur-md z-30">
          <div className="flex items-center gap-4">
            {/* Hamburger on mobile/tablet */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden h-9 w-9 text-muted-foreground"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            {/* Breadcrumb / Title */}
            <div>
              <h1 className="font-bold text-lg tracking-tight font-heading capitalize">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          {/* Quick Actions & System Info */}
          <div className="flex items-center gap-3">
            {/* Modern Search Bar mockup */}
            <div className="relative hidden md:block w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search command..."
                className="h-9 w-full bg-accent/40 rounded-lg pl-9 pr-10 text-xs border border-border/80 focus:outline-none focus:ring-1 focus:ring-ring focus:bg-background transition-all"
              />
              <span className="absolute right-3 top-2 flex items-center gap-0.5 text-[9px] font-semibold text-muted-foreground bg-accent px-1.5 py-0.5 rounded border border-border pointer-events-none">
                <Command className="h-2 w-2" /> K
              </span>
            </div>

            {/* Notification bell Popover */}
            <div className="relative notification-container">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setNotifOpen(!notifOpen)}
                className={`h-9 w-9 text-muted-foreground hover:text-foreground relative ${notifOpen ? 'bg-accent/60 text-foreground' : ''}`}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-background animate-pulse shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </Button>

              {notifOpen && (
                <div className="absolute right-0 top-12 w-80 bg-card border border-border rounded-xl shadow-2xl z-50 flex flex-col max-h-[420px] overflow-hidden animate-scale-in">
                  {/* Dropdown Header */}
                  <div className="p-3 border-b border-border bg-accent/20 flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Bell className="h-3.5 w-3.5 text-primary" /> Reports Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-red-600/10 border border-red-500/25 text-red-400 font-bold px-2 py-0.5 rounded-full">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>

                  {/* Dropdown Items list */}
                  <div className="flex-1 overflow-y-auto divide-y divide-border/60 scrollbar-thin">
                    {pendingReports.length === 0 ? (
                      <div className="p-8 text-center text-xs text-muted-foreground italic flex flex-col items-center justify-center gap-2">
                        <Flag className="h-6 w-6 text-muted-foreground/40" />
                        No pending reports
                      </div>
                    ) : (
                      pendingReports.slice(0, 5).map((report) => {
                        const isUnread = !readReportIds.has(report.id);
                        
                        // Icon mapping
                        const renderNotifIcon = (type?: string) => {
                          const t = (type || '').trim().toLowerCase();
                          switch (t) {
                            case 'notes': return <FileText className="h-4 w-4 text-violet-400" />;
                            case 'assignments': return <GraduationCap className="h-4 w-4 text-blue-400" />;
                            case 'pyqs': return <Layers className="h-4 w-4 text-emerald-400" />;
                            case 'cheatsheets': return <FileCode className="h-4 w-4 text-amber-400" />;
                            case 'videos': return <Video className="h-4 w-4 text-rose-400" />;
                            default: return <FileText className="h-4 w-4 text-zinc-400" />;
                          }
                        };

                        return (
                          <div 
                            key={report.id}
                            onClick={() => {
                              // Mark this specific report as read
                              const newReadIds = new Set(readReportIds);
                              newReadIds.add(report.id);
                              setReadReportIds(newReadIds);
                              
                              setNotifOpen(false);
                              navigate(`/reports?search=${encodeURIComponent(report.id)}`);
                            }}
                            className={`p-3 text-left hover:bg-accent/40 cursor-pointer transition-colors flex gap-3 relative ${isUnread ? 'bg-red-500/[0.02]' : ''}`}
                          >
                            {/* Unread Highlight dot */}
                            {isUnread && (
                              <span className="absolute top-4 right-4 h-1.5 w-1.5 bg-red-500 rounded-full" />
                            )}

                            {/* Icon fallback or thumbnail */}
                            <div className="h-9 w-9 border border-border bg-accent/20 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                              {report.resourceThumbnail ? (
                                <img src={report.resourceThumbnail} alt="" className="h-full w-full object-cover" />
                              ) : (
                                renderNotifIcon(report.resourceType)
                              )}
                            </div>

                            {/* Metadata */}
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <p className="text-[11px] font-bold text-foreground leading-snug truncate" title={report.resourceTitle}>
                                {report.resourceTitle || 'Untitled Resource'}
                              </p>
                              <p className="text-[10px] text-red-400 font-bold truncate">
                                ⚠ {report.reason}
                              </p>
                              <div className="flex items-center justify-between gap-2 pt-0.5 text-[9px] text-muted-foreground font-semibold">
                                <span className="truncate">Reporter: {report.reporterName || 'Anonymous'}</span>
                                <span className="shrink-0">{formatRelativeTime(report.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Dropdown Footer */}
                  {pendingReports.length > 0 && (
                    <div className="p-2 border-t border-border bg-accent/10 flex justify-between gap-2 items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          handleMarkAllAsRead();
                          setNotifOpen(false);
                          navigate('/reports');
                        }}
                        className="w-full text-[10px] font-bold text-primary hover:bg-primary/10 h-7 flex items-center justify-center gap-1"
                      >
                        View All Reports →
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>


          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 overflow-y-auto p-6 bg-accent/10 focus:outline-none">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
