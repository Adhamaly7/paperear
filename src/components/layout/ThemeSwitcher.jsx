import { useTheme } from '../../contexts/ThemeContext'
import { useTranslation } from 'react-i18next'
import Icon from '../icons'
import './ThemeSwitcher.css'

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()

  const themes = [
    { id: 'midnight', label: t('nav.themeMidnight', 'Midnight'), icon: 'moon' },
    { id: 'paper', label: t('nav.themePaper', 'Paper'), icon: 'sun' },
    { id: 'dusk', label: t('nav.themeDusk', 'Dusk'), icon: 'dusk' },
  ]

  return (
    <div className="theme-switcher">
      {themes.map((item) => (
        <button
          key={item.id}
          className={`theme-btn ${theme === item.id ? 'active' : ''}`}
          onClick={() => setTheme(item.id)}
          title={item.label}
          aria-label={item.label}
        >
          <Icon name={item.icon} />
        </button>
      ))}
    </div>
  )
}
