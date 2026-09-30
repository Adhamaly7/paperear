import { useEffect, useRef, useState } from 'react'

const SETTLE_MS = 1400

export default function RangeBox({ value, min, max, title, onCommit }) {
    const [draft, setDraft] = useState(null)
    const timer = useRef(0)
    useEffect(() => () => clearTimeout(timer.current), [])
    const commit = (raw) => {
        clearTimeout(timer.current)
        setDraft(null)
        const n = parseInt(raw, 10)
        if (!Number.isFinite(n)) return
        const clamped = Math.min(max, Math.max(min, n))
        if (clamped !== value) onCommit(clamped)
    }
    return (
        <input
            className="reader-rangebar-box"
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            value={draft ?? value}
            title={title}
            aria-label={title}
            onFocus={(e) => e.currentTarget.select()}
            onChange={(e) => {
                const raw = e.currentTarget.value
                setDraft(raw)
                clearTimeout(timer.current)
                if (/^\d+$/.test(raw)) timer.current = setTimeout(() => commit(raw), SETTLE_MS)
            }}
            onBlur={(e) => { if (draft !== null) commit(e.currentTarget.value) }}
            onKeyDown={(e) => {
                e.stopPropagation()
                if (e.key === 'Enter') {
                    commit(e.currentTarget.value)
                    e.currentTarget.blur()
                }
                if (e.key === 'Escape') {
                    clearTimeout(timer.current)
                    setDraft(null)
                    e.currentTarget.blur()
                }
            }}
        />
    )
}
