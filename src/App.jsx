import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LandingPage from './pages/LandingPage'
import ReaderView from './pages/ReaderView'
import SettingsPage from './pages/SettingsPage'
import Library from './pages/Library'
import KeyPage from './pages/KeyPage'
import PolicyPage from './pages/PolicyPage'
import PricingPage from './pages/PricingPage'
import AppShell from './components/layout/AppShell'

function App() {
  const { i18n } = useTranslation()

  useEffect(() => {
    const rtl = i18n.language === 'ar'
    document.documentElement.dir = rtl ? 'rtl' : 'ltr'
    document.documentElement.lang = rtl ? 'ar' : 'en'
  }, [i18n.language])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/policy" element={<PolicyPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/app" element={<AppShell />}>
          <Route index element={<ReaderView />} />
          <Route path="reader" element={<ReaderView />} />
          <Route path="library" element={<Library />} />
          <Route path="key" element={<KeyPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/app/reader" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
