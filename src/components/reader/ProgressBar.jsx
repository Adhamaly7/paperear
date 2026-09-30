import React from 'react'
import { useTranslation } from 'react-i18next'
import './ProgressBar.css'

/**
 * ProgressBar — Progress slider for navigating through text.
 */
export default function ProgressBar({
    currentWordIndex,
    totalWords,
    formatProgress,
    onInput,
    onChange,
    onMouseDown,
    onMouseUp,
    onTouchEnd,
    disabled,
}) {
    const { t } = useTranslation()
    return (
        <div className="progress-bar">
            <label className="progress-bar-label">{t('controls.progress')}</label>
            <div className="progress-bar-row">
                <input
                    type="range"
                    min="0"
                    max={totalWords - 1 || 0}
                    step="1"
                    value={currentWordIndex}
                    onInput={onInput}
                    onChange={onChange}
                    onMouseDown={onMouseDown}
                    onMouseUp={onMouseUp}
                    onTouchEnd={onTouchEnd}
                    className="progress-bar-slider"
                    disabled={disabled}
                />
                <span className="progress-bar-value">
                    {totalWords ? t('controls.progressValue', '{{pct}}% ({{n}}/{{total}} words)').replace('{{pct}}', Math.round((currentWordIndex / totalWords) * 100)).replace('{{n}}', currentWordIndex).replace('{{total}}', totalWords) : '0%'}
                </span>
            </div>
        </div>
    )
}
