export type InteractiveHubType = 'ANNOUNCEMENT' | 'PROMOTION' | 'SURVEY';

export type InteractiveHubStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'ARCHIVED';

export interface InteractiveHubSession {
  sessionId: string;
  title: string;
  body: string;
  type: InteractiveHubType;
  ctaText?: string;
  targetDestination?: string;
  surveyOptions?: string[];
  status: InteractiveHubStatus;
  startMode: 'MANUAL' | 'SCHEDULED';
  startTime?: number | null;
  endTime?: number | null;
  repeatable: boolean;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

export interface ActiveInteractiveHubConfig {
  isActive: boolean;
  activeSessionId: string | null;
  session: InteractiveHubSession | null;
  updatedAt: number;
}

export interface InteractiveHubResponse {
  responseId: string;
  sessionId: string;
  userId: string;
  response: string;
  createdAt: number;
}

export interface SurveyAnalytics {
  sessionId: string;
  totalResponses: number;
  options: {
    label: string;
    count: number;
    percentage: number;
  }[];
}

export interface DestinationOption {
  id: string;
  label: string;
  category: string;
  description: string;
}

export const SUPPORTED_DESTINATIONS: DestinationOption[] = [
  { id: 'exam_prep', label: 'Exam Preparation', category: 'Academics', description: 'Curated exam resources & past questions' },
  { id: 'notes', label: 'Trending Notes', category: 'Study Materials', description: 'Top uploaded notes by peers' },
  { id: 'assignments', label: 'Assignments', category: 'Study Materials', description: 'Semester assignment solutions' },
  { id: 'videos', label: 'Recommended Videos', category: 'Video Hub', description: 'Curated educational video lectures' },
  { id: 'classroom', label: 'Google Classroom', category: 'Integrations', description: 'Direct access to synced courses' },
  { id: 'classroom_upcoming', label: 'Upcoming Assignments', category: 'Integrations', description: 'Pending classroom deadlines' },
  { id: 'upload', label: 'Upload Resource', category: 'Actions', description: 'Contribute notes, PYQs or videos' },
  { id: 'my_bookmarks', label: 'My Bookmarks', category: 'Personal', description: 'Saved library resources' },
  { id: 'my_files', label: 'My Downloads / Files', category: 'Personal', description: 'Downloaded offline files' },
  { id: 'profile', label: 'User Profile', category: 'Account', description: 'User account & stats' },
  { id: 'search', label: 'Search Library', category: 'Exploration', description: 'Deep search across all subjects' },
  { id: 'explore', label: 'Explore Hub', category: 'Exploration', description: 'Discover trending topics' },
];
