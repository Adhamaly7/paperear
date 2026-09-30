import assert from 'node:assert/strict'
import { mergeShortChunks } from './textToSSML.js'

const line = (text, wordIndex, extra = {}) => ({ text, wordIndex, pause: 280, lang: 'en', ...extra })

{
    const out = mergeShortChunks([line('Space: play or pause.', 0), line('Left and right arrows: one word.', 4, { pause: 800 })], { min: 40, max: 600 })
    assert.equal(out.length, 1)
    assert.equal(out[0].text, 'Space: play or pause. Left and right arrows: one word.')
    assert.equal(out[0].wordIndex, 0)
    assert.equal(out[0].pause, 800)
}

{
    const out = mergeShortChunks([line('Keys', 0), line('Space: play or pause.', 1)], { min: 40, max: 600 })
    assert.equal(out.length, 1)
    assert.equal(out[0].text, 'Keys. Space: play or pause.')
}

{
    const out = mergeShortChunks([line('Hello there.', 0), line('مرحبا بك.', 2, { lang: 'ar' })], { min: 40, max: 600 })
    assert.equal(out.length, 2)
}

{
    const out = mergeShortChunks([line('Hello there.', 0), line('Not contiguous.', 9)], { min: 40, max: 600 })
    assert.equal(out.length, 2)
}

{
    const out = mergeShortChunks([line('Hello there.', 0), { text: '', isSilent: true, pause: 300, lang: 'ar', wordIndex: 2 }, line('Back again.', 4)], { min: 40, max: 600 })
    assert.equal(out.length, 3)
    assert.equal(out[1].isSilent, true)
}

{
    const a = 'word '.repeat(30).trim()
    const out = mergeShortChunks([line(a + '.', 0), line('tail.', 30)], { min: 40, max: 120 })
    assert.equal(out.length, 2)
}

{
    const out = mergeShortChunks([line('One.', 0), line('Two.', 1), line('Three.', 2), line('Four.', 3)], { min: 9, max: 600 })
    assert.deepEqual(out.map((c) => c.text), ['One. Two.', 'Three. Four.'])
    assert.deepEqual(out.map((c) => c.wordIndex), [0, 2])
}

console.log('mergeShortChunks ok')
