const letterCount = (s) => ((s || '').match(/\p{L}/gu) || []).length
const alnumCount = (s) => ((s || '').match(/[\p{L}\p{N}]/gu) || []).length

const isSolid = (it) => (it.conf ?? 100) >= 60 && letterCount(it.str) >= 3

export const isAnchor = (it) => {
    const conf = it.conf ?? 100
    const n = alnumCount(it.str)
    return (conf >= 80 && n >= 3) || (conf >= 70 && n >= 5)
}

export function isArtPage(items, { minItems = 40, solidShare = 0.25 } = {}) {
    if (!items || items.length < minItems) return false
    const solid = items.filter(isSolid).length
    return solid / items.length < solidShare
}

export function scriptOf(str) {
    let ar = 0
    let lat = 0
    for (const ch of str || '') {
        if (!/\p{L}/u.test(ch)) continue
        if (/\p{Script=Arabic}/u.test(ch)) ar++
        else if (/\p{Script=Latin}/u.test(ch)) lat++
    }
    if (!ar && !lat) return ''
    return ar >= lat ? 'ar' : 'lat'
}

export function groupLines(items) {
    const boxes = (items || []).map((it, i) => {
        const x = it.transform?.[4] ?? 0
        const y = it.transform?.[5] ?? 0
        const h = it.height || Math.abs(it.transform?.[3] ?? 0) || 1
        return { i, x1: x, x2: x + (it.width || 0), y1: y, y2: y + h, h }
    }).sort((a, b) => (b.y1 + b.y2) - (a.y1 + a.y2))
    const rows = []
    for (const b of boxes) {
        const row = rows.find((r) => Math.min(b.y2, r.y2) - Math.max(b.y1, r.y1) >= 0.5 * Math.min(b.h, r.h))
        if (row) row.boxes.push(b)
        else rows.push({ y1: b.y1, y2: b.y2, h: b.h, boxes: [b] })
    }
    const lines = []
    for (const row of rows) {
        let line = null
        for (const b of row.boxes.sort((p, q) => p.x1 - q.x1)) {
            if (line && b.x1 - line.x2 <= 5 * Math.max(b.h, line.h)) {
                line.members.push(b.i)
                line.x2 = Math.max(line.x2, b.x2)
                line.h = Math.max(line.h, b.h)
            } else {
                line = { x2: b.x2, h: b.h, members: [b.i] }
                lines.push(line)
            }
        }
    }
    return lines.map((l) => l.members)
}

export function leadScript(engItems, araItems) {
    const lat = (engItems || []).filter((it) => scriptOf(it.str) === 'lat' && isAnchor(it)).length
    const ar = (araItems || []).filter((it) => scriptOf(it.str) === 'ar' && isAnchor(it)).length
    if (ar >= 2 && lat < 2) return 'ar'
    if (lat >= 2 && ar < 2) return 'lat'
    return ''
}

function isForeign(it, anchors) {
    const s = scriptOf(it.str)
    if (!s) return false
    const other = s === 'ar' ? 'lat' : 'ar'
    if (anchors[s] >= 2 || anchors[other] < 2) return false
    return !((it.conf ?? 100) >= 90 && letterCount(it.str) >= 3)
}

export function pageProfile(items) {
    const list = items || []
    const lines = groupLines(list)
    const lineOf = new Array(list.length)
    lines.forEach((members, n) => { for (const i of members) lineOf[i] = n })
    const anchors = { ar: 0, lat: 0 }
    for (const it of list) {
        if (!isAnchor(it)) continue
        const s = scriptOf(it.str)
        if (s) anchors[s] += 1
    }
    const anchoredLines = lines.map((members) => members.some((i) => isAnchor(list[i]) && !isForeign(list[i], anchors)))
    const prose = lines.filter((members) => members.length >= 3 && members.filter((i) => isAnchor(list[i])).length >= 2)
    const proseShare = prose.reduce((n, members) => n + members.length, 0) / Math.max(1, list.length)
    const cover = prose.length < 3 || proseShare < 0.35
    return { lineOf, anchors, anchoredLines, cover }
}

function legacyClean(list, vouch) {
    const art = isArtPage(list)
    return list.filter((it) => {
        const str = (it.str || '').trim()
        if (!str) return false
        if (vouch(str)) return true
        const conf = it.conf ?? 100
        const letters = letterCount(str)
        if (art) return conf >= 70 && letters >= 3
        if (letters <= 2 && conf < 30) return false
        if (letters === 0 && conf < 50) return false
        return true
    })
}

export function cleanOcrItems(items, { vouch = () => false } = {}) {
    const list = items || []
    if (list.some((it) => it.fontName && it.fontName !== 'ocr' && it.fontName !== 'basmala')) return legacyClean(list, vouch)
    const profile = pageProfile(list)
    return list.filter((it, i) => {
        const str = (it.str || '').trim()
        if (!str) return false
        if (it.fontName === 'basmala') return true
        if (isForeign(it, profile.anchors)) return false
        const conf = it.conf ?? 100
        if (profile.cover) {
            if (!profile.anchoredLines[profile.lineOf[i]]) return false
            if (vouch(str)) return true
            const alnum = alnumCount(str)
            if (!alnum) return false
            return alnum === 1 ? conf >= 80 : conf >= 40
        }
        if (vouch(str)) return true
        const letters = letterCount(str)
        if (letters <= 2 && conf < 30) return false
        if (letters === 0) {
            if (conf < 60) return false
            if (!profile.anchoredLines[profile.lineOf[i]]) return false
            if ([...str.replace(/\p{Cf}/gu, '')].length === 1 && conf < 90) return false
        }
        return true
    })
}
