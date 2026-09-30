









import { refineBoxesWithGlyphs } from './glyphBoxes.js'

const TOC_LINE = /^(.{2,}?)[\s.·…]{2,}(\d{1,4})$/
const COLOPHON_PATTERNS = [
    /all rights reserved/i,
    /isbn[\s:0-9-]/i,
    /no part of this publication/i,
    /printed in/i,
    /©|copyright/i,
    /library of congress/i,
    /catalog record/i,



]






const CREDIT_ROLE = /\b(?:senior|project|managing|art|jacket|us|uk|pre-production|development)?\s?(?:editors?|designers?|design\b|producers?|publishers?|directors?|managers?)/gi

function normalizeItems(items) {
    const out = []
    for (const it of items) {
        if (typeof it.str !== 'string' || !it.str.trim()) continue
        const len = it.str.trim().length
        const hh = it.height || Math.abs(it.transform[3]) || 0
        if (len <= 2 && hh > 0 && (it.width || 0) / len / hh > 2) continue
        out.push({
            str: it.str,
            x: it.transform[4],
            y: it.transform[5],
            w: it.width || 0,
            h: it.height || Math.abs(it.transform[3]) || 0,
            font: it.fontName || '',
            dir: it.dir,
        })
    }
    return out
}

export function detectRtlItems(rawItems) {
    let ar = 0
    let lat = 0
    for (const it of rawItems || []) {
        const s = it.str || ''
        ar += (s.match(/[؀-ۿ]/g) || []).length
        lat += (s.match(/[A-Za-z]/g) || []).length
    }
    return ar > lat
}

function median(nums) {
    if (!nums.length) return 0
    const s = [...nums].sort((a, b) => a - b)
    return s[Math.floor(s.length / 2)]
}

const isAlpha = (s) => /[\p{L}\p{N}]/u.test(s)



export function columnBands(items, pageWidth) {
    if (!items.length) return []
    const minX = Math.min(...items.map((i) => i.x))
    const maxX = Math.max(...items.map((i) => i.x + Math.max(i.w, 1)))
    const span = maxX - minX
    if (span <= 0) return [items]

    const BINS = 120
    const bw = span / BINS
    const cov = new Array(BINS).fill(0)
    for (const it of items) {
        const a = Math.max(0, Math.floor((it.x - minX) / bw))
        const b = Math.min(BINS - 1, Math.floor((it.x + Math.max(it.w, 1) - minX) / bw))
        for (let k = a; k <= b; k++) cov[k] += 1
    }
    const maxCov = Math.max(...cov)
    if (maxCov === 0) return [items]

    const gapThresh = maxCov * 0.12
    const edge = Math.round(BINS * 0.08)
    const minGutter = Math.max(2, Math.round(BINS * 0.03))
    const boundaries = []
    let run = 0
    for (let k = 0; k <= BINS; k++) {
        const isGap = k < BINS && cov[k] <= gapThresh
        if (isGap) { run++; continue }
        if (run >= minGutter) {
            const gStart = k - run
            const gEnd = k - 1
            if (gStart > edge && gEnd < BINS - edge) {
                boundaries.push(minX + ((gStart + gEnd) / 2 + 0.5) * bw)
            }
        }
        run = 0
    }
    if (!boundaries.length) return [items]

    const cuts = [minX - 1, ...boundaries, maxX + 1]
    const bands = []
    for (let c = 0; c < cuts.length - 1; c++) {
        const lo = cuts[c]
        const hi = cuts[c + 1]
        const band = items.filter((i) => {
            const cx = i.x + Math.max(i.w, 1) / 2
            return cx >= lo && cx < hi
        })
        if (band.length) bands.push(band)
    }
    return bands.length ? bands : [items]
}


const scriptOf = (s) => {
    if (/[؀-ۿ]/.test(s)) return 'ar'
    if (/[A-Za-z]/.test(s)) return 'lat'
    return 'neutral'
}

