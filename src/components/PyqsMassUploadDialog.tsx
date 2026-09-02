import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { incrementUserUploads } from '@/lib/statsService';
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

import { AiAutofillToggle } from '@/components/ui/AiAutofillToggle';
import { AiAnalysisSummaryBanner } from '@/components/ui/AiAnalysisSummaryBanner';
import { useAiAutofill, AiAnalysisStatus } from '@/hooks/useAiAutofill';
import { DocumentTypes } from '@/constants/documentTypes';
import { MappedFirestoreMetadata } from '@/services/metadataMapper';
import { getAllSubjectsFromCatalog } from '@/services/metadataParser';
import { useUploadCatalog } from '@/hooks/useUploadCatalog';
import JSZip from 'jszip';

const MAX_ZIP_FILES = 50;
const MAX_ZIP_UNCOMPRESSED_BYTES = 150 * 1024 * 1024; // 150 MB


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
  topics?: string[];
  aiGenerated?: boolean;
  aiConfidence?: number;
  aiModel?: string;
  aiVersion?: string;
  analysisDurationMs?: number;
}

const getNormalizedExamType = (rawType: string) => {
  const clean = rawType.trim().toLowerCase();
  if (clean.includes('mid')) return 'MidSem';
  if (clean.includes('end')) return 'EndSem';
  return rawType.trim().replace(/\s+/g, '');
};

