import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { verifyEmail } from '../../lib/api';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'expired' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    console.log('[VerifyEmailPage] Token from URL:', token ? 'present' : 'missing');

    if (!token) {
      setStatus('error');
      setMessage('No verification token found.');
      return;
    }

    verifyEmail(token)
      .then((res) => {
        console.log('[VerifyEmailPage] Verification success:', res.data);
        setStatus('success');
        setMessage(res.data.detail || 'Email verified successfully.');
      })
      .catch((err) => {
        const detail = err?.response?.data?.detail || '';
        console.error('[VerifyEmailPage] Verification error:', detail);
        if (detail.toLowerCase().includes('expired')) {
          setStatus('expired');
        } else {
          setStatus('error');
        }
        setMessage(detail || 'Verification failed. The link may be invalid.');
      });
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-6 text-center">
        {status === 'loading' && (
          <>
            <h2 className="text-3xl font-bold text-gray-900">Verifying your email...</h2>
            <p className="text-gray-500">Please wait.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <h2 className="text-3xl font-bold text-gray-900">Email verified</h2>
            <p className="text-gray-600">{message}</p>
            <a
              href="/login"
              className="inline-block mt-4 py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Sign in
            </a>
          </>
        )}

        {(status === 'expired' || status === 'error') && (
          <>
            <h2 className="text-3xl font-bold text-gray-900">
              {status === 'expired' ? 'Link expired' : 'Verification failed'}
            </h2>
            <p className="text-gray-600">{message}</p>
            <a
              href="/verify-email-pending"
              className="inline-block mt-4 py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Request a new link
            </a>
          </>
        )}
      </div>
    </div>
  );
};
