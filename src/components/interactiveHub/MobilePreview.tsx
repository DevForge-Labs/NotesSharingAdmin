import React, { useState } from 'react';
import { InteractiveHubType } from '@/types/interactiveHub';
import {
  Sparkles,
  Wifi,
  Battery,
  ChevronRight,
  Bell,
  CheckCircle2,
  FileText,
  Home,
  Compass,
  GraduationCap,
  User,
  ArrowRight
} from 'lucide-react';

interface MobilePreviewProps {
  title: string;
  body: string;
  type: InteractiveHubType;
  ctaText?: string;
  targetDestination?: string;
  surveyOptions?: string[];
  destinationLabel?: string;
}

export const MobilePreview: React.FC<MobilePreviewProps> = ({
  title,
  body,
  type,
  ctaText = "LET'S GO",
  surveyOptions = ['YES', 'NO'],
  destinationLabel = 'Exam Preparation'
}) => {
  const [selectedSurveyOption, setSelectedSurveyOption] = useState<string | null>(null);

  const displayTitle = title.trim() || (type === 'SURVEY' ? 'USER REVIEW 👀' : 'EXAM TIME!!');
  const displayBody = body.trim() || (
    type === 'SURVEY'
      ? 'Do you want class timetables added directly into Campus Pages?'
      : 'End-sem exams are approaching. Access curated PYQs, notes, and resources now.'
  );

  return (
    <div className="flex flex-col items-center">
      {/* Device Frame */}
      <div className="w-[340px] h-[690px] bg-[#0c0d12] rounded-[44px] p-3 shadow-2xl border-4 border-[#27272a] relative flex flex-col overflow-hidden select-none">
        {/* Status Bar */}
        <div className="w-full flex items-center justify-between px-5 pt-2 pb-1 text-[11px] text-zinc-400 font-medium tracking-tight shrink-0 z-20">
          <span>9:41</span>
          {/* Dynamic Notch */}
          <div className="w-20 h-4 bg-black rounded-full mx-auto -mt-1 shadow-inner flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-zinc-900 border border-zinc-700 ml-6" />
          </div>
          <div className="flex items-center space-x-1.5">
            <Wifi className="w-3 h-3 text-zinc-300" />
            <Battery className="w-3.5 h-3.5 text-zinc-300" />
          </div>
        </div>

        {/* Screen Content Scroll Area */}
        <div className="flex-1 overflow-y-auto px-3.5 pt-2 pb-14 text-white custom-scrollbar space-y-3.5">
          {/* Mock Top Header */}
          <div className="flex items-center justify-between pt-1 pb-1">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center font-black text-xs text-white shadow-md">
                CP
              </div>
              <span className="text-xs font-bold tracking-tight text-white/90">Campus Pages</span>
            </div>
            <div className="w-7 h-7 rounded-full bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center relative">
              <Bell className="w-3.5 h-3.5 text-zinc-300" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-500 rounded-full" />
            </div>
          </div>

          {/* Mock Greeting Card */}
          <div className="bg-gradient-to-r from-zinc-900/90 to-zinc-800/60 border border-zinc-800/80 rounded-2xl p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">Welcome back</p>
                <p className="text-xs font-bold text-zinc-100">Hey Pratyush 👋</p>
              </div>
              <span className="text-[10px] bg-indigo-500/15 text-indigo-300 font-medium px-2 py-0.5 rounded-full border border-indigo-500/30">
                Sem 6
              </span>
            </div>
          </div>

          {/* Continue Reading Mockup */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[11px] font-bold text-zinc-200 tracking-tight flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                Continue Reading
              </span>
              <span className="text-[10px] text-zinc-400">12m ago</span>
            </div>
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-2.5 flex items-center space-x-2.5">
              <div className="w-11 h-12 rounded-xl bg-teal-950/60 border border-teal-500/30 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-teal-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-zinc-100 truncate">Computer Networks - Module 4</p>
                <p className="text-[9.5px] text-zinc-400 truncate">CSE • Page 24 of 68</p>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* ★★★ INTERACTIVE HUB CARD (LIVE PREVIEW) ★★★ */}
          {/* ════════════════════════════════════════════════════════════ */}
          <div className="relative group transition-all duration-300">
            {/* Glowing Accent Ring */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-[22px] blur-sm opacity-60 group-hover:opacity-100 transition duration-500 animate-pulse" />
            
            <div className="relative bg-[#0f111a] border border-indigo-400/40 rounded-[20px] p-3.5 shadow-xl overflow-hidden backdrop-blur-md">
              {/* Subtle ambient light gradient inside card */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Title (Main Focus) */}
              <h4 className="text-sm font-black tracking-tight text-white leading-snug mb-1 drop-shadow-sm">
                {displayTitle}
              </h4>

              {/* Body */}
              <p className="text-xs text-zinc-200/90 leading-relaxed line-clamp-3 mb-3">
                {displayBody}
              </p>

              {/* Interactive Area: CTA or Survey Options */}
              {type === 'SURVEY' ? (
                <div className="pt-1">
                  {selectedSurveyOption ? (
                    <div className="flex items-center justify-center space-x-1.5 py-1.5 px-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-[10px] font-semibold animate-fadeIn">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Response recorded ({selectedSurveyOption})</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(surveyOptions.length > 0 ? surveyOptions : ['YES', 'NO']).map((opt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedSurveyOption(opt)}
                          className="flex-1 min-w-[65px] py-1.5 px-2 bg-gradient-to-r from-zinc-800 to-zinc-900 hover:from-indigo-600 hover:to-indigo-500 active:scale-95 border border-zinc-700/80 hover:border-indigo-400 rounded-xl text-[10px] font-bold text-zinc-100 hover:text-white transition shadow-sm text-center"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedSurveyOption && (
                    <button
                      type="button"
                      onClick={() => setSelectedSurveyOption(null)}
                      className="text-[8px] text-zinc-400 underline hover:text-zinc-200 mt-1 block mx-auto text-center"
                    >
                      Reset preview vote
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between pt-1">
                  <div className="text-[9px] text-indigo-300/80 font-medium truncate max-w-[150px]">
                    To: <span className="text-zinc-200">{destinationLabel}</span>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-[10px] shadow-md shadow-indigo-500/25 active:scale-95 transition"
                  >
                    <span>{ctaText?.trim() || "LET'S GO"}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* For You Section Mockup */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[11px] font-bold text-zinc-200 tracking-tight">For You</span>
              <span className="text-[9px] text-indigo-400 font-medium">See all</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-2 space-y-1">
                <div className="w-full h-14 bg-zinc-800/50 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-zinc-500" />
                </div>
                <p className="text-[9px] font-bold text-zinc-200 truncate">Compiler Design Notes</p>
                <p className="text-[8px] text-zinc-400">★ 4.9 • 240 upvotes</p>
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-2 space-y-1">
                <div className="w-full h-14 bg-zinc-800/50 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-zinc-500" />
                </div>
                <p className="text-[9px] font-bold text-zinc-200 truncate">Machine Learning PYQ</p>
                <p className="text-[8px] text-zinc-400">★ 4.8 • 180 upvotes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Nav Bar Mockup */}
        <div className="absolute bottom-0 inset-x-0 h-12 bg-zinc-950/95 border-t border-zinc-800/80 flex items-center justify-around px-2 text-zinc-400 z-20 backdrop-blur-md">
          <div className="flex flex-col items-center text-indigo-400">
            <Home className="w-4 h-4" />
            <span className="text-[8px] font-bold mt-0.5">Home</span>
          </div>
          <div className="flex flex-col items-center">
            <Compass className="w-4 h-4" />
            <span className="text-[8px] mt-0.5">Explore</span>
          </div>
          <div className="flex flex-col items-center">
            <GraduationCap className="w-4 h-4" />
            <span className="text-[8px] mt-0.5">Class</span>
          </div>
          <div className="flex flex-col items-center">
            <User className="w-4 h-4" />
            <span className="text-[8px] mt-0.5">Profile</span>
          </div>
        </div>

        {/* Home Indicator Bar */}
        <div className="w-28 h-1 bg-zinc-600 rounded-full mx-auto absolute bottom-1 inset-x-0 z-30 opacity-70" />
      </div>
    </div>
  );
};
