const EFFECTIVE_DATE = 'August 13, 2026'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <div className="text-gray-700 space-y-3 leading-relaxed">{children}</div>
    </section>
  )
}

export default function PrivacyPage() {
  return (
    <main className="p-6 max-w-3xl mx-auto py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mt-2">Effective {EFFECTIVE_DATE}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
        <p className="text-gray-700 leading-relaxed">
          This Privacy Policy explains what information Toast2Host collects, how we use it, and the choices
          you have. It applies to your use of the Toast2Host website and services (the "Service").
        </p>

        <Section title="1. Information We Collect">
          <p><strong>From Google Sign-In:</strong> your name, email address, and Google account ID, used to
            create and authenticate your account.</p>
          <p><strong>Profile information you provide:</strong> first and last name, profile photo, university
            and graduating class, LinkedIn URL, phone number, and location (city/state/country, and
            approximate coordinates if you use location search).</p>
          <p><strong>Hosting and booking information:</strong> whether Host Mode is on, your maximum guest
            capacity and availability, and, for each connection request, the requested travel dates and
            guest count.</p>
          <p><strong>Usage information:</strong> basic technical data like IP address and browser type,
            collected automatically when you use the Service, mainly for security and troubleshooting.</p>
        </Section>

        <Section title="2. How We Use Your Information">
          <ul className="list-disc pl-6 space-y-1">
            <li>To create and maintain your account and profile</li>
            <li>To show your profile to other alumni in search results, based on your visibility setting</li>
            <li>To operate booking requests - matching guests with hosts, and sharing contact details once
              a request is approved</li>
            <li>To send you emails about connection requests, approvals, and account activity</li>
            <li>To enforce these policies and our Terms of Service, and to keep the Service safe</li>
          </ul>
        </Section>

        <Section title="3. How We Share Your Information">
          <p>
            <strong>With other users:</strong> your profile (name, photo, university, batch year, and
            approximate location) is visible to other alumni per your profile visibility setting (everyone,
            same university, or same batch). When a connection request is approved, your email address and
            full profile become visible to the other party so you can coordinate the stay.
          </p>
          <p>
            <strong>With service providers:</strong> we use Amazon Web Services (AWS) to host the Service
            and store data, and to send transactional email. We use Google for sign-in and for location
            search (Google Maps/Places). These providers process data on our behalf and don't use it for
            their own purposes.
          </p>
          <p>
            <strong>We do not sell your personal information</strong>, and we don't share it with third
            parties for their own advertising or marketing.
          </p>
        </Section>

        <Section title="4. Data Retention">
          <p>
            We keep your account and profile information for as long as your account is active. If you
            delete your account, we delete your profile data, subject to a short period to complete the
            deletion process and any residual copies in backups, which age out over time.
          </p>
        </Section>

        <Section title="5. Your Rights and Choices">
          <p>
            You can review and update most of your profile information at any time from{' '}
            <a href="/profile" className="text-primary font-semibold hover:underline">your profile</a>. From{' '}
            <a href="/settings" className="text-primary font-semibold hover:underline">Settings</a>, you can:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Request a copy of your data</strong> - we'll compile what we hold about you</li>
            <li><strong>Request account deletion</strong> - we'll remove your account and associated profile
              data</li>
          </ul>
          <p>
            You can also turn off Host Mode at any time to stop appearing in host search results and receiving
            new booking requests, and change your profile visibility to limit who can find your profile.
          </p>
        </Section>

        <Section title="6. Cookies and Local Storage">
          <p>
            We use your browser's session storage to keep you signed in - this is cleared when you close
            your browser or sign out. We don't use third-party advertising trackers or cross-site cookies.
          </p>
        </Section>

        <Section title="7. Data Security">
          <p>
            We use industry-standard measures to protect your information, including encrypted connections
            (HTTPS) and access controls on our infrastructure. No system is perfectly secure, and we can't
            guarantee absolute security of information you provide.
          </p>
        </Section>

        <Section title="8. Children's Privacy">
          <p>
            The Service is intended for university alumni aged 18 and older. We don't knowingly collect
            information from anyone under 18. If you believe a minor has created an account, contact us and
            we'll remove it.
          </p>
        </Section>

        <Section title="9. International Data Transfers">
          <p>
            Toast2Host's infrastructure is hosted in the United States. If you're accessing the Service from
            outside the U.S., your information will be transferred to and processed in the U.S.
          </p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. If we make material changes, we'll update
            the effective date above. Continuing to use the Service after changes take effect means you
            accept the updated policy.
          </p>
        </Section>

        <Section title="11. Contact Us">
          <p>
            Questions about this Privacy Policy or your data? Reach us at{' '}
            <a href="mailto:support@toast2host.net" className="text-primary font-semibold hover:underline">
              support@toast2host.net
            </a>
            .
          </p>
        </Section>
      </div>
    </main>
  )
}
