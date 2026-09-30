import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import ThemeSwitcher from '../components/layout/ThemeSwitcher'
import './SettingsPage.css'

const LANGUAGES = [['en', 'English'], ['ar', 'العربية']]

export default function SettingsPage() {
    const { t, i18n } = useTranslation()
    return (
        <div className="settings-free">
            <h1 className="settings-free__title">{t('settings.title', 'Settings')}</h1>

            <section className="settings-free__row">
                <div>
                    <div className="settings-free__label">{t('settings.language', 'Language')}</div>
                    <div className="settings-free__hint">{t('settings.languageHint', 'The language of the app itself, not of what it reads.')}</div>
                </div>
                <select className="settings-free__select" value={i18n.language} onChange={(e) => i18n.changeLanguage(e.target.value)}>
                    {LANGUAGES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                </select>
            </section>

            <section className="settings-free__row">
                <div>
                    <div className="settings-free__label">{t('settings.theme', 'Theme')}</div>
                    <div className="settings-free__hint">{t('settings.themeHint', 'Paper by day, Dusk or Midnight at night.')}</div>
                </div>
                <ThemeSwitcher />
            </section>

            <section className="settings-free__row">
                <div>
                    <div className="settings-free__label">{t('settings.keyLabel', 'Your key')}</div>
                    <div className="settings-free__hint">{t('settings.keyHint', 'Voices from a provider you already pay for.')}</div>
                </div>
                <Link className="settings-free__link" to="/app/key">{t('settings.keyOpen', 'Open')}</Link>
            </section>

            <p className="settings-free__note">{t('settings.accountSoon', 'Accounts come later. Until then these settings live in this browser.')}</p>
        </div>
    )
}
