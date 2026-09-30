

import assert from 'node:assert'
import { applySkippable, joinBlocksForSpeech } from './pageModel.js'

const blocks = [
    { type: 'heading', text: 'CHAPTER ONE', geo: 'heading' },
    { type: 'para', text: 'Real prose that must always read.', geo: 'body' },
    { type: 'para', text: '$ € £', skippable: true, geo: 'decorative' },
    { type: 'item', text: 'The evolution of money, 12', cleanText: 'The evolution of money', geo: 'toc' },
    { type: 'para', text: '84', skippable: true, geo: 'page-number' },
]
const pages = [{ pageNum: 1, text: joinBlocksForSpeech(blocks), charCount: 0, blocks }]


{
    const off = applySkippable(pages, false)
    assert.strictEqual(off, pages, 'off = pages untouched')
    const t = off[0].text
    assert.ok(t.includes('$ € £'), 'symbol art READS when the toggle is off')
    assert.ok(t.includes('money, 12'), 'toc page ref READS with its comma-beat')
    assert.ok(t.includes('84'), 'folio number READS when off')
}


{
    const on = applySkippable(pages, true)
    const t = on[0].text
    assert.ok(!t.includes('$'), 'symbol art gone when on')
    assert.ok(!/\b12\b/.test(t), 'toc page ref gone when on')
    assert.ok(!/\b84\b/.test(t), 'folio gone when on')
    assert.ok(t.includes('Real prose'), 'prose survives')
    const b = on[0].blocks
    assert.ok(b[2].skip && b[4].skip, 'skippable blocks marked skip (struck in display)')
    assert.ok(b[3].usedClean && b[3].text === 'The evolution of money', 'toc block swapped to clean text')
    assert.ok(!b[0].skip && !b[1].skip, 'content blocks untouched')
}


{
    const t = joinBlocksForSpeech(blocks)
    const idx = t.indexOf('84')
    assert.ok(idx > 0 && t.slice(idx - 2, idx).includes('\n'), 'pause break before a read page number')
}

console.log('skippable contract: all assertions passed')
