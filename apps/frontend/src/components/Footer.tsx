import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-primary">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/t2h_logo.png" alt="Toast2Host" className="h-8 w-auto object-contain" />
          </div>

          <nav className="flex items-center gap-6">
            <Link
              to="/"
              className="text-sm text-gray-900 hover:text-gray-700 transition-colors font-medium"
            >
              Home
            </Link>
            <Link
              to="/search"
              className="text-sm text-gray-900 hover:text-gray-700 transition-colors font-medium"
            >
              Search
            </Link>
            <Link
              to="/profile"
              className="text-sm text-gray-900 hover:text-gray-700 transition-colors font-medium"
            >
              Profile
            </Link>
          </nav>

          <div className="text-sm text-black font-medium">
            © {new Date().getFullYear()} Toast2Host. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}
