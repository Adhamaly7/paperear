
import assert from 'node:assert'
import { idsToEvict, MAX_DOCS } from './docStore.js'

const recs = [
    { id: 'a', savedAt: 1 }, { id: 'b', savedAt: 5 }, { id: 'c', savedAt: 3 },
    { id: 'd', savedAt: 4 }, { id: 'e', savedAt: 2 }, { id: 'f', savedAt: 6 },
]

assert.deepEqual(idsToEvict(recs, 3).sort(), ['a', 'c', 'e'], 'evicts the oldest beyond the limit')
assert.deepEqual(idsToEvict(recs, 10), [], 'nothing evicted under the limit')
assert.deepEqual(idsToEvict([], 5), [], 'empty list → nothing')
assert.deepEqual(idsToEvict(undefined, 5), [], 'missing list → nothing')
assert.equal(typeof MAX_DOCS, 'number', 'MAX_DOCS is configured')

console.log('OK — idsToEvict keeps the newest N (MAX_DOCS =', MAX_DOCS + ')')
