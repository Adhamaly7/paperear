import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { clampRate, paragraphJump, spokenFrom, wordAtChar, wordsOf } from '../../utils/playground'
import { usableSystemVoices } from '../../utils/voicePreference'
import { BusyDots, useDelayed } from '../Busy'
import './Playground.css'

const WORDS_PER_MINUTE = 165

function pickVoice(lang) {
    try {
        const voices = usableSystemVoices(window.speechSynthesis.getVoices())
        const matching = voices.filter((v) => (v.lang || '').toLowerCase().startsWith(lang))
        return matching.find((v) => v.localService) || matching[0] || null
    } catch { return null }
}

const isTyping = (target) => {
    const tag = target?.tagName
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable
}

export default function Playground() {
    const { t, i18n } = useTranslation()
    const lang = String(i18n.language || 'en').startsWith('ar') ? 'ar' : 'en'
    const paragraphs = useMemo(() => [t('landing.turn.p1'), t('landing.turn.p2')], [t])
    const words = useMemo(() => wordsOf(paragraphs), [paragraphs])
    const rootRef = useRef(null)
    const [index, setIndex] = useState(-1)
    const [playing, setPlaying] = useState(false)
    const [rate, setRate] = useState(1)
    const [pressed, setPressed] = useState('')
    const [noVoice, setNoVoice] = useState(false)
    const [starting, setStarting] = useState(false)
    const state = useRef({ index: -1, playing: false, rate: 1, token: 0, timer: null })
    const speechOk = typeof window !== 'undefined' && 'speechSynthesis' in window

    const setAt = (i) => { state.current.index = i; setIndex(i) }
    const setPlay = (on) => { state.current.playing = on; setPlaying(on) }

    const halt = useCallback(() => {
        state.current.token++
        clearInterval(state.current.timer)
        state.current.timer = null
        setStarting(false)
        try { window.speechSynthesis.cancel() } catch { }
    }, [])

    const speakFrom = useCallback((from) => {
        halt()
        if (from >= words.length) { setPlay(false); return }
        const start = Math.max(0, from)
        const token = state.current.token
        const speed = state.current.rate
        setAt(start)
        setPlay(true)
        setStarting(speechOk)
        const { text, offsets } = spokenFrom(words, start)
        let heard = false
        const perWord = 60000 / (WORDS_PER_MINUTE * speed)
        state.current.timer = setInterval(() => {
            if (heard || token !== state.current.token) return
            const next = state.current.index + 1
            if (next >= words.length) { clearInterval(state.current.timer); if (!speechOk || noVoice) setPlay(false); return }
            setAt(next)
        }, perWord)
        if (!speechOk) return
        const voice = pickVoice(lang)
        setNoVoice(!voice && window.speechSynthesis.getVoices().length > 0)
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = lang === 'ar' ? 'ar' : 'en-US'
        if (voice) utterance.voice = voice
        utterance.rate = speed
        utterance.onboundary = (e) => {
            if (token !== state.current.token || (e.name && e.name !== 'word')) return
            heard = true
            setStarting(false)
            setAt(start + wordAtChar(offsets, e.charIndex))
        }
        utterance.onend = () => {
            if (token !== state.current.token) return
            setStarting(false)
            clearInterval(state.current.timer)
            setAt(words.length - 1)
            setPlay(false)
        }
        utterance.onstart = () => { if (token === state.current.token) setStarting(false) }
        utterance.onerror = () => { if (token === state.current.token) setStarting(false) }
        window.speechSynthesis.speak(utterance)
    }, [words, lang, halt, speechOk, noVoice])

    const toggle = useCallback(() => {
        if (state.current.playing) { halt(); setPlay(false); return }
        const at = state.current.index
        speakFrom(at < 0 || at >= words.length - 1 ? 0 : at)
    }, [halt, speakFrom, words.length])

    const moveTo = useCallback((i) => {
        const next = Math.max(0, Math.min(words.length - 1, i))
        if (state.current.playing) speakFrom(next)
        else setAt(next)
    }, [speakFrom, words.length])

    const pace = useCallback((delta) => {
        const next = clampRate(state.current.rate + delta)
        state.current.rate = next
        setRate(next)
        if (state.current.playing) speakFrom(Math.max(0, state.current.index))
    }, [speakFrom])

    const inView = useCallback(() => {
        const node = rootRef.current
        if (!node) return false
        const r = node.getBoundingClientRect()
        return r.top < window.innerHeight * 0.7 && r.bottom > window.innerHeight * 0.3
    }, [])

    useEffect(() => {
        const check = () => { if (state.current.playing && !inView()) { halt(); setPlay(false) } }
        window.addEventListener('scroll', check, { passive: true })
        window.addEventListener('resize', check)
        return () => { window.removeEventListener('scroll', check); window.removeEventListener('resize', check) }
    }, [halt, inView])

    useEffect(() => {
        const onKey = (e) => {
            const inside = rootRef.current?.contains(document.activeElement)
            if (!inside && !inView()) return
            if (isTyping(e.target) || e.altKey || e.metaKey) return
            if (e.target?.tagName === 'BUTTON' && !inside) return
            const at = Math.max(0, state.current.index)
            let key = ''
            if (e.code === 'Space') { if (e.repeat) return; key = 'space'; toggle() }
            else if (e.code === 'ArrowRight') { key = e.ctrlKey ? 'ctrl-right' : 'right'; moveTo(e.ctrlKey ? paragraphJump(words, at, 1) : at + 1) }
            else if (e.code === 'ArrowLeft') { key = e.ctrlKey ? 'ctrl-left' : 'left'; moveTo(e.ctrlKey ? paragraphJump(words, at, -1) : at - 1) }
            else if (e.code === 'ArrowUp') { key = 'up'; pace(0.25) }
            else if (e.code === 'ArrowDown') { key = 'down'; pace(-0.25) }
            else return
            e.preventDefault()
            setPressed(key)
            clearTimeout(state.current.flash)
            state.current.flash = setTimeout(() => setPressed(''), 220)
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [toggle, moveTo, pace, words, inView])

    useEffect(() => () => halt(), [halt])
    useEffect(() => { halt(); setPlay(false); setAt(-1) }, [lang, halt])

    const down = (...keys) => (keys.includes(pressed) ? ' is-down' : '')
    const waiting = useDelayed(starting && playing)
    const status = waiting ? t('busy.voice', 'Preparing the voice…') : playing ? t('landing.turn.reading') : index >= 0 ? t('landing.turn.paused') : t('landing.turn.idle')
    let offset = 0

    return (
        <div className="playground" ref={rootRef} tabIndex={-1} role="group" aria-label={t('landing.turn.title')}>
            <div className="playground__page">
                {paragraphs.map((p, pi) => {
                    const count = words.filter((w) => w.para === pi).length
                    const base = offset
                    offset += count
                    return (
                        <p key={pi} className="playground__text">
                            {words.slice(base, base + count).map((w, k) => {
                                const i = base + k
                                return (
                                    <span
                                        key={i}
                                        className={i === index ? 'is-lit' : i < index ? 'is-read' : undefined}
                                        onClick={() => { rootRef.current?.focus({ preventScroll: true }); speakFrom(i) }}
                                    >
                                        {w.text}{' '}
                                    </span>
                                )
                            })}
                        </p>
                    )
                })}
                <div className="playground__bar">
                    <button type="button" className={'playground__play' + (playing ? ' is-on' : '')} onClick={toggle} aria-busy={waiting || undefined} aria-label={status}>
                        {waiting ? <BusyDots /> : playing ? '❚❚' : '▶'}
                    </button>
                    <span className="playground__status">{status}</span>
                    <span className="playground__rate">{rate}×</span>
                </div>
                {noVoice && <p className="playground__note">{t('landing.turn.noVoice')}</p>}
            </div>
            <div className="playground__keys" aria-hidden="true">
                <div className="playground__key-row">
                    <kbd className={'playground__key playground__key--wide' + down('space')}>{t('landing.turn.spaceKey')}</kbd>
                    <span>{t('landing.turn.keySpace')}</span>
                </div>
                <div className="playground__key-row">
                    <kbd className={'playground__key' + down('left')}>←</kbd>
                    <kbd className={'playground__key' + down('right')}>→</kbd>
                    <span>{t('landing.turn.keyStep')}</span>
                </div>
                <div className="playground__key-row">
                    <kbd className={'playground__key' + down('ctrl-left', 'ctrl-right')}>Ctrl</kbd>
                    <kbd className={'playground__key' + down('ctrl-left')}>←</kbd>
                    <kbd className={'playground__key' + down('ctrl-right')}>→</kbd>
                    <span>{t('landing.turn.keyPara')}</span>
                </div>
                <div className="playground__key-row">
                    <kbd className={'playground__key' + down('up')}>↑</kbd>
                    <kbd className={'playground__key' + down('down')}>↓</kbd>
                    <span>{t('landing.turn.keyPace')}</span>
                </div>
                <div className="playground__key-row">
                    <span className="playground__tap" />
                    <span>{t('landing.turn.keyTap')}</span>
                </div>
            </div>
        </div>
    )
}
