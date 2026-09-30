import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Icon from '../icons'
import './OpenSheet.css'

const ACCEPT = '.txt,.pdf,.md,.markdown,.epub,.docx'

export default function OpenSheet({ onFileUpload, onWriteInstead }) {
    const { t } = useTranslation()
    const inputRef = useRef(null)
    const [over, setOver] = useState(false)

    const take = (file) => { if (file) onFileUpload(file) }

    return (
        <div className="open-sheet">
            <div className="open-sheet__icon"><Icon name="open" size={28} /></div>
            <h2 className="open-sheet__title">{t('reader.sidebarWelcome', 'Start here')}</h2>
            <p className="open-sheet__sub">{t('reader.sidebarWelcomeReadDesc', 'Bring anything and hear it as it is, word by word.')}</p>
            <div
                className={'open-sheet__drop' + (over ? ' is-over' : '')}
                onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files?.[0]) }}
                onDragOver={(e) => { e.preventDefault(); setOver(true) }}
                onDragLeave={() => setOver(false)}
                onClick={() => inputRef.current?.click()}
            >
                <Icon name="reader" size={30} />
                <div className="open-sheet__drop-text">{t('reader.dropFileHere', 'Drop a file here, or click to choose one')}</div>
                <div className="open-sheet__drop-hint">{t('reader.supportedFormats', 'PDF, EPUB, Word, Markdown, text')}</div>
                <input ref={inputRef} type="file" accept={ACCEPT} hidden onChange={(e) => { take(e.target.files?.[0]); e.target.value = '' }} />
            </div>
            {onWriteInstead && (
                <button className="open-sheet__alt" onClick={onWriteInstead}>
                    <Icon name="write" /> {t('reader.writeInstead', 'Write or paste instead')}
                </button>
            )}
        </div>
    )
}
