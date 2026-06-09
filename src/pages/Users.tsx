import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Search, 
  Eye, 
  User as UserIcon,
  RefreshCw, 
  AlertTriangle,
  BookOpen,
  GraduationCap,
  Layers,
  FileCode,
  Youtube,
  Briefcase,
  Calendar,
  Hash,
  Activity,
  Award,
  Shield,
  Info,
  Sparkles,
  FileText,
  Upload,
  Copy,
  Check,
  X
} from 'lucide-react';

interface FirestoreUser {
  uid?: string;
  name?: string;
  email?: string;
  profileImageUrl?: string;
  branch?: string;
  semester?: string;
  role?: string;
  contributorLevel?: string;
  uploads?: number;
  notesUploads?: number;
  assignmentUploads?: number;
  pyqUploads?: number;
  cheatSheetUploads?: number;
  youtubeUploads?: number;
  createdAt?: any; // Timestamp or string/number
}

const getBranchInitials = (branch?: string): string => {
  if (!branch) return '—';
  const clean = branch.trim().toLowerCase();
  
  if (clean.includes('computer science engineering') || clean === 'cse') return 'CSE';
  if (clean.includes('computer science') || clean === 'cs') return 'CS';
  if (clean.includes('mechanical engineering') || clean === 'me' || clean === 'mechanical') return 'ME';
  if (clean.includes('electrical engineering') || clean === 'ee') return 'EE';
  if (clean.includes('electronics engineering') || clean === 'ece' || clean === 'electronics' || clean.includes('electronics & communication') || clean === 'ec') return 'EC';
  if (clean.includes('civil engineering') || clean === 'ce' || clean === 'civil') return 'CE';
  if (clean.includes('information technology') || clean === 'it') return 'IT';

  // Abbreviation fallback
  const words = branch.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    return words.map(w => w[0].toUpperCase()).join('');
  }
  return branch.substring(0, 3).toUpperCase();
};

const getSemesterNumber = (semester?: string): string => {
  if (!semester) return '—';
  const clean = semester.trim();
  const match = clean.match(/\d+/);
  return match ? match[0] : clean;
};

interface ToastState {
  message: string | null;
  type: 'success' | 'info' | 'error';
}

// Reusable user avatar component with strict priority fallbacks
const UserAvatar: React.FC<{ src?: string; name?: string; className?: string }> = ({ src, name, className }) => {
  const [hasError, setHasError] = useState(false);

  // Generate initials (e.g., "Pratyush Nishank" -> "PN", "Apoorva Deep" -> "AD", "John" -> "J")
  const getInitials = (userName?: string) => {
    if (!userName || userName.trim() === '') return '';
    const parts = userName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) {
      return parts[0].substring(0, 1).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(name);

  // Reset error state if the src image URL changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  return (
    <div className={`relative flex shrink-0 overflow-hidden rounded-full items-center justify-center font-bold select-none bg-primary/10 text-primary border border-primary/20 ${className || 'h-8 w-8 text-xs'}`}>
      {src && !hasError ? (
        <img
          src={src}
          alt={name || 'User'}
          onError={() => setHasError(true)}
          className="aspect-square h-full w-full object-cover"
        />
      ) : initials ? (
        <span>{initials}</span>
      ) : (
        <UserIcon className="h-1/2 w-1/2 text-primary" />
      )}
    </div>
  );
};

