import { Routes, Route, Navigate } from 'react-router-dom'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

// Pages
import HomePage from '@/pages/HomePage'
import SignInPage from '@/pages/SignInPage'
import AuthCallbackPage from '@/pages/AuthCallbackPage'
import OnboardingPage from '@/pages/OnboardingPage'
import SearchPage from '@/pages/SearchPage'
import ProfilePage from '@/pages/ProfilePage'
import RequestsPage from '@/pages/RequestsPage'
import SettingsPage from '@/pages/SettingsPage'
import TermsPage from '@/pages/legal/TermsPage'
import PrivacyPage from '@/pages/legal/PrivacyPage'

export default function App() {
  return (
    <div className="min-h-screen bg-white text-black">
      <Header />
      <div className="min-h-[80vh]">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/connections" element={<RequestsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/legal/terms" element={<TermsPage />} />
          <Route path="/legal/privacy" element={<PrivacyPage />} />
          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Footer />
    </div>
  )
}
