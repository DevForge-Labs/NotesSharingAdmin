import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  InteractiveHubSession,
  ActiveInteractiveHubConfig,
  InteractiveHubResponse,
  SurveyAnalytics
} from '@/types/interactiveHub';

const SESSIONS_COLLECTION = 'interactive_hub_sessions';
const RESPONSES_COLLECTION = 'interactive_hub_responses';
const APP_CONFIG_COLLECTION = 'app_config';
const ACTIVE_CONFIG_DOC = 'active_interactive_hub';

function sanitizeForFirestore<T extends Record<string, any>>(obj: T): any {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        cleaned[key] = sanitizeForFirestore(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

export const interactiveHubService = {
  /**
   * Fetch all Interactive Hub sessions ordered by creation date descending
   */
  async getAllSessions(): Promise<InteractiveHubSession[]> {
    try {
      const q = query(collection(db, SESSIONS_COLLECTION), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const sessions: InteractiveHubSession[] = [];
      snapshot.forEach((docSnap) => {
        sessions.push(docSnap.data() as InteractiveHubSession);
      });
      return sessions;
    } catch (error) {
      console.warn('Failed to query with orderBy, falling back to unordered fetch:', error);
      const snapshot = await getDocs(collection(db, SESSIONS_COLLECTION));
      const sessions: InteractiveHubSession[] = [];
      snapshot.forEach((docSnap) => {
        sessions.push(docSnap.data() as InteractiveHubSession);
      });
      return sessions.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
  },

  /**
   * Fetch current active hub configuration from app_config/active_interactive_hub
   */
  async getActiveConfig(): Promise<ActiveInteractiveHubConfig | null> {
    const docRef = doc(db, APP_CONFIG_COLLECTION, ACTIVE_CONFIG_DOC);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as ActiveInteractiveHubConfig;
  },

  /**
   * Create a new session
   */
  async createSession(
    data: Omit<InteractiveHubSession, 'sessionId' | 'createdAt' | 'updatedAt'>,
    adminEmail: string
  ): Promise<InteractiveHubSession> {
    const sessionId = `hub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();

    const session: InteractiveHubSession = {
      ...data,
      sessionId,
      createdAt: now,
      updatedAt: now,
      createdBy: adminEmail
    };

    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
    await setDoc(sessionRef, sanitizeForFirestore(session));

    // If created directly in ACTIVE status, activate it
    if (session.status === 'ACTIVE') {
      await this.startSession(sessionId);
    }

    return session;
  },

  /**
   * Update an existing session
   */
  async updateSession(
    sessionId: string,
    updates: Partial<InteractiveHubSession>
  ): Promise<void> {
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
    const updatedData = {
      ...updates,
      updatedAt: Date.now()
    };
    await updateDoc(sessionRef, sanitizeForFirestore(updatedData));

    // If this session is currently active in app_config, update active snapshot as well
    const activeConfig = await this.getActiveConfig();
    if (activeConfig?.isActive && activeConfig.activeSessionId === sessionId) {
      const updatedSnap = await getDoc(sessionRef);
      if (updatedSnap.exists()) {
        const fullSession = updatedSnap.data() as InteractiveHubSession;
        await setDoc(doc(db, APP_CONFIG_COLLECTION, ACTIVE_CONFIG_DOC), sanitizeForFirestore({
          isActive: true,
          activeSessionId: sessionId,
          session: fullSession,
          updatedAt: Date.now()
        }));
      }
    }
  },

  /**
   * Start a session manually (or enforce single active session constraint)
   * If the session was previously COMPLETED, EXPIRED, or ARCHIVED, it automatically
   * spawns a fresh run with a new sessionId, resetting survey results and user interaction caches.
   */
  async startSession(sessionId: string, adminEmail?: string): Promise<InteractiveHubSession> {
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
    const sessionSnap = await getDoc(sessionRef);
    if (!sessionSnap.exists()) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const sessionData = sessionSnap.data() as InteractiveHubSession;
    const now = Date.now();

    const batch = writeBatch(db);

    // 1. Deactivate any currently active sessions in the database
    const allActiveQuery = query(
      collection(db, SESSIONS_COLLECTION),
      where('status', '==', 'ACTIVE')
    );
    const activeSnapshots = await getDocs(allActiveQuery);
    activeSnapshots.forEach((activeDoc) => {
      if (activeDoc.id !== sessionId) {
        batch.update(activeDoc.ref, {
          status: 'COMPLETED',
          updatedAt: now
        });
      }
    });

    // 2. If the session was previously COMPLETED, EXPIRED, or ARCHIVED,
    // start it as a brand-new run with a fresh sessionId so that:
    // - Survey results start clean at 0.
    // - Android users receive a new sessionId and see the card freshly.
    // - The historical completed session remains intact in database with its original analytics.
    if (sessionData.status === 'COMPLETED' || sessionData.status === 'EXPIRED' || sessionData.status === 'ARCHIVED') {
      const newSessionId = `hub_${now}_${Math.random().toString(36).substring(2, 7)}`;
      const freshSession: InteractiveHubSession = {
        ...sessionData,
        sessionId: newSessionId,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
        createdBy: adminEmail || sessionData.createdBy || 'admin@notessharing.com'
      };

      const newSessionRef = doc(db, SESSIONS_COLLECTION, newSessionId);
      batch.set(newSessionRef, sanitizeForFirestore(freshSession));

      const activeConfigRef = doc(db, APP_CONFIG_COLLECTION, ACTIVE_CONFIG_DOC);
      batch.set(activeConfigRef, sanitizeForFirestore({
        isActive: true,
        activeSessionId: newSessionId,
        session: freshSession,
        updatedAt: now
      }));

      await batch.commit();
      return freshSession;
    }

    // Otherwise, this was a DRAFT or SCHEDULED session being started for the first time
    const activatedSession: InteractiveHubSession = {
      ...sessionData,
      status: 'ACTIVE',
      updatedAt: now
    };
    batch.update(sessionRef, {
      status: 'ACTIVE',
      updatedAt: now
    });

    // 3. Sync to app_config/active_interactive_hub
    const activeConfigRef = doc(db, APP_CONFIG_COLLECTION, ACTIVE_CONFIG_DOC);
    batch.set(activeConfigRef, sanitizeForFirestore({
      isActive: true,
      activeSessionId: sessionId,
      session: activatedSession,
      updatedAt: now
    }));

    await batch.commit();
    return activatedSession;
  },

  /**
   * Finish an active session manually
   */
  async finishSession(sessionId: string): Promise<void> {
    const now = Date.now();
    const batch = writeBatch(db);

    // 1. Mark session as COMPLETED
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
    batch.update(sessionRef, {
      status: 'COMPLETED',
      updatedAt: now
    });

    // 2. Check if active in app_config and clear it
    const activeConfigRef = doc(db, APP_CONFIG_COLLECTION, ACTIVE_CONFIG_DOC);
    const activeConfigSnap = await getDoc(activeConfigRef);
    if (activeConfigSnap.exists()) {
      const config = activeConfigSnap.data() as ActiveInteractiveHubConfig;
      if (config.activeSessionId === sessionId) {
        batch.set(activeConfigRef, {
          isActive: false,
          activeSessionId: null,
          session: null,
          updatedAt: now
        });
      }
    }

    await batch.commit();
  },

  /**
   * Archive a session
   */
  async archiveSession(sessionId: string): Promise<void> {
    const activeConfig = await this.getActiveConfig();
    if (activeConfig?.isActive && activeConfig.activeSessionId === sessionId) {
      await this.finishSession(sessionId);
    }

    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
    await updateDoc(sessionRef, {
      status: 'ARCHIVED',
      updatedAt: Date.now()
    });
  },

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const activeConfig = await this.getActiveConfig();
    if (activeConfig?.isActive && activeConfig.activeSessionId === sessionId) {
      await this.finishSession(sessionId);
    }

    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
    await deleteDoc(sessionRef);
  },

  /**
   * Repeat / Clone a session. Generates a fresh sessionId, sets status to DRAFT,
   * keeping survey analytics separated.
   */
  async repeatSession(
    session: InteractiveHubSession,
    adminEmail: string
  ): Promise<InteractiveHubSession> {
    const newSessionId = `hub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();

    const clonedSession: InteractiveHubSession = {
      ...session,
      sessionId: newSessionId,
      title: `${session.title} (Repeat)`,
      status: 'DRAFT',
      startTime: null,
      endTime: null,
      createdAt: now,
      updatedAt: now,
      createdBy: adminEmail
    };

    const sessionRef = doc(db, SESSIONS_COLLECTION, newSessionId);
    await setDoc(sessionRef, sanitizeForFirestore(clonedSession));
    return clonedSession;
  },

  /**
   * Fetch survey analytics for a specific survey session
   */
  async getSurveyAnalytics(
    sessionId: string,
    surveyOptions: string[] = ['YES', 'NO']
  ): Promise<SurveyAnalytics> {
    try {
      const q = query(
        collection(db, RESPONSES_COLLECTION),
        where('sessionId', '==', sessionId)
      );
      const snap = await getDocs(q);

      const counts: Record<string, number> = {};
      surveyOptions.forEach((opt) => {
        counts[opt.toUpperCase()] = 0;
      });

      let total = 0;
      snap.forEach((docSnap) => {
        const respData = docSnap.data() as InteractiveHubResponse;
        const answer = (respData.response || '').toUpperCase().trim();
        if (answer) {
          counts[answer] = (counts[answer] || 0) + 1;
          total += 1;
        }
      });

      // Combine defined options and any recorded options
      const recordedKeys = Object.keys(counts).filter(k => counts[k] > 0);
      const combinedOptions = Array.from(new Set([...surveyOptions.map(o => o.toUpperCase().trim()), ...recordedKeys]));

      const options = combinedOptions.map((opt) => {
        const c = counts[opt] || 0;
        const percentage = total > 0 ? Math.round((c / total) * 1000) / 10 : 0;
        return {
          label: opt,
          count: c,
          percentage
        };
      });

      return {
        sessionId,
        totalResponses: total,
        options
      };
    } catch (error) {
      console.error('Error fetching survey analytics:', error);
      return {
        sessionId,
        totalResponses: 0,
        options: surveyOptions.map((opt) => ({ label: opt, count: 0, percentage: 0 }))
      };
    }
  }
};
