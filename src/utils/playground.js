export function wordsOf(paragraphs) {
    const words = []
    paragraphs.forEach((p, para) => {
        for (const text of (p || '').split(/\s+/).filter(Boolean)) words.push({ text, para })
    })
    return words
}

export function spokenFrom(words, from) {
    const offsets = []
    let text = ''
    for (let i = from; i < words.length; i++) {
        if (text) text += ' '
        offsets.push(text.length)
        text += words[i].text
    }
    return { text, offsets }
}

export function wordAtChar(offsets, charIndex) {
    let lo = 0
    let hi = offsets.length - 1
    let found = 0
    while (lo <= hi) {
        const mid = (lo + hi) >> 1
        if (offsets[mid] <= charIndex) { found = mid; lo = mid + 1 } else hi = mid - 1
    }
    return found
}

export function paragraphJump(words, index, direction) {
    if (!words.length) return 0
    const here = words[Math.max(0, Math.min(index, words.length - 1))].para
    if (direction > 0) {
        const next = words.findIndex((w) => w.para > here)
        return next === -1 ? index : next
    }
    const start = words.findIndex((w) => w.para === here)
    if (index > start) return start
    const previous = words.findIndex((w) => w.para === here - 1)
    return previous === -1 ? 0 : previous
}

export const clampRate = (rate) => Math.round(Math.min(2, Math.max(0.5, rate)) * 100) / 100
