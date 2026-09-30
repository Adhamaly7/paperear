import assert from 'node:assert'
import { walkWordFragments, countSpokenWords } from './richWords.js'

const text = (s) => ({ nodeType: 3, textContent: s })
const el = (tagName, ...childNodes) => ({ nodeType: 1, tagName, childNodes })

function wordsOf(root) {
    const found = []
    walkWordFragments(root, (_node, pieces) => {
        for (const p of pieces) if (p.word !== undefined) found.push(p)
    })
    const byIndex = new Map()
    for (const p of found) byIndex.set(p.index, (byIndex.get(p.index) || '') + p.word)
    return [...byIndex.entries()].sort((a, b) => a[0] - b[0]).map(([, w]) => w)
}

{
    const root = el('DIV', el('STRONG', text('photo')), text('realistic sheet'))
    assert.deepStrictEqual(wordsOf(root), ['photorealistic', 'sheet'], 'a word split by a tag stays one word')
    assert.strictEqual(wordsOf(root).length, countSpokenWords('photorealistic sheet'), 'count matches the reader')
}

{
    const root = el('DIV', el('STRONG', text('realism')), text('. This keeps'))
    assert.deepStrictEqual(wordsOf(root), ['realism.', 'This', 'keeps'], 'punctuation after a tag joins its word')
    assert.strictEqual(wordsOf(root).length, countSpokenWords('realism. This keeps'), 'count matches the reader')
}

{
    const root = el('DIV', el('P', text('first')), el('P', text('second')))
    assert.deepStrictEqual(wordsOf(root), ['first', 'second'], 'block boundaries separate words with no whitespace node')
}

{
    const root = el('UL', el('LI', text('one')), el('LI', el('STRONG', text('two'))))
    assert.deepStrictEqual(wordsOf(root), ['one', 'two'], 'list items never fuse')
}

{
    const root = el('DIV', text('a  '), text('  b'))
    assert.deepStrictEqual(wordsOf(root), ['a', 'b'], 'whitespace-only runs break the word')
}

{
    const root = el('DIV', el('SCRIPT', text('alert(1)')), text('safe'))
    assert.deepStrictEqual(wordsOf(root), ['safe'], 'script contents are never words')
}

{
    const root = el('DIV',
        el('H2', el('STRONG', text('1️⃣ Photorealistic Character Identity Sheet'))),
        el('P', text('Create a '), el('STRONG', text('photorealistic multi-angle')), text(' identity sheet.')),
    )
    const expected = countSpokenWords('1️⃣ Photorealistic Character Identity Sheet Create a photorealistic multi-angle identity sheet.')
    assert.strictEqual(wordsOf(root).length, expected, 'a real pasted heading and paragraph stay index-aligned')
}

console.log('OK — rich word spans and spoken words stay one-to-one across tags, blocks and lists')
