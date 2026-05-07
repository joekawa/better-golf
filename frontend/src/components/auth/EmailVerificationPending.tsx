import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { resendVerification } from '../../lib/api';

interface EmailVerificationPendingProps {
  email?: string;
}

export const EmailVerificationPending: React.FC<EmailVerificationPendingProps> = ({ email: propEmail }) => {
  const location = useLocation();
  const email = propEmail || (location.state as { email?: string })?.email;
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [resendEmail, setResendEmail] = useState(email || '');

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendStatus('loading');
    try {
      await resendVerification(resendEmail);
      setResendStatus('sent');
    } catch {
      setResendStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <h2 className="text-3xl font-bold text-gray-900">Check your email</h2>
        <p className="text-gray-600">
          We sent a verification link to{' '}
          {email ? <span className="font-medium text-gray-900">{email}</span> : 'your email address'}.
          Click the link to activate your account.
        </p>
        <p className="text-sm text-gray-500">
          The link expires in 24 hours.
        </p>

        {resendStatus === 'sent' && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
            Verification email sent. Please check your inbox.
          </div>
        )}
        {resendStatus === 'error' && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            Failed to resend. Please try again.
          </div>
        )}

        <form onSubmit={handleResend} className="space-y-3">
          {!email && (
            <input
              type="email"
              required
              placeholder="Your email address"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          )}
          <button
            type="submit"
            disabled={resendStatus === 'loading' || resendStatus === 'sent'}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {resendStatus === 'loading' ? 'Sending...' : 'Resend verification email'}
          </button>
        </form>

        <div>
          <a href="/login" className="text-sm text-blue-600 hover:text-blue-500">
            Back to sign in
          </a>
        </div>
      </div>
    </div>
  );
};
