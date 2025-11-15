import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="mt-12 border-t py-6 text-sm text-gray-600">
      <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
        <span>© {new Date().getFullYear()} Toast2Host</span>
        <nav className="flex gap-4">
          <Link href="/">Home</Link>
          <Link href="/settings">Settings</Link>
        </nav>
      </div>
    </footer>
  )
}

