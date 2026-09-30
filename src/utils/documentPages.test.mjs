import assert from 'node:assert'
import { buildPageList, pageAtScroll } from './documentPages.js'

{
    const loaded = [
        { pageNum: 4, words: [{ index: 0 }, { index: 1 }, { index: 2 }] },
        { pageNum: 5, words: [] },
        { pageNum: 6, words: [{ index: 3 }, { index: 4 }] },
    ]
    const list = buildPageList(8, loaded)
    assert.strictEqual(list.length, 8, 'every page of the book gets a slot')
    assert.deepStrictEqual(list.map((p) => p.pageNum), [1, 2, 3, 4, 5, 6, 7, 8], 'slots run from the first page to the last')
    assert.deepStrictEqual(list[3], { pageNum: 4, start: 0, end: 2, loaded: true }, 'a loaded page carries its word range')
    assert.deepStrictEqual(list[4], { pageNum: 5, start: -1, end: -1, loaded: true }, 'a loaded page with no words is still loaded')
    assert.deepStrictEqual(list[0], { pageNum: 1, start: -1, end: -1, loaded: false }, 'a page outside the range is not loaded')
    assert.deepStrictEqual(list[7], { pageNum: 8, start: -1, end: -1, loaded: false }, 'the last page too')
}

{
    const noTotal = buildPageList(0, [{ pageNum: 2, words: [{ index: 0 }] }])
    assert.deepStrictEqual(noTotal.map((p) => p.pageNum), [2], 'without a page count, only the loaded pages are listed')
    assert.deepStrictEqual(buildPageList(0, null), [], 'nothing loaded and no count is an empty list')
}

{
    const offsets = [0, 100, 200, 300]
    const rowHeights = [100, 100, 100, 100]
    assert.strictEqual(pageAtScroll(offsets, rowHeights, 1, 0, 80), 1, 'at the top the first page is showing')
    assert.strictEqual(pageAtScroll(offsets, rowHeights, 1, 160, 80), 2, 'the row under the middle of the viewport wins')
    assert.strictEqual(pageAtScroll(offsets, rowHeights, 1, 390, 80), 4, 'past the end clamps to the last page')
    assert.strictEqual(pageAtScroll(offsets, rowHeights, 2, 160, 80), 3, 'two pages per row: the row start page is reported')
    assert.strictEqual(pageAtScroll([], [], 1, 0, 80), 1, 'no rows falls back to page one')
}

console.log('OK — the document view lists every page and knows which one is under the reader')
