import React from 'react';
import { Link } from 'react-router-dom';

export const PrivacyPolicy: React.FC = () => {
  const lastUpdated = 'June 1, 2025';
  const appName = 'Grip Golf';
  const contactEmail = 'privacy@gripgolf.app';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold text-white">{appName} Privacy Policy</h1>
          <p className="mt-2 text-primary-100 text-sm">Last updated: {lastUpdated}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-8">

          <section>
            <p className="text-gray-600 leading-relaxed">
              {appName} ("we", "us", or "our") is committed to protecting your privacy. This Privacy
              Policy explains how we collect, use, disclose, and safeguard your information when you
              use our web application and mobile app (collectively, the "Service"). Please read this
              policy carefully. If you do not agree with the terms of this policy, please do not use
              the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <div>
                <h3 className="font-medium text-gray-800 mb-1">Account Information</h3>
                <p>
                  When you register, we collect your name, email address, and password (stored in
                  hashed form). You may optionally provide a handicap index and preferred tee
                  preferences as part of your profile.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-800 mb-1">Golf Round Data</h3>
                <p>
                  We store round scores, hole-by-hole statistics (fairways hit, greens in
                  regulation, putts, etc.), course information, and dates you provide when logging
                  rounds.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-800 mb-1">Usage Data</h3>
                <p>
                  We may automatically collect certain technical information including your device
                  type, browser type, IP address, pages visited, and timestamps. This data is used
                  solely to operate and improve the Service.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-600 leading-relaxed">
              <li>To create and manage your account</li>
              <li>To provide, operate, and maintain the Service</li>
              <li>To calculate statistics, handicap trends, and performance insights</li>
              <li>To send transactional emails (e.g., email verification, password reset)</li>
              <li>To improve and develop new features of the Service</li>
              <li>To detect and prevent fraud or misuse</li>
            </ul>
            <p className="mt-4 text-gray-600 leading-relaxed">
              We do not sell your personal data to third parties. We do not use your data for
              advertising or marketing purposes beyond the Service itself.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Data Sharing and Disclosure</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              We do not share your personal information with third parties except in the following
              limited circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 leading-relaxed">
              <li>
                <span className="font-medium text-gray-800">Service Providers:</span> Trusted
                vendors who assist us in operating the Service (e.g., cloud hosting, email
                delivery), bound by confidentiality obligations.
              </li>
              <li>
                <span className="font-medium text-gray-800">Legal Requirements:</span> If required
                by law, regulation, or valid legal process.
              </li>
              <li>
                <span className="font-medium text-gray-800">Business Transfers:</span> In
                connection with a merger, acquisition, or sale of assets, your data may be
                transferred. We will notify you before your data becomes subject to a different
                privacy policy.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Retention</h2>
            <p className="text-gray-600 leading-relaxed">
              We retain your personal data for as long as your account is active or as needed to
              provide the Service. You may request deletion of your account and associated data at
              any time by contacting us at{' '}
              <a href={`mailto:${contactEmail}`} className="text-primary-600 hover:text-primary-700 underline">
                {contactEmail}
              </a>
              . We will fulfill your request within 30 days, subject to any legal retention
              obligations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Security</h2>
            <p className="text-gray-600 leading-relaxed">
              We implement industry-standard technical and organizational measures to protect your
              information against unauthorized access, alteration, disclosure, or destruction.
              Passwords are stored using one-way hashing. However, no method of transmission over
              the internet or electronic storage is 100% secure, and we cannot guarantee absolute
              security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Cookies and Tracking</h2>
            <p className="text-gray-600 leading-relaxed">
              We use essential cookies and local storage tokens solely to maintain your authenticated
              session. We do not use advertising cookies or third-party tracking pixels. You can
              configure your browser to refuse cookies, but doing so may affect your ability to use
              the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Your Rights</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              Depending on your jurisdiction, you may have the following rights regarding your
              personal data:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 leading-relaxed">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data ("right to be forgotten")</li>
              <li>Object to or restrict processing of your data</li>
              <li>Data portability — receive a copy of your data in a structured format</li>
            </ul>
            <p className="mt-3 text-gray-600 leading-relaxed">
              To exercise any of these rights, contact us at{' '}
              <a href={`mailto:${contactEmail}`} className="text-primary-600 hover:text-primary-700 underline">
                {contactEmail}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Children's Privacy</h2>
            <p className="text-gray-600 leading-relaxed">
              The Service is not directed to children under the age of 13. We do not knowingly
              collect personal information from children. If you believe we have inadvertently
              collected such information, please contact us and we will promptly delete it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Changes to This Policy</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update this Privacy Policy from time to time. When we do, we will update the
              "Last updated" date at the top of this page and, where appropriate, notify registered
              users by email. Your continued use of the Service after changes are posted constitutes
              your acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Contact Us</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have any questions or concerns about this Privacy Policy, please contact us:
            </p>
            <div className="mt-3 text-gray-600">
              <p>
                Email:{' '}
                <a href={`mailto:${contactEmail}`} className="text-primary-600 hover:text-primary-700 underline">
                  {contactEmail}
                </a>
              </p>
              <p className="mt-1">Application: {appName}</p>
            </div>
          </section>
        </div>

        {/* Back link */}
        <div className="mt-8 text-center">
          <Link to="/" className="text-sm text-primary-600 hover:text-primary-700 underline">
            Back to home
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 py-8 border-t border-gray-200 mt-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} {appName}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
