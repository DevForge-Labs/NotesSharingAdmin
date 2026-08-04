import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
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
  GraduationCap,
  Layers,
  FileCode,
  Youtube,
  Briefcase,
  Shield,
  Info,
  Sparkles,
  FileText,
  Upload,
  Copy,
  Check,
  Loader2,
  Lock,
  UserCheck,
  UserX,
  ShieldAlert,
  ShieldCheck,
  Trash2
} from 'lucide-react';

import { Roles, RoleType } from '@/constants/roles';
import { AccountStatus, AccountStatusType } from '@/constants/accountStatus';
import { 
  setUserRoleCallable, 
  disableUserCallable, 
  enableUserCallable, 
  deleteAuthAccountCallable,
  bootstrapAdminClaimsCallable 
} from '@/services/functionsService';

interface FirestoreUser {
  uid?: string;
  name?: string;
  email?: string;
  college?: string;
  branch?: string;
  semester?: string;
  role?: string;
  accountStatus?: string;
  profileImageUrl?: string;
  contributorLevel?: number;
  totalUploads?: number;
  notesUploads?: number;
  assignmentUploads?: number;
  pyqUploads?: number;
  cheatSheetUploads?: number;
  youtubeResourceUploads?: number;
  disabledReason?: string;
  disabledBy?: string;
  createdAt?: any;
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

const UserAvatar: React.FC<{ src?: string; name?: string; className?: string }> = ({ src, name, className }) => {
  const [hasError, setHasError] = useState(false);

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
  const { user: currentUser, isSuperAdmin } = useAuth();

  const [users, setUsers] = useState<FirestoreUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<FirestoreUser | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  const [copiedUid, setCopiedUid] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({ message: null, type: 'success' });

  // Action Dialog states
  const [actionModal, setActionModal] = useState<{
    type: 'ROLE_CHANGE' | 'DISABLE' | 'ENABLE' | 'DELETE_AUTH';
    targetRole?: RoleType;
    title: string;
    description: string;
  } | null>(null);

  const [actionReason, setActionReason] = useState<string>('');
  const [deleteConfirmationWord, setDeleteConfirmationWord] = useState<string>('');
  const [isActionProcessing, setIsActionProcessing] = useState<boolean>(false);
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const fetchedUsers: FirestoreUser[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as FirestoreUser;
        fetchedUsers.push({
          ...data,
          uid: data.uid || docSnap.id
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

  const filteredUsers = users.filter((user) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = user.name?.toLowerCase().includes(q) || false;
    const emailMatch = user.email?.toLowerCase().includes(q) || false;
    const branchMatch = user.branch?.toLowerCase().includes(q) || false;
    const collegeMatch = user.college?.toLowerCase().includes(q) || false;
    const semesterMatch = user.semester?.toLowerCase().includes(q) || false;
    const uidMatch = user.uid?.toLowerCase().includes(q) || false;
    
    return nameMatch || emailMatch || branchMatch || collegeMatch || semesterMatch || uidMatch;
  });

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

  const renderDateField = (createdAt: any) => {
    if (!createdAt) return <span className="text-muted-foreground/50 italic text-xs font-normal">—</span>;
    try {
      if (createdAt && typeof createdAt.toDate === 'function') {
        const date = createdAt.toDate();
        if (date instanceof Date && !isNaN(date.getTime())) {
          return <span>{date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>;
        }
      }
      if (createdAt && typeof createdAt === 'object' && typeof createdAt.seconds === 'number') {
        const date = new Date(createdAt.seconds * 1000);
        if (!isNaN(date.getTime())) {
          return <span>{date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>;
        }
      }
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

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => prev.message === message ? { ...prev, message: null } : prev);
    }, 3500);
  };

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

  const handleBootstrapClaims = async () => {
    setIsBootstrapping(true);
    try {
      const res = await bootstrapAdminClaimsCallable();
      showToast(res.message || "Bootstrap migration executed!", "success");
      fetchUsers();
    } catch (err: any) {
      console.error("Bootstrap claims failed:", err);
      showToast(err.message || "Failed to execute bootstrap claims", "error");
    } finally {
      setIsBootstrapping(false);
    }
  };

  const handleOpenActionModal = (
    type: 'ROLE_CHANGE' | 'DISABLE' | 'ENABLE' | 'DELETE_AUTH',
    targetRole?: RoleType
  ) => {
    if (!selectedUser) return;
    setActionReason('');
    setDeleteConfirmationWord('');

    const userTitle = selectedUser.name || selectedUser.email || 'this account';

    if (type === 'ROLE_CHANGE' && targetRole) {
      const roleTitles: Record<RoleType, string> = {
        user: 'Demote to Regular User',
        admin: 'Promote to Administrator',
        superadmin: 'Promote to SuperAdmin'
      };
      const roleDescs: Record<RoleType, string> = {
        user: `Are you sure you want to demote ${userTitle} to a regular User? Administrative privileges will be revoked.`,
        admin: `Are you sure you want to promote ${userTitle} to an Admin? This user will gain access to upload and moderate content.`,
        superadmin: `Are you sure you want to promote ${userTitle} to a SuperAdmin? This user will gain FULL administrative privileges across the platform.`
      };

      setActionModal({
        type,
        targetRole,
        title: roleTitles[targetRole],
        description: roleDescs[targetRole]
      });
    } else if (type === 'DISABLE') {
      setActionModal({
        type,
        title: 'Disable User Account',
        description: `Suspend ${userTitle}'s account? The user will be signed out and unable to log in until re-enabled. All uploaded resources remain publicly accessible.`
      });
    } else if (type === 'ENABLE') {
      setActionModal({
        type,
        title: 'Re-enable User Account',
        description: `Restore ${userTitle}'s account access? The user will be able to log in again normally.`
      });
    } else if (type === 'DELETE_AUTH') {
      setActionModal({
        type,
        title: 'Delete Authentication Account (Permanent)',
        description: `PERMANENT ACTION: Delete ${userTitle}'s Firebase Authentication record? The user will NEVER be able to sign in again. Uploaded resources remain intact.`
      });
    }
  };

  const handleExecuteAction = async () => {
    if (!actionModal || !selectedUser || !selectedUser.uid) return;

    if (actionModal.type === 'DISABLE' && !actionReason.trim()) {
      showToast("Please provide a reason for disabling this account.", "error");
      return;
    }

    if (actionModal.type === 'DELETE_AUTH' && deleteConfirmationWord.trim().toUpperCase() !== 'DELETE') {
      showToast("Please type DELETE to confirm permanent account deletion.", "error");
      return;
    }

    setIsActionProcessing(true);
    const targetUid = selectedUser.uid;

    try {
      if (actionModal.type === 'ROLE_CHANGE' && actionModal.targetRole) {
        const res = await setUserRoleCallable({
          targetUid,
          targetRole: actionModal.targetRole,
          reason: actionReason.trim()
        });
        showToast(res.message || `Role updated to ${actionModal.targetRole}`, 'success');
      } else if (actionModal.type === 'DISABLE') {
        const res = await disableUserCallable({
          targetUid,
          reason: actionReason.trim()
        });
        showToast(res.message || "User account disabled successfully.", 'success');
      } else if (actionModal.type === 'ENABLE') {
        const res = await enableUserCallable({
          targetUid,
          reason: actionReason.trim()
        });
        showToast(res.message || "User account re-enabled successfully.", 'success');
      } else if (actionModal.type === 'DELETE_AUTH') {
        const res = await deleteAuthAccountCallable({
          targetUid,
          reason: actionReason.trim()
        });
        showToast(res.message || "Firebase Auth account permanently deleted.", 'success');
      }

      setActionModal(null);
      setIsDetailOpen(false);
      fetchUsers();
    } catch (err: any) {
      console.error("Administrative operation failed:", err);
      showToast(err.message || "Operation failed", 'error');
    } finally {
      setIsActionProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-heading">Users Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage academic profiles, role hierarchy (User ↔ Admin ↔ SuperAdmin), and account statuses.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isSuperAdmin && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBootstrapClaims}
              disabled={isBootstrapping}
              className="flex items-center gap-1.5 bg-violet-500/10 border-violet-500/30 text-violet-400 hover:bg-violet-500/20"
            >
              {isBootstrapping ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
              Bootstrap Admin Claims
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading} className="flex items-center gap-1.5 bg-card">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Reload Users
          </Button>
        </div>
      </div>

      {/* Search Toolbar */}
      <Card className="border-border bg-card/50 backdrop-blur-sm shadow-premium">
        <CardContent className="p-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search user directory by name, email, college, branch, semester, or UID..."
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
            <div className="p-16 text-center flex flex-col items-center justify-center">
              <AlertTriangle className="h-12 w-12 text-destructive mb-3" />
              <h3 className="text-lg font-bold">Query Failure</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchUsers} className="mt-6">
                Retry Query
              </Button>
            </div>
          ) : filteredUsers.length === 0 ? (
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
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-accent/30 text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    <th className="p-4 w-12">Avatar</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">College</th>
                    <th className="p-4 w-20">Branch</th>
                    <th className="p-4 w-16 text-center">Sem</th>
                    <th className="p-4">Role</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Uploads</th>
                    <th className="p-4">Joined Date</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm whitespace-nowrap">
                  {filteredUsers.map((userItem) => {
                    const statusVal = userItem.accountStatus || AccountStatus.ACTIVE;
                    const roleVal = (userItem.role || Roles.USER).toLowerCase();

                    return (
                      <tr 
                        key={userItem.uid} 
                        className="hover:bg-accent/30 cursor-pointer transition-colors"
                        onClick={() => handleOpenDetails(userItem)}
                      >
                        <td className="p-4">
                          <UserAvatar 
                            src={userItem.profileImageUrl} 
                            name={userItem.name} 
                            className="h-8 w-8 text-xs bg-primary/10 text-primary border-primary/20"
                          />
                        </td>
                        <td className="p-4 font-semibold text-foreground/90 whitespace-nowrap">
                          {renderField(userItem.name, 'Name')}
                        </td>
                        <td className="p-4 text-muted-foreground whitespace-nowrap">
                          {renderField(userItem.email, 'Email')}
                        </td>
                        <td className="p-4 font-medium text-foreground uppercase text-xs">
                          {renderField(userItem.college, 'College')}
                        </td>
                        <td className="p-4 w-20 whitespace-nowrap font-medium text-foreground">
                          {userItem.branch ? getBranchInitials(userItem.branch) : <span className="text-muted-foreground/50 italic text-xs">—</span>}
                        </td>
                        <td className="p-4 w-16 text-center whitespace-nowrap font-medium text-foreground">
                          {getSemesterNumber(userItem.semester)}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          {roleVal === Roles.SUPERADMIN ? (
                            <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30 font-bold uppercase tracking-wider text-[10px]">
                              SuperAdmin
                            </Badge>
                          ) : roleVal === Roles.ADMIN ? (
                            <Badge className="bg-violet-500/15 text-violet-400 border-violet-500/30 font-bold uppercase tracking-wider text-[10px]">
                              Admin
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              User
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                          {statusVal === AccountStatus.DISABLED ? (
                            <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 font-bold text-[10px]">
                              Disabled
                            </Badge>
                          ) : statusVal === AccountStatus.AUTH_DELETED ? (
                            <Badge className="bg-red-500/15 text-red-400 border-red-500/30 font-bold text-[10px]">
                              Auth Deleted
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-bold text-[10px]">
                              Active
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 text-center font-semibold">
                          {userItem.totalUploads !== undefined ? userItem.totalUploads : <span className="text-muted-foreground/50 font-normal">—</span>}
                        </td>
                        <td className="p-4 text-xs text-muted-foreground whitespace-nowrap">
                          {renderDateField(userItem.createdAt)}
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-xs font-semibold flex items-center gap-1.5 text-primary hover:bg-primary/10 ml-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetails(userItem);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Modal */}
      <Dialog isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} className="max-w-2xl max-h-[90vh] flex flex-col min-h-0">
        {selectedUser && (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Sticky Header Section */}
            <DialogHeader className="border-b border-border/80 pb-4 mb-4 text-left shrink-0 pr-8">
              <div className="flex items-start gap-4">
                <UserAvatar 
                  src={selectedUser.profileImageUrl} 
                  name={selectedUser.name} 
                  className="h-16 w-16 text-lg"
                />
                
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 flex-wrap">
                    {selectedUser.name || <span className="text-muted-foreground/60 italic font-normal text-sm">No Name Provided</span>}
                    {(selectedUser.role || Roles.USER).toLowerCase() === Roles.SUPERADMIN ? (
                      <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30 font-bold uppercase tracking-wider text-[10px]">
                        SuperAdmin
                      </Badge>
                    ) : (selectedUser.role || Roles.USER).toLowerCase() === Roles.ADMIN ? (
                      <Badge className="bg-violet-500/15 text-violet-400 border-violet-500/30 font-bold uppercase tracking-wider text-[10px]">
                        Admin
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        User
                      </Badge>
                    )}
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{selectedUser.email || 'No email registered'}</p>

                  <div className="flex items-center gap-2 mt-2">
                    {(selectedUser.accountStatus || AccountStatus.ACTIVE) === AccountStatus.DISABLED ? (
                      <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 font-bold text-[10px]">
                        Disabled
                      </Badge>
                    ) : (selectedUser.accountStatus || AccountStatus.ACTIVE) === AccountStatus.AUTH_DELETED ? (
                      <Badge className="bg-red-500/15 text-red-400 border-red-500/30 font-bold text-[10px]">
                        Auth Deleted
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-bold text-[10px]">
                        Active
                      </Badge>
                    )}

                    {selectedUser.college && (
                      <span className="text-xs font-semibold text-muted-foreground uppercase">
                        College: {selectedUser.college}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </DialogHeader>

            {/* Scrollable Dialog Body */}
            <div className="flex-1 overflow-y-auto pr-2 py-1 space-y-6 select-text scrollbar-thin">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Profile Details Card */}
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

                {/* Academic Details Card */}
                <Card className="border-border bg-accent/15 p-4 flex flex-col justify-between space-y-3">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Briefcase className="h-3 w-3" /> Academic Information
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">College</span>
                      <span className="font-semibold text-foreground uppercase">{renderField(selectedUser.college)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Branch</span>
                        <span className="font-semibold text-foreground">{renderField(selectedUser.branch)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Semester</span>
                        <span className="font-semibold text-foreground">
                          {selectedUser.semester ? `Sem ${getSemesterNumber(selectedUser.semester)}` : '—'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-semibold">Joined Date</span>
                      <span className="font-semibold text-foreground block mt-0.5 text-[10px]">{renderDateField(selectedUser.createdAt)}</span>
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
                  <div className="bg-card border border-border/80 rounded-xl p-3 text-center shadow-sm">
                    <FileText className="h-4 w-4 text-indigo-500 mx-auto mb-1" />
                    <span className="text-[9px] text-muted-foreground block truncate font-medium">Notes</span>
                    <span className="text-lg font-bold text-foreground mt-0.5 block">
                      {selectedUser.notesUploads !== undefined ? selectedUser.notesUploads : <span className="text-muted-foreground/50 font-normal">—</span>}
                    </span>
                  </div>

                  <div className="bg-card border border-border/80 rounded-xl p-3 text-center shadow-sm">
                    <GraduationCap className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
                    <span className="text-[9px] text-muted-foreground block truncate font-medium">Assignments</span>
                    <span className="text-lg font-bold text-foreground mt-0.5 block">
                      {selectedUser.assignmentUploads !== undefined ? selectedUser.assignmentUploads : <span className="text-muted-foreground/50 font-normal">—</span>}
                    </span>
                  </div>

                  <div className="bg-card border border-border/80 rounded-xl p-3 text-center shadow-sm">
                    <Layers className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                    <span className="text-[9px] text-muted-foreground block truncate font-medium">PYQs</span>
                    <span className="text-lg font-bold text-foreground mt-0.5 block">
                      {selectedUser.pyqUploads !== undefined ? selectedUser.pyqUploads : <span className="text-muted-foreground/50 font-normal">—</span>}
                    </span>
                  </div>

                  <div className="bg-card border border-border/80 rounded-xl p-3 text-center shadow-sm">
                    <FileCode className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                    <span className="text-[9px] text-muted-foreground block truncate font-medium">Cheatsheets</span>
                    <span className="text-lg font-bold text-foreground mt-0.5 block">
                      {selectedUser.cheatSheetUploads !== undefined ? selectedUser.cheatSheetUploads : <span className="text-muted-foreground/50 font-normal">—</span>}
                    </span>
                  </div>

                  <div className="bg-card border border-border/80 rounded-xl p-3 text-center shadow-sm">
                    <Youtube className="h-4 w-4 text-rose-500 mx-auto mb-1" />
                    <span className="text-[9px] text-muted-foreground block truncate font-medium">YouTube</span>
                    <span className="text-lg font-bold text-foreground mt-0.5 block">
                      {selectedUser.youtubeResourceUploads !== undefined ? selectedUser.youtubeResourceUploads : <span className="text-muted-foreground/50 font-normal">—</span>}
                    </span>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-center relative overflow-hidden shadow-sm">
                    <Upload className="h-4 w-4 text-primary mx-auto mb-1" />
                    <span className="text-[9px] text-primary/80 font-bold block truncate">Total Uploads</span>
                    <span className="text-lg font-extrabold text-primary mt-0.5 block">
                      {selectedUser.totalUploads !== undefined ? selectedUser.totalUploads : <span className="text-muted-foreground/50 font-normal">—</span>}
                    </span>
                  </div>
                </div>
              </div>

              {/* Administrative Role & Account Actions */}
              <div className="space-y-3 pt-4 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5 text-violet-400" /> User Management & Governance
                  </h3>
                  {currentUser?.uid === selectedUser.uid && (
                    <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Signed-in user (Self Actions Hidden)
                    </span>
                  )}
                </div>

                {currentUser?.uid !== selectedUser.uid ? (
                  <div className="space-y-3">
                    {/* Role Hierarchy Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* User -> Admin */}
                      {(selectedUser.role || Roles.USER).toLowerCase() === Roles.USER && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={isActionProcessing}
                          onClick={() => handleOpenActionModal('ROLE_CHANGE', Roles.ADMIN)}
                          className="text-xs font-bold border-violet-500/35 text-violet-400 hover:bg-violet-500/10 h-9"
                        >
                          <UserCheck className="h-3.5 w-3.5 mr-1.5" /> Promote to Admin
                        </Button>
                      )}

                      {/* Admin -> User */}
                      {(selectedUser.role || Roles.USER).toLowerCase() === Roles.ADMIN && isSuperAdmin && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={isActionProcessing}
                          onClick={() => handleOpenActionModal('ROLE_CHANGE', Roles.USER)}
                          className="text-xs font-bold border-zinc-700 text-zinc-300 hover:bg-zinc-800 h-9"
                        >
                          <UserX className="h-3.5 w-3.5 mr-1.5" /> Demote to User
                        </Button>
                      )}

                      {/* Admin/User -> SuperAdmin */}
                      {isSuperAdmin && (selectedUser.role || Roles.USER).toLowerCase() !== Roles.SUPERADMIN && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={isActionProcessing}
                          onClick={() => handleOpenActionModal('ROLE_CHANGE', Roles.SUPERADMIN)}
                          className="text-xs font-bold border-purple-500/40 text-purple-400 hover:bg-purple-500/10 h-9"
                        >
                          <ShieldAlert className="h-3.5 w-3.5 mr-1.5" /> Promote to SuperAdmin
                        </Button>
                      )}

                      {/* SuperAdmin -> Admin */}
                      {isSuperAdmin && (selectedUser.role || Roles.USER).toLowerCase() === Roles.SUPERADMIN && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={isActionProcessing}
                          onClick={() => handleOpenActionModal('ROLE_CHANGE', Roles.ADMIN)}
                          className="text-xs font-bold border-amber-500/35 text-amber-400 hover:bg-amber-500/10 h-9"
                        >
                          <UserX className="h-3.5 w-3.5 mr-1.5" /> Demote to Admin
                        </Button>
                      )}
                    </div>

                    {/* Account Status Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Disable / Enable User */}
                      {(selectedUser.accountStatus || AccountStatus.ACTIVE) === AccountStatus.ACTIVE ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={isActionProcessing}
                          onClick={() => handleOpenActionModal('DISABLE')}
                          className="text-xs font-bold border-amber-500/35 text-amber-400 hover:bg-amber-500/10 h-9"
                        >
                          <UserX className="h-3.5 w-3.5 mr-1.5" /> Disable User
                        </Button>
                      ) : (selectedUser.accountStatus || AccountStatus.ACTIVE) === AccountStatus.DISABLED ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={isActionProcessing}
                          onClick={() => handleOpenActionModal('ENABLE')}
                          className="text-xs font-bold border-emerald-500/35 text-emerald-400 hover:bg-emerald-500/10 h-9"
                        >
                          <UserCheck className="h-3.5 w-3.5 mr-1.5" /> Enable User
                        </Button>
                      ) : null}

                      {/* Delete Auth Account (SuperAdmin only) */}
                      {isSuperAdmin && (selectedUser.accountStatus || AccountStatus.ACTIVE) !== AccountStatus.AUTH_DELETED && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          disabled={isActionProcessing}
                          onClick={() => handleOpenActionModal('DELETE_AUTH')}
                          className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white h-9"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete Auth Account
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-accent/10 border border-border/60 rounded-xl text-xs text-muted-foreground">
                    You cannot perform administrative role changes, disablement, or deletion on your own account.
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="mt-4 border-t border-border/60 pt-4 shrink-0">
              <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(false)} className="w-full sm:w-auto">
                Close Panel
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>

      {/* Confirmation & Reason Input Sub-Modal */}
      <Dialog isOpen={actionModal !== null} onClose={() => !isActionProcessing && setActionModal(null)}>
        {actionModal && (
          <div className="space-y-4">
            <DialogHeader className="text-left">
              <div className="flex items-center gap-2 text-violet-400 mb-1">
                <ShieldAlert className="h-5 w-5" />
                <DialogTitle className="text-lg font-bold">{actionModal.title}</DialogTitle>
              </div>
              <DialogDescription className="text-sm mt-1.5 text-muted-foreground leading-relaxed">
                {actionModal.description}
              </DialogDescription>
            </DialogHeader>

            {/* Optional/Required Reason Input Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                {actionModal.type === 'DISABLE' ? 'Reason (Required) *' : 'Reason / Admin Note (Optional)'}
              </label>
              <Input
                type="text"
                placeholder={
                  actionModal.type === 'DISABLE' 
                    ? 'e.g. Spam uploads, Academic misconduct, Requested by student' 
                    : 'Provide administrative context for this action...'
                }
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                disabled={isActionProcessing}
                className="bg-card text-foreground text-xs"
              />
            </div>

            {/* Permanent Deletion Type-to-Confirm Input */}
            {actionModal.type === 'DELETE_AUTH' && (
              <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-3 space-y-2">
                <span className="text-xs font-bold text-red-400 block">
                  To confirm permanent Auth deletion, type <span className="underline font-mono">DELETE</span> below:
                </span>
                <Input
                  type="text"
                  placeholder="Type DELETE..."
                  value={deleteConfirmationWord}
                  onChange={(e) => setDeleteConfirmationWord(e.target.value)}
                  disabled={isActionProcessing}
                  className="bg-card text-foreground font-mono text-xs border-red-500/40"
                />
              </div>
            )}

            <DialogFooter className="mt-4">
              <Button variant="ghost" size="sm" onClick={() => setActionModal(null)} disabled={isActionProcessing}>
                Cancel
              </Button>
              <Button 
                size="sm" 
                variant={actionModal.type === 'DELETE_AUTH' ? 'destructive' : 'default'} 
                onClick={handleExecuteAction}
                disabled={
                  isActionProcessing || 
                  (actionModal.type === 'DISABLE' && !actionReason.trim()) ||
                  (actionModal.type === 'DELETE_AUTH' && deleteConfirmationWord.trim().toUpperCase() !== 'DELETE')
                }
                className="flex items-center gap-1.5"
              >
                {isActionProcessing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isActionProcessing ? 'Processing...' : 'Confirm Action'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>

      {/* Toast Notification */}
      {toast.message && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-foreground text-background dark:bg-card dark:text-foreground px-4 py-3.5 rounded-xl shadow-2xl border border-border/80 animate-fade-in max-w-sm">
          <Sparkles className="h-4 w-4 shrink-0 text-primary animate-pulse" />
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}
    </div>
  );
};
