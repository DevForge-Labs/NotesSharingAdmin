import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Dialog, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Search, UserCheck, ShieldAlert, UserCog, UserMinus, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'Student' | 'Moderator' | 'Administrator';
  status: 'Active' | 'Banned';
  joinedDate: string;
}

export const Users: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserItem[]>([
    { id: 'USR001', name: 'Aravind Swamy', email: 'aravind.swamy@university.edu', role: 'Student', status: 'Active', joinedDate: '2025-08-12' },
    { id: 'USR002', name: 'Dr. Sunil Kumar', email: 's.kumar@faculty.edu', role: 'Moderator', status: 'Active', joinedDate: '2025-09-01' },
    { id: 'USR003', name: 'Neha Deshmukh', email: 'neha.d@university.edu', role: 'Student', status: 'Active', joinedDate: '2025-10-15' },
    { id: 'USR004', name: 'Sneha Roy', email: 's.roy@university.edu', role: 'Student', status: 'Banned', joinedDate: '2025-11-20' },
    { id: 'USR005', name: 'Sarah Jenkins', email: 'sarah.j@notesadmin.com', role: 'Administrator', status: 'Active', joinedDate: '2025-07-01' },
  ]);

  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editRoleValue, setEditRoleValue] = useState<'Student' | 'Moderator' | 'Administrator'>('Student');

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleBanStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const nextStatus = u.status === 'Active' ? 'Banned' : 'Active';
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  const openRoleEdit = (user: UserItem) => {
    setSelectedUser(user);
    setEditRoleValue(user.role);
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = () => {
    if (selectedUser) {
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, role: editRoleValue } : u))
      );
      setIsRoleModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight font-heading">User Directory & Roles</h2>
        <p className="text-sm text-muted-foreground">
          Audit system memberships, manage access credentials, adjust operational roles, or ban/unban profiles.
        </p>
      </div>

      {/* Search Filter Toolbar */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search users by name, email domain or system ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Database Table */}
      <Card className="border-border overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-accent/30 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="p-4 w-24">User ID</th>
                  <th className="p-4">Full Name</th>
                  <th className="p-4">Email Address</th>
                  <th className="p-4">Access Role</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-accent/20 transition-colors">
                    <td className="p-4 font-mono text-xs text-muted-foreground">{user.id}</td>
                    <td className="p-4 font-semibold text-foreground/90">{user.name}</td>
                    <td className="p-4 text-muted-foreground">{user.email}</td>
                    <td className="p-4">
                      <span className="flex items-center gap-1.5 font-medium">
                        {user.role === 'Administrator' && <Sparkles className="h-3.5 w-3.5 text-primary" />}
                        {user.role === 'Moderator' && <UserCheck className="h-3.5 w-3.5 text-indigo-500" />}
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">{user.joinedDate}</td>
                    <td className="p-4 text-center">
                      <Badge variant={user.status === 'Active' ? 'success' : 'destructive'}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          onClick={() => openRoleEdit(user)}
                        >
                          <UserCog className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-8 px-2.5 text-xs font-semibold flex items-center gap-1
                            ${user.status === 'Active' 
                              ? 'text-destructive hover:bg-destructive/10' 
                              : 'text-emerald-600 dark:text-emerald-400 hover:bg-accent'
                            }
                          `}
                          onClick={() => toggleBanStatus(user.id)}
                        >
                          {user.status === 'Active' ? (
                            <>
                              <ToggleRight className="h-4 w-4 shrink-0" /> Ban User
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="h-4 w-4 shrink-0" /> Unban
                            </>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Role Management Dialog */}
      <Dialog isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)}>
        {selectedUser && (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Adjust Access Credentials</DialogTitle>
              <DialogDescription>
                Modify user clearance parameters for {selectedUser.name} ({selectedUser.email}).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-4">
              <Select
                label="System Level Role"
                value={editRoleValue}
                onChange={(e) => setEditRoleValue(e.target.value as any)}
              >
                <option value="Student">Student (Default uploader/downloader)</option>
                <option value="Moderator">Moderator (Can audit/flag and verify resources)</option>
                <option value="Administrator">Administrator (Super admin controls)</option>
              </Select>

              <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-3.5 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Security Alert</span>
                  <p className="mt-0.5">Changing permissions grants immediate access/denial to core moderator panels. Ensure proper verification prior to elevating privileges.</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" size="sm" onClick={() => setIsRoleModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveRole}>
                Save Permissions
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>
    </div>
  );
};
