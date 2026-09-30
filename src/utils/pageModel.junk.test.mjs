import assert from 'node:assert'
import { buildPagesFromPdf } from './pageModel.js'

const line = (str, y, fontName = 'body') => ({ str, transform: [12, 0, 0, 12, 72, y], width: str.length * 6, height: 12, fontName })
const glyph = (y) => line('ĀĂĄĆĈ', y, 'cover')

const prose = [
    'Real prose that must always read.',
    'A second line of the same page.',
    'A third line so the page has body.',
    'A fourth line keeps the block honest.',
    'A fifth line for good measure.',
    'A sixth line of ordinary text.',
    'A seventh line that says nothing.',
    'An eighth line closes the page.',
]

const fakePdf = (items) => ({
    numPages: 1,
    getPage: async () => ({ getTextContent: async () => ({ items }), view: [0, 0, 612, 792] }),
})

{
    const items = [glyph(740), glyph(724), glyph(708), ...prose.map((s, i) => line(s, 680 - i * 16))]
    const { pages } = await buildPagesFromPdf(fakePdf(items))
    assert.ok(pages[0].text.includes('Real prose that must always read.'), 'good words survive three junk glyphs on the page')
    assert.ok(pages[0].text.includes('An eighth line closes the page.'), 'the whole page reads, not just part')
    assert.ok(!pages[0].text.includes('ĀĂĄĆĈ'), 'the junk glyphs themselves are dropped')
}

{
    const items = [glyph(740), glyph(724), glyph(708), glyph(692)]
    const { pages } = await buildPagesFromPdf(fakePdf(items))
    assert.strictEqual(pages[0].text, '', 'a page that is nothing but junk stays empty')
}

{
    const items = [glyph(740), glyph(724), ...prose.map((s, i) => line(s, 680 - i * 16))]
    const { pages } = await buildPagesFromPdf(fakePdf(items))
    assert.ok(pages[0].text.includes('Real prose'), 'two junk glyphs never blocked the page, still true')
}

console.log('OK — junk glyphs are dropped, the page around them still reads')
