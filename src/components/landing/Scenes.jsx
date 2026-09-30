import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { sceneAt, stillFrame, wordsCovered } from '../../utils/sceneClock'
import './Scenes.css'

const TICK_MS = 50

function reducedMotion() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false }
}

function useSceneClock(ref, stillMs) {
    const [ms, setMs] = useState(() => (reducedMotion() ? stillMs : 0))
    useEffect(() => {
        const node = ref.current
        if (reducedMotion() || !node || typeof IntersectionObserver === 'undefined') return undefined
        let timer = null
        let base = 0
        let last = 0
        const stop = () => { clearInterval(timer); timer = null }
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !timer) {
                base = performance.now() - last
                timer = setInterval(() => { last = performance.now() - base; setMs(last) }, TICK_MS)
            } else if (!entry.isIntersecting) stop()
        }, { threshold: 0.35 })
        observer.observe(node)
        return () => { observer.disconnect(); stop() }
    }, [])
    return ms
}

const splitWords = (text) => (text || '').split(/\s+/).filter(Boolean)

function Words({ words, lit, offset = 0, targetIndex = -1, targetRef, className, skipped = [0, 0] }) {
    return words.map((w, i) => {
        const index = offset + i
        const read = index < lit && !(index >= skipped[0] && index < skipped[1])
        const cls = [index === lit ? 'is-lit' : read ? 'is-read' : '', className].filter(Boolean).join(' ')
        return (
            <span key={index} ref={index === targetIndex ? targetRef : undefined} className={cls || undefined}>
                {w}{' '}
            </span>
        )
    })
}

function Frame({ rootRef, caption, progress, children, stageRef, stageClass = '' }) {
    return (
        <div className="scene" ref={rootRef} aria-hidden="true">
            <div className={'scene__stage ' + stageClass} ref={stageRef}>{children}</div>
            <div className="scene__foot">
                <span className="scene__caption" key={caption}>{caption}</span>
            </div>
            <div className="scene__track"><span style={{ transform: `scaleX(${progress})` }} /></div>
        </div>
    )
}

const Pointer = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 3l14 7.5-6.2 1.6L10 18.5z" fill="var(--text-primary)" stroke="var(--bg-card, #fff)" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
)

const ANYWHERE_BEATS = [2200, 1100, 250, 2800, 1600]

function AnywhereScene() {
    const { t } = useTranslation()
    const rootRef = useRef(null)
    const stageRef = useRef(null)
    const targetRef = useRef(null)
    const words = useMemo(() => splitWords(t('landing.scenes.anywhere.text')), [t])
    const target = Math.round(words.length * 0.5)
    const ms = useSceneClock(rootRef, stillFrame(ANYWHERE_BEATS, 3))
    const { beat, t: tt, progress } = sceneAt(ms, ANYWHERE_BEATS)
    const [spot, setSpot] = useState({ x: 0, y: 0, restX: 0, restY: 0 })

    useLayoutEffect(() => {
        const measure = () => {
            const stage = stageRef.current
            const word = targetRef.current
            if (!stage || !word) return
            const s = stage.getBoundingClientRect()
            const w = word.getBoundingClientRect()
            setSpot({ x: w.left - s.left + w.width / 2, y: w.top - s.top + w.height / 2, restX: s.width * 0.82, restY: s.height * 0.86 })
        }
        measure()
        if (typeof ResizeObserver === 'undefined') return undefined
        const observer = new ResizeObserver(measure)
        observer.observe(stageRef.current)
        return () => observer.disconnect()
    }, [words.length])

    const readTo = Math.max(0, target - 4)
    const lastRead = Math.min(Math.floor(ANYWHERE_BEATS[0] / 280), readTo)
    const carried = target + Math.floor(ANYWHERE_BEATS[3] / 300)
    const lit = beat === 0 ? Math.min(Math.floor(tt / 280), readTo)
        : beat < 3 ? lastRead
        : beat === 3 ? target + Math.floor(tt / 300)
        : carried - Math.min(2, Math.floor(tt / 480))
    const atWord = beat >= 1
    const captions = ['c1', 'c2', 'c2', 'c3', 'c4']
    const keyDown = beat === 4 && Math.floor(tt / 480) < 2 && tt % 480 < 160

    return (
        <Frame rootRef={rootRef} stageRef={stageRef} caption={t(`landing.scenes.anywhere.${captions[beat]}`)} progress={progress}>
            <p className="scene__text"><Words words={words} lit={lit} targetIndex={target} targetRef={targetRef} skipped={beat >= 3 ? [lastRead + 1, target] : [0, 0]} /></p>
            {(beat === 2 || (beat === 3 && tt < 450)) && <span className="scene__ripple" style={{ left: spot.x, top: spot.y }} />}
            {beat >= 3 && (
                <span className="scene__wordbar" style={{ left: spot.x, top: spot.y - 13 }}>
                    <span>◀</span><span className="scene__wordbar-play">❚❚</span><span>▶</span><span className="scene__wordbar-flag">⚑</span>
                </span>
            )}
            <span className="scene__pointer" style={{ left: atWord ? spot.x : spot.restX, top: atWord ? spot.y + 4 : spot.restY }}><Pointer /></span>
            {beat === 4 && <span className={'scene__key' + (keyDown ? ' is-down' : '')}>←</span>}
        </Frame>
    )
}

