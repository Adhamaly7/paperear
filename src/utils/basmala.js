export const BASMALA_TEXT = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'

const GRID_W = 48
const GRID_H = 12
const MATCH_THRESHOLD = 0.78

export const BASMALA_TEMPLATES = [
    '000006002000c0c01b488480422b2a4964b44369004b0e8607f97e582ab61deb67272a0227693e372e8771397a63f97e92f3e38dc12079cb2606478b5f4fb8481d51007800007204',
]

export function registerBasmalaTemplate(hex) {
    if (hex && !BASMALA_TEMPLATES.includes(hex)) BASMALA_TEMPLATES.push(hex)
}

export function bitsFromGray(gray, w, h) {
    let x1 = w
    let x2 = -1
    let y1 = h
    let y2 = -1
    for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++)
            if (gray[y * w + x] < 200) {
                if (x < x1) x1 = x
                if (x > x2) x2 = x
                if (y < y1) y1 = y
                if (y > y2) y2 = y
            }
    if (x2 < x1 || y2 < y1) return null
    const tw = x2 - x1 + 1
    const th = y2 - y1 + 1
    if (tw < GRID_W / 2 || th < 4) return null

    const cells = new Float64Array(GRID_W * GRID_H)
    const counts = new Float64Array(GRID_W * GRID_H)
    for (let y = y1; y <= y2; y++)
        for (let x = x1; x <= x2; x++) {
            const gx = Math.min(GRID_W - 1, Math.floor(((x - x1) / tw) * GRID_W))
            const gy = Math.min(GRID_H - 1, Math.floor(((y - y1) / th) * GRID_H))
            cells[gy * GRID_W + gx] += gray[y * w + x]
            counts[gy * GRID_W + gx] += 1
        }
    let mean = 0
    for (let i = 0; i < cells.length; i++) {
        cells[i] = counts[i] ? cells[i] / counts[i] : 255
        mean += cells[i]
    }
    mean /= cells.length
    const bits = new Uint8Array(GRID_W * GRID_H)
    for (let i = 0; i < cells.length; i++) bits[i] = cells[i] < mean ? 1 : 0
    return bits
}

export function bitsToHex(bits) {
    let hex = ''
    for (let i = 0; i < bits.length; i += 4) {
        const nibble = (bits[i] << 3) | (bits[i + 1] << 2) | (bits[i + 2] << 1) | (bits[i + 3] || 0)
        hex += nibble.toString(16)
    }
    return hex
}

export function hexToBits(hex) {
    const bits = new Uint8Array(hex.length * 4)
    for (let i = 0; i < hex.length; i++) {
        const nibble = parseInt(hex[i], 16)
        bits[i * 4] = (nibble >> 3) & 1
        bits[i * 4 + 1] = (nibble >> 2) & 1
        bits[i * 4 + 2] = (nibble >> 1) & 1
        bits[i * 4 + 3] = nibble & 1
    }
    return bits
}

export function bitsSimilarity(a, b) {
    if (!a || !b || a.length !== b.length) return 0
    let same = 0
    for (let i = 0; i < a.length; i++) if (a[i] === b[i]) same++
    return same / a.length
}

export function grayFromCanvasRegion(canvas, rect) {
    const x = Math.max(0, Math.floor(rect.x))
    const y = Math.max(0, Math.floor(rect.y))
    const w = Math.min(canvas.width - x, Math.ceil(rect.w))
    const h = Math.min(canvas.height - y, Math.ceil(rect.h))
    if (w < 12 || h < 6) return null
    const d = canvas.getContext('2d').getImageData(x, y, w, h).data
    const gray = new Uint8Array(w * h)
    for (let i = 0; i < gray.length; i++) {
        const o = i * 4
        gray[i] = 0.2126 * d[o] + 0.7152 * d[o + 1] + 0.0722 * d[o + 2]
    }
    return { gray, w, h }
}

export function matchesBasmala(canvas, rect) {
    if (!BASMALA_TEMPLATES.length) return false
    let g
    try { g = grayFromCanvasRegion(canvas, rect) } catch { return false }
    if (!g) return false
    const bits = bitsFromGray(g.gray, g.w, g.h)
    if (!bits) return false
    for (const hex of BASMALA_TEMPLATES) {
        if (bitsSimilarity(bits, hexToBits(hex)) >= MATCH_THRESHOLD) return true
    }
    return false
}

const ornamentCandidates = (items) => (items || []).filter((it) => {
    const s = (it.str || '').trim()
    if (!s || s.length > 2) return false
    const h = it.height || Math.abs(it.transform[3]) || 0
    return h > 0 && (it.width || 0) / s.length / h > 2
})

export async function basmalaItemsForPage(page, contentItems) {
    const candidates = ornamentCandidates(contentItems)
    if (!candidates.length || typeof document === 'undefined') return []
    try {
        const [, , , ph] = page.view
        const scale = 1.5
        const viewport = page.getViewport({ scale })
        const canvas = document.createElement('canvas')
        canvas.width = Math.ceil(viewport.width)
        canvas.height = Math.ceil(viewport.height)
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
        const out = []
        for (const it of candidates) {
            const h = it.height || Math.abs(it.transform[3]) || 0
            const rect = {
                x: it.transform[4] * scale - 6,
                y: (ph - it.transform[5] - h * 1.7) * scale - 6,
                w: it.width * scale + 12,
                h: h * 2.4 * scale + 12,
            }
            if (!matchesBasmala(canvas, rect)) continue
            out.push({
                str: BASMALA_TEXT,
                transform: [h, 0, 0, h, it.transform[4], it.transform[5]],
                width: it.width,
                height: h,
                fontName: 'basmala',
                conf: 99,
            })
        }
        canvas.width = 0
        canvas.height = 0
        return out
    } catch { return [] }
}
