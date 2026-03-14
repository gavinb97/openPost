import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — OnlyPosts',
  description: 'OnlyPosts Terms of Service. Read the terms and conditions governing your use of our platform.',
};

export default function TermsOfServicePage() {
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
        <h1 className="text-4xl sm:text-5xl font-display font-bold gradient-text mb-4">Terms of Service</h1>
        <p className="text-muted-foreground mb-12">Last Updated: March 14, 2026</p>

        <div className="space-y-10 text-foreground/90 leading-relaxed">
          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p>
              These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;User,&quot;
              &quot;you,&quot; or &quot;your&quot;) and OnlyPosts (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or
              &quot;our&quot;) governing your access to and use of the website located at{' '}
              <span className="text-primary">only-posts.com</span>, including any associated mobile applications, APIs,
              and services (collectively, the &quot;Service&quot;). By creating an account, accessing, or using the Service,
              you agree to be bound by these Terms and our{' '}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>, which is incorporated
              herein by reference. If you do not agree to these Terms, you must not access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mb-3">2. Eligibility</h2>
            <p>
              You must be at least 16 years of age to use the Service. By using the Service, you represent and warrant that
              you are at least 16 years old, that you have the legal capacity to enter into a binding agreement, and that
              your use of the Service does not violate any applicable law or regulation. If you are using the Service on behalf
              of an organization, you represent and warrant that you have the authority to bind that organization to these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mb-3">3. Account Registration &amp; Security</h2>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>You must provide accurate, complete, and current information when creating an account.</li>
              <li>You are solely responsible for maintaining the confidentiality of your account credentials, including your password and any connected OAuth tokens.</li>
              <li>You are solely responsible for all activities that occur under your account, whether or not authorized by you.</li>
              <li>You must notify us immediately at <a href="mailto:support@only-posts.com" className="text-primary hover:underline">support@only-posts.com</a> if you suspect any unauthorized use of your account.</li>
              <li>We reserve the right to suspend or terminate accounts that contain inaccurate information, are used fraudulently, or violate these Terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mb-3">4. Description of Service</h2>
            <p className="mb-2">
              OnlyPosts is an AI-powered social media management platform that enables users to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>Connect third-party social media accounts (including but not limited to Twitter/X, Reddit, YouTube, and TikTok) via OAuth authorization.</li>
              <li>Create and configure AI agents that generate, schedule, and publish content to connected platforms.</li>
              <li>Manage content campaigns, review AI-generated content, and upload media assets.</li>
              <li>Monitor engagement metrics and analytics across connected platforms.</li>
            </ul>
            <p className="mt-2">
              The Service acts as an intermediary and automation tool. We do not own, operate, or control the third-party
              platforms you connect to, and we are not responsible for the availability, terms, policies, or actions of those platforms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mb-3">5. Third-Party Platform Compliance</h2>
            <p className="mb-2">By connecting third-party social media accounts to the Service, you acknowledge and agree that:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>You are solely responsible for complying with the terms of service, community guidelines, and acceptable use policies of each connected platform.</li>
              <li>Automated posting, AI-generated content, and bot-like activity may violate certain platform rules. It is your responsibility to understand and comply with these rules.</li>
              <li>We are not liable for any actions taken by third-party platforms against your account, including suspensions, bans, content removal, or rate limiting, as a result of your use of the Service.</li>
              <li>You grant us permission to access and interact with your connected accounts solely for the purpose of providing the Service as described herein.</li>
              <li>You may revoke access to any connected platform at any time through the Service&#39;s account settings.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mb-3">6. AI-Generated Content</h2>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>The Service uses artificial intelligence models (provided by third-party vendors, including OpenAI) to generate content based on your configurations and prompts.</li>
              <li>AI-generated content is provided &quot;as is.&quot; While we strive for quality, we do not guarantee the accuracy, appropriateness, legality, or fitness for any particular purpose of AI-generated content.</li>
              <li>You are solely responsible for reviewing, approving, and publishing AI-generated content. Once content is posted to a third-party platform under your account, you assume full responsibility for that content.</li>
              <li>You must not use the Service to generate content that is illegal, defamatory, threatening, harassing, obscene, infringing, or otherwise in violation of applicable law or third-party rights.</li>
              <li>We reserve the right to refuse to generate content that, in our sole discretion, violates these Terms or applicable law.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mb-3">7. Intellectual Property</h2>

            <h3 className="text-lg font-medium text-foreground/95 mt-4 mb-2">7.1 Our Intellectual Property</h3>
            <p>
              The Service, including its software, design, logos, trademarks, documentation, and all other proprietary materials,
              is owned by or licensed to OnlyPosts and is protected by intellectual property laws. You may not copy, modify,
              distribute, sell, or lease any part of the Service without our prior written consent.
            </p>

            <h3 className="text-lg font-medium text-foreground/95 mt-4 mb-2">7.2 Your Content</h3>
            <p>
              You retain ownership of any original content you create or upload to the Service (excluding AI-generated content,
              which is subject to the terms of the underlying AI provider). By using the Service, you grant us a limited,
              non-exclusive, worldwide, royalty-free license to use, store, and process your content solely for the purpose
              of providing and improving the Service. This license terminates when you delete your content or account.
            </p>

            <h3 className="text-lg font-medium text-foreground/95 mt-4 mb-2">7.3 AI-Generated Content Ownership</h3>
            <p>
              To the extent permitted by applicable law, AI-generated content created through the Service is assigned to you.
              However, ownership of AI-generated content is an evolving area of law, and we make no representations or
              warranties regarding the intellectual property status of AI-generated content. You use AI-generated content
              at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mb-3">8. Prohibited Uses</h2>
            <p className="mb-2">You agree not to use the Service to:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>Violate any applicable local, state, national, or international law or regulation.</li>
              <li>Generate, distribute, or promote spam, unsolicited messages, or deceptive content.</li>
              <li>Impersonate any person or entity, or falsely represent your affiliation with any person or entity.</li>
              <li>Infringe upon the intellectual property rights, privacy rights, or any other rights of third parties.</li>
              <li>Distribute malware, viruses, or any other harmful code or software.</li>
              <li>Attempt to gain unauthorized access to the Service, other user accounts, or any related systems or networks.</li>
              <li>Interfere with or disrupt the integrity or performance of the Service.</li>
              <li>Reverse engineer, decompile, disassemble, or attempt to derive the source code of any part of the Service.</li>
              <li>Use the Service to harass, bully, threaten, or intimidate any individual or group.</li>
              <li>Generate content that promotes hatred, discrimination, or violence against any individual or group based on race, ethnicity, religion, gender, sexual orientation, disability, or any other protected characteristic.</li>
              <li>Circumvent any rate limits, security measures, or access restrictions imposed by the Service or connected third-party platforms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mb-3">9. Subscription Plans &amp; Payment</h2>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>Certain features of the Service may require a paid subscription. Pricing, plan details, and feature availability are described on our website and may change from time to time.</li>
              <li>All payments are processed by Stripe, Inc. By subscribing to a paid plan, you agree to Stripe&#39;s terms of service.</li>
              <li>Subscriptions automatically renew at the end of each billing cycle unless cancelled before the renewal date.</li>
              <li>Refunds are handled on a case-by-case basis at our sole discretion. You may request a refund by contacting <a href="mailto:support@only-posts.com" className="text-primary hover:underline">support@only-posts.com</a>.</li>
              <li>We reserve the right to modify pricing with reasonable advance notice. Continued use of the Service after a price change constitutes acceptance of the new pricing.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mb-3">10. Service Availability &amp; Modifications</h2>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>We strive to maintain high availability, but the Service is provided on an &quot;as available&quot; basis. We do not guarantee uninterrupted, error-free, or secure access to the Service.</li>
              <li>We reserve the right to modify, suspend, or discontinue any part of the Service at any time, with or without notice.</li>
              <li>Scheduled maintenance windows will be communicated in advance when feasible.</li>
              <li>We are not liable for any loss or damage arising from Service downtime, interruptions, or modifications.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mb-3">11. Limitation of Liability</h2>
            <p className="uppercase text-sm tracking-wide">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL ONLYPOSTS, ITS DIRECTORS, OFFICERS,
              EMPLOYEES, AGENTS, PARTNERS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
              OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE
              LOSSES, ARISING OUT OF OR IN CONNECTION WITH: (A) YOUR ACCESS TO OR USE OF, OR INABILITY TO ACCESS OR USE,
              THE SERVICE; (B) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICE; (C) ANY CONTENT OBTAINED FROM THE
              SERVICE, INCLUDING AI-GENERATED CONTENT; (D) UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS
              OR CONTENT; OR (E) ANY ACTIONS TAKEN BY THIRD-PARTY PLATFORMS IN RESPONSE TO CONTENT POSTED THROUGH THE
              SERVICE, WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE), STATUTE, OR ANY OTHER LEGAL THEORY,
              WHETHER OR NOT WE HAVE BEEN INFORMED OF THE POSSIBILITY OF SUCH DAMAGE. OUR TOTAL AGGREGATE LIABILITY FOR ALL
              CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE GREATER OF FIFTY U.S.
              DOLLARS ($50.00) OR THE AMOUNT YOU HAVE PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mb-3">12. Disclaimer of Warranties</h2>
            <p className="uppercase text-sm tracking-wide">
              THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND,
              WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY,
              FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE
              UNINTERRUPTED, SECURE, OR ERROR-FREE, THAT DEFECTS WILL BE CORRECTED, OR THAT THE SERVICE OR THE SERVERS
              THAT MAKE IT AVAILABLE ARE FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS. WE MAKE NO WARRANTIES OR REPRESENTATIONS
              REGARDING THE ACCURACY, RELIABILITY, OR COMPLETENESS OF ANY AI-GENERATED CONTENT OR ANY CONTENT POSTED TO
              THIRD-PARTY PLATFORMS THROUGH THE SERVICE.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mb-3">13. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless OnlyPosts and its officers, directors, employees, agents,
              and affiliates from and against any and all claims, liabilities, damages, losses, costs, and expenses
              (including reasonable attorneys&#39; fees) arising out of or in connection with: (a) your use of the Service;
              (b) your violation of these Terms; (c) your violation of any third-party right, including any intellectual
              property, privacy, or proprietary right; (d) any content you create, upload, or publish through the Service;
              or (e) any claim that content posted through your connected accounts caused damage to a third party.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mb-3">14. Termination</h2>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>You may terminate your account at any time by contacting us or through the account settings page.</li>
              <li>We may suspend or terminate your account and access to the Service at our sole discretion, without prior notice, for conduct that we determine violates these Terms, is harmful to other users, or is otherwise objectionable.</li>
              <li>Upon termination, your right to use the Service will immediately cease. We will delete your personal data in accordance with our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.</li>
              <li>Sections 6 (AI-Generated Content), 7 (Intellectual Property), 11 (Limitation of Liability), 12 (Disclaimer of Warranties), 13 (Indemnification), and 16 (Governing Law) shall survive termination.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mb-3">15. Dispute Resolution</h2>
            <p>
              Any dispute, controversy, or claim arising out of or relating to these Terms or the Service shall first be
              attempted to be resolved through good-faith informal negotiation. If the dispute cannot be resolved informally
              within thirty (30) days, either party may initiate binding arbitration administered by the American Arbitration
              Association (&quot;AAA&quot;) in accordance with its Commercial Arbitration Rules. The arbitration shall be
              conducted in the English language in the State of Ohio, United States. Each party shall bear its own costs of
              arbitration, and the arbitrator&#39;s decision shall be final and binding. YOU AGREE THAT ANY DISPUTE RESOLUTION
              PROCEEDINGS WILL BE CONDUCTED ONLY ON AN INDIVIDUAL BASIS AND NOT IN A CLASS, CONSOLIDATED, OR REPRESENTATIVE
              ACTION.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mb-3">16. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of Ohio, United States,
              without regard to its conflict-of-law provisions. To the extent that any lawsuit or court proceeding is permitted
              hereunder, you agree to submit to the personal and exclusive jurisdiction of the state and federal courts located
              in Franklin County, Ohio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mb-3">17. General Provisions</h2>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li><strong>Entire Agreement:</strong> These Terms, together with the Privacy Policy, constitute the entire agreement between you and OnlyPosts with respect to the Service and supersede all prior agreements and understandings.</li>
              <li><strong>Severability:</strong> If any provision of these Terms is held to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.</li>
              <li><strong>Waiver:</strong> Our failure to enforce any right or provision of these Terms shall not constitute a waiver of such right or provision.</li>
              <li><strong>Assignment:</strong> You may not assign or transfer these Terms or your rights hereunder without our prior written consent. We may assign these Terms without restriction.</li>
              <li><strong>Force Majeure:</strong> We shall not be liable for any failure or delay in performing our obligations where such failure or delay results from events beyond our reasonable control, including natural disasters, war, terrorism, pandemics, government actions, or Internet service disruptions.</li>
              <li><strong>Notices:</strong> We may provide notices to you via email, in-app notification, or by posting on the Service. Notices to us should be sent to <a href="mailto:legal@only-posts.com" className="text-primary hover:underline">legal@only-posts.com</a>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mb-3">18. Changes to These Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. If we make material changes, we will notify you by
              posting the updated Terms on this page and updating the &quot;Last Updated&quot; date above. Your
              continued use of the Service after the posting of changes constitutes your acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mb-3">19. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className="mt-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm text-foreground/80">
              <p className="font-medium text-foreground">OnlyPosts</p>
              <p>Email: <a href="mailto:legal@only-posts.com" className="text-primary hover:underline">legal@only-posts.com</a></p>
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
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <span className="text-foreground">Terms</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
