import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { subjectCatalog } from '../../data/subjectCatalog';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { 
  Upload, 
  FileText, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  CheckCircle,
  XCircle,
  Clock,
  Loader2
} from 'lucide-react';

interface PyqsMassUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
  showToast?: (message: string, type: 'success' | 'info' | 'error') => void;
}

interface Subject {
  id: string;
  name: string;
  shortName: string;
}

interface UploadQueueItem {
  id: string;
  file: File;
  subject: string; // subject ID
  displaySubject: string; // subject name
  examType: string;
  examYear: string;
  status: 'queued' | 'uploading' | 'success' | 'failed';
  progress: number;
  error?: string;
  isExpanded: boolean;
}

const getNormalizedExamType = (rawType: string) => {
  const clean = rawType.trim().toLowerCase();
  if (clean.includes('mid')) return 'MidSem';
  if (clean.includes('end')) return 'EndSem';
  return rawType.trim().replace(/\s+/g, '');
};

const getBranchesForCollege = (collegeId: string): string[] => {
  const collegeKey = (collegeId || '').trim().toLowerCase();
  const collegeCatalog = (subjectCatalog as any)[collegeKey];
  if (!collegeCatalog) return [];
  return Object.keys(collegeCatalog).filter(key => {
    const val = collegeCatalog[key];
    return val && typeof val === 'object' && !Array.isArray(val);
  });
};

