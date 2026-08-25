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
            
            {/* Section 1 */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5 font-heading">
                <span className="h-5 w-1 bg-primary rounded-full inline-block" />
                Information We Collect
              </h2>
              <p className="text-muted-foreground">
                Campus Pages collects specific information to deliver customized academic tools and platform stability. The categories we collect may include:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-2">
                <li>
                  <strong className="text-foreground">Account Information:</strong> Profile credentials, username, and user configurations saved on Firebase services.
                </li>
                <li>
                  <strong className="text-foreground">Email Address:</strong> Registration email used to establish verification profiles and security check credentials.
                </li>
                <li>
                  <strong className="text-foreground">Uploaded Academic Content:</strong> Lecture notes, revision booklets, lab guides, exam materials, and study resources that you explicitly select and upload to share.
                </li>
                <li>
                  <strong className="text-foreground">Usage Analytics:</strong> Anonymous diagnostic engagement telemetry to identify system usage frequencies.
                </li>
                <li>
                  <strong className="text-foreground">Crash Diagnostics:</strong> Log telemetry records to troubleshoot errors and improve general platform consistency.
                </li>
              </ul>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5 font-heading">
                <span className="h-5 w-1 bg-primary rounded-full inline-block" />
                How We Use Information
              </h2>
              <p className="text-muted-foreground">
                We leverage collected information to improve notes sharing security and overall features compatibility. Collected details are used to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-2">
                <li>Provide core application functionality and secure logins.</li>
                <li>Improve user recommendation feeds based on general relevance.</li>
                <li>Maintain platform security, moderation compliance, and protect our servers from misuse.</li>
                <li>Enable files upload and downloads functionality.</li>
                <li>Optimize general user experience across various smartphone screens.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5 font-heading">
                <span className="h-5 w-1 bg-primary rounded-full inline-block" />
                Account & Data Deletion
              </h2>
              <p className="text-muted-foreground">
                Users may request deletion of their Campus Pages account and associated personal information by contacting the development team through the contact information provided below.
              </p>
              <p className="text-muted-foreground">
                Upon receiving a valid request, we will make reasonable efforts to remove or anonymize personal information associated with the account, subject to legal obligations, security requirements, and operational necessities.
              </p>
              <p className="text-muted-foreground">
                Some information may be retained for a limited period where required for fraud prevention, dispute resolution, security monitoring, or compliance purposes.
              </p>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5 font-heading">
                <span className="h-5 w-1 bg-primary rounded-full inline-block" />
                Content Uploaded By Users
              </h2>
              <p className="text-muted-foreground">
                Campus Pages operates as a community knowledge hub. Users are entirely responsible for the academic materials they choose to upload to our platform. Users must ensure that they hold the necessary permissions to share their documents and that the uploads do not violate copyright policies.
              </p>
              <p className="text-muted-foreground">
                Campus Pages does not claim ownership of user-uploaded academic content, and we preserve content credits to their respective contributors.
              </p>
            </section>

            {/* Section 5 */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5 font-heading">
                <span className="h-5 w-1 bg-primary rounded-full inline-block" />
                Storage of Uploaded Content
              </h2>
              <p className="text-muted-foreground">
                Academic materials uploaded to Campus Pages may be securely stored on cloud infrastructure to enable sharing, discovery, downloads, backups, moderation, and other platform functionality.
              </p>
              <p className="text-muted-foreground">
                Uploaded content may remain accessible to other users in accordance with the visibility settings and platform features available at the time of upload.
              </p>
            </section>

            {/* Section 6 */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5 font-heading">
                <span className="h-5 w-1 bg-primary rounded-full inline-block" />
                Data Security
              </h2>
              <p className="text-muted-foreground">
                We use industry-standard security architectures and Google Firebase cloud services (Firestore Database, Cloud Storage, Authentication, and Firebase Cloud Messaging) to safeguard your files and account profiles. However, please be aware that no wireless transmission or internet storage method can be guaranteed to be absolutely secure.
              </p>
            </section>

            {/* Section 7 */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5 font-heading">
                <span className="h-5 w-1 bg-primary rounded-full inline-block" />
                Third-Party Services
              </h2>
              <p className="text-muted-foreground">
                To provide advanced notifications and secure authentication, Campus Pages may integrate services from third-party partners. These services may include:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-2">
                <li>Firebase Authentication</li>
                <li>Firebase Cloud Firestore</li>
                <li>Firebase Cloud Messaging (FCM)</li>
                <li>Google Play Services</li>
              </ul>
            </section>

            {/* Section 8 */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5 font-heading">
                <span className="h-5 w-1 bg-primary rounded-full inline-block" />
                Permissions
              </h2>
              <p className="text-muted-foreground">
                Campus Pages may request certain device permissions that are necessary to provide core functionality and improve user experience.
              </p>
              <p className="text-muted-foreground font-medium text-foreground">
                Examples may include:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-2">
                <li>
                  <strong className="text-foreground">Internet Access:</strong> Required for authentication, uploads, downloads, and content synchronization.
                </li>
                <li>
                  <strong className="text-foreground">Notification Permissions:</strong> Required to deliver important updates and account-related alerts.
                </li>
                <li>
                  <strong className="text-foreground">File Access Permissions:</strong> Required where necessary for uploading or downloading academic resources.
                </li>
              </ul>
              <p className="text-muted-foreground">
                Permissions are only used for their intended functionality and are not accessed unnecessarily.
              </p>
            </section>

            {/* Section 9 */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5 font-heading">
                <span className="h-5 w-1 bg-primary rounded-full inline-block" />
                Children's Privacy
              </h2>
              <p className="text-muted-foreground">
                Campus Pages is not intended or targeted for children under 13 years of age. We do not intentionally collect personal profiles of individuals under this age group. If we discover that a user under 13 has supplied us with personal info, we will take immediate steps to remove their record from our Firebase databases.
              </p>
            </section>

            {/* Section 10 */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5 font-heading">
                <span className="h-5 w-1 bg-primary rounded-full inline-block" />
                Changes To This Policy
              </h2>
              <p className="text-muted-foreground">
                This privacy policy may be modified periodically. We recommend checking this page regularly to review any changes. Modifications become effective immediately upon posting to this page.
              </p>
            </section>

            {/* Section 11 */}
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
