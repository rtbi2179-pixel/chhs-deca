/*
 * Blue Blazer 404 Page — Cinematic Dark Editorial
 */

import { Link } from 'wouter'
import { motion } from 'framer-motion'
import { Home, ArrowRight } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[oklch(0.07_0.01_265)] flex items-center justify-center px-4">
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="font-display text-[10rem] sm:text-[14rem] text-white/5 leading-none select-none">
            404
          </div>
          <div className="-mt-12 sm:-mt-20 relative z-10">
            <h1 className="font-display text-4xl sm:text-5xl text-white mb-4">PAGE NOT FOUND</h1>
            <p className="text-white/50 text-lg mb-8 max-w-md mx-auto">
              Looks like this page took a wrong turn on the road to ICDC.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/">
                <div className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all cursor-pointer hover:shadow-[0_0_30px_oklch(0.55_0.22_260/0.4)]">
                  <Home size={16} />
                  Go Home
                </div>
              </Link>
              <Link href="/events">
                <div className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-lg transition-all cursor-pointer">
                  View Events
                  <ArrowRight size={16} />
                </div>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