export const Users: React.FC = () => {
  const [users, setUsers] = useState<FirestoreUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<FirestoreUser | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Clipboard copy state
  const [copiedUid, setCopiedUid] = useState<string | null>(null);

  // Confirmation dialog state
  const [confirmAction, setConfirmAction] = useState<{
    type: 'warning' | 'delete';
    label: string;
    description: string;
  } | null>(null);

  // Toast Notification state
  const [toast, setToast] = useState<ToastState>({ message: null, type: 'success' });

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const fetchedUsers: FirestoreUser[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirestoreUser;
        fetchedUsers.push({
          ...data,
          uid: data.uid || doc.id
        });
      });
      setUsers(fetchedUsers);
    } catch (err: any) {
      console.error("Error fetching users collection from Firestore:", err);
      setError("Failed to fetch user directory from Firestore database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on query matching Name, Email, Branch, Semester, or UID
  const filteredUsers = users.filter((user) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = user.name?.toLowerCase().includes(q) || false;
    const emailMatch = user.email?.toLowerCase().includes(q) || false;
    const branchMatch = user.branch?.toLowerCase().includes(q) || false;
    const semesterMatch = user.semester?.toLowerCase().includes(q) || false;
    const uidMatch = user.uid?.toLowerCase().includes(q) || false;
    
    return nameMatch || emailMatch || branchMatch || semesterMatch || uidMatch;
  });

  // Safe helper to render fields or fallback UI
  const renderField = (value: any, label: string = 'Not Specified') => {
    if (value === undefined || value === null || value === '') {
      return (
        <span className="text-muted-foreground/50 italic text-xs font-normal" title={`${label} missing`}>
          —
        </span>
      );
    }
    return <span className="font-medium text-foreground">{value}</span>;
  };

  // Defensive Date formatter for createdAt
  const renderDateField = (createdAt: any) => {
    if (!createdAt) {
      return (
        <span className="text-muted-foreground/50 italic text-xs font-normal">
          —
        </span>
      );
    }
    try {
      // Check if it's a Firestore Timestamp with toDate method
      if (createdAt && typeof createdAt.toDate === 'function') {
        const date = createdAt.toDate();
        if (date instanceof Date && !isNaN(date.getTime())) {
          return <span>{date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>;
        }
      }
      
      // Check if it is a plain object with seconds property
      if (createdAt && typeof createdAt === 'object' && typeof createdAt.seconds === 'number') {
        const date = new Date(createdAt.seconds * 1000);
        if (!isNaN(date.getTime())) {
          return <span>{date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>;
        }
      }
      
      // Try to parse it as number or string
      const date = new Date(createdAt);
      if (!isNaN(date.getTime())) {
        return <span>{date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>;
      }
    } catch (e) {
      console.error("Error formatting date:", e);
    }
    return <span className="text-muted-foreground/50 italic text-xs font-normal">—</span>;
  };

  const handleOpenDetails = (user: FirestoreUser) => {
    setSelectedUser(user);
    setIsDetailOpen(true);
    setCopiedUid(null);
  };

  // Toast Trigger Helper
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => prev.message === message ? { ...prev, message: null } : prev);
    }, 3000);
  };

  // Clipboard copy handler
  const handleCopyUID = (uid: string) => {
    navigator.clipboard.writeText(uid).then(() => {
      setCopiedUid(uid);
      showToast("UID copied to clipboard!", "success");
      setTimeout(() => setCopiedUid(null), 2000);
    }).catch(err => {
      console.error("Could not copy text: ", err);
      showToast("Failed to copy UID", "error");
    });
  };

  // Trigger Confirmation dialog state
  const handleTriggerAction = (type: 'warning' | 'delete') => {
    const labels = {
      warning: 'Send Warning',
      delete: 'Delete User'
    };
    const descriptions = {
      warning: `Are you sure you want to send a warning to ${selectedUser?.name || 'this user'}? This will notify the user of policy violations.`,
      delete: `Are you sure you want to delete ${selectedUser?.name || 'this user'}? This will permanently remove their records from the platform.`
    };
    setConfirmAction({
      type,
      label: labels[type],
      description: descriptions[type]
    });
  };

  // Confirm demo action
  const handleConfirmAction = () => {
    if (!confirmAction) return;
    const messages = {
      warning: 'Warning sent (Demo)',
      delete: 'User deleted (Demo)'
    };
    showToast(messages[confirmAction.type], 'success');
    setConfirmAction(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-heading">Users Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage and view academic contributions, stats, and profile information of registered platform users.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsers} className="flex items-center gap-1.5 shrink-0 bg-card">
          <RefreshCw className="h-3.5 w-3.5" /> Reload Users
        </Button>
      </div>

      {/* Search Toolbar */}
      <Card className="border-border bg-card/50 backdrop-blur-sm shadow-premium">
        <CardContent className="p-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search user directory by name, email, branch, semester, or UID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-accent/20 border-border/80 focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-border overflow-hidden shadow-premium">
        <CardContent className="p-0">
          {loading ? (
            /* Table Loading Skeletons */
            <div className="p-8 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="h-4 w-28 bg-accent/60 rounded animate-pulse" />
                <div className="h-4 w-44 bg-accent/60 rounded animate-pulse" />
                <div className="h-4 w-32 bg-accent/60 rounded animate-pulse" />
                <div className="h-4 w-20 bg-accent/60 rounded animate-pulse" />
              </div>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-border/40 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-accent/60 animate-pulse" />
                    <div className="h-4 w-36 bg-accent/60 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-48 bg-accent/40 rounded animate-pulse" />
                  <div className="h-4 w-24 bg-accent/40 rounded animate-pulse" />
                  <div className="h-4 w-12 bg-accent/40 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : error ? (
            /* Table Error state */
            <div className="p-16 text-center flex flex-col items-center justify-center">
              <AlertTriangle className="h-12 w-12 text-destructive mb-3" />
              <h3 className="text-lg font-bold">Query Failure</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchUsers} className="mt-6">
                Retry Query
              </Button>
            </div>
          ) : filteredUsers.length === 0 ? (
            /* Empty state */
            <div className="p-16 text-center flex flex-col items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-accent/40 flex items-center justify-center mb-4">
                <UserIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold">No Users Found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                {users.length === 0 
                  ? "The users collection in Firestore appears to contain no documents." 
                  : "No users in the database match your search query."}
              </p>
              {searchQuery && (
                <Button variant="outline" size="sm" onClick={() => setSearchQuery('')} className="mt-6">
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            /* Responsive Data Table */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-accent/30 text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    <th className="p-4 w-12">Avatar</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4 w-24">Branch</th>
                    <th className="p-4 w-16 text-center">Sem</th>
                    <th className="p-4">Role</th>
                    <th className="p-4 w-24 text-center">Level</th>
                    <th className="p-4 text-center">Uploads</th>
                    <th className="p-4">Joined Date</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm whitespace-nowrap">
                  {filteredUsers.map((user) => (
                    <tr 
                      key={user.uid} 
                      className="hover:bg-accent/30 cursor-pointer transition-colors"
                      onClick={() => handleOpenDetails(user)}
                    >
                      <td className="p-4">
                        <UserAvatar 
                          src={user.profileImageUrl} 
                          name={user.name} 
                          className="h-8 w-8 text-xs bg-primary/10 text-primary border-primary/20"
                        />
                      </td>
                      <td className="p-4 font-semibold text-foreground/90 whitespace-nowrap">
                        {renderField(user.name, 'Name')}
                      </td>
                      <td className="p-4 text-muted-foreground whitespace-nowrap">
                        {renderField(user.email, 'Email')}
                      </td>
                      <td className="p-4 w-24 whitespace-nowrap font-medium text-foreground">
                        {user.branch ? getBranchInitials(user.branch) : <span className="text-muted-foreground/50 italic text-xs">—</span>}
                      </td>
                      <td className="p-4 w-16 text-center whitespace-nowrap font-medium text-foreground">
                        {getSemesterNumber(user.semester)}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {user.role ? (
                          <Badge variant={user.role === 'Administrator' ? 'default' : user.role === 'Moderator' ? 'secondary' : 'outline'}>
                            {user.role}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground/50 italic text-xs">—</span>
                        )}
                      </td>
                      <td className="p-4 w-24 text-center whitespace-nowrap">
                        {user.contributorLevel ? (
                          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/25 hover:bg-amber-500/20 mx-auto">
                            {user.contributorLevel}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground/50 italic text-xs">—</span>
                        )}
                      </td>
                      <td className="p-4 text-center font-semibold">
                        {user.uploads !== undefined ? user.uploads : <span className="text-muted-foreground/50 font-normal">—</span>}
                      </td>
                      <td className="p-4 text-xs text-muted-foreground whitespace-nowrap">
                        {renderDateField(user.createdAt)}
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 text-xs font-semibold flex items-center gap-1.5 text-primary hover:bg-primary/10 ml-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetails(user);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog Modal - Wider max-w-2xl class with height constraints and flex layout */}
      <Dialog isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} className="max-w-2xl max-h-[90vh] flex flex-col min-h-0">
        {selectedUser && (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Sticky Header Section */}
            <DialogHeader className="border-b border-border/80 pb-4 mb-4 text-left shrink-0 pr-8">
              <div className="flex items-start gap-4">
                {/* Profile Image / Initials fallback */}
                <UserAvatar 
                  src={selectedUser.profileImageUrl} 
                  name={selectedUser.name} 
                  className="h-16 w-16 text-lg"
                />
                
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 flex-wrap">
                    {selectedUser.name || <span className="text-muted-foreground/60 italic font-normal text-sm">No Name Provided</span>}
                    {selectedUser.role && (
                      <Badge className="text-[10px] py-0 px-2 uppercase font-extrabold tracking-wide">
                        {selectedUser.role}
                      </Badge>
                    )}
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{selectedUser.email || 'No email registered'}</p>
                  
                  {/* Contributor Level Badge */}
                  {selectedUser.contributorLevel && (
                    <div className="flex items-center gap-1 mt-2 text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full w-max">
                      <Award className="h-3 w-3" /> {selectedUser.contributorLevel}
                    </div>
                  )}
                </div>
              </div>
            </DialogHeader>

            {/* Scrollable Dialog Content Body */}
            <div className="flex-1 overflow-y-auto pr-2 py-1 space-y-6 select-text scrollbar-thin">
              {/* Profile Card & Academic Card Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Profile details */}
                <Card className="border-border bg-accent/15 p-4 flex flex-col justify-between space-y-3">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <UserIcon className="h-3 w-3" /> Profile Details
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Name</span>
                      <span className="font-semibold text-foreground">{renderField(selectedUser.name)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Email</span>
                      <span className="font-semibold text-foreground truncate block">{renderField(selectedUser.email)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-between bg-card/60 p-1.5 rounded border border-border/40">
                      <div className="min-w-0">
                        <span className="text-muted-foreground block text-[8px] uppercase tracking-wider font-semibold">UID</span>
                        <span className="font-mono text-[10px] text-foreground block truncate">{selectedUser.uid}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
                        onClick={() => handleCopyUID(selectedUser.uid || '')}
                        title="Copy UID"
                      >
                        {copiedUid === selectedUser.uid ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Academic details */}
                <Card className="border-border bg-accent/15 p-4 flex flex-col justify-between space-y-3">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Briefcase className="h-3 w-3" /> Academic Information
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Branch</span>
                      <span className="font-semibold text-foreground">{renderField(selectedUser.branch)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Semester</span>
                      <span className="font-semibold text-foreground">
                        {selectedUser.semester ? (
                          selectedUser.semester.toLowerCase().includes('semester') 
                            ? selectedUser.semester.replace(/semester/i, 'Sem') 
                            : `Sem ${getSemesterNumber(selectedUser.semester)}`
                        ) : '—'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Clearance</span>
                        <span className="font-semibold text-foreground block mt-0.5">{renderField(selectedUser.role)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Joined Date</span>
                        <span className="font-semibold text-foreground block mt-0.5 text-[10px]">{renderDateField(selectedUser.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Contribution Breakdown */}
              <div className="space-y-3">
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Info className="h-3.5 w-3.5" /> Contribution Statistics
                </h3>
                
                <div className="grid grid-cols-3 gap-2.5">
                  {/* Notes Uploads */}
                  <div className="bg-card border border-border/80 rounded-xl p-3 text-center shadow-sm">
                    <FileText className="h-4 w-4 text-indigo-500 mx-auto mb-1" />
                    <span className="text-[9px] text-muted-foreground block truncate font-medium">Notes</span>
                    <span className="text-lg font-bold text-foreground mt-0.5 block">
                      {selectedUser.notesUploads !== undefined ? selectedUser.notesUploads : <span className="text-muted-foreground/50 font-normal">—</span>}
                    </span>
                  </div>

                  {/* Assignment Uploads */}
                  <div className="bg-card border border-border/80 rounded-xl p-3 text-center shadow-sm">
                    <GraduationCap className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
                    <span className="text-[9px] text-muted-foreground block truncate font-medium">Assignments</span>
                    <span className="text-lg font-bold text-foreground mt-0.5 block">
                      {selectedUser.assignmentUploads !== undefined ? selectedUser.assignmentUploads : <span className="text-muted-foreground/50 font-normal">—</span>}
                    </span>
                  </div>

                  {/* PYQ Uploads */}
                  <div className="bg-card border border-border/80 rounded-xl p-3 text-center shadow-sm">
                    <Layers className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                    <span className="text-[9px] text-muted-foreground block truncate font-medium">PYQs</span>
                    <span className="text-lg font-bold text-foreground mt-0.5 block">
                      {selectedUser.pyqUploads !== undefined ? selectedUser.pyqUploads : <span className="text-muted-foreground/50 font-normal">—</span>}
                    </span>
                  </div>

                  {/* Cheat Sheet Uploads */}
                  <div className="bg-card border border-border/80 rounded-xl p-3 text-center shadow-sm">
                    <FileCode className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                    <span className="text-[9px] text-muted-foreground block truncate font-medium">Cheatsheets</span>
                    <span className="text-lg font-bold text-foreground mt-0.5 block">
                      {selectedUser.cheatSheetUploads !== undefined ? selectedUser.cheatSheetUploads : <span className="text-muted-foreground/50 font-normal">—</span>}
                    </span>
                  </div>

                  {/* Video Uploads */}
                  <div className="bg-card border border-border/80 rounded-xl p-3 text-center shadow-sm">
                    <Youtube className="h-4 w-4 text-rose-500 mx-auto mb-1" />
                    <span className="text-[9px] text-muted-foreground block truncate font-medium">YouTube</span>
                    <span className="text-lg font-bold text-foreground mt-0.5 block">
                      {selectedUser.youtubeUploads !== undefined ? selectedUser.youtubeUploads : <span className="text-muted-foreground/50 font-normal">—</span>}
                    </span>
                  </div>

                  {/* Total Uploads */}
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-center relative overflow-hidden shadow-sm">
                    <Upload className="h-4 w-4 text-primary mx-auto mb-1" />
                    <span className="text-[9px] text-primary/80 font-bold block truncate">Total Uploads</span>
                    <span className="text-lg font-extrabold text-primary mt-0.5 block">
                      {selectedUser.uploads !== undefined ? selectedUser.uploads : <span className="text-muted-foreground/50 font-normal">—</span>}
                    </span>
                  </div>
                </div>
              </div>

              {/* Admin Actions Section (Demo Only) */}
              <div className="space-y-2.5 pt-4 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5" /> Administrative Actions (Demo)
                  </h3>
                  <span className="text-[9px] text-muted-foreground/80 italic font-medium">
                    Demo Action — No database changes will occur.
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs font-bold border-orange-500/35 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 h-10 w-full"
                    onClick={() => handleTriggerAction('warning')}
                  >
                    Send Warning
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white h-10 w-full"
                    onClick={() => handleTriggerAction('delete')}
                  >
                    Delete User
                  </Button>
                </div>
              </div>
            </div>

            {/* Sticky Action Footer Section */}
            <DialogFooter className="mt-4 border-t border-border/60 pt-4 shrink-0">
              <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(false)} className="w-full sm:w-auto">
                Close Panel
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>

      {/* Confirmation Dialog Sub-Modal */}
      <Dialog isOpen={confirmAction !== null} onClose={() => setConfirmAction(null)}>
        {confirmAction && (
          <div className="space-y-4">
            <DialogHeader className="text-left">
              <div className="flex items-center gap-2 text-orange-500 mb-1">
                <AlertTriangle className="h-5 w-5" />
                <DialogTitle className="text-lg font-bold">Confirm Administrative Action</DialogTitle>
              </div>
              <DialogDescription className="text-sm mt-1.5 text-muted-foreground leading-relaxed">
                {confirmAction.description}
              </DialogDescription>
            </DialogHeader>
            
            <div className="bg-orange-500/10 border border-orange-500/25 rounded-xl p-3 text-[11px] text-orange-700 dark:text-orange-400">
              <span className="font-bold">Demo Notice:</span> No database writes or modifications will be dispatched to Firestore.
            </div>
            
            <DialogFooter className="mt-4">
              <Button variant="ghost" size="sm" onClick={() => setConfirmAction(null)}>
                Cancel
              </Button>
              <Button 
                size="sm" 
                variant={confirmAction.type === 'delete' ? 'destructive' : 'default'} 
                onClick={handleConfirmAction}
                className={confirmAction.type === 'warning' ? 'bg-orange-500 hover:bg-orange-600 text-white border-0' : ''}
              >
                Confirm
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>

      {/* Premium Toast/Snackbar Notification */}
      {toast.message && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-foreground text-background dark:bg-card dark:text-foreground px-4 py-3.5 rounded-xl shadow-2xl border border-border/80 animate-fade-in max-w-sm">
          <Sparkles className="h-4 w-4 shrink-0 text-primary animate-pulse" />
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}
    </div>
  );
};
