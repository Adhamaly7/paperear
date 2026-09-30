import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Icon from '../icons'
import './ProfileMenu.css'

const FEEDBACK = { en: 'https://tally.so/r/Pd05y1', ar: 'https://tally.so/r/obOM1O' }

export default function ProfileMenu({ user }) {
    const { t, i18n } = useTranslation()
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        if (!open) return undefined
        const away = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
        const esc = (e) => { if (e.key === 'Escape') setOpen(false) }
        document.addEventListener('mousedown', away)
        document.addEventListener('keydown', esc)
        return () => {
            document.removeEventListener('mousedown', away)
            document.removeEventListener('keydown', esc)
        }
    }, [open])

    const name = user?.email?.split('@')[0] || t('menu.options', 'Options')
    const items = [
        { to: '/app/settings', icon: 'settings', label: t('menu.settings', 'Settings') },
        { to: '/app/key', icon: 'key', label: t('menu.key', 'Your key') },
        { to: '/pricing', icon: 'tag', label: t('menu.pricing', 'Pricing') },
        { to: '/policy', icon: 'rules', label: t('menu.terms', 'Terms and privacy') },
    ]

    return (
        <div className="profile-menu" ref={ref}>
            {open && (
                <div className="profile-menu__pop" role="menu">
                    <div className="profile-menu__head">
                        <div className="profile-menu__name">{name}</div>
                        <div className="profile-menu__sub">{user ? user.email : t('menu.noAccount', 'No account yet. Everything stays in this browser.')}</div>
                    </div>
                    <button type="button" className="profile-menu__item profile-menu__lang" role="menuitem" onClick={() => { i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar'); setOpen(false) }}>
                        <Icon name="globe" size={16} /> <span lang={i18n.language === 'ar' ? 'en' : 'ar'}>{i18n.language === 'ar' ? 'English' : 'العربية'}</span>
                    </button>
                    {items.map((item) => (
                        <Link key={item.to} to={item.to} className="profile-menu__item" role="menuitem" onClick={() => setOpen(false)}>
                            <Icon name={item.icon} size={16} /> {item.label}
                        </Link>
                    ))}
                    <a className="profile-menu__item" role="menuitem" href={FEEDBACK[i18n.language] || FEEDBACK.en} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
                        <Icon name="chat" size={16} /> {t('menu.feedback', 'Tell us what you think')}
                    </a>
                </div>
            )}
            <button type="button" className="profile-menu__btn" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
                <span className="profile-menu__avatar">{user?.email ? user.email[0].toUpperCase() : <Icon name="cog" size={16} />}</span>
                <span className="profile-menu__label">{name}</span>
                <span className="profile-menu__chev"><Icon name="chevron" size={14} /></span>
            </button>
        </div>
    )
}
