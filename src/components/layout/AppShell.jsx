import React from 'react'
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import { NAV_ITEMS, APP_NAME } from '../../utils/constants'
import { useTranslation } from 'react-i18next'
import ThemeSwitcher from './ThemeSwitcher'
import ProfileMenu from './ProfileMenu'
import Icon from '../icons'
import './AppShell.css'

/**
 * AppShell — Layout wrapper for authenticated /app/* routes.
 * Provides sidebar navigation and top bar.
 */
export default function AppShell() {
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()

    return (
        <div className="app-shell">
            {/* Sidebar */}
            <aside className="shell-sidebar">
                <Link to="/app/reader" className="shell-logo">
                    <img className="shell-logo-mark" src="/paperear-mark.png" alt="" width="18" height="25" />
                    <span className="shell-logo-text">{APP_NAME}</span>
                </Link>

                <nav className="shell-nav">
                    {NAV_ITEMS.map((item) => item.entry ? (
                        <button
                            key={item.key}
                            type="button"
                            className="shell-nav-item shell-nav-item--action"
                            onClick={() => navigate('/app/reader', { state: { entry: item.entry } })}
                        >
                            <span className="shell-nav-icon"><Icon name={item.icon} /></span>
                            <span className="shell-nav-label">{t(`nav.${item.key}`, item.label)}</span>
                        </button>
                    ) : (
                        <NavLink
                            key={item.key}
                            to={item.path}
                            end={item.path === '/app'}
                            className={({ isActive }) =>
                                `shell-nav-item ${isActive ? 'shell-nav-item--active' : ''}`
                            }
                        >
                            <span className="shell-nav-icon"><Icon name={item.icon} /></span>
                            <span className="shell-nav-label">{t(`nav.${item.key}`, item.label)}</span>
                        </NavLink>
                    ))}
                    
                    <div className="shell-nav-foot">
                        <ThemeSwitcher />
                    </div>
                </nav>

                <ProfileMenu />
            </aside>

            {/* Main Content */}
            <main className="shell-main">
                <Outlet />
            </main>
        </div>
    )
}
