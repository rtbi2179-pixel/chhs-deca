'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ROLEPLAY_AI_URL = 'https://chhsdeca-hn7kwxwp.manus.space';

type MicrophoneError = 
  | 'permission-denied'
  | 'no-device'
  | 'device-in-use'
  | 'insecure-connection'
  | 'embed-policy'
  | 'not-supported'
  | null;

export default function RoleplayAI() {
  const [micError, setMicError] = useState<MicrophoneError>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    // Verify HTTPS
    if (typeof window !== 'undefined' && window.location.protocol !== 'https:') {
      setMicError('insecure-connection');
      setIsLoading(false);
      return;
    }

    // Check microphone support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicError('not-supported');
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
  }, []);

  const handleRetry = () => {
    setMicError(null);
    setIframeKey(prev => prev + 1);
  };

  const getErrorMessage = (error: MicrophoneError): { title: string; message: string; steps: string[] } => {
    switch (error) {
      case 'permission-denied':
        return {
          title: 'Microphone Access Denied',
          message: 'You denied microphone access. To use the Roleplay AI, you need to allow microphone access.',
          steps: [
            'Click the lock icon in your browser\'s address bar',
            'Find "Microphone" in the permissions list',
            'Change it to "Allow"',
            'Refresh the page and try again',
          ],
        };
      case 'no-device':
        return {
          title: 'No Microphone Found',
          message: 'Your computer doesn\'t have a microphone connected or it\'s disabled.',
          steps: [
            'Connect a microphone to your computer',
            'Or enable your built-in microphone in system settings',
            'Refresh the page and try again',
          ],
        };
      case 'device-in-use':
        return {
          title: 'Microphone In Use',
          message: 'Your microphone is already being used by another application.',
          steps: [
            'Close other apps using your microphone (video calls, recording software, etc.)',
            'Try again',
          ],
        };
      case 'insecure-connection':
        return {
          title: 'Secure Connection Required',
          message: 'Microphone access requires a secure HTTPS connection.',
          steps: [
            'This page must be accessed over HTTPS',
            'Contact support if you\'re seeing this on a secure connection',
          ],
        };
      case 'embed-policy':
        return {
          title: 'Embedded Access Blocked',
          message: 'Microphone access is blocked by the embedded page configuration.',
          steps: [
            'Try refreshing the page',
            'If the problem persists, contact support',
          ],
        };
      case 'not-supported':
        return {
          title: 'Browser Not Supported',
          message: 'Your browser doesn\'t support microphone access.',
          steps: [
            'Use Chrome, Edge, Safari, or Firefox',
            'Update your browser to the latest version',
          ],
        };
      default:
        return {
          title: 'Microphone Error',
          message: 'An error occurred with microphone access.',
          steps: ['Try refreshing the page', 'If the problem persists, contact support'],
        };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-foreground/70">Loading Roleplay AI...</p>
        </div>
      </div>
    );
  }

  if (micError) {
    const errorInfo = getErrorMessage(micError);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-2">{errorInfo.title}</h2>
                <p className="text-foreground/70 text-sm mb-4">{errorInfo.message}</p>
              </div>
            </div>

            <div className="bg-foreground/5 rounded p-4 mb-6">
              <p className="text-foreground/70 font-medium text-sm mb-3">To fix this:</p>
              <ol className="space-y-2">
                {errorInfo.steps.map((step, i) => (
                  <li key={i} className="text-foreground/60 text-sm flex gap-2">
                    <span className="font-medium text-foreground/70">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <Button
              onClick={handleRetry}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col mt-16">
      {/* Header */}
      <div className="bg-background border-b border-border px-6 py-4 sticky top-16 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <Volume2 className="w-5 h-5 text-blue-400" />
          <div>
            <h1 className="text-lg font-semibold text-foreground">Roleplay Event AI</h1>
            <p className="text-sm text-foreground/60">Practice roleplay scenarios with AI feedback</p>
          </div>
        </div>
      </div>

      {/* Embedded iframe */}
      <div className="flex-1 overflow-hidden">
        <iframe
          key={iframeKey}
          src={ROLEPLAY_AI_URL}
          title="Roleplay Event AI"
          allow="microphone; autoplay"
          referrerPolicy="strict-origin-when-cross-origin"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
          onError={() => {
            setMicError('embed-policy');
          }}
        />
      </div>
    </div>
  );
}
