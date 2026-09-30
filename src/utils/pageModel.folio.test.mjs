import assert from 'node:assert'
import { stripInvisibleFolios } from './pageModel.js'

const mk = (str) => ({ str, transform: [12, 0, 0, 12, 100, 700], width: 20, height: 12 })

const p2 = stripInvisibleFolios([mk('II'), mk('To'), mk('the')], 2)
assert.strictEqual(p2.length, 2, 'folio II vanishes on page 2')
assert.ok(!p2.some((it) => it.str === 'II'))

const p3 = stripInvisibleFolios([mk('III'), mk('CHICAGO')], 3)
assert.strictEqual(p3.length, 1, 'folio III vanishes on page 3')

const wrongPage = stripInvisibleFolios([mk('II')], 5)
assert.strictEqual(wrongPage.length, 1, 'II on page 5 is content, not a folio')

const romanContent = stripInvisibleFolios([mk('VOLUME'), mk('I:')], 1)
assert.strictEqual(romanContent.length, 2, 'I: with punctuation is content')

console.log('OK — invisible roman folios die only when they equal their own page number')