export function orderLineItems(items, rtl) {
    const visual = [...items].sort((a, b) => a.x - b.x)
    const scripts = visual.map((it) => scriptOf(it.str || ''))
    if (!rtl) {
        for (let i = 0; i < scripts.length; i++) {
            if (scripts[i] !== 'neutral') continue
            let left = 'en'
            for (let j = i - 1; j >= 0; j--) if (scripts[j] !== 'neutral') { left = scripts[j]; break }
            let right = 'en'
            for (let j = i + 1; j < scripts.length; j++) if (scripts[j] !== 'neutral') { right = scripts[j]; break }
            scripts[i] = (left === 'ar' && right === 'ar') ? 'ar' : 'en'
        }
    }
    const runs = []
    for (let k = 0; k < visual.length; k++) {
        const it = visual[k]
        const s = scripts[k]
        const last = runs[runs.length - 1]
        if (last && (s === 'neutral' || s === last.script)) {
            last.items.push(it)
        } else if (last && last.script === 'neutral') {
            last.script = s
            last.items.push(it)
        } else {
            runs.push({ script: s, items: [it] })
        }
    }
    const ordered = rtl ? [...runs].reverse() : runs
    const out = []
    for (const run of ordered) {
        const runRtl = run.script === 'ar' || (run.script === 'neutral' && rtl)
        out.push(...(runRtl ? [...run.items].reverse() : run.items))
    }
    return out
}

export function clusterLines(items, rtl = false) {
    const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x)
    const lines = []
    for (const it of sorted) {
        const tol = Math.max(2, it.h * 0.4)
        const line = lines.find((l) => Math.abs(l.y - it.y) <= tol)
        if (line) {
            line.items.push(it)
            line.y = (line.y * (line.items.length - 1) + it.y) / line.items.length
        } else {
            lines.push({ y: it.y, items: [it] })
        }
    }
    for (const l of lines) {
        l.items = orderLineItems(l.items, rtl)
        l.x = l.items[0].x
        l.xEnd = Math.max(...l.items.map((i) => i.x + i.w))
        l.h = Math.max(...l.items.map((i) => i.h))
        l.text = l.items.map((i) => i.str.trim()).filter(Boolean).join(' ')
    }
    return lines.sort((a, b) => b.y - a.y)
}


export function clusterBlocks(lines) {
    const blocks = []
    for (const line of lines) {
        const last = blocks[blocks.length - 1]
        if (last) {
            const prev = last.lines[last.lines.length - 1]
            const gap = prev.y - line.y
            const maxGap = Math.max(prev.h, line.h) * 1.7
            const xOverlap =
                Math.min(prev.xEnd, line.xEnd) - Math.max(prev.x, line.x)
            const minWidth = Math.min(prev.xEnd - prev.x, line.xEnd - line.x)
            const sizeAlike =
                Math.max(prev.h, line.h) / Math.max(1e-6, Math.min(prev.h, line.h)) < 1.5
            if (gap > 0 && gap <= maxGap && xOverlap > minWidth * 0.3 && sizeAlike) {
                last.lines.push(line)
                continue
            }
        }
        blocks.push({ lines: [line] })
    }
    for (const b of blocks) {
        b.x = Math.min(...b.lines.map((l) => l.x))
        b.xEnd = Math.max(...b.lines.map((l) => l.xEnd))
        b.yTop = Math.max(...b.lines.map((l) => l.y + l.h))
        b.yBottom = Math.min(...b.lines.map((l) => l.y))
        b.h = median(b.lines.map((l) => l.h))
        b.text = b.lines.map((l) => l.text).join(' ')
    }
    return blocks
}


export function applyHardBreaks(blocks, columnWidth, tocPage = false) {
    for (const b of blocks) {
        if (!b.lines || b.lines.length < 2) continue
        const blockWidth = b.xEnd - b.x
        const isDisplayBlock = tocPage || (columnWidth > 0 && blockWidth < columnWidth * 0.7)
        let out = ''
        for (let i = 0; i < b.lines.length; i++) {
            const line = b.lines[i]
            if (i > 0) {
                const prev = b.lines[i - 1]
                const endsInNumber = /[\d٠-٩][)"'»\]]?\s*$/.test(prev.text || '')
                out += (isDisplayBlock || endsInNumber) ? '\n' : ' '
            }
            out += line.text
        }
        b.text = out
    }
}


