import assert from 'node:assert/strict'
import { clampRate, paragraphJump, spokenFrom, wordAtChar, wordsOf } from './playground.js'

const words = wordsOf(['One two three.', 'Four five.', 'Six.'])
assert.deepEqual(words.map((w) => w.para), [0, 0, 0, 1, 1, 2])

const { text, offsets } = spokenFrom(words, 1)
assert.equal(text, 'two three. Four five. Six.')
assert.deepEqual(offsets, [0, 4, 11, 16, 22])
assert.equal(spokenFrom(words, 6).text, '')

assert.equal(wordAtChar(offsets, 0), 0)
assert.equal(wordAtChar(offsets, 5), 1)
assert.equal(wordAtChar(offsets, 11), 2)
assert.equal(wordAtChar(offsets, 99), 4)

assert.equal(paragraphJump(words, 1, 1), 3)
assert.equal(paragraphJump(words, 4, 1), 5)
assert.equal(paragraphJump(words, 5, 1), 5)
assert.equal(paragraphJump(words, 4, -1), 3)
assert.equal(paragraphJump(words, 3, -1), 0)
assert.equal(paragraphJump(words, 0, -1), 0)
assert.equal(paragraphJump([], 0, 1), 0)

assert.equal(clampRate(2.25), 2)
assert.equal(clampRate(0.25), 0.5)
assert.equal(clampRate(1.25), 1.25)

console.log('playground ok')
