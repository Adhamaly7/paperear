import { useTranslation } from 'react-i18next'
import './ZoomControl.css'

export default function ZoomControl({ onIn, onOut, canIn = true, canOut = true, label = '' }) {
    const { t } = useTranslation()
    return (
        <div className="zoom-ctl" title={label}>
            <div className="zoom-ctl__lens">
                <button type="button" className="zoom-ctl__btn" onClick={onIn} disabled={!canIn} aria-label={t('controls.zoomIn', 'Zoom in')}>+</button>
                <button type="button" className="zoom-ctl__btn" onClick={onOut} disabled={!canOut} aria-label={t('controls.zoomOut', 'Zoom out')}>−</button>
            </div>
        </div>
    )
}
