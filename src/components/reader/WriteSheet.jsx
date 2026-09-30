import React, { useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import './WriteSheet.css'

const LIMIT = 30000

export default function WriteSheet({ text = '', richHtml = '', onTextChange, onRichHtmlChange, onRead, notification }) {
    const { t } = useTranslation()
    const editorRef = useRef(null)
    const lastSyncedRef = useRef(text)

    useEffect(() => {
        const el = editorRef.current
        if (!el || el.innerText.trim()) return
        if (richHtml) el.innerHTML = richHtml
        else if (text) el.innerText = text
        lastSyncedRef.current = el.innerText
        el.focus()
    }, [])

    useEffect(() => {
        const el = editorRef.current
        if (!el || text === lastSyncedRef.current) return
        el.innerText = text
        lastSyncedRef.current = text
        onRichHtmlChange?.(el.innerHTML)
    }, [text])

    const emit = useCallback(() => {
        const el = editorRef.current
        if (!el) return
        const next = el.innerText || ''
        lastSyncedRef.current = next
        onTextChange(next)
        onRichHtmlChange?.(el.innerHTML || '')
    }, [onTextChange, onRichHtmlChange])

    const exec = useCallback((command, value = null) => {
        document.execCommand(command, false, value)
        editorRef.current?.focus()
        setTimeout(emit, 0)
    }, [emit])

    const hasText = text.trim().length > 0

    return (
        <div className="write-sheet">
            <div className="write-sheet__bar">
                <select
                    className="write-sheet__select"
                    defaultValue=""
                    onChange={(e) => { if (e.target.value) exec('formatBlock', e.target.value); e.target.value = '' }}
                    title={t('reader.toolbarHeading', 'Apply heading style')}
                >
                    <option value="" disabled>{t('reader.heading', 'Heading')}</option>
                    <option value="p">{t('reader.normal', 'Normal')}</option>
                    <option value="h1">H1</option>
                    <option value="h2">H2</option>
                    <option value="h3">H3</option>
                </select>
                <div className="write-sheet__group">
                    <button className="write-sheet__btn" onClick={() => exec('bold')} title={t('reader.bold', 'Bold')}><strong>B</strong></button>
                    <button className="write-sheet__btn" onClick={() => exec('italic')} title={t('reader.italic', 'Italic')}><em>I</em></button>
                    <button className="write-sheet__btn" onClick={() => exec('underline')} title={t('reader.underline', 'Underline')}><u>U</u></button>
                    <button className="write-sheet__btn" onClick={() => exec('strikeThrough')} title={t('reader.strikethrough', 'Strikethrough')}><s>S</s></button>
                </div>
                <div className="write-sheet__group">
                    <button className="write-sheet__btn" onClick={() => exec('insertUnorderedList')} title={t('reader.bulletList', 'Bullet list')}>•≡</button>
                    <button className="write-sheet__btn" onClick={() => exec('insertOrderedList')} title={t('reader.numberList', 'Numbered list')}>1.</button>
                </div>
                <div className="write-sheet__group">
                    <button className="write-sheet__btn" onClick={() => exec('undo')} title={t('reader.undo', 'Undo')}>↩</button>
                    <button className="write-sheet__btn" onClick={() => exec('redo')} title={t('reader.redo', 'Redo')}>↪</button>
                </div>
                <span className={'write-sheet__count' + (text.length > LIMIT - 2000 ? ' write-sheet__count--warn' : '')}>
                    {text.length.toLocaleString()} / {LIMIT.toLocaleString()}
                </span>
                {hasText && onRead && (
                    <button className="write-sheet__read" onClick={onRead}>▶ {t('reader.readThis', 'Read this')}</button>
                )}
            </div>
            <div
                ref={editorRef}
                className="write-sheet__page"
                contentEditable
                suppressContentEditableWarning
                dir="auto"
                data-placeholder={t('reader.pasteHere', 'Paste any text here — articles, documents, study notes...')}
                onInput={emit}
            />
            {notification && <div className="write-sheet__note">{notification}</div>}
        </div>
    )
}
