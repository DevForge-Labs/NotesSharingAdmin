import { DomainMetadataDTO } from '@/ai/schemas/metadataSchema';
import { SubjectOption } from '@/ai/prompts/metadataPrompt';
import { DocumentTypes, DocumentType } from '@/constants/documentTypes';

export interface MappedFirestoreMetadata {
  title?: string;
  description?: string;
  subjectId?: string;
  displaySubject?: string;
  subject?: string;
  semester?: string;
  branch?: string;
  college?: string;
  examType?: string;
  examYear?: string;
  section?: string;
  resourceType?: string;
  topics?: string[];
  tags?: string[];
  confidence: number;
  aiGenerated: boolean;
  aiConfidence?: number;
  aiModel?: string;
  aiVersion?: string;
  analysisDurationMs?: number;
}

export function mapDomainDtoToFirestore(
  dto: DomainMetadataDTO & { section?: string },
  documentType: DocumentType,
  subjectCatalog: SubjectOption[],
  currentContext?: {
    college?: string;
    branch?: string;
    semester?: string;
  }
): MappedFirestoreMetadata {
  // Resolve subject
  const subjectId = dto.subjectId || undefined;
  let displaySubject: string | undefined = undefined;
  if (subjectId) {
    const found = subjectCatalog.find(s => s.id.toLowerCase() === subjectId.toLowerCase());
    displaySubject = found ? found.name : subjectId;
  }

  // Resolve semester string ("Semester X")
  let semesterStr: string | undefined = currentContext?.semester;
  if (dto.estimatedSemester && (!semesterStr || semesterStr === '')) {
    semesterStr = `Semester ${dto.estimatedSemester}`;
  }

  // Resolve branch & college
  const branch = dto.branch || currentContext?.branch || undefined;
  const college = currentContext?.college || undefined;

  // Topics & Tags
  const topics = Array.isArray(dto.topics) ? dto.topics : [];

  const base: MappedFirestoreMetadata = {
    title: dto.title || undefined,
    description: dto.description || undefined,
    subjectId: subjectId,
    displaySubject: displaySubject,
    subject: subjectId, // Backward compatibility
    semester: semesterStr,
    branch: branch,
    college: college,
    section: dto.section || undefined,
    resourceType: dto.resourceType || undefined,
    topics: topics,
    tags: topics,
    confidence: dto.confidence || 0,
    aiGenerated: false,
    aiConfidence: dto.confidence || 0
  };

  if (documentType === DocumentTypes.PYQ) {
    base.examType = dto.examType || undefined;
    base.examYear = dto.year ? dto.year.toString() : undefined;
  }

  return base;
}