const KEYS_BEATS = [450, 2100, 1500, 2200, 450, 1500]

function KeysScene() {
    const { t } = useTranslation()
    const rootRef = useRef(null)
    const words = useMemo(() => splitWords(t('landing.scenes.keys.text')), [t])
    const ms = useSceneClock(rootRef, stillFrame(KEYS_BEATS, 3))
    const { beat, t: tt, progress } = sceneAt(ms, KEYS_BEATS)
    const afterRead = Math.floor(KEYS_BEATS[1] / 300)
    const afterSteps = afterRead + 3
    const raw = beat === 0 ? 0
        : beat === 1 ? Math.floor(tt / 300)
        : beat === 2 ? afterRead + Math.min(3, Math.floor(tt / 450) + 1)
        : beat === 3 ? afterSteps + Math.floor(tt / 170)
        : afterSteps + Math.floor(KEYS_BEATS[3] / 170)
    const lit = Math.min(raw, words.length - 1)
    const key = (beat === 0 || beat === 4) && tt < 260 ? 'space'
        : beat === 2 && Math.floor(tt / 450) < 3 && tt % 450 < 170 ? 'right'
        : beat === 3 && tt < 260 ? 'up'
        : ''
    const captions = ['c1', 'c1', 'c2', 'c3', 'c4', 'c4']
    const kbd = (name, label, wide) => <span className={'scene__kbd' + (wide ? ' scene__kbd--wide' : '') + (key === name ? ' is-down' : '')}>{label}</span>

    return (
        <Frame rootRef={rootRef} caption={t(`landing.scenes.keys.${captions[beat]}`)} progress={progress}>
            <p className="scene__text"><Words words={words} lit={lit} /></p>
            <div className="scene__keyrow">
                {kbd('space', t('landing.turn.spaceKey'), true)}
                {kbd('left', '←')}
                {kbd('right', '→')}
                {kbd('up', '↑')}
                {kbd('down', '↓')}
                <span className="scene__state">{beat >= 4 ? t('landing.turn.paused') : t('landing.turn.reading')} · {beat >= 3 ? '1.75×' : '1×'}</span>
            </div>
        </Frame>
    )
}

const PACE_BEATS = [2400, 2400, 2600]
const PACE_RATES = [1, 2, 0.75]
const PACE_CHIPS = [0.75, 1, 1.5, 2]

function PaceScene() {
    const { t } = useTranslation()
    const rootRef = useRef(null)
    const words = useMemo(() => splitWords(t('landing.scenes.pace.text')), [t])
    const ms = useSceneClock(rootRef, stillFrame(PACE_BEATS, 1))
    const { beat, t: tt, progress } = sceneAt(ms, PACE_BEATS)
    const steps = PACE_RATES.map((rate) => 340 / rate)
    const lit = words.length ? wordsCovered(beat, tt, PACE_BEATS, steps) % words.length : -1
    const rate = PACE_RATES[beat]

    return (
        <Frame rootRef={rootRef} caption={t(`landing.scenes.pace.c${beat + 1}`)} progress={progress}>
            <p className="scene__text"><Words words={words} lit={lit} /></p>
            <div className="scene__chips">
                {PACE_CHIPS.map((c) => (
                    <span key={c} className={'scene__chip' + (c === rate ? ' is-active' : '') + (c === rate && tt < 260 ? ' is-pressed' : '')}>{c}×</span>
                ))}
            </div>
        </Frame>
    )
}

