import { useId, useState } from 'react'
import './RetroHint.css'

export default function RetroHint({ label, title, children }) {
    const [open, setOpen] = useState(false)
    const id = useId()
    return (
        <span className="retro-hint" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
            <button
                type="button"
                className="retro-hint__link"
                aria-expanded={open}
                aria-describedby={open ? id : undefined}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
                onClick={() => setOpen((o) => !o)}
                onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}
            >
                {label}
            </button>
            {open && (
                <span className="retro-window" role="tooltip" id={id}>
                    <span className="retro-window__bar">
                        <span className="retro-window__title">{title}</span>
                        <span className="retro-window__btns" aria-hidden="true"><i /><i /><i /></span>
                    </span>
                    <span className="retro-window__body">{children}</span>
                </span>
            )}
        </span>
    )
}
