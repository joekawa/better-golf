import React, { useState } from 'react';
import { requestPasswordReset } from '../../lib/api';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');
    console.log('[ForgotPassword] Requesting password reset for:', email);
    try {
      await requestPasswordReset(email);
      console.log('[ForgotPassword] Reset email request successful');
      setStatus('sent');
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || '';
      console.error('[ForgotPassword] Reset request error:', detail);
      setErrorMessage(detail || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter the email address for your account and we will send you a reset link.
          </p>
        </div>

        {status === 'sent' ? (
          <div className="space-y-4 text-center">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
              If an account with that email exists, a password reset link has been sent. Check your inbox.
            </div>
            <a href="/login" className="text-sm text-blue-600 hover:text-blue-500">
              Back to sign in
            </a>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {status === 'error' && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {errorMessage}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {status === 'loading' ? 'Sending...' : 'Send reset link'}
              </button>
            </div>

            <div className="text-center">
              <a href="/login" className="text-sm text-blue-600 hover:text-blue-500">
                Back to sign in
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
