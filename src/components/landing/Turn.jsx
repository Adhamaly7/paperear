import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Icon from '../icons'
import Playground from './Playground'

const ANSWERS = [
    { key: 'tap', icon: 'pointer' },
    { key: 'keys', icon: 'keyboard' },
    { key: 'follow', icon: 'follow' },
    { key: 'back', icon: 'back' },
    { key: 'pace', icon: 'speed' },
    { key: 'voices', icon: 'voices' },
    { key: 'report', icon: 'flag' },
    { key: 'resume', icon: 'resume' },
]

export default function Turn() {
    const { t } = useTranslation()
    return (
        <section className="landing-turn">
            <div className="landing-band-inner">
                <div className="landing-label">{t('landing.turn.label')}</div>
                <h2 className="landing-turn__title">{t('landing.turn.title')}</h2>
                <p className="landing-band-sub">{t('landing.turn.sub')}</p>
                <Playground />
                <div className="landing-answers">
                    <h3>{t('landing.turn.answersTitle')}</h3>
                    <div className="landing-answers__grid">
                        {ANSWERS.map((a) => (
                            <div className="landing-answer" key={a.key}>
                                <span className="landing-answer__icon"><Icon name={a.icon} size={18} /></span>
                                <h4>{t(`landing.turn.answers.${a.key}.title`)}</h4>
                                <p>{t(`landing.turn.answers.${a.key}.line`)}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="landing-turn__cta">
                    <h3>{t('landing.turn.ctaTitle')}</h3>
                    <Link to="/app" className="landing-cta-primary">{t('landing.start')}</Link>
                    <p className="landing-cta-note">{t('landing.freeNote')}</p>
                </div>
            </div>
        </section>
    )
}
