import React from 'react'
import { useTranslation } from 'react-i18next'
import Icon from '../icons'
import './LanguageSwitcher.css'

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation()

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'ar' : 'en'
    i18n.changeLanguage(nextLang)
  }

  return (
    <button className="lang-switcher-btn" onClick={toggleLanguage} title={t('nav.toggleLanguage', 'Toggle Language')}>
      <Icon name="globe" size={20} className="lang-switcher-icon" />
      <span style={{ fontSize: '0.9rem', fontWeight: 'bold', marginInlineStart: '8px' }}>
        {i18n.language === 'en' ? 'عربي' : 'EN'}
      </span>
    </button>
  )
}
