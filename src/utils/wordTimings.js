const ARABIC_MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭ]/gu
const TRAILING_MARKS = /[^\p{L}\p{N}]+$/u
const FULL_STOPS = /[.!?؟۔…]/u
const SHORT_PAUSES = /[,;:،؛—]/u
const ARABIC_LETTER = /[؀-ۿ]/u

function syllablesIn(core) {
    const letters = core.match(/\p{L}/gu) || []
    if (!letters.length) return 1
    if (ARABIC_LETTER.test(core)) return Math.ceil(letters.length / 2)
    return Math.max(1, (core.match(/[aeiouy]+/giu) || []).length)
}

function weightOf(word) {
    const bare = word.replace(ARABIC_MARKS, '')
    const tail = (bare.match(TRAILING_MARKS) || [''])[0]
    const core = bare.replace(TRAILING_MARKS, '')
    const length = (core.match(/[\p{L}\p{N}]/gu) || []).length
    const pause = FULL_STOPS.test(tail) ? 2 : SHORT_PAUSES.test(tail) ? 1 : 0
    return syllablesIn(core) + length / 4 + pause
}

export function wordTimings(words, durationSec) {
    const weights = words.map(weightOf)
    const total = weights.reduce((sum, w) => sum + w, 0)
    let at = 0
    return words.map((word, i) => {
        const start = at
        at = i === words.length - 1 ? durationSec : at + (durationSec * weights[i]) / total
        return { word, start, end: at }
    })
}
