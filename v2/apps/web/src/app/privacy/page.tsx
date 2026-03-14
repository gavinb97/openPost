import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — OnlyPosts',
  description: 'OnlyPosts Privacy Policy. Learn how we collect, use, and protect your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/[0.07] blur-[120px] animate-orb-1" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-neon-pink/[0.06] blur-[100px] animate-orb-2" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary via-neon-pink to-neon-cyan flex items-center justify-center text-white font-display font-bold text-xs shadow-lg shadow-primary/30">
            OP
          </div>
          <span className="text-xl font-display font-bold gradient-text-subtle">OnlyPosts</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign In</Link>
          <Link href="/register" className="text-sm bg-gradient-to-r from-primary to-neon-pink text-white px-5 py-2 rounded-lg hover:brightness-110 transition-all shadow-lg shadow-primary/25">Get Started</Link>
        </div>
      </nav>

      {/* Content */}
      <main className="relative z-10 px-6 py-16 max-w-4xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-display font-bold gradient-text mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground mb-12">Last Updated: March 14, 2026</p>

        <div className="space-y-10 text-foreground/90 leading-relaxed">
          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mb-3">1. Introduction</h2>
            <p>
              OnlyPosts (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the website located at{' '}
              <span className="text-primary">only-posts.com</span> and the associated mobile applications and services
              (collectively, the &quot;Service&quot;). This Privacy Policy explains how we collect, use, disclose, and
              safeguard your information when you access or use our Service. By accessing or using the Service, you
              acknowledge that you have read, understood, and agree to be bound by this Privacy Policy. If you do not agree
              with the terms of this Privacy Policy, please do not access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mb-3">2. Information We Collect</h2>

            <h3 className="text-lg font-medium text-foreground/95 mt-4 mb-2">2.1 Information You Provide Directly</h3>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li><strong>Account Information:</strong> When you register for an account, we collect your email address, username, and password (stored in hashed form).</li>
              <li><strong>Profile Information:</strong> Any additional profile information you choose to provide, such as a display name or avatar.</li>
              <li><strong>Payment Information:</strong> If you subscribe to a paid plan, payment processing is handled by Stripe, Inc. We do not store your full credit card number, but we may retain the last four digits, card brand, and billing address for record-keeping purposes.</li>
              <li><strong>Content &amp; Communications:</strong> Content you create, upload, or generate through the Service, including AI-generated posts, media files, agent configurations, campaign settings, and any support requests or communications you send to us.</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground/95 mt-4 mb-2">2.2 Information Collected Through Third-Party Platforms</h3>
            <p className="mb-2">
              When you connect a social media account (e.g., Twitter/X, Reddit, YouTube, TikTok) via OAuth, we collect:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li><strong>Platform Identifiers:</strong> Your platform user ID, username, display name, and profile picture URL.</li>
              <li><strong>OAuth Tokens:</strong> Access tokens, refresh tokens, and token secrets necessary to act on your behalf on the connected platform. These tokens are encrypted at rest.</li>
              <li><strong>Platform Data:</strong> Limited account metadata such as subscriber/follower counts, karma scores, or channel information, as disclosed during the OAuth authorization flow.</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground/95 mt-4 mb-2">2.3 Information Collected Automatically</h3>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li><strong>Log Data:</strong> IP address, browser type and version, operating system, referring URL, pages visited, date and time of access, and duration of visit.</li>
              <li><strong>Device Information:</strong> Device type, unique device identifiers, and mobile network information (for mobile app users).</li>
              <li><strong>Cookies &amp; Similar Technologies:</strong> We use session cookies and JSON Web Tokens (JWTs) to authenticate users and maintain session state. We do not use third-party advertising or tracking cookies.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mb-3">3. How We Use Your Information</h2>
            <p className="mb-2">We use the information we collect for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li><strong>Service Delivery:</strong> To provide, operate, and maintain the Service, including AI-powered content generation, scheduling, posting, and social media management features.</li>
              <li><strong>Authentication &amp; Security:</strong> To verify your identity, maintain account security, and prevent unauthorized access or fraudulent activity.</li>
              <li><strong>Platform Integration:</strong> To connect to and interact with third-party social media platforms on your behalf, using stored OAuth credentials.</li>
              <li><strong>Improvement &amp; Analytics:</strong> To understand usage patterns, diagnose technical issues, and improve the functionality and performance of the Service.</li>
              <li><strong>Communications:</strong> To send transactional emails (e.g., account verification, password reset), service announcements, and, with your consent, promotional communications.</li>
              <li><strong>Legal Compliance:</strong> To comply with applicable laws, regulations, legal processes, or governmental requests.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mb-3">4. AI-Generated Content &amp; Data Processing</h2>
            <p>
              The Service utilizes artificial intelligence models provided by OpenAI to generate content on your behalf.
              When you use AI features, prompts derived from your configuration (such as agent personality, topic preferences,
              and platform context) are transmitted to OpenAI&#39;s API for processing. We do not send your OAuth tokens,
              passwords, or payment information to AI providers. Content generated by AI models is stored in our database
              and attributed to your account. Please review OpenAI&#39;s privacy policy and usage policies for additional
              information about how they handle data transmitted through their API.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mb-3">5. How We Share Your Information</h2>
            <p className="mb-2">We do not sell, rent, or trade your personal information. We may share information in the following limited circumstances:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li><strong>Third-Party Platforms:</strong> When you authorize us to post content or take actions on connected social media platforms, we transmit the relevant content and credentials to those platforms via their APIs.</li>
              <li><strong>Service Providers:</strong> We engage trusted third-party vendors to provide infrastructure and services, including Amazon Web Services (hosting and storage), Stripe (payment processing), and OpenAI (AI content generation). These providers are contractually obligated to handle your data in accordance with their respective privacy policies and applicable law.</li>
              <li><strong>Legal Requirements:</strong> We may disclose your information if required by law, subpoena, court order, or other governmental request, or when we believe in good faith that disclosure is necessary to protect our rights, your safety, or the safety of others.</li>
              <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, reorganization, or sale of assets, your information may be transferred as part of that transaction, subject to the acquirer honoring this Privacy Policy.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mb-3">6. Data Storage &amp; Security</h2>
            <p>
              Your data is stored on servers hosted by Amazon Web Services (AWS) in the United States. We implement
              industry-standard security measures, including encrypted connections (TLS/SSL), hashed passwords (bcrypt),
              encrypted OAuth token storage, and access controls. While we strive to protect your information, no method of
              electronic storage or transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mb-3">7. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as needed to provide the Service.
              If you delete your account, we will delete or anonymize your personal information within thirty (30) days,
              except where retention is required by law or for legitimate business purposes (e.g., resolving disputes,
              enforcing agreements, or complying with legal obligations). Aggregated, anonymized data that cannot be used
              to identify you may be retained indefinitely for analytics purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mb-3">8. Your Rights &amp; Choices</h2>
            <p className="mb-2">Depending on your jurisdiction, you may have the following rights regarding your personal information:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li><strong>Access &amp; Portability:</strong> You may request a copy of the personal information we hold about you in a structured, machine-readable format.</li>
              <li><strong>Correction:</strong> You may update or correct inaccurate personal information through your account settings or by contacting us.</li>
              <li><strong>Deletion:</strong> You may request deletion of your personal information, subject to certain legal exceptions.</li>
              <li><strong>Disconnect Platforms:</strong> You may revoke access to any connected social media account at any time through the Service&#39;s account settings. This will delete the associated OAuth tokens from our systems.</li>
              <li><strong>Opt-Out of Communications:</strong> You may opt out of promotional communications at any time by following the unsubscribe link in the email or adjusting your notification preferences.</li>
              <li><strong>Data Processing Objection:</strong> Where processing is based on legitimate interest, you may object to such processing, and we will cease unless we have compelling legitimate grounds.</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, please contact us at{' '}
              <a href="mailto:privacy@only-posts.com" className="text-primary hover:underline">privacy@only-posts.com</a>.
              We will respond to your request within thirty (30) days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mb-3">9. International Data Transfers</h2>
            <p>
              If you are accessing the Service from outside the United States, please be aware that your information will be
              transferred to, stored, and processed in the United States, where our servers are located. By using the Service,
              you consent to the transfer of your information to the United States, which may have data protection laws that
              differ from those of your country of residence.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mb-3">10. Children&#39;s Privacy</h2>
            <p>
              The Service is not intended for use by individuals under the age of 16. We do not knowingly collect personal
              information from children under 16. If we become aware that we have inadvertently collected personal information
              from a child under 16, we will take steps to delete such information promptly. If you believe that a child under
              16 has provided us with personal information, please contact us at{' '}
              <a href="mailto:privacy@only-posts.com" className="text-primary hover:underline">privacy@only-posts.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mb-3">11. Third-Party Links &amp; Services</h2>
            <p>
              The Service may contain links to third-party websites, services, or applications that are not operated by us.
              We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any
              third-party services. We encourage you to review the privacy policies of any third-party services before providing
              your information to them.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mb-3">12. Changes to This Privacy Policy</h2>
            <p>
              We reserve the right to modify this Privacy Policy at any time. If we make material changes, we will notify you
              by posting the updated Privacy Policy on this page and updating the &quot;Last Updated&quot; date above. Your
              continued use of the Service after the posting of changes constitutes your acceptance of such changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mb-3">13. Contact Us</h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
            </p>
            <div className="mt-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm text-foreground/80">
              <p className="font-medium text-foreground">OnlyPosts</p>
              <p>Email: <a href="mailto:privacy@only-posts.com" className="text-primary hover:underline">privacy@only-posts.com</a></p>
              <p>Website: <a href="https://only-posts.com" className="text-primary hover:underline">only-posts.com</a></p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <p>&copy; 2026 OnlyPosts. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="text-foreground">Privacy</span>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
