import { franc } from 'franc'
import LANG_CODES from '../data/langCodes.js'

const SCRIPTS = [
    ['latin', 'en', /\p{Script=Latin}/gu],
    ['arabic', 'ar', /\p{Script=Arabic}/gu],
    ['cyrillic', 'ru', /\p{Script=Cyrillic}/gu],
    ['hebrew', 'he', /\p{Script=Hebrew}/gu],
    ['greek', 'el', /\p{Script=Greek}/gu],
    ['han', 'zh', /\p{Script=Han}/gu],
    ['kana', 'ja', /[\p{Script=Hiragana}\p{Script=Katakana}]/gu],
    ['hangul', 'ko', /\p{Script=Hangul}/gu],
    ['devanagari', 'hi', /\p{Script=Devanagari}/gu],
    ['bengali', 'bn', /\p{Script=Bengali}/gu],
    ['gurmukhi', 'pa', /\p{Script=Gurmukhi}/gu],
    ['gujarati', 'gu', /\p{Script=Gujarati}/gu],
    ['tamil', 'ta', /\p{Script=Tamil}/gu],
    ['telugu', 'te', /\p{Script=Telugu}/gu],
    ['kannada', 'kn', /\p{Script=Kannada}/gu],
    ['malayalam', 'ml', /\p{Script=Malayalam}/gu],
    ['sinhala', 'si', /\p{Script=Sinhala}/gu],
    ['thai', 'th', /\p{Script=Thai}/gu],
    ['lao', 'lo', /\p{Script=Lao}/gu],
    ['khmer', 'km', /\p{Script=Khmer}/gu],
    ['myanmar', 'my', /\p{Script=Myanmar}/gu],
    ['georgian', 'ka', /\p{Script=Georgian}/gu],
    ['armenian', 'hy', /\p{Script=Armenian}/gu],
    ['ethiopic', 'am', /\p{Script=Ethiopic}/gu],
]

const RTL = new Set(['ar', 'fa', 'ur', 'he', 'ps', 'ku', 'sd', 'ug', 'dv', 'yi'])
const SHORT = 24
const SAMPLE = 4000

function scriptCounts(text) {
    let best = null
    let total = 0
    for (const [script, code, re] of SCRIPTS) {
        const n = (text.match(re) || []).length
        total += n
        if (n > 0 && (!best || n > best.n)) best = { script, code, n }
    }
    return { best, total }
}

export function scriptOf(text) {
    if (typeof text !== 'string' || !text) return ''
    return scriptCounts(text).best?.script || ''
}

export function detectLanguage(text) {
    if (!text || typeof text !== 'string') return 'unknown'
    const { best, total } = scriptCounts(text)
    if (!best) return 'unknown'
    if (total < SHORT || best.script === 'kana' || best.script === 'hangul') return best.code
    const code = franc(text.length > SAMPLE ? text.slice(0, SAMPLE) : text, { minLength: 10 })
    return LANG_CODES[code] || best.code
}

export const isRtl = (code) => RTL.has(String(code || '').slice(0, 2))