function LayoutScene() {
    const { t } = useTranslation()
    const rootRef = useRef(null)
    const heading = useMemo(() => splitWords(t('landing.scenes.layout.heading')), [t])
    const col1 = useMemo(() => splitWords(t('landing.scenes.layout.col1')), [t])
    const col2 = useMemo(() => splitWords(t('landing.scenes.layout.col2')), [t])
    const total = heading.length + col1.length + col2.length
    const beats = [Math.max(1, total) * 300, 1400]
    const ms = useSceneClock(rootRef, stillFrame(beats, 0, 0.55))
    const { beat, t: tt, progress } = sceneAt(ms, beats)
    const lit = beat === 0 ? Math.floor(tt / 300) : total
    const part = lit < heading.length ? 'c1' : lit < heading.length + col1.length ? 'c2' : 'c3'

    return (
        <Frame rootRef={rootRef} caption={t(`landing.scenes.layout.${part}`)} progress={progress} stageClass="scene__stage--sheet">
            <div className="scene-layout">
                <p className="scene-layout__heading"><Words words={heading} lit={lit} /></p>
                <div className="scene-layout__cols">
                    <p className="scene__text scene__text--small"><Words words={col1} lit={lit} offset={heading.length} /></p>
                    <div>
                        <div className="scene-layout__figure" />
                        <p className="scene__text scene__text--small"><Words words={col2} lit={lit} offset={heading.length + col1.length} /></p>
                    </div>
                </div>
            </div>
        </Frame>
    )
}

function ScanScene() {
    const { t } = useTranslation()
    const rootRef = useRef(null)
    const words = useMemo(() => splitWords(t('landing.scenes.scan.text')), [t])
    const beats = [1700, 900, Math.max(1, words.length) * 300, 1000]
    const ms = useSceneClock(rootRef, stillFrame(beats, 2))
    const { beat, t: tt, progress } = sceneAt(ms, beats)
    const found = beat >= 1
    const lit = beat === 2 ? Math.floor(tt / 300) : beat === 3 ? words.length : -1
    const captions = ['c1', 'c2', 'c3', 'c3']

    return (
        <Frame rootRef={rootRef} caption={t(`landing.scenes.scan.${captions[beat]}`)} progress={progress} stageClass={'scene__stage--photo' + (found ? ' is-found' : '')}>
            <p className="scene__text"><Words words={words} lit={lit} className={found ? 'is-found' : 'is-ink'} /></p>
            {beat === 0 && <span className="scene__scanline" style={{ top: `${(tt / beats[0]) * 100}%` }} />}
        </Frame>
    )
}

function WriteScene() {
    const { t } = useTranslation()
    const rootRef = useRef(null)
    const text = t('landing.scenes.write.text')
    const words = useMemo(() => splitWords(text), [text])
    const beats = [Math.max(1, text.length) * 45, 800, Math.max(1, words.length) * 300, 900]
    const ms = useSceneClock(rootRef, stillFrame(beats, 2))
    const { beat, t: tt, progress } = sceneAt(ms, beats)
    const typed = beat === 0 ? text.slice(0, Math.floor(tt / 45)) : text
    const lit = beat === 2 ? Math.floor(tt / 300) : beat === 3 ? words.length : -1
    const captions = ['c1', 'c2', 'c3', 'c3']

    return (
        <Frame rootRef={rootRef} caption={t(`landing.scenes.write.${captions[beat]}`)} progress={progress} stageClass="scene__stage--sheet">
            <p className="scene__text">
                {beat === 0 ? <>{typed}<span className="scene__caret" /></> : <Words words={words} lit={lit} />}
            </p>
            <div className="scene__dock">
                <span className={'scene__play' + (beat === 1 ? ' is-pressed' : '') + (beat >= 1 ? ' is-on' : '')}>{beat >= 2 ? '❚❚' : '▶'}</span>
            </div>
        </Frame>
    )
}

const SCENES = [
    { key: 'anywhere', Scene: AnywhereScene },
    { key: 'keys', Scene: KeysScene },
    { key: 'pace', Scene: PaceScene },
    { key: 'layout', Scene: LayoutScene },
    { key: 'scan', Scene: ScanScene },
    { key: 'write', Scene: WriteScene },
]

export default function Scenes() {
    const { t } = useTranslation()
    return (
        <section className="landing-scenes">
            <div className="landing-band-inner">
                <div className="landing-label">{t('landing.scenesLabel')}</div>
                <h2 className="landing-h2">{t('landing.scenesTitle')}</h2>
                <p className="landing-band-sub">{t('landing.scenesSub')}</p>
                <div className="landing-scenes__list">
                    {SCENES.map(({ key, Scene }) => (
                        <div className="landing-scene" key={key}>
                            <div className="landing-scene__copy">
                                <h3>{t(`landing.scenes.${key}.title`)}</h3>
                                <p>{t(`landing.scenes.${key}.line`)}</p>
                            </div>
                            <Scene />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
