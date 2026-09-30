import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Busy from '../Busy'
import './DocumentPanel.css'

const THUMB_WIDTH = 132

function Thumb({ pdf, pageNum, current, onPick }) {
    const ref = useRef(null)
    const canvasRef = useRef(null)
    const [ready, setReady] = useState(false)

    useEffect(() => {
        const el = ref.current
        if (!el || !pdf) return undefined
        let dead = false
        const observer = new IntersectionObserver((entries) => {
            if (!entries.some((e) => e.isIntersecting)) return
            observer.disconnect()
            pdf.getPage(pageNum).then(async (page) => {
                if (dead || !canvasRef.current) return
                const base = page.getViewport({ scale: 1 })
                const viewport = page.getViewport({ scale: THUMB_WIDTH / base.width })
                const canvas = canvasRef.current
                canvas.width = viewport.width
                canvas.height = viewport.height
                await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise.catch(() => {})
                if (!dead) setReady(true)
            })
        }, { rootMargin: '300px' })
        observer.observe(el)
        return () => {
            dead = true
            observer.disconnect()
        }
    }, [pdf, pageNum])

    return (
        <button ref={ref} type="button" className={'doc-panel__thumb' + (current ? ' is-current' : '')} onClick={() => onPick(pageNum)}>
            <canvas ref={canvasRef} className={ready ? '' : 'is-blank'} />
            <span>{pageNum}</span>
        </button>
    )
}

async function flattenOutline(pdf, items, depth, out) {
    for (const item of items || []) {
        let pageNum = null
        try {
            const dest = typeof item.dest === 'string' ? await pdf.getDestination(item.dest) : item.dest
            if (Array.isArray(dest) && dest[0]) pageNum = (await pdf.getPageIndex(dest[0])) + 1
        } catch { }
        out.push({ title: item.title, pageNum, depth })
        if (item.items?.length) await flattenOutline(pdf, item.items, depth + 1, out)
    }
    return out
}

export default function DocumentPanel({ pdf, totalPages, currentPage, bookmarkedPage, onToggleBookmark, onGoToPage, open, onClose }) {
    const { t } = useTranslation()
    const [tab, setTab] = useState('pages')
    const [outline, setOutline] = useState(null)

    useEffect(() => {
        if (!pdf || !open || outline !== null) return undefined
        let dead = false
        pdf.getOutline()
            .then((items) => flattenOutline(pdf, items, 0, []))
            .then((rows) => { if (!dead) setOutline(rows) })
            .catch(() => { if (!dead) setOutline([]) })
        return () => { dead = true }
    }, [pdf, open, outline])

    useEffect(() => { setOutline(null) }, [pdf])

    if (!open || !pdf) return null

    const tabs = [
        ['pages', t('panel.pages', 'Pages')],
        ['contents', t('panel.contents', 'Contents')],
        ['bookmarks', t('panel.bookmarks', 'Bookmarks')],
    ]

    return (
        <aside className="doc-panel" aria-label={t('panel.title', 'Document')}>
            <header className="doc-panel__tabs">
                {tabs.map(([id, label]) => (
                    <button key={id} type="button" className={'doc-panel__tab' + (tab === id ? ' is-active' : '')} onClick={() => setTab(id)}>{label}</button>
                ))}
                <button type="button" className="doc-panel__close" onClick={onClose} aria-label={t('voices.close', 'Close')}>✕</button>
            </header>
            <div className="doc-panel__body">
                {tab === 'pages' && (
                    <div className="doc-panel__grid">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                            <Thumb key={n} pdf={pdf} pageNum={n} current={n === currentPage} onPick={onGoToPage} />
                        ))}
                    </div>
                )}
                {tab === 'contents' && (
                    outline === null ? <p className="doc-panel__note"><Busy label={t('busy.contents', 'Loading the contents…')} showLabel /></p>
                    : outline.length === 0 ? <p className="doc-panel__note">{t('panel.noContents', 'This file carries no table of contents.')}</p>
                    : (
                        <ul className="doc-panel__outline">
                            {outline.map((row, i) => (
                                <li key={i} style={{ paddingInlineStart: `${row.depth * 0.9}rem` }}>
                                    <button type="button" disabled={!row.pageNum} onClick={() => row.pageNum && onGoToPage(row.pageNum)}>
                                        <span className="doc-panel__outline-title">{row.title}</span>
                                        {row.pageNum && <span className="doc-panel__outline-page">{row.pageNum}</span>}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )
                )}
                {tab === 'bookmarks' && (
                    <div className="doc-panel__bookmarks">
                        {bookmarkedPage ? (
                            <button type="button" className="doc-panel__bookmark" onClick={() => onGoToPage(bookmarkedPage)}>
                                ★ {t('panel.bookmarkedPage', 'Page {{page}}').replace('{{page}}', bookmarkedPage)}
                            </button>
                        ) : (
                            <p className="doc-panel__note">{t('panel.noBookmark', 'No bookmark yet.')}</p>
                        )}
                        {onToggleBookmark && currentPage && (
                            <button type="button" className="doc-panel__bookmark doc-panel__bookmark--set" onClick={() => onToggleBookmark(currentPage)}>
                                {bookmarkedPage === currentPage
                                    ? t('panel.removeBookmark', 'Remove the bookmark from page {{page}}').replace('{{page}}', currentPage)
                                    : t('panel.setBookmark', 'Bookmark page {{page}}').replace('{{page}}', currentPage)}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </aside>
    )
}