export const PyqsMassUploadDialog: React.FC<PyqsMassUploadDialogProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  showToast
}) => {
  const { user: currentUser } = useAuth();
  
  const [college, setCollege] = useState<string>('');
  const [colleges, setColleges] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingColleges, setIsLoadingColleges] = useState<boolean>(true);
  const [branch, setBranch] = useState<string>('');
  const [semester, setSemester] = useState<string>('');
  const [group, setGroup] = useState<string>('');
  const [files, setFiles] = useState<UploadQueueItem[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [applyAllSubject, setApplyAllSubject] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchColleges = async () => {
      try {
        setIsLoadingColleges(true);
        const docRef = doc(db, 'app_config', 'colleges');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const list = data.colleges || [];
          setColleges(list);
          if (list.length === 1) {
            setCollege(list[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching colleges:', err);
      } finally {
        setIsLoadingColleges(false);
      }
    };

    fetchColleges();
  }, [isOpen]);

  const handleApplySubjectToAll = () => {
    if (!applyAllSubject) return;
    const matchedSubject = subjects.find(s => s.id === applyAllSubject);
    setFiles(prev => prev.map(item => {
      if (item.status === 'success') return item;
      return {
        ...item,
        subject: applyAllSubject,
        displaySubject: matchedSubject ? matchedSubject.name : ''
      };
    }));
  };

  // Extract semester number to determine if group logic applies
  const semMatch = semester.match(/\d+/);
  const semNum = semMatch ? parseInt(semMatch[0], 10) : 0;
  const isGroupRequired = semNum === 1 || semNum === 2;

  // Resolve subjects based on College, Branch, Semester, Group (including inverse mapping)
  const getResolvedSubjects = (): Subject[] => {
    const collegeKey = (college || '').trim().toLowerCase();
    if (!collegeKey) return [];

    const collegeCatalog = (subjectCatalog as any)[collegeKey];
    if (!collegeCatalog) return [];

    // Semester 1 & 2 logic
    if (semNum === 1) {
      let rawSubjects: any[] = [];
      if (group === 'Group A') rawSubjects = collegeCatalog.GROUP_A;
      else if (group === 'Group B') rawSubjects = collegeCatalog.GROUP_B;
      
      if (!Array.isArray(rawSubjects)) return [];
      return rawSubjects.map((s: any) => ({
        id: s.id,
        name: s.name,
        shortName: s.shortName || s.name
      }));
    }

    if (semNum === 2) {
      let rawSubjects: any[] = [];
      // Semester 2 uses inverse group mapping
      if (group === 'Group A') rawSubjects = collegeCatalog.GROUP_B;
      else if (group === 'Group B') rawSubjects = collegeCatalog.GROUP_A;

      if (!Array.isArray(rawSubjects)) return [];
      return rawSubjects.map((s: any) => ({
        id: s.id,
        name: s.name,
        shortName: s.shortName || s.name
      }));
    }

    // Semester 3 and above dynamic lookup
    const branchKey = (branch || '').trim().toLowerCase();
    if (!branchKey || !semNum) return [];

    const branchCatalog = collegeCatalog[branchKey];
    if (!branchCatalog) return [];

    const rawSubjects = branchCatalog[semNum];
    if (!Array.isArray(rawSubjects)) return [];

    return rawSubjects.map((s: any) => ({
      id: s.id,
      name: s.name,
      shortName: s.shortName || s.name
    }));
  };

  const subjects = getResolvedSubjects();

  // Helper to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Handle addition of files
  const handleAddFiles = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newItems: UploadQueueItem[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      if (file.type !== 'application/pdf') {
        if (showToast) showToast('Only PDF files are supported.', 'error');
        continue;
      }

      // Check if file already in queue to avoid duplicates
      if (files.some(item => item.file.name === file.name && item.file.size === file.size)) {
        continue;
      }

      const generatedId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      const matchedSubject = subjects.find(s => s.id === applyAllSubject);

      newItems.push({
        id: generatedId,
        file,
        subject: applyAllSubject,
        displaySubject: matchedSubject ? matchedSubject.name : '',
        examType: '',
        examYear: '',
        status: 'queued',
        progress: 0,
        isExpanded: false
      });
    }

    if (newItems.length > 0) {
      setFiles(prev => [...prev, ...newItems]);
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleAddFiles(e.dataTransfer.files);
  };

  // Update per-file metadata fields
  const updateFileField = (id: string, field: keyof UploadQueueItem, value: any) => {
    setFiles(prev => prev.map(item => {
      if (item.id === id) {
        if (field === 'subject') {
          const matchedSubject = subjects.find(s => s.id === value);
          return {
            ...item,
            subject: value,
            displaySubject: matchedSubject ? matchedSubject.name : ''
          };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // Remove file from queue
  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(item => item.id !== id));
  };

  // Toggle item expanded state
  const toggleExpand = (id: string) => {
    setFiles(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, isExpanded: !item.isExpanded };
      }
      return item;
    }));
  };

  // Reset fields on close
  const handleClose = () => {
    if (isUploading) return;
    setBranch('');
    setSemester('');
    setGroup('');
    setFiles([]);
    setApplyAllSubject('');
    setCollege(colleges.length === 1 ? colleges[0].id : '');
    onClose();
  };

  // Validation
  const isGlobalValid = !!branch && !!semester && (!isGroupRequired || !!group) && !!college;
  const isQueueValid = files.length > 0 && files.every(f => !!f.subject && !!f.examType && !!f.examYear);
  const isFormValid = isGlobalValid && isQueueValid && !isUploading;

  // Real upload submit handler
  const handleStartUpload = async () => {
    if (!isFormValid) return;
    setIsUploading(true);

    if (showToast) showToast('Starting upload process...', 'info');

    const queueSnapshot = [...files];

    for (let i = 0; i < queueSnapshot.length; i++) {
      const item = queueSnapshot[i];
      if (item.status === 'success') continue;

      // Update file state to uploading
      setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'uploading', progress: 0 } : f));

      try {
        const docId = item.id;
        const cleanSubjectId = item.subject.toLowerCase();
        const normalizedExamType = getNormalizedExamType(item.examType);
        const pyqFileName = `${item.examYear}.${normalizedExamType}.pdf`;
        const storagePath = `pyqs/${semester.trim()}/${cleanSubjectId}-pyq-${docId}/${pyqFileName}`;

        // Reference to Storage location
        const storageRef = ref(storage, storagePath);
        const uploadTask = uploadBytesResumable(storageRef, item.file);

        // Upload Promise to track progress and URL
        const downloadUrl = await new Promise<string>((resolve, reject) => {
          uploadTask.on('state_changed',
            (snapshot) => {
              const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setFiles(prev => prev.map(f => f.id === item.id ? { ...f, progress: pct } : f));
            },
            (error) => {
              reject(error);
            },
            async () => {
              try {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(url);
              } catch (urlErr) {
                reject(urlErr);
              }
            }
          );
        });

        // Save PYQ document metadata in Firestore
        const docRef = doc(db, 'pyqs', docId);
        const docData = {
          documentId: docId,
          title: pyqFileName,
          description: '',
          branch: branch,
          semester: semester,
          subject: cleanSubjectId,
          displaySubject: item.displaySubject,
          subjectId: cleanSubjectId,
          searchKey: cleanSubjectId,
          documentType: 'PYQ',
          type: 'PYQ',
          uploaderName: currentUser?.displayName || currentUser?.email || 'Admin',
          uploaderId: currentUser?.uid || 'admin-uploader',
          uploaderUid: currentUser?.uid || 'admin-uploader',
          uploaderPhotoUrl: currentUser?.photoURL || '',
          uploadedAt: Date.now(),
          downloadsCount: 0,
          upvotes: 0,
          bookmarks: 0,
          viewsCount: 0,
          trendingScore: 0,
          fileUrl: downloadUrl,
          downloadUrl: downloadUrl,
          storagePath: storagePath,
          storagePaths: [storagePath],
          fileUrls: [downloadUrl],
          fileSize: item.file.size,
          fileExtension: 'pdf',
          isVerified: false,
          tags: [],
          fileType: 'pdf',
          mimeType: 'application/pdf',
          thumbnailUrl: '',
          thumbnailGenerated: false,
          attachmentCount: 1,
          examType: normalizedExamType,
          examYear: item.examYear,
          college: college
        };

        await setDoc(docRef, docData);

        // Mark item as success
        setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'success', progress: 100 } : f));

      } catch (err: any) {
        console.error('PYQ mass upload error for file: ', item.file.name, err);
        const errMsg = err?.message || 'Upload failed';
        setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'failed', error: errMsg } : f));
        setIsUploading(false);
        if (showToast) showToast(`Upload failed for ${item.file.name}: ${errMsg}`, 'error');
        return; // Halt uploading of remaining files on failure
      }
    }

    setIsUploading(false);
    if (showToast) showToast('All PYQs uploaded successfully!', 'success');

    // Close and refresh after success
    setTimeout(() => {
      if (onUploadSuccess) onUploadSuccess();
      handleClose();
    }, 1500);
  };

  const completedCount = files.filter(f => f.status === 'success').length;
  const isAnyUploading = files.some(f => f.status === 'uploading');
  const overallProgressMsg = isAnyUploading 
    ? `Uploading ${completedCount + 1} of ${files.length} files...` 
    : '';

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} className="max-w-5xl max-h-[90vh] flex flex-col min-h-0">
      <DialogHeader className="shrink-0 pb-2 border-b border-border/60">
        <DialogTitle className="text-xl font-bold tracking-tight">Mass Upload PYQs</DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground mt-1">
          Bulk upload student previous year question papers and PDFs to the repository.
        </DialogDescription>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto pr-2 py-4 space-y-5 scrollbar-thin select-text">
        {/* Global Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-white/[0.02] p-4 rounded-xl border border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.05)]">
          <div>
            <Select
              label="College"
              value={college}
              onChange={(e) => {
                setCollege(e.target.value);
                setBranch('');
                setApplyAllSubject('');
                setFiles(prev => prev.map(f => ({ ...f, subject: '', displaySubject: '' })));
              }}
              className="bg-card text-foreground"
              disabled={isUploading || isLoadingColleges}
            >
              <option value="">{isLoadingColleges ? 'Loading Colleges...' : 'Select College'}</option>
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
              value={branch}
              onChange={(e) => {
                setBranch(e.target.value);
                setApplyAllSubject('');
                setFiles(prev => prev.map(f => ({ ...f, subject: '', displaySubject: '' })));
              }}
              className="bg-card text-foreground"
              disabled={isUploading || !college}
            >
              <option value="">Select Branch</option>
              {getBranchesForCollege(college).map((bKey) => (
                <option key={bKey} value={bKey}>
                  {bKey.toUpperCase()}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Select
              label="Semester"
              value={semester}
              onChange={(e) => {
                setSemester(e.target.value);
                setApplyAllSubject('');
                // Reset files' subject if semester changes (affects resolution)
                setFiles(prev => prev.map(f => ({ ...f, subject: '', displaySubject: '' })));
                const match = e.target.value.match(/\d+/);
                const sNum = match ? parseInt(match[0], 10) : 0;
                if (sNum !== 1 && sNum !== 2) {
                  setGroup('');
                }
              }}
              className="bg-card text-foreground"
              disabled={isUploading}
            >
              <option value="">Select Semester</option>
              {Array.from({ length: 8 }, (_, i) => (
                <option key={i + 1} value={`Semester ${i + 1}`}>
                  Semester {i + 1}
                </option>
              ))}
            </Select>
          </div>

          {isGroupRequired && (
            <div>
              <Select
                label="Group"
                value={group}
                onChange={(e) => {
                  setGroup(e.target.value);
                  setApplyAllSubject('');
                  // Reset files' subject if group changes
                  setFiles(prev => prev.map(f => ({ ...f, subject: '', displaySubject: '' })));
                }}
                className="bg-card text-foreground"
                disabled={isUploading}
              >
                <option value="">Select Group</option>
                <option value="Group A">Group A</option>
                <option value="Group B">Group B</option>
              </Select>
            </div>
          )}
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center cursor-pointer transition-all duration-200 select-none ${
            isUploading ? 'opacity-50 pointer-events-none' : ''
          } ${
            isDragging 
              ? 'border-violet-400 bg-violet-500/10 text-violet-400 scale-[0.99] shadow-[0_0_15px_rgba(139,92,246,0.15)]' 
              : 'border-violet-500/40 bg-violet-500/[0.01] text-muted-foreground hover:bg-violet-500/5 hover:border-violet-400 hover:shadow-[0_0_15px_rgba(139,92,246,0.08)]'
          }`}
        >
          <input
            type="file"
            multiple
            accept="application/pdf"
            ref={fileInputRef}
            onChange={(e) => handleAddFiles(e.target.files)}
            className="hidden"
          />
          <Upload className={`h-10 w-10 mb-3 transition-transform ${isDragging ? 'animate-bounce text-violet-400' : 'text-violet-500'}`} />
          <h3 className="font-bold text-foreground text-sm">Drag & Drop PDF PYQs here</h3>
          <p className="text-xs text-muted-foreground mt-1">or click to browse local files (PDF only)</p>
        </div>

        {/* Empty State */}
        {files.length === 0 && (
          <div className="text-center py-8 border border-dashed border-border/40 rounded-xl bg-accent/5">
            <span className="text-sm font-semibold text-muted-foreground block">No files added yet</span>
            <span className="text-xs text-muted-foreground/60 block mt-1">Drag PDFs here or browse local files to queue them for upload</span>
          </div>
        )}

        {/* Subject Apply-to-All Section */}
        {files.length > 0 && isGlobalValid && (
          <div className="bg-accent/10 border border-border/60 p-4 rounded-xl space-y-2">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Apply Subject To All Files
            </h4>
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1">
                <Select
                  value={applyAllSubject}
                  onChange={(e) => setApplyAllSubject(e.target.value)}
                  disabled={isUploading}
                  className="bg-card text-foreground"
                >
                  <option value="">Select Subject to Apply</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.shortName})
                    </option>
                  ))}
                </Select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleApplySubjectToAll}
                disabled={isUploading || !applyAllSubject}
                className="bg-card border-border/80 h-9 px-4 hover:bg-accent/20 text-xs font-bold shrink-0"
              >
                Apply
              </Button>
            </div>
          </div>
        )}

        {/* Overall Progress Indicator */}
        {isUploading && overallProgressMsg && (
          <div className="bg-violet-500/5 border border-violet-500/20 p-3.5 rounded-xl flex flex-col gap-2 text-xs shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 text-violet-500 animate-spin" />
                {overallProgressMsg}
              </span>
              <span className="font-bold text-violet-400 font-mono">
                {Math.round((completedCount / files.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-violet-500 h-1.5 rounded-full transition-all duration-300" 
                style={{ width: `${(completedCount / files.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Queue Section */}
        {files.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-1">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Upload Queue ({files.length})
              </h4>
              {!isGlobalValid && (
                <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Select Global College, Branch & Sem first
                </span>
              )}
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {files.map((item) => (
                <div 
                  key={item.id} 
                  className={`border rounded-lg overflow-hidden transition-all duration-200 ${
                    item.isExpanded 
                      ? 'border-violet-500/30 bg-violet-500/[0.03] shadow-lg' 
                      : 'border-border/80 bg-zinc-950/80 shadow-md hover:border-border/100 hover:shadow-lg'
                  }`}
                >
                  {/* Item Header */}
                  <div 
                    onClick={() => toggleExpand(item.id)}
                    className="flex items-center justify-between p-3 select-none hover:bg-accent/15 cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <div className="min-w-0 flex-1 pr-4">
                        <span className="font-semibold text-foreground truncate block" title={item.file.name}>
                          {item.file.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatFileSize(item.file.size)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Status Indicator */}
                      <span className="flex items-center gap-1 font-bold">
                        {item.status === 'queued' && (
                          <span className="text-zinc-400 bg-zinc-800/80 border border-zinc-700/50 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wide flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" /> Queued
                          </span>
                        )}
                        {item.status === 'uploading' && (
                          <span className="text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wide flex items-center gap-1">
                            <Loader2 className="h-2.5 w-2.5 animate-spin" /> Uploading {Math.round(item.progress)}%
                          </span>
                        )}
                        {item.status === 'success' && (
                          <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wide flex items-center gap-1">
                            <CheckCircle className="h-2.5 w-2.5" /> Success
                          </span>
                        )}
                        {item.status === 'failed' && (
                          <span className="text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wide flex items-center gap-1" title={item.error}>
                            <XCircle className="h-2.5 w-2.5" /> Failed
                          </span>
                        )}
                      </span>

                      {/* Discard button */}
                      {!isUploading && item.status !== 'success' && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(item.id);
                          }}
                          className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-accent/40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* Expand Chevron */}
                      {item.isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>

                  {/* Progress Bar for individual item */}
                  {item.status === 'uploading' && (
                    <div className="w-full bg-zinc-800 h-1">
                      <div 
                        className="bg-violet-500 h-1 transition-all duration-300" 
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                  {item.status === 'success' && (
                    <div className="w-full bg-zinc-800 h-1">
                      <div className="bg-emerald-500 h-1 w-full" />
                    </div>
                  )}
                  {item.status === 'failed' && (
                    <div className="w-full bg-zinc-800 h-1">
                      <div className="bg-red-500 h-1 w-full" />
                    </div>
                  )}

                  {/* Item Body */}
                  {item.isExpanded && (
                    <div className="p-3.5 border-t border-border/50 bg-accent/5 space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        {/* Subject Selector */}
                        <div>
                          <Select
                            label="Subject *"
                            value={item.subject}
                            onChange={(e) => updateFileField(item.id, 'subject', e.target.value)}
                            disabled={isUploading || item.status === 'success' || !isGlobalValid}
                            className="bg-card text-foreground"
                          >
                            <option value="">Select Subject</option>
                            {subjects.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.shortName})
                              </option>
                            ))}
                          </Select>
                        </div>

                        {/* Exam Type Selector */}
                        <div>
                          <Select
                            label="Exam Type *"
                            value={item.examType}
                            onChange={(e) => updateFileField(item.id, 'examType', e.target.value)}
                            disabled={isUploading || item.status === 'success'}
                            className="bg-card text-foreground"
                          >
                            <option value="">Select Exam Type</option>
                            <option value="Midsem">Midsem</option>
                            <option value="Endsem">Endsem</option>
                            <option value="Quiz">Quiz</option>
                          </Select>
                        </div>

                        {/* Year Selector */}
                        <div>
                          <Select
                            label="Year *"
                            value={item.examYear}
                            onChange={(e) => updateFileField(item.id, 'examYear', e.target.value)}
                            disabled={isUploading || item.status === 'success'}
                            className="bg-card text-foreground"
                          >
                            <option value="">Select Year</option>
                            {Array.from({ length: 7 }, (_, i) => 2026 - i).map((yr) => (
                              <option key={yr} value={yr}>
                                {yr}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <DialogFooter className="shrink-0 border-t border-border/60 pt-3 mt-0">
        <Button variant="outline" size="sm" onClick={handleClose} disabled={isUploading}>
          Cancel
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          onClick={handleStartUpload}
          disabled={!isFormValid}
          className="flex items-center gap-1.5"
        >
          {isUploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Start Upload
        </Button>
      </DialogFooter>
    </Dialog>
  );
};
