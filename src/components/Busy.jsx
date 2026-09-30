import { useEffect, useState } from 'react'
import './Busy.css'

export function useDelayed(active, delay = 400) {
    const [shown, setShown] = useState(false)
    useEffect(() => {
        if (!active) {
            setShown(false)
            return undefined
        }
        const timer = setTimeout(() => setShown(true), Math.max(0, delay))
        return () => clearTimeout(timer)
    }, [active, delay])
    return active && shown
}

export function BusyDots() {
    return (
        <span className="busy__dots" aria-hidden="true">
            <i />
            <i />
            <i />
        </span>
    )
}

export default function Busy({ active = true, label = '', showLabel = false, announce = true, delay = 400, className = '' }) {
    const shown = useDelayed(active, delay)
    if (!active) return null
    const classes = ['busy', shown && 'is-shown', className].filter(Boolean).join(' ')
    return (
        <span className={classes} role={announce ? 'status' : undefined}>
            <BusyDots />
            {showLabel && label && <span className="busy__label" dir="auto" aria-hidden={announce || undefined}>{label}</span>}
            {announce && label && <span className="busy__sr">{shown ? label : ''}</span>}
        </span>
    )
}
