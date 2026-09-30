import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { forgetProvider, hasKey, keyFor, keyScope, listVoices, saveKey } from '../services/cloudVoices'
import { canSeal } from '../services/keyVault'
import VOICE_PROVIDERS from '../data/voiceProviders'
import RetroHint from '../components/RetroHint'
import Busy from '../components/Busy'
import './KeyPage.css'

const PROMISES = {
    p1: 'It is stored only in this browser, encrypted with a key that never leaves this device.',
    p2: 'Unless you tick "remember", it is kept only for this browsing session. If your browser reopens your tabs after closing, it may bring the key back too, so on a shared computer use Forget key.',
    p3: 'It travels only to the provider, over an encrypted connection, straight from your browser.',
    p4: 'This app has no server that ever receives it, and nothing is logged.',
    p5: 'You can revoke it at the provider at any time; "Forget key" removes it here.',
}

export default function KeyPage() {
    const { t } = useTranslation()
    const [provider, setProvider] = useState(VOICE_PROVIDERS[0].id)
    const [draft, setDraft] = useState('')
    const [remember, setRemember] = useState(false)
    const [model, setModel] = useState(() => { try { return localStorage.getItem('paperear_cloud_model') || 'eleven_flash_v2_5' } catch { return 'eleven_flash_v2_5' } })
    const changeModel = (m) => { setModel(m); try { localStorage.setItem('paperear_cloud_model', m) } catch { } }
    const [present, setPresent] = useState(false)
    const [scope, setScope] = useState(null)
    const [voices, setVoices] = useState([])
    const [busy, setBusy] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const chosen = VOICE_PROVIDERS.find((p) => p.id === provider)

    const refresh = () => {
        setPresent(hasKey(provider))
        setScope(keyScope(provider))
    }

    useEffect(() => {
        refresh()
        setDraft('')
        setVoices([])
        setMessage('')
        setError('')
    }, [provider])

    const explain = (e) => (/voices_read/.test(e?.message || '')
        ? t('key.needVoicesRead', 'The key is refused for listing voices. In ElevenLabs, edit this key and set Voices to Read (it is lower in the permissions list than Text to Speech), then Save and test again.')
        : e?.message)

    const save = async () => {
        const value = draft.trim()
        if (!value) return
        setBusy('save')
        setError('')
        setMessage('')
        try {
            const list = await listVoices(provider, value)
            await saveKey(provider, value, remember)
            setVoices(list)
            setDraft('')
            refresh()
            setMessage(t('key.saved', '{{count}} voices ready — pick one from the voice list in the reader.').replace('{{count}}', list.length))
        } catch (e) {
            setError(explain(e))
        } finally {
            setBusy(false)
        }
    }

    const test = async () => {
        setBusy('test')
        setError('')
        setMessage('')
        try {
            const key = await keyFor(provider)
            if (!key) throw new Error(t('key.stateNone', 'No key saved.'))
            const list = await listVoices(provider, key)
            setVoices(list)
            setMessage(t('key.saved', '{{count}} voices ready — pick one from the voice list in the reader.').replace('{{count}}', list.length))
        } catch (e) {
            setError(explain(e))
        } finally {
            setBusy(false)
        }
    }

    const forget = () => {
        forgetProvider(provider)
        setVoices([])
        setMessage(t('key.forgotten', 'The key is gone from this browser.'))
        refresh()
    }

    return (
        <div className="key-page">
            <header className="key-page__header">
                <Link to="/app/reader" className="key-page__back">‹ {t('library.backToReading', 'Back to the page')}</Link>
                <h1>{t('key.title', 'Your key')}</h1>
            </header>

            <p className="key-page__why">
                <RetroHint label={t('key.why', 'What happens to your key?')} title={t('key.whyTitle', 'your-key.txt')}>
                    <ul>
                        {Object.entries(PROMISES).map(([id, text]) => <li key={id}>{t(`key.${id}`, text)}</li>)}
                    </ul>
                </RetroHint>
            </p>

            {!canSeal() && (
                <p className="key-page__error">{t('key.noCrypto', 'This browser cannot store a key safely, so keys are disabled here.')}</p>
            )}

            <section className="key-window" aria-label={t('key.provider', 'Provider')}>
                <div className="key-page__form">
                        <label className="key-page__row">
                            <span>{t('key.provider', 'Provider')}</span>
                            <select value={provider} onChange={(e) => setProvider(e.target.value)}>
                                {VOICE_PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <a href={chosen.link} target="_blank" rel="noopener sponsored">
                                {t('key.getKey', 'Get a key at {{provider}}').replace('{{provider}}', chosen.name)} ↗
                            </a>
                        </label>

                        <p className={'key-page__state' + (present ? ' is-present' : '')}>
                            {present
                                ? scope === 'device'
                                    ? t('key.stateDevice', 'A key is stored on this device, encrypted.')
                                    : t('key.stateSession', 'A key is kept for this session only.')
                                : t('key.stateNone', 'No key saved.')}
                        </p>

                        <label className="key-page__row">
                            <span>{t('key.label', 'API key')}</span>
                            <input
                                type="password"
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                placeholder={present ? t('key.replacePlaceholder', 'Paste a new key to replace the stored one') : t('key.placeholder', 'Paste the key here')}
                                autoComplete="off"
                                spellCheck={false}
                                disabled={!canSeal()}
                            />
                        </label>

                        <label className="key-page__check">
                            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                            <span>{t('key.remember', 'Remember on this device (encrypted). Leave off on a shared computer.')}</span>
                        </label>

                        <label className="key-page__row">
                            <span>{t('key.model', 'Voice model')}</span>
                            <select value={model} onChange={(e) => changeModel(e.target.value)}>
                                <option value="eleven_flash_v2_5">{t('key.modelFast', 'Fast: starts almost at once')}</option>
                                <option value="eleven_multilingual_v2">{t('key.modelBest', 'Best: richer, slower to start')}</option>
                            </select>
                        </label>

                        <div className="key-page__actions">
                            <button type="button" className="key-page__btn key-page__btn--primary" onClick={save} disabled={busy || !draft.trim() || !canSeal()} aria-busy={busy === 'save' || undefined}>
                                {t('key.save', 'Save and test')}
                            </button>
                            {present && !draft.trim() && (
                                <button type="button" className="key-page__btn" onClick={test} disabled={busy} aria-busy={busy === 'test' || undefined}>
                                    {t('key.test', 'Test the stored key')}
                                </button>
                            )}
                            {present && (
                                <button type="button" className="key-page__btn key-page__btn--quiet" onClick={forget} disabled={busy}>
                                    {t('key.forget', 'Forget key')}
                                </button>
                            )}
                        </div>

                        {busy && <p className="key-page__message"><Busy label={busy === 'test' ? t('busy.testingKey', 'Testing the stored key…') : t('busy.checkingKey', 'Checking your key…')} showLabel /></p>}
                        {message && <p className="key-page__message">{message}</p>}
                        {error && <p className="key-page__error">{error}</p>}

                        {voices.length > 0 && (
                            <ul className="key-page__voices">
                                {voices.slice(0, 12).map((v) => <li key={v.id}>{v.label}{v.lang ? ` · ${v.lang}` : ''}</li>)}
                                {voices.length > 12 && <li>…</li>}
                            </ul>
                        )}
                </div>
            </section>
        </div>
    )
}
