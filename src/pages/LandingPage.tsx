import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  FileText,
  GraduationCap,
  Layers,
  Video,
  FileCode,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Search,
  Download,
  Award
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Campus Pages — Academic Resource Sharing Platform';
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
      <PublicNavbar />

      {/* Ambient background glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-indigo-600/10 rounded-full blur-[130px]" />
      </div>

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6 animate-fade-in">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Curated Academic Repository</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight font-heading max-w-4xl mx-auto leading-[1.1] mb-6">
            Everything you need to{' '}
            <span className="bg-gradient-to-r from-primary via-indigo-400 to-violet-400 bg-clip-text text-transparent">
              excel in your exams.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
            A centralized platform for university students to access verified lecture notes, previous year question papers, video lectures, cheatsheets, and assignments.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
            <a href="#features" className="w-full sm:w-auto">
              <Button size="lg" className="w-full gap-2 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-6 shadow-lg shadow-primary/25">
                Explore Resources
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
            <Link to="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full gap-2 border-border/80 bg-accent/20 hover:bg-accent hover:border-primary/50 text-foreground font-semibold h-12 px-6">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Admin Console
              </Button>
            </Link>
          </div>

          {/* Quick Stats / Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-6 border-t border-border/40">
            <div className="p-4 rounded-xl bg-card/40 border border-border/40 backdrop-blur-sm">
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground font-heading">5+ Core</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Resource Types</p>
            </div>
            <div className="p-4 rounded-xl bg-card/40 border border-border/40 backdrop-blur-sm">
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground font-heading">100%</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Verified Materials</p>
            </div>
            <div className="p-4 rounded-xl bg-card/40 border border-border/40 backdrop-blur-sm">
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground font-heading">Syllabus</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Aligned Modules</p>
            </div>
            <div className="p-4 rounded-xl bg-card/40 border border-border/40 backdrop-blur-sm">
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground font-heading">Cloud</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Fast PDF Access</p>
            </div>
          </div>
        </section>

        {/* FEATURES / RESOURCES SECTION */}
        <section id="features" className="px-4 sm:px-6 lg:px-8 py-20 bg-accent/5 border-y border-border/40">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-primary font-heading mb-2">
                Academic Modules
              </h2>
              <p className="text-3xl sm:text-4xl font-extrabold font-heading text-foreground tracking-tight">
                Designed for Seamless Exam Preparation
              </p>
              <p className="text-muted-foreground text-sm sm:text-base mt-3">
                Access categorized, syllabus-verified materials across branches and semesters.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1: Notes */}
              <div className="group p-6 sm:p-8 rounded-2xl bg-card/60 border border-border/60 backdrop-blur-sm hover:border-primary/50 transition-all shadow-sm hover:shadow-lg hover:-translate-y-0.5">
                <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-5 group-hover:scale-110 transition-transform">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground font-heading mb-2">
                  Lecture Notes
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Comprehensive subject notes and handwritten lecture slides curated by course toppers and academic faculties.
                </p>
              </div>

              {/* Feature 2: PYQs */}
              <div className="group p-6 sm:p-8 rounded-2xl bg-card/60 border border-border/60 backdrop-blur-sm hover:border-primary/50 transition-all shadow-sm hover:shadow-lg hover:-translate-y-0.5">
                <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5 group-hover:scale-110 transition-transform">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground font-heading mb-2">
                  Previous Year Papers (PYQs)
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Extensive archives of mid-semester and end-semester question papers to practice recurring exam patterns and question formats.
                </p>
              </div>

              {/* Feature 3: Cheatsheets */}
              <div className="group p-6 sm:p-8 rounded-2xl bg-card/60 border border-border/60 backdrop-blur-sm hover:border-primary/50 transition-all shadow-sm hover:shadow-lg hover:-translate-y-0.5">
                <div className="h-12 w-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-5 group-hover:scale-110 transition-transform">
                  <FileCode className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground font-heading mb-2">
                  Quick Cheatsheets
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  High-yield formula booklets, key definition sheets, and rapid summary guides engineered for last-minute revisions.
                </p>
              </div>

              {/* Feature 4: Video Lectures */}
              <div className="group p-6 sm:p-8 rounded-2xl bg-card/60 border border-border/60 backdrop-blur-sm hover:border-primary/50 transition-all shadow-sm hover:shadow-lg hover:-translate-y-0.5">
                <div className="h-12 w-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-5 group-hover:scale-110 transition-transform">
                  <Video className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground font-heading mb-2">
                  Video Modules
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Curated video playlists and topic-by-topic breakdowns to help visualize complex engineering and science concepts.
                </p>
              </div>

              {/* Feature 5: Assignments */}
              <div className="group p-6 sm:p-8 rounded-2xl bg-card/60 border border-border/60 backdrop-blur-sm hover:border-primary/50 transition-all shadow-sm hover:shadow-lg hover:-translate-y-0.5">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition-transform">
                  <Layers className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground font-heading mb-2">
                  Assignments & Lab Manuals
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Structured laboratory guides, problem sets, and tutorial assignments for practical coursework clarity.
                </p>
              </div>

              {/* Feature 6: Quality Moderation */}
              <div className="group p-6 sm:p-8 rounded-2xl bg-card/60 border border-border/60 backdrop-blur-sm hover:border-primary/50 transition-all shadow-sm hover:shadow-lg hover:-translate-y-0.5">
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 transition-transform">
                  <Award className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground font-heading mb-2">
                  Admin Verified Content
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  All materials are moderated by course admins to guarantee accurate syllabus mapping, clarity, and relevance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="how-it-works" className="px-4 sm:px-6 lg:px-8 py-20 max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-primary font-heading mb-2">
              Workflow
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold font-heading text-foreground tracking-tight">
              How Campus Pages Works
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-card/40 border border-border/40 text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary font-bold text-lg flex items-center justify-center mx-auto">
                1
              </div>
              <h3 className="text-lg font-bold text-foreground font-heading">Find Your Course</h3>
              <p className="text-sm text-muted-foreground">
                Filter by academic department, semester, subject code, or resource type to find exact study materials.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card/40 border border-border/40 text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary font-bold text-lg flex items-center justify-center mx-auto">
                2
              </div>
              <h3 className="text-lg font-bold text-foreground font-heading">Review & Study</h3>
              <p className="text-sm text-muted-foreground">
                Read documents online through the high-performance PDF reader or download files directly to your device.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card/40 border border-border/40 text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary font-bold text-lg flex items-center justify-center mx-auto">
                3
              </div>
              <h3 className="text-lg font-bold text-foreground font-heading">Exam Ready</h3>
              <p className="text-sm text-muted-foreground">
                Leverage previous question papers and quick formula sheets to boost preparation and score higher.
              </p>
            </div>
          </div>
        </section>

        {/* CALL TO ACTION / ADMIN PORTAL BANNER */}
        <section className="px-4 sm:px-6 lg:px-8 pb-20 max-w-7xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden border border-border/80 bg-gradient-to-r from-card via-card/80 to-accent/30 p-8 sm:p-12 lg:p-16 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-8 shadow-2xl">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Authorized Administrative Access</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-foreground tracking-tight">
                Are you a course coordinator or admin?
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sign in to the administrative control panel to moderate uploaded resources, manage syllabus categories, and review reports.
              </p>
            </div>

            <div className="shrink-0">
              <Link to="/login">
                <Button size="lg" className="gap-2 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-6 shadow-md shadow-primary/20">
                  <ShieldCheck className="h-4 w-4" />
                  Access Admin Portal
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};
