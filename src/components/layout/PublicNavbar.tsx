import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Shield, BookOpen, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoImg from '@/assets/logo.png';

export const PublicNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isCurrent = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link 
          to="/" 
          className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1"
          aria-label="Campus Pages Home"
        >
          <img 
            src={logoImg} 
            alt="Campus Pages Logo" 
            className="h-9 w-9 rounded-xl object-contain shadow-md shadow-primary/10 group-hover:scale-105 transition-transform" 
          />
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent font-heading">
            Campus Pages
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Main Navigation">
          <Link
            to="/"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              isCurrent('/') ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            Home
          </Link>
          <a
            href="#features"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Resources
          </a>
          <a
            href="#how-it-works"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            How it Works
          </a>
          <Link
            to="/privacy"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              isCurrent('/privacy') ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            Privacy Policy
          </Link>
        </nav>

        {/* Desktop Right CTA: Admin Login */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/login">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-border/80 bg-accent/30 hover:bg-accent hover:border-primary/50 text-foreground font-medium transition-all shadow-sm"
            >
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span>Admin Login</span>
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Slide-down Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border/40 bg-background/95 backdrop-blur-2xl px-4 pt-2 pb-6 space-y-3 animate-fade-in">
          <nav className="flex flex-col space-y-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                isCurrent('/') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              Home
            </Link>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-base font-medium text-muted-foreground hover:bg-accent/40 hover:text-foreground transition-colors"
            >
              <FileText className="h-4 w-4" />
              Resources
            </a>
            <Link
              to="/privacy"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                isCurrent('/privacy') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground'
              }`}
            >
              <Shield className="h-4 w-4" />
              Privacy Policy
            </Link>
          </nav>

          <div className="pt-2 border-t border-border/40">
            <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full block">
              <Button className="w-full gap-2 justify-center font-semibold bg-primary hover:bg-primary/90 text-primary-foreground">
                <Shield className="h-4 w-4" />
                Admin Login
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