export const PyqsMassUploadDialog: React.FC<PyqsMassUploadDialogProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  showToast
}) => {
  const { user: currentUser } = useAuth();
  
  const [college, setCollege] = useState<string>('');
  const [branch, setBranch] = useState<string>('');
  const [semester, setSemester] = useState<string>('');
  const [group, setGroup] = useState<string>('');
  const [files, setFiles] = useState<UploadQueueItem[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [applyAllSubject, setApplyAllSubject] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const ai = useAiAutofill();
  const {
    colleges,
    getBranches,
    getSemesters,
    getSubjects,
    allSubjects,
    isLoading: isLoadingColleges,
    reloadCatalog
  } = useUploadCatalog();

  useEffect(() => {
    if (!isOpen) {
      ai.clearHistoryCache();
      return;
    }
    ai.clearHistoryCache();
    reloadCatalog();
  }, [isOpen]);

  useEffect(() => {
    if (colleges.length === 1 && !college) {
      setCollege(colleges[0].id);
    }
  }, [colleges, college]);

  const availableBranches = getBranches(college);
  const availableSemesters = getSemesters(college, branch);

  const semMatch = semester.match(/\d+/);
  const semNum = semMatch ? parseInt(semMatch[0], 10) : 0;
  const isGroupRequired = (semNum === 1 || semNum === 2);

  const subjects = getSubjects(college, branch, semester, group);

  const currentYear = new Date().getFullYear();
  const startYear = 2015;
  const availableYears = Array.from(
    { length: Math.max(1, currentYear - startYear + 1) },
    (_, i) => currentYear - i
  );


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



  // Helper to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Helper to extract supported files from a client-side ZIP archive
  const extractZipEntries = async (zipFile: File): Promise<{ files: File[]; ignoredCount: number }> => {
    const zip = new JSZip();
    let loadedZip: JSZip;
    try {
      loadedZip = await zip.loadAsync(zipFile);
    } catch {
      throw new Error(`Failed to read ZIP archive "${zipFile.name}". The file may be corrupt or invalid.`);
    }

    const extractedFiles: File[] = [];
    let ignoredCount = 0;
    let totalExtractedBytes = 0;
    let totalFileCount = 0;

    const entries = Object.values(loadedZip.files);

    for (const entry of entries) {
      if (entry.dir) continue;

      // Filter out macOS hidden metadata, system files, or hidden files
      const cleanPath = entry.name.replace(/\\/g, '/');
      const pathParts = cleanPath.split('/');
      const fileName = pathParts[pathParts.length - 1];

      if (!fileName || fileName.startsWith('.') || fileName.startsWith('~') || cleanPath.includes('__MACOSX/')) {
        continue;
      }

      const ext = fileName.split('.').pop()?.toLowerCase() || '';
      const isPdf = ext === 'pdf';
      const isPpt = ext === 'ppt';
      const isPptx = ext === 'pptx';

      if (!isPdf && !isPpt && !isPptx) {
        ignoredCount++;
        continue;
      }

      totalFileCount++;
      if (totalFileCount > MAX_ZIP_FILES) {
        throw new Error(`ZIP archive "${zipFile.name}" exceeds the maximum limit of ${MAX_ZIP_FILES} files.`);
      }

      const blob = await entry.async('blob');
      totalExtractedBytes += blob.size;

      if (totalExtractedBytes > MAX_ZIP_UNCOMPRESSED_BYTES) {
        throw new Error(`Extracted contents of "${zipFile.name}" exceed maximum allowed size limit (${formatFileSize(MAX_ZIP_UNCOMPRESSED_BYTES)}).`);
      }

      const mimeType = isPdf
        ? 'application/pdf'
        : isPpt
        ? 'application/vnd.ms-powerpoint'
        : 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

      const file = new File([blob], fileName, {
        type: mimeType,
        lastModified: entry.date ? entry.date.getTime() : Date.now()
      });

      extractedFiles.push(file);
    }

    return { files: extractedFiles, ignoredCount };
  };

  // Handle addition of files (including extracting ZIP archives)
  const handleAddFiles = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const filesToProcess: File[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const isZip = ext === 'zip' || file.type === 'application/zip' || file.type === 'application/x-zip-compressed' || file.type === 'application/x-zip';
      const isPdf = file.type === 'application/pdf' || ext === 'pdf';
      const isPpt = ext === 'ppt' || file.type === 'application/vnd.ms-powerpoint';
      const isPptx = ext === 'pptx' || file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

      if (isZip) {
        try {
          const { files: zipExtracted, ignoredCount } = await extractZipEntries(file);
          if (zipExtracted.length === 0) {
            if (showToast) {
              showToast(`No supported PDF or PPT/PPTX files found in "${file.name}".`, 'error');
            }
            continue;
          }

          if (ignoredCount > 0 && showToast) {
            showToast(`Extracted ${zipExtracted.length} file${zipExtracted.length > 1 ? 's' : ''} from "${file.name}" (${ignoredCount} unsupported file${ignoredCount > 1 ? 's' : ''} skipped).`, 'info');
          } else if (showToast) {
            showToast(`Successfully extracted ${zipExtracted.length} file${zipExtracted.length > 1 ? 's' : ''} from "${file.name}".`, 'success');
          }

          filesToProcess.push(...zipExtracted);
        } catch (zipErr: any) {
          console.error('ZIP extraction error:', zipErr);
          if (showToast) {
            showToast(zipErr.message || `Failed to extract "${file.name}".`, 'error');
          }
        }
      } else if (isPdf || isPpt || isPptx) {
        filesToProcess.push(file);
      } else {
        if (showToast) {
          showToast(`Unsupported file "${file.name}". Only PDF, PPT, PPTX, and ZIP files are supported.`, 'error');
        }
      }
    }

    if (filesToProcess.length === 0) return;

    const newItems: UploadQueueItem[] = [];
    const filesToAnalyze: { id: string; file: File }[] = [];

    for (const file of filesToProcess) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const isPdf = file.type === 'application/pdf' || ext === 'pdf';

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

      if (isPdf) {
        filesToAnalyze.push({ id: generatedId, file });
      }
    }

    if (newItems.length > 0) {
      setFiles(prev => [...prev, ...newItems]);

      if (ai.isEnabled) {
        const catalogOptions = subjects.length > 0
          ? subjects.map(s => ({ id: s.id, name: s.name }))
          : [];

        ai.analyzeFiles(
          filesToAnalyze,
          DocumentTypes.PYQ,
          catalogOptions,
          { college, branch, semester },
          (id: string, metadata: MappedFirestoreMetadata) => {
            setFiles(prev => prev.map(item => {
              if (item.id === id) {
                const matchedSub = metadata.subjectId
                  ? subjects.find(s => s.id.toLowerCase() === metadata.subjectId!.toLowerCase())
                  : undefined;
                return {
                  ...item,
                  subject: matchedSub ? matchedSub.id : '',
                  displaySubject: matchedSub ? matchedSub.name : '',
                  examType: metadata.examType || item.examType,
                  examYear: metadata.examYear || item.examYear,
                  topics: metadata.topics || [],
                  aiGenerated: metadata.aiGenerated,
                  aiConfidence: metadata.confidence,
                  aiModel: metadata.aiModel,
                  aiVersion: metadata.aiVersion,
                  analysisDurationMs: metadata.analysisDurationMs
                };
              }
              return item;
            }));
          }
        );
      }
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
          const matchedSubject = subjects.find(s => s.id.toLowerCase() === (value || '').toLowerCase());
          return {
            ...item,
            subject: matchedSubject ? matchedSubject.id : '',
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
    ai.removeFileState(id);
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
    ai.clearHistoryCache();
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
  const isQueueValid = files.length > 0 && files.every(f => 
    !!f.subject && 
    subjects.some(s => s.id.toLowerCase() === f.subject.toLowerCase()) && 
    !!f.examType && 
    !!f.examYear
  );
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
        const validSubject = subjects.find(s => s.id.toLowerCase() === cleanSubjectId);
        if (!validSubject) {
          throw new Error(`Invalid subject "${item.subject}" - not found in official catalog for selected college, branch, and semester.`);
        }
        const normalizedExamType = getNormalizedExamType(item.examType);
        const fileExtension = item.file.name.substring(item.file.name.lastIndexOf('.') + 1).toLowerCase() || 'pdf';
        const isPptx = fileExtension === 'ppt' || fileExtension === 'pptx';
        const safeSubject = item.displaySubject.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
        const standardizedFileName = `${safeSubject}.${normalizedExamType}.${item.examYear}.${fileExtension}`;
        const standardizedTitle = `${safeSubject}.${normalizedExamType}.${item.examYear}`;
        const storagePath = isPptx
          ? `pyqs/${semester.trim()}/${cleanSubjectId}-pyq-${docId}/original/${standardizedFileName}`
          : `pyqs/${semester.trim()}/${cleanSubjectId}-pyq-${docId}/${standardizedFileName}`;

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

        const mimeType = isPptx
          ? (fileExtension === 'ppt' ? 'application/vnd.ms-powerpoint' : 'application/vnd.openxmlformats-officedocument.presentationml.presentation')
          : (item.file.type || 'application/pdf');

        // Save PYQ document metadata in Firestore
        const docRef = doc(db, 'pyqs', docId);
        const docData: Record<string, any> = {
          documentId: docId,
          title: standardizedTitle,
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
          fileExtension: fileExtension,
          processingStatus: isPptx ? 'PROCESSING' : 'READY',
          ...(isPptx ? {
            originalFileExtension: fileExtension,
            originalMimeType: mimeType,
            originalStoragePath: storagePath,
            originalStoragePaths: [storagePath],
            originalFileUrl: downloadUrl,
            originalFileUrls: [downloadUrl],
          } : {}),
          isVerified: false,
          tags: item.topics || [],
          topics: item.topics || [],
          aiGenerated: item.aiGenerated || false,
          aiConfidence: item.aiConfidence ?? null,
          aiModel: item.aiModel || null,
          aiVersion: item.aiVersion || null,
          analysisDurationMs: item.analysisDurationMs || null,
          fileType: isPptx ? 'document' : 'pdf',
          mimeType: mimeType,
          thumbnailUrl: '',
          thumbnailGenerated: false,
          attachmentCount: 1,
          examType: normalizedExamType,
          examYear: item.examYear,
          college: college
        };

        await setDoc(docRef, docData);

        // Increment uploader stats
        const uploaderId = currentUser?.uid || 'admin-uploader';
        await incrementUserUploads(uploaderId, 'pyqs', 1);

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

  // Helper to determine validation issues for an individual queue item
  const getItemValidationIssues = (item: UploadQueueItem): string[] => {
    const issues: string[] = [];
    if (!item.subject) {
      issues.push('Subject is required');
    } else if (!subjects.some(s => s.id.toLowerCase() === item.subject.toLowerCase())) {
      issues.push('Valid catalog subject is required');
    }
    if (!item.examType) issues.push('Exam type is required');
    if (!item.examYear) issues.push('Year is required');
    if (item.status === 'failed' && item.error) issues.push(item.error);
    return issues;
  };

  const completedCount = files.filter(f => f.status === 'success').length;
  const isAnyUploading = files.some(f => f.status === 'uploading');
  const overallProgressMsg = isAnyUploading 
    ? `Uploading ${completedCount + 1} of ${files.length} files...` 
    : '';

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} className="max-w-5xl max-h-[90vh] flex flex-col min-h-0">
      <DialogHeader className="shrink-0 pb-2 border-b border-border/60 flex flex-row items-center justify-between">
        <div>
          <DialogTitle className="text-xl font-bold tracking-tight">Mass Upload PYQs</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Bulk upload student previous year question papers and PDFs to the repository.
          </DialogDescription>
        </div>
        <div className="shrink-0 pr-4">
          <AiAutofillToggle
            isEnabled={ai.isEnabled}
            onToggle={ai.toggleAi}
            disabled={isUploading}
          />
        </div>
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
            accept=".pdf,.ppt,.pptx,.zip,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/zip,application/x-zip-compressed"
            ref={fileInputRef}
            onChange={(e) => {
              handleAddFiles(e.target.files);
              e.target.value = '';
            }}
            className="hidden"
          />
          <Upload className={`h-10 w-10 mb-3 transition-transform ${isDragging ? 'animate-bounce text-violet-400' : 'text-violet-500'}`} />
          <h3 className="font-bold text-foreground text-sm">Drag & Drop PDF, PPT/PPTX, or ZIP archive here</h3>
          <p className="text-xs text-muted-foreground mt-1">or click to browse local files (.pdf, .ppt, .pptx, .zip)</p>
        </div>

        {/* AI Analysis Summary Banner */}
        {ai.isEnabled && files.length > 0 && (
          <AiAnalysisSummaryBanner summary={ai.summary} isProcessing={ai.isProcessing} />
        )}

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
              {files.map((item) => {
                const aiState = ai.fileStates[item.id];
                const isNeedsReview = !!(ai.isEnabled && aiState?.status === 'needs_review');
                const validationIssues = getItemValidationIssues(item);
                const hasBlockingError = validationIssues.length > 0 && item.status !== 'success' && item.status !== 'uploading';

                let cardStateClass = 'border-border/80 bg-zinc-950/80 shadow-md hover:border-border/100 hover:shadow-lg';
                if (item.status === 'uploading') {
                  cardStateClass = 'border-blue-500/30 bg-blue-500/[0.03] shadow-md';
                } else if (item.status === 'success') {
                  cardStateClass = 'border-emerald-500/30 bg-emerald-500/[0.03] shadow-md';
                } else if (hasBlockingError) {
                  // Red: blocking issue (takes precedence for container border and tint)
                  cardStateClass = 'border-red-500/60 bg-red-500/[0.04] shadow-[0_0_12px_rgba(239,68,68,0.12)] hover:border-red-500/80';
                } else if (isNeedsReview) {
                  // Yellow: AI review required
                  cardStateClass = 'border-amber-500/60 bg-amber-500/[0.04] shadow-[0_0_12px_rgba(245,158,11,0.12)] hover:border-amber-500/80';
                } else if (item.isExpanded) {
                  cardStateClass = 'border-violet-500/30 bg-violet-500/[0.03] shadow-lg';
                }

                return (
                  <div 
                    key={item.id} 
                    className={`border rounded-lg overflow-hidden transition-all duration-200 ${cardStateClass}`}
                  >
                    {/* Item Header */}
                    <div 
                      onClick={() => toggleExpand(item.id)}
                      className="flex items-center justify-between p-3 select-none hover:bg-accent/15 cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <FileText className={`h-4 w-4 shrink-0 ${hasBlockingError ? 'text-red-400' : isNeedsReview ? 'text-amber-400' : 'text-primary'}`} />
                        <div className="min-w-0 flex-1 pr-4">
                          <span className="font-semibold text-foreground truncate block" title={item.file.name}>
                            {item.file.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatFileSize(item.file.size)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0 flex-wrap justify-end">
                        {/* Red Blocking Validation Badge */}
                        {hasBlockingError && (
                          <span 
                            className="text-red-400 bg-red-500/15 border border-red-500/40 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wide flex items-center gap-1 font-bold cursor-help"
                            title={validationIssues.join(' • ')}
                          >
                            <AlertCircle className="h-2.5 w-2.5 text-red-400 shrink-0" />
                            <span>{validationIssues.length === 1 ? validationIssues[0] : `${validationIssues.length} issues to fix`}</span>
                          </span>
                        )}

                        {/* AI State Badge */}
                        {ai.isEnabled && aiState && (
                          <span className="flex items-center gap-1 font-bold">
                            {aiState.status === 'waiting' && (
                              <span className="text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wide flex items-center gap-1">
                                🟣 Waiting
                              </span>
                            )}
                            {aiState.status === 'reading_pdf' && (
                              <span className="text-blue-300 bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wide flex items-center gap-1">
                                <Loader2 className="h-2.5 w-2.5 animate-spin text-blue-400" /> Reading PDF
                              </span>
                            )}
                            {aiState.status === 'ai_processing' && (
                              <span className="text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wide flex items-center gap-1">
                                <Loader2 className="h-2.5 w-2.5 animate-spin text-amber-400" /> AI Processing
                              </span>
                            )}
                            {aiState.status === 'ready' && (
                              <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wide flex items-center gap-1">
                                <CheckCircle className="h-2.5 w-2.5 text-emerald-400" /> Ready
                              </span>
                            )}
                            {aiState.status === 'needs_review' && (
                              <span 
                                className="text-amber-400 bg-amber-500/15 border border-amber-500/40 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wide flex items-center gap-1 font-bold cursor-help" 
                                title="AI confidence is below 70%, please verify metadata manually."
                              >
                                <AlertCircle className="h-2.5 w-2.5 text-amber-400 shrink-0" /> Needs Review
                              </span>
                            )}
                            {aiState.status === 'failed' && (
                              <span className="text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wide flex items-center gap-1" title={aiState.error}>
                                <XCircle className="h-2.5 w-2.5 text-rose-400" /> AI Failed
                              </span>
                            )}
                          </span>
                        )}

                        {/* Status Indicator */}
                        <span className="flex items-center gap-1 font-bold">
                          {item.status === 'queued' && !ai.isEnabled && !hasBlockingError && (
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
                            disabled={isUploading || item.status === 'success'}
                            className={`bg-card text-foreground ${!item.subject || !subjects.some(s => s.id.toLowerCase() === item.subject.toLowerCase()) ? 'border-red-500/50 focus:border-red-500' : ''}`}
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
                            className={`bg-card text-foreground ${!item.examType ? 'border-red-500/50 focus:border-red-500' : ''}`}
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
                            className={`bg-card text-foreground ${!item.examYear ? 'border-red-500/50 focus:border-red-500' : ''}`}
                          >
                            <option value="">Select Year</option>
                            {availableYears.map((yr) => (
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
              );
            })}
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
