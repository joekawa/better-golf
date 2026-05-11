import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { confirmPasswordReset } from '../../lib/api';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (newPassword !== newPassword2) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setStatus('loading');
    console.log('[ResetPassword] Submitting password reset with token:', token ? 'present' : 'missing');

    try {
      await confirmPasswordReset(token, newPassword, newPassword2);
      console.log('[ResetPassword] Password reset successful');
      setStatus('success');
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
      const detail =
        (data as { detail?: string })?.detail ||
        (data as { new_password?: string[] })?.new_password?.[0] ||
        'Something went wrong. Please try again or request a new reset link.';
      console.error('[ResetPassword] Error:', detail);
      setErrorMessage(detail);
      setStatus('error');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900">Invalid link</h2>
          <p className="text-gray-600">This password reset link is invalid or has expired.</p>
          <a
            href="/forgot-password"
            className="inline-block py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Request a new link
          </a>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900">Password reset</h2>
          <p className="text-gray-600">Your password has been reset successfully. You can now sign in.</p>
          <a
            href="/login"
            className="inline-block py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Set a new password
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {errorMessage}
              {errorMessage.toLowerCase().includes('expired') && (
                <div className="mt-2">
                  <a href="/forgot-password" className="underline font-medium">
                    Request a new reset link
                  </a>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="new_password" className="block text-sm font-medium text-gray-700">
                New password
              </label>
              <input
                id="new_password"
                name="new_password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="new_password2" className="block text-sm font-medium text-gray-700">
                Confirm new password
              </label>
              <input
                id="new_password2"
                name="new_password2"
                type="password"
                required
                value={newPassword2}
                onChange={(e) => setNewPassword2(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {status === 'loading' ? 'Resetting...' : 'Reset password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
