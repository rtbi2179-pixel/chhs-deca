import { Link } from 'wouter'

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 py-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-slate-400 text-sm">
            © 2025 Blue Blazer. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm">
            <a
              href="/Blue Blazer_DECA_Privacy_Policy.pdf"
              download
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="/Blue Blazer_DECA_Terms_of_Service.pdf"
              download
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Terms of Service
            </a>
            <a
              href="https://www.deca.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              DECA Official
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
