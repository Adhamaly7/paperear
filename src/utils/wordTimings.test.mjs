import assert from 'node:assert'
import { wordTimings } from './wordTimings.js'

{
    const t = wordTimings(['a', 'bbbb', 'cc'], 10)
    assert.strictEqual(t.length, 3, 'one timing per word')
    assert.strictEqual(t[0].start, 0, 'first word starts at zero')
    assert.strictEqual(t[2].end, 10, 'last word ends at the audio duration')
    assert.ok(t[1].end - t[1].start > t[0].end - t[0].start, 'a longer word gets more time')
    assert.ok(t[1].end - t[1].start > t[2].end - t[2].start, 'four letters outlast two')
    for (let i = 1; i < t.length; i++) assert.strictEqual(t[i].start, t[i - 1].end, 'words tile the duration with no gaps')
    assert.deepStrictEqual(t.map((x) => x.word), ['a', 'bbbb', 'cc'], 'words come back in order')
}

{
    assert.deepStrictEqual(wordTimings([], 5), [], 'no words, no timings')
    assert.deepStrictEqual(wordTimings(['x'], 0), [{ word: 'x', start: 0, end: 0 }], 'zero duration collapses to zero')
}

{
    const t = wordTimings(['كتاب', 'في', 'المكتبة'], 6)
    assert.strictEqual(t[2].end, 6, 'arabic words tile the duration too')
    assert.ok(t[2].end - t[2].start > t[1].end - t[1].start, 'the long arabic word gets more time than the short one')
}

{
    const [through, area] = wordTimings(['through', 'area'], 10)
    assert.ok(area.end - area.start > through.end - through.start, 'three syllables outlast one, even with fewer letters')
}

{
    const [plain] = wordTimings(['book', 'Next'], 10)
    const [comma] = wordTimings(['book,', 'Next'], 10)
    const [stop] = wordTimings(['book.', 'Next'], 10)
    assert.ok(comma.end > plain.end, 'a comma holds the word longer than no punctuation')
    assert.ok(stop.end > comma.end, 'a full stop holds it longer than a comma')
}

{
    const bare = wordTimings(['كتاب', 'المكتبة'], 10)
    const marked = wordTimings(['كِتَاب', 'الْمَكْتَبَة'], 10)
    assert.strictEqual(bare[0].end.toFixed(6), marked[0].end.toFixed(6), 'diacritics do not change a word\'s share of time')
}

console.log('OK — words share the audio by syllables and pauses, tiling it exactly')
