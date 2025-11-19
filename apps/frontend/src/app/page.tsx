export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-4xl mx-auto text-center space-y-12 py-12 fade-in">
        <div className="space-y-6">
          <h1 className="text-6xl md:text-7xl font-black text-gray-900 tracking-tight">
            Toast<span className="text-primary">2</span>Host
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 font-light max-w-2xl mx-auto leading-relaxed">
            Connect with alumni from your university and build meaningful professional relationships
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <a
            href="/signin"
            className="bg-primary text-black font-bold px-9 py-3 rounded-lg shadow-md hover:shadow-lg hover:bg-primary-dark transition-all inline-flex items-center justify-center rounded-xl px-10 py-4 text-lg font-bold shadow-xl hover:shadow-2xl transition-all"
          >
            Get Started
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
          <a
            href="/search"
            className="bg-white text-gray-900 font-semibold px-6 py-2.5 rounded-lg border-2 border-gray-200 hover:border-primary transition-all inline-flex items-center justify-center rounded-xl px-10 py-4 text-lg font-semibold"
          >
            Browse Alumni
          </a>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-20 text-left">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 group">
            <div className="icon-container mb-5">
              <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Find Alumni</h3>
            <p className="text-gray-600 leading-relaxed">Search by university, location, batch year, and connect with peers in your area</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 group">
            <div className="icon-container mb-5">
              <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Privacy First</h3>
            <p className="text-gray-600 leading-relaxed">Your information is only shared when you approve connection requests</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 group">
            <div className="icon-container mb-5">
              <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Quick Connect</h3>
            <p className="text-gray-600 leading-relaxed">Send connection requests and start networking instantly with fellow alumni</p>
          </div>
        </div>
      </div>
    </main>
  )
}
