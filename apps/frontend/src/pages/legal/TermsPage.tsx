const EFFECTIVE_DATE = 'August 13, 2026'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <div className="text-gray-700 space-y-3 leading-relaxed">{children}</div>
    </section>
  )
}

export default function TermsPage() {
  return (
    <main className="p-6 max-w-3xl mx-auto py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900">Terms of Service</h1>
        <p className="text-sm text-gray-500 mt-2">Effective {EFFECTIVE_DATE}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
        <p className="text-gray-700 leading-relaxed">
          Toast2Host ("Toast2Host," "we," "us," or "our") operates a platform that helps university alumni
          find and stay with one another while traveling. These Terms of Service ("Terms") govern your
          access to and use of the Toast2Host website and services (the "Service"). By creating an account
          or using the Service, you agree to these Terms. If you don't agree, don't use the Service.
        </p>

        <Section title="1. Who Can Use Toast2Host">
          <p>
            You must be at least 18 years old and able to form a binding contract to use the Service.
            Toast2Host is intended for verified alumni of the universities represented in our directory.
            You're responsible for providing accurate information about your identity, university, and
            graduating class when you create your profile, and for keeping it up to date.
          </p>
        </Section>

        <Section title="2. What Toast2Host Is (and Isn't)">
          <p>
            Toast2Host is a platform for alumni to find each other and arrange informal home stays. We do
            not own, manage, or inspect any properties listed or described by hosts, and we are not a party
            to any agreement a host and guest reach between themselves.
          </p>
          <p>
            <strong>Toast2Host does not process payments, charge booking fees, or handle money between hosts
            and guests.</strong> Any arrangement about cost, house rules, or logistics is strictly between the
            host and guest. If money changes hands, that's a private arrangement outside of Toast2Host, and
            we have no involvement in or responsibility for it.
          </p>
        </Section>

        <Section title="3. Your Account">
          <p>
            You sign in with your Google account. You're responsible for all activity that happens under
            your account, and for keeping your account credentials secure. Let us know right away at{' '}
            <a href="mailto:support@toast2host.net" className="text-primary font-semibold hover:underline">
              support@toast2host.net
            </a>{' '}
            if you suspect unauthorized use of your account.
          </p>
        </Section>

        <Section title="4. Connection Requests, Hosting, and Booking">
          <p>
            Guests can request to stay with a host for specific dates and a number of guests; hosts can
            approve or decline requests at their discretion. Turning off Host Mode means you will not
            receive new booking requests. Approving a request shares your contact details and profile
            information with the other party so you can coordinate the stay directly.
          </p>
          <p>
            Neither hosting nor requesting a stay obligates either party to go through with it. Cancel or
            decline in good faith and with reasonable notice - don't leave someone stranded.
          </p>
        </Section>

        <Section title="5. If You're Hosting">
          <p>
            Only offer to host if you can legally do so (e.g., you're not violating a lease, HOA rule, or
            local law), and only offer space you can safely and honestly describe. You're responsible for
            the safety and condition of the space you offer and for your own conduct toward guests.
          </p>
        </Section>

        <Section title="6. If You're a Guest">
          <p>
            Respect your host's home, house rules, and property. You're responsible for your own conduct,
            belongings, and safety while traveling and while staying with a host.
          </p>
        </Section>

        <Section title="7. Assumption of Risk">
          <p>
            <strong>
              Toast2Host does not screen, background-check, or verify hosts or guests beyond confirming
              university affiliation, and we do not inspect any home or property.
            </strong>{' '}
            Meeting people and staying in someone else's home carries inherent risk. You're solely
            responsible for evaluating who you connect with, host or guest, and for exercising your own
            judgment about safety, including meeting in person, sharing personal details, and where you
            choose to stay. Use the same caution you would with any other in-person meeting arranged online.
          </p>
        </Section>

        <Section title="8. Prohibited Conduct">
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Misrepresent your identity, university affiliation, or graduating class</li>
            <li>Use the Service for commercial short-term rental listings or as a booking marketplace</li>
            <li>Harass, threaten, or discriminate against another user</li>
            <li>Use another person's account, or share your account with others</li>
            <li>Scrape, data-mine, or use the Service to build a competing product</li>
            <li>Attempt to circumvent Host Mode, connection limits, or other platform controls</li>
          </ul>
        </Section>

        <Section title="9. Content You Submit">
          <p>
            You retain ownership of the profile information, photos, and other content you submit. By
            submitting it, you grant Toast2Host a license to display it to other users as necessary to
            operate the Service (for example, showing your profile photo and university in search results).
            You're responsible for making sure you have the right to share anything you upload.
          </p>
        </Section>

        <Section title="10. Third-Party Services">
          <p>
            Toast2Host uses Google Sign-In for authentication and Google Maps/Places for location search.
            Your use of those services is also subject to Google's own terms. We aren't responsible for the
            availability or behavior of third-party services we rely on or that you link to from your
            profile (such as LinkedIn).
          </p>
        </Section>

        <Section title="11. Disclaimers">
          <p>
            THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
            WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DON'T
            WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE, OR THAT ANY HOST OR GUEST
            IS WHO THEY CLAIM TO BE.
          </p>
        </Section>

        <Section title="12. Limitation of Liability">
          <p>
            TO THE FULLEST EXTENT PERMITTED BY LAW, TOAST2HOST AND ITS OPERATORS ARE NOT LIABLE FOR ANY
            INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR ANY INJURY, LOSS,
            THEFT, OR DAMAGE ARISING FROM A STAY, MEETING, OR INTERACTION BETWEEN USERS ARRANGED THROUGH
            THE SERVICE. THIS INCLUDES DISPUTES, PROPERTY DAMAGE, OR PERSONAL INJURY BETWEEN A HOST AND
            GUEST. OUR TOTAL LIABILITY FOR ANY CLAIM RELATED TO THE SERVICE IS LIMITED TO $100.
          </p>
        </Section>

        <Section title="13. Indemnification">
          <p>
            You agree to indemnify and hold Toast2Host harmless from any claim or demand arising out of
            your use of the Service, your violation of these Terms, or your interactions with another user,
            including any stay you host or take part in.
          </p>
        </Section>

        <Section title="14. Termination">
          <p>
            You can stop using the Service and request deletion of your account at any time from{' '}
            <a href="/settings" className="text-primary font-semibold hover:underline">Settings</a>. We may
            suspend or terminate accounts that violate these Terms or that we believe put other users at
            risk.
          </p>
        </Section>

        <Section title="15. Changes to These Terms">
          <p>
            We may update these Terms from time to time. If we make material changes, we'll update the
            effective date above. Continuing to use the Service after changes take effect means you accept
            the updated Terms.
          </p>
        </Section>

        <Section title="16. Governing Law">
          <p>
            These Terms are governed by the laws of the United States, without regard to conflict-of-law
            principles, unless a different governing law is required by the law of your place of residence.
          </p>
        </Section>

        <Section title="17. Contact">
          <p>
            Questions about these Terms? Reach us at{' '}
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
