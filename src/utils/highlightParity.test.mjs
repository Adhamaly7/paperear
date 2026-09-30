import assert from 'node:assert/strict'
import { buildBlockModel, alignBoxMap } from './blockModel.js'
import { glyphsFromOperatorList, refineBoxesWithGlyphs, letterKey } from './glyphBoxes.js'
import { blockCounts, layerItemsForPage, pageFromItems, mergeDropCaps, mergeGlyphRuns, dropSuperscripts, stripInvisibleFolios } from './pageModel.js'

const item = (str, x, y, w, h, dir) => ({ str, transform: [h, 0, 0, h, x, y], width: w, height: h, dir })
const PAGE = { pageWidth: 600, pageHeight: 800 }
const OPS = { save: 10, restore: 11, transform: 12, beginText: 31, setCharSpacing: 33, setWordSpacing: 34, setHScale: 35, setLeading: 36, setFont: 37, setTextRise: 39, moveText: 40, setLeadingMoveText: 41, setTextMatrix: 42, nextLine: 43, showText: 44, setGState: 9, paintFormXObjectBegin: 74, paintFormXObjectEnd: 75 }
const glyph = (unicode, width) => ({ unicode, width, isSpace: false })
const fontOf = () => ({ fontMatrix: [0.001, 0, 0, 0.001, 0, 0] })

const overlayWords = (items, page) => {
    const model = buildBlockModel(mergeDropCaps(mergeGlyphRuns(dropSuperscripts(stripInvisibleFolios(items, 1)))), PAGE)
    const { readingIndexToBox } = alignBoxMap(model, blockCounts(page))
    return readingIndexToBox.map((g) => model.words[g].text)
}

{
    const raw = [
        item('A heading line', 60, 740, 200, 16),
        item('ǲْǠِǨ ǻƦ', 60, 700, 120, 10),
        item('First paragraph words here.', 60, 680, 300, 10),
        item('ǲǠǨǻ', 60, 660, 120, 10),
        item('Second paragraph continues', 60, 620, 300, 10),
        item('ƤǢǩ', 60, 600, 120, 10),
        item('and ends here.', 60, 586, 200, 10),
    ]
    const items = await layerItemsForPage({ getTextContent: async () => ({ items: raw }), view: [0, 0, 600, 800] })
    assert.equal(items.length, 4, 'pages with three or more broken-font items keep only the readable ones')
    const page = pageFromItems(1, items, 600, 800)
    const spoken = page.text.trim().split(/\s+/).filter(Boolean)
    assert.deepEqual(overlayWords(items, page), spoken, 'the highlight lights exactly the words the voice reads')
}

{
    const toc = buildBlockModel([
        item('Contents', 60, 760, 80, 14),
        item('Chapter one ........ 3', 60, 700, 300, 10),
        item('Chapter two ........ 9', 60, 686, 300, 10),
        item('Chapter three ........ 15', 60, 672, 300, 10),
        item('Chapter four ........ 21', 60, 658, 300, 10),
        item('Chapter five ........ 27', 60, 644, 300, 10),
    ], PAGE)
    const page = {
        blocks: toc.order.map((i) => toc.blocks[i]).filter((b) => b.text.trim())
            .map((b) => (b.readText !== b.text ? { type: 'item', text: b.readText, usedClean: true } : { type: 'para', text: b.text })),
    }
    const pipe = blockCounts(page)
    assert.ok(pipe.some((b) => b.usedClean), 'the clean-text flag survives into the loaded page blocks')
    const { readingIndexToBox } = alignBoxMap(toc, pipe)
    const spoken = page.blocks.flatMap((b) => b.text.trim().split(/\s+/).filter(Boolean))
    assert.deepEqual(readingIndexToBox.map((g) => toc.words[g].text), spoken, 'a contents page read without page numbers stays on the spoken words')
}

assert.deepEqual(blockCounts({ blocks: [{ type: 'para', text: 'a b', skip: true }] }), [{ type: 'chrome', count: 0, skip: true, text: 'a b' }], 'skipped blocks keep their shape')

{
    const opList = {
        fnArray: [OPS.beginText, OPS.setFont, OPS.setTextMatrix, OPS.showText],
        argsArray: [[], ['f1', 10], [[1, 0, 0, 1, 100, 500]], [[glyph('a', 500), -250, glyph('b', 600)]]],
    }
    const g = glyphsFromOperatorList(opList, fontOf, OPS)
    assert.equal(g.length, 2, 'one glyph per drawn character')
    assert.deepEqual([g[0].x0, g[0].x1], [100, 105], 'advance is width times size over 1000')
    assert.ok(Math.abs(g[1].x0 - 107.5) < 1e-9, 'a TJ number moves the pen back by n/1000 of the size')
    assert.equal(g[1].y, 500, 'glyphs sit on the text matrix baseline')
}

{
    const opList = {
        fnArray: [OPS.save, OPS.transform, OPS.beginText, OPS.setFont, OPS.moveText, OPS.showText, OPS.restore],
        argsArray: [[], [2, 0, 0, 2, 10, 20], [], ['f1', 10], [5, 5], [[glyph('x', 1000)]], []],
    }
    const [g] = glyphsFromOperatorList(opList, fontOf, OPS)
    assert.deepEqual([g.x0, g.x1, g.y], [20, 40, 30], 'the current transform scales and moves glyphs')
}

assert.equal(letterKey('ﺑﺎﻟﺘﺠﺎرة'), letterKey('ةراجتلاب'), 'letter keys ignore order and presentation forms')

{
    const it = { str: 'ﻣﻦ اﻟﺪار', transform: [10, 0, 0, 10, 100, 500], width: 60, height: 10, dir: 'rtl' }
    const glyphs = [
        { x0: 100, x1: 106, y: 500, u: 'ر', space: false },
        { x0: 106, x1: 110, y: 500, u: 'ا', space: false },
        { x0: 110, x1: 116, y: 500, u: 'ﺪ', space: false },
        { x0: 116, x1: 120, y: 500, u: 'ﻟ', space: false },
        { x0: 120, x1: 123, y: 500, u: 'ا', space: false },
        { x0: 123, x1: 145, y: 500, u: ' ', space: true },
        { x0: 145, x1: 152, y: 500, u: 'ﻦ', space: false },
        { x0: 152, x1: 160, y: 500, u: 'ﻣ', space: false },
    ]
    const m = buildBlockModel([it], { ...PAGE, glyphs })
    const first = m.words.find((w) => w.text === 'ﻣﻦ')
    const second = m.words.find((w) => w.text === 'اﻟﺪار')
    assert.deepEqual([first.x, first.w], [145, 15], 'the first Arabic word sits on its own glyphs at the right')
    assert.deepEqual([second.x, second.w], [100, 23], 'the second Arabic word sits on its glyphs at the left')
}

{
    const it = { str: 'alpha beta', transform: [10, 0, 0, 10, 0, 0], width: 50, height: 10, dir: 'ltr' }
    const m = buildBlockModel([it], PAGE)
    const before = m.words.map((w) => [w.x, w.w])
    refineBoxesWithGlyphs(m.words, [{ x0: 0, x1: 50, y: 300, u: 'z', space: false }])
    assert.deepEqual(m.words.map((w) => [w.x, w.w]), before, 'glyphs that do not match the words leave the estimate alone')
}

console.log('highlightParity ok')
