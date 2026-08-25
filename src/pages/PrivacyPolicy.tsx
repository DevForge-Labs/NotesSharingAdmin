import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { ArrowLeft, Shield, Mail, Calendar } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  useEffect(() => {
    document.title = 'Privacy Policy — Campus Pages';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
      <PublicNavbar />

      {/* Ambient background glow elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {/* Navigation Breadcrumb / Back Link */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider group"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Home
          </Link>
        </div>

        {/* Policy Document Card */}
        <article className="border border-border/70 bg-card/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-10 lg:p-12 shadow-xl">
          {/* Header */}
          <header className="border-b border-border/50 pb-8 mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-4">
              <Shield className="h-3.5 w-3.5" />
              <span>Legal & Compliance</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent font-heading mb-3">
              Privacy Policy
            </h1>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              <Calendar className="h-3.5 w-3.5" />
              <span>Last Updated: June 2026</span>
            </div>
          </header>

          {/* Policy Sections */}
          <div className="space-y-10 text-neutral-300 leading-relaxed text-sm sm:text-base">
            
            {/* Section 1: Information We Collect */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5 font-heading">
                <span className="h-5 w-1 bg-primary rounded-full inline-block" />
                1. Information We Collect
              </h2>
              <p className="text-muted-foreground">
                Campus Pages collects specific information necessary to provide academic resource sharing tools, maintain platform security, and manage user accounts. The categories of information we collect include:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-2">
                <li>
                  <strong className="text-foreground">Account & Authentication Data:</strong> Name, email address, profile image URL, and unique account identifier received through authentication providers.
                </li>
                <li>
                  <strong className="text-foreground">Academic Content:</strong> Lecture notes, previous year question papers (PYQs), revision cheatsheets, video links, assignments, and lab guides that you explicitly select and upload to share.
                </li>
                <li>
                  <strong className="text-foreground">Technical & Diagnostic Logs:</strong> Technical metadata including browser user-agent, error logs, and administrative action logs used to maintain platform stability, moderation audit trails, and security.
                </li>
              </ul>
            </section>

            {/* Section 2: Google Sign-In & Google User Data */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5 font-heading">
                <span className="h-5 w-1 bg-primary rounded-full inline-block" />
                2. Google Sign-In & Google User Data
              </h2>
              <p className="text-muted-foreground">
                Campus Pages enables users and administrators to sign in using Google Sign-In powered by Firebase Authentication. When you choose to authenticate with Google, our application receives the minimum profile information necessary for account functionality:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-2">
                <li>
                  <strong className="text-foreground">Name (Display Name):</strong> Used to personalize your account profile, display uploader attribution on shared study materials, and identify administrators in moderation workflows.
                </li>
                <li>
                  <strong className="text-foreground">Email Address:</strong> Used to establish your unique user profile, verify administrative access roles, and deliver essential account-related communication.
                </li>
                <li>
                  <strong className="text-foreground">Profile Photo URL:</strong> Used solely to display your avatar within the navigation bar and dashboard interface.
                </li>
                <li>
                  <strong className="text-foreground">Google / Firebase User ID (UID):</strong> Used as a secure, unique internal identifier to associate your account with your uploaded notes, permissions, and session records.
                </li>
              </ul>
              <p className="text-muted-foreground">
                The current implementation of Campus Pages only requests standard authentication scopes (<code className="text-xs bg-accent/40 text-primary px-1.5 py-0.5 rounded">openid</code>, <code className="text-xs bg-accent/40 text-primary px-1.5 py-0.5 rounded">profile</code>, <code className="text-xs bg-accent/40 text-primary px-1.5 py-0.5 rounded">email</code>). The application does not request access to Google Classroom, Gmail, Google Drive, or other sensitive Google Workspace API scopes.
              </p>
            </section>

            {/* Section 3: Google User Data Use & Limited Use Compliance */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5 font-heading">
                <span className="h-5 w-1 bg-primary rounded-full inline-block" />
                3. Google User Data Use & Limited Use Compliance
              </h2>
              <p className="text-muted-foreground">
                Google user data is used exclusively to provide and improve user-facing features of Campus Pages, including authentication, user profile management, resource upload attribution, and administrative moderation.
              </p>
              <div className="p-4 rounded-xl bg-accent/20 border border-primary/30 text-neutral-200 space-y-2">
                <p className="font-semibold text-white text-sm">
                  Google API Services User Data Policy Disclosure:
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Campus Pages's use and transfer to any other app of information received from Google APIs will adhere to the{' '}
                  <a
                    href="https://developers.google.com/terms/api-services-user-data-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline font-medium hover:text-primary/80 transition-colors"
                  >
                    Google API Services User Data Policy
                  </a>
                  , including the Limited Use requirements.
                </p>
              </div>
            </section>

            {/* Section 4: Data Sharing & Third-Party Service Providers */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5 font-heading">
                <span className="h-5 w-1 bg-primary rounded-full inline-block" />
                4. Data Sharing & Infrastructure Processors
              </h2>
              <p className="text-muted-foreground">
                Campus Pages does not sell, rent, lease, trade, or disclose Google user data or personal information to third-party advertising networks, data brokers, or commercial resellers.
              </p>
              <p className="text-muted-foreground">
                To operate our cloud infrastructure, data is processed by trusted service providers strictly to deliver application functionality:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-2">
                <li>
                  <strong className="text-foreground">Google Firebase Authentication:</strong> Manages secure user authentication tokens and sign-in sessions.
                </li>
                <li>
                  <strong className="text-foreground">Google Cloud Firestore:</strong> Secure NoSQL cloud database storing user profiles, resource metadata, and permission records.
                </li>
                <li>
                  <strong className="text-foreground">Google Firebase Cloud Storage:</strong> Cloud file storage hosting uploaded study documents and PDFs.
                </li>
                <li>
                  <strong className="text-foreground">Google Cloud Functions:</strong> Serverless backend handling administrative role management and audit logging.
                </li>
              </ul>
            </section>

            {/* Section 5: Prohibited Uses of Data */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5 font-heading">
                <span className="h-5 w-1 bg-primary rounded-full inline-block" />
                5. Prohibited Uses of Google User Data
              </h2>
              <p className="text-muted-foreground">
                We strictly limit the use of Google user data to its disclosed purposes. Google user data is never used for:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-2">
                <li>Serving personalized, targeted, or behavioral advertisements.</li>
                <li>Retargeting or cross-platform ad tracking.</li>
                <li>Sale, rental, or brokerage to third parties.</li>
                <li>Determining creditworthiness or lending eligibility.</li>
                <li>Training generalized artificial intelligence (AI) or machine learning (ML) models.</li>
              </ul>
            </section>

            {/* Section 6: Data Retention & Account Deletion */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5 font-heading">
                <span className="h-5 w-1 bg-primary rounded-full inline-block" />
                6. Data Retention & Account Deletion
              </h2>
              <p className="text-muted-foreground">
                Account information and Google-derived profile data are retained for as long as your Campus Pages account remains active, and as reasonably necessary to fulfill the operational purposes described in this policy, maintain platform security, comply with legal obligations, prevent fraud or abuse, and resolve disputes.
              </p>
              <p className="text-muted-foreground">
                Users can request permanent deletion of their account and associated personal data at any time by contacting our team at{' '}
                <a href="mailto:pratyush.deve@gmail.com" className="text-primary hover:underline font-medium">
                  pratyush.deve@gmail.com
                </a>
                .
              </p>
              <p className="text-muted-foreground">
                When an account deletion request is processed:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-2">
                <li>Your user account is permanently deleted from Firebase Authentication.</li>
                <li>Your user profile document in Firestore is updated to a deleted status, disconnecting personal identifiers.</li>
                <li>Academic resources (such as lecture notes or past papers) uploaded for public community benefit may remain preserved on the platform without personal attribution to ensure continuity for students.</li>
                <li>Administrative audit logs may be retained as required for security auditing, fraud prevention, and platform compliance.</li>
              </ul>
            </section>

            {/* Section 7: Access Revocation via Google */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5 font-heading">
                <span className="h-5 w-1 bg-primary rounded-full inline-block" />
                7. Access Revocation via Google Account Settings
              </h2>
              <p className="text-muted-foreground">
                You can review, manage, or immediately revoke Campus Pages's access to your Google account at any time through Google's centralized security dashboard:
              </p>
              <div className="p-4 rounded-xl bg-accent/20 border border-border/60">
                <p className="text-sm font-semibold text-foreground mb-1">
                  Manage Connected Google Apps & Permissions:
                </p>
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs sm:text-sm text-primary underline font-medium hover:text-primary/80 transition-colors break-all"
                >
                  https://myaccount.google.com/permissions
                </a>
              </div>
            </section>

            {/* Section 8: User-Uploaded Content & Academic Materials */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5 font-heading">
                <span className="h-5 w-1 bg-primary rounded-full inline-block" />
                8. User-Uploaded Content & Intellectual Property
              </h2>
              <p className="text-muted-foreground">
                Campus Pages operates as a community academic sharing hub. Users are responsible for the study materials they choose to upload and must ensure they have appropriate rights to share academic documents. Campus Pages does not claim ownership of user-uploaded academic content, and creator credits remain with their respective contributors.
              </p>
            </section>

            {/* Section 9: Data Security */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5 font-heading">
                <span className="h-5 w-1 bg-primary rounded-full inline-block" />
                9. Data Security
              </h2>
              <p className="text-muted-foreground">
                We implement technical and organizational security measures to protect your data, including HTTPS/TLS encryption in transit, Firebase Authentication session tokens, Cloud Firestore security rules, role-based access control (RBAC), and restricted administrative access. While we strive to use standard commercial practices to safeguard your information, no transmission over the internet can be guaranteed to be 100% secure.
              </p>
            </section>

            {/* Section 10: Platform & Device Permissions */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5 font-heading">
                <span className="h-5 w-1 bg-primary rounded-full inline-block" />
                10. Platform & Device Permissions
              </h2>
              <p className="text-muted-foreground">
                Campus Pages may utilize standard platform capabilities to provide core functionality:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-2">
                <li>
                  <strong className="text-foreground">Web Application:</strong> Requires network access to communicate with Firebase cloud services and local file selector access when you choose to upload academic files or PDFs.
                </li>
                <li>
                  <strong className="text-foreground">Mobile Application (if applicable):</strong> May request network connectivity for syncing materials and notification permissions to deliver study updates.
                </li>
              </ul>
            </section>

            {/* Section 11: Children's Privacy */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5 font-heading">
                <span className="h-5 w-1 bg-primary rounded-full inline-block" />
                11. Children's Privacy
              </h2>
              <p className="text-muted-foreground">
                Campus Pages is designed for university and college students and is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we discover that a child under 13 has provided personal information, we will take prompt steps to delete that information from our servers.
              </p>
            </section>

            {/* Section 12: Changes to this Policy */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5 font-heading">
                <span className="h-5 w-1 bg-primary rounded-full inline-block" />
                12. Changes to This Privacy Policy
              </h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy periodically to reflect changes in our service or legal obligations. When updates occur, the "Last Updated" date at the top of this page will be revised. We encourage users to review this policy periodically.
              </p>
            </section>

            {/* Section 13: Contact Us */}
            <section className="space-y-4 pt-4 border-t border-border/40">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5 font-heading">
                <Mail className="h-5 w-5 text-primary" />
                Contact Us
              </h2>
              <p className="text-muted-foreground">
                For privacy-related inquiries, account concerns, data requests, or general support regarding Campus Pages, please reach out to:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-accent/20 border border-border/60">
                  <p className="font-semibold text-foreground text-sm">Pratyush Nishank</p>
                  <a
                    href="mailto:pratyush.deve@gmail.com"
                    className="text-xs text-primary hover:underline font-medium break-all"
                  >
                    pratyush.deve@gmail.com
                  </a>
                </div>
                <div className="p-4 rounded-xl bg-accent/20 border border-border/60">
                  <p className="font-semibold text-foreground text-sm">Apoorva Deep</p>
                  <a
                    href="mailto:ad01.cdr@gmail.com"
                    className="text-xs text-primary hover:underline font-medium break-all"
                  >
                    ad01.cdr@gmail.com
                  </a>
                </div>
              </div>
            </section>

          </div>
        </article>
      </main>

      <PublicFooter />
    </div>
  );
};
