import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Shield, Heart } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border/40 bg-background/60 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary via-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent font-heading">
                Campus Pages
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              A comprehensive academic resource hub providing verified lecture notes, semester past papers, video modules, and revision cheatsheets for university students.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground font-heading">
              Platform
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <a href="#features" className="hover:text-primary transition-colors">
                  Academic Resources
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-primary transition-colors">
                  How It Works
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Portals */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground font-heading">
              Legal & Access
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  Admin Console
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p className="flex items-center gap-1">
            Made for Students <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500 animate-pulse" />
          </p>
          <p>
            © {currentYear} Campus Pages. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