export function classifyBlocks(blocks, { pageWidth, pageHeight }) {
    const bodySize = median(
        blocks
            .filter((b) => isAlpha(b.text) && b.text.length > 20)
            .map((b) => b.h),
    ) || median(blocks.map((b) => b.h))




    const isTocLine = (l) => {
        if (TOC_LINE.test(l.text)) return true
        if (l.items.length < 2) return false
        const last = l.items[l.items.length - 1]
        const span = l.xEnd - l.x
        return /^\d{1,4}$/.test(last.str.trim()) && span > 0 && last.x > l.x + span * 0.55
    }
    let tocLines = 0
    for (const b of blocks) for (const l of b.lines) if (isTocLine(l)) tocLines++
    const tocPage = tocLines >= 5

    for (const b of blocks) {
        const txt = b.text.trim()
        const wordCount = txt.split(/\s+/).length
        const colophonHits = COLOPHON_PATTERNS.filter((p) => p.test(txt)).length

        if (!isAlpha(txt)) {

            b.type = 'decorative'
            b.suggestedSkip = true
        } else if (!/\p{L}/u.test(txt) && /[^\d\s.,]/.test(txt)) {


            b.type = 'decorative'
            b.suggestedSkip = true
        } else if (





            txt.split(/\s+/).every((w) => /^\d{1,4}$/.test(w)) &&
            (tocPage ||
                (() => {
                    const nums = txt.split(/\s+/).map(Number)
                    return (
                        nums.length >= 2 &&
                        nums.every((v, i) => i === 0 || v > nums[i - 1]) &&
                        b.x > pageWidth * 0.45
                    )
                })())
        ) {
            b.type = 'page-number'
            b.suggestedSkip = true
        } else if (






            (/^\d{1,4}$/.test(txt) || /^[ivxlcdm]{1,8}\.?$/i.test(txt)) &&
            (b.yBottom < pageHeight * 0.12 || b.yTop > pageHeight * 0.88)
        ) {
            b.type = 'page-number'
            b.suggestedSkip = true
        } else if (




            wordCount <= 5 &&
            /(^|\s)\d{1,4}(\s|$)/.test(txt) &&
            (b.yTop < pageHeight * 0.06 || b.yBottom > pageHeight * 0.94)
        ) {
            b.type = 'page-number'
            b.suggestedSkip = true
        } else if (colophonHits >= 2) {
            b.type = 'colophon'
            b.suggestedSkip = true
        } else if ((txt.match(CREDIT_ROLE) || []).length >= 3) {
            b.type = 'colophon'
            b.credit = true
            b.suggestedSkip = true
        } else if (tocPage && b.lines.some(isTocLine)) {
            b.type = 'toc'
            b.suggestedSkip = false
        } else if (
            txt.length <= 2 &&
            b.h >= bodySize * 1.4
        ) {
            b.type = 'decorative'
            b.suggestedSkip = true
        } else if (b.h >= bodySize * 1.35 && wordCount <= 12) {
            b.type = 'heading'
            b.suggestedSkip = false
        } else if (b.h <= bodySize * 0.8 && wordCount <= 30) {
            b.type = 'caption'
            b.suggestedSkip = false
        } else {
            b.type = 'body'
            b.suggestedSkip = false
        }
    }



    if (blocks.some((b) => b.type === 'colophon' && !b.credit)) {
        for (const b of blocks) {
            if (b.suggestedSkip || b.type === 'heading') continue
            const toks = b.text.trim().split(/\s+/)
            if (toks.length <= 8 && /publish|copyright|©|isbn|printed|edition/i.test(b.text)) {
                b.type = 'colophon'
                b.suggestedSkip = true
            }
        }
    }






    if (blocks.filter((b) => b.credit).length >= 2) {
        const nameLike = (w) => /^[A-Z][\p{L}'-]+,?$/u.test(w)
        for (const b of blocks) {
            if (b.suggestedSkip || b.type === 'heading') continue
            const toks = b.text.trim().split(/\s+/)
            if (toks.length > 12) continue
            const hasRole = (b.text.match(CREDIT_ROLE) || []).length >= 1
            const allNames = toks.length >= 2 && toks.every(nameLike)
            if (hasRole || allNames) {
                b.type = 'colophon'
                b.credit = true
                b.suggestedSkip = true
            }
        }
    }

    return { blocks, bodySize, tocPage }
}


export function orderBlocks(blocks, { pageWidth, rtl = false } = {}) {
    if (!blocks.length) return []
    const readable = blocks.map((b, i) => ({ b, i }))

    const sorted = [...readable].sort((p, q) => p.b.x - q.b.x)
    const bands = [[sorted[0]]]
    for (let k = 1; k < sorted.length; k++) {
        const prevBand = bands[bands.length - 1]
        const bandEnd = Math.max(...prevBand.map((p) => p.b.xEnd))
        if (sorted[k].b.x - bandEnd > pageWidth * 0.06) bands.push([sorted[k]])
        else prevBand.push(sorted[k])
    }
    if (rtl) bands.reverse()
    const order = []
    for (const band of bands)
        for (const p of band.sort((a, c) => c.b.yTop - a.b.yTop)) order.push(p.i)
    return order
}


let measureCtx = null
function textAdvance(s) {
    if (measureCtx === null) {
        try {
            const c = document.createElement('canvas')
            measureCtx = c.getContext('2d')
            measureCtx.font = '100px Georgia, serif'
        } catch { measureCtx = false }
    }
    if (!measureCtx) return s.length
    return measureCtx.measureText(s).width / 100 || s.length
}

export function wordBoxes(block, blockIndex) {
    const words = []
    for (let li = 0; li < block.lines.length; li++) {
        const line = block.lines[li]
        for (const it of line.items) {
            const spans = []
            const re = /\S+/g
            let m
            while ((m = re.exec(it.str)) !== null) spans.push({ text: m[0], index: m.index })
            if (!spans.length) continue
            const totalAdvance = textAdvance(it.str) || 1
            const unit = it.w / totalAdvance
            const ar = (it.str.match(/[\u{600}-\u{6FF}\u{750}-\u{77F}\u{FB50}-\u{FDFF}\u{FE70}-\u{FEFF}]/gu) || []).length
            const lat = (it.str.match(/[A-Za-z]/g) || []).length
            const itemRtl = ar > lat
            for (let k = 0; k < spans.length; k++) {
                const s = spans[k]
                const before = textAdvance(it.str.slice(0, s.index)) * unit
                const w = textAdvance(s.text) * unit
                words.push({
                    text: s.text,
                    x: itemRtl ? it.x + it.w - before - w : it.x + before,
                    y: it.y,
                    w,
                    h: it.h,
                    block: blockIndex,
                    line: li,
                    src: { item: it, k, count: spans.length, rtl: itemRtl },
                })
            }
        }
    }
    return words
}


export function buildBlockModel(rawItems, { pageWidth, pageHeight, rtl = false, glyphs = null }) {
    const items = normalizeItems(rawItems)

    const assemble = (bands) => {
        const blocks = []
        const order = []
        for (const band of bands) {
            const bandBlocks = clusterBlocks(clusterLines(band, rtl))
            const offset = blocks.length
            blocks.push(...bandBlocks)
            for (const local of orderBlocks(bandBlocks, { pageWidth, rtl })) order.push(offset + local)
        }
        return { blocks, order }
    }

    const bands = columnBands(items, pageWidth)
    if (rtl) bands.reverse()
    let { blocks, order } = assemble(bands)
    let { tocPage } = classifyBlocks(blocks, { pageWidth, pageHeight })

    if (bands.length > 1) {
        const single = assemble([items])
        const singleToc = classifyBlocks(single.blocks, { pageWidth, pageHeight }).tocPage
        if (tocPage || singleToc) {
            ;({ blocks, order } = single)
            tocPage = true
        }
    }

    applyHardBreaks(blocks, Math.max(0, ...blocks.map((b) => b.xEnd - b.x)), tocPage)

    const words = []
    const readingParts = []
    const readingIndexToBox = []
    for (const idx of order) {
        const b = blocks[idx]
        const boxes = wordBoxes(b, idx)
        for (const box of boxes) box.skip = !!b.suggestedSkip




        if (b.type === 'toc' && !b.suggestedSkip) {
            const byLine = new Map()
            for (const box of boxes) {
                if (!byLine.has(box.line)) byLine.set(box.line, [])
                byLine.get(box.line).push(box)
            }
            for (const lineBoxes of byLine.values()) {
                const last = lineBoxes[lineBoxes.length - 1]
                const prev = lineBoxes[lineBoxes.length - 2]
                const lineX0 = lineBoxes[0].x
                const lineX1 = last.x + last.w



                const afterLeader = prev && /^[.·…]{2,}$/.test(prev.text)
                const afterGap = prev && last.x - (prev.x + prev.w) > pageWidth * 0.05
                if (
                    lineBoxes.length > 1 &&
                    /^\d{1,4}$/.test(last.text) &&
                    last.x > lineX0 + (lineX1 - lineX0) * 0.55 &&
                    (afterLeader || afterGap)
                ) last.skip = true
            }
        }
        const lineBroken = (b.text || '').includes('\n')
        const joinBoxes = (list) => {
            let out = ''
            for (let k = 0; k < list.length; k++) {
                if (k > 0) out += lineBroken && list[k].line !== list[k - 1].line ? '\n' : ' '
                out += list[k].text
            }
            return out
        }

        const readBoxes = boxes.filter((box) => !box.skip)
        if (readBoxes.length) {
            b.readText = joinBoxes(readBoxes)
            readingParts.push(b.readText)
            for (let k = 0; k < boxes.length; k++)
                if (!boxes[k].skip) readingIndexToBox.push(words.length + k)
        } else {
            b.readText = ''
        }


        if (b.type === 'toc' && boxes.some((box) => box.skip)) {
            const toks = []
            for (const box of boxes) {
                if (box.skip && toks.length && !/[,.;:]$/.test(toks[toks.length - 1].text))
                    toks[toks.length - 1] = { ...toks[toks.length - 1], text: toks[toks.length - 1].text + ',' }
                toks.push(box)
            }
            b.beatText = joinBoxes(toks)
        }
        words.push(...boxes)
    }
    refineBoxesWithGlyphs(words, glyphs)
    return {
        blocks: blocks.map((b) => ({
            type: b.type,
            suggestedSkip: b.suggestedSkip,
            text: b.text,
            readText: b.readText ?? (b.suggestedSkip ? '' : b.text),
            beatText: b.beatText,
            bbox: { x: b.x, y: b.yBottom, w: b.xEnd - b.x, h: b.yTop - b.yBottom },
            lineCount: b.lines.length,
        })),
        order,
        readingText: readingParts.join('\n\n'),
        words,
        readingIndexToBox,
        tocPage,
    }
}







export function alignBoxMap(model, pipelineBlocks) {
    if (!pipelineBlocks?.length) return { readingIndexToBox: model.readingIndexToBox, skipByBox: model.words.map((w) => !!w.skip) }
    const readingIndexToBox = []
    const skipByBox = new Array(model.words.length).fill(false)
    let pipeIdx = 0
    let boxCursor = 0
    for (const idx of model.order) {
        const b = model.blocks[idx]
        const boxCount = model.words.filter((w) => w.block === idx).length
        const emitted = (b.text || '').trim().length > 0
        const pipe = emitted ? pipelineBlocks[pipeIdx++] : null
        const blockSkip = pipe ? !!pipe.skip : false
        const useClean = pipe ? !!pipe.usedClean : false
        for (let k = 0; k < boxCount; k++) {
            const g = boxCursor + k
            skipByBox[g] = blockSkip || (useClean && !!model.words[g].skip)
            if (!skipByBox[g]) readingIndexToBox.push(g)
        }
        boxCursor += boxCount
    }
    return { readingIndexToBox, skipByBox }
}
