import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ThemeSwitcher from '../components/layout/ThemeSwitcher'
import LanguageSwitcher from '../components/layout/LanguageSwitcher'
import Icon from '../components/icons'
import Scenes from '../components/landing/Scenes'
import Turn from '../components/landing/Turn'
import './LandingPage.css'

const SWEEP_STEP_MS = 350
const SWEEP_START_MS = 900

function reducedMotion() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false }
}

function LiveSweep({ text }) {
    const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text])
    const [lit, setLit] = useState(() => (reducedMotion() ? words.length - 1 : -1))
    useEffect(() => {
        if (lit >= words.length - 1) return undefined
        const id = setTimeout(() => setLit((n) => n + 1), lit < 0 ? SWEEP_START_MS : SWEEP_STEP_MS)
        return () => clearTimeout(id)
    }, [lit, words.length])
    return (
        <p className="landing-sweep">
            {words.map((w, i) => (
                <span key={i} className={i === lit ? 'is-lit' : i < lit ? 'is-read' : undefined}>{w} </span>
            ))}
        </p>
    )
}

function Marked({ text }) {
    const parts = text.split(/\[([^\]]+)\]/)
    return parts.map((part, i) => (i % 2 ? <span key={i} className="is-lit">{part}</span> : <React.Fragment key={i}>{part}</React.Fragment>))
}

export default function LandingPage() {
    const { t, i18n } = useTranslation()


    const voices = [
        { key: 'voice1', icon: 'voice' },
        { key: 'voice2', icon: 'shelf' },
        { key: 'voice3', icon: 'key' },
    ]

    return (
        <div className="landing">
            <nav className="landing-nav">
                <div className="landing-nav-inner">
                    <Link to="/" className="landing-logo">
                        <img className="landing-logo-mark" src="/paperear-mark.png" alt="" width="20" height="28" />
                        <span className="landing-logo-text">Paperear</span>
                    </Link>
                    <div className="landing-nav-links">
                        <LanguageSwitcher />
                        <ThemeSwitcher />
                        <Link to="/app" className="landing-btn-primary">{t('landing.start')}</Link>
                    </div>
                </div>
            </nav>

            <section className="landing-hero">
                <div className="landing-hero-inner">
                    <div className="landing-hero-text">
                        <div className="landing-badge">{t('landing.badge')}</div>
                        <h1 className="landing-h1">
                            {t('landing.title1')}<br />
                            {t('landing.title2')}
                        </h1>
                        <p className="landing-subtitle">{t('landing.subtitle')}</p>
                        <Link to="/app" className="landing-cta-primary">{t('landing.start')}</Link>
                        <p className="landing-cta-note">{t('landing.freeNote')}</p>
                    </div>
                    <div className="landing-hero-card" aria-hidden="true">
                        <LiveSweep key={i18n.language} text={t('landing.sweep')} />
                    </div>
                </div>
                <ul className="landing-facts">
                    {['device', 'account', 'code'].map((k) => (
                        <li key={k}><Icon name="check" size={16} /> {t(`landing.facts.${k}`)}</li>
                    ))}
                </ul>
            </section>

            <section className="landing-band landing-band--alt">
                <div className="landing-band-inner landing-band-inner--split">
                    <div>
                        <div className="landing-label">{t('landing.pageLabel')}</div>
                        <h2 className="landing-h2">{t('landing.pageTitle')}</h2>
                        <p className="landing-band-sub">{t('landing.pageSub')}</p>
                        <p className="landing-formats">{t('landing.formats')}</p>
                        <p className="landing-formats">{t('landing.resume')}</p>
                    </div>
                    <div className="landing-page-mock" aria-hidden="true">
                        <div className="landing-page-mock__sheet">
                            <p className="landing-page-mock__title">{t('landing.mockTitle')}</p>
                            <p><Marked text={t('landing.mockLine1')} /></p>
                            <p><Marked text={t('landing.mockLine2')} /></p>
                            <p><Marked text={t('landing.mockLine3')} /></p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-band">
                <div className="landing-band-inner">
                    <div className="landing-label">{t('landing.voicesLabel')}</div>
                    <h2 className="landing-h2">{t('landing.voicesTitle')}</h2>
                    <p className="landing-band-sub">{t('landing.voicesSub')}</p>
                    <div className="landing-voices">
                        {voices.map((v) => (
                            <div className="landing-voice" key={v.key}>
                                <div className="landing-voice__tile"><Marked text={t(`landing.${v.key}Tile`)} /></div>
                                <div className="landing-voice__head"><Icon name={v.icon} size={18} /> <h3>{t(`landing.${v.key}Title`)}</h3></div>
                                <p>{t(`landing.${v.key}Line`)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="landing-close">
                <div className="landing-band-inner">
                    <h2 className="landing-h2 landing-h2--inverse">{t('landing.closeTitle')}</h2>
                    <Link to="/app" className="landing-cta-primary landing-cta-primary--inverse">{t('landing.start')}</Link>
                    <p className="landing-cta-note landing-cta-note--inverse">{t('landing.freeNote')}</p>
                </div>
            </section>

            <Scenes />

            <Turn />

            <footer className="landing-footer">
                <div className="landing-footer-inner">
                    <span className="landing-footer-brand">Paperear</span>
                    <Link to="/policy" className="landing-footer-link">{t('landing.policy', 'Terms and privacy')}</Link>
                    <span className="landing-footer-copy">{t('landing.footer').replace('{{year}}', new Date().getFullYear())}</span>
                </div>
            </footer>
        </div>
    )
}
