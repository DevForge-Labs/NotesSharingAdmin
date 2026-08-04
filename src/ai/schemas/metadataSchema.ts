export interface DomainMetadataDTO {
  subjectId?: string | null;
  examType?: string | null; // MidSem | EndSem
  year?: number | null;
  estimatedSemester?: number | null;
  branch?: string | null;
  resourceType?: string | null;
  topics: string[];
  title?: string | null;
  description?: string | null;
  confidence: number;
}

export const geminiResponseSchema = {
  type: 'OBJECT',
  properties: {
    subjectId: { 
      type: 'STRING', 
      description: 'Subject ID selected strictly from the provided allowed subject catalog options, or null if uncertain.' 
    },
    examType: { 
      type: 'STRING', 
      description: 'Exam type if applicable: MidSem or EndSem.' 
    },
    year: { 
      type: 'INTEGER', 
      description: '4-digit examination or publication year e.g. 2025.' 
    },
    estimatedSemester: { 
      type: 'INTEGER', 
      description: 'Semester number from 1 to 8 if inferable, or null.' 
    },
    branch: { 
      type: 'STRING', 
      description: 'Branch code e.g. cse, it, etc., if inferable.' 
    },
    resourceType: { 
      type: 'STRING', 
      description: 'Categorized resource type strictly selected from the allowed resource types list.' 
    },
    topics: { 
      type: 'ARRAY', 
      items: { type: 'STRING' },
      description: 'List of key academic topics or concepts covered in the document.'
    },
    title: { 
      type: 'STRING', 
      description: 'Clean, descriptive title for the document.' 
    },
    description: { 
      type: 'STRING', 
      description: 'Concise one-line summary of the document contents.' 
    },
    confidence: { 
      type: 'NUMBER', 
      description: 'Confidence score between 0.0 and 1.0 for the overall extraction accuracy.' 
    }
  },
  required: ['confidence', 'topics']
};
