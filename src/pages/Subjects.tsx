import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useUploadCatalog, CatalogSubject } from '@/hooks/useUploadCatalog';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  Info
} from 'lucide-react';

export const Subjects: React.FC = () => {
  const {
    colleges,
    getBranches,
    getSemesters,
    getSubjects,
    isLoading: isCatalogLoading,
    reloadCatalog,
    rawCatalog
  } = useUploadCatalog();

  // Selection states
  const [selectedCollege, setSelectedCollege] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Operation Modals
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [selectedSubject, setSelectedSubject] = useState<CatalogSubject | null>(null);

  // Form states
  const [formSubjectId, setFormSubjectId] = useState<string>('');
  const [formDisplayName, setFormDisplayName] = useState<string>('');
  const [formShortName, setFormShortName] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Auto-select initial college
  useEffect(() => {
    if (colleges.length > 0 && !selectedCollege) {
      setSelectedCollege(colleges[0].id);
    }
  }, [colleges, selectedCollege]);

  const availableBranches = useMemo(() => getBranches(selectedCollege), [getBranches, selectedCollege]);
  const availableSemesters = useMemo(() => getSemesters(selectedCollege, selectedBranch), [getSemesters, selectedCollege, selectedBranch]);

  const semMatch = (selectedSemester || '').match(/\d+/);
  const semNum = semMatch ? parseInt(semMatch[0], 10) : 0;
  const isGroupRequired = (semNum === 1 || semNum === 2);

  // Auto-select first branch & semester when available
  useEffect(() => {
    if (availableBranches.length > 0 && (!selectedBranch || !availableBranches.some(b => b.id === selectedBranch))) {
      setSelectedBranch(availableBranches[0].id);
    }
  }, [availableBranches, selectedBranch]);

  useEffect(() => {
    if (availableSemesters.length > 0 && (!selectedSemester || !availableSemesters.some(s => s.id === selectedSemester))) {
      setSelectedSemester(availableSemesters[0].id);
    }
  }, [availableSemesters, selectedSemester]);

  // Retrieve current subjects from catalog tree
  const currentSubjects = useMemo(() => {
    if (!selectedCollege || !selectedSemester) return [];
    if (isGroupRequired && !selectedGroup) {
      const grpASubjects = getSubjects(selectedCollege, selectedBranch, selectedSemester, 'Group A');
      const grpBSubjects = getSubjects(selectedCollege, selectedBranch, selectedSemester, 'Group B');
      const combinedMap = new Map<string, CatalogSubject>();
      [...grpASubjects, ...grpBSubjects].forEach(s => combinedMap.set(s.id.toLowerCase(), s));
      return Array.from(combinedMap.values());
    }
    return getSubjects(selectedCollege, selectedBranch, selectedSemester, selectedGroup);
  }, [selectedCollege, selectedBranch, selectedSemester, selectedGroup, isGroupRequired, getSubjects]);

  // Filtered subjects
  const filteredSubjects = useMemo(() => {
    return currentSubjects.filter((s) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        s.shortName.toLowerCase().includes(searchQuery.toLowerCase().trim());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && s.active !== false) ||
        (statusFilter === 'inactive' && s.active === false);

      return matchesSearch && matchesStatus;
    });
  }, [currentSubjects, searchQuery, statusFilter]);

  // Helper to persist updated catalog tree to Firestore
  const saveCatalogTreeToFirestore = async (updatedCatalog: any) => {
    const docRef = doc(db, 'app_config', 'subject_catalog');
    await setDoc(docRef, updatedCatalog);
    await reloadCatalog();
  };

  // Helper to navigate deep catalog target array
  const getTargetLocation = (catalog: any): { array: any[]; parent: any; key: string } | null => {
    const colKey = Object.keys(catalog || {}).find(
      k => k.toLowerCase() === selectedCollege.toLowerCase().trim()
    );
    if (!colKey || !catalog[colKey]) return null;

    const collegeObj = catalog[colKey];

    if (semNum === 1 || semNum === 2) {
      const groupKey = (selectedGroup === 'Group B' || (semNum === 2 && selectedGroup === 'Group A')) ? 'GROUP_B' : 'GROUP_A';
      const actualKey = Object.keys(collegeObj).find(k => k.toUpperCase() === groupKey) || groupKey;
      if (!Array.isArray(collegeObj[actualKey])) {
        collegeObj[actualKey] = [];
      }
      return { array: collegeObj[actualKey], parent: collegeObj, key: actualKey };
    }

    if (semNum >= 3 && selectedBranch) {
      const bKey = Object.keys(collegeObj).find(
        k => k.toLowerCase() === selectedBranch.toLowerCase().trim()
      ) || selectedBranch.toLowerCase().trim();

      if (!collegeObj[bKey] || typeof collegeObj[bKey] !== 'object') {
        collegeObj[bKey] = {};
      }

      const semKey = semNum.toString();
      if (!Array.isArray(collegeObj[bKey][semKey])) {
        collegeObj[bKey][semKey] = [];
      }
      return { array: collegeObj[bKey][semKey], parent: collegeObj[bKey], key: semKey };
    }

    return null;
  };

  // Handlers for Add Subject
  const handleOpenAdd = () => {
    setFormSubjectId('');
    setFormDisplayName('');
    setFormShortName('');
    setFormError('');
    setIsAddOpen(true);
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = formSubjectId.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const cleanName = formDisplayName.trim();
    const cleanShort = formShortName.trim() || cleanName;

    if (!cleanId || !cleanName) {
      setFormError('Subject ID and Display Name are required.');
      return;
    }

    if (currentSubjects.some(s => s.id.toLowerCase() === cleanId)) {
      setFormError(`Subject ID "${cleanId}" already exists in ${selectedSemester}.`);
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const catalogClone = JSON.parse(JSON.stringify(rawCatalog || {}));
      const location = getTargetLocation(catalogClone);

      if (!location) {
        throw new Error('Unable to resolve academic catalog target structure.');
      }

      const newSubjectEntry = {
        id: cleanId,
        name: cleanName,
        shortName: cleanShort,
        active: true
      };

      location.array.push(newSubjectEntry);
      await saveCatalogTreeToFirestore(catalogClone);

      showToast(`Subject "${cleanName}" (${cleanShort}) created successfully.`, 'success');
      setIsAddOpen(false);
    } catch (err: any) {
      console.error('Error creating subject:', err);
      setFormError(err.message || 'Failed to create subject.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers for Edit Subject
  const handleOpenEdit = (subject: CatalogSubject) => {
    setSelectedSubject(subject);
    setFormSubjectId(subject.id);
    setFormDisplayName(subject.name);
    setFormShortName(subject.shortName || subject.name);
    setFormError('');
    setIsEditOpen(true);
  };

  const handleUpdateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) return;

    const cleanName = formDisplayName.trim();
    const cleanShort = formShortName.trim() || cleanName;

    if (!cleanName) {
      setFormError('Display Name is required.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const catalogClone = JSON.parse(JSON.stringify(rawCatalog || {}));
      const location = getTargetLocation(catalogClone);

      if (!location) {
        throw new Error('Unable to resolve academic catalog target structure.');
      }

      const index = location.array.findIndex((s: any) => s.id.toLowerCase() === selectedSubject.id.toLowerCase());
      if (index === -1) {
        throw new Error(`Subject ID "${selectedSubject.id}" not found in current catalog structure.`);
      }

      location.array[index] = {
        ...location.array[index],
        name: cleanName,
        shortName: cleanShort
      };

      await saveCatalogTreeToFirestore(catalogClone);

      showToast(`Subject "${cleanName}" updated successfully.`, 'success');
      setIsEditOpen(false);
    } catch (err: any) {
      console.error('Error updating subject:', err);
      setFormError(err.message || 'Failed to update subject.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler to Toggle Active/Inactive Status
  const handleToggleStatus = async (subject: CatalogSubject) => {
    try {
      const catalogClone = JSON.parse(JSON.stringify(rawCatalog || {}));
      const location = getTargetLocation(catalogClone);

      if (!location) {
        showToast('Unable to locate catalog branch to update.', 'error');
        return;
      }

      const index = location.array.findIndex((s: any) => s.id.toLowerCase() === subject.id.toLowerCase());
      if (index === -1) {
        showToast('Subject not found in catalog.', 'error');
        return;
      }

      const nextActiveState = subject.active === false ? true : false;
      location.array[index] = {
        ...location.array[index],
        active: nextActiveState
      };

      await saveCatalogTreeToFirestore(catalogClone);
      showToast(
        `Subject "${subject.name}" is now ${nextActiveState ? 'Active' : 'Inactive'}.`,
        nextActiveState ? 'success' : 'info'
      );
    } catch (err: any) {
      console.error('Error toggling subject active status:', err);
      showToast('Failed to change subject status.', 'error');
    }
  };

  // Handlers for Safe Delete
  const handleOpenDelete = (subject: CatalogSubject) => {
    setSelectedSubject(subject);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedSubject) return;
    setIsSubmitting(true);

    try {
      const catalogClone = JSON.parse(JSON.stringify(rawCatalog || {}));
      const location = getTargetLocation(catalogClone);

      if (!location) {
        throw new Error('Unable to resolve catalog target structure.');
      }

      location.array = location.array.filter((s: any) => s.id.toLowerCase() !== selectedSubject.id.toLowerCase());
      location.parent[location.key] = location.array;

      await saveCatalogTreeToFirestore(catalogClone);

      showToast(`Subject "${selectedSubject.name}" deleted.`, 'info');
      setIsDeleteOpen(false);
    } catch (err: any) {
      console.error('Error deleting subject:', err);
      showToast('Failed to delete subject: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 select-text">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border shadow-2xl flex items-center gap-3 text-xs font-bold transition-all duration-300 animate-slide-in-up ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300'
              : toastMessage.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/40 text-rose-300'
              : 'bg-zinc-900/90 border-zinc-700/60 text-zinc-200'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
          {toastMessage.type === 'error' && <XCircle className="h-4 w-4 text-rose-400 shrink-0" />}
          {toastMessage.type === 'info' && <Info className="h-4 w-4 text-blue-400 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Page Title & Stats Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight font-heading">Subject Catalog Management</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Central single source of truth for subject IDs, full display titles, and Android badge names.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => reloadCatalog()}
            disabled={isCatalogLoading}
            className="text-xs font-semibold h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isCatalogLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleOpenAdd}
            disabled={isCatalogLoading || !selectedCollege || !selectedSemester}
            className="text-xs font-bold bg-primary text-primary-foreground h-9 shadow-md shadow-primary/20 hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Subject
          </Button>
        </div>
      </div>

      {/* Academic Hierarchy Selector Card */}
      <Card className="border-border/80 bg-card/60 backdrop-blur-sm shadow-sm">
        <CardHeader className="pb-3 pt-4 px-5 border-b border-border/50">
          <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Academic Scope Navigation
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Select the College, Branch, and Semester to view and manage authoritative subjects.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 px-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Select
                label="College"
                value={selectedCollege}
                onChange={(e) => setSelectedCollege(e.target.value)}
                disabled={isCatalogLoading || colleges.length === 0}
                className="bg-card text-foreground"
              >
                <option value="">Select College</option>
                {colleges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Select
                label="Branch"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                disabled={isCatalogLoading || !selectedCollege}
                className="bg-card text-foreground"
              >
                <option value="">Select Branch</option>
                {availableBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Select
                label="Semester"
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                disabled={isCatalogLoading || !selectedCollege}
                className="bg-card text-foreground"
              >
                <option value="">Select Semester</option>
                {availableSemesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>

            {isGroupRequired && (
              <div>
                <Select
                  label="Group (First Year)"
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  disabled={isCatalogLoading}
                  className="bg-card text-foreground"
                >
                  <option value="">All Groups (Combined)</option>
                  <option value="Group A">Group A</option>
                  <option value="Group B">Group B</option>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID, name, or badge label..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-9 bg-card text-foreground"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-accent/40 rounded-lg border border-border text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                statusFilter === 'all' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({currentSubjects.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                statusFilter === 'active' ? 'bg-background text-emerald-400 shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Active ({currentSubjects.filter((s) => s.active !== false).length})
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                statusFilter === 'inactive' ? 'bg-background text-zinc-400 shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Inactive ({currentSubjects.filter((s) => s.active === false).length})
            </button>
          </div>
        </div>
      </div>

      {/* Subjects Table */}
      <Card className="border-border/80 shadow-md overflow-hidden bg-card/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-accent/40 border-b border-border/80 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Subject ID</th>
                <th className="py-3 px-4">Full Display Name</th>
                <th className="py-3 px-4">Badge / Short Name</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isCatalogLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
                    <span>Loading subject catalog...</span>
                  </td>
                </tr>
              ) : filteredSubjects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="font-semibold text-sm">No subjects found</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {searchQuery ? 'No subjects matched your filter.' : 'Click "+ Add Subject" to create the first subject for this semester.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSubjects.map((subject) => {
                  const isActive = subject.active !== false;
                  return (
                    <tr
                      key={subject.id}
                      className={`hover:bg-accent/20 transition-colors ${!isActive ? 'opacity-60 bg-zinc-950/20' : ''}`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-violet-400 text-xs">
                        <span className="bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded">
                          {subject.id}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {subject.name}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="bg-primary/10 border border-primary/20 text-primary font-bold px-2 py-0.5 rounded text-[11px]">
                          {subject.shortName || subject.name}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" /> Inactive
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(subject)}
                            title={isActive ? 'Deactivate subject' : 'Activate subject'}
                            className="h-8 px-2 text-muted-foreground hover:text-foreground text-xs"
                          >
                            {isActive ? (
                              <span className="flex items-center gap-1 text-zinc-400 hover:text-amber-400">
                                <EyeOff className="h-3.5 w-3.5" /> Deactivate
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-emerald-400">
                                <Eye className="h-3.5 w-3.5" /> Activate
                              </span>
                            )}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(subject)}
                            className="h-8 px-2.5 text-xs font-semibold border-border hover:bg-accent/60"
                          >
                            <Edit2 className="h-3.5 w-3.5 mr-1 text-primary" /> Edit
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDelete(subject)}
                            title="Delete subject"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Subject Modal */}
      <Dialog isOpen={isAddOpen} onClose={() => !isSubmitting && setIsAddOpen(false)} className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" /> Add New Subject
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Create an authoritative subject in {selectedCollege.toUpperCase()} &bull; {selectedBranch.toUpperCase()} &bull; {selectedSemester}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateSubject} className="space-y-4 py-2 text-xs">
          {formError && (
            <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
              Subject ID (Machine Key) *
            </label>
            <Input
              placeholder="e.g. cns, daa, oopj"
              value={formSubjectId}
              onChange={(e) => setFormSubjectId(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              disabled={isSubmitting}
              className="bg-card text-foreground font-mono"
            />
            <span className="text-[10px] text-muted-foreground block mt-1">
              Must be unique within this semester (lowercase alphanumeric, dashes allowed).
            </span>
          </div>

          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
              Full Display Name *
            </label>
            <Input
              placeholder="e.g. Cryptography and Network Security"
              value={formDisplayName}
              onChange={(e) => setFormDisplayName(e.target.value)}
              disabled={isSubmitting}
              className="bg-card text-foreground"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
              Badge / Short Name (Optional)
            </label>
            <Input
              placeholder="e.g. CNS"
              value={formShortName}
              onChange={(e) => setFormShortName(e.target.value)}
              disabled={isSubmitting}
              className="bg-card text-foreground"
            />
            <span className="text-[10px] text-muted-foreground block mt-1">
              Used for compact badges throughout the mobile app. Defaults to Full Display Name if empty.
            </span>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !formSubjectId.trim() || !formDisplayName.trim()}
              className="bg-primary text-primary-foreground font-bold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Saving...
                </>
              ) : (
                'Create Subject'
              )}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Edit Subject Modal */}
      <Dialog isOpen={isEditOpen} onClose={() => !isSubmitting && setIsEditOpen(false)} className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Edit2 className="h-4 w-4 text-primary" /> Edit Subject Details
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Update display title and badge name for canonical ID <span className="font-mono font-bold text-violet-400">{selectedSubject?.id}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleUpdateSubject} className="space-y-4 py-2 text-xs">
          {formError && (
            <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
              Subject ID
            </label>
            <Input
              value={formSubjectId}
              disabled
              className="bg-accent/40 text-muted-foreground font-mono cursor-not-allowed"
            />
            <span className="text-[10px] text-amber-500 font-semibold block mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> Subject ID is immutable to prevent orphaning uploaded resources.
            </span>
          </div>

          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
              Full Display Name *
            </label>
            <Input
              placeholder="e.g. Design and Analysis of Algorithms"
              value={formDisplayName}
              onChange={(e) => setFormDisplayName(e.target.value)}
              disabled={isSubmitting}
              className="bg-card text-foreground"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
              Badge / Short Name
            </label>
            <Input
              placeholder="e.g. DAA"
              value={formShortName}
              onChange={(e) => setFormShortName(e.target.value)}
              disabled={isSubmitting}
              className="bg-card text-foreground"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !formDisplayName.trim()}
              className="bg-primary text-primary-foreground font-bold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete / Deactivate Confirmation Modal */}
      <Dialog isOpen={isDeleteOpen} onClose={() => !isSubmitting && setIsDeleteOpen(false)} className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" /> Remove Subject From Catalog?
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Are you sure you want to remove <strong className="text-foreground">{selectedSubject?.name}</strong> (<span className="font-mono text-violet-400">{selectedSubject?.id}</span>)?
          </DialogDescription>
        </DialogHeader>

        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs space-y-1.5 my-2">
          <p className="font-bold flex items-center gap-1.5">
            <Info className="h-4 w-4 text-amber-400 shrink-0" /> Recommended Alternative: Deactivate Instead
          </p>
          <p className="text-[11px] text-amber-200/80 leading-relaxed">
            Deactivating a subject hides it from new upload pickers while safely preserving historical uploaded notes, videos, and PYQs that reference this subject ID.
          </p>
        </div>

        <DialogFooter className="pt-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setIsDeleteOpen(false);
              if (selectedSubject) handleToggleStatus(selectedSubject);
            }}
            disabled={isSubmitting}
            className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 font-bold"
          >
            Deactivate Instead
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleConfirmDelete}
            disabled={isSubmitting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold"
          >
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
            Permanently Remove
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};
