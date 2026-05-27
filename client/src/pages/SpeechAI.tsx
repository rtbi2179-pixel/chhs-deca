/*
 * Speech AI Page — Embedded iframe for Speech AI tool
 * Full-screen embedded experience with loading state
 */

import { useEffect, useState } from 'react'

export default function SpeechAI() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-[oklch(0.07_0.01_265)] pt-20">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        <h1 className="font-display text-4xl text-white mb-2">Speech AI</h1>
        <p className="text-white/70">Practice your DECA speeches with AI-powered feedback and coaching</p>
      </div>

      {/* Embedded iframe */}
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-12">
        <div className="relative w-full bg-[oklch(0.09_0.012_265)] rounded-lg border border-white/10 overflow-hidden" style={{ aspectRatio: '16/9' }}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[oklch(0.09_0.012_265)] z-10">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-white/70 text-sm">Loading Speech AI...</p>
              </div>
            </div>
          )}
          <iframe
            src="https://chhsdeca-hn7kwxwp.manus.space"
            title="Speech AI Tool"
            className="w-full h-full border-0"
            allowFullScreen
            onLoad={() => setIsLoading(false)}
          />
        </div>
      </div>
    </div>
  )
}
