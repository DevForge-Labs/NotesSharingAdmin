import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  InteractiveHubSession,
  InteractiveHubType,
  InteractiveHubStatus,
  SurveyAnalytics,
  SUPPORTED_DESTINATIONS
} from '@/types/interactiveHub';
import { interactiveHubService } from '@/services/interactiveHubService';
import { MobilePreview } from '@/components/interactiveHub/MobilePreview';
import {
  Sparkles,
  Plus,
  Play,
  Square,
  Copy,
  Edit2,
  Trash2,
  Archive,
  BarChart2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  Eye,
  Layers,
  ArrowRight,
  Vote,
  Compass,
  X,
  Radio,
  Sliders
} from 'lucide-react';

export const InteractiveHub: React.FC = () => {
  const { user } = useAuth();

  // State
  const [sessions, setSessions] = useState<InteractiveHubSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'SCHEDULED' | 'SURVEYS' | 'COMPLETED' | 'ARCHIVED'>('ALL');

  // Preview state (linked to selected or edited session)
  const [previewData, setPreviewData] = useState<{
    title: string;
    body: string;
    type: InteractiveHubType;
    ctaText: string;
    targetDestination: string;
    surveyOptions: string[];
  }>({
    title: 'EXAM TIME!!',
    body: 'End-sem exams are approaching. Access curated PYQs, notes, and study resources now.',
    type: 'ANNOUNCEMENT',
    ctaText: "LET'S GO",
    targetDestination: 'exam_prep',
    surveyOptions: ['YES', 'NO']
  });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSession, setEditingSession] = useState<InteractiveHubSession | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form states
  const [formTitle, setFormTitle] = useState<string>('');
  const [formBody, setFormBody] = useState<string>('');
  const [formType, setFormType] = useState<InteractiveHubType>('ANNOUNCEMENT');
  const [formCtaText, setFormCtaText] = useState<string>("LET'S GO");
  const [formDestination, setFormDestination] = useState<string>('exam_prep');
  const [formSurveyOptions, setFormSurveyOptions] = useState<string[]>(['YES', 'NO']);
  const [formStartMode, setFormStartMode] = useState<'MANUAL' | 'SCHEDULED'>('MANUAL');
  const [formStartTime, setFormStartTime] = useState<string>('');
  const [formEndTime, setFormEndTime] = useState<string>('');
  const [formRepeatable, setFormRepeatable] = useState<boolean>(true);
  const [formError, setFormError] = useState<string>('');

  // Analytics state
  const [selectedAnalytics, setSelectedAnalytics] = useState<SurveyAnalytics | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState<boolean>(false);
  const [analyticsModalSession, setAnalyticsModalSession] = useState<InteractiveHubSession | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load sessions and active config
  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [allSessions, activeConfig] = await Promise.all([
        interactiveHubService.getAllSessions(),
        interactiveHubService.getActiveConfig()
      ]);

      setSessions(allSessions);
      setActiveSessionId(activeConfig?.isActive ? activeConfig.activeSessionId : null);

      // If active session exists, set preview to it by default
      if (activeConfig?.isActive && activeConfig.session) {
        setPreviewData({
          title: activeConfig.session.title,
          body: activeConfig.session.body,
          type: activeConfig.session.type,
          ctaText: activeConfig.session.ctaText || "LET'S GO",
          targetDestination: activeConfig.session.targetDestination || 'exam_prep',
          surveyOptions: activeConfig.session.surveyOptions || ['YES', 'NO']
        });
      }
    } catch (err: any) {
      console.error('Failed to load Interactive Hub data:', err);
      showToast('Failed to load sessions: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update preview whenever form changes inside modal
  useEffect(() => {
    if (isModalOpen) {
      setPreviewData({
        title: formTitle,
        body: formBody,
        type: formType,
        ctaText: formCtaText,
        targetDestination: formDestination,
        surveyOptions: formSurveyOptions
      });
    }
  }, [formTitle, formBody, formType, formCtaText, formDestination, formSurveyOptions, isModalOpen]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingSession(null);
    setFormTitle('');
    setFormBody('');
    setFormType('ANNOUNCEMENT');
    setFormCtaText("LET'S GO");
    setFormDestination('exam_prep');
    setFormSurveyOptions(['YES', 'NO']);
    setFormStartMode('MANUAL');
    setFormStartTime('');
    setFormEndTime('');
    setFormRepeatable(true);
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (session: InteractiveHubSession) => {
    setEditingSession(session);
    setFormTitle(session.title);
    setFormBody(session.body);
    setFormType(session.type);
    setFormCtaText(session.ctaText || "LET'S GO");
    setFormDestination(session.targetDestination || 'exam_prep');
    setFormSurveyOptions(session.surveyOptions && session.surveyOptions.length > 0 ? session.surveyOptions : ['YES', 'NO']);
    setFormStartMode(session.startMode || 'MANUAL');
    setFormStartTime(session.startTime ? new Date(session.startTime).toISOString().slice(0, 16) : '');
    setFormEndTime(session.endTime ? new Date(session.endTime).toISOString().slice(0, 16) : '');
    setFormRepeatable(session.repeatable ?? true);
    setFormError('');
    setIsModalOpen(true);
  };

  // Handle Submit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formTitle.trim()) {
      setFormError('Title is required');
      return;
    }
    if (!formBody.trim()) {
      setFormError('Body text is required');
      return;
    }
    if (formType === 'SURVEY') {
      const validOptions = formSurveyOptions.map(o => o.trim()).filter(Boolean);
      if (validOptions.length < 2) {
        setFormError('Surveys require at least 2 distinct response options');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const startTimestamp = formStartMode === 'SCHEDULED' && formStartTime ? new Date(formStartTime).getTime() : null;
      const endTimestamp = formEndTime ? new Date(formEndTime).getTime() : null;

      if (editingSession) {
        // Update existing session
        await interactiveHubService.updateSession(editingSession.sessionId, {
          title: formTitle.trim(),
          body: formBody.trim(),
          type: formType,
          ctaText: formType === 'SURVEY' ? '' : (formCtaText.trim() || "LET'S GO"),
          targetDestination: formType === 'SURVEY' ? '' : formDestination,
          surveyOptions: formType === 'SURVEY' ? formSurveyOptions.map(o => o.trim()).filter(Boolean) : [],
          startMode: formStartMode,
          startTime: startTimestamp,
          endTime: endTimestamp,
          repeatable: formRepeatable
        });
        showToast('Session updated successfully');
      } else {
        // Create new session
        const initialStatus: InteractiveHubStatus = formStartMode === 'SCHEDULED' ? 'SCHEDULED' : 'DRAFT';
        await interactiveHubService.createSession(
          {
            title: formTitle.trim(),
            body: formBody.trim(),
            type: formType,
            ctaText: formType === 'SURVEY' ? '' : (formCtaText.trim() || "LET'S GO"),
            targetDestination: formType === 'SURVEY' ? '' : formDestination,
            surveyOptions: formType === 'SURVEY' ? formSurveyOptions.map(o => o.trim()).filter(Boolean) : [],
            status: initialStatus,
            startMode: formStartMode,
            startTime: startTimestamp,
            endTime: endTimestamp,
            repeatable: formRepeatable
          },
          user?.email || 'admin@notessharing.com'
        );
        showToast('New session created in DRAFT status');
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error('Error saving session:', err);
      setFormError(err.message || 'Failed to save session');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manual Start Session
  const handleStartSession = async (session: InteractiveHubSession) => {
    const isRestart = session.status === 'COMPLETED' || session.status === 'EXPIRED' || session.status === 'ARCHIVED';
    const message = isRestart
      ? `Start a fresh run of "${session.title}"? This will create a brand-new session ID, reset survey votes to 0, and show it freshly to all students on Android Home.`
      : `Start session "${session.title}" now? This will immediately make it active on the Android Home screen.`;

    if (!window.confirm(message)) {
      return;
    }

    try {
      const started = await interactiveHubService.startSession(session.sessionId, user?.email || 'admin@notessharing.com');
      showToast(
        isRestart
          ? `Started fresh run of "${started.title}" with clean results! (New ID: ${started.sessionId})`
          : `Session "${started.title}" is now ACTIVE on Android Home!`
      );
      await loadData();
    } catch (err: any) {
      console.error('Failed to start session:', err);
      showToast('Error starting session: ' + err.message, 'error');
    }
  };

  // Manual Finish Session
  const handleFinishSession = async (session: InteractiveHubSession) => {
    if (!window.confirm(`Finish session "${session.title}"? It will immediately disappear from the Android Home screen.`)) {
      return;
    }

    try {
      await interactiveHubService.finishSession(session.sessionId);
      showToast(`Session "${session.title}" has been FINISHED and removed from Home.`);
      await loadData();
    } catch (err: any) {
      console.error('Failed to finish session:', err);
      showToast('Error finishing session: ' + err.message, 'error');
    }
  };

  // Repeat Session
  const handleRepeatSession = async (session: InteractiveHubSession) => {
    try {
      const cloned = await interactiveHubService.repeatSession(session, user?.email || 'admin@notessharing.com');
      showToast(`Cloned into new session "${cloned.title}" (ID: ${cloned.sessionId}). Fresh survey analytics generated!`);
      await loadData();
    } catch (err: any) {
      console.error('Failed to repeat session:', err);
      showToast('Error cloning session: ' + err.message, 'error');
    }
  };

  // Archive Session
  const handleArchiveSession = async (session: InteractiveHubSession) => {
    if (!window.confirm(`Archive "${session.title}"?`)) return;
    try {
      await interactiveHubService.archiveSession(session.sessionId);
      showToast(`Session "${session.title}" archived.`);
      await loadData();
    } catch (err: any) {
      showToast('Error archiving session: ' + err.message, 'error');
    }
  };

  // Delete Session
  const handleDeleteSession = async (session: InteractiveHubSession) => {
    if (!window.confirm(`Permanently delete "${session.title}"? This cannot be undone.`)) return;
    try {
      await interactiveHubService.deleteSession(session.sessionId);
      showToast(`Session deleted.`);
      await loadData();
    } catch (err: any) {
      showToast('Error deleting session: ' + err.message, 'error');
    }
  };

  // Open Survey Analytics
  const handleOpenAnalytics = async (session: InteractiveHubSession) => {
    setAnalyticsModalSession(session);
    setIsLoadingAnalytics(true);
    setSelectedAnalytics(null);
    try {
      const analytics = await interactiveHubService.getSurveyAnalytics(
        session.sessionId,
        session.surveyOptions || ['YES', 'NO']
      );
      setSelectedAnalytics(analytics);
    } catch (err: any) {
      console.error('Error loading analytics:', err);
      showToast('Failed to load survey analytics: ' + err.message, 'error');
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  // Survey Option Helpers in Form
  const handleAddSurveyOption = () => {
    if (formSurveyOptions.length < 6) {
      setFormSurveyOptions([...formSurveyOptions, `OPTION ${formSurveyOptions.length + 1}`]);
    }
  };

  const handleUpdateSurveyOption = (index: number, value: string) => {
    const updated = [...formSurveyOptions];
    updated[index] = value;
    setFormSurveyOptions(updated);
  };

  const handleRemoveSurveyOption = (index: number) => {
    if (formSurveyOptions.length > 2) {
      setFormSurveyOptions(formSurveyOptions.filter((_, i) => i !== index));
    }
  };

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.sessionId.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      switch (activeTab) {
        case 'ACTIVE':
          return s.status === 'ACTIVE';
        case 'SCHEDULED':
          return s.status === 'SCHEDULED';
        case 'SURVEYS':
          return s.type === 'SURVEY';
        case 'COMPLETED':
          return s.status === 'COMPLETED' || s.status === 'EXPIRED';
        case 'ARCHIVED':
          return s.status === 'ARCHIVED';
        case 'ALL':
        default:
          return s.status !== 'ARCHIVED';
      }
    });
  }, [sessions, searchQuery, activeTab]);

  // Destination resolver helper
  const getDestinationLabel = (id?: string) => {
    const found = SUPPORTED_DESTINATIONS.find(d => d.id === id);
    return found ? found.label : (id || 'Exam Preparation');
  };

  // Current Active Session Object
  const currentActiveSession = useMemo(() => {
    return sessions.find(s => s.sessionId === activeSessionId && s.status === 'ACTIVE') || null;
  }, [sessions, activeSessionId]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl border flex items-center space-x-2 text-sm font-medium transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
              : toastMessage.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-500/50'
              : 'bg-indigo-950/90 text-indigo-200 border-indigo-500/50'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Interactive Hub</h1>
              <p className="text-xs text-zinc-400">
                Remotely manage announcements, promotions, navigation cards, and surveys on Android Home
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-semibold flex items-center space-x-1.5 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-indigo-500/25 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Campaign</span>
          </button>
        </div>
      </div>

      {/* Currently Active Session Hero Card */}
      {currentActiveSession ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-zinc-900/60 border border-indigo-500/40 p-5 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center space-x-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  Live on Android Home
                </span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold px-2 py-0.5 rounded-full border border-indigo-500/30 uppercase">
                  {currentActiveSession.type}
                </span>
              </div>
              <h3 className="text-lg font-black text-white">{currentActiveSession.title}</h3>
              <p className="text-xs text-zinc-300 line-clamp-2">{currentActiveSession.body}</p>
              <div className="flex items-center space-x-4 text-[11px] text-zinc-400 pt-1">
                {currentActiveSession.type === 'SURVEY' ? (
                  <span>Options: {currentActiveSession.surveyOptions?.join(' • ')}</span>
                ) : (
                  <span>Destination: <strong className="text-zinc-200">{getDestinationLabel(currentActiveSession.targetDestination)}</strong></span>
                )}
                <span>Session ID: <code className="text-zinc-300">{currentActiveSession.sessionId}</code></span>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => setPreviewData({
                  title: currentActiveSession.title,
                  body: currentActiveSession.body,
                  type: currentActiveSession.type,
                  ctaText: currentActiveSession.ctaText || "LET'S GO",
                  targetDestination: currentActiveSession.targetDestination || 'exam_prep',
                  surveyOptions: currentActiveSession.surveyOptions || ['YES', 'NO']
                })}
                className="px-3 py-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition border border-zinc-700"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View in Preview</span>
              </button>

              <button
                onClick={() => handleFinishSession(currentActiveSession)}
                className="px-3.5 py-2 bg-rose-600/90 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-lg shadow-rose-900/30 active:scale-95"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>FINISH SESSION</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900/50 border border-dashed border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 text-zinc-400 text-xs">
            <Radio className="w-4 h-4 text-zinc-500" />
            <span>No campaign is currently active on the Android Home screen. The slot is cleanly hidden on user devices.</span>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="text-xs text-indigo-400 font-bold hover:underline"
          >
            Launch one now →
          </button>
        </div>
      )}

      {/* Main Grid: Management (Left 7 Cols) + Live Mobile Preview (Right 5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Controls & Session Cards */}
        <div className="lg:col-span-7 space-y-4">
          {/* Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Tabs */}
            <div className="flex items-center space-x-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 text-xs font-medium w-full sm:w-auto overflow-x-auto">
              {(['ALL', 'ACTIVE', 'SCHEDULED', 'SURVEYS', 'COMPLETED', 'ARCHIVED'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                    activeTab === tab
                      ? 'bg-indigo-600 text-white font-bold shadow'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  {tab === 'SURVEYS' ? 'Surveys' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Sessions List */}
          {isLoading ? (
            <div className="py-16 text-center text-zinc-500 text-xs flex flex-col items-center">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
              <span>Loading campaigns...</span>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-10 text-center space-y-3">
              <Layers className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-sm font-semibold text-zinc-300">No campaigns found in this view</p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Create an announcement, feature promo, or survey to engage users on the Android Home screen.
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition inline-flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Campaign</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSessions.map((session) => {
                const isActive = session.status === 'ACTIVE';
                const isSurvey = session.type === 'SURVEY';

                return (
                  <div
                    key={session.sessionId}
                    className={`rounded-2xl p-4 transition-all duration-200 border bg-zinc-900/70 hover:bg-zinc-900 ${
                      isActive
                        ? 'border-indigo-500/60 shadow-lg shadow-indigo-950/20 ring-1 ring-indigo-500/30'
                        : 'border-zinc-800/90 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        {/* Badges */}
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider ${
                              session.status === 'ACTIVE'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : session.status === 'SCHEDULED'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : session.status === 'DRAFT'
                                ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                                : session.status === 'COMPLETED'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-zinc-800/80 text-zinc-500 border border-zinc-700'
                            }`}
                          >
                            {session.status}
                          </span>

                          <span
                            className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
                              session.type === 'SURVEY'
                                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                                : session.type === 'PROMOTION'
                                ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {session.type}
                          </span>

                          {session.startMode === 'SCHEDULED' && (
                            <span className="text-[9px] text-blue-300/80 font-medium flex items-center space-x-1">
                              <Clock className="w-2.5 h-2.5" />
                              <span>Scheduled</span>
                            </span>
                          )}
                        </div>

                        {/* Title & Body */}
                        <h4 className="text-sm font-bold text-white pt-1">{session.title}</h4>
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{session.body}</p>

                        {/* Details */}
                        <div className="pt-2 flex items-center space-x-3 text-[11px] text-zinc-400 flex-wrap gap-y-1">
                          {isSurvey ? (
                            <div className="flex items-center space-x-1 text-cyan-300/90 font-medium">
                              <Vote className="w-3 h-3" />
                              <span>Options: {session.surveyOptions?.join(', ')}</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 text-zinc-300 font-medium">
                              <ArrowRight className="w-3 h-3 text-indigo-400" />
                              <span>To: {getDestinationLabel(session.targetDestination)}</span>
                            </div>
                          )}

                          <span className="text-zinc-400">
                            Created {new Date(session.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Top Right Quick Actions */}
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={() => setPreviewData({
                            title: session.title,
                            body: session.body,
                            type: session.type,
                            ctaText: session.ctaText || "LET'S GO",
                            targetDestination: session.targetDestination || 'exam_prep',
                            surveyOptions: session.surveyOptions || ['YES', 'NO']
                          })}
                          title="Preview in Mobile Phone"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800 transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(session)}
                          title="Edit Session"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRepeatSession(session)}
                          title="Repeat / Clone Session"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-purple-400 hover:bg-zinc-800 transition"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center space-x-2">
                        {isActive ? (
                          <button
                            onClick={() => handleFinishSession(session)}
                            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow transition"
                          >
                            <Square className="w-3 h-3 fill-current" />
                            <span>FINISH SESSION</span>
                          </button>
                        ) : session.status === 'COMPLETED' || session.status === 'EXPIRED' || session.status === 'ARCHIVED' ? (
                          <button
                            onClick={() => handleStartSession(session)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow transition"
                            title="Start fresh run with a new session ID and clean results"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>START NEW RUN</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartSession(session)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow transition"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>START SESSION</span>
                          </button>
                        )}

                        {isSurvey && (
                          <button
                            onClick={() => handleOpenAnalytics(session)}
                            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-cyan-300 text-xs font-semibold flex items-center space-x-1.5 transition border border-cyan-500/20"
                          >
                            <BarChart2 className="w-3.5 h-3.5" />
                            <span>View Survey Results</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleArchiveSession(session)}
                          title="Archive"
                          className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded-lg transition"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSession(session)}
                          title="Delete"
                          className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Interactive Live Mobile Preview */}
        <div className="lg:col-span-5 sticky top-6 space-y-3">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Live Android Preview
            </span>
            <span className="text-[11px] text-zinc-400">Updates in real-time</span>
          </div>

          <MobilePreview
            title={previewData.title}
            body={previewData.body}
            type={previewData.type}
            ctaText={previewData.ctaText}
            targetDestination={previewData.targetDestination}
            surveyOptions={previewData.surveyOptions}
            destinationLabel={getDestinationLabel(previewData.targetDestination)}
          />
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* MODAL: Create / Edit Campaign */}
      {/* ════════════════════════════════════════════════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#12141c] border border-zinc-800 rounded-3xl w-full max-w-xl shadow-2xl p-6 relative my-8 animate-fadeIn">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">
              {editingSession ? 'Edit Campaign Session' : 'Create New Interactive Hub Campaign'}
            </h3>
            <p className="text-xs text-zinc-400 mb-5">
              Configure copy, campaign type, navigation route or survey choices, and schedule dates.
            </p>

            {formError && (
              <div className="mb-4 p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-xs text-rose-200 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              {/* Campaign Type Selector */}
              <div>
                <label className="block text-zinc-300 font-semibold mb-1.5">Campaign Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ANNOUNCEMENT', 'PROMOTION', 'SURVEY'] as InteractiveHubType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormType(t)}
                      className={`py-2 px-3 rounded-xl border text-center font-bold tracking-tight transition ${
                        formType === t
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/25'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
                      }`}
                    >
                      {t === 'ANNOUNCEMENT' ? 'Announcement' : t === 'PROMOTION' ? 'Feature Promo' : 'Survey'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g. EXAM TIME!! or USER REVIEW 👀"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                  maxLength={50}
                />
                <span className="text-[10px] text-zinc-400 mt-0.5 block text-right">{formTitle.length}/50</span>
              </div>

              {/* Body */}
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Body Text</label>
                <textarea
                  placeholder="Short, compelling announcement or survey question..."
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
                  maxLength={140}
                />
                <span className="text-[10px] text-zinc-400 mt-0.5 block text-right">{formBody.length}/140</span>
              </div>

              {/* Type Specific Fields */}
              {formType === 'SURVEY' ? (
                <div className="space-y-2.5 p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <label className="text-zinc-200 font-semibold">Survey Response Options</label>
                    {formSurveyOptions.length < 5 && (
                      <button
                        type="button"
                        onClick={handleAddSurveyOption}
                        className="text-[11px] text-indigo-400 font-bold hover:underline"
                      >
                        + Add Option
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {formSurveyOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <span className="w-5 text-zinc-400 font-mono text-[11px]">#{idx + 1}</span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleUpdateSurveyOption(idx, e.target.value)}
                          placeholder={`Option ${idx + 1}`}
                          className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
                          maxLength={20}
                        />
                        {formSurveyOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSurveyOption(idx)}
                            className="p-1 text-zinc-400 hover:text-rose-400 transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    Each user can vote once per survey. Subsequent app restarts keep the survey completed and hidden.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* CTA Text */}
                    <div>
                      <label className="block text-zinc-300 font-semibold mb-1">Button CTA Text</label>
                      <input
                        type="text"
                        placeholder="e.g. LET'S GO, TRY IT"
                        value={formCtaText}
                        onChange={(e) => setFormCtaText(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                        maxLength={20}
                      />
                    </div>

                    {/* Safe Destination Dropdown */}
                    <div>
                      <label className="block text-zinc-300 font-semibold mb-1">Target Screen / Destination</label>
                      <select
                        value={formDestination}
                        onChange={(e) => setFormDestination(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                      >
                        {SUPPORTED_DESTINATIONS.map((dest) => (
                          <option key={dest.id} value={dest.id}>
                            {dest.label} ({dest.category})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    Android clients map destination keys to internal navigation routes with safety guards against arbitrary URIs.
                  </p>
                </div>
              )}

              {/* Lifecycle & Scheduling */}
              <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-zinc-200 font-semibold">Start & Finish Control</label>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setFormStartMode('MANUAL')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                        formStartMode === 'MANUAL'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      Manual Control
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormStartMode('SCHEDULED')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                        formStartMode === 'SCHEDULED'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      Scheduled Dates
                    </button>
                  </div>
                </div>

                {formStartMode === 'SCHEDULED' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 animate-fadeIn">
                    <div>
                      <label className="block text-zinc-400 text-[11px] mb-1">Start Date & Time</label>
                      <input
                        type="datetime-local"
                        value={formStartTime}
                        onChange={(e) => setFormStartTime(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-2.5 py-1.5 text-zinc-100 text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 text-[11px] mb-1">End / Expiry Date & Time</label>
                      <input
                        type="datetime-local"
                        value={formEndTime}
                        onChange={(e) => setFormEndTime(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-2.5 py-1.5 text-zinc-100 text-[11px]"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="repeatableCheckbox"
                    checked={formRepeatable}
                    onChange={(e) => setFormRepeatable(e.target.checked)}
                    className="rounded bg-zinc-900 border-zinc-700 text-indigo-600 focus:ring-0"
                  />
                  <label htmlFor="repeatableCheckbox" className="text-zinc-300 select-none">
                    Allow Repeat / Clone in future campaigns
                  </label>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold transition shadow-md shadow-indigo-500/30 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingSession ? 'Save Changes' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* MODAL: Survey Analytics Breakdown */}
      {/* ════════════════════════════════════════════════════════════ */}
      {analyticsModalSession && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141c] border border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 relative animate-fadeIn">
            <button
              onClick={() => setAnalyticsModalSession(null)}
              className="absolute top-5 right-5 p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 mb-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                <BarChart2 className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Survey Results</h3>
                <p className="text-xs text-zinc-400 truncate max-w-xs">{analyticsModalSession.title}</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 mb-4 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
              {analyticsModalSession.body}
            </p>

            {isLoadingAnalytics ? (
              <div className="py-12 text-center text-zinc-500 text-xs flex flex-col items-center">
                <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-2" />
                <span>Aggregating votes from Firestore...</span>
              </div>
            ) : selectedAnalytics ? (
              <div className="space-y-4">
                {/* Total Stats Banner */}
                <div className="bg-gradient-to-r from-cyan-950/40 to-zinc-900 border border-cyan-500/30 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Total User Votes</span>
                    <p className="text-2xl font-black text-white">{selectedAnalytics.totalResponses}</p>
                  </div>
                  <div className="text-right text-[11px] text-zinc-400">
                    <span>Session: </span>
                    <code className="text-zinc-200">{selectedAnalytics.sessionId}</code>
                  </div>
                </div>

                {/* Option Breakdown Progress Bars */}
                <div className="space-y-3">
                  {selectedAnalytics.options.map((opt, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-zinc-200">{opt.label}</span>
                        <span className="text-zinc-400">
                          <strong className="text-white font-bold">{opt.count}</strong> votes ({opt.percentage}%)
                        </span>
                      </div>
                      {/* Bar Container */}
                      <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-700"
                          style={{ width: `${opt.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 text-[11px] text-zinc-400 text-center">
                  Votes are permanently tied to this sessionId. Repeating this session produces a fresh poll with zero vote cross-contamination.
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-zinc-500 text-xs">
                No response data recorded yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
